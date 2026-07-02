import { QueryBuilder, executeQuery, withTransaction } from "../../helpers/db-helper";
import { RepositoryBase } from "../../helpers/repository-base";
import mysql from "mysql2/promise";

export class ProcessRepository extends RepositoryBase {
  constructor() {
    super();
  }

  private addIdentifierCondition(
    queryBuilders: QueryBuilder[],
    updateContent: any,
    fieldName: string,
    identifierValue?: string
  ) {
    if (identifierValue) {
      queryBuilders.forEach((qb) => qb.orWhere(`${fieldName} = ?`, identifierValue));
      updateContent[fieldName] = identifierValue;
    }
  }

  private async updateProcessWithTransaction({
    processName,
    processValue,
    associatedId,
    userId,
    transactionConnection,
  }: {
    processName: string;
    processValue: number;
    associatedId: string;
    userId: string;
    transactionConnection: mysql.Connection;
  }) {
    try {
      let updateContent: any = {};

      const queryStatus = new QueryBuilder("process_status").setConnection(transactionConnection);
      const queryLog = new QueryBuilder("process_log").setConnection(transactionConnection);
      const queryWorker = new QueryBuilder("process_worker").setConnection(transactionConnection);

      // Use helper function to add conditions.
      const queryBuilders = [queryStatus, queryLog, queryWorker];
      this.addIdentifierCondition(queryBuilders, updateContent, "associated_id", associatedId);

      const statusUpdate = await queryStatus.update({
        [processName]: processValue,
        ...updateContent,
      });

      const logUpdate = await queryLog.update({
        [processName]: new Date(),
        ...updateContent,
      });

      const workerUpdate = await queryWorker.update({
        [processName]: userId,
        ...updateContent,
      });

      if (statusUpdate > 0 && logUpdate > 0 && workerUpdate > 0) {
        return this.success("Process Updated");
      } else {
        let reason = "";
        if (statusUpdate <= 0) {
          reason += "Status update not processed! ";
        }
        if (logUpdate <= 0) {
          reason += "Log update not processed! ";
        }
        if (workerUpdate <= 0) {
          reason += "Worker update not processed! ";
        }
        throw new Error(`${processName} update failed! ${reason}`);
      }
    } catch (error) {
      throw error;
    }
  }

  private async initializeProcessWithTransaction(
    orderId: string,
    userId: string,
    transactionConnection: mysql.Connection
  ) {
    try {
      await new QueryBuilder("process_status")
        .setConnection(transactionConnection)
        .insert({
          associated_id: orderId,
          process_name: 1,
        });

      await new QueryBuilder("process_log")
        .setConnection(transactionConnection)
        .insert({
          associated_id: orderId,
          process_name: new Date(),
        });

      await new QueryBuilder("process_worker")
        .setConnection(transactionConnection)
        .insert({
          associated_id: orderId,
          process_name: userId,
        });

      return this.success("Process Initialized!");
    } catch (error) {
      return this.handleError(error);
    }
  }

  async initializeProcess({
    orderId,
    userId,
    transactionConnection,
  }: {
    orderId: string;
    userId: string;
    transactionConnection?: mysql.Connection;
  }) {
    try {
      if (transactionConnection) {
        return this.initializeProcessWithTransaction(orderId, userId, transactionConnection);
      } else {
        return withTransaction(async (connection) => {
          return this.initializeProcessWithTransaction(orderId, userId, connection);
        });
      }
    } catch (error) {
      return this.handleError(error);
    }
  }

  async updateProcess({
    processName,
    processValue,
    orderId,
    userId,
    transactionConnection,
  }: {
    processName: string;
    processValue: number;
    orderId: string;
    userId: string;
    transactionConnection?: mysql.Connection;
  }) {
    try {
      if (transactionConnection) {
        return this.updateProcessWithTransaction({
          processName,
          processValue,
          associatedId: orderId,
          userId,
          transactionConnection,
        });
      } else {
        return withTransaction(async (connection) => {
          return this.updateProcessWithTransaction({
            processName,
            processValue,
            associatedId: orderId,
            userId,
            transactionConnection: connection,
          });
        });
      }
    } catch (error) {
      return this.handleError(error);
    }
  }

  private async getDynamicColumns() {
    try {
      // Get columns for all three tables
      const [statusColumns, logColumns, workerColumns] = await Promise.all([
        this.getTableColumns('process_status', ['associated_id', 'id']),
        this.getTableColumns('process_log', ['associated_id', 'id']),
        this.getTableColumns('process_worker', ['associated_id', 'id'])
      ]);

      // Build dynamic select clauses
      const statusSelect = statusColumns.map(c => `s.${c} AS status_${c}`).join(',\n  ');
      const logSelect = logColumns.map(c => `l.${c} AS log_${c}`).join(',\n  ');
      const workerSelect = workerColumns.map(c => `w.${c} AS worker_${c}`).join(',\n  ');

      return { statusSelect, logSelect, workerSelect, workerColumns };
    } catch (error: any) {
      throw new Error(`Failed to get dynamic columns: ${error.message}`);
    }
  }

  async getTableColumns(tableName: string, exclude: string[] = []) {
    const sql = `
      SELECT COLUMN_NAME
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE()
        AND TABLE_NAME = ?
        ${exclude.length ? `AND COLUMN_NAME NOT IN (${exclude.map(() => '?').join(',')})` : ''}
      ORDER BY ORDINAL_POSITION
    `;    

    const result = await executeQuery<{ COLUMN_NAME: string }[]>(
      sql,
      [tableName, ...exclude]
    );

    return result.map(row => row.COLUMN_NAME);
  }

  async getProcessLog({
    orderId,
    workerNames = false
  }: {
    orderId: string,
    workerNames?: boolean
  }) {
    try {
      const { statusSelect, logSelect, workerSelect, workerColumns } = await this.getDynamicColumns();

      let workers = workerSelect;
      let userJoins = '';
      let userSelects = '';

      if (workerNames) {
        workerColumns.forEach((column, index) => {
          const alias = `u${index}`;
          userJoins += `
          LEFT JOIN users ${alias} ON w.${column} = ${alias}.id AND w.${column} != 0`;

          const columnName = column.replace('_process', '');
          userSelects += `,
          CASE 
            WHEN w.${column} = 0 THEN 'Pending'
            WHEN ${alias}.name IS NOT NULL THEN ${alias}.name
            ELSE w.${column}
          END AS worker_${columnName}_name`;
        });
      }

      const sql = `
      SELECT
        ${statusSelect},
        ${logSelect},
        ${workerNames ? workerSelect + userSelects : workerSelect}
      FROM process_status s
      LEFT JOIN process_log l 
        ON s.associated_id = l.associated_id 
      LEFT JOIN process_worker w 
        ON s.associated_id = w.associated_id${workerNames ? userJoins : ''}
      WHERE s.associated_id = ?
      LIMIT 1
    `;

      const result = await executeQuery<any[]>(sql, [orderId]);

      if (result.length > 0) {
        return this.success(result[0]);
      }

      return this.failure('No records found');
    } catch (error) {
      return this.handleError(error);
    }
  }

  async getProcessLogByCols({
    cols,
    orderId,
  }: {
    cols: string[],
    orderId?: string,
  }) {
    try {
      var all = '';
      cols.forEach(element => {
        var n = element.replaceAll('_process', '')

        all += `s.${element} AS status_${n},`
        all += `l.${element} AS log_${n},`
        all += `w.${element} AS worker_${n},`
      });

      all = all.substring(0, all.length - 1)

      var sql = `
          SELECT
          s.id AS status_id,
          s.associated_id,

          ${all}

          FROM process_status s
            LEFT JOIN process_log l 
              ON s.associated_id = l.associated_id 
            LEFT JOIN process_worker w 
              ON s.associated_id = w.associated_id 
          WHERE s.associated_id = ?
      `;
      const result = await executeQuery<any[]>(sql, [orderId])

      if (result.length > 0) {
        return this.success(result[0])
      }

      return this.failure('Request Failed!')
    } catch (error) {
      return this.handleError(error)
    }
  }
}
import mysql from 'mysql2/promise';
import db from '../db';

export class DatabaseError extends Error {
  constructor(message: string, public readonly code?: string) {
    super(message);
    this.name = 'DatabaseError';
  }
}


export async function executeQuery<T>(
  query: string,
  params?: any[],
  transaction?: mysql.Connection
): Promise<T> {
  const connection = transaction || db;
  // console.log(query, params);
  
  try {
    const [rows] = await connection.execute(query, params);
    return rows as T;
  } catch (error: any) {
    throw new DatabaseError(
      `Query execution failed: ${error.message}`,
      error.code
    );
  }
}

// Transaction wrapper
export async function withTransaction<T>(
  operation: (connection: mysql.Connection) => Promise<T>
): Promise<T> {
  const connection = await db.getConnection();
  
  try {
    await connection.beginTransaction();
    const result = await operation(connection);
    await connection.commit();
    return result;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}


export class QueryBuilder {
  private table: string;
  private conditions: string[] = [];
  private parameters: any[] = [];
  private orConditions: string[] = [];
  private orParameters: any[] = [];
  private limitValue?: number;
  private offsetValue?: number;
  private orderByFields: string[] = [];
  private connection?: mysql.Connection;
  
  constructor(table: string) {
    this.table = table;
  }

  setConnection(connection?: mysql.Connection) {
    this.connection = connection;
    return this;
  }
  
  where(condition: string, ...params: any[]) {
    this.conditions.push(condition);
    this.parameters.push(...params);
    return this;
  }
  
  orWhere(condition: string, ...params: any[]) {
    this.orConditions.push(condition);
    this.orParameters.push(...params);
    return this;
  }
  
  limit(value: number) {
    this.limitValue = value;
    return this;
  }
  
  offset(value: number) {
    this.offsetValue = value;
    return this;
  }
  
  orderBy(field: string, direction: 'ASC' | 'DESC' = 'ASC') {
    this.orderByFields.push(`${field} ${direction}`);
    return this;
  }
  
  private buildWhereClause(): { clause: string, parameters: any[] } {
    const clauses: string[] = [];
    const params: any[] = [];
    
    if (this.conditions.length > 0) {
      clauses.push(this.conditions.join(' AND '));
      params.push(...this.parameters);
    }
    
    if (this.orConditions.length > 0) {
      clauses.push(`(${this.orConditions.join(' OR ')})`);
      params.push(...this.orParameters);
    }
    
    const clause = clauses.length > 0 ? ` WHERE ${clauses.join(' AND ')}` : '';
    return { clause, parameters: params };
  }
  
  async selectOne<T>(fields: string[] = ['*']): Promise<T | null> {
    let query = `SELECT ${fields.join(', ')} FROM ${this.table}`;

    const { clause, parameters } = this.buildWhereClause();
    query += clause;

    if (this.orderByFields.length) {
      query += ` ORDER BY ${this.orderByFields.join(', ')}`;
    }

    if (this.limitValue !== undefined) {
      query += ` LIMIT ${this.limitValue}`;
    }

    if (this.offsetValue !== undefined) {
      query += ` OFFSET ${this.offsetValue}`;
    }

    const result = await executeQuery<T[]>(query, parameters, this.connection);

    if (result.length === 0) {
      return null;
    }

    return result[0];
  }
  
  async select<T>(fields: string[] = ['*']): Promise<T[]> {
    let query = `SELECT ${fields.join(', ')} FROM ${this.table}`;
    
    const { clause, parameters } = this.buildWhereClause();
    query += clause;
    
    if (this.orderByFields.length) {
      query += ` ORDER BY ${this.orderByFields.join(', ')}`;
    }
    
    if (this.limitValue !== undefined) {
      query += ` LIMIT ${this.limitValue}`;
    }
    
    if (this.offsetValue !== undefined) {
      query += ` OFFSET ${this.offsetValue}`;
    }
        
    return executeQuery<T[]>(query, parameters, this.connection);
  }
  
  async insert<T>(data: Record<string, any>): Promise<number> {
    const fields = Object.keys(data);
    const values = Object.values(data);
    const placeholders = new Array(fields.length).fill('?').join(', ');
    
    const query = `
      INSERT INTO ${this.table} 
      (${fields.join(', ')}) 
      VALUES (${placeholders})
    `;
    
    const result = await executeQuery<mysql.ResultSetHeader>(query, values, this.connection);
    return result.insertId;
  }
  
  async insertAndReturn<T>(data: Record<string, any>): Promise<any> {
    const insertId = await this.insert(data);
    
    if (insertId === 0) {
        return null;
    }
        
    const selectQuery = `SELECT * FROM ${this.table} WHERE id = ? LIMIT 1`; 
    const selectResult = await executeQuery<any[]>(selectQuery, [insertId], this.connection);
    
    return selectResult[0];
  }
  
  async update(data: Record<string, any>): Promise<number> {
    const fields = Object.keys(data);
    const values = Object.values(data);
    
    const { clause, parameters } = this.buildWhereClause();
    
    const query = `
      UPDATE ${this.table}
      SET ${fields.map(field => `${field} = ?`).join(', ')}
      ${clause}
    `;
    
    const result = await executeQuery<any>(query, [...values, ...parameters], this.connection);
    return result.affectedRows;
  }
  
  async updateAndReturn(data: Record<string, any>): Promise<any[]> {
    const affectedRows = await this.update(data);
    
    if (affectedRows === 0) {
        return [];
    }
    
    const { clause, parameters } = this.buildWhereClause();
    
    const selectQuery = `SELECT * FROM ${this.table} ${clause}`;
    const selectResult = await executeQuery<any[]>(selectQuery, parameters, this.connection);
    
    return selectResult;
}
  
  async delete(): Promise<number> {    
    const { clause, parameters } = this.buildWhereClause();
    
    const query = `
      DELETE FROM ${this.table}
      ${clause}
    `;
    
    const result = await executeQuery<any>(query, [...parameters], this.connection);
    return result.affectedRows;
  }

  async count(column: string = '*'): Promise<number> {
    if (column !== '*') {
      column = `\`${column}\``;
    }

    let query = `SELECT COUNT(${column}) AS count FROM ${this.table}`;
    const { clause, parameters } = this.buildWhereClause();
    query += clause;
    
    const result = await executeQuery<{ count: number }[]>(query, parameters, this.connection);
    
    return result[0]?.count || 0;
  }
}

import { executeQuery, QueryBuilder } from "../../helpers/db-helper";
import { RepositoryBase } from "../../helpers/repository-base";


export class BranchRepository extends RepositoryBase {
  private queryBuilder: QueryBuilder;
  private userBranchBuilder: QueryBuilder;
  private companyId: string;

  constructor(companyId: string) {
    super();
    this.queryBuilder = new QueryBuilder('branches');
    this.userBranchBuilder = new QueryBuilder('user_branches');
    this.companyId = companyId;
  }

  private async generateUniqueBranchId() {
    const query = await executeQuery<any[]>(`
      SELECT abbr
      FROM company_master
      WHERE company_id = ?
        AND is_active = '1'
      LIMIT 1
    `, [this.companyId]);

    const abbr = `${query[0].abbr}-` || '';

    return abbr + Math.random().toString(36).substring(2, 15);
  }

  async createBranch(
    name: string,
    branch_code: string,
    pincode: string,
    location: string,
    userId: string
  ) {
    try {
      const uniqueId = await this.generateUniqueBranchId();

      if (!uniqueId) {
        return this.failure('Failed to generate unique branch id');
      }

      const insert = await this.queryBuilder.insert({
        branch_code: branch_code,
        location: location,
        pincode: pincode,
        name: name,
        unique_id: uniqueId,
        status: 1,
        expire_date: null,
        company_id: this.companyId,
        updated_by: userId,
        updated_on: new Date(),
      })

      if (insert) {
        return this.success(insert);
      } else {
        return this.failure('Failed to create branch');
      }
    } catch (error) {
      return this.handleError(error);
    }
  }

  async addUserBranch(
    userId: string,
    branchId: string
  ) {
    try {
      const result = await this.userBranchBuilder.insert({ user_id: userId, branch_id: branchId })
      let newCount = await new QueryBuilder('user_branches').where('branch_id = ?', branchId).count()


      const res = await this.queryBuilder
        .where('id = ?', branchId)
        .update({
          user_count: newCount
        })

      if (result > 0) {
        return this.success(result)
      }

      return this.failure('Branch Assign Failed!')

    } catch (error) {
      return this.handleError(error)
    }
  }

  async removeUserBranch(
    userId: string,
    branchId: string
  ) {
    try {
      const result = await new QueryBuilder('user_branches')
        .where('user_id = ?', userId)
        .where('branch_id = ?', branchId)
        .delete()

      if (result > 0) {

        await executeQuery(`
          UPDATE branches
          SET user_count = (SELECT COUNT(*) FROM user_branches WHERE branch_id = ?)
          WHERE id = ?
        `, [branchId, branchId])
      
        return this.success('Branch Delete Successful!')
      }

      return this.failure('Branch Delete Failed!')
    } catch (error) {
      return this.handleError(error)
    }
  }

  async getBranches() {
    try {
      const result = await this.queryBuilder
        .where('company_id = ?', this.companyId)
        .select(['id', 'name', 'branch_code', 'location', 'pincode', 'status', 'created_on']);

      if (result.length > 0) {
        return this.success(result);
      } else {
        return this.failure('No branches found');
      }
    } catch (error) {
      return this.handleError(error);
    }
  }

  async getBranchListByUserId(userId: string) {
    try {
      var sql = `
        SELECT b.id, b.name, b.branch_code
        FROM user_branches ub
        LEFT JOIN branches b
          ON b.id = ub.branch_id
        WHERE ub.user_id = ?
      `
      const result = await executeQuery(sql, [userId]) as any[];

      if (result.length > 0) {
        return this.success(result);
      } else {
        return this.failure('No branches found');
      }
    } catch (error) {
      return this.handleError(error);
    }
  }

  async getBranchStringByUserId(userId: string) {
    try {
      var sql = `
        SELECT b.id
        FROM user_branches ub
        LEFT JOIN branches b
          ON b.id = ub.branch_id
        WHERE ub.user_id = ?
      `
      const result = await executeQuery(sql, [userId]) as any[];

      if (result.length > 0) {
        const branchIds = result.map((branch) => branch.id).join(',');
        return this.success(branchIds);
      } else {
        return this.failure('No Branch mapped to user!');
      }
    } catch (error) {
      return this.handleError(error);
    }
  }

  async disableBranch(id: number, userId: string, status: number) {
    try {
      const result = await this.queryBuilder
        .where('id = ?', id)
        .update({ status: status, updated_by: userId, updated_on: new Date() });

      if (result) {
        return this.success(result);
      } else {
        return this.failure('Failed to disable branch');
      }
    } catch (error) {
      return this.handleError(error);
    }
  }

  async getBranchById(id: number) {
    try {
      const result = await this.queryBuilder
        .where('id = ?', id)
        .select(['*']);

      if (result.length > 0) {
        return this.success(result[0]);
      } else {
        return this.failure('Branch not found');
      }
    } catch (error) {
      return this.handleError(error);
    }
  }

  async editBranch(id: number, name: string, branch_code: string, pincode: string, location: string, userId: string) {
    try {
      const result = await this.queryBuilder
        .where('id = ?', id)
        .update({ name: name, branch_code: branch_code, pincode: pincode, location: location, updated_by: userId, updated_on: new Date() });

      if (result) {
        return this.success(result);
      } else {
        return this.failure('Failed to edit branch');
      }
    } catch (error) {
      return this.handleError(error);
    }
  }
}

import { QueryBuilder } from "../../helpers/db-helper";
import { buildTree, PermissionItem } from "../../helpers/permission-helper";
import { RepositoryBase } from "../../helpers/repository-base"

export interface Role {
  id: string;
  role_name: string;
  user_count: number;
  permissions: string;
  department: string;
}

export class AccessRepository extends RepositoryBase {
  private companyId: string;

  constructor(companyId: string) {
    super()
    this.companyId = companyId;
  }


  async getRoles(
    role: string
  ) {
    try {
      const query = new QueryBuilder('roles')
        .orderBy('id', 'ASC')
        .orWhere('company_id IS NULL')
        .orWhere('? in (company_id)', this.companyId)
        .where('status = ?', 1);

      if (role != '1') {
        query.where('id != 1')
      }

      const result = await query
        .select(['id', 'role_name', 'user_count', 'permissions', 'department'])

      return this.success(result);
    } catch (error) {
      return this.handleError(error);
    }
  }

  async getAllPermissions() {
    try {
      const result = await new QueryBuilder('modules')
        .orWhere('company_id IS NULL')
        .orWhere('? in (company_id)', this.companyId)
        .where('status = ?', 1)
        .select(['id', 'parent_id', 'url', 'title', 'menu_order'])

      const permissions = buildTree(result as PermissionItem[]);

      return this.success(permissions);
    } catch (error) {
      return this.handleError(error);
    }
  }

  async updateRolePermissions(roleId: string, permissions: number[]) {
    try {
      await new QueryBuilder('roles')
        .where('id = ?', roleId)
        .update({ permissions: permissions.join(',') });
      return this.success(true);
    } catch (error) {
      return this.handleError(error);
    }
  }

  async createRole(
    name: string,
    department: string,
    userId: string
  ) {
    try {
      const insert = await new QueryBuilder('roles')
        .insert({
          role_name: name,
          company_id: this.companyId,
          department: department,
          status: 1,
          created_by: userId
        });

      if (insert) {
        return this.success(insert);
      } else {
        return this.failure('Failed to create role');
      }
    } catch (error) {
      return this.handleError(error);
    }
  }
}


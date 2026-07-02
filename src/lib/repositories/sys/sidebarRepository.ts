import { QueryBuilder, executeQuery } from "../../helpers/db-helper";
import { RepositoryBase } from "../../helpers/repository-base";
import { buildTree, PermissionItem } from "../../helpers/permission-helper";
import { UserRepository } from "./userRepository";

export class SidebarRepository extends RepositoryBase {
  private builder: QueryBuilder;
  private userId: string;
  private companyId: string;

  constructor(userId: string, companyId: string) {
    super()
    this.builder = new QueryBuilder('modules');
    this.userId = userId;
    this.companyId = companyId;
  }

  async getSidebarData() {
    try {      
      const userRepo = new UserRepository(this.companyId);
      const user = await userRepo.getUserById(this.userId)

      if (!user.success) {
        return this.failure(user.message)
      }

      const permissions = await executeQuery<PermissionItem[]>(`
        SELECT 
          im.id, 
          im.parent_id, 
          im.url, 
          im.title, 
          im.menu_order
        FROM modules im
        JOIN roles ir ON FIND_IN_SET(im.id, ir.permissions) > 0
        WHERE ir.id = ?
          AND im.status = 1
        ORDER BY 
          CASE WHEN im.parent_id = 0 THEN 0 ELSE 1 END,
          im.parent_id ASC,
          im.menu_order ASC
      `, [user.result.role]);

      const nestedMenu = buildTree(permissions);
      
      const userData = {
        name: user.result.name,
        email: user.result.email,
        avatar: user.result.avatar,
      }

      return this.success({ menu: nestedMenu, user: userData });
    } catch (error) {
      return this.handleError(error)
    }
  }
}
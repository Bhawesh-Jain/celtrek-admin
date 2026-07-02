import { RepositoryBase } from "../helpers/repository-base";

export class MiscRepository extends RepositoryBase {
  constructor() {
    super();
  }

  async emptyFunc() {
    try {
      return this.success();
    } catch (error) {
      return this.handleError(error);
    }
  }
}
import { customLog } from "../utils";
import { DatabaseError } from "./db-helper";

export type RepositoryResponse<T> = {
  success: boolean;
  message: string;
  result: T;
}

export class RepositoryBase {
  
  private getClassName() {
    return this.constructor.name;
  }

  handleError(error: any): RepositoryResponse<any> {
    customLog(this.getClassName(), error);

    if (error instanceof DatabaseError) {
      throw error;
    }

    return {
      success: false,
      message: 'Internal Server Error!',
      result: {},
    }
  }

  failure(reason: string): RepositoryResponse<any> {
    customLog(this.getClassName(), reason);    
    return {
      success: false,
      message: reason,
      result: {},
    }
  }

  success(data?: any, message: string = 'Request Successful!'): RepositoryResponse<any> {
    // customLog(this.getClassName(), data, message);    
    return {
      success: true,
      message: message,
      result: data,
    }
  }
}
import { RepositoryBase } from "../helpers/repository-base";

export interface Order {
  order_id: number;
  order_code: string;
  
  total_items: number;
  total_amount: number;

  customer_name: string;
  customer_phone: string;
  customer_email: string;

  city: string;
  pincode: string;

  payment_status: number;
  delivery_status: number;

  status: number;
  created_on: string;
  updated_on: string;
}

export class OrderRepository extends RepositoryBase {
  private userId: string;
  private companyId: string;

  constructor(companyId: string, userId: string) {
    super();
    this.companyId = companyId;
    this.userId = userId;
  }

  async getOrderList() {
    try {

      return this.success();
    } catch (error) {
      return this.handleError(error);
    }
  }
}
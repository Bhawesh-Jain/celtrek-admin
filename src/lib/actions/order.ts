'use server'

import { OrderRepository } from "../repositories/orderRepository";
import { getSession } from "../session";

export async function getOrderList() {
  const session = await getSession();

  const repo = new OrderRepository(session.company_id, session.user_id);
  return await repo.getOrderList();
}

'use server'

import { UserRepository } from "../repositories/sys/userRepository";
import { getSession } from "../session";

export async function getUserList() {
  const session = await getSession();

  const repo = new UserRepository(session.company_id);
  return await repo.getUserList();
}
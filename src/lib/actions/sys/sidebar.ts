"use server"
import { SidebarRepository } from "../../repositories/sys/sidebarRepository";
import { getSession } from "../../session";

export async function getSidebarData() {
  const session = await getSession();
  const sidebarRepo = new SidebarRepository(session.user_id, session.company_id);
  return await sidebarRepo.getSidebarData();
}
// lib/actions/lead.ts
'use server'

import { LeadRepository } from "../repositories/leadRepository";
import { getSession } from "../session";

export async function getLeadList({
  status,
  product_id,
  assigned_to,
  search,
  page,
  limit,
}: {
  status?: string;
  product_id?: string;
  assigned_to?: string;
  search?: string;
  page?: number;
  limit?: number;
}) {
  const session = await getSession();

  const repo = new LeadRepository(session.company_id);
  return await repo.getLeadList({ status, product_id, assigned_to, search, page, limit });
}

export async function getLeadById(leadId: string) {
  const session = await getSession();

  const repo = new LeadRepository(session.company_id);
  return await repo.getLeadById(leadId);
}

export async function getLeadStats() {
  const session = await getSession();

  const repo = new LeadRepository(session.company_id);
  return await repo.getLeadStats();
}

export async function updateLeadStatus(leadId: string, status: string, note?: string) {
  const session = await getSession();

  const repo = new LeadRepository(session.company_id);
  return await repo.updateLeadStatus(leadId, status as any, session.user_id, note);
}

export async function assignLead(leadId: string, assignedTo: string) {
  const session = await getSession();

  const repo = new LeadRepository(session.company_id);
  return await repo.assignLead(leadId, assignedTo, session.user_id);
}

export async function addLeadActivity(leadId: string, activityType: 'note' | 'call' | 'email', note: string) {
  const session = await getSession();

  const repo = new LeadRepository(session.company_id);
  return await repo.addLeadActivity(leadId, session.user_id, activityType, note);
}

export async function deleteLead(leadId: string) {
  const session = await getSession();

  const repo = new LeadRepository(session.company_id);
  return await repo.deleteLead(leadId);
}
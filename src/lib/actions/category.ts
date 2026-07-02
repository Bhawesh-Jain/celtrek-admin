'use server'

import { CategoryFormValues } from "@/app/dashboard/category-management/categories/add/page";
import { CategoryRepository } from "../repositories/categoryRepository";
import { getSession } from "../session";

export async function getCategoryList({ status = 0, modifier = '>' }: { status?: number, modifier?: string }) {
  const session = await getSession();

  const repo = new CategoryRepository(session.company_id);
  return await repo.getCategoryList({ status, modifier });
}

export async function getCategoryById(categoryId: string) {
  const session = await getSession();

  const repo = new CategoryRepository(session.company_id);
  return await repo.getCategoryById({ categoryId });
}

export async function updateCategoryStatus({ field, status, categoryId }: { field: string, status: string, categoryId: string }) {
  const session = await getSession();

  const repo = new CategoryRepository(session.company_id);
  return await repo.updateCategoryStatus(field, status, categoryId);
}

export async function createCategory(data: CategoryFormValues) {
  const session = await getSession();

  const repo = new CategoryRepository(session.company_id);
  return await repo.createCategory(session.user_id, data);
}

export async function updateCategory(categoryId: string, data: CategoryFormValues) {
  const session = await getSession();

  const repo = new CategoryRepository(session.company_id);
  return await repo.updateCategory(categoryId, session.user_id, data);
}

export async function deleteCategory(categoryId: string) {
  const session = await getSession();

  const repo = new CategoryRepository(session.company_id);
  return await repo.deleteCategory(categoryId);
}

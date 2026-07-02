'use server'

import { ProductImage } from "@/app/types/product-types";
import { ProductRepository } from "../repositories/productRepository";
import { getSession } from "../session";

export async function getProductList({ }) {
  const session = await getSession();

  const repo = new ProductRepository(session.company_id);
  return await repo.getProductList({ status: 0, modifier: '>' });
}

export async function getProductById(identifier: string) {
  const session = await getSession();

  const repo = new ProductRepository(session.company_id);
  return await repo.getProductById({ identifier });
}

export async function updateProductStatus({ field, status, productId }: { field: string, status: string, productId: string }) {
  const session = await getSession();

  const repo = new ProductRepository(session.company_id);
  return await repo.updateProductStatus(field, status, productId);
}

export async function createProduct(data: any) {
  const session = await getSession();

  const repo = new ProductRepository(session.company_id);
  return await repo.createProduct(session.user_id, data);
}

export async function updateProduct(productId: string, data: any) {
  const session = await getSession();

  const repo = new ProductRepository(session.company_id);
  return await repo.updateProduct(productId, session.user_id, data);
}

export async function deleteProduct(productId: string) {
  const session = await getSession();

  const repo = new ProductRepository(session.company_id);
  return await repo.deleteProduct(productId);
}

export async function updateProductImages(productId: string, existingImagesToUpdate: ProductImage[]) {
  const session = await getSession();

  const repo = new ProductRepository(session.company_id);
  return await repo.updateProductImages(productId, existingImagesToUpdate);
}

export async function deleteProductImages(images: ProductImage[]) {
  const session = await getSession();

  const repo = new ProductRepository(session.company_id);
  return await repo.deleteProductImages(images);
}

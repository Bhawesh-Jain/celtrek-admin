// lib/actions/dashboard.ts
'use server'

import { ProductRepository } from "../repositories/productRepository";
import { CategoryRepository } from "../repositories/categoryRepository";
import { LeadRepository } from "../repositories/leadRepository";
import { UserRepository } from "../repositories/sys/userRepository";
import { getSession } from "../session";

export async function getDashboardStats() {
  const session = await getSession();
  const companyId = session.company_id;

  const productRepo = new ProductRepository(companyId);
  const categoryRepo = new CategoryRepository(companyId);
  const leadRepo = new LeadRepository(companyId);
  const userRepo = new UserRepository(companyId);

  const [
    productCount,
    categoryCount,
    userCount,
    leadStats,
    recentProducts,
    recentLeads,
    categoriesWithCounts,
  ] = await Promise.all([
    productRepo.getProductCount(),
    categoryRepo.getCategoryCount(),
    userRepo.getUserCount(),
    leadRepo.getLeadStats(),
    productRepo.getRecentProducts(5),
    leadRepo.getLeadList({ page: 1, limit: 5 }),
    categoryRepo.getCategoryList({ status: 1, modifier: '=', count: true }),
  ]);

  const leadStatsResult = leadStats.success
    ? leadStats.result
    : { new: 0, contacted: 0, qualified: 0, converted: 0, lost: 0 };

  const totalLeads = Object.values(leadStatsResult).reduce((sum: number, n: any) => sum + n, 0);

  return {
    success: true,
    result: {
      product_count: productCount.success ? productCount.result : 0,
      category_count: categoryCount.success ? categoryCount.result : 0,
      user_count: userCount.success ? userCount.result : 0,
      lead_stats: leadStatsResult,
      total_leads: totalLeads,
      recent_products: recentProducts.success ? recentProducts.result : [],
      recent_leads: recentLeads.success ? (recentLeads.result?.items ?? []) : [],
      top_categories: categoriesWithCounts.success
        ? [...categoriesWithCounts.result]
            .sort((a: any, b: any) => b.item_count - a.item_count)
            .slice(0, 5)
        : [],
    },
  };
}
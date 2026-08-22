import { apiError, apiFailure, apiSuccess, apiValidate, DEFAULT_COMPANY_ID } from "@/lib/api/api-helper";
import { ProductRepository } from "@/lib/repositories/productRepository";
import { NextRequest } from "next/server";

export async function POST(request: NextRequest) {
  const origin = request.nextUrl.pathname;
  var message: string[] = [];

  try {
    const req = await request.json();
    var validate = await apiValidate({ origin, req: req, header: request.headers });

    if (!validate.success) {
      message = validate.message;
      return apiFailure({ message, status: 401 });
    }

    let featured = req['featured'];
    let companyId = req['company_id'];
    let category_id = req['category_id'];
    let page = Number(req['page']) || 1;
    let limit = Number(req['limit']) || 12;

    if (!companyId) companyId = DEFAULT_COMPANY_ID;

    if (message.length > 0) {
      return apiFailure({ message });
    }

    const repo = new ProductRepository(companyId);
    const data = await repo.getProductList({ status: 1, modifier: '=', featured, category_id, page, limit });

    if (!data.success) {
      message.push(data.message);
      return apiFailure({ message });
    }
    
    return apiSuccess({ data: data.result });
  } catch (error) {
    return apiError({ origin, error });
  }
}
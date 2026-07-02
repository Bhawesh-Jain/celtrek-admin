import { apiError, apiFailure, apiSuccess, apiValidate, DEFAULT_COMPANY_ID } from "@/lib/api/api-helper";
import { ProductRepository } from "@/lib/repositories/productRepository";
import { NextRequest } from "next/server";

export async function POST(request: NextRequest) {
  const origin = request.nextUrl.pathname;
  var message: string[] = [];

  try {
    const req = await request.json();
    var validate = await apiValidate({ origin, req: req, header: request.headers });

    let slug = req['slug'];

    if (!slug) message.push('Invalid Request!');

    if (!validate.success) {
      message = validate.message;
      return apiFailure({ message, status: 401 });
    }

    let companyId = req['company_id'];

    if (!companyId) companyId = DEFAULT_COMPANY_ID;

    if (message.length > 0) {
      return apiFailure({ message });
    }

    const repo = new ProductRepository(companyId);

    const data = await repo.getProductById({ identifier: slug });

    if (!data.success) {
      message.push(data.message)
      return apiFailure({ message });
    }

    return apiSuccess({ data: data.result });
  } catch (error) {
    return apiError({ origin, error });
  }
}

import { apiError, apiFailure, apiSuccess, apiValidate, DEFAULT_COMPANY_ID } from "@/lib/api/api-helper";
import { CategoryRepository } from "@/lib/repositories/categoryRepository";
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

    let companyId = req['company_id'];

    if (!companyId) companyId = DEFAULT_COMPANY_ID;

    if (message.length > 0) {
      return apiFailure({ message });
    }

    const categoryRepostiory = new CategoryRepository(companyId);

    const data = await categoryRepostiory.getCategoryList({ status: 1, modifier: '=', count: true });
    
    if (!data.success) {
      message.push(data.message)
      return apiFailure({ message });
    }

    return apiSuccess({ data: data.result });
  } catch (error) {
    return apiError({ origin, error });
  }
}

// app/api/v1/lead/create/route.ts
import {
  apiError,
  apiFailure,
  apiSuccess,
  apiValidate,
  DEFAULT_COMPANY_ID,
} from "@/lib/api/api-helper";
import { LeadRepository } from "@/lib/repositories/leadRepository";
import { NextRequest } from "next/server";

export async function POST(request: NextRequest) {
  const origin = request.nextUrl.pathname;
  var message: string[] = [];

  try {
    const req = await request.json();

    var validate = await apiValidate({
      origin,
      req: req,
      header: request.headers,
    });

    if (!validate.success) {
      message = validate.message;
      return apiFailure({ message, status: 401 });
    }

    let companyId = req.company_id || DEFAULT_COMPANY_ID;

    if (!req.name || !req.phone) {
      message.push("Name and phone are required.");
    }

    if (!companyId) companyId = DEFAULT_COMPANY_ID;

    if (message.length > 0) {
      return apiFailure({ message });
    }
    
    const repo = new LeadRepository(companyId);

    const data = await repo.createLead({
      name: req.name,
      phone: req.phone,
      email: req.email ?? null,
      company: req.company ?? null,
      product_id: req.product_id ?? null,
      product_name: req.product_name ?? null,
      message: req.message ?? null,
      source: req.source ?? "website",
      ip_address: request.headers.get("x-forwarded-for") ?? null,
      user_agent: request.headers.get("user-agent") ?? null,
    });

    if (!data.success) {
      message.push(data.message);
      return apiFailure({ message });
    }

    return apiSuccess({ data: data.result });
  } catch (error) {
    return apiError({ origin, error });
  }
}

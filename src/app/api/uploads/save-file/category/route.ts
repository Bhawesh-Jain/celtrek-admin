import { apiError, apiFailure, apiSuccess, apiValidate } from "@/lib/api/api-helper";
import { NextRequest } from "next/server";
import { File } from "fetch-blob/file.js";
import { CategoryRepository } from "@/lib/repositories/categoryRepository";

export async function POST(request: NextRequest) {
  const origin = request.nextUrl.pathname;
  var message: string[] = [];

  try {
    const req = await request.formData();
    var validate = apiValidate({ origin, req: req, header: request.headers });

    if (!validate.success) {
      message = validate.message;
      return apiFailure({ message, status: 401 });
    }

    var company_id = req.get('company_id');
    var user_id = req.get('user_id');
    var category_id = req.get('category_id');

    var imageEntry = req.get('image');

    if (!user_id) message.push('Invalid Request');
    if (!company_id) message.push('Invalid Request');
    if (!category_id) message.push('Invalid Category');

    if (!imageEntry || !(imageEntry instanceof File)) message.push('Invalid Image');

    if (message.length > 0) {
      return apiFailure({ message });
    }

    const repo = new CategoryRepository(String(company_id))
    var data = await repo.updateCategoryImage(String(category_id), String(user_id), imageEntry as File)

    if (!data.success) {
      message.push(`Image Upload Failed!`)
      return apiFailure({ message });
    }

    return apiSuccess({ message: [`Image Uploaded`] });
  } catch (error) {
    return apiError({ origin, error });
  }
}

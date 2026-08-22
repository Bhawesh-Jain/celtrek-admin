import { CategoryFormValues } from "@/app/dashboard/category-management/categories/add/page";
import { QueryBuilder } from "../helpers/db-helper";
import { RepositoryBase } from "../helpers/repository-base";
import { File } from "fetch-blob/file.js";
import {
  deleteFileFromIdentifier,
  getFileUrl,
  saveFile,
} from "../helpers/file-helper";
import { FileRepository } from "./sys/fileRepository";

export interface Category {
  category_id: number;
  company_id: number;

  category_name: string;
  category_image: string;
  category_description: string;

  item_count: number;

  updated_by: number;
  creator_name: string;

  status: number;
  created_on: string;
  updated_on: string;
}

export class CategoryRepository extends RepositoryBase {
  private companyId: string;

  constructor(comapanyId: string) {
    super();
    this.companyId = comapanyId;
  }

  async getCategoryCount() {
    try {
      const count = await new QueryBuilder("categories")
        .where("company_id = ?", this.companyId)
        .where("status = ?", 1)
        .count();

      return this.success(count);
    } catch (error) {
      return this.handleError(error);
    }
  }

  async getCategoryList({
    status = 1,
    modifier = "=",
    count = true,
  }: {
    status?: number;
    modifier?: string;
    count?: boolean;
  }) {
    try {
      const builder = new QueryBuilder("categories");

      builder.where(`status ${modifier} ?`, status);

      if (this.companyId) {
        builder.where(`company_id = ?`, this.companyId);
      }

      const res = await builder.select();

      if (res.length == 0) {
        return this.failure("No Categories Available!");
      }

      const fileRepo = new FileRepository(this.companyId);
      for (let i = 0; i < res.length; i++) {
        const category = res[i] as Category;
        if (count) {
          const count = await new QueryBuilder("products")
            .where("company_id = ?", this.companyId)
            .where("status = 1")
            .where("category_id = ?", category.category_id)
            .count();

          category.item_count = count;
        }
        const images = await fileRepo.getFileFromType(
          String(category.category_id),
          "category_image",
        );

        if (images.success) {
          const imageUrl = getFileUrl(images.result.identifier);
          category.category_image = imageUrl;
        }
      }

      return this.success(res);
    } catch (error) {
      return this.handleError(error);
    }
  }

  async getCategoryById({
    categoryId,
    count = true,
  }: {
    categoryId: string;
    count?: boolean;
  }) {
    try {
      const builder = new QueryBuilder("categories").where(
        "category_id = ?",
        categoryId,
      );

      if (this.companyId) {
        builder.where(`company_id = ?`, this.companyId);
      }

      const res = (await builder.selectOne()) as Category;

      if (!res) {
        return this.failure("Invalid Category!");
      }

      if (count) {
        // for (let i = 0; i < res.length; i++) {
        //   const category = res[i];
        //   const count = await new QueryBuilder('')
        // }
      }

      const images = await new FileRepository(this.companyId).getFileFromType(
        String(categoryId),
        "category_image",
      );

      if (images.success) {
        const imageUrl = getFileUrl(images.result.identifier);
        res.category_image = imageUrl;
      }

      return this.success(res);
    } catch (error) {
      return this.handleError(error);
    }
  }

  async createCategory(userId: string, data: CategoryFormValues) {
    try {
      const res = await new QueryBuilder("categories").insert({
        ...data,
        updated_by: userId,
        company_id: this.companyId,
        status: 1,
      });

      if (res <= 0) {
        return this.failure("Something went wrong!");
      }

      return this.success(
        {
          category_id: res,
        },
        "Category Added!",
      );
    } catch (error) {
      return this.handleError(error);
    }
  }

  async updateCategoryImage(categoryId: string, userId: string, image: File) {
    try {
      await deleteFileFromIdentifier({
        companyId: this.companyId,
        identifier: categoryId,
        associatedType: "category_image",
        userId,
      });

      const res = await saveFile(
        this.companyId,
        image,
        "category_image",
        categoryId,
        "category_image",
        "./uploads/category",
        "updateCategoryImage",
        0,
        userId,
      );

      return this.success(res, "Category Image Updated!");
    } catch (error) {
      return this.handleError(error);
    }
  }

  async updateCategory(
    categoryId: string,
    userId: string,
    data: CategoryFormValues,
  ) {
    try {
      const res = await new QueryBuilder("categories")
        .where("category_id = ?", categoryId)
        .update({
          ...data,
          updated_by: userId,
        });

      if (res <= 0) {
        return this.failure("Update Failed!");
      }

      return this.success("Category Updated!");
    } catch (error) {
      return this.handleError(error);
    }
  }

  async deleteCategory(categoryId: string) {
    try {
      const res = await new QueryBuilder("categories")
        .where("category_id = ?", categoryId)
        .update({
          status: -1,
        });

      if (res <= 0) {
        return this.failure("Update Failed!");
      }

      return this.success("Category Updated!");
    } catch (error) {
      return this.handleError(error);
    }
  }

  async updateCategoryStatus(
    field: string,
    status: string,
    categoryId: string,
  ) {
    try {
      const res = await new QueryBuilder("categories")
        .where("category_id = ?", categoryId)
        .update({
          [field]: status,
        });

      if (res <= 0) {
        return this.failure("Update Failed!");
      }

      return this.success("Category Updated!");
    } catch (error) {
      return this.handleError(error);
    }
  }
}

import {
  executeQuery,
  QueryBuilder,
  withTransaction,
} from "../helpers/db-helper";
import { RepositoryBase } from "../helpers/repository-base";
import { File } from "fetch-blob/file.js";
import {
  deleteFileFromIdentifier,
  getFileUrl,
  saveFile,
} from "../helpers/file-helper";
import { ProductImage } from "@/app/types/product-types";
import { FileRepository } from "./sys/fileRepository";

interface RelatedProduct {
  product_id: number;
  product_name: string;
  product_slug: string;
  base_price: string;
  sku: string;
  category_id: number;
  category_name: string;
  product_image: string | null;
}

export interface Product {
  product_id: number;
  company_id: number;

  product_name: string;
  product_image: string;

  total_variants: number;
  base_price: number;

  updated_by: number;
  creator_name: string;
  variant_name: string;
  price: string;

  status: number;
  created_on: string;
  updated_on: string;
}

export class ProductRepository extends RepositoryBase {
  private companyId: string;

  constructor(comapanyId: string) {
    super();
    this.companyId = comapanyId;
  }

  async getProductList({
    status = 1,
    category_id,
    modifier = "=",
    featured,
    search,
    page = 1,
    limit = 12,
  }: {
    status?: number;
    modifier?: string;
    category_id?: string;
    search?: string;
    featured?: boolean;
    page?: number;
    limit?: number;
  }) {
    try {
      const offset = (page - 1) * limit;

      // ── Count (same WHERE clause, no LIMIT) ──────────────────────────
      let countParams: any[] = [this.companyId, status];
      let countSql = `
      SELECT COUNT(*) AS total
      FROM products p
      WHERE p.company_id = ?
        AND p.status ${modifier} ?
        ${featured ? " AND p.is_featured = 1" : ""}
        ${category_id ? " AND p.category_id = ?" : ""}
    `;
      if (category_id) countParams.push(category_id);

      const countRes = (await executeQuery(countSql, countParams)) as any[];
      const total = countRes[0]?.total ?? 0;

      // ── Page of results ───────────────────────────────────────────────
      let params: any[] = [
        this.companyId,
        this.companyId,
        this.companyId,
        status,
      ];
      if (category_id) params.push(category_id);

      if (search) {
        params.push(`%${search}%`);
        params.push(`%${search}%`);
      }

      let sql = `
        SELECT 
          p.product_name,
          p.product_id,
          p.company_id,
          p.sku,
          p.product_slug,
          p.base_price,
          p.status,
          p.created_on,
          p.updated_on,
          u.name as creator_name,
          c.category_name,
          p.category_id,

          COALESCE(pv1.variant_id, pv2.variant_id) AS default_variant_id,
          COALESCE(pv1.variant_name, pv2.variant_name) AS variant_name,
          COALESCE(pv1.price, pv2.price) AS price,

          COALESCE(fl.identifier, fallback_fl.identifier) AS product_image,

          (
            SELECT COUNT(*) 
            FROM product_variants 
            WHERE product_id = p.product_id
              AND status = 1
          ) AS total_variants

        FROM products p

        LEFT JOIN users u
          ON u.id = p.updated_by

        LEFT JOIN categories c
          ON c.category_id = p.category_id

        LEFT JOIN file_log fl 
          ON fl.id = p.product_main_image
          AND fl.status = 1
          AND fl.company_id = ?

        LEFT JOIN file_log fallback_fl
          ON fallback_fl.id = (
                SELECT id
                FROM file_log
                WHERE product_id = p.product_id
                  AND status = 1
                  AND company_id = ?
                ORDER BY id ASC
                LIMIT 1
          )

        LEFT JOIN product_variants pv1
          ON pv1.variant_id = p.default_variant_id
          AND pv1.status = 1

        LEFT JOIN product_variants pv2
          ON pv2.product_id = p.product_id
          AND pv2.is_default = 1
          AND pv2.status = 1

        WHERE p.company_id = ?
          AND p.status ${modifier} ?
          ${featured ? ` AND p.is_featured = 1` : ""}
          ${category_id ? ` AND p.category_id = ?` : ""}
          ${search ? ` AND (p.product_name LIKE ? OR p.sku LIKE ?)` : ""}

        ORDER BY p.product_id DESC
        LIMIT ${limit} OFFSET ${offset}
      `;

      const res = (await executeQuery(sql, params)) as any[];

      for (let i = 0; i < res.length; i++) {
        res[i].product_image = getFileUrl(res[i].product_image);
      }

      return this.success({
        items: res,
        total,
        page,
        limit,
        totalPages: Math.max(1, Math.ceil(total / limit)),
      });
    } catch (error) {
      return this.handleError(error);
    }
  }

  async getProductCount() {
    try {
      const count = await new QueryBuilder("products")
        .where("company_id = ?", this.companyId)
        .where("status = ?", 1)
        .count();

      return this.success(count);
    } catch (error) {
      return this.handleError(error);
    }
  }

  async getRecentProducts(limit = 5) {
    try {
      const sql = `
        SELECT product_id, product_name, product_slug, base_price, created_on
        FROM products
        WHERE company_id = ?
          AND status = 1
        ORDER BY created_on DESC
        LIMIT ${limit}
      `;
      const res = (await executeQuery(sql, [this.companyId])) as any[];
      return this.success(res);
    } catch (error) {
      return this.handleError(error);
    }
  }

  async getProductById({
    identifier,
    active = true,
  }: {
    identifier: string;
    active?: boolean;
  }) {
    try {
      let sql = `
        SELECT 
            p.*,
            u.name as creator_name,
            c.category_name
        FROM products p
        LEFT JOIN users u
          ON u.id = p.updated_by

        LEFT JOIN categories c
          ON c.category_id = p.category_id

        WHERE (p.product_id = ? OR p.product_slug = ?)
          ${active && "AND p.status >= 0"}
        LIMIT 1
      `;

      const res = (await executeQuery(sql, [identifier, identifier])) as any[];

      if (res.length == 0) {
        return this.failure("Invaid Product!");
      }
      const product = res[0];

      const productImageRes = (await new QueryBuilder("file_log")
        .where("associated_type = 'product_image'")
        .where("associated_id = ?", product.product_id)
        .where("status = 1")
        .where("company_id = ?", this.companyId)
        .select(["identifier", "id"])) as any[];

      const productImages = productImageRes.map((item) => {
        return getFileUrl(item.identifier);
      });
      product.product_images = productImages;
      product.product_images_obj = productImageRes;

      const variants = await new QueryBuilder("product_variants")
        .where("product_id = ?", product.product_id)
        .where("status = 1")
        .select();

      product.product_variants = variants;
      product.total_variants = variants.length;

      const details = await new QueryBuilder("product_details")
        .where("product_id = ?", product.product_id)
        .where("status = 1")
        .select();

      product.product_details = details;
      const relatedProducts = (await executeQuery(
        `
          SELECT
            p.product_id,
            p.product_name,
            p.product_slug,
            p.base_price,
            p.sku,
            p.category_id,
            c.category_name,
            COALESCE(fl.identifier, fallback_fl.identifier) AS product_image
          FROM products p

          LEFT JOIN categories c
            ON c.category_id = p.category_id

          LEFT JOIN file_log fl
            ON fl.id = p.product_main_image
            AND fl.status = 1
            AND fl.company_id = ?

          LEFT JOIN file_log fallback_fl
            ON fallback_fl.id = (
              SELECT id
              FROM file_log
              WHERE product_id = p.product_id
                AND status = 1
                AND company_id = ?
              ORDER BY id ASC
              LIMIT 1
            )

          WHERE p.company_id = ?
            AND p.status = 1
            AND p.product_id != ?
            AND p.category_id = ?

          ORDER BY p.is_featured DESC, p.product_id DESC
          LIMIT 4
        `,
        [
          this.companyId,
          this.companyId,
          this.companyId,
          product.product_id,
          product.category_id,
        ],
      )) as any[];

      for (const related of relatedProducts) {
        related.product_image = related.product_image
          ? getFileUrl(related.product_image)
          : null;
      }

      product.related_products = relatedProducts;

      console.log(product);

      return this.success(product);
    } catch (error) {
      return this.handleError(error);
    }
  }

  async createProduct(userId: string, data: any) {
    try {
      return withTransaction(async (connection) => {
        const slug = await new QueryBuilder("products")
          .where("product_slug = ?", data.product_slug)
          .where("company_id = ?", this.companyId)
          .selectOne();

        if (slug) {
          return this.failure(
            "Product slug already exists! Try to change the slug in the Basic Tab@",
          );
        }

        const product = {
          product_name: data.product_name,
          product_slug: data.product_slug,
          category_id: data.category_id,
          product_description: data.product_description,
          base_price: data.base_price,
          sale_price: data.sale_price,
          sku: data.sku,
          is_featured: data.is_featured,
          allow_backorders: data.allow_backorders,
          meta_title: data.meta_title,
          meta_description: data.meta_description,
          updated_by: userId,
          company_id: this.companyId,
          has_variants: data.variants.length > 1,
          status: data.status,
        };

        const productId = await new QueryBuilder("products")
          .setConnection(connection)
          .insert(product);

        for (let i = 0; i < data.product_details.length; i++) {
          const detail = data.product_details[i];

          await new QueryBuilder("product_details")
            .setConnection(connection)
            .insert({
              product_id: productId,
              product_name: detail,
              updated_by: userId,
              status: 1,
            });
        }

        let defaultVariant;
        for (let i = 0; i < data.variants.length; i++) {
          const variant = data.variants[i];

          const varIns = {
            product_id: productId,
            variant_name: variant.variant_name,
            variant_sku: variant.sku,
            additional_price: variant.additional_price,
            price: variant.price,
            stock: variant.stock,
            weight: variant.weight,
            is_default: variant.is_default,
            length: variant.dimensions.length,
            width: variant.dimensions.width,
            height: variant.dimensions.height,
            status: 1,
            updated_by: userId,
          };

          const varId = await new QueryBuilder("product_variants")
            .setConnection(connection)
            .insert(varIns);

          if (variant.is_default) {
            defaultVariant = varId;
          }
        }

        if (defaultVariant) {
          await new QueryBuilder("products")
            .setConnection(connection)
            .where("product_id = ?", productId)
            .update({
              default_variant_id: defaultVariant,
            });
        }

        return this.success(
          {
            product_id: productId,
          },
          "Product Added!",
        );
      });
    } catch (error) {
      return this.handleError(error);
    }
  }

  async updateProduct(productId: string, userId: string, data: any) {
    try {
      return withTransaction(async (connection) => {
        const slug = await new QueryBuilder("products")
          .where("product_slug = ?", data.product_slug)
          .where("product_id != ?", productId)
          .where("company_id = ?", this.companyId)
          .selectOne();

        if (slug) {
          return this.failure("Product slug already exists! Try another slug.");
        }

        const productUpdate = {
          product_name: data.product_name,
          product_slug: data.product_slug,
          category_id: data.category_id,
          product_description: data.product_description,
          base_price: data.base_price,
          sale_price: data.sale_price,
          sku: data.sku,
          status: data.status,
          is_featured: data.is_featured,
          allow_backorders: data.allow_backorders,
          meta_title: data.meta_title,
          meta_description: data.meta_description,
          has_variants: data.variants.length > 1,
          updated_by: userId,
        };

        const res = await new QueryBuilder("products")
          .setConnection(connection)
          .where("product_id = ?", productId)
          .update(productUpdate);

        if (res <= 0) {
          return this.failure("Update Failed!");
        }

        await new QueryBuilder("product_details")
          .setConnection(connection)
          .where("product_id = ?", productId)
          .delete();

        for (const detail of data.product_details) {
          await new QueryBuilder("product_details")
            .setConnection(connection)
            .insert({
              product_id: productId,
              product_name: detail,
              updated_by: userId,
              status: 1,
            });
        }

        let defaultVariantId: number | null = null;

        for (const variant of data.variants) {
          const variantPayload = {
            product_id: productId,
            variant_name: variant.variant_name,
            variant_sku: variant.sku,
            additional_price: variant.additional_price,
            price: variant.price,
            stock: variant.stock,
            weight: variant.weight,
            is_default: variant.is_default,
            length: variant.dimensions.length,
            width: variant.dimensions.width,
            height: variant.dimensions.height,
            updated_by: userId,
            status: 1,
          };

          if (variant.variant_id) {
            await new QueryBuilder("product_variants")
              .setConnection(connection)
              .where("variant_id = ?", variant.variant_id)
              .where("product_id = ?", productId)
              .update(variantPayload);

            if (variant.is_default) {
              defaultVariantId = variant.variant_id;
            }
          } else {
            // INSERT new variant
            const newVarId = await new QueryBuilder("product_variants")
              .setConnection(connection)
              .insert(variantPayload);

            if (variant.is_default) {
              defaultVariantId = newVarId;
            }
          }
        }

        if (defaultVariantId) {
          await new QueryBuilder("products")
            .setConnection(connection)
            .where("product_id = ?", productId)
            .update({
              default_variant_id: defaultVariantId,
            });
        }

        return this.success("Product Updated!");
      });
    } catch (error) {
      return this.handleError(error);
    }
  }

  async updateProductImages(
    productId: string,
    existingImagesToUpdate: ProductImage[],
  ) {
    try {
      for (let i = 0; i < existingImagesToUpdate.length; i++) {
        const image = existingImagesToUpdate[i];
        if (image.is_main) {
          await new QueryBuilder("products")
            .where("product_id = ?", productId)
            .update({
              product_main_image: image.id,
            });
        }
      }

      return this.success("Product Image Updated!");
    } catch (error) {
      return this.handleError(error);
    }
  }

  async deleteProductImages(images: ProductImage[]) {
    try {
      for (let i = 0; i < images.length; i++) {
        const image = images[i];

        await deleteFileFromIdentifier({
          companyId: this.companyId,
          identifier: image.id,
        });
      }

      return this.success("Product Image Updated!");
    } catch (error) {
      return this.handleError(error);
    }
  }

  async addProductImage(
    is_main: string,
    productId: string,
    userId: string,
    image: File,
  ) {
    try {
      const res = await saveFile(
        this.companyId,
        image,
        "product_image",
        productId,
        "product_image",
        "./uploads/product",
        "updateProductImage",
        0,
        userId,
      );

      if (is_main == "1" && res.success) {
        await new QueryBuilder("products")
          .where("product_id = ?", productId)
          .update({
            product_main_image: res.fileId,
          });
      }

      return this.success(res, "Product Image Updated!");
    } catch (error) {
      return this.handleError(error);
    }
  }

  async deleteProduct(productId: string) {
    try {
      return withTransaction(async (connection) => {
        await new QueryBuilder("products")
          .setConnection(connection)
          .where("product_id = ?", productId)
          .update({
            status: -1,
          });

        const images = await new FileRepository(this.companyId).getFileFromType(
          productId,
          "product_image",
          connection,
          true,
        );

        for (let i = 0; i < images.result.length; i++) {
          const image = images.result[i];

          await deleteFileFromIdentifier({
            companyId: this.companyId,
            identifier: image.identifier,
            transaction: connection,
          });
        }

        return this.success("Product Deleted!");
      });
    } catch (error) {
      return this.handleError(error);
    }
  }

  async updateProductStatus(field: string, status: string, productId: string) {
    try {
      const res = await new QueryBuilder("products")
        .where("product_id = ?", productId)
        .update({
          [field]: status,
        });

      if (res <= 0) {
        return this.failure("Update Failed!");
      }

      return this.success("Product Updated!");
    } catch (error) {
      return this.handleError(error);
    }
  }
}

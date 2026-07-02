export interface Category {
  category_id: number
  category_name: string
  category_slug: string
}

export interface ProductVariant {
  id: string
  name: string
  sku?: string
  additional_price: number
  base_price?: number
  sale_price?: number
  stock: number
  weight: number
  is_default?: boolean
  dimensions?: {
    length: number
    width: number
    height: number
  }
}

export interface ProductImage {
  id: string
  file?: File
  previewUrl: string
  sort_order?: number
  is_main?: boolean
  product_image_id?: number
  image_path?: string
  is_new?: boolean
  is_deleted?: boolean
}

export interface VariantOption {
  name: string // e.g., "Size", "Color"
  values: string[] // e.g., ["Small", "Medium", "Large"]
}

export type TabName = "basic" | "pricing" | "variants" | "images" | "seo"
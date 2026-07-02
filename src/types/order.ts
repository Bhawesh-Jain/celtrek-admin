
// Types
export interface Order {
  order_id: number
  order_number: string
  customer_name: string
  customer_email: string
  customer_phone?: string
  total_amount: number
  subtotal_amount: number
  tax_amount: number
  shipping_amount: number
  discount_amount: number
  payment_status: 'pending' | 'paid' | 'failed' | 'refunded'
  fulfillment_status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled'
  order_status: 'pending' | 'confirmed' | 'processing' | 'completed' | 'cancelled'
  payment_method: string
  shipping_method?: string
  shipping_address?: {
    street: string
    city: string
    state: string
    country: string
    postal_code: string
  }
  billing_address?: {
    street: string
    city: string
    state: string
    country: string
    postal_code: string
  }
  notes?: string
  tags?: string[]
  created_at: string
  updated_at: string
  items: OrderItem[]
  platform: string
  platform_order_id?: string
}

export interface OrderItem {
  item_id: number
  product_id: number
  product_name: string
  variant_name?: string
  sku: string
  quantity: number
  unit_price: number
  total_price: number
  image_url?: string
}
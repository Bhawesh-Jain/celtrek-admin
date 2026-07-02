'use client'

import { useParams } from 'next/navigation'
import ProductForm from '../../blocks/ProductForm'

export default function ProductPage() {
  const params = useParams()
  const productId = params.id as string | undefined

  return <ProductForm productId={productId} />
}
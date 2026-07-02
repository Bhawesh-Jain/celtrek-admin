export const generateSKU = (productName: string, variantName?: string): string => {
  const base = productName
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '')
    .substring(0, 6)
  
  const variant = variantName
    ? variantName.toUpperCase().replace(/[^A-Z0-9]/g, '').substring(0, 3)
    : 'STD'
  
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0')
  
  return `${base}-${variant}-${random}`
}

export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount)
}

export const validateVariant = (variant: any): { isValid: boolean; errors: string[] } => {
  const errors: string[] = []
  
  if (!variant.name?.trim()) {
    errors.push("Variant name is required")
  }
  
  if (variant.stock < 0) {
    errors.push("Stock cannot be negative")
  }
  
  if (variant.weight < 0) {
    errors.push("Weight cannot be negative")
  }
  
  return {
    isValid: errors.length === 0,
    errors
  }
}

export const calculateTotalPrice = (basePrice: number, additionalPrice: number): number => {
  return parseFloat((basePrice + additionalPrice).toFixed(2))
}

export const generateVariantCombinations = (options: { [key: string]: string[] }): any[] => {
  const keys = Object.keys(options)
  if (keys.length === 0) return []

  const combine = (arrays: string[][], index = 0): string[][] => {
    if (index === arrays.length) return [[]]
    
    const result = []
    const rest = combine(arrays, index + 1)
    
    for (const item of arrays[index]) {
      for (const r of rest) {
        result.push([item, ...r])
      }
    }
    
    return result
  }

  const valueArrays = keys.map(key => options[key])
  const combinations = combine(valueArrays)
  
  return combinations.map(combo => {
    const variant: any = {}
    keys.forEach((key, index) => {
      variant[key.toLowerCase()] = combo[index]
    })
    variant.name = combo.join(' / ')
    return variant
  })
}

export const slugify = (text: string): string => {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim()
}

export const validateImage = (file: File): { isValid: boolean; error?: string } => {
  const maxSize = 10 * 1024 * 1024 // 10MB
  const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
  
  if (file.size > maxSize) {
    return { isValid: false, error: 'File size exceeds 10MB limit' }
  }
  
  if (!validTypes.includes(file.type)) {
    return { isValid: false, error: 'Invalid file type. Please upload an image' }
  }
  
  return { isValid: true }
}
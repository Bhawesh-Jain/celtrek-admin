'use client'

import { useState, useEffect, useCallback } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { useRouter, useParams } from "next/navigation"
import { useToast } from "@/hooks/use-toast"
import { useUser } from "@/contexts/user-context"
import { Button } from "@/components/ui/button"
import { Form } from "@/components/ui/form"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Container } from "@/components/ui/container"
import { Separator } from "@/components/ui/separator"
import Loading from "@/app/dashboard/loading"
import {
  DefaultFormTextField,
  DefaultFormTextArea,
  DefaultFormSelect,
  DefaultFormCheckbox
} from "@/components/ui/default-form-field"
import { createProduct, updateProduct, getProductById, updateProductImages, deleteProductImages, deleteProduct } from "@/lib/actions/product"
import { getCategoryList } from "@/lib/actions/category"
import {
  Plus,
  Minus,
  Package,
  Image as ImageIcon,
  DollarSign,
  Layers,
  Hash,
  AlertCircle,
  Save,
  X,
  Upload,
  Copy,
  RefreshCw,
  Tag,
  Eye,
  TrendingUp,
  Check,
  ArrowUp,
  ArrowDown,
  Edit,
  Trash2,
  Download,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Switch } from "@/components/ui/switch"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { decryptIdFromUrl } from "@/lib/utils/crypto"
import { ProductImage } from "@/app/types/product-types"

// Product form schema
export const ProductFormSchema = z.object({
  product_name: z.string()
    .min(2, "Product name must be at least 2 characters")
    .max(200, "Product name must be less than 200 characters"),

  product_slug: z.string()
    .min(2, "Slug must be at least 2 characters")
    .max(200, "Slug must be less than 200 characters")
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug must be lowercase with hyphens only"),

  category_id: z.string()
    .min(1, "Please select a category"),

  product_description: z.string()
    .min(10, "Description must be at least 10 characters")
    .max(2000, "Description must be less than 2000 characters")
    .optional()
    .or(z.literal('')),

  product_details: z
    .array(
      z.string()
        .min(2, "Feature must be at least 2 characters")
        .max(200, "Feature too long")
    )
    .optional()
    .default([]),

  base_price: z.string()
    .regex(/^\d+(\.\d{1,2})?$/, "Enter a valid price")
    .transform(val => parseFloat(val)),

  sale_price: z.string()
    .regex(/^\d+(\.\d{1,2})?$/, "Enter a valid price")
    .optional()
    .or(z.literal(''))
    .transform(val => val ? parseFloat(val) : undefined),

  sku: z.string()
    .min(1, "SKU is required")
    .max(50, "SKU must be less than 50 characters"),

  status: z.boolean().default(true),
  is_featured: z.boolean().default(false),
  allow_backorders: z.boolean().default(false),

  meta_title: z.string()
    .max(60, "Meta title must be less than 60 characters")
    .optional()
    .or(z.literal('')),

  meta_description: z.string()
    .max(160, "Meta description must be less than 160 characters")
    .optional()
    .or(z.literal('')),
})

const TAB_FIELDS: Record<string, string[]> = {
  basic: [
    "product_name",
    "product_slug",
    "category_id",
    "product_description",
    "product_details",
  ],
  pricing: [
    "base_price",
    "sale_price",
    "sku",
  ],
  variants: [],
  images: [],
  seo: [
    "meta_title",
    "meta_description",
  ],
}

// Utility functions
const generateSKU = (productName: string, variantName?: string): string => {
  const base = productName
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '')
    .substring(0, 6) || 'PROD'

  const variant = variantName
    ? variantName.toUpperCase().replace(/[^A-Z0-9]/g, '').substring(0, 3)
    : 'STD'

  const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0')

  return `${base}-${variant}-${random}`
}

const slugify = (text: string): string => {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim()
}

const calculateTotalPrice = (basePrice: number, additionalPrice: number): number => {
  return Number(basePrice) + Number(additionalPrice);
}

// Types
interface Category {
  category_id: number
  category_name: string
  category_slug: string
}

interface ProductVariant {
  id: string
  name: string
  sku?: string
  additional_price: number
  base_price?: number
  sale_price?: number
  stock: number
  weight: number
  is_default?: boolean
  variant_id?: number
  dimensions?: {
    length: number
    width: number
    height: number
  }
}

interface VariantOption {
  name: string
  values: string[]
}

type ProductFormValues = z.infer<typeof ProductFormSchema>

interface ProductData {
  product_id?: number
  product_name: string
  product_slug: string
  category_id: string
  product_description: string
  product_details: string[]
  base_price: number
  sale_price?: number
  sku: string
  status: boolean
  is_featured: boolean
  allow_backorders: boolean
  meta_title?: string
  meta_description?: string
  variants?: ProductVariant[]
  images?: ProductImage[]
}

export default function ProductForm({ productId }: { productId?: string }) {
  const router = useRouter()
  const { toast } = useToast()
  const { user } = useUser()
  const [isLoading, setIsLoading] = useState(!!productId)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [categories, setCategories] = useState<Category[]>([])
  const [activeTab, setActiveTab] = useState("basic")
  const [productImages, setProductImages] = useState<ProductImage[]>([])
  const [isDragging, setIsDragging] = useState(false)
  const [variants, setVariants] = useState<ProductVariant[]>([
    {
      id: "default-1",
      name: "Standard",
      additional_price: 0,
      stock: 0,
      weight: 0,
      is_default: true,
      dimensions: { length: 0, width: 0, height: 0 }
    }
  ])
  const [variantOptions, setVariantOptions] = useState<VariantOption[]>([
    { name: "Size", values: ["Small", "Medium", "Large"] },
    { name: "Color", values: ["Red", "Blue", "Black"] }
  ])
  const [newOption, setNewOption] = useState({ name: "", value: "" })
  const [newVariant, setNewVariant] = useState<Omit<ProductVariant, "id">>({
    name: "",
    sku: "",
    additional_price: 0,
    stock: 0,
    weight: 0,
    is_default: false,
    dimensions: { length: 0, width: 0, height: 0 }
  })
  const [activeVariantTab, setActiveVariantTab] = useState<"single" | "bulk" | "options">("single")
  const [productFeatures, setProductFeatures] = useState<string[]>([])
  const [newFeature, setNewFeature] = useState("")
  const [existingImages, setExistingImages] = useState<ProductImage[]>([])
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)

  const isEditMode = !!productId

  const form = useForm<ProductFormValues>({
    resolver: zodResolver(ProductFormSchema),
    defaultValues: {
      product_name: "",
      product_slug: "",
      category_id: "",
      product_description: "",
      product_details: [],
      sku: "",
      status: true,
      is_featured: false,
      allow_backorders: false,
      meta_title: "",
      meta_description: "",
    },
  })

  // Watch slug generation from product name
  const productName = form.watch("product_name")
  const basePrice = form.watch("base_price")
  const salePrice = form.watch("sale_price")

  // Replace the slug generation useEffect with this:
  useEffect(() => {
    if (productName && !isEditMode && !form.getFieldState("product_slug").isDirty) {
      const slug = slugify(productName);
      form.setValue("product_slug", slug, { shouldDirty: false });

      const mainSku = generateSKU(productName, "MAIN");
      form.setValue("sku", mainSku, { shouldDirty: false });

      // Only update default variant SKU once when product name changes
      setVariants(prev => {
        if (prev.length === 1 && prev[0].id === "default-1" && !prev[0].sku) {
          const variantSku = generateSKU(productName, "STD");
          return [{
            ...prev[0],
            name: "Standard",
            sku: variantSku
          }];
        }
        return prev;
      });
    }
  }, [productName, isEditMode, form]);

  // Navigate to tabs with errors
  useEffect(() => {
    const errors = form.formState.errors
    if (!errors || Object.keys(errors).length === 0) return

    for (const [tab, fields] of Object.entries(TAB_FIELDS)) {
      if (
        fields.some((field) =>
          Object.keys(errors).some((errorKey) =>
            errorKey === field || errorKey.startsWith(`${field}.`)
          )
        )
      ) {
        setActiveTab(tab)
        break
      }
    }
  }, [form.formState.submitCount])

  const tabHasError = (tab: string) => {
    const fields = TAB_FIELDS[tab]
    const errors = form.formState.errors

    return fields.some((field) =>
      Object.keys(errors).some(
        (key) => key === field || key.startsWith(`${field}.`)
      )
    )
  }

  // Replace the problematic useEffect with this:
  useEffect(() => {
    let isMounted = true;

    const fetchData = async () => {
      if (!productId) return;

      setIsLoading(true);
      try {

        // Fetch product data
        const productResult = await getProductById(String(decryptIdFromUrl(productId)));
        if (isMounted && productResult.success && productResult.result) {
          const product = productResult.result;

          // Prepare all data in one object to minimize state updates
          const productData = {
            product_name: product.product_name || "",
            product_slug: product.product_slug || "",
            category_id: product.category_id?.toString() || "",
            product_description: product.product_description || "",
            base_price: product.base_price?.toString() || "0",
            sku: product.sku || "",
            status: product.status === 1,
            is_featured: product.is_featured === 1,
            allow_backorders: product.allow_backorders === 1,
            meta_title: product.meta_title || "",
            meta_description: product.meta_description || "",
          };

          // Reset form once with all data
          form.reset({
            ...productData,
            product_details: product.product_details?.map((item: any) => item.product_name) || [],
          });

          // Update other states in sequence but only if needed
          const newFeatures = product.product_details?.map((item: any) => item.product_name) || [];
          setProductFeatures(newFeatures);

          if (product.product_variants && product.product_variants.length > 0) {
            const formattedVariants = product.product_variants.map((v: any) => ({
              id: v.variant_id?.toString() || `variant-${Date.now()}`,
              name: v.variant_name || "Standard",
              sku: v.variant_sku || "",
              additional_price: parseFloat(v.additional_price) || 0,
              base_price: parseFloat(v.price) || parseFloat(product.base_price),
              stock: v.stock || 0,
              weight: v.weight || 0,
              is_default: v.is_default === 1,
              variant_id: v.variant_id,
              dimensions: {
                length: v.length || 0,
                width: v.width || 0,
                height: v.height || 0
              }
            }));
            setVariants(formattedVariants);
          }

          if (product.product_images && product.product_images.length > 0) {
            const formattedImages = product.product_images.map((imgUrl: string, index: number) => ({
              id: `image-${index}`,
              previewUrl: imgUrl,
              sort_order: index,
              is_main: index === 0,
              is_new: false,
              is_deleted: false
            }));

            if (product.product_images_obj && product.product_images_obj.length > 0) {
              product.product_images_obj.forEach((imgObj: any, index: number) => {
                if (formattedImages[index]) {
                  formattedImages[index].id = imgObj.id.toString();
                  formattedImages[index].product_image_id = imgObj.id;
                }
              });
            }

            setExistingImages(formattedImages);
            setProductImages(formattedImages);
          }
        }
      } catch (error) {
        console.error("Error fetching data:", error);
        if (isMounted) {
          toast({
            title: "Error",
            description: "Failed to load data",
            variant: "destructive",
          });
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    fetchData();

    return () => {
      isMounted = false;
    };
  }, [productId]);

  useEffect(() => {
    const fetchData = async () => {
      const categoriesResult = await getCategoryList({});
      if (categoriesResult.success && categoriesResult.result) {
        setCategories(categoriesResult.result);
      }
    };
    
    fetchData();
  }, []);

  // Handle variant management
  const addVariant = () => {
    if (!newVariant.name.trim()) {
      toast({
        title: "Error",
        description: "Variant name is required",
        variant: "destructive"
      })
      return
    }

    // Generate SKU if not provided
    const sku = newVariant.sku || generateSKU(productName, newVariant.name)

    // If setting as default, unset others
    const updatedVariants = newVariant.is_default
      ? variants.map(v => ({ ...v, is_default: false }))
      : [...variants]

    const variant: ProductVariant = {
      ...newVariant,
      id: Date.now().toString(),
      sku,
      base_price: basePrice,
      sale_price: undefined
    }

    setVariants([...updatedVariants, variant])

    // Reset form
    setNewVariant({
      name: "",
      sku: "",
      additional_price: 0,
      stock: 0,
      weight: 0,
      is_default: false,
      dimensions: { length: 0, width: 0, height: 0 }
    })

    toast({
      title: "Variant added",
      description: `Added "${variant.name}" variant`
    })
  }

  const updateVariant = (id: string, updates: Partial<ProductVariant>) => {
    const updated = variants.map(v =>
      v.id === id ? { ...v, ...updates } : v
    )
    setVariants(updated)
  }

  const removeVariant = (id: string) => {
    const variantToRemove = variants.find(v => v.id === id)
    const updated = variants.filter(v => v.id !== id)

    // If removing default variant, set first variant as default
    if (variantToRemove?.is_default && updated.length > 0) {
      updated[0].is_default = true
    }

    setVariants(updated)

    toast({
      title: "Variant removed",
      description: `Removed "${variantToRemove?.name}" variant`
    })
  }

  const duplicateVariant = (variant: ProductVariant) => {
    const duplicate = {
      ...variant,
      id: Date.now().toString(),
      name: `${variant.name} (Copy)`,
      sku: `${variant.sku}-COPY`,
      variant_id: undefined // Remove ID for new variant
    }

    setVariants([...variants, duplicate])

    toast({
      title: "Variant duplicated",
      description: `Duplicated "${variant.name}"`
    })
  }

  const addOption = () => {
    if (!newOption.name.trim()) {
      toast({
        title: "Error",
        description: "Option name is required",
        variant: "destructive"
      })
      return
    }

    if (!newOption.value.trim()) {
      toast({
        title: "Error",
        description: "Option value is required",
        variant: "destructive"
      })
      return
    }

    const existingOption = variantOptions.find(o =>
      o.name.toLowerCase() === newOption.name.toLowerCase()
    )

    if (existingOption) {
      if (existingOption.values.includes(newOption.value)) {
        toast({
          title: "Error",
          description: "Option value already exists",
          variant: "destructive"
        })
        return
      }
      setVariantOptions(variantOptions.map(o =>
        o.name.toLowerCase() === newOption.name.toLowerCase()
          ? { ...o, values: [...o.values, newOption.value] }
          : o
      ))
    } else {
      setVariantOptions([
        ...variantOptions,
        { name: newOption.name, values: [newOption.value] }
      ])
    }

    setNewOption({ name: "", value: "" })
  }

  const removeOptionValue = (optionName: string, value: string) => {
    setVariantOptions(variantOptions.map(option =>
      option.name === optionName
        ? { ...option, values: option.values.filter(v => v !== value) }
        : option
    ))
  }

  const generateVariantsFromOptions = () => {
    const optionsMap: { [key: string]: string[] } = {}
    variantOptions.forEach(option => {
      optionsMap[option.name] = option.values
    })

    // Helper function to generate combinations
    const generateCombinations = (arrays: string[][]): string[][] => {
      const result: string[][] = []

      const combine = (current: string[], depth: number) => {
        if (depth === arrays.length) {
          result.push([...current])
          return
        }

        for (let i = 0; i < arrays[depth].length; i++) {
          current.push(arrays[depth][i])
          combine(current, depth + 1)
          current.pop()
        }
      }

      combine([], 0)
      return result
    }

    const valueArrays = Object.values(optionsMap)
    const combinations = generateCombinations(valueArrays)

    const keys = Object.keys(optionsMap)
    const newVariants = combinations.map(combo => {
      const variantData: any = {}
      keys.forEach((key, index) => {
        variantData[key.toLowerCase()] = combo[index]
      })

      const sku = generateSKU(productName, combo.join('-'))
      return {
        id: `${Date.now()}-${Math.random()}`,
        name: combo.join(' / '),
        sku,
        additional_price: 0,
        base_price: basePrice,
        sale_price: undefined,
        stock: 0,
        weight: 0,
        is_default: false,
        dimensions: { length: 0, width: 0, height: 0 },
        ...variantData
      }
    })

    setVariants([...variants, ...newVariants])

    toast({
      title: "Variants generated",
      description: `Generated ${newVariants.length} variants from options`
    })
  }

  // Handle product features
  const addFeature = () => {
    if (!newFeature.trim()) return

    const updatedFeatures = [...productFeatures, newFeature.trim()]
    setProductFeatures(updatedFeatures)
    form.setValue("product_details", updatedFeatures)
    setNewFeature("")
  }

  const removeFeature = (index: number) => {
    const updatedFeatures = productFeatures.filter((_, i) => i !== index)
    setProductFeatures(updatedFeatures)
    form.setValue("product_details", updatedFeatures)
  }

  const updateFeature = (index: number, value: string) => {
    const updatedFeatures = [...productFeatures]
    updatedFeatures[index] = value
    setProductFeatures(updatedFeatures)
    form.setValue("product_details", updatedFeatures)
  }

  // Replace the current handleImageSelect function with this improved version:
  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    const maxImages = 10
    const remainingSlots = maxImages - productImages.length

    if (remainingSlots <= 0) {
      toast({
        title: "Maximum images reached",
        description: `You can only upload ${maxImages} images maximum.`,
        variant: "destructive",
      })
      e.target.value = ''
      return
    }

    // Convert FileList to Array for easier processing
    const fileArray = Array.from(files)
    const validFiles: File[] = []
    const invalidFiles: { name: string; reason: string }[] = []

    // First, validate all files
    fileArray.slice(0, remainingSlots).forEach((file) => {
      // Check file size
      if (file.size > 10 * 1024 * 1024) {
        invalidFiles.push({
          name: file.name,
          reason: "File size exceeds 10MB limit"
        })
        return
      }

      // Check file type
      if (!file.type.startsWith('image/')) {
        invalidFiles.push({
          name: file.name,
          reason: "Not an image file"
        })
        return
      }

      validFiles.push(file)
    })

    // Show error summary if there are invalid files
    if (invalidFiles.length > 0) {
      const errorMessage = invalidFiles.length === 1
        ? `${invalidFiles[0].name}: ${invalidFiles[0].reason}`
        : `${invalidFiles.length} files were invalid and skipped`

      toast({
        title: "Some files were skipped",
        description: errorMessage,
        variant: "warning",
      })
    }

    // Create image objects for valid files
    const newImages: ProductImage[] = validFiles.map((file, index) => {
      const previewUrl = URL.createObjectURL(file)
      return {
        id: `${Date.now()}-${Math.random()}`,
        file,
        previewUrl,
        is_main: productImages.length === 0 && index === 0, // Set first valid image as main if no images exist
        is_new: true
      }
    })

    if (newImages.length > 0) {
      setProductImages(prev => [...prev, ...newImages])
      toast({
        title: "Images added",
        description: `Added ${newImages.length} image(s)${validFiles.length < fileArray.length ? ` (${fileArray.length - validFiles.length} skipped)` : ''}`,
      })
    } else if (validFiles.length === 0 && fileArray.length > 0) {
      // All files were invalid
      toast({
        title: "No valid images",
        description: "All selected files were invalid. Please select image files under 10MB.",
        variant: "destructive",
      })
    }

    // Reset input
    e.target.value = ''
  }

  // Replace the current handleDrop function with this improved version:
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)

    const files = e.dataTransfer.files
    if (!files || files.length === 0) return

    const maxImages = 10
    const remainingSlots = maxImages - productImages.length

    if (remainingSlots <= 0) {
      toast({
        title: "Maximum images reached",
        description: `You can only upload ${maxImages} images maximum.`,
        variant: "destructive",
      })
      return
    }

    // Convert FileList to Array for easier processing
    const fileArray = Array.from(files)
    const validFiles: File[] = []
    const invalidFiles: { name: string; reason: string }[] = []

    // First, validate all files
    fileArray.slice(0, remainingSlots).forEach((file) => {
      // Check file size
      if (file.size > 10 * 1024 * 1024) {
        invalidFiles.push({
          name: file.name,
          reason: "File size exceeds 10MB limit"
        })
        return
      }

      // Check file type
      if (!file.type.startsWith('image/')) {
        invalidFiles.push({
          name: file.name,
          reason: "Not an image file"
        })
        return
      }

      validFiles.push(file)
    })

    // Show error summary if there are invalid files
    if (invalidFiles.length > 0) {
      const errorMessage = invalidFiles.length === 1
        ? `${invalidFiles[0].name}: ${invalidFiles[0].reason}`
        : `${invalidFiles.length} files were invalid and skipped`

      toast({
        title: "Some files were skipped",
        description: errorMessage,
        variant: "warning",
      })
    }

    // Create image objects for valid files
    const newImages: ProductImage[] = validFiles.map((file, index) => {
      const previewUrl = URL.createObjectURL(file)
      return {
        id: `${Date.now()}-${Math.random()}`,
        file,
        previewUrl,
        is_main: productImages.length === 0 && index === 0, // Set first valid image as main if no images exist
        is_new: true
      }
    })

    if (newImages.length > 0) {
      setProductImages(prev => [...prev, ...newImages])
      toast({
        title: "Images added",
        description: `Added ${newImages.length} image(s)${validFiles.length < fileArray.length ? ` (${fileArray.length - validFiles.length} skipped)` : ''}`,
      })
    } else if (validFiles.length === 0 && fileArray.length > 0) {
      // All files were invalid
      toast({
        title: "No valid images",
        description: "All dropped files were invalid. Please drop image files under 10MB.",
        variant: "destructive",
      })
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }

  const removeImage = (id: string) => {
    const imageToRemove = productImages.find(img => img.id === id)

    if (!imageToRemove) return

    // Revoke blob URL if it exists
    if (imageToRemove?.previewUrl?.startsWith("blob:")) {
      URL.revokeObjectURL(imageToRemove.previewUrl)
    }

    // Prepare updated images array
    let updatedImages: ProductImage[]

    if (imageToRemove.product_image_id) {
      // Mark existing image as deleted
      updatedImages = productImages.map(img =>
        img.id === id ? { ...img, is_deleted: true } : img
      )
    } else {
      // Remove new image completely
      updatedImages = productImages.filter(img => img.id !== id)
    }

    // If removing main image, find new main
    if (imageToRemove.is_main) {
      const nonDeletedImages = updatedImages.filter(img => !img.is_deleted)

      if (nonDeletedImages.length > 0) {
        // Set first non-deleted image as main
        updatedImages = updatedImages.map(img => ({
          ...img,
          is_main: img.id === nonDeletedImages[0].id
        }))
      }
    }

    setProductImages(updatedImages)

    // Optional: Show toast message
    toast({
      title: imageToRemove.product_image_id ? "Image marked for deletion" : "Image removed",
      description: imageToRemove.is_main ? "Main image updated" : undefined,
      variant: imageToRemove.product_image_id ? "warning" : "default"
    })
  }

  const moveImage = (index: number, direction: 'up' | 'down') => {
    const newImages = [...productImages]
    const newIndex = direction === 'up' ? index - 1 : index + 1

    if (newIndex >= 0 && newIndex < newImages.length) {
      const temp = newImages[index]
      newImages[index] = newImages[newIndex]
      newImages[newIndex] = temp
      setProductImages(newImages)
    }
  }

  const setAsMainImage = (id: string) => {
    const updatedImages = productImages.map(img => ({
      ...img,
      is_main: img.id === id
    }))
    setProductImages(updatedImages)

    toast({
      title: "Main image updated",
      description: "This image will be displayed as the primary product image",
    })
  }

  // Handle product deletion
  const handleDeleteProduct = async () => {
    if (!productId) return

    setIsSubmitting(true)
    try {
      const result = await deleteProduct(decryptIdFromUrl(productId))
      if (result.success) {
        toast({
          title: "Success",
          description: "Product deleted successfully",
        })
        router.back();
      }
    } catch (error) {
      console.error("Error deleting product:", error)
      toast({
        title: "Error",
        description: "Failed to delete product",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
      setIsDeleteDialogOpen(false)
    }
  }

  // Main form submission
  async function onSubmit(data: ProductFormValues) {
    setIsSubmitting(true)

    try {
      // Prepare product data with variants
      const productData = {
        ...data,
        user_id: user.user_id,
        company_id: user.company_id,
        variants: variants.map(variant => ({
          variant_id: variant.variant_id,
          variant_name: variant.name,
          sku: variant.sku || generateSKU(data.product_name, variant.name),
          additional_price: variant.additional_price,
          price: calculateTotalPrice(data.base_price, variant.additional_price),
          stock: variant.stock,
          weight: variant.weight,
          is_default: variant.is_default,
          dimensions: variant.dimensions,
        })),
        default_variant_id: variants.find(v => v.is_default)?.id || variants[0]?.id
      }

      let result
      if (isEditMode && productId) {
        result = await updateProduct(String(decryptIdFromUrl(productId)), productData)
      } else {
        result = await createProduct(productData)
      }

      if (!result.success) {
        toast({
          title: "Error",
          description: result.message || `Failed to ${isEditMode ? 'update' : 'create'} product`,
          variant: "destructive",
        })
        return
      }

      const productIdResult = isEditMode && productId ? decryptIdFromUrl(productId ?? '') : result.result.product_id;

      // Upload images if any
      if (productImages.length > 0 && productIdResult) {
        const newImages = productImages.filter(img => img.is_new && img.file && !img.is_deleted)
        const existingImagesToUpdate = productImages.filter(img =>
          !img.is_new && !img.is_deleted && img.product_image_id
        )
        const imagesToDelete = productImages.filter(img => img.is_deleted && img.product_image_id)

        // Upload new images
        if (newImages.length > 0) {
          const uploadPromises = newImages.map(async (image, index) => {
            try {
              if (!image.file) return null

              const formData = new FormData()
              formData.append("product_id", String((productIdResult)))
              formData.append("user_id", String(user.user_id))
              formData.append("company_id", String(user.company_id))
              formData.append("image", image.file)
              formData.append("is_main", String(image.is_main || index === 0))

              const response = await fetch("/api/uploads/save-file/product", {
                method: "POST",
                body: formData,
              })

              if (!response.ok) {
                throw new Error(`Failed to upload image ${index + 1}`)
              }

              return await response.json()
            } catch (error) {
              console.error(`Error uploading image ${index + 1}:`, error)
              return null
            }
          })

          await Promise.all(uploadPromises)
        }

        if (existingImagesToUpdate.length > 0 && isEditMode) {
          await updateProductImages(productIdResult, existingImagesToUpdate);
        }

        if (imagesToDelete.length > 0 && isEditMode) {
          await deleteProductImages(imagesToDelete);
        }
      }

      // Success
      toast({
        title: "Success!",
        description: `Product ${isEditMode ? 'updated' : 'created'} successfully`,
      });

      // Redirect to products list
      router.back();
      router.refresh();

    } catch (error) {
      console.error(`Error ${isEditMode ? 'updating' : 'creating'} product:`, error)
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleCancel = () => {
    // Clean up blob URLs before leaving
    productImages.forEach(image => {
      if (image.previewUrl?.startsWith("blob:")) {
        URL.revokeObjectURL(image.previewUrl)
      }
    })
    router.back()
  }

  const onInvalid = () => {
    toast({
      title: "Missing required fields",
      description: "Please fix the highlighted sections before submitting.",
      variant: "destructive",
    })
  }

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      productImages.forEach(image => {
        if (image.previewUrl?.startsWith("blob:")) {
          URL.revokeObjectURL(image.previewUrl)
        }
      })
    }
  }, [productImages])

  if (isLoading) {
    return (
      <Container>
        <div className="flex items-center justify-center min-h-[400px]">
          <Loading />
        </div>
      </Container>
    )
  }

  return (
    <Container>
      <CardHeader className="px-0 pt-0">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-0">
          <div>
            <CardTitle className="flex items-center gap-2 text-xl sm:text-2xl">
              <Package className="h-5 w-5 sm:h-6 sm:w-6" />
              {isEditMode ? 'Edit Product' : 'Add New Product'}
            </CardTitle>
            <CardDescription className="text-sm">
              {isEditMode ? 'Update your product details' : 'Add a new product to your inventory'}
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            {isEditMode && (
              <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                <DialogTrigger asChild>
                  <Button
                    type="button"
                    variant="destructive"
                    disabled={isSubmitting}
                    className="flex-1 sm:flex-initial text-sm"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Delete Product</DialogTitle>
                    <DialogDescription>
                      Are you sure you want to delete this product? This action cannot be undone.
                    </DialogDescription>
                  </DialogHeader>
                  <DialogFooter>
                    <Button
                      variant="outline"
                      onClick={() => setIsDeleteDialogOpen(false)}
                      disabled={isSubmitting}
                    >
                      Cancel
                    </Button>
                    <Button
                      variant="destructive"
                      onClick={handleDeleteProduct}
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? "Deleting..." : "Delete Product"}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            )}
            <Button
              type="button"
              variant="outline"
              onClick={handleCancel}
              disabled={isSubmitting}
              className="flex-1 sm:flex-initial text-sm"
            >
              Cancel
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="px-0">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit, onInvalid)} className="space-y-6">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid grid-cols-2 sm:grid-cols-5 mb-6 sm:mb-8 h-auto">
                <TabsTrigger value="basic" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm py-2">
                  <Package className="h-3 w-3 sm:h-4 sm:w-4" />
                  <span className="hidden xs:inline">Basic Info</span>
                  <span className="xs:hidden">Basic</span>
                  {tabHasError("basic") && (
                    <span className="ml-2 h-2 w-2 rounded-full bg-red-500" />
                  )}
                </TabsTrigger>
                <TabsTrigger value="pricing" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm py-2">
                  <DollarSign className="h-3 w-3 sm:h-4 sm:w-4" />
                  <span>Pricing</span>
                  {tabHasError("pricing") && (
                    <span className="ml-2 h-2 w-2 rounded-full bg-red-500" />
                  )}
                </TabsTrigger>
                <TabsTrigger value="variants" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm py-2">
                  <Layers className="h-3 w-3 sm:h-4 sm:w-4" />
                  <span>Variants</span>
                </TabsTrigger>
                <TabsTrigger value="images" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm py-2">
                  <ImageIcon className="h-3 w-3 sm:h-4 sm:w-4" />
                  <span>Images</span>
                </TabsTrigger>
                <TabsTrigger value="seo" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm py-2">
                  <Hash className="h-3 w-3 sm:h-4 sm:w-4" />
                  <span>SEO</span>
                  {tabHasError("seo") && (
                    <span className="ml-2 h-2 w-2 rounded-full bg-red-500" />
                  )}
                </TabsTrigger>
              </TabsList>

              {/* Basic Info Tab */}
              <TabsContent value="basic" className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <DefaultFormTextField
                    form={form}
                    name="product_name"
                    label="Product Name"
                    placeholder="Enter product name"
                    disabled={isSubmitting}
                  />

                  <DefaultFormTextField
                    form={form}
                    name="product_slug"
                    label="Product Slug"
                    placeholder="URL-friendly version of the name"
                    disabled={isSubmitting}
                  />
                </div>

                <DefaultFormSelect
                  form={form}
                  name="category_id"
                  label="Category"
                  placeholder="Select a category"
                  options={categories.map(cat => ({
                    value: cat.category_id.toString(),
                    label: cat.category_name
                  }))}
                  disabled={isSubmitting}
                />

                <div className="space-y-6">
                  <DefaultFormTextArea
                    form={form}
                    name="product_description"
                    label="Product Description"
                    placeholder="Describe your product..."
                    disabled={isSubmitting}
                    className="min-h-[150px]"
                  />

                  {/* Product Features */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center gap-2">
                        <Check className="h-5 w-5" />
                        Product Features & Details
                      </CardTitle>
                      <CardDescription>
                        Add key features and specifications for your product
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex gap-2">
                        <Input
                          value={newFeature}
                          onChange={(e) => setNewFeature(e.target.value)}
                          placeholder="Add a product feature (e.g., 'Waterproof design', '2-year warranty')"
                          disabled={isSubmitting}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault()
                              addFeature()
                            }
                          }}
                        />
                        <Button
                          type="button"
                          onClick={addFeature}
                          disabled={isSubmitting || !newFeature.trim()}
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          Add
                        </Button>
                      </div>

                      {productFeatures.length > 0 ? (
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <Badge variant="outline">
                                {productFeatures.length} {productFeatures.length === 1 ? 'feature' : 'features'}
                              </Badge>
                              <span className="text-sm text-muted-foreground">
                                Features will be displayed as bullet points
                              </span>
                            </div>
                          </div>

                          <div className="border rounded-lg divide-y">
                            {productFeatures.map((feature, index) => (
                              <div key={index} className="flex items-center gap-2 p-3 hover:bg-muted/50">
                                <div className="flex-1 flex items-center gap-2">
                                  <div className="flex items-center justify-center w-5 h-5 rounded-full bg-primary/10 text-primary text-xs">
                                    {index + 1}
                                  </div>
                                  <Input
                                    value={feature}
                                    onChange={(e) => updateFeature(index, e.target.value)}
                                    className="border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0"
                                    disabled={isSubmitting}
                                  />
                                </div>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => removeFeature(index)}
                                  disabled={isSubmitting}
                                >
                                  <Minus className="h-4 w-4" />
                                </Button>
                              </div>
                            ))}
                          </div>
                        </div>
                      ) : (
                        <div className="text-center py-8 border rounded-lg">
                          <Check className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                          <p className="text-sm text-muted-foreground">
                            No features added yet. Add key features to help customers understand your product better.
                          </p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              {/* Pricing Tab */}
              <TabsContent value="pricing" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <DollarSign className="h-5 w-5" />
                      Pricing Information
                    </CardTitle>
                    <CardDescription>
                      Set your product prices and stock settings
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <DefaultFormTextField
                      form={form}
                      name="base_price"
                      label="Base Price ($)"
                      placeholder="0.00"
                      type="number"
                      step="0.01"
                      disabled={isSubmitting}
                    />

                    <DefaultFormTextField
                        form={form}
                        name="sale_price"
                        label="Sale Price ($)"
                        placeholder="0.00 (optional)"
                        type="number"
                        step="0.01"
                        disabled={isSubmitting}
                      />
                    <DefaultFormTextField
                      form={form}
                      name="sku"
                      label="Main SKU (Stock Keeping Unit)"
                      placeholder="PROD-001"
                      disabled={isSubmitting}
                    />

                    {salePrice && salePrice > 0 && basePrice > 0 && (
                      <div className="bg-muted/50 p-4 rounded-lg">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium">Price Details</p>
                            <p className="text-sm text-muted-foreground">
                              {salePrice < basePrice ? "Discount applied" : "Price increased"}
                            </p>
                          </div>
                          <div className="text-right">
                            <div className="flex items-center gap-2">
                              {salePrice < basePrice ? (
                                <>
                                  <span className="text-lg font-bold text-green-600">
                                    ${salePrice}
                                  </span>
                                  <span className="text-sm line-through text-muted-foreground">
                                    ${basePrice}
                                  </span>
                                  <span className="text-sm font-medium text-green-600">
                                    {Math.round((1 - Number(salePrice) / Number(basePrice)) * 100)}% off
                                  </span>
                                </>
                              ) : (
                                <span className="text-lg font-bold">
                                  ${salePrice}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pt-4 border-t">
                      <DefaultFormCheckbox
                        form={form}
                        name="status"
                        label="Active"
                        description="Make product visible on store"
                      />
                      <DefaultFormCheckbox
                        form={form}
                        name="is_featured"
                        label="Featured"
                        description="Highlight product on homepage"
                      />
                      <DefaultFormCheckbox
                        form={form}
                        name="allow_backorders"
                        label="Allow Backorders"
                        description="Allow purchases when out of stock"
                      />
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Variants Tab */}
              <TabsContent value="variants" className="space-y-6">
                <div className="space-y-6">
                  <Tabs value={activeVariantTab} onValueChange={(v: any) => setActiveVariantTab(v)}>
                    <TabsList className="grid grid-cols-3 mb-6">
                      <TabsTrigger value="single" className="flex items-center gap-2">
                        <Plus className="h-4 w-4" />
                        Single
                      </TabsTrigger>
                      <TabsTrigger value="bulk" className="flex items-center gap-2">
                        <Layers className="h-4 w-4" />
                        Bulk Generate
                      </TabsTrigger>
                      <TabsTrigger value="options" className="flex items-center gap-2">
                        <Tag className="h-4 w-4" />
                        Options
                      </TabsTrigger>
                    </TabsList>

                    {/* Single Variant Tab */}
                    <TabsContent value="single" className="space-y-6">
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-lg flex items-center gap-2">
                            <Plus className="h-5 w-5" />
                            Add New Variant
                          </CardTitle>
                          <CardDescription>
                            Add individual variant with custom pricing and stock
                          </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            <div className="space-y-2">
                              <Label htmlFor="variant-name">Variant Name *</Label>
                              <Input
                                id="variant-name"
                                value={newVariant.name}
                                onChange={(e) => setNewVariant({ ...newVariant, name: e.target.value })}
                                placeholder="e.g., Large / Black"
                                disabled={isSubmitting}
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="variant-sku">SKU</Label>
                              <div className="flex gap-2">
                                <Input
                                  id="variant-sku"
                                  value={newVariant.sku}
                                  onChange={(e) => setNewVariant({ ...newVariant, sku: e.target.value })}
                                  placeholder="Auto-generated"
                                  disabled={isSubmitting}
                                />
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="icon"
                                  onClick={() => setNewVariant({
                                    ...newVariant,
                                    sku: generateSKU(productName, newVariant.name)
                                  })}
                                  disabled={isSubmitting}
                                >
                                  <RefreshCw className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="additional-price">
                                Additional Price
                                <span className="ml-2 text-xs text-muted-foreground">
                                  (Base: ${basePrice})
                                </span>
                              </Label>
                              <div className="flex items-center">
                                <span className="mr-2">$</span>
                                <Input
                                  id="additional-price"
                                  type="number"
                                  step="0.01"
                                  value={newVariant.additional_price}
                                  onChange={(e) => setNewVariant({
                                    ...newVariant,
                                    additional_price: parseFloat(e.target.value)
                                  })}
                                  placeholder="0.00"
                                  disabled={isSubmitting}
                                />
                              </div>
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="variant-stock">Stock Quantity</Label>
                              <Input
                                id="variant-stock"
                                type="number"
                                value={newVariant.stock}
                                onChange={(e) => setNewVariant({
                                  ...newVariant,
                                  stock: parseInt(e.target.value)
                                })}
                                placeholder="0"
                                disabled={isSubmitting}
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="variant-weight">Weight (Kg)</Label>
                              <Input
                                id="variant-weight"
                                type="number"
                                step="0.01"
                                value={newVariant.weight}
                                onChange={(e) => setNewVariant({
                                  ...newVariant,
                                  weight: parseFloat(e.target.value)
                                })}
                                placeholder="0.00"
                                disabled={isSubmitting}
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="variant-dimensions">Dimensions (cm)</Label>
                              <div className="grid grid-cols-3 gap-2">
                                <Input
                                  placeholder="L"
                                  type="number"
                                  step="0.1"
                                  value={newVariant.dimensions?.length || 0}
                                  onChange={(e) => setNewVariant({
                                    ...newVariant,
                                    dimensions: {
                                      ...newVariant.dimensions!,
                                      length: parseFloat(e.target.value)
                                    }
                                  })}
                                  disabled={isSubmitting}
                                />
                                <Input
                                  placeholder="W"
                                  type="number"
                                  step="0.1"
                                  value={newVariant.dimensions?.width || 0}
                                  onChange={(e) => setNewVariant({
                                    ...newVariant,
                                    dimensions: {
                                      ...newVariant.dimensions!,
                                      width: parseFloat(e.target.value)
                                    }
                                  })}
                                  disabled={isSubmitting}
                                />
                                <Input
                                  placeholder="H"
                                  type="number"
                                  step="0.1"
                                  value={newVariant.dimensions?.height || 0}
                                  onChange={(e) => setNewVariant({
                                    ...newVariant,
                                    dimensions: {
                                      ...newVariant.dimensions!,
                                      height: parseFloat(e.target.value)
                                    }
                                  })}
                                  disabled={isSubmitting}
                                />
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                              <Switch
                                id="is-default"
                                checked={newVariant.is_default}
                                onCheckedChange={(checked) =>
                                  setNewVariant({ ...newVariant, is_default: checked })
                                }
                                disabled={isSubmitting}
                              />
                              <Label htmlFor="is-default">
                                Set as default variant
                              </Label>
                            </div>

                            <Button
                              type="button"
                              onClick={addVariant}
                              disabled={isSubmitting || !newVariant.name.trim()}
                              className="ml-auto"
                            >
                              <Plus className="h-4 w-4 mr-2" />
                              Add Variant
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    </TabsContent>

                    {/* Bulk Generate Tab */}
                    <TabsContent value="bulk" className="space-y-6">
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-lg flex items-center gap-2">
                            <Layers className="h-5 w-5" />
                            Generate Multiple Variants
                          </CardTitle>
                          <CardDescription>
                            Create variants from predefined options (Size, Color, etc.)
                          </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {variantOptions.map((option) => (
                              <div key={option.name} className="border rounded-lg p-4">
                                <div className="flex items-center justify-between mb-2">
                                  <h4 className="font-medium flex items-center gap-2">
                                    <Tag className="h-4 w-4" />
                                    {option.name}
                                  </h4>
                                  <Badge variant="secondary">
                                    {option.values.length} values
                                  </Badge>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                  {option.values.map((value) => (
                                    <Badge key={value} variant="outline" className="px-3 py-1">
                                      {value}
                                    </Badge>
                                  ))}
                                </div>
                              </div>
                            ))}
                          </div>

                          <div className="bg-muted/50 p-4 rounded-lg">
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="font-medium">Estimated Variants</p>
                                <p className="text-sm text-muted-foreground">
                                  {variantOptions.reduce((acc, option) => acc * option.values.length, 1)} variants will be created
                                </p>
                              </div>
                              <Button
                                type="button"
                                onClick={generateVariantsFromOptions}
                                disabled={isSubmitting || variantOptions.length === 0}
                              >
                                <RefreshCw className="h-4 w-4 mr-2" />
                                Generate Variants
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </TabsContent>

                    {/* Options Management Tab */}
                    <TabsContent value="options" className="space-y-6">
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-lg flex items-center gap-2">
                            <Tag className="h-5 w-5" />
                            Manage Variant Options
                          </CardTitle>
                          <CardDescription>
                            Define options like Size, Color, Material, etc.
                          </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="space-y-2">
                              <Label htmlFor="option-name">Option Name</Label>
                              <Input
                                id="option-name"
                                value={newOption.name}
                                onChange={(e) => setNewOption({ ...newOption, name: e.target.value })}
                                placeholder="e.g., Size, Color"
                                disabled={isSubmitting}
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="option-value">Option Value</Label>
                              <Input
                                id="option-value"
                                value={newOption.value}
                                onChange={(e) => setNewOption({ ...newOption, value: e.target.value })}
                                placeholder="e.g., Large, Red"
                                disabled={isSubmitting}
                              />
                            </div>
                            <div className="flex items-end">
                              <Button
                                type="button"
                                onClick={addOption}
                                disabled={isSubmitting || !newOption.name.trim() || !newOption.value.trim()}
                                className="w-full"
                              >
                                <Plus className="h-4 w-4 mr-2" />
                                Add Option
                              </Button>
                            </div>
                          </div>

                          <div className="space-y-4">
                            <h4 className="font-medium">Current Options</h4>
                            {variantOptions.map((option) => (
                              <div key={option.name} className="border rounded-lg p-4 space-y-3">
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-2">
                                    <Tag className="h-4 w-4" />
                                    <span className="font-medium">{option.name}</span>
                                  </div>
                                  <Badge variant="secondary">
                                    {option.values.length} values
                                  </Badge>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                  {option.values.map((value) => (
                                    <Badge key={value} variant="outline" className="px-3 py-1 group">
                                      {value}
                                      <button
                                        onClick={() => removeOptionValue(option.name, value)}
                                        className="ml-2 opacity-0 group-hover:opacity-100 transition-opacity"
                                        disabled={isSubmitting}
                                      >
                                        <Minus className="h-3 w-3" />
                                      </button>
                                    </Badge>
                                  ))}
                                </div>
                              </div>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    </TabsContent>
                  </Tabs>

                  {/* Variants List */}
                  {variants.length > 0 && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Package className="h-5 w-5" />
                            Product Variants ({variants.length})
                          </div>
                          <Badge variant="outline">
                            {variants.filter(v => v.is_default).length} default
                          </Badge>
                        </CardTitle>
                        <CardDescription>
                          Manage pricing, stock, and settings for each variant
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="overflow-x-auto">
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead className="w-[50px]">#</TableHead>
                                <TableHead>Variant</TableHead>
                                <TableHead>SKU</TableHead>
                                <TableHead>Price</TableHead>
                                <TableHead>Stock</TableHead>
                                <TableHead>Weight</TableHead>
                                <TableHead className="text-center">Default</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {variants.map((variant, index) => (
                                <TableRow key={variant.id}>
                                  <TableCell>
                                    <Badge variant="secondary">{index + 1}</Badge>
                                  </TableCell>
                                  <TableCell className="font-medium">
                                    <div className="flex items-center gap-2">
                                      <span>{variant.name}</span>
                                      {variant.is_default && (
                                        <Badge className="text-xs">Default</Badge>
                                      )}
                                    </div>
                                  </TableCell>
                                  <TableCell>
                                    <div className="flex items-center gap-2">
                                      <Hash className="h-3 w-3 text-muted-foreground" />
                                      <code className="text-xs">{variant.sku || generateSKU(productName, variant.name)}</code>
                                    </div>
                                  </TableCell>
                                  <TableCell>
                                    <div className="space-y-1">
                                      <div className="flex items-center gap-1">
                                        <DollarSign className="h-3 w-3 text-muted-foreground" />
                                        <span className="font-medium">
                                          {calculateTotalPrice(basePrice, variant.additional_price)}
                                        </span>
                                      </div>
                                      {variant.additional_price > 0 && (
                                        <span className="text-xs text-green-600">
                                          (+${variant.additional_price})
                                        </span>
                                      )}
                                    </div>
                                  </TableCell>
                                  <TableCell>
                                    <Input
                                      type="number"
                                      value={variant.stock}
                                      onChange={(e) => updateVariant(variant.id, {
                                        stock: parseInt(e.target.value)
                                      })}
                                      className="w-24"
                                      disabled={isSubmitting}
                                    />
                                  </TableCell>
                                  <TableCell>
                                    <Input
                                      type="number"
                                      step="0.01"
                                      value={variant.weight}
                                      onChange={(e) => updateVariant(variant.id, {
                                        weight: parseFloat(e.target.value)
                                      })}
                                      className="w-24"
                                      disabled={isSubmitting}
                                    />
                                  </TableCell>
                                  <TableCell className="text-center">
                                    <Switch
                                      checked={variant.is_default}
                                      onCheckedChange={(checked) => {
                                        const updated = variants.map(v => ({
                                          ...v,
                                          is_default: v.id === variant.id ? checked : false
                                        }))
                                        setVariants(updated)
                                      }}
                                      disabled={isSubmitting}
                                    />
                                  </TableCell>
                                  <TableCell className="text-right">
                                    <div className="flex justify-end gap-2">
                                      <Button
                                        type="button"
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => duplicateVariant(variant)}
                                        disabled={isSubmitting}
                                      >
                                        <Copy className="h-4 w-4" />
                                      </Button>
                                      <Button
                                        type="button"
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => removeVariant(variant.id)}
                                        disabled={isSubmitting || (variants.length === 1)}
                                      >
                                        <Minus className="h-4 w-4" />
                                      </Button>
                                    </div>
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </div>

                        {/* Summary */}
                        <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div className="bg-muted/50 p-4 rounded-lg">
                            <p className="text-sm font-medium">Total Variants</p>
                            <p className="text-2xl font-bold">{variants.length}</p>
                          </div>
                          <div className="bg-muted/50 p-4 rounded-lg">
                            <p className="text-sm font-medium">Total Stock</p>
                            <p className="text-2xl font-bold">
                              {variants.reduce((sum, v) => Number(sum) + Number(v.stock), 0)}
                            </p>
                          </div>
                          <div className="bg-muted/50 p-4 rounded-lg">
                            <p className="text-sm font-medium">Price Range</p>
                            <p className="text-2xl font-bold">
                              ${calculateTotalPrice(basePrice,
                                Math.min(...variants.map(v => v.additional_price))
                              )} - ${calculateTotalPrice(basePrice,
                                Math.max(...variants.map(v => v.additional_price))
                              )}
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </div>
              </TabsContent>

              {/* Images Tab */}
              <TabsContent value="images" className="space-y-6">
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription className="text-sm">
                    First image will be used as the main product image. You can upload up to 10 images. Recommended size: 1200x1600px
                  </AlertDescription>
                </Alert>

                {/* Upload Area */}
                <div
                  className={`
                    border-2 border-dashed rounded-lg p-4 sm:p-6 lg:p-8 text-center transition-all duration-200
                    ${isDragging ? 'border-primary bg-primary/5' : 'border-gray-300'}
                    ${isSubmitting || productImages.length >= 10 ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:border-primary/50'}
                  `}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={productImages.length >= 10 ? undefined : handleDrop}
                  onClick={() => {
                    if (!isSubmitting && productImages.length < 10) {
                      document.getElementById('multiple-image-input')?.click()
                    }
                  }}
                >
                  <div className="flex flex-col items-center gap-2 sm:gap-3">
                    <div className="p-3 sm:p-4 bg-gray-100 rounded-full">
                      <Upload className="w-8 h-8 sm:w-10 sm:h-10 text-gray-400" />
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-gray-600">
                        {productImages.length >= 10
                          ? 'Maximum images reached (10/10)'
                          : isDragging
                            ? 'Drop images here'
                            : 'Click to upload or drag and drop multiple images'}
                      </p>
                      <p className="text-xs text-gray-500">
                        PNG, JPG, GIF up to 10MB each • {productImages.length}/10 images uploaded
                        {productImages.length >= 10 && ' • Remove some images to upload more'}
                      </p>
                    </div>
                  </div>
                  <input
                    id="multiple-image-input"
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleImageSelect}
                    className="hidden"
                    disabled={isSubmitting || productImages.length >= 10}
                  />
                </div>

                {/* Image Grid */}
                {productImages.length > 0 && (
                  <Card>
                    <CardHeader>
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                        <div>
                          <CardTitle className="text-lg flex items-center gap-2">
                            <ImageIcon className="h-5 w-5" />
                            Product Images ({productImages.length}/10)
                          </CardTitle>
                          <CardDescription>
                            {isEditMode ? 'Existing images are marked with a blue border. New uploads have a green border.' : 'Drag to reorder or set main image. First image is displayed as primary.'}
                          </CardDescription>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">
                            {productImages.filter(img => img.is_main).length} main
                          </Badge>
                          {isEditMode && (
                            <>
                              <Badge variant="secondary" className="border-blue-500">
                                {productImages.filter(img => !img.is_new && !img.is_deleted).length} existing
                              </Badge>
                              <Badge variant="secondary" className="border-green-500">
                                {productImages.filter(img => img.is_new).length} new
                              </Badge>
                            </>
                          )}
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4">
                        {productImages.map((image, index) => (
                          <div key={image.id} className="relative group">
                            <div className={`
                              aspect-square relative overflow-hidden rounded-lg border-2
                              ${image.is_deleted ? 'border-destructive/50 opacity-50' :
                                image.is_new ? 'border-green-500' :
                                  !image.is_new ? 'border-blue-500' : 'border-gray-200'}
                            `}>
                              <img
                                src={image.previewUrl}
                                alt={`Product ${index + 1}`}
                                className="object-cover w-full h-full"
                              />

                              {image.is_deleted && (
                                <div className="absolute inset-0 bg-destructive/10 flex items-center justify-center">
                                  <Trash2 className="h-8 w-8 text-destructive" />
                                </div>
                              )}

                              {/* Status Badges */}
                              <div className="absolute top-2 left-2 flex flex-col gap-1">
                                {image.is_main && (
                                  <Badge className="bg-primary text-xs px-2 py-0.5">Main</Badge>
                                )}
                                {isEditMode && image.is_new && (
                                  <Badge className="bg-green-500 text-xs px-2 py-0.5">New</Badge>
                                )}
                                {isEditMode && image.is_deleted && (
                                  <Badge className="bg-destructive text-xs px-2 py-0.5">Deleted</Badge>
                                )}
                              </div>

                              {/* Position Badge */}
                              <div className="absolute top-2 right-2">
                                <Badge variant="secondary" className="text-xs px-2 py-0.5">
                                  #{index + 1}
                                </Badge>
                              </div>

                              {/* Hover Overlay */}
                              <div className="absolute inset-0 bg-black/70 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2 p-3">
                                {!image.is_deleted && (
                                  <>
                                    <div className="flex gap-1">
                                      <Button
                                        type="button"
                                        size="sm"
                                        variant="secondary"
                                        onClick={() => moveImage(index, 'up')}
                                        disabled={index === 0 || isSubmitting}
                                        className="h-8 w-8 p-0"
                                      >
                                        <ArrowUp className="h-4 w-4" />
                                      </Button>
                                      <Button
                                        type="button"
                                        size="sm"
                                        variant="secondary"
                                        onClick={() => moveImage(index, 'down')}
                                        disabled={index === productImages.length - 1 || isSubmitting}
                                        className="h-8 w-8 p-0"
                                      >
                                        <ArrowDown className="h-4 w-4" />
                                      </Button>
                                    </div>

                                    {!image.is_main && (
                                      <Button
                                        type="button"
                                        size="sm"
                                        onClick={() => setAsMainImage(image.id)}
                                        disabled={isSubmitting}
                                        className="h-8 text-xs"
                                      >
                                        Set as Main
                                      </Button>
                                    )}
                                  </>
                                )}

                                <Button
                                  type="button"
                                  size="sm"
                                  variant={image.is_deleted ? "default" : "destructive"}
                                  onClick={() => {
                                    if (image.is_deleted) {
                                      const updatedImages = productImages.map(img =>
                                        img.id === image.id ? { ...img, is_deleted: false } : img
                                      )
                                      setProductImages(updatedImages)
                                    } else {
                                      removeImage(image.id)
                                    }
                                  }}
                                  disabled={isSubmitting || (image.is_main && productImages.filter(img => !img.is_deleted).length === 1)}
                                  className="h-8 w-8 p-0 absolute top-2 right-2"
                                >
                                  {image.is_deleted ? (
                                    <Plus className="h-4 w-4" />
                                  ) : (
                                    <Trash2 className="h-4 w-4" />
                                  )}
                                </Button>

                                {image.is_deleted && (
                                  <p className="text-xs text-center text-white mt-2">
                                    Click trash to restore
                                  </p>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Image Summary */}
                      {productImages.length > 1 && (
                        <div className="mt-6 pt-6 border-t">
                          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 text-sm">
                            <div className="flex items-center gap-4">
                              <div className="flex items-center gap-2">
                                <span className="font-medium">Status:</span>
                                <div className="flex items-center gap-3">
                                  <div className="flex items-center gap-1">
                                    <div className="w-3 h-3 rounded-full bg-blue-500" />
                                    <span className="text-xs">Existing</span>
                                  </div>
                                  <div className="flex items-center gap-1">
                                    <div className="w-3 h-3 rounded-full bg-green-500" />
                                    <span className="text-xs">New</span>
                                  </div>
                                  <div className="flex items-center gap-1">
                                    <div className="w-3 h-3 rounded-full bg-destructive" />
                                    <span className="text-xs">Deleted</span>
                                  </div>
                                </div>
                              </div>
                            </div>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                const updated = productImages.map(img => {
                                  if (img.previewUrl?.startsWith("blob:")) {
                                    URL.revokeObjectURL(img.previewUrl)
                                  }
                                  return { ...img, is_deleted: true }
                                })
                                setProductImages(updated)
                              }}
                              disabled={isSubmitting}
                            >
                              Mark All for Deletion
                            </Button>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              {/* SEO Tab */}
              <TabsContent value="seo" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <TrendingUp className="h-5 w-5" />
                      SEO Optimization
                    </CardTitle>
                    <CardDescription>
                      Optimize your product for search engines to improve visibility
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Hash className="h-4 w-4" />
                          <label className="text-sm font-medium">Meta Title</label>
                        </div>
                        <Badge variant={(form.watch("meta_title") ?? '').length > 60 ? "destructive" : (form.watch("meta_title") ?? '').length >= 50 ? "secondary" : "outline"}>
                          {(form.watch("meta_title") ?? '').length}/60
                        </Badge>
                      </div>
                      <DefaultFormTextField
                        form={form}
                        name="meta_title"
                        placeholder="Best Product | Your Brand Name"
                        disabled={isSubmitting}
                      />
                      <p className="text-xs text-muted-foreground">
                        Recommended: 50-60 characters. Include primary keywords.
                      </p>
                    </div>

                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Eye className="h-4 w-4" />
                          <label className="text-sm font-medium">Meta Description</label>
                        </div>
                        <Badge variant={(form.watch("meta_description") ?? '').length > 160 ? "destructive" : (form.watch("meta_description") ?? '').length >= 150 ? "secondary" : "outline"}>
                          {(form.watch("meta_description") ?? '').length}/160
                        </Badge>
                      </div>
                      <DefaultFormTextArea
                        form={form}
                        name="meta_description"
                        placeholder="Discover our premium product with unique features..."
                        disabled={isSubmitting}
                        className="min-h-[100px]"
                      />
                      <p className="text-xs text-muted-foreground">
                        Recommended: 150-160 characters. Write a compelling description with keywords.
                      </p>
                    </div>

                    {/* Preview Section */}
                    <div className="border rounded-lg p-4 space-y-2">
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium">Search Engine Preview</h4>
                        <Badge variant="outline">Preview</Badge>
                      </div>

                      <div className="space-y-1">
                        <div className="text-blue-600 text-sm font-medium truncate">
                          {form.watch("meta_title") || "Your Product Title Here"}
                        </div>
                        <div className="text-green-700 text-xs truncate">
                          https://yourstore.com/products/{form.watch("product_slug") || "product-slug"}
                        </div>
                        <div className="text-gray-600 text-xs line-clamp-2">
                          {form.watch("meta_description") || "Your product description will appear here in search results..."}
                        </div>
                      </div>
                    </div>

                    {/* SEO Tips */}
                    <div className="bg-muted/50 rounded-lg p-4">
                      <h4 className="font-medium mb-2">SEO Tips</h4>
                      <ul className="text-sm space-y-1 text-muted-foreground">
                        <li>• Include primary keywords in the title and description</li>
                        <li>• Keep titles concise and compelling</li>
                        <li>• Write unique descriptions for each product</li>
                        <li>• Use natural language, avoid keyword stuffing</li>
                        <li>• Include calls to action in descriptions</li>
                      </ul>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>

            <Separator />

            {/* Form Actions */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex items-center gap-2 text-xs sm:text-sm text-muted-foreground">
                <AlertCircle className="h-3 w-3 sm:h-4 sm:w-4" />
                <span>All fields marked with * are required</span>
              </div>

              <div className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleCancel}
                  disabled={isSubmitting}
                  className="flex-1 sm:flex-initial text-sm"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 sm:flex-initial min-w-[120px] text-sm"
                >
                  {isSubmitting ? (
                    <>
                      <span className="mr-2">{isEditMode ? 'Updating...' : 'Creating...'}</span>
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      {isEditMode ? 'Update Product' : 'Create Product'}
                    </>
                  )}
                </Button>
              </div>
            </div>
          </form>
        </Form>
      </CardContent>
    </Container>
  )
}
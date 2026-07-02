'use client'

import { Button } from "@/components/ui/button"
import { Form } from "@/components/ui/form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import Loading from "@/app/dashboard/loading";
import { useState } from "react";
import { DefaultFormTextArea, DefaultFormTextField } from "@/components/ui/default-form-field";
import { CardContent, CardDescription, CardTitle, CardHeader } from "@/components/ui/card";
import { createCategory } from "@/lib/actions/category";
import { useRouter } from "next/navigation";
import { Container } from "@/components/ui/container";
import ImageUploader, { UploaderFile } from "@/components/image-uploader";
import { useUser } from "@/contexts/user-context";

const CategoryFormSchema = z.object({
  category_name: z.string()
    .min(2, "Category name must be at least 2 characters")
    .max(150, "Category name must be less than 150 characters"),
  category_description: z.string()
    .min(2, "Description must be at least 2 characters")
    .max(255, "Description must be less than 255 characters")
    .optional()
    .or(z.literal('')),
});

export type CategoryFormValues = z.infer<typeof CategoryFormSchema>;

export default function AddCategory() {
  const [loading, setLoading] = useState(false);
  const [categoryFile, setCategoryFile] = useState<UploaderFile | null>(null);
  const { toast } = useToast();
  const router = useRouter();
  const { user } = useUser(); 

  const defaultValues: Partial<CategoryFormValues> = {};

  const form = useForm<CategoryFormValues>({
    resolver: zodResolver(CategoryFormSchema),
    defaultValues,
  });

  async function onSubmit(data: CategoryFormValues) {
    setLoading(true);
    
    try {
      const result = await createCategory(data);
      
      if (!result.success) {
        toast({
          title: "Error",
          description: result.message || "Failed to create category",
          variant: "destructive",
        });
        return;
      }

      if (categoryFile?.file && result.result && typeof result.result === 'object' && 'category_id' in result.result) {
        try {
          const formData = new FormData();
          formData.append("category_id", String((result.result as any).category_id));
          formData.append("user_id", String(user.user_id));
          formData.append("company_id", String(user.company_id));
          formData.append("image", categoryFile.file);

          const uploadResponse = await fetch("/api/uploads/save-file/category", {
            method: "POST",
            body: formData,
          });

          if (!uploadResponse.ok) {
            const errorData = await uploadResponse.json();
            console.warn("Image upload failed:", errorData);
            toast({
              title: "Category created with warning",
              description: "Category was created but image upload failed",
              variant: "default",
            });
          }
        } catch (uploadError) {
          console.error("Image upload error:", uploadError);
          toast({
            title: "Category created with warning",
            description: "Category was created but image upload failed",
            variant: "default",
          });
        }
      }

      toast({
        title: "Success",
        description: result.message || "Category created successfully",
      });
      
      router.back();
    } catch (error) {
      console.error("Error creating category:", error);
      toast({
        title: "Error",
        description: "Failed to create category",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }

  const handleCancel = () => {
    router.back();
  };

  if (loading) {
    return (
      <Container>
        <div className="flex items-center justify-center min-h-[400px]">
          <Loading />
        </div>
      </Container>
    );
  }

  return (
    <Container>
      <CardHeader className="px-0 pt-0">
        <CardTitle>Add Category</CardTitle> {/* Fixed title */}
        <CardDescription>
          Add a new category to the system {/* Fixed description */}
        </CardDescription>
      </CardHeader>
      <CardContent className="px-0">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="space-y-4">
              {/* Add Image Uploader component */}
              <div>
                <ImageUploader
                  label="Category Image"
                  onChange={(file, url) => {
                    if (file && url) {
                      setCategoryFile({ file, previewUrl: url });
                    } else {
                      setCategoryFile(null);
                    }
                  }}
                  required={false}
                />
                <p className="text-sm text-muted-foreground mt-1">
                  Upload an image for the category (optional)
                </p>
              </div>

              <DefaultFormTextField
                form={form}
                name="category_name"
                label="Category Name"
                placeholder="Enter category name"
                disabled={loading}
              />

              <DefaultFormTextArea
                form={form}
                name="category_description"
                label="Description"
                placeholder="Enter category description"
                disabled={loading}
                className="min-h-[100px]"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={handleCancel}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={loading}
                className="min-w-[120px]"
              >
                {loading ? (
                  <>
                    <span className="mr-2">Creating...</span>
                  </>
                ) : (
                  "Add Category"
                )}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Container>
  );
}
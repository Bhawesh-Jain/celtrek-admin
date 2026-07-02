'use client'

import { Button } from "@/components/ui/button"
import { Form } from "@/components/ui/form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useToast } from "@/hooks/use-toast";
import Loading from "@/app/dashboard/loading";
import { useEffect, useState } from "react";
import { DefaultFormTextArea, DefaultFormTextField } from "@/components/ui/default-form-field";
import { CardContent, CardDescription, CardTitle, CardHeader } from "@/components/ui/card";
import { updateCategory, getCategoryById } from "@/lib/actions/category";
import { useParams, useRouter } from "next/navigation";
import { Container } from "@/components/ui/container";
import { Category } from "@/lib/repositories/categoryRepository";
import { decryptIdFromUrl } from "@/lib/utils/crypto";
import { CategoryFormValues } from "../../add/page";
import ImageUploader, { UploaderFile } from "@/components/image-uploader";
import { useUser } from "@/contexts/user-context";
import z from "zod";

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

export default function EditCategory() {
  const { toast } = useToast();
  const { user } = useUser();
  const router = useRouter();
  const params = useParams();

  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [category, setCategory] = useState<Category>();
  const [categoryFile, setCategoryFile] = useState<UploaderFile | null>(null);

  const form = useForm<CategoryFormValues>({
    resolver: zodResolver(CategoryFormSchema),
    defaultValues: {
      category_name: "",
      category_description: "",
    },
  });

  useEffect(() => {
    if (category) {
      form.reset({
        category_name: category.category_name || "",
        category_description: category.category_description || "",
      });
    }
  }, [category, form]);

  useEffect(() => {
    if (!params.id) {
      toast({
        title: "Error",
        description: "Category ID is missing",
        variant: "destructive",
      });
      router.back();
      return;
    }

    const fetchCategory = async () => {
      setIsLoading(true);
      try {
        const categoryId = decryptIdFromUrl(params.id.toString());

        if (!categoryId) {
          throw new Error("Invalid category ID");
        }

        const result = await getCategoryById(categoryId);

        if (!result.success) {
          toast({
            title: "Error",
            description: result.message || "Failed to fetch category",
            variant: "destructive",
          });
          router.back();
          return;
        }

        if (!result.result) {
          toast({
            title: "Not Found",
            description: "Category not found",
            variant: "destructive",
          });
          router.back();
          return;
        }

        setCategory(result.result);

      } catch (error: any) {
        console.error("Error fetching category:", error);
        toast({
          title: "Error",
          description: error?.message || "An unexpected error occurred",
          variant: "destructive",
        });
        router.back();
      } finally {
        setIsLoading(false);
      }
    };

    fetchCategory();
  }, [params.id, router, toast]);

  async function onSubmit(data: CategoryFormValues) {
    if (!category || !params.id) return;

    setIsSubmitting(true);
    try {
      const categoryId = decryptIdFromUrl(params.id.toString());

      if (!categoryId) {
        throw new Error("Invalid category ID");
      }

      if (categoryFile?.file) {
        const formData = new FormData();
        formData.append("category_id", String(categoryId));
        formData.append("user_id", String(user.user_id));
        formData.append("company_id", String(user.company_id));
        formData.append("image", categoryFile.file);

        await fetch("/api/uploads/save-file/category", { method: "POST", body: formData });
      }

      const result = await updateCategory(categoryId, data);

      if (result.success) {
        toast({
          title: "Success",
          description: result.message || "Category updated successfully",
        });
        router.back();
        router.refresh();
      } else {
        toast({
          title: "Error",
          description: result.message || "Failed to update category",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      console.error("Error updating category:", error);
      toast({
        title: "Error",
        description: error?.message || "Failed to update category",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  const handleCancel = () => {
    router.back();
  };

  if (isLoading) {
    return (
      <Container>
        <div className="flex items-center justify-center min-h-[400px]">
          <Loading />
        </div>
      </Container>
    );
  }

  if (!category) {
    return (
      <Container>
        <CardContent>
          <div className="text-center py-8">
            <h3 className="text-lg font-semibold mb-2">Category not found</h3>
            <p className="text-muted-foreground mb-4">
              The category you&#39;re trying to edit doesn&#39;t exist or you don&#39;t have access to it.
            </p>
            <Button onClick={() => router.back()}>
              Back to Categories
            </Button>
          </div>
        </CardContent>
      </Container>
    );
  }

  return (
    <Container>
      <CardHeader className="px-0 pt-0">
        <CardTitle>Edit Category</CardTitle>
        <CardDescription>
          Update the details for {category.category_name}
        </CardDescription>
      </CardHeader>
      <CardContent className="px-0">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="space-y-4">
              <div>
                <ImageUploader
                  label="Category Image"
                  existingUrl={category?.category_image ? category.category_image : undefined}
                  onChange={(file, url) => {
                    if (file && url) {
                      setCategoryFile({ file, previewUrl: url });
                    }
                  }}
                />
              </div>

              <DefaultFormTextField
                form={form}
                name="category_name"
                label="Category Name"
                placeholder="Enter category name"
                disabled={isSubmitting}
              />

              <DefaultFormTextArea
                form={form}
                name="category_description"
                label="Description"
                placeholder="Enter category description (optional)"
                disabled={isSubmitting}
                className="min-h-[100px]"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={handleCancel}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="min-w-[120px]"
              >
                {isSubmitting ? (
                  <>
                    <span className="mr-2">Updating...</span>
                  </>
                ) : (
                  "Update Category"
                )}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Container>
  );
}
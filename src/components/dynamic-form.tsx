'use client'

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";import { createFormSchema } from "@/lib/form-builder-utils";
import { useFormBuilder } from "@/hooks/use-form-builder";
import { FormBuilder } from "./form-builder";
import { FormField } from "@/types/form-builder";
import { Container } from "./ui/container";

interface DynamicFormProps {
  title: string;
  description?: string;
  fields: FormField[];
  onSubmit: (data: any) => Promise<void>;
  submitButtonText?: string;
  defaultValues?: Record<string, any>;
}

export function DynamicForm({
  title,
  description,
  fields,
  onSubmit,
  submitButtonText = "Submit",
  defaultValues = {}
}: DynamicFormProps) {
  const [loading, setLoading] = useState(false);
  
  const formSchema = createFormSchema(fields);
  formSchema.defaultValues = defaultValues;
  
  const form = useFormBuilder(formSchema);

  const handleSubmit = async (data: any) => {
    try {
      setLoading(true);
      await onSubmit(data);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        {description && (
          <p className="text-sm text-gray-500">{description}</p>
        )}
      </CardHeader>
      <CardContent>
        <FormBuilder
          schema={formSchema}
          form={form}
          onSubmit={handleSubmit}
          loading={loading}
          submitButtonText={submitButtonText}
          showSubmitButton={true}
          gridColumns={2}
        />
      </CardContent>
    </Container>
  );
}
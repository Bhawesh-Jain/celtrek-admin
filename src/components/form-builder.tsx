'use client'

import { Form } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";
import { 
  DefaultFormTextField,
  DefaultFormTextArea,
  DefaultFormSelect,
  DefaultFormDatePicker,
  DefaultFormTimeField
} from "@/components/ui/default-form-field";
import { FormBuilderProps, FormField } from "@/types/form-builder";

export function FormBuilder({
  schema,
  form,
  onSubmit,
  loading = false,
  submitButtonText = "Submit",
  showSubmitButton = true,
  gridColumns = 2,
  className
}: FormBuilderProps) {
  
  const gridCols = {
    1: "grid-cols-1",
    2: "grid-cols-1 md:grid-cols-2",
    3: "grid-cols-1 md:grid-cols-3",
    4: "grid-cols-1 md:grid-cols-4"
  }[gridColumns];

  const renderField = (field: FormField) => {
    const commonProps = {
      key: field.name,
      label: field.label,
      name: field.name,
      form,
      placeholder: field.placeholder,
      disabled: field.disabled || loading,
      className: field.className
    };

    switch (field.type) {
      case 'text':
        return (
          <DefaultFormTextField
            {...commonProps}
            uppercase={field.uppercase}
            capitalize={field.capitalize}
            step={field.step}
          />
        );

      case 'textarea':
        return (
          <DefaultFormTextArea
            {...commonProps}
            rows={field.rows}
            form={form}
          />
        );

      case 'select':
        return (
          <DefaultFormSelect
            {...commonProps}
            options={field.options || []}
          />
        );

      case 'date':
        return (
          <DefaultFormDatePicker
            {...commonProps}
            subYear={field.subYear}
            minToday={field.minToday}
            maxToday={field.maxToday}
          />
        );

      case 'time':
        return (
          <DefaultFormTimeField
            {...commonProps}
          />
        );

      case 'number':
        return (
          <DefaultFormTextField
            {...commonProps}
            type="number"
            step={field.step || "1"}
          />
        );

      case 'email':
        return (
          <DefaultFormTextField
            {...commonProps}
            type="email"
          />
        );

      case 'password':
        return (
          <DefaultFormTextField
            {...commonProps}
            type="password"
          />
        );

      default:
        console.warn(`Unsupported field type: ${field.type}`);
        return null;
    }
  };

  return (
    <Form {...form}>
      <form 
        onSubmit={onSubmit ? form.handleSubmit(onSubmit) : undefined}
        className={className}
      >
        <div className={cn("grid gap-4", gridCols)}>
          {schema.fields.map(field => {
            const colSpan = field.colSpan || 1;
            return (
              <div 
                key={field.name}
                className={cn({
                  'md:col-span-1': colSpan === 1,
                  'md:col-span-2': colSpan === 2,
                  'md:col-span-3': colSpan === 3,
                  'md:col-span-4': colSpan === 4,
                  'md:col-span-5': colSpan === 5,
                  'md:col-span-6': colSpan === 6,
                  'md:col-span-12': colSpan === 12,
                })}
              >
                {renderField(field)}
              </div>
            );
          })}
        </div>
        
        {showSubmitButton && onSubmit && (
          <div className="flex justify-end space-x-2 mt-6">
            <Button 
              type="submit" 
              disabled={loading}
            >
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {submitButtonText}
            </Button>
          </div>
        )}
      </form>
    </Form>
  );
}
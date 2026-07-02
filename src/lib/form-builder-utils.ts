import { z } from "zod";
import { FormField, FormSchema } from "@/types/form-builder";

export function createFormSchema(fields: FormField[]): FormSchema {
  const validationObject: Record<string, z.ZodTypeAny> = {};
  const defaultValues: Record<string, any> = {};

  fields.forEach(field => {
    let validator: z.ZodTypeAny = z.string();
    
    if (field.type === 'number') {
      validator = z.coerce.number();
    } else if (field.type === 'email') {
      validator = z.string().email("Invalid email address");
    } else if (field.type === 'date') {
      validator = z.string().or(z.date());
    } else if (field.type === 'time') {
      validator = z.string();
    }
    
    if (field.required) {
      validator = validator.refine(
        (value) => value !== null && value !== undefined && value !== "",
        `${field.label} is required`
      );
    }

    if (field.validation) {
      validator = field.validation;
    }

    validationObject[field.name] = validator;
    
    if (field.defaultValue !== undefined) {
      defaultValues[field.name] = field.defaultValue;
    }
  });

  return {
    fields,
    validationSchema: z.object(validationObject),
    defaultValues
  };
}
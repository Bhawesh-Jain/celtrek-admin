import { z } from "zod";

export type FieldType = 
  | 'text' 
  | 'textarea' 
  | 'select' 
  | 'date' 
  | 'time' 
  | 'number' 
  | 'email' 
  | 'password' 
  | 'checkbox' 
  | 'radio';

export interface FormField {
  name: string;
  label: string;
  type: FieldType;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  options?: Array<{ label: string; value: string | number }>;
  defaultValue?: any;
  validation?: z.ZodTypeAny;
  // Text field specific
  uppercase?: boolean;
  capitalize?: boolean;
  step?: string;
  // Textarea specific
  rows?: number;
  // Date picker specific
  subYear?: number;
  minToday?: boolean;
  maxToday?: boolean;
  // Select specific
  multiple?: boolean;
  // Layout
  className?: string;
  colSpan?: 1 | 2 | 3 | 4 | 5 | 6 | 12;
}

export interface FormSchema {
  fields: FormField[];
  validationSchema: z.ZodObject<any>;
  defaultValues?: Record<string, any>;
}

export interface FormBuilderProps {
  schema: FormSchema;
  form: any; // react-hook-form form instance
  onSubmit?: (data: any) => void;
  loading?: boolean;
  submitButtonText?: string;
  showSubmitButton?: boolean;
  gridColumns?: 1 | 2 | 3 | 4;
  className?: string;
}
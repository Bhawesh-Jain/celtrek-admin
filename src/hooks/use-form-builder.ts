import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { FormSchema } from "@/types/form-builder";

export function useFormBuilder(schema: FormSchema) {
  const form = useForm({
    resolver: zodResolver(schema.validationSchema),
    defaultValues: schema.defaultValues || {}
  });

  return form;
}
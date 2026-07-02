import { FormLabel } from "@/components/ui/form"
import { LucideIcon } from "lucide-react"

interface FormLabelWithIconProps {
  icon: LucideIcon
  children: React.ReactNode
}

export function FormLabelWithIcon({ icon: Icon, children }: FormLabelWithIconProps) {
  return (
    <FormLabel className="flex items-center gap-2">
      <Icon className="h-4 w-4 mb-0.5 text-gray-500" />
      {children}
    </FormLabel>
  )
} 
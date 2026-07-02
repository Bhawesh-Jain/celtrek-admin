import { cn } from "@/lib/utils";
import { TabsList, TabsTrigger } from "../ui/tabs";

export function DefaultTabsList({ children, className }: { children: React.ReactNode, className?: string }) {
  return (
    <TabsList className={cn("grid grid-cols-2", className)}>
      {children}
    </TabsList>
  )
}

export function DefaultTabTrigger({ children, className, value }: { children: React.ReactNode, className?: string, value: string }) {
  return (
    <TabsTrigger className={cn("p-2", className)}
      value={value}>
      {children}
    </TabsTrigger>
  )
}
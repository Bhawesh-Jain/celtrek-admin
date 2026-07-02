import { cn } from "@/lib/utils";
import { Skeleton } from "../ui/skeleton";

export default function FormItemSkeleton({ className = '' }: { className?: string }) {
  return (
    <div className="flex flex-col gap-4" >
      <Skeleton className={cn("h-6 w-2/6", className)} />
      <Skeleton className={cn("h-6 w-full", className)} />
    </div>
  )
}
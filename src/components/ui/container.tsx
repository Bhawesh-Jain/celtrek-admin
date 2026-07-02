import * as React from "react"

import { cn } from "@/lib/utils"

const Container = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "py-2 px-2 md:px-4 space-y-2",
      className
    )}
    {...props}
  />
))
Container.displayName = "Container"

export { Container }
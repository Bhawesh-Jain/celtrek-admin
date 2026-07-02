import { cn } from "@/lib/utils";

export function Heading({ children, className  }: { children: React.ReactNode, className?: string }) {
  return (
    <h2 className={cn("scroll-m-20 pb-2 text-xl font-semibold tracking-tight first:mt-0", className)}>
      {children}
    </h2>
  )
}

export function SubHeading({ children, className  }: { children: React.ReactNode, className?: string }) {
  return (
    <h3 className={cn("text-lg font-semibold tracking-tight", className)}>{children}</h3>
  )
}

export function Paragraph({ children, className  }: { children: React.ReactNode, className?: string }) {
  return (
    <p className={cn("leading-7 [&:not(:last-child)]:mb-5", className)}>{children}</p>
  )
}



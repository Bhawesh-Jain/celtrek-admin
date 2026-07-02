'use client'

import { useSidebar } from "@/components/ui/sidebar"
import { cn } from "@/lib/utils"

export function App({children}: {children: React.ReactNode}) {
  const { state } = useSidebar()

  return (
    <div className={cn("max-w-[100vw] transition-all ease-linear", state === "expanded" ? "md:max-w-[calc(100vw-16rem)]" : "md:max-w-[calc(100vw-3rem)]")}>
        {children}      
    </div>
  )
}
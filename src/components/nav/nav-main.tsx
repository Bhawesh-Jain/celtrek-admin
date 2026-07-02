"use client"

import { ChevronRight } from "lucide-react"
import { usePathname } from 'next/navigation'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
} from "@/components/ui/sidebar"
import Link from "next/link"
import { Skeleton } from "../ui/skeleton"

interface MenuItem {
  title: string
  parent_name: string
  url: string
  items?: MenuItem[]
}

export function NavMain({
  items,
  loading
}: {
  items: MenuItem[],
  loading: boolean
}) {
  const pathname = usePathname()

  const containsActivePath = (item: MenuItem): boolean => {
    if (item.url === pathname) return true
    if (item.items) {
      return item.items.some(subItem => containsActivePath(subItem))
    }
    return false
  }

  const renderMenuItem = (item: MenuItem) => {
    const hasChildren = item.items && item.items.length > 0
    const isActive = item.url === pathname
    const shouldBeOpen = containsActivePath(item)

    return (
      <Collapsible
        key={item.title}
        asChild
        defaultOpen={shouldBeOpen}
        className="group/collapsible"
      >
        <SidebarMenuItem>
          {hasChildren ? (
            <>
              <CollapsibleTrigger asChild>
                <SidebarMenuButton tooltip={item.title}>
                  <span className="font-semibold">{item.title}</span>
                  <ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                </SidebarMenuButton>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <SidebarMenuSub>
                  {item.items?.map(subItem => renderMenuItem(subItem))}
                </SidebarMenuSub>
              </CollapsibleContent>
            </>
          ) : (
            <SidebarMenuSubButton
              asChild
              className={isActive ? 'bg-primary text-primary-foreground' : ''}
            >
              <Link href={`${item.url}?h=${item.parent_name.length > 0 ? item.parent_name : item.title}`}>
                <span>{item.title}</span>
              </Link>
            </SidebarMenuSubButton>
          )}
        </SidebarMenuItem>
      </Collapsible>
    )
  }

  return (
    <SidebarGroup>
      <SidebarGroupLabel>Platform</SidebarGroupLabel>
      <SidebarMenu>
        {loading
          ? Array.from({ length: 15 }).map((_, index) => (
            <SidebarMenuItem key={index} className="my-1">
              {((index + Math.round(Math.random())) % 2) === 0
                ? <Skeleton className={`h-4 w-3/5`} />
                : <Skeleton className={`h-4 w-4/5`} />
              }
            </SidebarMenuItem>
          ))
          : (items && items.length > 0 && items.map(item => renderMenuItem(item)))}
      </SidebarMenu>
    </SidebarGroup>
  )
}

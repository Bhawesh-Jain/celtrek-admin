"use client"

import * as React from "react"
import { NavMain } from "@/components/nav/nav-main"
import { NavUser } from "@/components/nav/nav-user"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarRail
} from "@/components/ui/sidebar"
import { getSidebarData } from "@/lib/actions/sys/sidebar"
import { useState, useEffect } from "react"
import Loading from "@/app/dashboard/loading"
import Image from "next/image"
import Link from "next/link"
import { getBrand } from "@/lib/getBrand"

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {

  const [loading, setLoading] = useState(true);
  const [sidebar, setSidebar] = useState<any | null>(null);
  const brand = getBrand();

  useEffect(() => {
    (async () => {
      var sidebar = await getSidebarData();
      setSidebar(sidebar.result);
      setLoading(false);
    })();
  }, []);

  return (
    <Sidebar variant="inset" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <div className="flex items-center justify-between px-4 py-2">
            <Link href="#" className="flex items-center gap-2 font-medium">
              <Image src="/assets/logo.png" alt="Logo" width={16} height={16} className="rounded-md" />
              {brand.companyAbbr}
            </Link>
          </div>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={sidebar?.menu || []} loading={loading} />
      </SidebarContent>
      <SidebarFooter>
        {loading ? (
          <Loading />
        ) : (
          <NavUser user={sidebar.user} />
        )}
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}

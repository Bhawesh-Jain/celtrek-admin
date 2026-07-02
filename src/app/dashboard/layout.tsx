import { AppSidebar } from "@/components/app-sidebar"
import { Separator } from "@/components/ui/separator"
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar"
import { UserProvider } from "@/contexts/user-context"
import { UserData } from "@/lib/actions/sys/auth"
import { validateSession } from "@/lib/session"
import { redirect } from "next/navigation"
import TopBar from "@/components/nav/top-bar"
import { App } from "@/components/app"

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  try {
    const session = await validateSession();

    const user: UserData = {
      user_id: session.user_id,
      user_phone: session.user_phone,
      user_email: session.user_email,
      user_avatar: session.user_avatar,
      user_name: session.user_name,
      company_name: session.company_name,
      company_id: session.company_id,
      company_abbr: session.company_abbr,
      role: session.role,
    }

    return ( 
      <UserProvider user={user}>
        <SidebarProvider>
          <AppSidebar />
          <SidebarInset>
            <App>
              <header className="flex h-16 shrink-0 sticky top-0 bg-background items-center gap-2  rounded-lg">
                <SidebarTrigger className="ml-2" />
                <Separator orientation="vertical" className="h-5" />
                <TopBar user={user} />
              </header>
              <div className="flex flex-1 flex-col gap-4 py-1 pt-0">
                {children}
              </div>
            </App>
          </SidebarInset>
        </SidebarProvider>
      </UserProvider>
    )
  } catch (error) {
    redirect('/login')
  }
}

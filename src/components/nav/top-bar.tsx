'use client'
import * as React from "react"
import { Bell, HelpCircle, Search } from "lucide-react"
import { UserData } from "@/lib/actions/sys/auth"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useSearchParams, usePathname } from "next/navigation"
import { getHeadingFromPath } from "@/lib/utils/getHeading"

interface TopBarProps {
  user: UserData;
}

const TopBar: React.FC<TopBarProps> = ({ user }) => {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const headingFromQuery = searchParams.get('h');
  const heading = headingFromQuery || getHeadingFromPath(pathname);

  return (
    <div className="flex justify-between items-center w-full py-4 px-2 bg-background rounded-lg">
      <div className="flex items-center gap-2">
        <h1 className="text-lg font-semibold">{heading}</h1>
      </div>
      
      {/* <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" className="text-muted-foreground hover:text-foreground">
          <HelpCircle className="h-5 w-5" />
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="icon" className="relative text-muted-foreground hover:text-foreground">
              <Bell className="h-5 w-5" />
              <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-primary text-[10px] font-medium text-primary-foreground flex items-center justify-center">
                3
              </span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-80">
            <div className="flex items-center justify-between px-4 py-2 border-b">
              <span className="font-semibold">Notifications</span>
              <Button variant="ghost" size="sm">Mark all as read</Button>
            </div>
            <DropdownMenuItem>
              <div className="flex flex-col gap-1">
                <span className="font-medium">New team member added</span>
                <span className="text-xs text-muted-foreground">2 hours ago</span>
              </div>
            </DropdownMenuItem>
            <DropdownMenuItem>
              <div className="flex flex-col gap-1">
                <span className="font-medium">Your subscription was renewed</span>
                <span className="text-xs text-muted-foreground">1 day ago</span>
              </div>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <Button variant="outline" size="icon" className="text-muted-foreground hover:text-foreground">
          <Search className="h-5 w-5" />
        </Button>
      </div> */}
    </div>
  )
}

export default TopBar 
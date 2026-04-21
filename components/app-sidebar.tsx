"use client"

import * as React from "react"
import { IconSettings, IconHelp } from "@tabler/icons-react"

import { NavMain } from "@/components/nav-main"
import { NavSecondary } from "@/components/nav-secondary"
import { NavUser } from "@/components/nav-user"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import { useAuth } from "@/store/useAuth"
import { getNavByRole } from "@/lib/getNavByRole"
import { Logo } from "./Logo"

function getSettingsUrl(role?: string | null) {
  if (role === "ADMIN") return "/admin/settings"
  if (role === "LANDLORD") return "/landlord/settings"
  return "/settings"
}

export function AppSidebar(props: React.ComponentProps<typeof Sidebar>) {
  const { user } = useAuth()

  const navItems = React.useMemo(() => getNavByRole(user), [user])

  const navSecondary = React.useMemo(
    () => [
      {
        title: "Settings",
        url: getSettingsUrl(user?.role),
        icon: IconSettings,
      },
      { title: "Get Help", url: "/help", icon: IconHelp, comingSoon: true },
    ],
    [user?.role]
  )

  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              size="lg"
              asChild
              className="hover:bg-transparent"
            >
              <a href="/">
                <Logo />
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        <NavMain items={navItems} />
        <NavSecondary items={navSecondary} className="mt-auto" />
      </SidebarContent>

      <SidebarFooter>
        <NavUser />
      </SidebarFooter>
    </Sidebar>
  )
}

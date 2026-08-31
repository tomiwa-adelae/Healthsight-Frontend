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
  useSidebar,
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
  const { setOpenMobile } = useSidebar()
  const primaryRole = user?.role ?? user?.roles?.[0]?.name

  const navItems = React.useMemo(() => getNavByRole(user), [user])

  const navSecondary = React.useMemo(
    () => [
      {
        title: "Settings",
        url: getSettingsUrl(primaryRole),
        icon: IconSettings,
      },
      { title: "Get Help", url: "/help", icon: IconHelp, comingSoon: true },
    ],
    [primaryRole]
  )

  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader className="border-b">
        <a
          href="/"
          onClick={() => setOpenMobile(false)}
          className="flex items-center gap-2.5 px-1 py-1.5"
        >
          <Logo className="size-12 shrink-0" />
          <div className="flex min-w-0 flex-col leading-tight">
            <span className="font-heading text-base font-semibold text-sidebar-foreground">
              Healthsight
            </span>
            <span className="truncate font-ui text-[0.65rem] tracking-wide text-sidebar-foreground/70">
              Lagos State Health District I
            </span>
          </div>
        </a>
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

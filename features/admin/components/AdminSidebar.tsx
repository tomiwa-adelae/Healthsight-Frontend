"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import {
  IconLayoutDashboard,
  IconUsers,
  IconShield,
  IconBuildingHospital,
  IconUserPlus,
  IconCalendarStats,
  IconCalendarCheck,
  IconChevronRight,
  IconLogout,
  IconBadge,
} from "@tabler/icons-react"
import { toast } from "sonner"

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarSeparator,
} from "@/components/ui/sidebar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Logo } from "@/components/Logo"
import { useAuth } from "@/store/useAuth"
import api from "@/lib/api"

const managementLinks = [
  { label: "Dashboard", href: "/admin/dashboard", icon: IconLayoutDashboard },
  { label: "Users", href: "/admin/users", icon: IconUsers },
  { label: "Roles", href: "/admin/roles", icon: IconShield },
  { label: "PHCs", href: "/admin/phcs", icon: IconBuildingHospital },
]

const operationsLinks = [
  { label: "Create Directors", href: "/admin/directors", icon: IconUserPlus },
  {
    label: "View Pending Users",
    href: "/admin/pending-users",
    icon: IconUserPlus,
    showBadge: true,
  },
]

const settingsLinks = [
  {
    label: "Set General Assessment Date",
    href: "/admin/assessment/general",
    icon: IconCalendarStats,
  },
  {
    label: "Set Safecare Assessment Date",
    href: "/admin/assessment/safecare",
    icon: IconCalendarCheck,
  },
]

export function AdminSidebar({ pendingCount = 0 }: { pendingCount?: number }) {
  const pathname = usePathname()
  const router = useRouter()
  const { user, clearUser } = useAuth()

  const isActive = (href: string) =>
    pathname === href || pathname.startsWith(href + "/")

  const initials = user
    ? `${user.firstName?.[0] ?? ""}${user.lastName?.[0] ?? ""}`.toUpperCase()
    : "AD"

  async function handleSignOut() {
    try {
      await api.post("/auth/logout")
    } catch {
      // ignore
    }
    clearUser()
    router.push("/")
    toast.success("Signed out")
  }

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="border-b py-4">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              size="lg"
              asChild
              className="hover:bg-transparent active:bg-transparent"
            >
              <Link href="/admin/dashboard">
                <Logo />
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Management</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {managementLinks.map(({ label, href, icon: Icon }) => (
                <SidebarMenuItem key={href}>
                  <SidebarMenuButton
                    asChild
                    isActive={isActive(href)}
                    tooltip={label}
                  >
                    <Link href={href}>
                      <Icon />
                      <span>{label}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarSeparator />

        <SidebarGroup>
          <SidebarGroupLabel>Operations</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {operationsLinks.map(({ label, href, icon: Icon, showBadge }) => (
                <SidebarMenuItem key={href}>
                  <SidebarMenuButton
                    asChild
                    isActive={isActive(href)}
                    tooltip={label}
                  >
                    <Link href={href}>
                      <Icon />
                      <span>{label}</span>
                    </Link>
                  </SidebarMenuButton>
                  {showBadge && pendingCount > 0 && (
                    <SidebarMenuBadge className="bg-amber-500 text-white">
                      {pendingCount}
                    </SidebarMenuBadge>
                  )}
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarSeparator />

        <SidebarGroup>
          <SidebarGroupLabel>Settings</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {settingsLinks.map(({ label, href, icon: Icon }) => (
                <SidebarMenuItem key={href}>
                  <SidebarMenuButton
                    asChild
                    isActive={isActive(href)}
                    tooltip={label}
                  >
                    <Link href={href}>
                      <Icon />
                      <span>{label}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t">
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton
                  size="lg"
                  className="data-[state=open]:bg-sidebar-accent"
                >
                  <Avatar className="size-8 rounded-lg">
                    <AvatarImage
                      src={user?.image ?? ""}
                      alt={user?.firstName ?? ""}
                    />
                    <AvatarFallback className="rounded-lg bg-primary text-xs font-semibold text-primary-foreground">
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                  <div className="grid flex-1 text-left text-sm leading-tight">
                    <span className="truncate font-medium">
                      {user?.firstName} {user?.lastName}
                    </span>
                    <span className="truncate text-xs text-muted-foreground">
                      {user?.roles?.map((r) => r.label).join(", ")}
                    </span>
                  </div>
                  <IconChevronRight className="ml-auto size-4" />
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                side="top"
                align="start"
                className="w-56 rounded-lg"
              >
                <div className="px-3 py-2">
                  <p className="text-xs font-medium">{user?.email}</p>
                  <div className="mt-1 flex items-center gap-1">
                    <IconBadge className="size-3 text-muted-foreground" />
                    <p className="text-xs text-muted-foreground">
                      {user?.roles?.map((r) => r.label).join(", ")}
                    </p>
                  </div>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="text-destructive focus:text-destructive"
                  onClick={handleSignOut}
                >
                  <IconLogout className="size-4" />
                  Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  )
}

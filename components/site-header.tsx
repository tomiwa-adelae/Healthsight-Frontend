"use client"

import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { useAuth } from "@/store/useAuth"
import { Logo } from "./Logo"
import { ThemeToggle } from "./ThemeToggle"

const roleTitles: Record<string, string> = {
  ADMINISTRATOR: "Admin Panel",
  BRAND: "Brand Management Center",
  PROFESSIONAL: "Professional Dashboard",
  ARTISAN: "Artisan Dashboard",
}

export function SiteHeader() {
  const { user } = useAuth()
  const primaryRole = user?.role ?? user?.roles?.[0]?.name ?? ""
  const title = roleTitles[primaryRole] || "Dashboard"

  return (
    <header className="sticky top-0 z-10 flex h-(--header-height) shrink-0 items-center gap-2 border-b backdrop-blur-md transition-[width,height] ease-linear">
      <div className="flex w-full items-center gap-2 px-4 lg:px-6">
        <SidebarTrigger className="-ml-1" />
        <div className="flex items-center justify-start gap-2">
          <div className="md:hidden">
            <Logo className="w-44" />
          </div>
        </div>
        <div className="flex w-full justify-end">
          <ThemeToggle />
        </div>
      </div>
    </header>
  )
}

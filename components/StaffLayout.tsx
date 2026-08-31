"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/store/useAuth"
import { AppSidebar } from "@/components/app-sidebar"
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar"
import { Separator } from "@/components/ui/separator"
import { ThemeSwitcher } from "@/components/ThemeSwitcher"

export function StaffLayout({ children }: { children: React.ReactNode }) {
  const { user, _hasHydrated } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!_hasHydrated) return
    if (!user) {
      router.replace("/")
      return
    }
    if (user.roles?.some((r) => r.name === "ADMIN")) {
      router.replace("/admin/dashboard")
    }
  }, [user, _hasHydrated, router])

  if (!_hasHydrated || !user || user.roles?.some((r) => r.name === "ADMIN"))
    return null

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="sticky top-0 z-10 flex h-14 shrink-0 items-center gap-2 border-b bg-background/80 px-4 backdrop-blur-md">
          <SidebarTrigger className="-ml-1 shrink-0" />
          <Separator orientation="vertical" className="h-4 shrink-0" />
          <span className="min-w-0 flex-1 truncate text-xs font-medium text-muted-foreground">
            {user.roles?.map((r) => r.label).join(" · ")}
          </span>
          <div className="shrink-0">
            <ThemeSwitcher />
          </div>
        </header>
        <div className="container flex flex-1 flex-col gap-4 overflow-x-clip py-6 sm:py-8">
          {children}
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}

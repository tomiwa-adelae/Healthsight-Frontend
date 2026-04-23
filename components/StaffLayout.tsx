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
        <header className="flex h-14 shrink-0 items-center gap-2 border-b px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="h-4" />
          <span className="text-xs font-medium text-muted-foreground">
            {user.roles?.map((r) => r.label).join(" · ")}
          </span>
        </header>
        <div className="container flex flex-1 flex-col gap-4 py-8">
          {children}
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}

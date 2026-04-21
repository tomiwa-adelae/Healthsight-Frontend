"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/store/useAuth"
import { AdminSidebar } from "@/features/admin/components/AdminSidebar"
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar"
import { Separator } from "@/components/ui/separator"

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { user, _hasHydrated } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!_hasHydrated) return
    if (!user) {
      router.replace("/admin/login")
      return
    }
    if (!user.roles?.some((r) => r.name === "ADMIN")) {
      router.replace("/")
    }
  }, [user, _hasHydrated, router])

  // Don't render until hydrated — prevents flash of content
  if (!_hasHydrated || !user || !user.roles?.some((r) => r.name === "ADMIN"))
    return null

  return (
    <SidebarProvider>
      <AdminSidebar />
      <SidebarInset>
        <header className="flex h-14 shrink-0 items-center gap-2 border-b px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="h-4" />
          <span className="text-xs font-medium text-muted-foreground">
            Admin Portal
          </span>
        </header>
        <div className="@container/main container flex flex-1 flex-col gap-4 py-8">
          {children}
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}

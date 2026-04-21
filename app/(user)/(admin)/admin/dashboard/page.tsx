"use client"

import { useEffect, useState } from "react"
import { Users, Building2, Clock, XCircle } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import api from "@/lib/api"

type AdminUser = {
  id: string
  firstName: string
  lastName: string
  roles: { role: { id: string; name: string; label: string } }[]
  accountStatus: "ACTIVE" | "PENDING" | "REJECTED" | "SUSPENDED"
  createdAt: string
}

type Phc = {
  id: string
  name: string
  createdAt: string
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const days = Math.floor(diff / 86_400_000)
  if (days < 1) return "Today"
  if (days < 7) return `${days}d ago`
  const weeks = Math.floor(days / 7)
  if (weeks < 5) return `${weeks}w ago`
  const months = Math.floor(days / 30)
  if (months < 12) return `${months}mo ago`
  return `${Math.floor(days / 365)}yr ago`
}

function isNew(dateStr: string): boolean {
  return Date.now() - new Date(dateStr).getTime() < 7 * 24 * 60 * 60 * 1000
}

export default function AdminDashboardPage() {
  const [users, setUsers] = useState<AdminUser[]>([])
  const [phcs, setPhcs] = useState<Phc[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([api.get("/admin/users"), api.get("/admin/phcs")])
      .then(([usersRes, phcsRes]) => {
        setUsers(usersRes.data)
        setPhcs(phcsRes.data)
      })
      .finally(() => setLoading(false))
  }, [])

  const totalUsers = users.length
  const totalPhcs = phcs.length
  const pendingCount = users.filter((u) => u.accountStatus === "PENDING").length
  const rejectedCount = users.filter(
    (u) => u.accountStatus === "REJECTED"
  ).length

  const recentUsers = users.slice(0, 5)
  const recentPhcs = [...phcs]
    .sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    )
    .slice(0, 5)

  const stats = [
    { label: "Total Users", value: totalUsers, icon: Users, bg: "bg-blue-600" },
    {
      label: "Total PHCs",
      value: totalPhcs,
      icon: Building2,
      bg: "bg-green-600",
    },
    {
      label: "Pending Applications",
      value: pendingCount,
      icon: Clock,
      bg: "bg-amber-500",
    },
    {
      label: "Rejected Applications",
      value: rejectedCount,
      icon: XCircle,
      bg: "bg-red-500",
    },
  ]

  return (
    <div className="space-y-6">
      {/* Stat cards */}
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map(({ label, value, icon: Icon, bg }) => (
          <div
            key={label}
            className={`${bg} flex items-center justify-between rounded-xl px-6 py-5 text-white`}
          >
            <div>
              <p className="text-sm font-medium opacity-90">{label}</p>
              {loading ? (
                <Skeleton className="mt-2 h-8 w-12 bg-white/30" />
              ) : (
                <p className="mt-1 text-3xl font-bold">{value}</p>
              )}
            </div>
            <Icon className="size-10 opacity-80" strokeWidth={1.5} />
          </div>
        ))}
      </div>

      {/* Recent Users + Recent PHCs */}
      <div className="grid grid-cols-1 gap-3 lg:grid-cols-5">
        <div className="lg:col-span-3">
          {/* Recent Users — wider */}
          <Card className="gap-1">
            <CardHeader className="border-b">
              <CardTitle>Recent Users</CardTitle>
            </CardHeader>
            <CardContent className="divide-y p-0">
              {loading
                ? Array.from({ length: 5 }).map((_, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between px-6 py-4"
                    >
                      <div className="space-y-1.5">
                        <Skeleton className="h-4 w-40" />
                        <Skeleton className="h-3 w-24" />
                      </div>
                      <Skeleton className="h-5 w-10 rounded-full" />
                    </div>
                  ))
                : recentUsers.map((u) => (
                    <div
                      key={u.id}
                      className="flex items-center justify-between px-6 py-4"
                    >
                      <div>
                        <p className="text-sm font-medium">
                          {u.firstName} {u.lastName}
                        </p>
                        <p className="text-xs text-muted-foreground capitalize">
                          {u.roles.map((ur) => ur.role.label).join(", ")}
                        </p>
                      </div>
                      {isNew(u.createdAt) && (
                        <Badge className="bg-blue-500 text-white hover:bg-blue-500">
                          New
                        </Badge>
                      )}
                    </div>
                  ))}
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-2">
          {/* Recent PHCs — narrower */}
          <Card className="gap-1">
            <CardHeader className="border-b">
              <CardTitle>Recent PHCs</CardTitle>
            </CardHeader>
            <CardContent className="divide-y p-0">
              {loading
                ? Array.from({ length: 5 }).map((_, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between px-6 py-4"
                    >
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-3 w-16" />
                    </div>
                  ))
                : recentPhcs.map((p) => (
                    <div
                      key={p.id}
                      className="flex items-center justify-between px-6 py-4"
                    >
                      <p className="text-sm font-medium">{p.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {timeAgo(p.createdAt)}
                      </p>
                    </div>
                  ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

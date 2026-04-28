"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Users, Building2, Clock, ShieldCheck, ClipboardList, BarChart3, CheckCircle2 } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Progress } from "@/components/ui/progress"
import { Button } from "@/components/ui/button"
import api from "@/lib/api"

type Stats = {
  users: { total: number; active: number; pending: number }
  phcs: { total: number }
  assessment: {
    activePeriods: { id: string; title: string; type: string; submissions: number }[]
    totalSubmissions: number
  }
}

type AdminUser = {
  id: string
  firstName: string
  lastName: string
  roles: { role: { label: string } }[]
  accountStatus: string
  createdAt: string
}

function timeAgo(dateStr: string): string {
  const days = Math.floor((Date.now() - new Date(dateStr).getTime()) / 86_400_000)
  if (days < 1) return "Today"
  if (days < 7) return `${days}d ago`
  if (days < 30) return `${Math.floor(days / 7)}w ago`
  if (days < 365) return `${Math.floor(days / 30)}mo ago`
  return `${Math.floor(days / 365)}yr ago`
}

function isNew(dateStr: string) {
  return Date.now() - new Date(dateStr).getTime() < 7 * 24 * 60 * 60 * 1000
}

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null)
  const [recentUsers, setRecentUsers] = useState<AdminUser[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      api.get<Stats>("/admin/stats"),
      api.get<AdminUser[]>("/admin/users"),
    ])
      .then(([statsRes, usersRes]) => {
        setStats(statsRes.data)
        setRecentUsers(
          [...usersRes.data]
            .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
            .slice(0, 6)
        )
      })
      .finally(() => setLoading(false))
  }, [])

  const summaryCards = [
    {
      label: "Active Staff",
      value: stats?.users.active ?? 0,
      sub: `${stats?.users.pending ?? 0} pending`,
      icon: Users,
      bg: "bg-blue-600",
      href: "/admin/users",
    },
    {
      label: "Total PHCs",
      value: stats?.phcs.total ?? 0,
      sub: "facilities",
      icon: Building2,
      bg: "bg-green-600",
      href: "/admin/phcs",
    },
    {
      label: "Pending Approvals",
      value: stats?.users.pending ?? 0,
      sub: "awaiting review",
      icon: Clock,
      bg: "bg-amber-500",
      href: "/admin/pending-users",
    },
    {
      label: "Total Submissions",
      value: stats?.assessment.totalSubmissions ?? 0,
      sub: "all time",
      icon: ClipboardList,
      bg: "bg-purple-600",
      href: "/admin/assessment/general",
    },
  ]

  return (
    <div className="space-y-6">
      {/* ── STAT CARDS ──────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 xl:grid-cols-4">
        {summaryCards.map(({ label, value, sub, icon: Icon, bg, href }) => (
          <Link key={label} href={href} className="group">
            <div className={`${bg} flex items-center justify-between rounded-xl px-6 py-5 text-white transition-opacity group-hover:opacity-90`}>
              <div>
                <p className="text-sm font-medium opacity-90">{label}</p>
                {loading ? (
                  <Skeleton className="mt-2 h-8 w-12 bg-white/30" />
                ) : (
                  <p className="mt-1 text-3xl font-bold">{value}</p>
                )}
                {!loading && <p className="mt-0.5 text-xs opacity-70">{sub}</p>}
              </div>
              <Icon className="size-10 opacity-80" strokeWidth={1.5} />
            </div>
          </Link>
        ))}
      </div>

      {/* ── ACTIVE ASSESSMENT PERIODS ───────────────────────────────── */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Active Assessment Periods
          </h2>
          <Button variant="ghost" size="sm" asChild>
            <Link href="/admin/assessment/general">View all</Link>
          </Button>
        </div>

        {loading && <Skeleton className="h-20 rounded-lg" />}

        {!loading && (stats?.assessment.activePeriods.length ?? 0) === 0 && (
          <div className="rounded-lg border border-dashed px-6 py-8 text-center text-sm text-muted-foreground">
            No active assessment periods
          </div>
        )}

        {!loading &&
          stats?.assessment.activePeriods.map((p) => (
            <div
              key={p.id}
              className="flex items-center justify-between rounded-lg border bg-card px-5 py-4"
            >
              <div className="flex items-center gap-3">
                {p.type === "SAFECARE" ? (
                  <ShieldCheck className="h-5 w-5 text-blue-500 shrink-0" />
                ) : (
                  <BarChart3 className="h-5 w-5 text-primary shrink-0" />
                )}
                <div>
                  <p className="font-medium text-sm">{p.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {p.submissions} submission{p.submissions !== 1 ? "s" : ""}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Badge className="bg-green-100 text-green-700 text-xs">ACTIVE</Badge>
                <Button size="sm" variant="outline" asChild>
                  <Link href={`/admin/assessment/general/${p.id}`}>Results</Link>
                </Button>
              </div>
            </div>
          ))}
      </div>

      {/* ── RECENT USERS + QUICK LINKS ───────────────────────────────── */}
      <div className="grid grid-cols-1 gap-3 lg:grid-cols-5">
        {/* Recent users */}
        <Card className="gap-1 lg:col-span-3">
          <CardHeader className="border-b">
            <div className="flex items-center justify-between">
              <CardTitle>Recent Users</CardTitle>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/admin/users">View all</Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent className="divide-y p-0">
            {loading
              ? Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="flex items-center justify-between px-6 py-4">
                    <div className="space-y-1.5">
                      <Skeleton className="h-4 w-40" />
                      <Skeleton className="h-3 w-24" />
                    </div>
                    <Skeleton className="h-5 w-16 rounded-full" />
                  </div>
                ))
              : recentUsers.map((u) => (
                  <div key={u.id} className="flex items-center justify-between px-6 py-4">
                    <div>
                      <p className="text-sm font-medium">
                        {u.firstName} {u.lastName}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {u.roles.map((r) => r.role.label).join(", ")}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {u.accountStatus === "PENDING" && (
                        <Badge className="bg-amber-100 text-amber-700 text-xs">Pending</Badge>
                      )}
                      {isNew(u.createdAt) && u.accountStatus !== "PENDING" && (
                        <Badge className="bg-blue-100 text-blue-700 text-xs">New</Badge>
                      )}
                      <span className="text-xs text-muted-foreground">
                        {timeAgo(u.createdAt)}
                      </span>
                    </div>
                  </div>
                ))}
          </CardContent>
        </Card>

        {/* Quick links */}
        <Card className="gap-1 lg:col-span-2">
          <CardHeader className="border-b">
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {[
              { label: "Review pending users", href: "/admin/pending-users", icon: Clock, badge: stats?.users.pending },
              { label: "General Assessment", href: "/admin/assessment/general", icon: ClipboardList },
              { label: "SafeCare Assessment", href: "/admin/assessment/safecare", icon: ShieldCheck },
              { label: "PHC Map View", href: "/admin/phcs/map", icon: Building2 },
              { label: "User Management", href: "/admin/users", icon: Users },
            ].map(({ label, href, icon: Icon, badge }) => (
              <Link
                key={href}
                href={href}
                className="flex items-center justify-between px-6 py-4 text-sm hover:bg-muted/50 transition-colors border-b last:border-0"
              >
                <span className="flex items-center gap-3">
                  <Icon className="h-4 w-4 text-muted-foreground" />
                  {label}
                </span>
                {badge !== undefined && badge > 0 && (
                  <Badge className="bg-amber-100 text-amber-700 text-xs">{badge}</Badge>
                )}
              </Link>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

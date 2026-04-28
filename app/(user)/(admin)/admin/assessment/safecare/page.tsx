"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { format } from "date-fns"
import { toast } from "sonner"
import { ShieldCheck, BarChart3, Clock } from "lucide-react"

import { PageHeader } from "@/components/PageHeader"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import api from "@/lib/api"

type Period = {
  id: string
  title: string
  description: string | null
  type: string
  status: "DRAFT" | "ACTIVE" | "CLOSED"
  startDate: string
  endDate: string
  _count: { questions: number; submissions: number }
  createdBy: { firstName: string; lastName: string }
}

const STATUS_STYLES: Record<string, string> = {
  DRAFT:  "bg-gray-100 text-gray-600",
  ACTIVE: "bg-green-100 text-green-700",
  CLOSED: "bg-red-100 text-red-700",
}

export default function SafecareAdminPage() {
  const [periods, setPeriods] = useState<Period[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api
      .get("/assessment/periods?type=SAFECARE")
      .then((r) => {
        // filter client-side since the backend accepts optional type param
        const sc = r.data.filter((p: Period) => p.type === "SAFECARE")
        setPeriods(sc)
      })
      .catch(() => toast.error("Failed to load SafeCare periods"))
      .finally(() => setLoading(false))
  }, [])

  const active  = periods.filter((p) => p.status === "ACTIVE")
  const closed  = periods.filter((p) => p.status === "CLOSED")
  const draft   = periods.filter((p) => p.status === "DRAFT")

  return (
    <div className="space-y-6">
      <PageHeader
        title="SafeCare Assessment"
        description="Quality compliance assessment across 131 indicators"
        badges={[]}
      />

      {/* ── SUMMARY CARDS ─────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
        <SummaryCard
          icon={<ShieldCheck className="h-5 w-5 text-green-600" />}
          label="Active Periods"
          value={active.length}
          bg="bg-green-50 dark:bg-green-950/40"
        />
        <SummaryCard
          icon={<Clock className="h-5 w-5 text-gray-500" />}
          label="Draft Periods"
          value={draft.length}
          bg="bg-gray-50 dark:bg-gray-900/40"
        />
        <SummaryCard
          icon={<BarChart3 className="h-5 w-5 text-blue-600" />}
          label="Total Submissions"
          value={periods.reduce((s, p) => s + p._count.submissions, 0)}
          bg="bg-blue-50 dark:bg-blue-950/40"
        />
      </div>

      {/* ── PERIODS LIST ──────────────────────────────────────────────── */}
      <div className="space-y-3">
        <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
          Assessment Periods
        </h2>

        {loading &&
          Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-lg" />
          ))}

        {!loading && periods.length === 0 && (
          <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-14 text-center">
            <ShieldCheck className="mb-3 h-10 w-10 text-muted-foreground" />
            <p className="font-medium text-muted-foreground">
              No SafeCare periods yet
            </p>
          </div>
        )}

        {!loading &&
          periods.map((p) => (
            <Card key={p.id} className="gap-0">
              <CardHeader className="flex flex-row items-start justify-between gap-4 pb-3">
                <div className="space-y-1">
                  <CardTitle className="text-base">{p.title}</CardTitle>
                  {p.description && (
                    <p className="text-sm text-muted-foreground">
                      {p.description}
                    </p>
                  )}
                </div>
                <Badge className={STATUS_STYLES[p.status]}>
                  {p.status}
                </Badge>
              </CardHeader>

              <CardContent className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex flex-wrap gap-6 text-sm text-muted-foreground">
                  <span>
                    {format(new Date(p.startDate), "dd MMM yyyy")} –{" "}
                    {format(new Date(p.endDate), "dd MMM yyyy")}
                  </span>
                  <span>{p._count.questions} questions</span>
                  <span>{p._count.submissions} submissions</span>
                </div>

                <Button size="sm" variant="outline" asChild>
                  <Link href={`/admin/assessment/general/${p.id}`}>
                    <BarChart3 className="mr-2 h-4 w-4" />
                    View Results
                  </Link>
                </Button>
              </CardContent>
            </Card>
          ))}

        {!loading && closed.length > 0 && (
          <p className="text-center text-xs text-muted-foreground pt-2">
            {closed.length} closed period{closed.length > 1 ? "s" : ""} shown above
          </p>
        )}
      </div>
    </div>
  )
}

function SummaryCard({
  icon, label, value, bg,
}: {
  icon: React.ReactNode
  label: string
  value: number
  bg: string
}) {
  return (
    <div className={`space-y-2 rounded-lg border p-4 ${bg}`}>
      <div className="flex items-center gap-2">
        {icon}
        <span className="text-sm text-muted-foreground">{label}</span>
      </div>
      <p className="text-2xl font-bold">{value}</p>
    </div>
  )
}

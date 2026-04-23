"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { format, isPast, formatDistanceToNow } from "date-fns"
import { toast } from "sonner"
import {
  ClipboardList,
  CheckCircle2,
  Clock,
  AlertCircle,
  ChevronRight,
  MapPin,
  Building2,
} from "lucide-react"

import { useAuth } from "@/store/useAuth"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Progress } from "@/components/ui/progress"
import { Separator } from "@/components/ui/separator"
import api from "@/lib/api"

type MyPeriod = {
  id: string
  title: string
  description?: string
  type: string
  startDate: string
  endDate: string
  questions: { id: string }[]
  mySubmission: {
    id: string
    answeredCount: number
    totalQuestions: number
    updatedAt: string
  } | null
}

function getGreeting() {
  const h = new Date().getHours()
  if (h < 12) return "Good morning"
  if (h < 17) return "Good afternoon"
  return "Good evening"
}

export default function StaffDashboardPage() {
  const { user } = useAuth()
  const [periods, setPeriods] = useState<MyPeriod[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get("/assessment/my")
      .then((res) => setPeriods(res.data))
      .catch(() => toast.error("Failed to load assessments"))
      .finally(() => setLoading(false))
  }, [])

  const completed = periods.filter(
    (p) => p.mySubmission && p.mySubmission.answeredCount === p.questions.length && p.questions.length > 0
  )
  const inProgress = periods.filter(
    (p) => p.mySubmission && p.mySubmission.answeredCount < p.questions.length
  )
  const notStarted = periods.filter((p) => !p.mySubmission)

  const totalAnswered = periods.reduce(
    (sum, p) => sum + (p.mySubmission?.answeredCount ?? 0), 0
  )

  return (
    <div className="space-y-8">
      {/* ── WELCOME ─────────────────────────────────────────────────────────── */}
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold">
            {getGreeting()}, {user?.firstName} 👋
          </h1>
          <div className="mt-1.5 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
            {user?.roles?.map((r) => (
              <Badge key={r.id} variant="secondary">{r.label}</Badge>
            ))}
            {(user?.phc || user?.lga || user?.district) && (
              <>
                <Separator orientation="vertical" className="h-4" />
                <span className="flex items-center gap-1">
                  <MapPin className="h-3 w-3" />
                  {[user?.district?.name, user?.lga?.name, user?.phc?.name]
                    .filter(Boolean)
                    .join(" · ")}
                </span>
              </>
            )}
          </div>
        </div>
        <p className="text-sm text-muted-foreground">
          {format(new Date(), "EEEE, dd MMMM yyyy")}
        </p>
      </div>

      {/* ── STATS ───────────────────────────────────────────────────────────── */}
      {loading ? (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-24 rounded-lg" />)}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <StatCard
            icon={<ClipboardList className="h-5 w-5 text-blue-500" />}
            label="Active Periods"
            value={periods.length}
            bg="bg-blue-50 dark:bg-blue-950/50"
          />
          <StatCard
            icon={<CheckCircle2 className="h-5 w-5 text-green-500" />}
            label="Completed"
            value={completed.length}
            bg="bg-green-50 dark:bg-green-950/50"
          />
          <StatCard
            icon={<Clock className="h-5 w-5 text-amber-500" />}
            label="In Progress"
            value={inProgress.length}
            bg="bg-amber-50 dark:bg-amber-950/50"
          />
          <StatCard
            icon={<AlertCircle className="h-5 w-5 text-red-500" />}
            label="Not Started"
            value={notStarted.length}
            bg="bg-red-50 dark:bg-red-950/50"
          />
        </div>
      )}

      {/* ── ACTIVE ASSESSMENTS ──────────────────────────────────────────────── */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Active Assessments</h2>
          <Button variant="ghost" size="sm" asChild>
            <Link href="/assessment">
              View all <ChevronRight className="ml-1 h-4 w-4" />
            </Link>
          </Button>
        </div>

        {loading && (
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-32 rounded-lg" />)}
          </div>
        )}

        {!loading && periods.length === 0 && (
          <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-14 text-center">
            <ClipboardList className="mb-3 h-10 w-10 text-muted-foreground" />
            <p className="font-medium text-muted-foreground">No active assessments</p>
            <p className="mt-1 text-sm text-muted-foreground">
              You have no assessments assigned to your role right now.
            </p>
          </div>
        )}

        {!loading && periods.length > 0 && (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {periods.map((p) => {
              const sub = p.mySubmission
              const total = p.questions.length
              const answered = sub?.answeredCount ?? 0
              const pct = total > 0 ? Math.round((answered / total) * 100) : 0
              const isComplete = answered === total && total > 0
              const isExpiringSoon = !isPast(new Date(p.endDate)) &&
                new Date(p.endDate).getTime() - Date.now() < 24 * 60 * 60 * 1000

              return (
                <div
                  key={p.id}
                  className="group relative flex flex-col justify-between rounded-lg border bg-card p-5 transition-shadow hover:shadow-md"
                >
                  {isComplete && (
                    <div className="absolute right-3 top-3">
                      <CheckCircle2 className="h-5 w-5 text-green-500" />
                    </div>
                  )}

                  <div className="space-y-2">
                    <h3 className="pr-6 font-semibold leading-snug">{p.title}</h3>
                    {p.description && (
                      <p className="line-clamp-2 text-xs text-muted-foreground">{p.description}</p>
                    )}

                    <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {isPast(new Date(p.endDate))
                          ? "Closed"
                          : `Closes ${formatDistanceToNow(new Date(p.endDate), { addSuffix: true })}`}
                      </span>
                      {isExpiringSoon && !isComplete && (
                        <Badge variant="destructive" className="text-xs px-1.5 py-0">
                          Closing soon
                        </Badge>
                      )}
                    </div>
                  </div>

                  <div className="mt-4 space-y-3">
                    <div className="space-y-1.5">
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>{answered}/{total} questions answered</span>
                        <span>{pct}%</span>
                      </div>
                      <Progress value={pct} className="h-1.5" />
                    </div>

                    <Button
                      asChild
                      size="sm"
                      className="w-full"
                      variant={isComplete ? "outline" : "default"}
                    >
                      <Link href={`/assessment/${p.id}`}>
                        {isComplete ? "Review Submission" : !sub ? "Start Assessment" : "Continue"}
                        <ChevronRight className="ml-1 h-4 w-4" />
                      </Link>
                    </Button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* ── LOCATION INFO ────────────────────────────────────────────────────── */}
      {(user?.phc || user?.lga || user?.district) && (
        <div className="rounded-lg border bg-muted/30 p-4">
          <div className="flex items-center gap-2 text-sm font-medium">
            <Building2 className="h-4 w-4 text-muted-foreground" />
            Your Assigned Location
          </div>
          <div className="mt-2 grid grid-cols-3 gap-4 text-sm">
            {user?.district && (
              <div>
                <p className="text-xs text-muted-foreground">District</p>
                <p className="font-medium">{user.district.name}</p>
              </div>
            )}
            {user?.lga && (
              <div>
                <p className="text-xs text-muted-foreground">LGA</p>
                <p className="font-medium">{user.lga.name}</p>
              </div>
            )}
            {user?.phc && (
              <div>
                <p className="text-xs text-muted-foreground">PHC</p>
                <p className="font-medium">{user.phc.name}</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

function StatCard({
  icon,
  label,
  value,
  bg,
}: {
  icon: React.ReactNode
  label: string
  value: number
  bg: string
}) {
  return (
    <div className={`rounded-lg border p-4 space-y-2 ${bg}`}>
      <div className="flex items-center gap-2">
        {icon}
        <span className="text-xs text-muted-foreground">{label}</span>
      </div>
      <p className="text-2xl font-bold">{value}</p>
    </div>
  )
}

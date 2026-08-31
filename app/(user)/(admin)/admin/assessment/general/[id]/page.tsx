"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { toast } from "sonner"
import { format } from "date-fns"
import { Users, CheckCircle2, BarChart3, User } from "lucide-react"

import { PageHeader } from "@/components/PageHeader"
import { Skeleton } from "@/components/ui/skeleton"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Separator } from "@/components/ui/separator"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import api from "@/lib/api"

// ─── TYPES ────────────────────────────────────────────────────────────────────

type OptionStat = {
  value: string
  label: string
  count: number
  percentage: number
}

type QuestionStat = {
  id: string
  text: string
  order: number
  type: string
  category: { id: string; name: string }
  roles: { id: string; name: string; label: string }[]
  totalAnswers: number
  optionStats: OptionStat[]
  textResponses: { value: string; count: number }[] | null
}

type SubmissionSummary = {
  id: string
  answeredCount: number
  totalQuestions: number
  updatedAt: string
  // The facility being assessed. A submission belongs to the PHC, not the
  // person — `user` is null where the recording staff account no longer exists.
  phc: { id: string; name: string; lga: { name: string } | null } | null
  user: {
    id: string
    firstName: string
    lastName: string
    email: string
    phc: { name: string } | null
    lga: { name: string } | null
    roles: { role: { label: string } }[]
  } | null
}

type Results = {
  period: {
    id: string
    title: string
    description?: string
    type: string
    quarter: string | null
    year: number | null
    status: string
    startDate: string
    endDate: string
  }
  stats: {
    totalEligible: number
    totalSubmitted: number
    completionRate: number
    complianceScore: number | null
    categoryCompliance: { name: string; score: number }[] | null
  }
  questions: QuestionStat[]
  submissions: SubmissionSummary[]
}

function safecareColor(label: string) {
  if (label === "Fully Compliant") return "text-brand-verdant-700 dark:text-brand-verdant-400 font-medium"
  if (label === "Partially Compliant") return "text-brand-amber-600 dark:text-brand-amber-400 font-medium"
  if (label === "Not Compliant") return "text-brand-crimson-600 dark:text-brand-crimson-400 font-medium"
  if (label === "Not Applicable") return "text-muted-foreground"
  return ""
}

function safecareBarColor(label: string) {
  if (label === "Fully Compliant") return "[&>*]:bg-brand-verdant-500"
  if (label === "Partially Compliant") return "[&>*]:bg-brand-amber-400"
  if (label === "Not Compliant") return "[&>*]:bg-brand-crimson-500"
  return ""
}

const STATUS_COLORS: Record<string, string> = {
  DRAFT: "bg-brand-charcoal-100 text-brand-charcoal-600 dark:bg-brand-charcoal-700 dark:text-brand-charcoal-200",
  ACTIVE: "bg-brand-verdant-100 text-brand-verdant-700 dark:bg-brand-verdant-900 dark:text-brand-verdant-300",
  CLOSED: "bg-brand-crimson-100 text-brand-crimson-700 dark:bg-brand-crimson-900 dark:text-brand-crimson-300",
}

// ─── PAGE ─────────────────────────────────────────────────────────────────────

export default function PeriodResultsPage() {
  const { id } = useParams<{ id: string }>()
  const [results, setResults] = useState<Results | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedUser, setSelectedUser] = useState<SubmissionSummary | null>(
    null
  )
  const [userDetail, setUserDetail] = useState<any>(null)
  const [detailLoading, setDetailLoading] = useState(false)

  useEffect(() => {
    api
      .get(`/assessment/periods/${id}/results`)
      .then((res) => setResults(res.data))
      .catch(() => toast.error("Failed to load results"))
      .finally(() => setLoading(false))
  }, [id])

  async function openUserDetail(sub: SubmissionSummary) {
    setSelectedUser(sub)
    setDetailLoading(true)
    try {
      const res = await api.get(
        `/assessment/periods/${id}/results/${sub.phc?.id ?? ""}`
      )
      setUserDetail(res.data)
    } catch {
      toast.error("Failed to load submission detail")
    } finally {
      setDetailLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-64" />
        <div className="grid grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
        {[...Array(4)].map((_, i) => (
          <Skeleton key={i} className="h-20 w-full" />
        ))}
      </div>
    )
  }

  if (!results) return null

  const { period, stats, questions, submissions } = results

  // Group questions by category
  const byCategory = questions.reduce<Record<string, QuestionStat[]>>(
    (acc, q) => {
      const key = q.category.id
      if (!acc[key]) acc[key] = []
      acc[key].push(q)
      return acc
    },
    {}
  )

  return (
    <div className="space-y-8">
      <PageHeader
        title={period.title}
        description={period.description}
        back
        fallbackHref={period.type === "SAFECARE" ? "/admin/assessment/safecare" : "/admin/assessment/general"}
        badges={[period.type, period.status]}
        action={
          <div className="text-sm text-muted-foreground">
            {format(new Date(period.startDate), "dd MMM yyyy")} –{" "}
            {format(new Date(period.endDate), "dd MMM yyyy")}
          </div>
        }
      />

      {/* ── STATS CARDS ─────────────────────────────────────────────────────── */}
      <div className={`grid grid-cols-1 gap-2 ${period.type === "SAFECARE" ? "md:grid-cols-4" : "md:grid-cols-3"}`}>
        <StatCard
          icon={<Users className="h-5 w-5 text-brand-sky-600" />}
          label="Eligible Staff"
          value={stats.totalEligible}
          bg="bg-brand-sky-50 dark:bg-brand-sky-900"
        />
        <StatCard
          icon={<CheckCircle2 className="h-5 w-5 text-brand-verdant-600" />}
          label="Submitted"
          value={stats.totalSubmitted}
          bg="bg-brand-verdant-50 dark:bg-brand-verdant-900"
        />
        <div className="space-y-2 rounded-lg border p-4">
          <div className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-primary" />
            <span className="text-sm text-muted-foreground">Completion Rate</span>
          </div>
          <p className="text-2xl font-bold">{stats.completionRate}%</p>
          <Progress value={stats.completionRate} className="h-2" />
        </div>
        {period.type === "SAFECARE" && stats.complianceScore !== null && (
          <div className={`space-y-2 rounded-lg border p-4 ${stats.complianceScore >= 75 ? "bg-brand-verdant-50 dark:bg-brand-verdant-900" : stats.complianceScore >= 50 ? "bg-brand-amber-50 dark:bg-brand-amber-900" : "bg-brand-crimson-50 dark:bg-brand-crimson-900"}`}>
            <div className="flex items-center gap-2">
              <User className="h-5 w-5 text-primary" />
              <span className="text-sm text-muted-foreground">SafeCare Compliance</span>
            </div>
            <p className="text-2xl font-bold">{stats.complianceScore}%</p>
            <Progress
              value={stats.complianceScore}
              className={`h-2 ${stats.complianceScore >= 75 ? "[&>*]:bg-brand-verdant-500" : stats.complianceScore >= 50 ? "[&>*]:bg-brand-amber-400" : "[&>*]:bg-brand-crimson-500"}`}
            />
          </div>
        )}
      </div>

      {/* ── SAFECARE CATEGORY COMPLIANCE ────────────────────────────────────── */}
      {period.type === "SAFECARE" && stats.categoryCompliance && stats.categoryCompliance.length > 0 && (
        <>
          <Separator />
          <div className="space-y-3">
            <h2 className="text-base font-medium">Compliance by Domain</h2>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {stats.categoryCompliance.map((cat) => (
                <div key={cat.name} className="rounded-lg border p-3 space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-medium leading-tight">{cat.name}</p>
                    <span className={`shrink-0 text-sm font-bold ${cat.score >= 75 ? "text-brand-verdant-600" : cat.score >= 50 ? "text-brand-amber-600" : "text-brand-crimson-600"}`}>
                      {cat.score}%
                    </span>
                  </div>
                  <Progress
                    value={cat.score}
                    className={`h-1.5 ${cat.score >= 75 ? "[&>*]:bg-brand-verdant-500" : cat.score >= 50 ? "[&>*]:bg-brand-amber-400" : "[&>*]:bg-brand-crimson-500"}`}
                  />
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      <Separator />

      {/* ── PER-QUESTION BREAKDOWN ──────────────────────────────────────────── */}
      <div className="space-y-6">
        <h2 className="text-base font-medium">Question Breakdown</h2>
        {Object.entries(byCategory).map(([catId, qs]) => (
          <div key={catId} className="space-y-4">
            <h3 className="inline-block rounded-md bg-primary px-3 py-1.5 text-sm font-semibold text-primary-foreground">
              {qs[0].category.name}
            </h3>
            {qs.map((q, idx) => (
              <div key={q.id} className="space-y-3 rounded-lg border p-4">
                <p className="text-sm font-medium">
                  <span className="mr-2 text-muted-foreground">{idx + 1}.</span>
                  {q.text}
                </p>
                <p className="text-xs text-muted-foreground">
                  {q.totalAnswers} response(s)
                </p>
                <div className="space-y-2">
                  {q.type === "TEXT_INPUT" ? (
                    q.textResponses && q.textResponses.length > 0 ? (
                      <div className="space-y-1.5">
                        {q.textResponses.slice(0, 8).map((r) => (
                          <div key={r.value} className="flex items-start justify-between gap-4 rounded-md bg-muted/40 px-3 py-2 text-xs">
                            <span className="flex-1 text-foreground">{r.value}</span>
                            {r.count > 1 && (
                              <span className="shrink-0 text-muted-foreground">×{r.count}</span>
                            )}
                          </div>
                        ))}
                        {q.textResponses.length > 8 && (
                          <p className="text-xs text-muted-foreground pl-1">
                            +{q.textResponses.length - 8} more unique responses
                          </p>
                        )}
                      </div>
                    ) : (
                      <p className="text-xs text-muted-foreground">No responses yet</p>
                    )
                  ) : (
                    q.optionStats.map((opt) => (
                      <div key={opt.value} className="space-y-1">
                        <div className="flex justify-between text-xs">
                          <span className={safecareColor(opt.label)}>{opt.label}</span>
                          <span className="text-muted-foreground">
                            {opt.count} ({opt.percentage}%)
                          </span>
                        </div>
                        <Progress value={opt.percentage} className={`h-1.5 ${safecareBarColor(opt.label)}`} />
                      </div>
                    ))
                  )}
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>

      <Separator />

      {/* ── SUBMISSIONS TABLE ────────────────────────────────────────────────── */}
      <div className="space-y-4">
        <h2 className="text-base font-medium">Individual Submissions</h2>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Staff</TableHead>
              <TableHead>Roles</TableHead>
              <TableHead>PHC</TableHead>
              <TableHead>Progress</TableHead>
              <TableHead>Last Updated</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {submissions.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={5}
                  className="py-10 text-center text-muted-foreground"
                >
                  No submissions yet
                </TableCell>
              </TableRow>
            )}
            {submissions.map((s) => (
              <TableRow
                key={s.id}
                className="cursor-pointer hover:bg-muted/50"
                onClick={() => openUserDetail(s)}
              >
                <TableCell>
                  {s.user ? (
                    <>
                      <p className="font-medium">
                        {s.user.firstName} {s.user.lastName}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {s.user.email}
                      </p>
                    </>
                  ) : (
                    <p className="text-sm italic text-muted-foreground">
                      Staff account removed
                    </p>
                  )}
                </TableCell>
                <TableCell>
                  <div className="flex flex-wrap gap-1">
                    {s.user?.roles.map((r, i) => (
                      <Badge key={i} variant="outline" className="text-xs">
                        {r.role.label}
                      </Badge>
                    ))}
                  </div>
                </TableCell>
                <TableCell className="text-sm">
                  {s.phc?.name ?? s.user?.phc?.name ?? "—"}
                </TableCell>
                <TableCell>
                  <div className="space-y-1">
                    <span className="text-xs text-muted-foreground">
                      {s.answeredCount}/{s.totalQuestions}
                    </span>
                    <Progress
                      value={
                        (s.answeredCount / Math.max(s.totalQuestions, 1)) * 100
                      }
                      className="h-1.5 w-24"
                    />
                  </div>
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {format(new Date(s.updatedAt), "dd MMM yyyy, HH:mm")}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* ── USER DETAIL DIALOG ───────────────────────────────────────────────── */}
      <Dialog
        open={!!selectedUser}
        onOpenChange={(o) => {
          if (!o) {
            setSelectedUser(null)
            setUserDetail(null)
          }
        }}
      >
        <DialogContent className="max-h-[80vh] max-w-2xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {selectedUser?.phc?.name ?? "Facility"} &mdash;{" "}
              {selectedUser?.user
                ? `recorded by ${selectedUser.user.firstName} ${selectedUser.user.lastName}`
                : "staff account removed"}
            </DialogTitle>
          </DialogHeader>
          {detailLoading && (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-16" />
              ))}
            </div>
          )}
          {userDetail && !detailLoading && (
            <div className="space-y-4">
              {userDetail.answers.map((a: any) => (
                <div key={a.id} className="space-y-1.5 rounded-md border p-3">
                  <p className="text-sm font-medium">{a.question.text}</p>
                  <div className="flex flex-wrap gap-1.5">
                    {a.selectedOptions.map((v: string) => {
                      const label =
                        a.question.type === "YES_NO_NA"
                          ? v === "NOT_APPLICABLE"
                            ? "Not Applicable"
                            : v.charAt(0) + v.slice(1).toLowerCase()
                          : (a.question.options.find((o: any) => o.id === v)
                              ?.text ?? v)
                      return (
                        <Badge key={v} variant="secondary">
                          {label}
                        </Badge>
                      )
                    })}
                    {a.selectedOptions.length === 0 && (
                      <span className="text-xs text-muted-foreground">
                        No answer
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>
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
    <div className={`space-y-2 rounded-lg border p-4 ${bg}`}>
      <div className="flex items-center gap-2">
        {icon}
        <span className="text-sm text-muted-foreground">{label}</span>
      </div>
      <p className="text-2xl font-bold">{value}</p>
    </div>
  )
}

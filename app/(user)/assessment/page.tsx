"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { toast } from "sonner"
import { format } from "date-fns"
import { ClipboardList, CheckCircle2, Clock, ChevronRight } from "lucide-react"

import { PageHeader } from "@/components/PageHeader"
import { Skeleton } from "@/components/ui/skeleton"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import api from "@/lib/api"

type MyPeriod = {
  id: string
  title: string
  description?: string
  type: string
  startDate: string
  endDate: string
  questions: any[]
  mySubmission: {
    id: string
    answeredCount: number
    totalQuestions: number
    updatedAt: string
  } | null
}

export default function AssessmentListPage() {
  const [periods, setPeriods] = useState<MyPeriod[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get("/assessment/my")
      .then((res) => setPeriods(res.data))
      .catch(() => toast.error("Failed to load assessments"))
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="space-y-4">
        <PageHeader title="My Assessments" />
        {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-32 w-full" />)}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="My Assessments"
        description="Active assessment periods assigned to your role"
      />

      {periods.length === 0 && (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-16 text-center">
          <ClipboardList className="mb-3 h-10 w-10 text-muted-foreground" />
          <p className="text-muted-foreground">No active assessments at the moment.</p>
          <p className="mt-1 text-sm text-muted-foreground">Check back when an assessment period is open.</p>
        </div>
      )}

      <div className="grid gap-4">
        {periods.map((p) => {
          const sub = p.mySubmission
          const total = p.questions.length
          const answered = sub?.answeredCount ?? 0
          const pct = total > 0 ? Math.round((answered / total) * 100) : 0
          const isComplete = answered === total && total > 0
          const isNew = !sub

          return (
            <div key={p.id} className="rounded-lg border bg-card p-5 space-y-4">
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold">{p.title}</h3>
                    {isComplete && (
                      <Badge className="bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300">
                        <CheckCircle2 className="mr-1 h-3 w-3" /> Submitted
                      </Badge>
                    )}
                    {isNew && (
                      <Badge variant="secondary">New</Badge>
                    )}
                  </div>
                  {p.description && (
                    <p className="text-sm text-muted-foreground">{p.description}</p>
                  )}
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    <span>
                      Closes {format(new Date(p.endDate), "dd MMM yyyy, HH:mm")}
                    </span>
                  </div>
                </div>
                <Button asChild size="sm">
                  <Link href={`/assessment/${p.id}`}>
                    {isComplete ? "Review / Edit" : isNew ? "Start" : "Continue"}
                    <ChevronRight className="ml-1 h-4 w-4" />
                  </Link>
                </Button>
              </div>

              <div className="space-y-1">
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>{answered} of {total} questions answered</span>
                  <span>{pct}%</span>
                </div>
                <Progress value={pct} className="h-2" />
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

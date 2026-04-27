"use client"

import { useEffect, useRef, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { toast } from "sonner"
import { format, isPast } from "date-fns"
import { CheckCircle2, Clock, Save } from "lucide-react"

import { PageHeader } from "@/components/PageHeader"
import { Skeleton } from "@/components/ui/skeleton"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import api from "@/lib/api"

// ─── TYPES ────────────────────────────────────────────────────────────────────

type Option = { id: string; text: string; order: number }
type Category = { id: string; name: string; order: number }
type Question = {
  id: string
  text: string
  order: number
  type: "YES_NO_NA" | "SINGLE_SELECT" | "MULTI_SELECT"
  category: Category
  options: Option[]
}

type Period = {
  id: string
  title: string
  description?: string
  endDate: string
  questions: Question[]
  mySubmission: {
    id: string
    answeredCount: number
    totalQuestions: number
    updatedAt: string
  } | null
}

type AnswersMap = Record<string, string[]>

const YES_NO_OPTIONS = [
  { value: "YES", label: "Yes" },
  { value: "NO", label: "No" },
  { value: "NOT_APPLICABLE", label: "Not Applicable" },
]

// ─── PAGE ─────────────────────────────────────────────────────────────────────

export default function AssessmentFormPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()

  const [period, setPeriod] = useState<Period | null>(null)
  const [answers, setAnswers] = useState<AnswersMap>({})
  const [activeCatId, setActiveCatId] = useState<string>("")
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(true)
  const categoryRefs = useRef<Record<string, HTMLDivElement | null>>({})

  useEffect(() => {
    async function load() {
      try {
        const [periodRes, submissionRes] = await Promise.all([
          api
            .get("/assessment/my")
            .then((r) => (r.data as Period[]).find((p) => p.id === id)),
          api
            .get(`/assessment/periods/${id}/my-submission`)
            .catch(() => ({ data: null })),
        ])

        if (!periodRes) {
          toast.error("Assessment not found or not accessible")
          router.push("/assessment")
          return
        }

        setPeriod(periodRes)
        setActiveCatId(getCategories(periodRes.questions)[0]?.id ?? "")

        const existingAnswers = submissionRes.data?.answers ?? []
        const map: AnswersMap = {}
        for (const a of existingAnswers) {
          map[a.questionId] = a.selectedOptions
        }
        setAnswers(map)
      } catch {
        toast.error("Failed to load assessment")
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [id])

  // Auto-highlight active category as user scrolls
  useEffect(() => {
    if (!period) return

    const observer = new IntersectionObserver(
      (entries) => {
        // Pick the topmost intersecting section
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)
        if (visible.length > 0) {
          setActiveCatId(visible[0].target.getAttribute("data-cat-id") ?? "")
        }
      },
      { rootMargin: "-15% 0px -70% 0px", threshold: 0 }
    )

    Object.values(categoryRefs.current).forEach((el) => {
      if (el) observer.observe(el)
    })

    return () => observer.disconnect()
  }, [period])

  function getCategories(questions: Question[]): Category[] {
    const seen = new Set<string>()
    return questions
      .map((q) => q.category)
      .filter((c) => {
        if (seen.has(c.id)) return false
        seen.add(c.id)
        return true
      })
      .sort((a, b) => a.order - b.order)
  }

  function getQuestionsInCategory(catId: string): Question[] {
    return (period?.questions ?? [])
      .filter((q) => q.category.id === catId)
      .sort((a, b) => a.order - b.order)
  }

  function answeredInCategory(catId: string): number {
    return getQuestionsInCategory(catId).filter(
      (q) => (answers[q.id] ?? []).length > 0
    ).length
  }

  function totalAnswered(): number {
    return Object.values(answers).filter((v) => v.length > 0).length
  }

  function setAnswer(questionId: string, value: string[]) {
    setAnswers((prev) => ({ ...prev, [questionId]: value }))
  }

  function scrollToCategory(catId: string) {
    setActiveCatId(catId)
    categoryRefs.current[catId]?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    })
  }

  async function handleSave() {
    if (!period) return
    setSaving(true)
    try {
      const payload = {
        answers: Object.entries(answers)
          .filter(([, v]) => v.length > 0)
          .map(([questionId, selectedOptions]) => ({
            questionId,
            selectedOptions,
          })),
      }
      await api.post(`/assessment/periods/${id}/submit`, payload)
      toast.success("Answers saved successfully")
    } catch (err: any) {
      const msg = err?.response?.data?.message
      toast.error(
        Array.isArray(msg) ? msg.join(", ") : msg || "Failed to save answers"
      )
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-64" />
        <div className="flex gap-6">
          <div className="hidden w-56 shrink-0 space-y-2 md:block">
            {[...Array(8)].map((_, i) => (
              <Skeleton key={i} className="h-14 w-full rounded-lg" />
            ))}
          </div>
          <div className="flex-1 space-y-4">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-20 w-full" />
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (!period) return null

  const categories = getCategories(period.questions)
  const total = period.questions.length
  const answered = totalAnswered()
  const pct = total > 0 ? Math.round((answered / total) * 100) : 0
  const closed = isPast(new Date(period.endDate))

  // Global question numbering
  const globalNumbers: Record<string, number> = {}
  let counter = 1
  for (const cat of categories) {
    for (const q of getQuestionsInCategory(cat.id)) {
      globalNumbers[q.id] = counter++
    }
  }

  return (
    <div className="space-y-6">
      {/* ── HEADER ────────────────────────────────────────────────────────── */}
      <PageHeader
        title={period.title}
        description={period.description}
        back
        fallbackHref="/assessment"
        action={
          <Button onClick={handleSave} disabled={saving || closed}>
            <Save className="mr-2 h-4 w-4" />
            {saving ? "Saving..." : "Save Answers"}
          </Button>
        }
      />

      {closed && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
          This assessment period has closed. Your submission is now read-only.
        </div>
      )}

      {/* ── OVERALL PROGRESS ──────────────────────────────────────────────── */}
      <div className="space-y-2 rounded-lg border p-4">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Overall Progress</span>
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <span>
              {answered}/{total} answered
            </span>
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              Closes {format(new Date(period.endDate), "dd MMM yyyy, HH:mm")}
            </span>
          </div>
        </div>
        <Progress value={pct} className="h-2" />
      </div>

      {/* ── MOBILE: horizontal scrollable tabs ────────────────────────────── */}
      <div className="flex gap-2 overflow-x-auto pb-1 md:hidden">
        {categories.map((cat, idx) => {
          const catTotal = getQuestionsInCategory(cat.id).length
          const catAnswered = answeredInCategory(cat.id)
          const catComplete = catAnswered === catTotal && catTotal > 0
          const isActive = activeCatId === cat.id

          return (
            <button
              key={cat.id}
              onClick={() => scrollToCategory(cat.id)}
              className={`flex shrink-0 flex-col items-center gap-1 rounded-lg border px-3 py-2 text-center transition-colors ${
                isActive
                  ? "border-primary/25 bg-primary/8 text-primary"
                  : "border-border bg-card hover:bg-muted"
              }`}
            >
              <div
                className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold ${
                  catComplete
                    ? "bg-green-500 text-white"
                    : isActive
                      ? "bg-primary/15 text-primary"
                      : "bg-muted-foreground/10 text-muted-foreground"
                }`}
              >
                {catComplete ? <CheckCircle2 className="h-4 w-4" /> : idx + 1}
              </div>
              <span className="max-w-[72px] truncate text-xs leading-tight">
                {cat.name}
              </span>
              <span
                className={`text-xs ${isActive ? "text-primary/60" : "text-muted-foreground"}`}
              >
                {catAnswered}/{catTotal}
              </span>
            </button>
          )
        })}
      </div>

      {/* ── DESKTOP: sidebar + questions ──────────────────────────────────── */}
      <div className="flex gap-8">
        {/* Sticky sidebar — desktop only */}
        <aside className="hidden w-56 shrink-0 md:block">
          <div className="sticky top-6 max-h-[calc(100vh-8rem)] space-y-1 overflow-y-auto pr-1">
            {categories.map((cat, idx) => {
              const catTotal = getQuestionsInCategory(cat.id).length
              const catAnswered = answeredInCategory(cat.id)
              const catComplete = catAnswered === catTotal && catTotal > 0
              const isActive = activeCatId === cat.id
              const catPct =
                catTotal > 0 ? Math.round((catAnswered / catTotal) * 100) : 0

              return (
                <button
                  key={cat.id}
                  onClick={() => scrollToCategory(cat.id)}
                  className={`w-full rounded-lg border px-3 py-2.5 text-left transition-colors ${
                    isActive
                      ? "border-primary/25 bg-primary/8 text-primary"
                      : "border-transparent hover:border-border hover:bg-muted"
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <div
                      className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                        catComplete
                          ? "bg-green-500 text-white"
                          : isActive
                            ? "bg-primary/15 text-primary"
                            : "bg-muted-foreground/10 text-muted-foreground"
                      }`}
                    >
                      {catComplete ? (
                        <CheckCircle2 className="h-3.5 w-3.5" />
                      ) : (
                        idx + 1
                      )}
                    </div>
                    <span className="flex-1 truncate text-sm leading-snug font-medium">
                      {cat.name}
                    </span>
                  </div>

                  {/* Mini progress bar */}
                  <div className="mt-2 space-y-0.5">
                    <div
                      className={`flex justify-between text-xs ${
                        isActive ? "text-primary/60" : "text-muted-foreground"
                      }`}
                    >
                      <span>
                        {catAnswered}/{catTotal}
                      </span>
                      <span>{catPct}%</span>
                    </div>
                    <div className="h-1 w-full rounded-full bg-muted">
                      <div
                        className={`h-1 rounded-full transition-all ${
                          catComplete ? "bg-green-500" : "bg-primary"
                        }`}
                        style={{ width: `${catPct}%` }}
                      />
                    </div>
                  </div>
                </button>
              )
            })}
          </div>
        </aside>

        {/* Questions */}
        <div className="min-w-0 flex-1 space-y-10">
          {categories.map((cat) => {
            const catQuestions = getQuestionsInCategory(cat.id)
            return (
              <div
                key={cat.id}
                ref={(el) => {
                  categoryRefs.current[cat.id] = el
                }}
                data-cat-id={cat.id}
                className="scroll-mt-6 space-y-4"
              >
                <div className="rounded-md bg-primary px-4 py-2">
                  <h2 className="font-semibold text-primary-foreground">
                    {cat.name}
                  </h2>
                </div>

                {catQuestions.map((q) => (
                  <QuestionItem
                    key={q.id}
                    question={q}
                    number={globalNumbers[q.id]}
                    value={answers[q.id] ?? []}
                    onChange={(val) => setAnswer(q.id, val)}
                    disabled={closed}
                  />
                ))}
              </div>
            )
          })}

          {/* Bottom save button */}
          {!closed && (
            <div className="flex justify-end pb-4">
              <Button
                size="lg"
                onClick={handleSave}
                disabled={saving}
                className="shadow-md"
              >
                <Save className="mr-2 h-4 w-4" />
                {saving ? "Saving..." : `Save (${answered}/${total} answered)`}
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── QUESTION ITEM ────────────────────────────────────────────────────────────

function QuestionItem({
  question,
  number,
  value,
  onChange,
  disabled,
}: {
  question: Question
  number: number
  value: string[]
  onChange: (val: string[]) => void
  disabled: boolean
}) {
  const answered = value.length > 0

  return (
    <div
      className={`rounded-lg border p-4 transition-colors ${
        answered
          ? "border-green-300 bg-green-50/30 dark:border-green-800 dark:bg-green-950/20"
          : ""
      }`}
    >
      <p className="mb-3 text-sm font-medium">
        <span className="mr-2 font-bold text-primary">{number}.</span>
        {question.text}
      </p>

      {question.type === "YES_NO_NA" && (
        <RadioGroup
          value={value[0] ?? ""}
          onValueChange={(v) => onChange([v])}
          disabled={disabled}
          className="flex flex-wrap gap-4"
        >
          {YES_NO_OPTIONS.map((opt) => (
            <div key={opt.value} className="flex items-center gap-2">
              <RadioGroupItem
                value={opt.value}
                id={`${question.id}-${opt.value}`}
              />
              <Label
                htmlFor={`${question.id}-${opt.value}`}
                className="cursor-pointer font-normal"
              >
                {opt.label}
              </Label>
            </div>
          ))}
        </RadioGroup>
      )}

      {question.type === "SINGLE_SELECT" && (
        <Select
          value={value[0] ?? ""}
          onValueChange={(v) => onChange([v])}
          disabled={disabled}
        >
          <SelectTrigger className="w-full max-w-xs">
            <SelectValue placeholder="Select an option..." />
          </SelectTrigger>
          <SelectContent>
            {question.options.map((opt) => (
              <SelectItem key={opt.id} value={opt.id}>
                {opt.text}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}

      {question.type === "MULTI_SELECT" && (
        <div className="flex flex-wrap gap-3">
          {question.options.map((opt) => {
            const checked = value.includes(opt.id)
            return (
              <div key={opt.id} className="flex items-center gap-2">
                <Checkbox
                  id={`${question.id}-${opt.id}`}
                  checked={checked}
                  disabled={disabled}
                  onCheckedChange={(v) => {
                    onChange(
                      v ? [...value, opt.id] : value.filter((x) => x !== opt.id)
                    )
                  }}
                />
                <Label
                  htmlFor={`${question.id}-${opt.id}`}
                  className="cursor-pointer font-normal"
                >
                  {opt.text}
                </Label>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

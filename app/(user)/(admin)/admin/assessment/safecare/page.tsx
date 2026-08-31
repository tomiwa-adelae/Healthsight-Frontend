"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { toast } from "sonner"
import { format } from "date-fns"
import {
  ShieldCheck,
  BarChart3,
  Clock,
  Plus,
  MoreHorizontal,
  Eye,
  Pencil,
  Trash2,
  ChevronDown,
  ChevronRight,
} from "lucide-react"

import { PageHeader } from "@/components/PageHeader"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Sheet,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import api from "@/lib/api"

// ─── TYPES ────────────────────────────────────────────────────────────────────

type Quarter = "Q1" | "Q2" | "Q3" | "Q4"

type Period = {
  id: string
  title: string
  description: string | null
  type: string
  quarter: Quarter | null
  year: number | null
  status: "DRAFT" | "ACTIVE" | "CLOSED"
  startDate: string
  endDate: string
  _count: { questions: number; submissions: number }
  createdBy: { firstName: string; lastName: string }
}

type Category = {
  id: string
  name: string
  order: number
  questions: { id: string }[]
}

type Question = {
  id: string
  text: string
  order: number
  type: string
  category: Category
  roles: { role: { id: string; label: string } }[]
}

// ─── CONSTANTS ────────────────────────────────────────────────────────────────

const STATUS_COLORS: Record<string, string> = {
  DRAFT: "bg-brand-charcoal-100 text-brand-charcoal-600 dark:bg-brand-charcoal-700 dark:text-brand-charcoal-200",
  ACTIVE: "bg-brand-verdant-100 text-brand-verdant-700 dark:bg-brand-verdant-900 dark:text-brand-verdant-300",
  CLOSED: "bg-brand-crimson-100 text-brand-crimson-700 dark:bg-brand-crimson-900 dark:text-brand-crimson-300",
}

const QUARTERS: Quarter[] = ["Q1", "Q2", "Q3", "Q4"]
const CURRENT_YEAR = new Date().getFullYear()
const YEARS = Array.from({ length: 6 }, (_, i) => CURRENT_YEAR - 1 + i)

// ─── SCHEMA ───────────────────────────────────────────────────────────────────

const periodSchema = z.object({
  quarter: z.enum(["Q1", "Q2", "Q3", "Q4"]),
  year: z.number().min(2020).max(2100),
  description: z.string().optional(),
  startDate: z.string().min(1, "Start date is required"),
  endDate: z.string().min(1, "End date is required"),
})

type PeriodFormValues = z.infer<typeof periodSchema>

// ─── PAGE ─────────────────────────────────────────────────────────────────────

export default function SafecareAdminPage() {
  const router = useRouter()
  const [periods, setPeriods] = useState<Period[]>([])
  const [questions, setQuestions] = useState<Question[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [pSheet, setPSheet] = useState<{ open: boolean; data?: Period }>({
    open: false,
  })
  const [deleteTarget, setDeleteTarget] = useState<{
    id: string
    name: string
  } | null>(null)
  const [deleting, setDeleting] = useState(false)

  async function fetchAll() {
    setLoading(true)
    try {
      const [periodsRes, questionsRes, categoriesRes] = await Promise.all([
        api.get("/assessment/periods?type=SAFECARE"),
        api.get("/assessment/questions?type=SAFECARE"),
        api.get("/assessment/categories?type=SAFECARE"),
      ])
      setPeriods(periodsRes.data)
      setQuestions(questionsRes.data)
      setCategories(
        categoriesRes.data.sort((a: Category, b: Category) => a.order - b.order)
      )
    } catch {
      toast.error("Failed to load SafeCare data")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAll()
  }, [])

  async function updateStatus(id: string, status: string) {
    try {
      await api.patch(`/assessment/periods/${id}`, { status })
      toast.success("Status updated")
      fetchAll()
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to update status")
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      await api.delete(`/assessment/periods/${deleteTarget.id}`)
      toast.success("Period deleted")
      setDeleteTarget(null)
      fetchAll()
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Delete failed")
    } finally {
      setDeleting(false)
    }
  }

  const active = periods.filter((p) => p.status === "ACTIVE")
  const draft = periods.filter((p) => p.status === "DRAFT")
  const totalSubmissions = periods.reduce((s, p) => s + p._count.submissions, 0)

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <Skeleton className="h-7 w-52" />
            <Skeleton className="h-4 w-80" />
          </div>
        </div>
        <div className="grid grid-cols-3 gap-2">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-20 rounded-lg" />
          ))}
        </div>
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-20 rounded-lg" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="SafeCare Assessment"
        description="Standards-based quality improvement assessment across 14 domains"
      />

      {/* Summary cards */}
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
        <SummaryCard
          icon={<ShieldCheck className="h-5 w-5 text-brand-verdant-600" />}
          label="Active Periods"
          value={active.length}
          bg="bg-brand-verdant-50 dark:bg-brand-verdant-900/40"
        />
        <SummaryCard
          icon={<Clock className="h-5 w-5 text-brand-charcoal-400" />}
          label="Draft Periods"
          value={draft.length}
          bg="bg-brand-charcoal-50 dark:bg-brand-charcoal-800/60"
        />
        <SummaryCard
          icon={<BarChart3 className="h-5 w-5 text-brand-sky-600" />}
          label="Total Submissions"
          value={totalSubmissions}
          bg="bg-brand-sky-50 dark:bg-brand-sky-900/40"
        />
      </div>

      <Tabs defaultValue="periods">
        <TabsList>
          <TabsTrigger value="periods">
            Periods{" "}
            <Badge variant="secondary" className="ml-1.5">
              {periods.length}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="questions">
            Question Bank{" "}
            <Badge variant="secondary" className="ml-1.5">
              {questions.length}
            </Badge>
          </TabsTrigger>
        </TabsList>

        {/* ── PERIODS ──────────────────────────────────────────────────────── */}
        <TabsContent value="periods" className="space-y-4 pt-4">
          <div className="flex justify-end">
            <Button onClick={() => setPSheet({ open: true })}>
              <Plus className="mr-2 h-4 w-4" /> New Period
            </Button>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Period</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Start</TableHead>
                <TableHead>End</TableHead>
                <TableHead>Questions</TableHead>
                <TableHead>Submissions</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {periods.length === 0 && (
                <TableRow>
                  <TableCell
                    colSpan={7}
                    className="py-10 text-center text-muted-foreground"
                  >
                    No SafeCare periods yet. Create one to get started.
                  </TableCell>
                </TableRow>
              )}
              {periods?.map((p) => (
                <TableRow key={p.id}>
                  <TableCell>
                    <p className="font-medium">{p.title}</p>
                    {p.description && (
                      <p className="text-xs text-muted-foreground">
                        {p.description}
                      </p>
                    )}
                  </TableCell>
                  <TableCell>
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_COLORS[p.status]}`}
                    >
                      {p.status}
                    </span>
                  </TableCell>
                  <TableCell className="text-sm">
                    {format(new Date(p.startDate), "dd MMM yyyy")}
                  </TableCell>
                  <TableCell className="text-sm">
                    {format(new Date(p.endDate), "dd MMM yyyy")}
                  </TableCell>
                  <TableCell>{p._count.questions}</TableCell>
                  <TableCell>{p._count.submissions}</TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={() =>
                            router.push(`/admin/assessment/safecare/${p.id}`)
                          }
                        >
                          <Eye className="mr-2 h-4 w-4" /> View Results
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => setPSheet({ open: true, data: p })}
                        >
                          <Pencil className="mr-2 h-4 w-4" /> Edit
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        {p.status === "DRAFT" && (
                          <DropdownMenuItem
                            onClick={() => updateStatus(p.id, "ACTIVE")}
                          >
                            Set Active
                          </DropdownMenuItem>
                        )}
                        {p.status === "ACTIVE" && (
                          <DropdownMenuItem
                            onClick={() => updateStatus(p.id, "CLOSED")}
                          >
                            Close Period
                          </DropdownMenuItem>
                        )}
                        {p.status === "CLOSED" && (
                          <DropdownMenuItem
                            onClick={() => updateStatus(p.id, "ACTIVE")}
                          >
                            Reopen Period
                          </DropdownMenuItem>
                        )}
                        {p.status === "DRAFT" && (
                          <>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className="text-destructive focus:text-destructive"
                              onClick={() =>
                                setDeleteTarget({ id: p.id, name: p.title })
                              }
                            >
                              <Trash2 className="mr-2 h-4 w-4" /> Delete
                            </DropdownMenuItem>
                          </>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TabsContent>

        {/* ── QUESTION BANK (read-only) ─────────────────────────────────── */}
        <TabsContent value="questions" className="space-y-4 pt-4">
          <p className="text-sm text-muted-foreground">
            The SafeCare question bank contains {questions.length} indicators
            across {categories.length} domains. Questions are managed through
            the admin seed — contact your system administrator to update them.
          </p>
          <QuestionBankView categories={categories} questions={questions} />
        </TabsContent>
      </Tabs>

      <PeriodSheet
        open={pSheet.open}
        data={pSheet.data}
        onClose={() => setPSheet({ open: false })}
        onSaved={fetchAll}
      />

      <AlertDialog
        open={!!deleteTarget}
        onOpenChange={(o) => !o && setDeleteTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this period?</AlertDialogTitle>
            <AlertDialogDescription>
              <strong>{deleteTarget?.name}</strong> will be permanently deleted.
              This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleting}
              className="text-destructive-foreground bg-destructive hover:bg-destructive/90"
            >
              {deleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

// ─── QUESTION BANK VIEW ───────────────────────────────────────────────────────

function QuestionBankView({
  categories,
  questions,
}: {
  categories: Category[]
  questions: Question[]
}) {
  const [expanded, setExpanded] = useState<Set<string>>(new Set())

  function toggle(id: string) {
    setExpanded((prev) => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  return (
    <div className="space-y-2">
      {categories.map((cat) => {
        const catQs = questions
          .filter((q) => q.category.id === cat.id)
          .sort((a, b) => a.order - b.order)
        const isOpen = expanded.has(cat.id)
        return (
          <div key={cat.id} className="overflow-hidden rounded-lg border">
            <button
              type="button"
              className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-muted/50"
              onClick={() => toggle(cat.id)}
            >
              {isOpen ? (
                <ChevronDown className="h-4 w-4 shrink-0" />
              ) : (
                <ChevronRight className="h-4 w-4 shrink-0" />
              )}
              <span className="flex-1 text-sm font-medium">{cat.name}</span>
              <Badge variant="secondary" className="text-xs">
                {catQs.length} indicators
              </Badge>
            </button>
            {isOpen && (
              <div className="divide-y border-t">
                {catQs.map((q, idx) => (
                  <div
                    key={q.id}
                    className="flex items-start gap-3 bg-muted/20 px-4 py-2.5"
                  >
                    <span className="mt-0.5 w-5 shrink-0 text-xs text-muted-foreground">
                      {idx + 1}.
                    </span>
                    <p className="flex-1 text-sm leading-snug">{q.text}</p>
                    <Badge variant="outline" className="shrink-0 text-xs">
                      {q.type.replace(/_/g, " ")}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

// ─── PERIOD SHEET ─────────────────────────────────────────────────────────────

function PeriodSheet({
  open,
  data,
  onClose,
  onSaved,
}: {
  open: boolean
  data?: Period
  onClose: () => void
  onSaved: () => void
}) {
  const form = useForm<PeriodFormValues>({
    resolver: zodResolver(periodSchema),
    defaultValues: {
      quarter: "Q1",
      year: CURRENT_YEAR,
      description: "",
      startDate: "",
      endDate: "",
    },
  })

  useEffect(() => {
    if (!open) return
    form.reset({
      quarter: (data?.quarter as Quarter) ?? "Q1",
      year: data?.year ?? CURRENT_YEAR,
      description: data?.description ?? "",
      startDate: data?.startDate ? data.startDate.slice(0, 10) : "",
      endDate: data?.endDate ? data.endDate.slice(0, 10) : "",
    })
  }, [open, data])

  async function onSubmit(values: PeriodFormValues) {
    const title = `${values.quarter} ${values.year} SafeCare Assessment`
    const payload = {
      ...values,
      title,
      type: "SAFECARE",
      startDate: new Date(values.startDate).toISOString(),
      endDate: new Date(values.endDate + "T23:59:59").toISOString(),
    }
    try {
      if (data) {
        await api.patch(`/assessment/periods/${data.id}`, payload)
        toast.success("Period updated")
      } else {
        await api.post("/assessment/periods", payload)
        toast.success("Period created — all SafeCare indicators included automatically")
      }
      onClose()
      onSaved()
    } catch (err: any) {
      const msg = err?.response?.data?.message
      toast.error(
        Array.isArray(msg) ? msg.join(", ") : msg || "Failed to save period"
      )
    }
  }

  const quarter = form.watch("quarter")
  const year = form.watch("year")

  return (
    <Sheet open={open} onOpenChange={(o) => !o && onClose()}>
      <SheetContent className="flex w-full max-w-lg flex-col gap-0 sm:max-w-lg">
        <SheetHeader className="border-b pb-4">
          <SheetTitle>
            {data ? "Edit Period" : "New SafeCare Period"}
          </SheetTitle>
          {quarter && year && (
            <p className="text-sm text-muted-foreground">
              Will be titled:{" "}
              <strong>
                {quarter} {year} SafeCare Assessment
              </strong>
            </p>
          )}
        </SheetHeader>
        <div className="flex-1 overflow-y-auto px-4 py-6">
          <Form {...form}>
            <form className="space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="quarter"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Quarter</FormLabel>
                      <Select
                        value={field.value}
                        onValueChange={field.onChange}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {QUARTERS.map((q) => (
                            <SelectItem key={q} value={q}>
                              {q}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="year"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Year</FormLabel>
                      <Select
                        value={String(field.value)}
                        onValueChange={(v) => field.onChange(Number(v))}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {YEARS.map((y) => (
                            <SelectItem key={y} value={String(y)}>
                              {y}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Description{" "}
                      <span className="text-muted-foreground">(optional)</span>
                    </FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Brief note about this assessment period..."
                        rows={2}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="startDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Start Date</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="endDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>End Date</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <p className="rounded-md bg-muted px-3 py-2 text-xs text-muted-foreground">
                All {120} SafeCare indicators across 12 domains are included automatically.
              </p>
            </form>
          </Form>
        </div>
        <SheetFooter className="border-t pt-4">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            onClick={form.handleSubmit(onSubmit)}
            disabled={form.formState.isSubmitting}
          >
            {form.formState.isSubmitting ? "Saving..." : "Save Period"}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}

// ─── SUMMARY CARD ─────────────────────────────────────────────────────────────

function SummaryCard({
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

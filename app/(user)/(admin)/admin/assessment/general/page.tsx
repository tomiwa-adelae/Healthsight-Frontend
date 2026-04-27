"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useForm, useFieldArray } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { toast } from "sonner"
import { format } from "date-fns"
import {
  Plus,
  Trash2,
  MoreHorizontal,
  Eye,
  Pencil,
  ChevronDown,
  ChevronRight,
  GripVertical,
} from "lucide-react"
import {
  DndContext,
  DragEndEvent,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
} from "@dnd-kit/core"
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"

import { PageHeader } from "@/components/PageHeader"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
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

type Category = {
  id: string
  name: string
  order: number
  type: string
  questions: { id: string }[]
}

type Role = { id: string; name: string; label: string }

type Question = {
  id: string
  text: string
  order: number
  type: "YES_NO_NA" | "SINGLE_SELECT" | "MULTI_SELECT"
  category: Category
  categoryId: string
  roles: { role: Role }[]
  options: { id: string; text: string; order: number }[]
}

type Period = {
  id: string
  title: string
  description?: string
  type: string
  status: "DRAFT" | "ACTIVE" | "CLOSED"
  startDate: string
  endDate: string
  _count: { questions: number; submissions: number }
  createdBy: { firstName: string; lastName: string }
}

// ─── HELPERS ──────────────────────────────────────────────────────────────────

const STATUS_COLORS: Record<string, string> = {
  DRAFT: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300",
  ACTIVE: "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300",
  CLOSED: "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300",
}

const Q_TYPE_LABELS: Record<string, string> = {
  YES_NO_NA: "Yes / No / N/A",
  SINGLE_SELECT: "Single Choice",
  MULTI_SELECT: "Multi Choice",
}

// ─── SCHEMAS ──────────────────────────────────────────────────────────────────

const categorySchema = z.object({
  name: z.string().min(1, "Name is required"),
})

const optionSchema = z.object({
  text: z.string().min(1, "Option text is required"),
})

const questionSchema = z.object({
  text: z.string().min(1, "Question text is required"),
  type: z.enum(["YES_NO_NA", "SINGLE_SELECT", "MULTI_SELECT"]),
  categoryId: z.string().min(1, "Category is required"),
  roleIds: z.array(z.string()),
  options: z.array(optionSchema),
})

const periodSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  startDate: z.string().min(1, "Start date is required"),
  endDate: z.string().min(1, "End date is required"),
  questionIds: z.array(z.string()),
})

type CategoryFormValues = z.infer<typeof categorySchema>
type QuestionFormValues = z.infer<typeof questionSchema>
type PeriodFormValues = z.infer<typeof periodSchema>

// ─── SORTABLE ROW PRIMITIVES ─────────────────────────────────────────────────

function SortableItem({
  id,
  children,
}: {
  id: string
  children: (props: {
    dragHandleProps: React.HTMLAttributes<HTMLButtonElement>
    isDragging: boolean
  }) => React.ReactNode
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id })

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 10 : undefined,
    position: "relative",
  }

  return (
    <div ref={setNodeRef} style={style}>
      {children({ dragHandleProps: { ...attributes, ...listeners }, isDragging })}
    </div>
  )
}

// ─── MAIN PAGE ────────────────────────────────────────────────────────────────

export default function GeneralAssessmentPage() {
  const router = useRouter()
  const [periods, setPeriods] = useState<Period[]>([])
  const [questions, setQuestions] = useState<Question[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [roles, setRoles] = useState<Role[]>([])
  const [loading, setLoading] = useState(true)

  const [catSheet, setCatSheet] = useState<{ open: boolean; data?: Category }>({ open: false })
  const [qSheet, setQSheet] = useState<{ open: boolean; data?: Question }>({ open: false })
  const [pSheet, setPSheet] = useState<{ open: boolean; data?: Period }>({ open: false })
  const [deleteTarget, setDeleteTarget] = useState<{
    type: "categories" | "questions" | "periods"
    id: string
    name: string
  } | null>(null)
  const [deleting, setDeleting] = useState(false)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )

  async function fetchAll() {
    setLoading(true)
    try {
      const [periodsRes, questionsRes, categoriesRes, rolesRes] = await Promise.all([
        api.get("/assessment/periods?type=GENERAL"),
        api.get("/assessment/questions?type=GENERAL"),
        api.get("/assessment/categories?type=GENERAL"),
        api.get("/roles"),
      ])
      setPeriods(periodsRes.data)
      setQuestions(questionsRes.data)
      setCategories(categoriesRes.data)
      setRoles(rolesRes.data)
    } catch {
      toast.error("Failed to load assessment data")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchAll() }, [])

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
      await api.delete(`/assessment/${deleteTarget.type}/${deleteTarget.id}`)
      toast.success("Deleted successfully")
      setDeleteTarget(null)
      fetchAll()
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Delete failed")
    } finally {
      setDeleting(false)
    }
  }

  // ── Drag handlers ──────────────────────────────────────────────────────────

  function handleCategoryDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (!over || active.id === over.id) return

    const oldIndex = sortedCategories.findIndex((c) => c.id === active.id)
    const newIndex = sortedCategories.findIndex((c) => c.id === over.id)
    const reordered = arrayMove(sortedCategories, oldIndex, newIndex).map((c, idx) => ({
      ...c,
      order: idx + 1,
    }))

    setCategories(reordered)
    reordered.forEach((cat) => {
      api.patch(`/assessment/categories/${cat.id}`, { order: cat.order }).catch(() =>
        toast.error("Failed to save category order")
      )
    })
  }

  function handleQuestionDragEnd(catId: string) {
    return (event: DragEndEvent) => {
      const { active, over } = event
      if (!over || active.id === over.id) return

      const catQuestions = getSortedQuestionsForCategory(catId)
      const oldIndex = catQuestions.findIndex((q) => q.id === active.id)
      const newIndex = catQuestions.findIndex((q) => q.id === over.id)
      const reordered = arrayMove(catQuestions, oldIndex, newIndex).map((q, idx) => ({
        ...q,
        order: idx + 1,
      }))

      setQuestions((prev) => {
        const others = prev.filter((q) => q.category.id !== catId)
        return [...others, ...reordered]
      })

      reordered.forEach((q) => {
        api.patch(`/assessment/questions/${q.id}`, { order: q.order }).catch(() =>
          toast.error("Failed to save question order")
        )
      })
    }
  }

  function getSortedQuestionsForCategory(catId: string): Question[] {
    return questions
      .filter((q) => q.category.id === catId)
      .sort((a, b) => a.order - b.order)
  }

  // ── Sorted data ────────────────────────────────────────────────────────────

  const sortedCategories = [...categories].sort((a, b) => a.order - b.order)

  if (loading) {
    return (
      <div className="space-y-4">
        <PageHeader title="General Assessment" />
        {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="General Assessment"
        description="Manage assessment periods, question bank, and categories"
      />

      <Tabs defaultValue="periods">
        <TabsList>
          <TabsTrigger value="periods">
            Periods <Badge variant="secondary" className="ml-1.5">{periods.length}</Badge>
          </TabsTrigger>
          <TabsTrigger value="questions">
            Questions <Badge variant="secondary" className="ml-1.5">{questions.length}</Badge>
          </TabsTrigger>
          <TabsTrigger value="categories">
            Categories <Badge variant="secondary" className="ml-1.5">{categories.length}</Badge>
          </TabsTrigger>
        </TabsList>

        {/* ── PERIODS ────────────────────────────────────────────────────────── */}
        <TabsContent value="periods" className="space-y-4 pt-4">
          <div className="flex justify-end">
            <Button onClick={() => setPSheet({ open: true })}>
              <Plus className="mr-2 h-4 w-4" /> New Period
            </Button>
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
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
                  <TableCell colSpan={7} className="py-10 text-center text-muted-foreground">
                    No assessment periods yet. Create one to get started.
                  </TableCell>
                </TableRow>
              )}
              {periods.map((p) => (
                <TableRow key={p.id}>
                  <TableCell className="font-medium">{p.title}</TableCell>
                  <TableCell>
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_COLORS[p.status]}`}>
                      {p.status}
                    </span>
                  </TableCell>
                  <TableCell className="text-sm">{format(new Date(p.startDate), "dd MMM yyyy, HH:mm")}</TableCell>
                  <TableCell className="text-sm">{format(new Date(p.endDate), "dd MMM yyyy, HH:mm")}</TableCell>
                  <TableCell>{p._count.questions}</TableCell>
                  <TableCell>{p._count.submissions}</TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon"><MoreHorizontal className="h-4 w-4" /></Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => router.push(`/admin/assessment/general/${p.id}`)}>
                          <Eye className="mr-2 h-4 w-4" /> View Results
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setPSheet({ open: true, data: p })}>
                          <Pencil className="mr-2 h-4 w-4" /> Edit
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        {p.status === "DRAFT" && (
                          <DropdownMenuItem onClick={() => updateStatus(p.id, "ACTIVE")}>
                            Set Active
                          </DropdownMenuItem>
                        )}
                        {p.status === "ACTIVE" && (
                          <DropdownMenuItem onClick={() => updateStatus(p.id, "CLOSED")}>
                            Close Period
                          </DropdownMenuItem>
                        )}
                        {p.status === "CLOSED" && (
                          <DropdownMenuItem onClick={() => updateStatus(p.id, "ACTIVE")}>
                            Reopen Period
                          </DropdownMenuItem>
                        )}
                        {p.status === "DRAFT" && (
                          <>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className="text-destructive focus:text-destructive"
                              onClick={() => setDeleteTarget({ type: "periods", id: p.id, name: p.title })}
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

        {/* ── QUESTIONS ──────────────────────────────────────────────────────── */}
        <TabsContent value="questions" className="space-y-4 pt-4">
          <div className="flex justify-end">
            <Button onClick={() => setQSheet({ open: true })}>
              <Plus className="mr-2 h-4 w-4" /> New Question
            </Button>
          </div>

          {questions.length === 0 && (
            <div className="rounded-lg border border-dashed py-10 text-center text-muted-foreground">
              No questions yet. Create categories first, then add questions.
            </div>
          )}

          <div className="space-y-4">
            {sortedCategories.map((cat) => {
              const catQuestions = getSortedQuestionsForCategory(cat.id)
              if (catQuestions.length === 0) return null

              return (
                <div key={cat.id} className="rounded-lg border overflow-hidden">
                  {/* Category header */}
                  <div className="flex items-center gap-2 border-b bg-muted/40 px-4 py-2.5">
                    <span className="font-semibold text-sm">{cat.name}</span>
                    <Badge variant="secondary" className="ml-auto text-xs">
                      {catQuestions.length} {catQuestions.length === 1 ? "question" : "questions"}
                    </Badge>
                  </div>

                  {/* Sortable questions */}
                  <DndContext
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    onDragEnd={handleQuestionDragEnd(cat.id)}
                  >
                    <SortableContext
                      items={catQuestions.map((q) => q.id)}
                      strategy={verticalListSortingStrategy}
                    >
                      {catQuestions.map((q, idx) => (
                        <SortableItem key={q.id} id={q.id}>
                          {({ dragHandleProps, isDragging }) => (
                            <div
                              className={`flex items-start gap-3 border-b last:border-b-0 px-4 py-3 bg-card transition-colors ${
                                isDragging ? "bg-muted shadow-md" : "hover:bg-muted/30"
                              }`}
                            >
                              {/* Drag handle */}
                              <button
                                {...dragHandleProps}
                                className="mt-0.5 cursor-grab touch-none text-muted-foreground/40 hover:text-muted-foreground active:cursor-grabbing"
                                tabIndex={-1}
                                aria-label="Drag to reorder"
                              >
                                <GripVertical className="h-4 w-4" />
                              </button>

                              {/* Number */}
                              <span className="mt-0.5 w-5 shrink-0 text-xs text-muted-foreground">
                                {idx + 1}.
                              </span>

                              {/* Question text */}
                              <p className="flex-1 text-sm leading-snug">{q.text}</p>

                              {/* Type */}
                              <Badge variant="secondary" className="shrink-0 text-xs">
                                {Q_TYPE_LABELS[q.type]}
                              </Badge>

                              {/* Roles */}
                              <div className="hidden shrink-0 flex-wrap gap-1 lg:flex" style={{ maxWidth: 200 }}>
                                {q.roles.length === 0 ? (
                                  <span className="text-xs text-muted-foreground">All roles</span>
                                ) : (
                                  q.roles.slice(0, 2).map((r) => (
                                    <Badge key={r.role.id} variant="outline" className="text-xs">
                                      {r.role.label}
                                    </Badge>
                                  ))
                                )}
                                {q.roles.length > 2 && (
                                  <span className="text-xs text-muted-foreground">+{q.roles.length - 2}</span>
                                )}
                              </div>

                              {/* Actions */}
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="icon" className="shrink-0">
                                    <MoreHorizontal className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem onClick={() => setQSheet({ open: true, data: q })}>
                                    <Pencil className="mr-2 h-4 w-4" /> Edit
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem
                                    className="text-destructive focus:text-destructive"
                                    onClick={() =>
                                      setDeleteTarget({ type: "questions", id: q.id, name: q.text.slice(0, 50) })
                                    }
                                  >
                                    <Trash2 className="mr-2 h-4 w-4" /> Delete
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                          )}
                        </SortableItem>
                      ))}
                    </SortableContext>
                  </DndContext>
                </div>
              )
            })}
          </div>
        </TabsContent>

        {/* ── CATEGORIES ─────────────────────────────────────────────────────── */}
        <TabsContent value="categories" className="space-y-4 pt-4">
          <div className="flex justify-end">
            <Button onClick={() => setCatSheet({ open: true })}>
              <Plus className="mr-2 h-4 w-4" /> New Category
            </Button>
          </div>

          {categories.length === 0 && (
            <div className="rounded-lg border border-dashed py-10 text-center text-muted-foreground">
              No categories yet. Categories group related questions together.
            </div>
          )}

          {categories.length > 0 && (
            <div className="rounded-lg border overflow-hidden">
              <div className="flex items-center gap-3 border-b bg-muted/40 px-4 py-2 text-xs font-medium text-muted-foreground">
                <span className="w-4" />
                <span className="w-8">#</span>
                <span className="flex-1">Name</span>
                <span className="w-24 text-right">Questions</span>
                <span className="w-8" />
              </div>

              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleCategoryDragEnd}
              >
                <SortableContext
                  items={sortedCategories.map((c) => c.id)}
                  strategy={verticalListSortingStrategy}
                >
                  {sortedCategories.map((cat, idx) => (
                    <SortableItem key={cat.id} id={cat.id}>
                      {({ dragHandleProps, isDragging }) => (
                        <div
                          className={`flex items-center gap-3 border-b last:border-b-0 px-4 py-3 bg-card transition-colors ${
                            isDragging ? "bg-muted shadow-md" : "hover:bg-muted/30"
                          }`}
                        >
                          <button
                            {...dragHandleProps}
                            className="cursor-grab touch-none text-muted-foreground/40 hover:text-muted-foreground active:cursor-grabbing"
                            tabIndex={-1}
                            aria-label="Drag to reorder"
                          >
                            <GripVertical className="h-4 w-4" />
                          </button>

                          <span className="w-8 text-sm text-muted-foreground">{idx + 1}</span>

                          <span className="flex-1 font-medium text-sm">{cat.name}</span>

                          <span className="w-24 text-right text-sm text-muted-foreground">
                            {cat.questions.length} {cat.questions.length === 1 ? "question" : "questions"}
                          </span>

                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => setCatSheet({ open: true, data: cat })}>
                                <Pencil className="mr-2 h-4 w-4" /> Edit Name
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                className="text-destructive focus:text-destructive"
                                onClick={() =>
                                  setDeleteTarget({ type: "categories", id: cat.id, name: cat.name })
                                }
                              >
                                <Trash2 className="mr-2 h-4 w-4" /> Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      )}
                    </SortableItem>
                  ))}
                </SortableContext>
              </DndContext>
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* ── SHEETS & DIALOGS ────────────────────────────────────────────────── */}
      <CategorySheet
        open={catSheet.open}
        data={catSheet.data}
        categoriesCount={categories.length}
        onClose={() => setCatSheet({ open: false })}
        onSaved={fetchAll}
      />
      <QuestionSheet
        open={qSheet.open}
        data={qSheet.data}
        categories={sortedCategories}
        roles={roles}
        questionsInCategory={(catId) => getSortedQuestionsForCategory(catId).length}
        onClose={() => setQSheet({ open: false })}
        onSaved={fetchAll}
      />
      <PeriodSheet
        open={pSheet.open}
        data={pSheet.data}
        questions={questions}
        categories={sortedCategories}
        onClose={() => setPSheet({ open: false })}
        onSaved={fetchAll}
      />

      <AlertDialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete permanently?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete <strong>{deleteTarget?.name}</strong>. This cannot be undone.
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

// ─── CATEGORY SHEET ───────────────────────────────────────────────────────────

function CategorySheet({
  open,
  data,
  categoriesCount,
  onClose,
  onSaved,
}: {
  open: boolean
  data?: Category
  categoriesCount: number
  onClose: () => void
  onSaved: () => void
}) {
  const form = useForm<CategoryFormValues>({
    resolver: zodResolver(categorySchema),
    defaultValues: { name: "" },
  })

  useEffect(() => {
    if (open) form.reset({ name: data?.name ?? "" })
  }, [open, data])

  async function onSubmit(values: CategoryFormValues) {
    try {
      const payload = { ...values, type: "GENERAL", order: data?.order ?? categoriesCount + 1 }
      if (data) {
        await api.patch(`/assessment/categories/${data.id}`, payload)
        toast.success("Category updated")
      } else {
        await api.post("/assessment/categories", payload)
        toast.success("Category created")
      }
      onClose()
      onSaved()
    } catch (err: any) {
      const msg = err?.response?.data?.message
      toast.error(Array.isArray(msg) ? msg.join(", ") : msg || "Failed to save category")
    }
  }

  return (
    <Sheet open={open} onOpenChange={(o) => !o && onClose()}>
      <SheetContent className="flex flex-col gap-0">
        <SheetHeader className="border-b pb-4">
          <SheetTitle>{data ? "Edit Category" : "New Category"}</SheetTitle>
        </SheetHeader>
        <div className="flex-1 overflow-y-auto px-4 py-6">
          <Form {...form}>
            <form className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. Laboratory Services" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              {!data && (
                <p className="text-xs text-muted-foreground">
                  New categories are added at the bottom. Drag to reorder after creation.
                </p>
              )}
            </form>
          </Form>
        </div>
        <SheetFooter className="border-t pt-4">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={form.handleSubmit(onSubmit)} disabled={form.formState.isSubmitting}>
            {form.formState.isSubmitting ? "Saving..." : "Save Category"}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}

// ─── QUESTION SHEET ───────────────────────────────────────────────────────────

function QuestionSheet({
  open,
  data,
  categories,
  roles,
  questionsInCategory,
  onClose,
  onSaved,
}: {
  open: boolean
  data?: Question
  categories: Category[]
  roles: Role[]
  questionsInCategory: (catId: string) => number
  onClose: () => void
  onSaved: () => void
}) {
  const form = useForm<QuestionFormValues>({
    resolver: zodResolver(questionSchema),
    defaultValues: { text: "", type: "YES_NO_NA", categoryId: "", roleIds: [], options: [] },
  })
  const { fields, append, remove } = useFieldArray({ control: form.control, name: "options" })
  const questionType = form.watch("type")

  useEffect(() => {
    if (open) {
      if (data) {
        form.reset({
          text: data.text,
          type: data.type,
          categoryId: data.category.id,
          roleIds: data.roles.map((r) => r.role.id),
          options: data.options.map((o) => ({ text: o.text })),
        })
      } else {
        form.reset({ text: "", type: "YES_NO_NA", categoryId: "", roleIds: [], options: [] })
      }
    }
  }, [open, data])

  function toggleRole(roleId: string, checked: boolean) {
    const current = form.getValues("roleIds") ?? []
    form.setValue("roleIds", checked ? [...current, roleId] : current.filter((id) => id !== roleId))
  }

  async function onSubmit(values: QuestionFormValues) {
    const order = data?.order ?? questionsInCategory(values.categoryId) + 1
    const payload = {
      ...values,
      order,
      options: values.type === "YES_NO_NA" ? [] : values.options,
    }
    try {
      if (data) {
        await api.patch(`/assessment/questions/${data.id}`, payload)
        toast.success("Question updated")
      } else {
        await api.post("/assessment/questions", payload)
        toast.success("Question created")
      }
      onClose()
      onSaved()
    } catch (err: any) {
      const msg = err?.response?.data?.message
      toast.error(Array.isArray(msg) ? msg.join(", ") : msg || "Failed to save question")
    }
  }

  return (
    <Sheet open={open} onOpenChange={(o) => !o && onClose()}>
      <SheetContent className="flex w-full max-w-lg flex-col gap-0 sm:max-w-lg">
        <SheetHeader className="border-b pb-4">
          <SheetTitle>{data ? "Edit Question" : "New Question"}</SheetTitle>
        </SheetHeader>
        <div className="flex-1 overflow-y-auto px-4 py-6">
          <Form {...form}>
            <form className="space-y-5">
              <FormField
                control={form.control}
                name="text"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Question Text</FormLabel>
                    <FormControl>
                      <Textarea placeholder="e.g. Is the laboratory adequately illuminated?" rows={3} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Answer Type</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="YES_NO_NA">Yes / No / N/A</SelectItem>
                        <SelectItem value="SINGLE_SELECT">Single Choice</SelectItem>
                        <SelectItem value="MULTI_SELECT">Multi Choice</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="categoryId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Category</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger><SelectValue placeholder="Select..." /></SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {categories.map((c) => (
                          <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {!data && (
                <p className="text-xs text-muted-foreground">
                  New questions are added at the bottom of the category. Drag to reorder after creation.
                </p>
              )}

              {/* Options (SINGLE/MULTI only) */}
              {questionType !== "YES_NO_NA" && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label>Options</Label>
                    <Button type="button" variant="outline" size="sm" onClick={() => append({ text: "" })}>
                      <Plus className="mr-1 h-3 w-3" /> Add Option
                    </Button>
                  </div>
                  {fields.length === 0 && (
                    <p className="text-xs text-muted-foreground">No options yet. Add at least two.</p>
                  )}
                  {fields.map((field, idx) => (
                    <div key={field.id} className="flex gap-2">
                      <Input placeholder={`Option ${idx + 1}`} {...form.register(`options.${idx}.text`)} />
                      <Button type="button" variant="ghost" size="icon" onClick={() => remove(idx)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}

              <Separator />

              {/* Roles */}
              <div className="space-y-3">
                <Label>Visible to Roles</Label>
                <p className="text-xs text-muted-foreground">
                  Leave all unchecked to show this question to all roles.
                </p>
                <div className="grid grid-cols-1 gap-2">
                  {roles.map((role) => {
                    const checked = (form.watch("roleIds") ?? []).includes(role.id)
                    return (
                      <div key={role.id} className="flex items-center gap-2">
                        <Checkbox
                          id={`role-${role.id}`}
                          checked={checked}
                          onCheckedChange={(v) => toggleRole(role.id, !!v)}
                        />
                        <Label htmlFor={`role-${role.id}`} className="cursor-pointer font-normal">
                          {role.label}
                        </Label>
                      </div>
                    )
                  })}
                </div>
              </div>
            </form>
          </Form>
        </div>
        <SheetFooter className="border-t pt-4">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={form.handleSubmit(onSubmit)} disabled={form.formState.isSubmitting}>
            {form.formState.isSubmitting ? "Saving..." : "Save Question"}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}

// ─── PERIOD SHEET ─────────────────────────────────────────────────────────────

function PeriodSheet({
  open,
  data,
  questions,
  categories,
  onClose,
  onSaved,
}: {
  open: boolean
  data?: Period
  questions: Question[]
  categories: Category[]
  onClose: () => void
  onSaved: () => void
}) {
  const form = useForm<PeriodFormValues>({
    resolver: zodResolver(periodSchema),
    defaultValues: { title: "", description: "", startDate: "", endDate: "", questionIds: [] },
  })
  const [expandedCats, setExpandedCats] = useState<Set<string>>(new Set())

  useEffect(() => {
    if (!open) return
    if (data) {
      api.get(`/assessment/periods/${data.id}`).then((res) => {
        const existing = res.data.questions?.map((pq: any) => pq.question.id) ?? []
        form.reset({
          title: data.title,
          description: data.description ?? "",
          startDate: data.startDate ? data.startDate.slice(0, 16) : "",
          endDate: data.endDate ? data.endDate.slice(0, 16) : "",
          questionIds: existing,
        })
        const cats = new Set(
          questions.filter((q) => existing.includes(q.id)).map((q) => q.category.id)
        )
        setExpandedCats(cats)
      })
    } else {
      form.reset({ title: "", description: "", startDate: "", endDate: "", questionIds: [] })
      setExpandedCats(new Set())
    }
  }, [open, data])

  function toggleQuestion(qId: string, checked: boolean) {
    const current = form.getValues("questionIds") ?? []
    form.setValue("questionIds", checked ? [...current, qId] : current.filter((id) => id !== qId))
  }

  function toggleCategory(catId: string) {
    setExpandedCats((prev) => {
      const next = new Set(prev)
      next.has(catId) ? next.delete(catId) : next.add(catId)
      return next
    })
  }

  function selectAllInCategory(catId: string, checked: boolean) {
    const catQuestionIds = questions.filter((q) => q.category.id === catId).map((q) => q.id)
    const current = form.getValues("questionIds") ?? []
    if (checked) {
      form.setValue("questionIds", [...new Set([...current, ...catQuestionIds])])
    } else {
      form.setValue("questionIds", current.filter((id) => !catQuestionIds.includes(id)))
    }
  }

  async function onSubmit(values: PeriodFormValues) {
    const payload = {
      ...values,
      type: "GENERAL",
      startDate: new Date(values.startDate).toISOString(),
      endDate: new Date(values.endDate).toISOString(),
    }
    try {
      if (data) {
        await api.patch(`/assessment/periods/${data.id}`, payload)
        toast.success("Period updated")
      } else {
        await api.post("/assessment/periods", payload)
        toast.success("Period created")
      }
      onClose()
      onSaved()
    } catch (err: any) {
      const msg = err?.response?.data?.message
      toast.error(Array.isArray(msg) ? msg.join(", ") : msg || "Failed to save period")
    }
  }

  const selectedIds = form.watch("questionIds") ?? []

  return (
    <Sheet open={open} onOpenChange={(o) => !o && onClose()}>
      <SheetContent className="flex w-full max-w-lg flex-col gap-0 sm:max-w-lg">
        <SheetHeader className="border-b pb-4">
          <SheetTitle>{data ? "Edit Period" : "New Assessment Period"}</SheetTitle>
        </SheetHeader>
        <div className="flex-1 overflow-y-auto px-4 py-6">
          <Form {...form}>
            <form className="space-y-5">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Title</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. Q1 2025 General Assessment" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description (optional)</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Brief note about this assessment period..." rows={2} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="startDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Start Date & Time</FormLabel>
                    <FormControl><Input type="datetime-local" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="endDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>End Date & Time</FormLabel>
                    <FormControl><Input type="datetime-local" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Separator />

              {/* Question selection */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Questions</Label>
                  <span className="text-xs text-muted-foreground">{selectedIds.length} selected</span>
                </div>

                {categories.length === 0 && (
                  <p className="text-xs text-muted-foreground">
                    No questions available. Create categories and questions first.
                  </p>
                )}

                {categories.map((cat) => {
                  const catQs = questions
                    .filter((q) => q.category.id === cat.id)
                    .sort((a, b) => a.order - b.order)
                  if (catQs.length === 0) return null
                  const expanded = expandedCats.has(cat.id)
                  const selectedInCat = catQs.filter((q) => selectedIds.includes(q.id)).length
                  const allSelected = selectedInCat === catQs.length

                  return (
                    <div key={cat.id} className="rounded-md border">
                      <button
                        type="button"
                        className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-muted/50"
                        onClick={() => toggleCategory(cat.id)}
                      >
                        {expanded ? (
                          <ChevronDown className="h-4 w-4 shrink-0" />
                        ) : (
                          <ChevronRight className="h-4 w-4 shrink-0" />
                        )}
                        <span className="flex-1 font-medium">{cat.name}</span>
                        <span className="text-xs text-muted-foreground">{selectedInCat}/{catQs.length}</span>
                      </button>

                      {expanded && (
                        <div className="space-y-1.5 border-t px-3 pt-2 pb-2">
                          <div className="flex items-center gap-2 pb-1">
                            <Checkbox
                              id={`cat-all-${cat.id}`}
                              checked={allSelected}
                              onCheckedChange={(v) => selectAllInCategory(cat.id, !!v)}
                            />
                            <Label htmlFor={`cat-all-${cat.id}`} className="cursor-pointer text-xs text-muted-foreground">
                              Select all in this category
                            </Label>
                          </div>
                          {catQs.map((q, idx) => (
                            <div key={q.id} className="flex items-start gap-2">
                              <Checkbox
                                id={`q-${q.id}`}
                                checked={selectedIds.includes(q.id)}
                                onCheckedChange={(v) => toggleQuestion(q.id, !!v)}
                                className="mt-0.5"
                              />
                              <Label htmlFor={`q-${q.id}`} className="cursor-pointer text-sm leading-snug font-normal">
                                <span className="mr-1 text-xs text-muted-foreground">{idx + 1}.</span>
                                {q.text}
                              </Label>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </form>
          </Form>
        </div>
        <SheetFooter className="border-t pt-4">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={form.handleSubmit(onSubmit)} disabled={form.formState.isSubmitting}>
            {form.formState.isSubmitting ? "Saving..." : "Save Period"}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}

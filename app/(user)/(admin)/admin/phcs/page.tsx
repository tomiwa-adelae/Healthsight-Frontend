"use client"

import { useEffect, useState } from "react"
import { Search, Building2, Plus, Pencil, Trash2 } from "lucide-react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { toast } from "sonner"

import { PageHeader } from "@/components/PageHeader"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
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
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import api from "@/lib/api"
import { IconPlus } from "@tabler/icons-react"

// ── Types ────────────────────────────────────────────────────────────────────

type Phc = {
  id: string
  name: string
  createdAt: string
  lga: { id: string; name: string; district: { id: string; name: string } }
  _count: { users: number }
}

type Location = { id: string; name: string }

// ── Zod schema ───────────────────────────────────────────────────────────────

const phcSchema = z.object({
  name: z.string().min(1, "PHC name is required"),
  districtId: z.string().min(1, "District is required"),
  lgaId: z.string().min(1, "LGA is required"),
})

type PhcFormValues = z.infer<typeof phcSchema>

// ── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  })
}

// ── PHC Form Sheet ────────────────────────────────────────────────────────────

function PhcFormSheet({
  open,
  onOpenChange,
  editing,
  onSaved,
}: {
  open: boolean
  onOpenChange: (v: boolean) => void
  editing: Phc | null
  onSaved: (phc: Phc) => void
}) {
  const [districts, setDistricts] = useState<Location[]>([])
  const [lgas, setLgas] = useState<Location[]>([])
  const [loadingLgas, setLoadingLgas] = useState(false)

  const form = useForm<PhcFormValues>({
    resolver: zodResolver(phcSchema),
    defaultValues: { name: "", districtId: "", lgaId: "" },
  })

  // Populate form when editing
  useEffect(() => {
    if (open && editing) {
      form.reset({
        name: editing.name,
        districtId: editing.lga.district.id,
        lgaId: editing.lga.id,
      })
      // Pre-load LGAs for the editing district
      setLoadingLgas(true)
      api
        .get(`/locations/districts/${editing.lga.district.id}/lgas`)
        .then((res) => setLgas(res.data))
        .finally(() => setLoadingLgas(false))
    } else if (open && !editing) {
      form.reset({ name: "", districtId: "", lgaId: "" })
      setLgas([])
    }
  }, [open, editing]) // eslint-disable-line react-hooks/exhaustive-deps

  // Load districts once
  useEffect(() => {
    api.get("/locations/districts").then((res) => setDistricts(res.data))
  }, [])

  async function handleDistrictChange(districtId: string) {
    form.setValue("districtId", districtId)
    form.setValue("lgaId", "")
    setLgas([])
    setLoadingLgas(true)
    try {
      const res = await api.get(`/locations/districts/${districtId}/lgas`)
      setLgas(res.data)
    } finally {
      setLoadingLgas(false)
    }
  }

  async function onSubmit(values: PhcFormValues) {
    try {
      const payload = { name: values.name, lgaId: values.lgaId }
      const res = editing
        ? await api.patch(`/admin/phcs/${editing.id}`, payload)
        : await api.post("/admin/phcs", payload)

      // Backend returns the PHC without _count — attach it
      const saved: Phc = {
        ...res.data,
        _count: editing ? editing._count : { users: 0 },
      }
      onSaved(saved)
      toast.success(editing ? "PHC updated" : "PHC created")
      onOpenChange(false)
    } catch (err: any) {
      const msg = err?.response?.data?.message
      toast.error(
        Array.isArray(msg) ? msg.join(", ") : msg || "Something went wrong"
      )
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-md">
        <SheetHeader className="border-b">
          <SheetTitle>{editing ? "Edit PHC" : "Add New PHC"}</SheetTitle>
          <SheetDescription>
            {editing
              ? "Update the name or location of this Primary Health Care centre."
              : "Fill in the details to register a new Primary Health Care centre."}
          </SheetDescription>
        </SheetHeader>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="flex flex-col gap-5 px-4 py-6"
          >
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>PHC Name</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. Ipaja PHC" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="districtId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>District</FormLabel>
                  <Select
                    value={field.value}
                    onValueChange={handleDistrictChange}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select District" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {districts.map((d) => (
                        <SelectItem key={d.id} value={d.id}>
                          {d.name}
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
              name="lgaId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Local Government Area</FormLabel>
                  <Select
                    value={field.value}
                    onValueChange={field.onChange}
                    disabled={!form.watch("districtId") || loadingLgas}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue
                          placeholder={
                            loadingLgas ? "Loading..." : "Select LGA"
                          }
                        />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {lgas.map((l) => (
                        <SelectItem key={l.id} value={l.id}>
                          {l.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <SheetFooter className="mt-2 px-0">
              <Button type="submit" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting
                  ? editing
                    ? "Saving..."
                    : "Creating..."
                  : editing
                    ? "Save Changes"
                    : "Create PHC"}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
            </SheetFooter>
          </form>
        </Form>
      </SheetContent>
    </Sheet>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function AdminPhcsPage() {
  const [phcs, setPhcs] = useState<Phc[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [districtFilter, setDistrictFilter] = useState("ALL")

  const [sheetOpen, setSheetOpen] = useState(false)
  const [editing, setEditing] = useState<Phc | null>(null)

  const [deleteTarget, setDeleteTarget] = useState<Phc | null>(null)
  const [deleteLoading, setDeleteLoading] = useState(false)

  useEffect(() => {
    api
      .get("/admin/phcs")
      .then((res) => setPhcs(res.data))
      .finally(() => setLoading(false))
  }, [])

  const districts = Array.from(
    new Map(phcs.map((p) => [p.lga.district.id, p.lga.district.name])).entries()
  ).sort((a, b) => a[1].localeCompare(b[1]))

  const filtered = phcs.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.lga.name.toLowerCase().includes(search.toLowerCase()) ||
      p.lga.district.name.toLowerCase().includes(search.toLowerCase())
    const matchesDistrict =
      districtFilter === "ALL" || p.lga.district.id === districtFilter
    return matchesSearch && matchesDistrict
  })

  function handleSaved(saved: Phc) {
    setPhcs((prev) => {
      const exists = prev.find((p) => p.id === saved.id)
      if (exists) return prev.map((p) => (p.id === saved.id ? saved : p))
      return [saved, ...prev]
    })
  }

  async function handleDelete() {
    if (!deleteTarget) return
    setDeleteLoading(true)
    try {
      await api.delete(`/admin/phcs/${deleteTarget.id}`)
      setPhcs((prev) => prev.filter((p) => p.id !== deleteTarget.id))
      toast.success(`${deleteTarget.name} deleted`)
      setDeleteTarget(null)
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to delete PHC")
    } finally {
      setDeleteLoading(false)
    }
  }

  return (
    <>
      <PageHeader
        back
        title="PHCs"
        description={
          loading ? undefined : `${phcs.length} Primary Health Care centres`
        }
        action={
          <Button
            className="md:auto w-full"
            onClick={() => {
              setEditing(null)
              setSheetOpen(true)
            }}
          >
            <IconPlus />
            Add PHC
          </Button>
        }
      />

      {/* Filters */}
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full max-w-sm">
          <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by name, LGA or district..."
            className="pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <Select value={districtFilter} onValueChange={setDistrictFilter}>
          <SelectTrigger className="w-52">
            <SelectValue placeholder="All Districts" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All Districts</SelectItem>
            {districts.map(([id, name]) => (
              <SelectItem key={id} value={id}>
                {name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>PHC Name</TableHead>
              <TableHead>LGA</TableHead>
              <TableHead>District</TableHead>
              <TableHead>Active Staff</TableHead>
              <TableHead>Added</TableHead>
              <TableHead className="w-24" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              Array.from({ length: 10 }).map((_, i) => (
                <TableRow key={i}>
                  {Array.from({ length: 6 }).map((_, j) => (
                    <TableCell key={j}>
                      <Skeleton className="h-4 w-full" />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="py-16 text-center">
                  <div className="flex flex-col items-center gap-2 text-muted-foreground">
                    <Building2 className="size-8 opacity-40" />
                    <p className="text-sm">No PHCs found</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((phc) => (
                <TableRow key={phc.id}>
                  <TableCell className="font-medium">{phc.name}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {phc.lga.name}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {phc.lga.district.name}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="secondary"
                      className={
                        phc._count.users > 0
                          ? "bg-green-100 text-green-700 hover:bg-green-100"
                          : "bg-gray-100 text-gray-500 hover:bg-gray-100"
                      }
                    >
                      {phc._count.users} staff
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {formatDate(phc.createdAt)}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-8"
                        onClick={() => {
                          setEditing(phc)
                          setSheetOpen(true)
                        }}
                      >
                        <Pencil className="size-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-8 text-destructive hover:text-destructive"
                        onClick={() => setDeleteTarget(phc)}
                      >
                        <Trash2 className="size-3.5" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {!loading && filtered.length > 0 && (
        <p className="mt-3 text-xs text-muted-foreground">
          Showing {filtered.length} of {phcs.length} PHCs
        </p>
      )}

      {/* Create / Edit Sheet */}
      <PhcFormSheet
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        editing={editing}
        onSaved={handleSaved}
      />

      {/* Delete confirmation */}
      <AlertDialog
        open={!!deleteTarget}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null)
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {deleteTarget?.name}?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. The PHC will be permanently removed.
              PHCs with assigned staff cannot be deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteLoading}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleteLoading}
              className="bg-destructive text-white hover:bg-destructive/90"
            >
              {deleteLoading ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}

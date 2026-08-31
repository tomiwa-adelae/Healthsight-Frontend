"use client"

import { useEffect, useState, useCallback } from "react"
import { toast } from "sonner"
import { format } from "date-fns"
import { useForm } from "react-hook-form"
import { Plus, Search } from "lucide-react"

import { PageHeader } from "@/components/PageHeader"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
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
  SheetFooter,
} from "@/components/ui/sheet"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import api from "@/lib/api"

type Volunteer = {
  id: string
  firstName: string
  lastName: string
  phoneNumber?: string
  gender?: string
  age?: number
  lga?: string
  ward?: string
  community?: string
  status: "ACTIVE" | "INACTIVE"
  trainingCompleted: boolean
  trainingDate?: string
  notes?: string
  createdAt: string
}

export default function VolunteersPage() {
  const [volunteers, setVolunteers] = useState<Volunteer[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [status, setStatus] = useState("")
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [showCreate, setShowCreate] = useState(false)
  const [editing, setEditing] = useState<Volunteer | null>(null)

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const params: any = { page, limit: 20 }
      if (search) params.search = search
      if (status) params.status = status
      const res = await api.get("/volunteers", { params })
      setVolunteers(res.data.data)
      setTotal(res.data.total)
    } catch {
      toast.error("Failed to load volunteers")
    } finally {
      setLoading(false)
    }
  }, [page, search, status])

  useEffect(() => {
    const t = setTimeout(fetchData, search ? 400 : 0)
    return () => clearTimeout(t)
  }, [fetchData, search])

  return (
    <div className="space-y-6">
      <PageHeader
        title="Volunteers"
        description={`${total} volunteer${total !== 1 ? "s" : ""} registered`}
        action={
          <Button onClick={() => setShowCreate(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Add Volunteer
          </Button>
        }
      />

      <div className="flex flex-wrap gap-3">
        <div className="relative w-full min-w-0 sm:w-auto sm:max-w-sm sm:flex-1">
          <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by name, community…"
            className="pl-9"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value)
              setPage(1)
            }}
          />
        </div>
        <Select
          value={status}
          onValueChange={(v) => {
            setStatus(v === "all" ? "" : v)
            setPage(1)
          }}
        >
          <SelectTrigger className="w-full sm:w-[160px]">
            <SelectValue placeholder="All statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            <SelectItem value="ACTIVE">Active</SelectItem>
            <SelectItem value="INACTIVE">Inactive</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Phone</TableHead>
              <TableHead>Gender</TableHead>
              <TableHead>Community</TableHead>
              <TableHead>Training</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Added</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              [...Array(6)].map((_, i) => (
                <TableRow key={i}>
                  {[...Array(8)].map((_, j) => (
                    <TableCell key={j}>
                      <Skeleton className="h-4 w-full" />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : volunteers.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={8}
                  className="py-14 text-center text-muted-foreground"
                >
                  No volunteers found.
                </TableCell>
              </TableRow>
            ) : (
              volunteers.map((v) => (
                <TableRow key={v.id}>
                  <TableCell className="font-medium">
                    {v.firstName} {v.lastName}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {v.phoneNumber ?? "—"}
                  </TableCell>
                  <TableCell>{v.gender ?? "—"}</TableCell>
                  <TableCell>{v.community ?? "—"}</TableCell>
                  <TableCell>
                    <Badge
                      variant={v.trainingCompleted ? "default" : "secondary"}
                    >
                      {v.trainingCompleted ? "Done" : "Pending"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={v.status === "ACTIVE" ? "outline" : "secondary"}
                    >
                      {v.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {format(new Date(v.createdAt), "dd MMM yyyy")}
                  </TableCell>
                  <TableCell>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setEditing(v)}
                    >
                      Edit
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <VolunteerSheet
        open={showCreate}
        onClose={() => setShowCreate(false)}
        onSaved={() => {
          setShowCreate(false)
          fetchData()
        }}
      />
      {editing && (
        <VolunteerSheet
          open
          volunteer={editing}
          onClose={() => setEditing(null)}
          onSaved={() => {
            setEditing(null)
            fetchData()
          }}
        />
      )}
    </div>
  )
}

function VolunteerSheet({
  open,
  volunteer,
  onClose,
  onSaved,
}: {
  open: boolean
  volunteer?: Volunteer
  onClose: () => void
  onSaved: () => void
}) {
  const { register, handleSubmit, reset, setValue, watch } = useForm({
    defaultValues: {
      firstName: volunteer?.firstName ?? "",
      lastName: volunteer?.lastName ?? "",
      phoneNumber: volunteer?.phoneNumber ?? "",
      gender: volunteer?.gender ?? "",
      age: volunteer?.age ?? "",
      lga: volunteer?.lga ?? "",
      ward: volunteer?.ward ?? "",
      community: volunteer?.community ?? "",
      status: volunteer?.status ?? "ACTIVE",
      trainingCompleted: volunteer?.trainingCompleted ?? false,
      trainingDate: volunteer?.trainingDate
        ? format(new Date(volunteer.trainingDate), "yyyy-MM-dd")
        : "",
      notes: volunteer?.notes ?? "",
    },
  })
  const [saving, setSaving] = useState(false)
  const gender = watch("gender")
  const status = watch("status")

  const onSubmit = async (data: any) => {
    setSaving(true)
    try {
      const payload: any = { ...data }
      if (!payload.age) delete payload.age
      if (!payload.trainingDate) delete payload.trainingDate
      if (!payload.gender) delete payload.gender

      if (volunteer) {
        await api.patch(`/volunteers/${volunteer.id}`, payload)
        toast.success("Volunteer updated")
      } else {
        await api.post("/volunteers", payload)
        toast.success("Volunteer added")
      }
      reset()
      onSaved()
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? "Failed")
    } finally {
      setSaving(false)
    }
  }

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent className="overflow-y-auto">
        <SheetHeader className="border-b">
          <SheetTitle>
            {volunteer ? "Edit Volunteer" : "Add Volunteer"}
          </SheetTitle>
        </SheetHeader>
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="container mt-6 space-y-4"
        >
          <div className="space-y-1.5">
            <Label>First Name *</Label>
            <Input {...register("firstName")} required />
          </div>
          <div className="space-y-1.5">
            <Label>Last Name *</Label>
            <Input {...register("lastName")} required />
          </div>
          <div className="space-y-1.5">
            <Label>Phone</Label>
            <Input {...register("phoneNumber")} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Gender</Label>
              <Select
                value={gender}
                onValueChange={(v) => setValue("gender", v === "none" ? "" : v)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">—</SelectItem>
                  <SelectItem value="MALE">Male</SelectItem>
                  <SelectItem value="FEMALE">Female</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Age</Label>
              <Input {...register("age")} type="number" min={0} max={120} />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>LGA</Label>
            <Input {...register("lga")} />
          </div>
          <div className="space-y-1.5">
            <Label>Ward</Label>
            <Input {...register("ward")} />
          </div>
          <div className="space-y-1.5">
            <Label>Community</Label>
            <Input {...register("community")} />
          </div>
          {volunteer && (
            <div className="space-y-1.5">
              <Label>Status</Label>
              <Select
                value={status}
                onValueChange={(v) =>
                  setValue("status", v as "ACTIVE" | "INACTIVE")
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ACTIVE">Active</SelectItem>
                  <SelectItem value="INACTIVE">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
          <div className="flex items-center gap-2">
            <Checkbox
              id="training"
              checked={watch("trainingCompleted")}
              onCheckedChange={(v) => setValue("trainingCompleted", !!v)}
            />
            <Label htmlFor="training">Training Completed</Label>
          </div>
          {watch("trainingCompleted") && (
            <div className="space-y-1.5">
              <Label>Training Date</Label>
              <Input {...register("trainingDate")} type="date" />
            </div>
          )}
          <div className="space-y-1.5">
            <Label>Notes</Label>
            <Textarea {...register("notes")} rows={2} />
          </div>
          <SheetFooter className="px-0 pt-4">
            <Button
              className="w-full"
              type="button"
              variant="outline"
              onClick={onClose}
            >
              Cancel
            </Button>
            <Button className="w-full" type="submit" disabled={saving}>
              {saving ? "Saving…" : "Save"}
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  )
}

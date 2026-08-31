"use client"

import { useEffect, useState, useCallback } from "react"
import { toast } from "sonner"
import { format } from "date-fns"
import { useForm } from "react-hook-form"
import { Plus, CalendarDays } from "lucide-react"

import { PageHeader } from "@/components/PageHeader"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Textarea } from "@/components/ui/textarea"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
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
import { useAuth } from "@/store/useAuth"
import api from "@/lib/api"

const CAN_MANAGE_APPOINTMENTS = [
  "ADMIN",
  "HEALTH_INFORMATION_MANAGEMENT_OFFICER",
  "HEALTH_INFORMATION_MANAGEMENT_TECHNICIAN",
  "HIM_OFFICER",
  "MEDICAL_OFFICER",
  "CONSULTANT",
  "OBSTETRICIAN",
  "OPHTHALMOLOGIST",
  "OPTOMETRIST",
  "DENTIST",
  "DOCTOR",
  "NURSE",
  "MIDWIFE",
  "WARD_NURSE",
  "DENTAL_NURSE",
  "EMERGENCY_CARE_STAFF",
  "EMERGENCY_MEDICAL_TECHNICIAN",
]

type Appointment = {
  id: string
  scheduledDate: string
  status: string
  notes?: string
  patient: { id: string; firstName: string; lastName: string; patientNumber: string; phoneNumber?: string }
  screening?: { id: string; screeningNumber: string; screeningType: string } | null
  createdBy: { firstName: string; lastName: string }
}

const statusVariant: Record<string, any> = {
  SCHEDULED: "outline",
  COMPLETED: "default",
  MISSED: "destructive",
  CANCELLED: "secondary",
}

export default function AppointmentsPage() {
  const { user } = useAuth()
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [loading, setLoading] = useState(true)
  const [status, setStatus] = useState("")
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)
  const [showCreate, setShowCreate] = useState(false)
  const [editing, setEditing] = useState<Appointment | null>(null)

  const canManage = user?.roles?.some((r) => CAN_MANAGE_APPOINTMENTS.includes(r.name))

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const params: any = { page, limit: 20 }
      if (status) params.status = status
      const res = await api.get("/appointments", { params })
      setAppointments(res.data.data)
      setTotal(res.data.total)
      setTotalPages(res.data.totalPages)
    } catch {
      toast.error("Failed to load appointments")
    } finally {
      setLoading(false)
    }
  }, [page, status])

  useEffect(() => { fetchData() }, [fetchData])

  return (
    <div className="space-y-6">
      <PageHeader
        title="Appointments"
        description={`${total} appointment${total !== 1 ? "s" : ""}`}
        action={
          canManage ? (
            <Button onClick={() => setShowCreate(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Schedule
            </Button>
          ) : undefined
        }
      />

      <div className="flex flex-wrap gap-3">
        <Select value={status} onValueChange={(v) => { setStatus(v === "all" ? "" : v); setPage(1) }}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="All statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            {["SCHEDULED", "COMPLETED", "MISSED", "CANCELLED"].map((s) => (
              <SelectItem key={s} value={s}>{s}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Patient</TableHead>
              <TableHead>Date & Time</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Screening</TableHead>
              <TableHead>Notes</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading
              ? [...Array(6)].map((_, i) => (
                  <TableRow key={i}>
                    {[...Array(6)].map((_, j) => <TableCell key={j}><Skeleton className="h-4 w-full" /></TableCell>)}
                  </TableRow>
                ))
              : appointments.length === 0
              ? (
                  <TableRow>
                    <TableCell colSpan={6} className="py-14 text-center text-muted-foreground">
                      No appointments found.
                    </TableCell>
                  </TableRow>
                )
              : appointments.map((a) => (
                  <TableRow key={a.id}>
                    <TableCell>
                      <p className="font-medium">{a.patient.firstName} {a.patient.lastName}</p>
                      <p className="text-xs text-muted-foreground">{a.patient.patientNumber}</p>
                    </TableCell>
                    <TableCell>
                      <p className="font-medium">{format(new Date(a.scheduledDate), "dd MMM yyyy")}</p>
                      <p className="text-xs text-muted-foreground">{format(new Date(a.scheduledDate), "HH:mm")}</p>
                    </TableCell>
                    <TableCell>
                      <Badge variant={statusVariant[a.status]}>{a.status}</Badge>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {a.screening ? `${a.screening.screeningType.replace(/_/g, " ")}` : "—"}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground max-w-[200px] truncate">
                      {a.notes ?? "—"}
                    </TableCell>
                    <TableCell>
                      {canManage && (
                        <Button size="sm" variant="ghost" onClick={() => setEditing(a)}>Edit</Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
          </TableBody>
        </Table>
      </div>

      {/* Create sheet */}
      <AppointmentSheet
        open={showCreate}
        onClose={() => setShowCreate(false)}
        onSaved={() => { setShowCreate(false); fetchData() }}
      />

      {/* Edit sheet */}
      {editing && (
        <AppointmentSheet
          open
          appointment={editing}
          onClose={() => setEditing(null)}
          onSaved={() => { setEditing(null); fetchData() }}
        />
      )}
    </div>
  )
}

function PatientSearch({ onSelect }: { onSelect: (id: string, label: string) => void }) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState("")
  const [results, setResults] = useState<{ id: string; firstName: string; lastName: string; patientNumber: string }[]>([])
  const [selected, setSelected] = useState("")

  useEffect(() => {
    if (!query || query.length < 2) { setResults([]); return }
    const t = setTimeout(async () => {
      try {
        const res = await api.get("/patients", { params: { search: query, limit: 10 } })
        setResults(res.data.data)
      } catch { /* silent */ }
    }, 300)
    return () => clearTimeout(t)
  }, [query])

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button type="button" variant="outline" className="w-full justify-start font-normal text-left">
          {selected || <span className="text-muted-foreground">Search patient by name or number…</span>}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[calc(100vw-2rem)] p-0 sm:w-[320px]" align="start">
        <Command shouldFilter={false}>
          <CommandInput placeholder="Type name or patient number…" value={query} onValueChange={setQuery} />
          <CommandList>
            {results.length === 0 && query.length >= 2 && <CommandEmpty>No patients found.</CommandEmpty>}
            <CommandGroup>
              {results.map((p) => (
                <CommandItem
                  key={p.id}
                  onSelect={() => {
                    const label = `${p.firstName} ${p.lastName} (${p.patientNumber})`
                    setSelected(label)
                    onSelect(p.id, label)
                    setOpen(false)
                  }}
                >
                  <span className="font-medium">{p.firstName} {p.lastName}</span>
                  <span className="ml-2 text-xs text-muted-foreground">{p.patientNumber}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}

function AppointmentSheet({ open, appointment, onClose, onSaved }: {
  open: boolean
  appointment?: Appointment
  onClose: () => void
  onSaved: () => void
}) {
  const { register, handleSubmit, setValue, watch, reset } = useForm({
    defaultValues: {
      patientId: "",
      scheduledDate: appointment ? format(new Date(appointment.scheduledDate), "yyyy-MM-dd'T'HH:mm") : "",
      notes: appointment?.notes ?? "",
      status: appointment?.status ?? "SCHEDULED",
    },
  })
  const [saving, setSaving] = useState(false)
  const status = watch("status")

  const onSubmit = async (data: any) => {
    if (!appointment && !data.patientId) {
      toast.error("Please select a patient")
      return
    }
    setSaving(true)
    try {
      if (appointment) {
        await api.patch(`/appointments/${appointment.id}`, { scheduledDate: data.scheduledDate, notes: data.notes, status: data.status })
      } else {
        await api.post("/appointments", { patientId: data.patientId, scheduledDate: data.scheduledDate, notes: data.notes })
      }
      toast.success(appointment ? "Appointment updated" : "Appointment scheduled")
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
      <SheetContent>
        <SheetHeader>
          <SheetTitle>{appointment ? "Edit Appointment" : "Schedule Appointment"}</SheetTitle>
        </SheetHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-4">
          {!appointment && (
            <div className="space-y-1.5">
              <Label>Patient *</Label>
              <PatientSearch onSelect={(id) => setValue("patientId", id)} />
            </div>
          )}
          {appointment && (
            <div className="space-y-1.5">
              <Label>Status</Label>
              <Select value={status} onValueChange={(v) => setValue("status", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {["SCHEDULED", "COMPLETED", "MISSED", "CANCELLED"].map((s) => (
                    <SelectItem key={s} value={s}>{s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          <div className="space-y-1.5">
            <Label>Date & Time *</Label>
            <Input {...register("scheduledDate")} type="datetime-local" required />
          </div>
          <div className="space-y-1.5">
            <Label>Notes</Label>
            <Textarea {...register("notes")} rows={3} />
          </div>
          <SheetFooter className="pt-4">
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit" disabled={saving}>{saving ? "Saving…" : "Save"}</Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  )
}

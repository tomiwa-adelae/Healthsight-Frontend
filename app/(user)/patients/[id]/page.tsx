"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import Link from "next/link"
import { toast } from "sonner"
import { format } from "date-fns"
import { Plus, Stethoscope, Calendar, CalendarPlus, Activity, MessageSquare } from "lucide-react"

import { getScreeningLabel } from "@/lib/screening-labels"
import { PageHeader } from "@/components/PageHeader"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Separator } from "@/components/ui/separator"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import api from "@/lib/api"
import { useDocumentTitle } from "@/hooks/use-document-title"

type Patient = {
  id: string
  patientNumber: string
  firstName: string
  lastName: string
  age: number
  gender: "MALE" | "FEMALE"
  phoneNumber?: string
  address?: string
  nextOfKin?: string
  nextOfKinPhone?: string
  phc: { id: string; name: string }
  registeredBy: { firstName: string; lastName: string }
  createdAt: string
  screenings: {
    id: string
    screeningNumber: string
    screeningType: string
    status: string
    createdAt: string
    conductedBy: { firstName: string; lastName: string }
  }[]
  appointments: {
    id: string
    scheduledDate: string
    status: string
    notes?: string
  }[]
  vitals: {
    id: string
    bloodPressureSystolic?: number
    bloodPressureDiastolic?: number
    heartRate?: number
    weight?: number
    height?: number
    bmi?: number
    temperature?: number
    oxygenSaturation?: number
    createdAt: string
  }[]
}

const ALL_SCREENING_TYPES = [
  "HYPERTENSION",
  "DIABETES",
  "CERVICAL_CANCER",
  "BREAST_CANCER",
  "PSA",
]

const FEMALE_ONLY_TYPES = ["CERVICAL_CANCER", "BREAST_CANCER"]
const MALE_ONLY_TYPES = ["PSA"]

function getAvailableScreeningTypes(gender: "MALE" | "FEMALE") {
  if (gender === "MALE") return ALL_SCREENING_TYPES.filter((t) => !FEMALE_ONLY_TYPES.includes(t))
  if (gender === "FEMALE") return ALL_SCREENING_TYPES.filter((t) => !MALE_ONLY_TYPES.includes(t))
  return ALL_SCREENING_TYPES
}

const statusColor: Record<string, string> = {
  PENDING: "secondary",
  IN_PROGRESS: "outline",
  COMPLETED: "default",
  REFERRED: "destructive",
}

const appointmentColor: Record<string, string> = {
  SCHEDULED: "outline",
  COMPLETED: "default",
  MISSED: "destructive",
  CANCELLED: "secondary",
}

export default function PatientDetailPage() {
  const { id } = useParams<{ id: string }>()
  const [patient, setPatient] = useState<Patient | null>(null)
  const [loading, setLoading] = useState(true)

  // Tab title becomes e.g. "Tomiwa Adelae | Healthsight" once loaded.
  useDocumentTitle(
    patient ? `${patient.firstName} ${patient.lastName}` : null
  )
  const [showScreeningDialog, setShowScreeningDialog] = useState(false)
  const [screeningType, setScreeningType] = useState("")
  const [creating, setCreating] = useState(false)
  const [showSmsDialog, setShowSmsDialog] = useState(false)
  const [smsMessage, setSmsMessage] = useState("")
  const [sendingSms, setSendingSms] = useState(false)
  const [showFollowupDialog, setShowFollowupDialog] = useState(false)
  const [followupDate, setFollowupDate] = useState("")
  const [followupTime, setFollowupTime] = useState("09:00")
  const [followupType, setFollowupType] = useState("")
  const [followupInstructions, setFollowupInstructions] = useState("")
  const [followupSendSms, setFollowupSendSms] = useState(true)
  const [followupReminderDays, setFollowupReminderDays] = useState(1)
  const [creatingFollowup, setCreatingFollowup] = useState(false)

  useEffect(() => {
    api
      .get(`/patients/${id}`)
      .then((res) => setPatient(res.data))
      .catch(() => toast.error("Failed to load patient"))
      .finally(() => setLoading(false))
  }, [id])

  const createScreening = async () => {
    if (!screeningType) return
    setCreating(true)
    try {
      const res = await api.post("/screenings", { patientId: id, screeningType })
      toast.success("Screening created")
      setShowScreeningDialog(false)
      window.location.href = `/screenings/${res.data.id}`
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? "Failed to create screening")
    } finally {
      setCreating(false)
    }
  }

  const sendSms = async () => {
    if (!smsMessage.trim()) return
    setSendingSms(true)
    try {
      await api.post(`/patients/${id}/sms`, { message: smsMessage.trim() })
      toast.success("SMS sent to patient")
      setShowSmsDialog(false)
      setSmsMessage("")
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? "Failed to send SMS")
    } finally {
      setSendingSms(false)
    }
  }

  const createFollowup = async () => {
    if (!followupDate || !followupType) {
      toast.error("Please fill in the date and type.")
      return
    }
    setCreatingFollowup(true)
    try {
      await api.post("/appointments/followup", {
        patientId: id,
        followupDate,
        followupTime,
        followupType,
        followupInstructions: followupInstructions || undefined,
        sendSmsReminder: followupSendSms,
        reminderDaysBefore: followupReminderDays,
      })
      toast.success("Follow-up scheduled successfully")
      setShowFollowupDialog(false)
      setFollowupDate("")
      setFollowupTime("09:00")
      setFollowupType("")
      setFollowupInstructions("")
      setFollowupSendSms(true)
      setFollowupReminderDays(1)
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? "Failed to schedule follow-up")
    } finally {
      setCreatingFollowup(false)
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-64" />
        <div className="grid grid-cols-2 gap-4">
          {[...Array(6)].map((_, i) => <Skeleton key={i} className="h-20" />)}
        </div>
      </div>
    )
  }

  if (!patient) return null

  const latestVitals = patient.vitals[0]

  return (
    <div className="space-y-6">
      <PageHeader
        title={`${patient.firstName} ${patient.lastName}`}
        description={patient.patientNumber}
        back
        action={
          <div className="flex gap-2">
            {patient.phoneNumber && (
              <Button variant="outline" onClick={() => setShowSmsDialog(true)}>
                <MessageSquare className="mr-2 h-4 w-4" />
                Send SMS
              </Button>
            )}
            <Button variant="outline" onClick={() => setShowFollowupDialog(true)}>
              <CalendarPlus className="mr-2 h-4 w-4" />
              Follow-up
            </Button>
            <Button onClick={() => setShowScreeningDialog(true)}>
              <Plus className="mr-2 h-4 w-4" />
              New Screening
            </Button>
          </div>
        }
      />

      {/* Bio */}
      <div className="rounded-lg border p-5 grid grid-cols-2 gap-x-8 gap-y-3 sm:grid-cols-3 text-sm">
        <Info label="Age" value={`${patient.age} years`} />
        <Info label="Gender" value={<Badge variant={patient.gender === "FEMALE" ? "secondary" : "outline"}>{patient.gender}</Badge>} />
        <Info label="Phone" value={patient.phoneNumber ?? "—"} />
        <Info label="PHC" value={patient.phc.name} />
        <Info label="Address" value={patient.address ?? "—"} />
        <Info label="Registered" value={format(new Date(patient.createdAt), "dd MMM yyyy")} />
        {patient.nextOfKin && <Info label="Next of Kin" value={patient.nextOfKin} />}
        {patient.nextOfKinPhone && <Info label="Next of Kin Phone" value={patient.nextOfKinPhone} />}
      </div>

      {/* Latest Vitals */}
      {latestVitals && (
        <div className="rounded-lg border p-5 space-y-3">
          <div className="flex items-center gap-2 text-sm font-semibold">
            <Activity className="h-4 w-4 text-muted-foreground" />
            Latest Vitals
            <span className="text-xs font-normal text-muted-foreground ml-auto">
              {format(new Date(latestVitals.createdAt), "dd MMM yyyy")}
            </span>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 text-sm">
            {latestVitals.bloodPressureSystolic && (
              <Vital label="Blood Pressure" value={`${latestVitals.bloodPressureSystolic}/${latestVitals.bloodPressureDiastolic} mmHg`} />
            )}
            {latestVitals.heartRate && <Vital label="Heart Rate" value={`${latestVitals.heartRate} bpm`} />}
            {latestVitals.weight && <Vital label="Weight" value={`${latestVitals.weight} kg`} />}
            {latestVitals.bmi && <Vital label="BMI" value={latestVitals.bmi.toString()} />}
            {latestVitals.temperature && <Vital label="Temp" value={`${latestVitals.temperature} °C`} />}
            {latestVitals.oxygenSaturation && <Vital label="SpO₂" value={`${latestVitals.oxygenSaturation}%`} />}
          </div>
        </div>
      )}

      {/* Screenings */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Stethoscope className="h-4 w-4 text-muted-foreground" />
          <h2 className="font-heading font-semibold">Screenings ({patient.screenings.length})</h2>
        </div>
        {patient.screenings.length === 0 ? (
          <p className="text-sm text-muted-foreground py-4">No screenings yet.</p>
        ) : (
          <div className="space-y-2">
            {patient.screenings.map((s) => (
              <div key={s.id} className="flex items-center justify-between rounded-lg border px-4 py-3 text-sm">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2 font-medium">
                    <span className="font-mono text-xs text-muted-foreground">{s.screeningNumber}</span>
                    <span>{getScreeningLabel(s.screeningType)}</span>
                    <Badge variant={statusColor[s.status] as any}>{s.status.replace(/_/g, " ")}</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {format(new Date(s.createdAt), "dd MMM yyyy")} &bull; {s.conductedBy.firstName} {s.conductedBy.lastName}
                  </p>
                </div>
                <Button asChild size="sm" variant="ghost">
                  <Link href={`/screenings/${s.id}`}>View</Link>
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>

      <Separator />

      {/* Appointments */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-muted-foreground" />
          <h2 className="font-heading font-semibold">Appointments ({patient.appointments.length})</h2>
        </div>
        {patient.appointments.length === 0 ? (
          <p className="text-sm text-muted-foreground py-4">No appointments scheduled.</p>
        ) : (
          <div className="space-y-2">
            {patient.appointments.map((a) => (
              <div key={a.id} className="flex items-center justify-between rounded-lg border px-4 py-3 text-sm">
                <div>
                  <p className="font-medium">{format(new Date(a.scheduledDate), "dd MMM yyyy, HH:mm")}</p>
                  {a.notes && <p className="text-xs text-muted-foreground">{a.notes}</p>}
                </div>
                <Badge variant={appointmentColor[a.status] as any}>{a.status}</Badge>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Send SMS Dialog */}
      <Dialog open={showSmsDialog} onOpenChange={(open) => { setShowSmsDialog(open); if (!open) setSmsMessage("") }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Send SMS to Patient</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <p className="text-sm text-muted-foreground">
              Sending to: <span className="font-medium text-foreground">{patient.phoneNumber}</span>
            </p>
            <Label>Message</Label>
            <Textarea
              value={smsMessage}
              onChange={(e) => setSmsMessage(e.target.value)}
              placeholder="Type your message here…"
              rows={4}
              maxLength={160}
            />
            <p className="text-right text-xs text-muted-foreground">{smsMessage.length}/160</p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSmsDialog(false)}>Cancel</Button>
            <Button onClick={sendSms} disabled={!smsMessage.trim() || sendingSms}>
              {sendingSms ? "Sending…" : "Send SMS"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* New Screening Dialog */}
      <Dialog open={showScreeningDialog} onOpenChange={(open) => { setShowScreeningDialog(open); if (!open) setScreeningType("") }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Start New Screening</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <Label>Screening Type</Label>
            <Select onValueChange={setScreeningType} value={screeningType}>
              <SelectTrigger>
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent>
                {getAvailableScreeningTypes(patient.gender).map((t) => (
                  <SelectItem key={t} value={t}>{getScreeningLabel(t)}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {patient.gender === "MALE" && (
              <p className="text-xs text-muted-foreground">
                Cervical Cancer and Breast Cancer screenings are not available for male patients.
              </p>
            )}
            {patient.gender === "FEMALE" && (
              <p className="text-xs text-muted-foreground">
                Prostate-Specific Antigen (PSA) screening is not available for female patients.
              </p>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowScreeningDialog(false)}>Cancel</Button>
            <Button onClick={createScreening} disabled={!screeningType || creating}>
              {creating ? "Creating…" : "Start Screening"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Schedule Follow-up Dialog */}
      <Dialog open={showFollowupDialog} onOpenChange={(open) => { setShowFollowupDialog(open) }}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Schedule Follow-up</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Date *</Label>
                <Input type="date" value={followupDate} onChange={(e) => setFollowupDate(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label>Time</Label>
                <Input type="time" value={followupTime} onChange={(e) => setFollowupTime(e.target.value)} />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Type *</Label>
              <Select value={followupType} onValueChange={setFollowupType}>
                <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Follow-up Visit">Follow-up Visit</SelectItem>
                  <SelectItem value="Lab Recheck">Lab Recheck</SelectItem>
                  <SelectItem value="Specialist Referral">Specialist Referral</SelectItem>
                  <SelectItem value="Medication Review">Medication Review</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Instructions</Label>
              <Textarea
                placeholder="Any special instructions..."
                value={followupInstructions}
                onChange={(e) => setFollowupInstructions(e.target.value)}
                rows={2}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="flex items-center gap-3">
                <Switch checked={followupSendSms} onCheckedChange={setFollowupSendSms} id="followup-sms" />
                <Label htmlFor="followup-sms" className="text-sm">SMS reminder</Label>
              </div>
              <div className="space-y-1.5">
                <Label>Days before</Label>
                <Input
                  type="number"
                  min={1}
                  max={30}
                  value={followupReminderDays}
                  onChange={(e) => setFollowupReminderDays(Number(e.target.value))}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowFollowupDialog(false)}>Cancel</Button>
            <Button onClick={createFollowup} disabled={!followupDate || !followupType || creatingFollowup}>
              {creatingFollowup ? "Scheduling…" : "Schedule Follow-up"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function Info({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="font-medium">{value}</p>
    </div>
  )
}

function Vital({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md bg-muted/40 px-3 py-2">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="font-semibold">{value}</p>
    </div>
  )
}

"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import {
  CheckCircle,
  XCircle,
  Mail,
  Phone,
  MapPin,
  Briefcase,
  Calendar,
  ShieldCheck,
} from "lucide-react"
import { toast } from "sonner"

import { PageHeader } from "@/components/PageHeader"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import api from "@/lib/api"

type AccountStatus = "ACTIVE" | "PENDING" | "REJECTED" | "SUSPENDED"

type UserDetail = {
  id: string
  username: string
  firstName: string
  lastName: string
  email: string
  phoneNumber: string
  roles: { role: { id: string; name: string; label: string } }[]
  accountStatus: AccountStatus
  accountStatusReason: string | null
  createdAt: string
  phc: { id: string; name: string } | null
  lga: { id: string; name: string } | null
  district: { id: string; name: string } | null
  actionBy: {
    firstName: string
    lastName: string
    roles: { role: { name: string; label: string } }[]
  } | null
}

const STATUS_CONFIG: Record<
  AccountStatus,
  { label: string; className: string }
> = {
  ACTIVE: {
    label: "Active",
    className: "bg-green-100 text-green-700 hover:bg-green-100",
  },
  PENDING: {
    label: "Pending",
    className: "bg-amber-100 text-amber-700 hover:bg-amber-100",
  },
  REJECTED: {
    label: "Rejected",
    className: "bg-red-100 text-red-700 hover:bg-red-100",
  },
  SUSPENDED: {
    label: "Suspended",
    className: "bg-gray-100 text-gray-600 hover:bg-gray-100",
  },
}

function formatRole(role: string) {
  return role
    .replace(/_/g, " ")
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase())
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  })
}

function InfoRow({
  icon: Icon,
  label,
  value,
}: {
  icon: any
  label: string
  value: string
}) {
  return (
    <div className="flex items-start gap-3 py-3">
      <Icon className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
      <div className="min-w-0 flex-1">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-sm font-medium">{value}</p>
      </div>
    </div>
  )
}

export default function UserDetailPage() {
  const { username } = useParams<{ username: string }>()
  const [user, setUser] = useState<UserDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)
  const [rejectOpen, setRejectOpen] = useState(false)
  const [rejectReason, setRejectReason] = useState("")

  useEffect(() => {
    api
      .get(`/admin/users/${username}`)
      .then((res) => setUser(res.data))
      .finally(() => setLoading(false))
  }, [username])

  async function handleApprove() {
    if (!user) return
    setActionLoading(true)
    try {
      await api.patch(`/admin/users/${user.username}/approve`)
      setUser((u) => u && { ...u, accountStatus: "ACTIVE", actionBy: null })
      toast.success(`${user.firstName} ${user.lastName} approved`)
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to approve user")
    } finally {
      setActionLoading(false)
    }
  }

  async function handleReject() {
    if (!user || !rejectReason.trim()) return
    setActionLoading(true)
    try {
      await api.patch(`/admin/users/${user.username}/reject`, {
        reason: rejectReason.trim(),
      })
      setUser(
        (u) =>
          u && {
            ...u,
            accountStatus: "REJECTED",
            accountStatusReason: rejectReason.trim(),
          }
      )
      toast.success(`${user.firstName} ${user.lastName} rejected`)
      setRejectOpen(false)
      setRejectReason("")
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to reject user")
    } finally {
      setActionLoading(false)
    }
  }

  if (loading) {
    return (
      <>
        <PageHeader title={<Skeleton className="h-8 w-48" />} back />
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <Card className="lg:col-span-2">
            <CardContent className="space-y-4 pt-6">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </CardContent>
          </Card>
          <Card>
            <CardContent className="space-y-4 pt-6">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </CardContent>
          </Card>
        </div>
      </>
    )
  }

  if (!user) {
    return (
      <>
        <PageHeader title="User not found" back />
        <p className="text-sm text-muted-foreground">
          No user found with username &quot;{username}&quot;.
        </p>
      </>
    )
  }

  const status = STATUS_CONFIG[user.accountStatus]

  return (
    <>
      <PageHeader
        title={`${user.firstName} ${user.lastName}`}
        description={`@${user.username}`}
        back
        action={
          user.accountStatus === "PENDING" ? (
            <div className="flex gap-2">
              <Button
                variant="outline"
                className="border-destructive text-destructive hover:bg-destructive/10"
                onClick={() => setRejectOpen(true)}
                disabled={actionLoading}
              >
                <XCircle className="mr-2 size-4" />
                Reject
              </Button>
              <Button
                className="bg-green-600 hover:bg-green-700"
                onClick={handleApprove}
                disabled={actionLoading}
              >
                <CheckCircle className="mr-2 size-4" />
                {actionLoading ? "Approving..." : "Approve"}
              </Button>
            </div>
          ) : undefined
        }
      />

      <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
        {/* Main info */}
        <Card className="gap-1 lg:col-span-2">
          <CardHeader className="border-b">
            <CardTitle>Profile Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="divide-y">
              <InfoRow icon={Mail} label="Email address" value={user.email} />
              <InfoRow
                icon={Phone}
                label="Phone number"
                value={user.phoneNumber || "—"}
              />
              <InfoRow
                icon={Briefcase}
                label={user.roles.length > 1 ? "Roles" : "Role"}
                value={user.roles.map((ur) => ur.role.label).join(", ") || "—"}
              />
              <InfoRow
                icon={MapPin}
                label="Primary Health Care (PHC)"
                value={user.phc?.name || "—"}
              />
              <InfoRow
                icon={MapPin}
                label="Local Government Area"
                value={user.lga?.name || "—"}
              />
              <InfoRow
                icon={MapPin}
                label="District"
                value={user.district?.name || "—"}
              />
              <InfoRow
                icon={Calendar}
                label="Registered on"
                value={formatDate(user.createdAt)}
              />
            </div>
          </CardContent>
        </Card>

        {/* Status card */}
        <div className="space-y-4">
          <Card>
            <CardHeader className="border-b">
              <CardTitle>Account Status</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Badge
                variant="secondary"
                className={`${status.className} text-sm`}
              >
                {status.label}
              </Badge>

              {user.accountStatusReason && (
                <>
                  <Separator />
                  <div>
                    <p className="mb-1 text-xs text-muted-foreground">Reason</p>
                    <p className="text-sm">{user.accountStatusReason}</p>
                  </div>
                </>
              )}

              {user.actionBy && (
                <>
                  <Separator />
                  <div className="flex items-start gap-2">
                    <ShieldCheck className="mt-0.5 size-4 text-muted-foreground" />
                    <div>
                      <p className="text-xs text-muted-foreground">
                        Action taken by
                      </p>
                      <p className="text-sm font-medium">
                        {user.actionBy.firstName} {user.actionBy.lastName}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {user.actionBy.roles.map((ur) => ur.role.label).join(", ")}
                      </p>
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Reject dialog */}
      <Dialog
        open={rejectOpen}
        onOpenChange={(open) => {
          if (!open) {
            setRejectOpen(false)
            setRejectReason("")
          }
        }}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Reject User</DialogTitle>
            <DialogDescription>
              Provide a reason for rejecting{" "}
              <span className="font-medium text-foreground">
                {user.firstName} {user.lastName}
              </span>
              .
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label>Reason</Label>
            <Textarea
              placeholder="e.g. Incomplete credentials, duplicate account..."
              rows={3}
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setRejectOpen(false)
                setRejectReason("")
              }}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              disabled={!rejectReason.trim() || actionLoading}
              onClick={handleReject}
            >
              {actionLoading ? "Rejecting..." : "Reject User"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

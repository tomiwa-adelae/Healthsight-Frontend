"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Search, MoreHorizontal, CheckCircle, XCircle, Eye } from "lucide-react"
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import api from "@/lib/api"

type AccountStatus = "ACTIVE" | "PENDING" | "REJECTED" | "SUSPENDED"

type AdminUser = {
  id: string
  username: string
  firstName: string
  lastName: string
  email: string
  phoneNumber: string
  roles: { role: { id: string; name: string; label: string } }[]
  accountStatus: AccountStatus
  createdAt: string
  phc: { id: string; name: string } | null
  lga: { id: string; name: string } | null
  district: { id: string; name: string } | null
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
    month: "short",
    year: "numeric",
  })
}

export default function AdminUsersPage() {
  const router = useRouter()
  const [users, setUsers] = useState<AdminUser[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState<AccountStatus | "ALL">("ALL")

  // Reject dialog state
  const [rejectTarget, setRejectTarget] = useState<AdminUser | null>(null)
  const [rejectReason, setRejectReason] = useState("")
  const [actionLoading, setActionLoading] = useState(false)

  useEffect(() => {
    api
      .get("/admin/users")
      .then((res) => setUsers(res.data))
      .finally(() => setLoading(false))
  }, [])

  const filtered = users.filter((u) => {
    const matchesSearch = `${u.firstName} ${u.lastName} ${u.email}`
      .toLowerCase()
      .includes(search.toLowerCase())
    const matchesStatus =
      statusFilter === "ALL" || u.accountStatus === statusFilter
    return matchesSearch && matchesStatus
  })

  async function handleApprove(user: AdminUser) {
    setActionLoading(true)
    try {
      await api.patch(`/admin/users/${user.username}/approve`)
      setUsers((prev) =>
        prev.map((u) =>
          u.id === user.id ? { ...u, accountStatus: "ACTIVE" } : u
        )
      )
      toast.success(`${user.firstName} ${user.lastName} approved`)
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to approve user")
    } finally {
      setActionLoading(false)
    }
  }

  async function handleReject() {
    if (!rejectTarget || !rejectReason.trim()) return
    setActionLoading(true)
    try {
      await api.patch(`/admin/users/${rejectTarget.username}/reject`, {
        reason: rejectReason.trim(),
      })
      setUsers((prev) =>
        prev.map((u) =>
          u.id === rejectTarget.id ? { ...u, accountStatus: "REJECTED" } : u
        )
      )
      toast.success(
        `${rejectTarget.firstName} ${rejectTarget.lastName} rejected`
      )
      setRejectTarget(null)
      setRejectReason("")
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to reject user")
    } finally {
      setActionLoading(false)
    }
  }

  const statusCounts = {
    ALL: users.length,
    ACTIVE: users.filter((u) => u.accountStatus === "ACTIVE").length,
    PENDING: users.filter((u) => u.accountStatus === "PENDING").length,
    REJECTED: users.filter((u) => u.accountStatus === "REJECTED").length,
    SUSPENDED: users.filter((u) => u.accountStatus === "SUSPENDED").length,
  }

  return (
    <>
      <PageHeader
        back
        title="Users"
        description="Manage all registered staff accounts"
      />

      {/* Filters */}
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full max-w-sm">
          <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by name or email..."
            className="pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <Select
          value={statusFilter}
          onValueChange={(v) => setStatusFilter(v as AccountStatus | "ALL")}
        >
          <SelectTrigger className="w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All ({statusCounts.ALL})</SelectItem>
            <SelectItem value="ACTIVE">
              Active ({statusCounts.ACTIVE})
            </SelectItem>
            <SelectItem value="PENDING">
              Pending ({statusCounts.PENDING})
            </SelectItem>
            <SelectItem value="REJECTED">
              Rejected ({statusCounts.REJECTED})
            </SelectItem>
            <SelectItem value="SUSPENDED">
              Suspended ({statusCounts.SUSPENDED})
            </SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>PHC</TableHead>
              <TableHead>District</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Joined</TableHead>
              <TableHead className="w-12" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              Array.from({ length: 8 }).map((_, i) => (
                <TableRow key={i}>
                  {Array.from({ length: 8 }).map((_, j) => (
                    <TableCell key={j}>
                      <Skeleton className="h-4 w-full" />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : filtered.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={8}
                  className="py-12 text-center text-sm text-muted-foreground"
                >
                  No users found
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((user) => {
                const status = STATUS_CONFIG[user.accountStatus]
                return (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">
                      {user.firstName} {user.lastName}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {user.email}
                    </TableCell>
                    <TableCell>{user.roles.map((ur) => ur.role.label).join(", ")}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {user.phc?.name ?? "—"}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {user.district?.name ?? "—"}
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" className={status.className}>
                        {status.label}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {formatDate(user.createdAt)}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="size-8"
                          >
                            <MoreHorizontal className="size-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          {user.accountStatus === "PENDING" && (
                            <>
                              <DropdownMenuItem
                                onClick={() => handleApprove(user)}
                                disabled={actionLoading}
                                className="text-green-600 focus:text-green-600"
                              >
                                <CheckCircle className="mr-2 size-4" />
                                Approve
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => setRejectTarget(user)}
                                disabled={actionLoading}
                                className="text-destructive focus:text-destructive"
                              >
                                <XCircle className="mr-2 size-4" />
                                Reject
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                            </>
                          )}
                          <DropdownMenuItem
                            onClick={() =>
                              router.push(`/admin/users/${user.username}`)
                            }
                          >
                            <Eye className="mr-2 size-4" />
                            View details
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                )
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* Reject dialog */}
      <Dialog
        open={!!rejectTarget}
        onOpenChange={(open) => {
          if (!open) {
            setRejectTarget(null)
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
                {rejectTarget?.firstName} {rejectTarget?.lastName}
              </span>
              . They may be notified of this reason.
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
                setRejectTarget(null)
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

"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { toast } from "sonner"
import {
  Search,
  MoreHorizontal,
  CheckCircle,
  XCircle,
  Eye,
  UserPlus,
  Pencil,
  PowerOff,
} from "lucide-react"

import { PageHeader } from "@/components/PageHeader"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
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
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import api from "@/lib/api"

// ── Types ─────────────────────────────────────────────────────────────────────

type AccountStatus =
  | "ACTIVE"
  | "PENDING"
  | "REJECTED"
  | "SUSPENDED"
  | "DEACTIVATED"

type StaffUser = {
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

type Role = { id: string; name: string; label: string; isActive: boolean }
type Location = { id: string; name: string }

// ── Status config ─────────────────────────────────────────────────────────────

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
  DEACTIVATED: {
    label: "Deactivated",
    className: "bg-gray-100 text-gray-500 hover:bg-gray-100",
  },
}

// ── Zod schema ────────────────────────────────────────────────────────────────

const staffSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().email("Valid email required"),
  phoneNumber: z.string().min(1, "Phone number is required"),
  roleIds: z.array(z.string()).min(1, "At least one role is required"),
  districtId: z.string().optional(),
  lgaId: z.string().optional(),
  phcId: z.string().optional(),
})

type StaffFormValues = z.infer<typeof staffSchema>

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  })
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function AdminUsersPage() {
  const router = useRouter()

  const [users, setUsers] = useState<StaffUser[]>([])
  const [roles, setRoles] = useState<Role[]>([])
  const [districts, setDistricts] = useState<Location[]>([])
  const [lgas, setLgas] = useState<Location[]>([])
  const [phcs, setPhcs] = useState<Location[]>([])
  const [loading, setLoading] = useState(true)

  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState<AccountStatus | "ALL">("ALL")

  const [sheetOpen, setSheetOpen] = useState(false)
  const [editTarget, setEditTarget] = useState<StaffUser | null>(null)
  const [formLoading, setFormLoading] = useState(false)

  const [rejectTarget, setRejectTarget] = useState<StaffUser | null>(null)
  const [rejectReason, setRejectReason] = useState("")
  const [rejectLoading, setRejectLoading] = useState(false)

  const [deactivateTarget, setDeactivateTarget] = useState<StaffUser | null>(
    null
  )
  const [deactivateLoading, setDeactivateLoading] = useState(false)
  const [approveLoading, setApproveLoading] = useState(false)

  // ── Form ───────────────────────────────────────────────────────────────────

  const form = useForm<StaffFormValues>({
    resolver: zodResolver(staffSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      phoneNumber: "",
      roleIds: [],
      districtId: undefined,
      lgaId: undefined,
      phcId: undefined,
    },
  })

  // ── Initial data ───────────────────────────────────────────────────────────

  useEffect(() => {
    Promise.all([
      api.get("/admin/users"),
      api.get("/roles/all"),
      api.get("/locations/districts"),
    ])
      .then(([usersRes, rolesRes, districtsRes]) => {
        setUsers(usersRes.data)
        setRoles(rolesRes.data.filter((r: Role) => r.isActive))
        setDistricts(districtsRes.data)
      })
      .finally(() => setLoading(false))
  }, [])

  // ── Sheet helpers ──────────────────────────────────────────────────────────

  function openCreate() {
    setEditTarget(null)
    setLgas([])
    setPhcs([])
    form.reset({
      firstName: "",
      lastName: "",
      email: "",
      phoneNumber: "",
      roleIds: [],
      districtId: undefined,
      lgaId: undefined,
      phcId: undefined,
    })
    setSheetOpen(true)
  }

  function openEdit(user: StaffUser) {
    setEditTarget(user)
    setLgas([])
    setPhcs([])
    if (user.district?.id) {
      api.get(`/locations/districts/${user.district.id}/lgas`).then((res) => {
        setLgas(res.data)
        if (user.lga?.id) {
          api
            .get(`/locations/lgas/${user.lga.id}/phcs`)
            .then((res2) => setPhcs(res2.data))
        }
      })
    }
    form.reset({
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      phoneNumber: user.phoneNumber,
      roleIds: user.roles.map((r) => r.role.id),
      districtId: user.district?.id ?? undefined,
      lgaId: user.lga?.id ?? undefined,
      phcId: user.phc?.id ?? undefined,
    })
    setSheetOpen(true)
  }

  // ── Submit ─────────────────────────────────────────────────────────────────

  async function onSubmit(values: StaffFormValues) {
    setFormLoading(true)
    try {
      if (editTarget) {
        await api.patch(`/admin/users/${editTarget.username}`, {
          firstName: values.firstName,
          lastName: values.lastName,
          phoneNumber: values.phoneNumber,
          roleIds: values.roleIds,
          districtId: values.districtId || null,
          lgaId: values.lgaId || null,
          phcId: values.phcId || null,
        })
        setUsers((prev) =>
          prev.map((u) =>
            u.id === editTarget.id
              ? {
                  ...u,
                  firstName: values.firstName,
                  lastName: values.lastName,
                  phoneNumber: values.phoneNumber,
                  roles: values.roleIds.map((id) => ({
                    role: roles.find((r) => r.id === id) ?? {
                      id,
                      name: "",
                      label: "",
                    },
                  })),
                  district:
                    districts.find((d) => d.id === values.districtId) ?? null,
                  lga: lgas.find((l) => l.id === values.lgaId) ?? null,
                  phc: phcs.find((p) => p.id === values.phcId) ?? null,
                }
              : u
          )
        )
        toast.success(`${values.firstName} ${values.lastName} updated`)
      } else {
        await api.post("/admin/users", {
          firstName: values.firstName,
          lastName: values.lastName,
          email: values.email,
          phoneNumber: values.phoneNumber,
          roleIds: values.roleIds,
          districtId: values.districtId || undefined,
          lgaId: values.lgaId || undefined,
          phcId: values.phcId || undefined,
        })
        const res = await api.get("/admin/users")
        setUsers(res.data)
        toast.success("Staff account created. Credentials sent to their email.")
      }
      setSheetOpen(false)
    } catch (err: any) {
      const msg = err?.response?.data?.message
      toast.error(
        Array.isArray(msg) ? msg.join(", ") : msg || "Something went wrong"
      )
    } finally {
      setFormLoading(false)
    }
  }

  // ── Actions ────────────────────────────────────────────────────────────────

  async function handleApprove(user: StaffUser) {
    setApproveLoading(true)
    try {
      await api.patch(`/admin/users/${user.username}/approve`)
      setUsers((prev) =>
        prev.map((u) =>
          u.id === user.id ? { ...u, accountStatus: "ACTIVE" } : u
        )
      )
      toast.success(`${user.firstName} ${user.lastName} approved`)
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to approve")
    } finally {
      setApproveLoading(false)
    }
  }

  async function handleReject() {
    if (!rejectTarget || !rejectReason.trim()) return
    setRejectLoading(true)
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
      toast.error(err?.response?.data?.message || "Failed to reject")
    } finally {
      setRejectLoading(false)
    }
  }

  async function handleDeactivate() {
    if (!deactivateTarget) return
    setDeactivateLoading(true)
    try {
      await api.patch(`/admin/users/${deactivateTarget.username}/deactivate`)
      setUsers((prev) =>
        prev.map((u) =>
          u.id === deactivateTarget.id
            ? { ...u, accountStatus: "DEACTIVATED" }
            : u
        )
      )
      toast.success(
        `${deactivateTarget.firstName} ${deactivateTarget.lastName} deactivated`
      )
      setDeactivateTarget(null)
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to deactivate")
    } finally {
      setDeactivateLoading(false)
    }
  }

  // ── Filtered list ──────────────────────────────────────────────────────────

  const filtered = users.filter((u) => {
    const matchesSearch = `${u.firstName} ${u.lastName} ${u.email}`
      .toLowerCase()
      .includes(search.toLowerCase())
    const matchesStatus =
      statusFilter === "ALL" || u.accountStatus === statusFilter
    return matchesSearch && matchesStatus
  })

  const statusCounts = {
    ALL: users.length,
    ACTIVE: users.filter((u) => u.accountStatus === "ACTIVE").length,
    PENDING: users.filter((u) => u.accountStatus === "PENDING").length,
    REJECTED: users.filter((u) => u.accountStatus === "REJECTED").length,
    SUSPENDED: users.filter((u) => u.accountStatus === "SUSPENDED").length,
    DEACTIVATED: users.filter((u) => u.accountStatus === "DEACTIVATED").length,
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <>
      <PageHeader
        back
        title="Users"
        description="Create and manage all staff user accounts"
        action={
          <Button onClick={openCreate}>
            <UserPlus className="mr-2 size-4" />
            Add User
          </Button>
        }
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
          <SelectTrigger className="w-52">
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
            <SelectItem value="DEACTIVATED">
              Deactivated ({statusCounts.DEACTIVATED})
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
              <TableHead>Phone</TableHead>
              <TableHead>Role(s)</TableHead>
              <TableHead>District</TableHead>
              <TableHead>LGA</TableHead>
              <TableHead>PHC</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Joined</TableHead>
              <TableHead className="w-12" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              Array.from({ length: 8 }).map((_, i) => (
                <TableRow key={i}>
                  {/* Name, Email, Phone, Roles, District, LGA, PHC, Status, Joined, Actions */}
                  {["w-32", "w-44", "w-28", "w-24", "w-24", "w-24", "w-32", "w-16", "w-20", "w-8"].map((w, j) => (
                    <TableCell key={j}>
                      <Skeleton className={`h-4 ${w}`} />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : filtered.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={10}
                  className="py-12 text-center text-sm text-muted-foreground"
                >
                  No users found
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((user) => {
                const status = STATUS_CONFIG[user.accountStatus] ?? {
                  label: user.accountStatus,
                  className: "",
                }
                return (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">
                      {user.firstName} {user.lastName}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {user.email}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {user.phoneNumber}
                    </TableCell>
                    <TableCell>
                      {user.roles.map((ur) => ur.role.label).join(", ") || "—"}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {user.district?.name ?? "—"}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {user.lga?.name ?? "—"}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {user.phc?.name ?? "—"}
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
                          <DropdownMenuItem
                            onClick={() =>
                              router.push(`/admin/users/${user.username}`)
                            }
                          >
                            <Eye className="mr-2 size-4" />
                            View details
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => openEdit(user)}>
                            <Pencil className="mr-2 size-4" />
                            Edit
                          </DropdownMenuItem>

                          {user.accountStatus === "PENDING" && (
                            <>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                onClick={() => handleApprove(user)}
                                disabled={approveLoading}
                                className="text-green-600 focus:text-green-600"
                              >
                                <CheckCircle className="mr-2 size-4" />
                                Approve
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => setRejectTarget(user)}
                                className="text-destructive focus:text-destructive"
                              >
                                <XCircle className="mr-2 size-4" />
                                Reject
                              </DropdownMenuItem>
                            </>
                          )}

                          {user.accountStatus !== "DEACTIVATED" && (
                            <>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                onClick={() => setDeactivateTarget(user)}
                                className="text-destructive focus:text-destructive"
                              >
                                <PowerOff className="mr-2 size-4" />
                                Deactivate
                              </DropdownMenuItem>
                            </>
                          )}
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

      {/* Create / Edit Sheet */}
      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent className="w-full overflow-y-auto sm:max-w-lg">
          <SheetHeader className="border-b">
            <SheetTitle>{editTarget ? "Edit User" : "Add User"}</SheetTitle>
            <SheetDescription>
              {editTarget
                ? "Update this user's details, roles, and location."
                : "Create a new user account. Login credentials will be emailed to them automatically."}
            </SheetDescription>
          </SheetHeader>

          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(onSubmit)}
              className="mt-6 space-y-5 px-4"
            >
              <FormField
                control={form.control}
                name="firstName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>First Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Ada" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="lastName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Last Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Okafor" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="ada@lagosstate.gov.ng"
                        disabled={!!editTarget}
                        {...field}
                      />
                    </FormControl>
                    {editTarget && (
                      <p className="text-xs text-muted-foreground">
                        Email cannot be changed after account creation.
                      </p>
                    )}
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="phoneNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Phone Number</FormLabel>
                    <FormControl>
                      <Input placeholder="08012345678" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="roleIds"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Role(s)</FormLabel>
                    <div className="max-h-44 space-y-2 overflow-y-auto rounded-md border p-3">
                      {roles.length === 0 ? (
                        <p className="text-sm text-muted-foreground">
                          Loading roles...
                        </p>
                      ) : (
                        roles.map((role) => {
                          const checked = field.value.includes(role.id)
                          return (
                            <div
                              key={role.id}
                              className="flex items-center gap-2"
                            >
                              <Checkbox
                                id={`role-${role.id}`}
                                checked={checked}
                                onCheckedChange={(v) => {
                                  field.onChange(
                                    v
                                      ? [...field.value, role.id]
                                      : field.value.filter(
                                          (id) => id !== role.id
                                        )
                                  )
                                }}
                              />
                              <Label
                                htmlFor={`role-${role.id}`}
                                className="cursor-pointer font-normal"
                              >
                                {role.label}
                              </Label>
                            </div>
                          )
                        })
                      )}
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="districtId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      District{" "}
                      <span className="text-muted-foreground">(optional)</span>
                    </FormLabel>
                    <Select
                      value={field.value ?? ""}
                      onValueChange={(v) => {
                        field.onChange(v || undefined)
                        form.setValue("lgaId", undefined)
                        form.setValue("phcId", undefined)
                        setLgas([])
                        setPhcs([])
                        if (v) {
                          api
                            .get(`/locations/districts/${v}/lgas`)
                            .then((res) => setLgas(res.data))
                        }
                      }}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select district" />
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
                    <FormLabel>
                      LGA{" "}
                      <span className="text-muted-foreground">(optional)</span>
                    </FormLabel>
                    <Select
                      value={field.value ?? ""}
                      onValueChange={(v) => {
                        field.onChange(v || undefined)
                        form.setValue("phcId", undefined)
                        setPhcs([])
                        if (v) {
                          api
                            .get(`/locations/lgas/${v}/phcs`)
                            .then((res) => setPhcs(res.data))
                        }
                      }}
                      disabled={!form.watch("districtId") || lgas.length === 0}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue
                            placeholder={
                              !form.watch("districtId")
                                ? "Select district first"
                                : "Select LGA"
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

              <FormField
                control={form.control}
                name="phcId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      PHC{" "}
                      <span className="text-muted-foreground">(optional)</span>
                    </FormLabel>
                    <Select
                      value={field.value ?? ""}
                      onValueChange={(v) => field.onChange(v || undefined)}
                      disabled={!form.watch("lgaId") || phcs.length === 0}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue
                            placeholder={
                              !form.watch("lgaId")
                                ? "Select LGA first"
                                : "Select PHC"
                            }
                          />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {phcs.map((p) => (
                          <SelectItem key={p.id} value={p.id}>
                            {p.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <SheetFooter className="px-0 pt-2">
                <Button type="submit" disabled={formLoading}>
                  {formLoading
                    ? editTarget
                      ? "Saving..."
                      : "Creating..."
                    : editTarget
                      ? "Save changes"
                      : "Create user"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setSheetOpen(false)}
                >
                  Cancel
                </Button>
              </SheetFooter>
            </form>
          </Form>
        </SheetContent>
      </Sheet>

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
                setRejectTarget(null)
                setRejectReason("")
              }}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              disabled={!rejectReason.trim() || rejectLoading}
              onClick={handleReject}
            >
              {rejectLoading ? "Rejecting..." : "Reject"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Deactivate confirm */}
      <AlertDialog
        open={!!deactivateTarget}
        onOpenChange={(open) => {
          if (!open) setDeactivateTarget(null)
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Deactivate account?</AlertDialogTitle>
            <AlertDialogDescription>
              This will immediately log out{" "}
              <span className="font-medium text-foreground">
                {deactivateTarget?.firstName} {deactivateTarget?.lastName}
              </span>{" "}
              and prevent them from signing in. This can be reversed by an
              administrator.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="text-destructive-foreground bg-destructive hover:bg-destructive/90"
              disabled={deactivateLoading}
              onClick={handleDeactivate}
            >
              {deactivateLoading ? "Deactivating..." : "Deactivate"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}

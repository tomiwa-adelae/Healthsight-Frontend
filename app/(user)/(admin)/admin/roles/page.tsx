"use client"

import { useEffect, useState } from "react"
import { PlusCircle, Pencil, PowerOff, Power, Users } from "lucide-react"
import { toast } from "sonner"

import { PageHeader } from "@/components/PageHeader"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
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
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from "@/components/ui/alert-dialog"
import api from "@/lib/api"
import { IconPlus } from "@tabler/icons-react"

type Role = {
  id: string
  name: string
  label: string
  description: string | null
  isAvailableForRegistration: boolean
  isActive: boolean
  _count: { userRoles: number }
  createdAt: string
}

type FormState = {
  label: string
  description: string
  isAvailableForRegistration: boolean
}

const EMPTY_FORM: FormState = {
  label: "",
  description: "",
  isAvailableForRegistration: true,
}

export default function AdminRolesPage() {
  const [roles, setRoles] = useState<Role[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")

  const [sheetOpen, setSheetOpen] = useState(false)
  const [editTarget, setEditTarget] = useState<Role | null>(null)
  const [form, setForm] = useState<FormState>(EMPTY_FORM)
  const [saving, setSaving] = useState(false)

  const [toggleTarget, setToggleTarget] = useState<Role | null>(null)
  const [toggling, setToggling] = useState(false)

  useEffect(() => {
    api
      .get("/roles/all")
      .then((res) => setRoles(res.data))
      .finally(() => setLoading(false))
  }, [])

  const filtered = roles.filter(
    (r) =>
      r.label.toLowerCase().includes(search.toLowerCase()) ||
      r.name.toLowerCase().includes(search.toLowerCase())
  )

  function openCreate() {
    setEditTarget(null)
    setForm(EMPTY_FORM)
    setSheetOpen(true)
  }

  function openEdit(role: Role) {
    setEditTarget(role)
    setForm({
      label: role.label,
      description: role.description ?? "",
      isAvailableForRegistration: role.isAvailableForRegistration,
    })
    setSheetOpen(true)
  }

  async function handleSave() {
    if (!form.label.trim()) return
    setSaving(true)
    try {
      if (editTarget) {
        const { data } = await api.patch(`/roles/${editTarget.id}`, {
          label: form.label.trim(),
          description: form.description.trim() || null,
          isAvailableForRegistration: form.isAvailableForRegistration,
        })
        setRoles((prev) =>
          prev.map((r) => (r.id === editTarget.id ? { ...r, ...data } : r))
        )
        toast.success("Role updated")
      } else {
        const { data } = await api.post("/roles", {
          label: form.label.trim(),
          description: form.description.trim() || null,
          isAvailableForRegistration: form.isAvailableForRegistration,
        })
        setRoles((prev) => [data, ...prev])
        toast.success("Role created")
      }
      setSheetOpen(false)
    } catch (err: any) {
      const msg = err?.response?.data?.message
      toast.error(
        Array.isArray(msg) ? msg.join(", ") : msg || "Failed to save role"
      )
    } finally {
      setSaving(false)
    }
  }

  async function handleToggle() {
    if (!toggleTarget) return
    setToggling(true)
    try {
      const endpoint = toggleTarget.isActive
        ? `/roles/${toggleTarget.id}/deactivate`
        : `/roles/${toggleTarget.id}/activate`
      await api.patch(endpoint)
      setRoles((prev) =>
        prev.map((r) =>
          r.id === toggleTarget.id ? { ...r, isActive: !r.isActive } : r
        )
      )
      toast.success(
        `"${toggleTarget.label}" ${toggleTarget.isActive ? "deactivated" : "activated"}`
      )
      setToggleTarget(null)
    } catch (err: any) {
      toast.error(
        err?.response?.data?.message || "Failed to update role status"
      )
    } finally {
      setToggling(false)
    }
  }

  return (
    <>
      <PageHeader
        back
        title="Roles"
        description="Manage staff roles and their registration availability"
        action={
          <Button className="md:auto w-full" onClick={openCreate}>
            <IconPlus />
            Add Role
          </Button>
        }
      />

      <div className="mb-4 max-w-sm">
        <Input
          placeholder="Search roles..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Label</TableHead>
              <TableHead>System Name</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Registration</TableHead>
              <TableHead>Users</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-24" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              Array.from({ length: 6 }).map((_, i) => (
                <TableRow key={i}>
                  {Array.from({ length: 7 }).map((_, j) => (
                    <TableCell key={j}>
                      <Skeleton className="h-4 w-full" />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : filtered.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={7}
                  className="py-12 text-center text-sm text-muted-foreground"
                >
                  No roles found
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((role) => (
                <TableRow
                  key={role.id}
                  className={!role.isActive ? "opacity-50" : ""}
                >
                  <TableCell className="font-medium">{role.label}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {role.name}
                  </TableCell>
                  <TableCell className="max-w-[200px] truncate text-sm text-muted-foreground">
                    {role.description ?? "—"}
                  </TableCell>
                  <TableCell>
                    {role.isAvailableForRegistration ? (
                      <Badge
                        className="bg-green-100 text-green-700 hover:bg-green-100"
                        variant="secondary"
                      >
                        Available
                      </Badge>
                    ) : (
                      <Badge
                        className="bg-gray-100 text-gray-500 hover:bg-gray-100"
                        variant="secondary"
                      >
                        Restricted
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <span className="flex items-center gap-1 text-sm text-muted-foreground">
                      <Users className="size-3.5" />
                      {role._count?.userRoles ?? 0}
                    </span>
                  </TableCell>
                  <TableCell>
                    {role.isActive ? (
                      <Badge
                        className="bg-green-100 text-green-700 hover:bg-green-100"
                        variant="secondary"
                      >
                        Active
                      </Badge>
                    ) : (
                      <Badge
                        className="bg-gray-100 text-gray-500 hover:bg-gray-100"
                        variant="secondary"
                      >
                        Inactive
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-8"
                        onClick={() => openEdit(role)}
                        title="Edit role"
                      >
                        <Pencil className="size-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-8 text-muted-foreground hover:text-foreground"
                        onClick={() => setToggleTarget(role)}
                        title={role.isActive ? "Deactivate" : "Activate"}
                      >
                        {role.isActive ? (
                          <PowerOff className="size-4" />
                        ) : (
                          <Power className="size-4" />
                        )}
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Create / Edit Sheet */}
      <Sheet
        open={sheetOpen}
        onOpenChange={(open) => {
          if (!open) setSheetOpen(false)
        }}
      >
        <SheetContent className="sm:max-w-md">
          <SheetHeader className="border-b">
            <SheetTitle>{editTarget ? "Edit Role" : "Add Role"}</SheetTitle>
            <SheetDescription>
              {editTarget
                ? "Update the role details below."
                : "Create a new role for staff members."}
            </SheetDescription>
          </SheetHeader>

          <div className="space-y-5 px-4 py-6">
            <div className="space-y-2">
              <Label>
                Label <span className="text-destructive">*</span>
              </Label>
              <Input
                placeholder="e.g. Ward Nurse"
                value={form.label}
                onChange={(e) =>
                  setForm((f) => ({ ...f, label: e.target.value }))
                }
              />
            </div>

            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                placeholder="Optional description..."
                rows={3}
                value={form.description}
                onChange={(e) =>
                  setForm((f) => ({ ...f, description: e.target.value }))
                }
              />
            </div>

            <div className="flex items-center justify-between rounded-lg border p-4">
              <div>
                <p className="text-sm font-medium">
                  Available for Registration
                </p>
                <p className="text-xs text-muted-foreground">
                  Allow staff to select this role during sign-up
                </p>
              </div>
              <Switch
                checked={form.isAvailableForRegistration}
                onCheckedChange={(v) =>
                  setForm((f) => ({ ...f, isAvailableForRegistration: v }))
                }
              />
            </div>
          </div>

          <SheetFooter className="px-4">
            <Button
              onClick={handleSave}
              disabled={!form.label.trim() || saving}
            >
              {saving
                ? "Saving..."
                : editTarget
                  ? "Save Changes"
                  : "Create Role"}
            </Button>
            <Button
              variant="outline"
              onClick={() => setSheetOpen(false)}
              disabled={saving}
            >
              Cancel
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      {/* Activate / Deactivate confirmation */}
      <AlertDialog
        open={!!toggleTarget}
        onOpenChange={(open) => {
          if (!open) setToggleTarget(null)
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {toggleTarget?.isActive ? "Deactivate" : "Activate"} Role
            </AlertDialogTitle>
            <AlertDialogDescription>
              {toggleTarget?.isActive ? (
                <>
                  Deactivating <strong>{toggleTarget?.label}</strong> will hide
                  it from the registration form. Existing users with this role
                  are unaffected.
                </>
              ) : (
                <>
                  Activating <strong>{toggleTarget?.label}</strong> will make it
                  available again in the registration form (if registration is
                  enabled for it).
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={toggling}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleToggle}
              disabled={toggling}
              className={
                toggleTarget?.isActive
                  ? "text-destructive-foreground bg-destructive hover:bg-destructive/90"
                  : ""
              }
            >
              {toggling
                ? "Updating..."
                : toggleTarget?.isActive
                  ? "Deactivate"
                  : "Activate"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}

"use client"

import { useEffect, useState, useCallback } from "react"
import { toast } from "sonner"
import { format } from "date-fns"
import { MessageSquare, ChevronLeft, ChevronRight } from "lucide-react"

import { PageHeader } from "@/components/PageHeader"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
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

type SmsLog = {
  id: string
  phoneNumber: string
  message: string
  smsType: string
  status: string
  sentAt?: string
  createdAt: string
  sentBy?: { firstName: string; lastName: string } | null
}

type SmsStats = {
  total: number
  sent: number
  failed: number
  pending: number
  byType: Record<string, number>
}

const SMS_TYPES = [
  "STAFF_APPROVAL",
  "STAFF_REJECTION",
  "NEW_REGISTRATION",
  "ASSESSMENT_SUBMISSION",
  "ASSESSMENT_DEADLINE_REMINDER",
]

export default function SmsAdminPage() {
  const [logs, setLogs] = useState<SmsLog[]>([])
  const [stats, setStats] = useState<SmsStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)
  const [filterType, setFilterType] = useState("")
  const [filterStatus, setFilterStatus] = useState("")

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const params: any = { page, limit: 20 }
      if (filterType) params.smsType = filterType
      if (filterStatus) params.status = filterStatus

      const [logsRes, statsRes] = await Promise.all([
        api.get("/sms", { params }),
        api.get("/sms/stats"),
      ])
      setLogs(logsRes.data.data)
      setTotal(logsRes.data.total)
      setTotalPages(logsRes.data.totalPages)
      setStats(statsRes.data)
    } catch {
      toast.error("Failed to load SMS logs")
    } finally {
      setLoading(false)
    }
  }, [page, filterType, filterStatus])

  useEffect(() => { fetchData() }, [fetchData])

  const statusVariant = (status: string): any =>
    status === "SENT" ? "default" : status === "FAILED" ? "destructive" : "secondary"

  return (
    <div className="space-y-6">
      <PageHeader
        title="SMS Logs"
        description="Delivery log for all outbound system SMS messages"
      />

      {/* Stats */}
      {stats ? (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <StatCard label="Total" value={stats.total} />
          <StatCard label="Delivered" value={stats.sent} color="text-brand-verdant-600" />
          <StatCard label="Failed" value={stats.failed} color="text-destructive" />
          <StatCard label="Pending" value={stats.pending} color="text-brand-amber-600" />
        </div>
      ) : (
        <div className="grid grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-20 rounded-lg" />)}
        </div>
      )}

      {/* Type breakdown */}
      {stats?.byType && Object.keys(stats.byType).length > 0 && (
        <div className="rounded-lg border p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-3">By Type</p>
          <div className="flex flex-wrap gap-3">
            {Object.entries(stats.byType).map(([type, count]) => (
              <div key={type} className="text-sm">
                <span className="text-muted-foreground">{type.replace(/_/g, " ")}: </span>
                <span className="font-semibold">{count}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <Select value={filterType} onValueChange={(v) => { setFilterType(v === "all" ? "" : v); setPage(1) }}>
          <SelectTrigger className="w-full sm:w-[220px]">
            <SelectValue placeholder="All types" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All types</SelectItem>
            {SMS_TYPES.map((t) => (
              <SelectItem key={t} value={t}>{t.replace(/_/g, " ")}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={filterStatus} onValueChange={(v) => { setFilterStatus(v === "all" ? "" : v); setPage(1) }}>
          <SelectTrigger className="w-full sm:w-[160px]">
            <SelectValue placeholder="All statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            <SelectItem value="SENT">Sent</SelectItem>
            <SelectItem value="FAILED">Failed</SelectItem>
            <SelectItem value="PENDING">Pending</SelectItem>
          </SelectContent>
        </Select>
        {(filterType || filterStatus) && (
          <Button variant="ghost" size="sm" onClick={() => { setFilterType(""); setFilterStatus(""); setPage(1) }}>
            Clear
          </Button>
        )}
      </div>

      {/* Table */}
      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Phone</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Message</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Sent By</TableHead>
              <TableHead>Date</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading
              ? [...Array(8)].map((_, i) => (
                  <TableRow key={i}>
                    {[...Array(6)].map((_, j) => (
                      <TableCell key={j}><Skeleton className="h-4 w-full" /></TableCell>
                    ))}
                  </TableRow>
                ))
              : logs.length === 0
              ? (
                  <TableRow>
                    <TableCell colSpan={6} className="py-14 text-center text-muted-foreground">
                      <MessageSquare className="mx-auto mb-2 h-8 w-8 opacity-40" />
                      No SMS logs found.
                    </TableCell>
                  </TableRow>
                )
              : logs.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell className="font-mono text-sm">{log.phoneNumber}</TableCell>
                    <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                      {log.smsType.replace(/_/g, " ")}
                    </TableCell>
                    <TableCell className="max-w-[260px]">
                      <p className="truncate text-sm text-muted-foreground">{log.message}</p>
                    </TableCell>
                    <TableCell>
                      <Badge variant={statusVariant(log.status)}>{log.status}</Badge>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {log.sentBy ? `${log.sentBy.firstName} ${log.sentBy.lastName}` : "System"}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                      {format(new Date(log.createdAt), "dd MMM yyyy, HH:mm")}
                    </TableCell>
                  </TableRow>
                ))}
          </TableBody>
        </Table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>Page {page} of {totalPages} &bull; {total} total</span>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" disabled={page === 1} onClick={() => setPage((p) => p - 1)}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button size="sm" variant="outline" disabled={page === totalPages} onClick={() => setPage((p) => p + 1)}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}

function StatCard({ label, value, color }: { label: string; value: number; color?: string }) {
  return (
    <div className="rounded-lg border p-4 space-y-1">
      <p className="text-xs text-muted-foreground capitalize">{label}</p>
      <p className={`text-2xl font-bold ${color ?? ""}`}>{value}</p>
    </div>
  )
}

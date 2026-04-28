"use client"

import { useEffect, useState } from "react"
import dynamic from "next/dynamic"
import Link from "next/link"
import { toast } from "sonner"
import { List, MapPin } from "lucide-react"

import { PageHeader } from "@/components/PageHeader"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Badge } from "@/components/ui/badge"
import api from "@/lib/api"

const PhcMap = dynamic(() => import("./_components/PhcMap"), {
  ssr: false,
  loading: () => <Skeleton className="h-full w-full rounded-lg" />,
})

type Phc = {
  id: string
  name: string
  address: string | null
  latitude: number | null
  longitude: number | null
  lga: { name: string; district: { name: string } }
}

export default function PhcMapPage() {
  const [phcs, setPhcs] = useState<Phc[]>([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<Phc | null>(null)

  useEffect(() => {
    api
      .get("/locations/phcs")
      .then((r) => setPhcs(r.data))
      .catch(() => toast.error("Failed to load PHCs"))
      .finally(() => setLoading(false))
  }, [])

  const withCoords = phcs.filter((p) => p.latitude && p.longitude)
  const missing = phcs.filter((p) => !p.latitude || !p.longitude)

  return (
    <div className="flex h-[calc(100vh-6rem)] flex-col gap-4">
      <div className="flex items-center justify-between">
        <PageHeader
          title="PHC Map"
          description={
            loading
              ? "Loading…"
              : `${withCoords.length} of ${phcs.length} facilities mapped`
          }
          back
          fallbackHref="/admin/phcs"
        />
        <Button variant="outline" size="sm" asChild>
          <Link href="/admin/phcs">
            <List className="mr-2 h-4 w-4" />
            List view
          </Link>
        </Button>
      </div>

      <div className="flex flex-1 gap-4 overflow-hidden">
        {/* ── MAP ─────────────────────────────────────────────────── */}
        <div className="relative flex-1 overflow-hidden rounded-lg border">
          {loading ? (
            <Skeleton className="h-full w-full" />
          ) : (
            <PhcMap phcs={phcs} />
          )}
        </div>

        {/* ── SIDEBAR LIST ────────────────────────────────────────── */}
        <div className="hidden w-72 shrink-0 flex-col gap-2 overflow-y-auto lg:flex">
          {loading
            ? Array.from({ length: 8 }).map((_, i) => (
                <Skeleton key={i} className="h-16 rounded-lg" />
              ))
            : phcs.map((phc) => (
                <button
                  key={phc.id}
                  onClick={() => setSelected(selected?.id === phc.id ? null : phc)}
                  className={`rounded-lg border p-3 text-left text-sm transition-colors hover:bg-muted/50 ${
                    selected?.id === phc.id ? "border-primary bg-primary/5" : ""
                  }`}
                >
                  <p className="font-medium leading-snug">{phc.name}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {phc.lga.name}
                  </p>
                  {phc.latitude ? (
                    <span className="mt-1 inline-flex items-center gap-1 text-xs text-green-600">
                      <MapPin className="h-3 w-3" /> Mapped
                    </span>
                  ) : (
                    <span className="mt-1 text-xs text-muted-foreground/60">
                      No coordinates
                    </span>
                  )}
                </button>
              ))}

          {!loading && missing.length > 0 && (
            <div className="rounded-lg border border-dashed p-3 text-center text-xs text-muted-foreground">
              {missing.length} PHC{missing.length > 1 ? "s" : ""} without
              coordinates
            </div>
          )}
        </div>
      </div>

      {/* ── SELECTED DETAIL ─────────────────────────────────────────── */}
      {selected && (
        <div className="shrink-0 rounded-lg border bg-muted/30 p-4 text-sm lg:hidden">
          <p className="font-semibold">{selected.name}</p>
          {selected.address && (
            <p className="mt-0.5 text-xs text-muted-foreground">
              {selected.address}
            </p>
          )}
          <p className="mt-0.5 text-xs text-muted-foreground">
            {selected.lga.name} · {selected.lga.district.name}
          </p>
        </div>
      )}
    </div>
  )
}

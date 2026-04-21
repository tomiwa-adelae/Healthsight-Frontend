"use client"
import { useRouter } from "next/navigation"
import type { ReactNode } from "react"
import { Button } from "./ui/button"
import { IconArrowLeft } from "@tabler/icons-react"
import { Badge } from "./ui/badge"

interface PageHeaderProps {
  title?: string | any
  description?: string | any
  action?: ReactNode
  back?: boolean
  query?: string
  badges?: string[]
  fallbackHref?: string
}

export function PageHeader({
  title,
  description,
  action,
  back,
  badges,
  query,
  fallbackHref = "/",
}: PageHeaderProps) {
  const router = useRouter()

  const handleBack = () => {
    if (typeof window !== "undefined" && window.history.length > 1) {
      router.back()

      if (query) {
        // allow back navigation, then update query
        setTimeout(() => {
          const url = new URL(window.location.href)
          url.searchParams.set(query, "true")
          router.replace(url.pathname + url.search)
        }, 0)
      }
    } else {
      // no history → safe fallback
      router.push(query ? `${fallbackHref}?${query}=true` : fallbackHref)
    }
  }

  return (
    <div className="mb-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-2">
          {back && (
            <Button onClick={handleBack} size="icon-lg" variant="secondary">
              <IconArrowLeft />
            </Button>
          )}
          <div>
            <h1 className="text-3xl font-semibold">{title}</h1>
            {description && (
              <p className="mt-2 text-sm text-muted-foreground md:text-base">
                {description}
              </p>
            )}
            {badges && (
              <div className="mt-2.5 flex gap-2">
                {badges.map((badge) => (
                  <Badge variant={"secondary"}>{badge}</Badge>
                ))}
              </div>
            )}
          </div>
        </div>
        {action && <div className="sm:shrink-0">{action}</div>}
      </div>
    </div>
  )
}

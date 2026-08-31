import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const alertVariants = cva(
  "group/alert relative grid w-full gap-0.5 rounded-lg border px-2 py-1.5 text-left text-xs/relaxed has-data-[slot=alert-action]:relative has-data-[slot=alert-action]:pr-18 has-[>svg]:grid-cols-[auto_1fr] has-[>svg]:gap-x-1.5 *:[svg]:row-span-2 *:[svg]:translate-y-0.5 *:[svg]:text-current *:[svg:not([class*='size-'])]:size-3.5",
  {
    variants: {
      variant: {
        default: "bg-card text-card-foreground",
        destructive:
          "bg-card text-destructive *:data-[slot=alert-description]:text-destructive/90 *:[svg]:text-current",
        // Semantic banners (PRD §6.5) — 4px brand left border, tinted surface,
        // brand-colored icon. Tints/borders use the static brand scales so they
        // stay consistent across all three themes.
        info: "border-l-4 border-l-brand-sky-500 bg-brand-sky-50 text-foreground [&>svg]:text-brand-sky-600 dark:bg-brand-sky-500/10 dark:[&>svg]:text-brand-sky-300",
        success:
          "border-l-4 border-l-brand-verdant-500 bg-brand-verdant-50 text-foreground [&>svg]:text-brand-verdant-600 dark:bg-brand-verdant-500/10 dark:[&>svg]:text-brand-verdant-300",
        warning:
          "border-l-4 border-l-brand-amber-500 bg-brand-amber-50 text-foreground [&>svg]:text-brand-amber-600 dark:bg-brand-amber-500/10 dark:[&>svg]:text-brand-amber-300",
        danger:
          "border-l-4 border-l-brand-crimson-500 bg-brand-crimson-50 text-foreground [&>svg]:text-brand-crimson-600 dark:bg-brand-crimson-500/10 dark:[&>svg]:text-brand-crimson-300",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

function Alert({
  className,
  variant,
  ...props
}: React.ComponentProps<"div"> & VariantProps<typeof alertVariants>) {
  return (
    <div
      data-slot="alert"
      role="alert"
      className={cn(alertVariants({ variant }), className)}
      {...props}
    />
  )
}

function AlertTitle({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="alert-title"
      className={cn(
        "font-medium group-has-[>svg]/alert:col-start-2 [&_a]:underline [&_a]:underline-offset-3 [&_a]:hover:text-foreground",
        className
      )}
      {...props}
    />
  )
}

function AlertDescription({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="alert-description"
      className={cn(
        "text-xs/relaxed text-balance text-muted-foreground md:text-pretty [&_a]:underline [&_a]:underline-offset-3 [&_a]:hover:text-foreground [&_p:not(:last-child)]:mb-4",
        className
      )}
      {...props}
    />
  )
}

function AlertAction({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="alert-action"
      className={cn("absolute top-1.5 right-2", className)}
      {...props}
    />
  )
}

export { Alert, AlertTitle, AlertDescription, AlertAction }

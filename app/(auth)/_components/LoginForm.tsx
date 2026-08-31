"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Eye, EyeOff, Clock, ShieldCheck, Loader2 } from "lucide-react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { toast } from "sonner"

import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import api from "@/lib/api"
import { useAuth } from "@/store/useAuth"
import { Logo } from "@/components/Logo"
import { ThemeSwitcher } from "@/components/ThemeSwitcher"

const loginSchema = z.object({
  email: z.string().min(1, "Email is required"),
  password: z.string().min(1, "Password is required"),
})

type LoginValues = z.infer<typeof loginSchema>

export const LoginForm = () => {
  const router = useRouter()
  const { setUser } = useAuth()
  const [showPassword, setShowPassword] = useState(false)
  const [pendingOpen, setPendingOpen] = useState(false)

  const form = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  })

  const onSubmit = async (values: LoginValues) => {
    try {
      const { data } = await api.post("/auth/login", {
        email: values.email,
        password: values.password,
      })

      if (data.requiresPasswordChange) {
        router.push(`/change-password?email=${encodeURIComponent(data.email)}`)
        return
      }

      localStorage.setItem("access_token", data.accessToken)
      setUser(data.user)

      if (data.user.accountStatus === "PENDING") {
        setPendingOpen(true)
        return
      }

      toast.success("Login successful")
      const isAdmin = data.user.roles?.some((r: any) => r.name === "ADMIN")
      router.push(isAdmin ? "/admin/dashboard" : "/dashboard")
    } catch (err: any) {
      const msg = err?.response?.data?.message
      toast.error(
        Array.isArray(msg)
          ? msg.join(", ")
          : msg || "Login failed. Please try again."
      )
    }
  }

  return (
    <>
      <div className="relative grid w-full max-w-5xl overflow-hidden rounded-2xl border border-border bg-card shadow-[0_28px_70px_-28px_rgba(22,110,147,0.45)] md:grid-cols-[1.05fr_1fr]">
        <ThemeSwitcher className="absolute top-4 right-4 z-20" />

        {/* ───────────────── Brand panel ───────────────── */}
        <aside className="relative hidden flex-col justify-between overflow-hidden bg-gradient-to-br from-brand-sky-600 via-brand-sky-700 to-brand-sky-900 p-10 md:flex lg:p-12">
          {/* seal-quadrant accent bar (sky · crimson · amber · verdant) */}
          <div className="absolute inset-x-0 top-0 z-10 flex h-1.5">
            <span className="flex-1 bg-brand-sky-500" />
            <span className="flex-1 bg-brand-crimson-500" />
            <span className="flex-1 bg-brand-amber-500" />
            <span className="flex-1 bg-brand-verdant-500" />
          </div>

          {/* atmosphere */}
          <div
            aria-hidden
            className="absolute inset-0 opacity-[0.14] [background-image:radial-gradient(rgba(255,255,255,0.4)_1px,transparent_1px)] [background-size:22px_22px]"
          />
          <div
            aria-hidden
            className="absolute -top-16 -right-16 h-64 w-64 rounded-full bg-brand-amber-500/20 blur-3xl"
          />
          <div
            aria-hidden
            className="absolute -bottom-20 -left-10 h-64 w-64 rounded-full bg-brand-verdant-500/25 blur-3xl"
          />

          {/* top — seal (transparent, framed by a thin outline ring) */}
          <div className="relative z-10">
            <div className="inline-flex rounded-full border-2 border-white/40 p-2">
              <Logo className="w-40 lg:w-44" />
            </div>
          </div>

          {/* middle — institutional message */}
          <div className="relative z-10 max-w-sm space-y-4">
            <p className="font-ui text-xs font-medium tracking-[0.22em] text-brand-sky-100 uppercase">
              Lagos State Health District I
            </p>
            <h2 className="font-display text-3xl leading-tight font-semibold text-white lg:text-4xl">
              Quality healthcare for every Lagos community.
            </h2>
            <p className="font-sans text-base leading-relaxed text-brand-sky-100/80">
              Sign in to coordinate care, manage facilities, and serve patients
              across the district.
            </p>
          </div>

          {/* bottom — trust + motto */}
          <div className="relative z-10 space-y-5">
            <div className="flex items-center gap-3 rounded-xl border border-white/15 bg-white/10 p-4 backdrop-blur-sm">
              <ShieldCheck className="h-5 w-5 shrink-0 text-brand-amber-300" />
              <p className="font-ui text-sm text-white/90">
                Secure access for authorized district health staff.
              </p>
            </div>
            <p className="font-accent text-lg text-brand-sky-100/80 italic">
              “Justice and Progress”
            </p>
          </div>
        </aside>

        {/* ───────────────── Form ───────────────── */}
        <div className="flex flex-col justify-center bg-card p-8 sm:p-10 lg:p-12">
          {/* seal — mobile only (panel hidden < md) */}
          <div className="mb-8 flex justify-center md:hidden">
            <div className="inline-flex rounded-full border-2 border-brand-sky-200 p-2">
              <Logo className="w-32" />
            </div>
          </div>

          <div className="animate-brand-fade-up space-y-1.5">
            <h1 className="font-display text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
              Welcome back
            </h1>
            <p className="font-sans text-muted-foreground">
              Sign in to access your dashboard.
            </p>
          </div>

          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(onSubmit)}
              className="mt-8 space-y-5"
            >
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem
                    className="animate-brand-fade-up"
                    style={{ animationDelay: "80ms" }}
                  >
                    <FormLabel className="font-ui text-sm text-muted-foreground">
                      Email
                    </FormLabel>
                    <FormControl>
                      <Input
                        className="h-11"
                        placeholder="you@lagosstate.gov.ng"
                        autoComplete="email"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem
                    className="animate-brand-fade-up"
                    style={{ animationDelay: "160ms" }}
                  >
                    <div className="flex items-center justify-between">
                      <FormLabel className="font-ui text-sm text-muted-foreground">
                        Password
                      </FormLabel>
                      <Link
                        href="/forgot-password"
                        className="font-ui text-xs font-medium text-primary hover:underline"
                      >
                        Forgot password?
                      </Link>
                    </div>
                    <FormControl>
                      <div className="relative">
                        <Input
                          type={showPassword ? "text" : "password"}
                          className="h-11 pr-10"
                          placeholder="••••••••"
                          autoComplete="current-password"
                          {...field}
                        />
                        <button
                          type="button"
                          tabIndex={-1}
                          aria-label={
                            showPassword ? "Hide password" : "Show password"
                          }
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute top-1/2 right-3 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
                        >
                          {showPassword ? (
                            <EyeOff size={16} />
                          ) : (
                            <Eye size={16} />
                          )}
                        </button>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button
                type="submit"
                className="animate-brand-fade-up h-12 w-full font-ui text-base font-semibold transition-transform active:scale-[0.98]"
                style={{ animationDelay: "240ms" }}
                disabled={form.formState.isSubmitting}
                aria-busy={form.formState.isSubmitting}
              >
                {form.formState.isSubmitting ? (
                  <Loader2 className="size-5 animate-spin" aria-label="Logging in" />
                ) : (
                  "Log in"
                )}
              </Button>

              <p
                className="animate-brand-fade-up pt-2 text-center font-sans text-sm text-muted-foreground"
                style={{ animationDelay: "320ms" }}
              >
                Don&apos;t have an account?{" "}
                <Link
                  href="/register"
                  className="font-ui font-semibold text-primary hover:underline"
                >
                  Sign up
                </Link>
              </p>
            </form>
          </Form>
        </div>
      </div>

      <Dialog open={pendingOpen} onOpenChange={setPendingOpen}>
        <DialogContent className="max-w-md text-center">
          <DialogHeader className="items-center">
            <div className="mb-2 flex h-14 w-14 items-center justify-center rounded-full bg-brand-amber-100">
              <Clock className="h-7 w-7 text-brand-amber-600" />
            </div>
            <DialogTitle className="font-heading text-lg">
              Account Pending Approval
            </DialogTitle>
            <DialogDescription className="mt-2 text-sm text-muted-foreground">
              Your account has been created successfully but is awaiting
              approval from an administrator. You will be notified once your
              account is activated. Please check back later.
            </DialogDescription>
          </DialogHeader>
          <Button
            variant="outline"
            className="mt-2 w-full"
            onClick={() => setPendingOpen(false)}
          >
            OK, I&apos;ll wait
          </Button>
        </DialogContent>
      </Dialog>
    </>
  )
}

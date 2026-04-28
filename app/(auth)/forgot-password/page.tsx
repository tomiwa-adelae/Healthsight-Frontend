"use client"

import { Suspense, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { toast } from "sonner"
import { ArrowLeft, Eye, EyeOff, KeyRound, Mail, ShieldCheck } from "lucide-react"

import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Logo } from "@/components/Logo"
import api from "@/lib/api"

// ─── Step 1: Email ─────────────────────────────────────────────────────────

const emailSchema = z.object({
  email: z.string().email("Enter a valid email address"),
})
type EmailValues = z.infer<typeof emailSchema>

function StepEmail({ onNext }: { onNext: (email: string) => void }) {
  const form = useForm<EmailValues>({
    resolver: zodResolver(emailSchema),
    defaultValues: { email: "" },
  })

  async function onSubmit(values: EmailValues) {
    try {
      await api.post("/auth/forgot-password", { email: values.email })
      toast.success("OTP sent — check your email inbox.")
      onNext(values.email)
    } catch (err: any) {
      const msg = err?.response?.data?.message
      toast.error(Array.isArray(msg) ? msg.join(", ") : msg || "Something went wrong")
    }
  }

  return (
    <>
      <div className="mb-6 flex flex-col items-center gap-2 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
          <Mail className="h-6 w-6 text-primary" />
        </div>
        <h1 className="text-xl font-semibold">Forgot your password?</h1>
        <p className="text-sm text-muted-foreground">
          Enter your email and we&apos;ll send you a one-time code.
        </p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email address</FormLabel>
                <FormControl>
                  <Input placeholder="example@lagosstate.gov.ng" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button type="submit" className="h-12 w-full" disabled={form.formState.isSubmitting}>
            {form.formState.isSubmitting ? "Sending..." : "Send OTP"}
          </Button>

          <div className="flex justify-center pt-1">
            <Link href="/" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
              <ArrowLeft size={14} />
              Back to login
            </Link>
          </div>
        </form>
      </Form>
    </>
  )
}

// ─── Step 2: OTP verification ────────────────────────────────────────────────

const otpSchema = z.object({
  otp: z.string().length(6, "OTP must be 6 digits").regex(/^\d+$/, "OTP must be numeric"),
})
type OtpValues = z.infer<typeof otpSchema>

function StepOtp({
  email,
  onNext,
  onBack,
}: {
  email: string
  onNext: (otp: string) => void
  onBack: () => void
}) {
  const form = useForm<OtpValues>({
    resolver: zodResolver(otpSchema),
    defaultValues: { otp: "" },
  })

  async function onSubmit(values: OtpValues) {
    try {
      await api.post("/auth/verify-otp", { email, otp: values.otp })
      toast.success("OTP verified.")
      onNext(values.otp)
    } catch (err: any) {
      const msg = err?.response?.data?.message
      toast.error(Array.isArray(msg) ? msg.join(", ") : msg || "Invalid or expired OTP")
    }
  }

  async function resend() {
    try {
      await api.post("/auth/forgot-password", { email })
      toast.success("A new OTP has been sent.")
    } catch {
      toast.error("Could not resend OTP. Try again.")
    }
  }

  return (
    <>
      <div className="mb-6 flex flex-col items-center gap-2 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
          <ShieldCheck className="h-6 w-6 text-primary" />
        </div>
        <h1 className="text-xl font-semibold">Check your email</h1>
        <p className="text-sm text-muted-foreground">
          We sent a 6-digit code to{" "}
          <span className="font-medium text-foreground">{email}</span>.
          Enter it below.
        </p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="otp"
            render={({ field }) => (
              <FormItem>
                <FormLabel>One-time code</FormLabel>
                <FormControl>
                  <Input
                    placeholder="123456"
                    maxLength={6}
                    inputMode="numeric"
                    className="tracking-widest text-center text-lg"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button type="submit" className="h-12 w-full" disabled={form.formState.isSubmitting}>
            {form.formState.isSubmitting ? "Verifying..." : "Verify code"}
          </Button>

          <div className="flex items-center justify-between pt-1">
            <button type="button" onClick={onBack} className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
              <ArrowLeft size={14} />
              Change email
            </button>
            <button type="button" onClick={resend} className="text-sm text-primary hover:underline">
              Resend code
            </button>
          </div>
        </form>
      </Form>
    </>
  )
}

// ─── Step 3: New password ────────────────────────────────────────────────────

const passwordSchema = z
  .object({
    newPassword: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string().min(1, "Please confirm your password"),
  })
  .refine((d) => d.newPassword === d.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  })
type PasswordValues = z.infer<typeof passwordSchema>

function StepNewPassword({
  email,
  otp,
  onBack,
}: {
  email: string
  otp: string
  onBack: () => void
}) {
  const router = useRouter()
  const [showNew, setShowNew] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)

  const form = useForm<PasswordValues>({
    resolver: zodResolver(passwordSchema),
    defaultValues: { newPassword: "", confirmPassword: "" },
  })

  async function onSubmit(values: PasswordValues) {
    try {
      await api.post("/auth/reset-password", {
        email,
        otp,
        newPassword: values.newPassword,
        confirmPassword: values.confirmPassword,
      })
      toast.success("Password reset successfully. You can now log in.")
      router.push("/")
    } catch (err: any) {
      const msg = err?.response?.data?.message
      toast.error(Array.isArray(msg) ? msg.join(", ") : msg || "Something went wrong")
    }
  }

  return (
    <>
      <div className="mb-6 flex flex-col items-center gap-2 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
          <KeyRound className="h-6 w-6 text-primary" />
        </div>
        <h1 className="text-xl font-semibold">Set a new password</h1>
        <p className="text-sm text-muted-foreground">
          Choose a strong password for{" "}
          <span className="font-medium text-foreground">{email}</span>.
        </p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="newPassword"
            render={({ field }) => (
              <FormItem>
                <FormLabel>New password</FormLabel>
                <FormControl>
                  <div className="relative">
                    <Input
                      type={showNew ? "text" : "password"}
                      placeholder="At least 6 characters"
                      className="pr-10"
                      {...field}
                    />
                    <button
                      type="button"
                      tabIndex={-1}
                      onClick={() => setShowNew((v) => !v)}
                      className="absolute top-1/2 right-3 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showNew ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="confirmPassword"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Confirm password</FormLabel>
                <FormControl>
                  <div className="relative">
                    <Input
                      type={showConfirm ? "text" : "password"}
                      placeholder="Repeat new password"
                      className="pr-10"
                      {...field}
                    />
                    <button
                      type="button"
                      tabIndex={-1}
                      onClick={() => setShowConfirm((v) => !v)}
                      className="absolute top-1/2 right-3 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button type="submit" className="h-12 w-full" disabled={form.formState.isSubmitting}>
            {form.formState.isSubmitting ? "Resetting..." : "Reset password"}
          </Button>

          <div className="flex justify-center pt-1">
            <button type="button" onClick={onBack} className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
              <ArrowLeft size={14} />
              Back
            </button>
          </div>
        </form>
      </Form>
    </>
  )
}

// ─── Page shell ─────────────────────────────────────────────────────────────

type Step = "email" | "otp" | "password"

function ForgotPasswordFlow() {
  const [step, setStep] = useState<Step>("email")
  const [email, setEmail] = useState("")
  const [otp, setOtp] = useState("")

  return (
    <Card className="w-full max-w-md shadow-lg">
      <CardContent>
        <div className="mb-8 flex justify-center">
          <Logo />
        </div>

        {step === "email" && (
          <StepEmail
            onNext={(e) => {
              setEmail(e)
              setStep("otp")
            }}
          />
        )}

        {step === "otp" && (
          <StepOtp
            email={email}
            onNext={(o) => {
              setOtp(o)
              setStep("password")
            }}
            onBack={() => setStep("email")}
          />
        )}

        {step === "password" && (
          <StepNewPassword
            email={email}
            otp={otp}
            onBack={() => setStep("otp")}
          />
        )}
      </CardContent>
    </Card>
  )
}

export default function ForgotPasswordPage() {
  return (
    <Suspense>
      <ForgotPasswordFlow />
    </Suspense>
  )
}

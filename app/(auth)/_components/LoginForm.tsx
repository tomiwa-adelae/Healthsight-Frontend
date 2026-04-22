"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import Link from "next/link"
import { Eye, EyeOff, Clock } from "lucide-react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { toast } from "sonner"

import { Card, CardContent } from "@/components/ui/card"
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

const loginSchema = z.object({
  email: z.string().min(1, "Email is required"),
  password: z.string().min(1, "Password is required"),
  rememberMe: z.boolean(),
})

type LoginValues = z.infer<typeof loginSchema>

export const LoginForm = () => {
  const router = useRouter()
  const { setUser } = useAuth()
  const [showPassword, setShowPassword] = useState(false)
  const [pendingOpen, setPendingOpen] = useState(false)

  const form = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "", rememberMe: false },
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
      if (values.rememberMe) localStorage.setItem("remember_me", "true")
      setUser(data.user)

      if (data.user.accountStatus === "PENDING") {
        setPendingOpen(true)
        return
      }

      toast.success("Login successful")
      router.push("/dashboard")
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
      <Card className="w-full max-w-lg shadow-lg">
        <CardContent>
          <div className="mb-10 flex justify-center">
            <Logo />
          </div>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="example@lagosstate.gov.ng"
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
                  <FormItem>
                    <FormLabel>Password</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input
                          type={showPassword ? "text" : "password"}
                          className="pr-10"
                          placeholder="••••••••"
                          {...field}
                        />
                        <button
                          type="button"
                          tabIndex={-1}
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute top-1/2 right-3 -translate-y-1/2 text-muted-foreground hover:text-foreground"
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
                className="h-12 w-full"
                disabled={form.formState.isSubmitting}
              >
                {form.formState.isSubmitting ? "Logging in..." : "Log in"}
              </Button>

              <div className="flex flex-col items-center gap-2 pt-1">
                <Link
                  href="/forgot-password"
                  className="text-sm text-primary hover:underline"
                >
                  Forgot your password?
                </Link>
                <p>
                  Don&apos;t have an account?{" "}
                  <Link
                    href="/register"
                    className="text-primary hover:underline"
                  >
                    Register
                  </Link>
                </p>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>

      <Dialog open={pendingOpen} onOpenChange={setPendingOpen}>
        <DialogContent className="max-w-md text-center">
          <DialogHeader className="items-center">
            <div className="mb-2 flex h-14 w-14 items-center justify-center rounded-full bg-amber-100">
              <Clock className="h-7 w-7 text-amber-600" />
            </div>
            <DialogTitle className="text-lg">
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

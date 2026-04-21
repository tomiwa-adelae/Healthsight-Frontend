"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import Link from "next/link"
import { Eye, EyeOff } from "lucide-react"
import { toast } from "sonner"
import * as RPNInput from "react-phone-number-input"
import { useForm, Controller } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"

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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  PhoneInput,
  CountrySelect,
  FlagComponent,
} from "@/components/PhoneNumberInput"
import api from "@/lib/api"
import { useAuth } from "@/store/useAuth"
import { Logo } from "@/components/Logo"

type RoleOption = { id: string; name: string; label: string }

const schema = z
  .object({
    firstName: z.string().min(1, "First name is required"),
    lastName: z.string().min(1, "Last name is required"),
    email: z.string().email("Enter a valid email"),
    phoneNumber: z.string().min(1, "Phone number is required"),
    districtId: z.string().optional(),
    lgaId: z.string().optional(),
    phcId: z.string().optional(),
    roleId: z.string().min(1, "Role is required"),
    password: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string().min(1, "Please confirm your password"),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  })

type FormValues = z.infer<typeof schema>

type Location = { id: string; name: string }

export const RegisterForm = () => {
  const { setUser } = useAuth()

  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [success, setSuccess] = useState(false)

  const [districts, setDistricts] = useState<Location[]>([])
  const [lgas, setLgas] = useState<Location[]>([])
  const [phcs, setPhcs] = useState<Location[]>([])
  const [roles, setRoles] = useState<RoleOption[]>([])
  const [loadingLgas, setLoadingLgas] = useState(false)
  const [loadingPhcs, setLoadingPhcs] = useState(false)

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      phoneNumber: "",
      districtId: "",
      lgaId: "",
      phcId: "",
      roleId: "",
      password: "",
      confirmPassword: "",
    },
  })

  useEffect(() => {
    api.get("/locations/districts").then((res) => setDistricts(res.data))
    api.get("/roles").then((res) => setRoles(res.data))
  }, [])

  const handleDistrictChange = async (districtId: string) => {
    form.setValue("districtId", districtId)
    form.setValue("lgaId", "")
    form.setValue("phcId", "")
    setLgas([])
    setPhcs([])
    if (!districtId) return
    setLoadingLgas(true)
    try {
      const res = await api.get(`/locations/districts/${districtId}/lgas`)
      setLgas(res.data)
    } finally {
      setLoadingLgas(false)
    }
  }

  const handleLgaChange = async (lgaId: string) => {
    form.setValue("lgaId", lgaId)
    form.setValue("phcId", "")
    setPhcs([])
    if (!lgaId) return
    setLoadingPhcs(true)
    try {
      const res = await api.get(`/locations/lgas/${lgaId}/phcs`)
      setPhcs(res.data)
    } finally {
      setLoadingPhcs(false)
    }
  }

  const onSubmit = async (values: FormValues) => {
    try {
      const payload = {
        firstName: values.firstName,
        lastName: values.lastName,
        email: values.email,
        phoneNumber: values.phoneNumber,
        password: values.password,
        confirmPassword: values.confirmPassword,
        roleId: values.roleId,
        ...(values.districtId && { districtId: values.districtId }),
        ...(values.lgaId && { lgaId: values.lgaId }),
        ...(values.phcId && { phcId: values.phcId }),
      }
      const { data } = await api.post("/auth/register", payload)
      localStorage.setItem("access_token", data.accessToken)
      setUser(data.user)
      toast.success("Registration successful")
      setSuccess(true)
    } catch (err: any) {
      const msg = err?.response?.data?.message
      toast.error(
        Array.isArray(msg)
          ? msg.join(", ")
          : msg || "Registration failed. Please try again."
      )
    }
  }

  if (success) {
    return (
      <Card className="w-full max-w-[500px] shadow-lg">
        <CardContent className="flex flex-col items-center gap-4 px-10 py-12 text-center">
          <Image
            src="/assets/images/logo.jpeg"
            alt="Lagos State Health District"
            width={100}
            height={100}
            className="rounded-full object-cover"
          />
          <h2 className="text-lg font-semibold">Registration Successful</h2>
          <p className="text-sm text-muted-foreground">
            Your account has been submitted for admin approval. You will be
            notified once your account is activated.
          </p>
          <Link href="/" className="text-sm text-primary hover:underline">
            Back to Login
          </Link>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="w-full max-w-3xl shadow-lg">
      <CardContent className="py-10">
        <div className="mb-8 flex justify-center">
          <Logo />
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
            {/* First Name / Last Name */}
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <FormField
                control={form.control}
                name="firstName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="font-semibold">First Name</FormLabel>
                    <FormControl>
                      <Input placeholder="John" {...field} />
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
                    <FormLabel className="font-semibold">Last Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Doe" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Email / Phone Number */}
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="font-semibold">Email</FormLabel>
                    <FormControl>
                      <Input
                        type="email"
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
                name="phoneNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="font-semibold">
                      Phone Number
                    </FormLabel>
                    <FormControl>
                      <RPNInput.default
                        international
                        defaultCountry="NG"
                        value={field.value}
                        onChange={(val) => field.onChange(val || "")}
                        flagComponent={FlagComponent}
                        countrySelectComponent={CountrySelect}
                        inputComponent={PhoneInput}
                        className="flex"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* District / LGA */}
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <FormField
                control={form.control}
                name="districtId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="font-semibold">District</FormLabel>
                    <Select
                      value={field.value}
                      onValueChange={handleDistrictChange}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select District" />
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
                    <FormLabel className="font-semibold">
                      Local Government Area
                    </FormLabel>
                    <Select
                      value={field.value}
                      onValueChange={handleLgaChange}
                      disabled={!form.watch("districtId") || loadingLgas}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue
                            placeholder={
                              loadingLgas
                                ? "Loading..."
                                : "Select Local Government Area"
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
            </div>

            {/* PHC / Role */}
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <FormField
                control={form.control}
                name="phcId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="font-semibold">
                      Primary Health Care (PHC)
                    </FormLabel>
                    <Select
                      value={field.value}
                      onValueChange={(val) => form.setValue("phcId", val)}
                      disabled={!form.watch("lgaId") || loadingPhcs}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue
                            placeholder={
                              loadingPhcs
                                ? "Loading..."
                                : "Select Primary Health Care (PHC)"
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
              <FormField
                control={form.control}
                name="roleId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="font-semibold">Role</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select Role" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {roles.map((r) => (
                          <SelectItem key={r.id} value={r.id}>
                            {r.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Password / Confirm Password */}
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="font-semibold">Password</FormLabel>
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
              <FormField
                control={form.control}
                name="confirmPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="font-semibold">
                      Confirm Password
                    </FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input
                          type={showConfirmPassword ? "text" : "password"}
                          className="pr-10"
                          placeholder="••••••••"
                          {...field}
                        />
                        <button
                          type="button"
                          tabIndex={-1}
                          onClick={() =>
                            setShowConfirmPassword(!showConfirmPassword)
                          }
                          className="absolute top-1/2 right-3 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                        >
                          {showConfirmPassword ? (
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
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={form.formState.isSubmitting}
            >
              {form.formState.isSubmitting ? "Registering..." : "Register"}
            </Button>

            <div className="text-center">
              <Link href="/" className="text-sm text-primary hover:underline">
                Already have an account? Login
              </Link>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  )
}

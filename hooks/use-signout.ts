"use client"

import api from "@/lib/api"
import { useAuth } from "@/store/useAuth"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

export const useSignout = () => {
  const router = useRouter()

  const handleSignout = async function signout() {
    try {
      const res = await api.post("/auth/logout")
      toast.success(res.data.message)
    } catch {
      toast.error("Oops! Failed to logout")
    } finally {
      useAuth.getState().clearUser()
      router.push("/")
    }
  }

  return handleSignout
}

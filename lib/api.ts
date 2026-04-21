import axios, { AxiosError, AxiosInstance } from "axios"
import { useAuth } from "@/store/useAuth"
import { env } from "./env"

const api: AxiosInstance = axios.create({
  baseURL: `${env.NEXT_PUBLIC_BACKEND_URL}/api`,
  withCredentials: true,
  headers: { "Content-Type": "application/json" },
})

const PUBLIC_ROUTES = [
  "/auth/login",
  "/auth/register",
  "/auth/forgot-password",
  "/auth/verify-code",
  "/auth/set-new-password",
  "/auth/refresh", // never re-intercept the refresh endpoint itself
]

function isPublicRoute(url?: string) {
  if (!url) return false
  return PUBLIC_ROUTES.some((r) => url.includes(r))
}

let isRefreshing = false
let failedQueue: Array<{
  resolve: (v?: any) => void
  reject: (e?: any) => void
}> = []

function processQueue(error: any) {
  failedQueue.forEach(({ resolve, reject }) => {
    if (error) reject(error)
    else resolve()
  })
  failedQueue = []
}

api.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("access_token")
    if (token) config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError & { config?: any }) => {
    const originalRequest = error.config
    const status = error.response?.status
    const message = (error.response?.data as any)?.message
    const path = originalRequest?.url || ""

    if (isPublicRoute(path)) {
      return Promise.reject(error)
    }

    // Handle 401 (access token expired)
    if (status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject })
        }).then(() => api(originalRequest))
      }

      originalRequest._retry = true
      isRefreshing = true

      try {
        // Attempt to refresh the access token using the refresh token cookie

        await api.post("/auth/refresh", {}, { withCredentials: true })

        // Refresh succeeded — retry queued requests
        processQueue(null)
        isRefreshing = false

        return api(originalRequest)
      } catch (err) {
        processQueue(err)
        isRefreshing = false

        // Refresh failed — session fully expired, send to login
        const { clearUser } = useAuth.getState()
        clearUser()
        if (typeof window !== "undefined") window.location.assign("/")

        return Promise.reject(err)
      }
    }

    // Handle auth guard rejections (role/session) — but NOT business logic 403s.
    // Business logic ForbiddenExceptions have custom messages (e.g. "You must purchase
    // this product first"), while the auth/roles guard returns exactly "Forbidden".
    if (message === "Unauthorized" || message === "Forbidden") {
      const { clearUser } = useAuth.getState()
      clearUser()
      if (typeof window !== "undefined") window.location.assign("/")
    }

    return Promise.reject(error)
  }
)

export default api

// ── Authenticated helpers ──────────────────────────────────────────────────────

export async function fetchData<T>(url: string): Promise<T> {
  const res = await api.get(url)
  return res.data
}
export async function postData<T>(url: string, data: any): Promise<T> {
  const res = await api.post(url, data)
  return res.data
}
export async function updateData<T>(url: string, data: any): Promise<T> {
  const res = await api.patch(url, data)
  return res.data
}
export async function deleteData<T>(url: string): Promise<T> {
  const res = await api.delete(url)
  return res.data
}
export async function uploadFile<T>(
  url: string,
  formData: FormData
): Promise<T> {
  const res = await api.post(url, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  })
  return res.data
}
export async function uploadFilePatch<T>(
  url: string,
  formData: FormData
): Promise<T> {
  const res = await api.patch(url, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  })
  return res.data
}

// ── Public (unauthenticated) helper ───────────────────────────────────────────
// Uses a plain fetch so it never triggers the auth interceptor / redirect.
export async function publicFetch<T>(url: string): Promise<T> {
  const res = await fetch(`${env.NEXT_PUBLIC_BACKEND_URL}${url}`, {
    next: { revalidate: 60 },
  })
  if (!res.ok) throw new Error(`Request failed: ${res.status}`)
  return res.json() as Promise<T>
}

import type { CallRecord, CallPage, CurrentUser, LoginResponse } from "@/types"

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || "http://localhost:8000/api/v1").replace(/\/$/, "")
const TOKEN_KEY = "telecom_access_token"

export const getToken = () => sessionStorage.getItem(TOKEN_KEY)
export const saveToken = (token: string) => sessionStorage.setItem(TOKEN_KEY, token)
export const clearToken = () => sessionStorage.removeItem(TOKEN_KEY)

export class ApiError extends Error {
  status: number
  constructor(message: string, status: number) {
    super(message)
    this.name = "ApiError"
    this.status = status
  }
}

export async function apiRequest<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken()
  const headers = new Headers(options.headers)
  if (options.body && !headers.has("Content-Type")) headers.set("Content-Type", "application/json")
  if (token) headers.set("Authorization", `Bearer ${token}`)

  let response: Response
  try {
    response = await fetch(`${API_BASE_URL}${path}`, { ...options, headers })
  } catch {
    throw new ApiError("Could not connect to the backend. Check that the API is running.", 0)
  }

  if (!response.ok) {
    const payload = await response.json().catch(() => null)
    const message = payload?.error?.message ?? payload?.detail ?? `Request failed (${response.status})`
    if (response.status === 401) clearToken()
    throw new ApiError(String(message), response.status)
  }
  if (response.status === 204) return undefined as T
  return response.json() as Promise<T>
}

export async function login(email: string, password: string) {
  const result = await apiRequest<LoginResponse>("/auth/login", {
    method: "POST", body: JSON.stringify({ email, password }),
  })
  saveToken(result.accessToken)
  return result.user
}

export async function register(fullName: string, email: string, password: string) {
  return apiRequest<CurrentUser>("/auth/register", {
    method: "POST", body: JSON.stringify({ fullName, email, password }),
  })
}

export async function currentUser() {
  return apiRequest<CurrentUser>("/auth/me")
}

export function queryString(filters: Record<string, string | number | undefined>) {
  const params = new URLSearchParams()
  for (const [key, value] of Object.entries(filters)) {
    if (value !== undefined && value !== "") params.set(key, String(value))
  }
  const query = params.toString()
  return query ? `?${query}` : ""
}

export type { CallRecord, CallPage, CurrentUser }

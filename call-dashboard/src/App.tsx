import { useCallback, useEffect, useState } from "react"
import AnalyticsDashboard from "@/components/AnalyticsDashboard"
import LoginScreen from "@/components/LoginScreen"
import { ApiError, clearToken, currentUser, getToken } from "@/lib/api"
import type { CurrentUser } from "@/types"

export default function App() {
  const [user, setUser] = useState<CurrentUser | null>(null)
  const [checkingSession, setCheckingSession] = useState(Boolean(getToken()))

  useEffect(() => {
    if (!getToken()) return
    currentUser()
      .then(setUser)
      .catch((error: unknown) => {
        clearToken()
        if (!(error instanceof ApiError)) console.error(error)
      })
      .finally(() => setCheckingSession(false))
  }, [])

  const logout = useCallback(() => {
    clearToken()
    setUser(null)
    setCheckingSession(false)
  }, [])

  if (checkingSession) return <main className="flex min-h-screen items-center justify-center bg-slate-950 text-slate-300">Checking your session…</main>
  if (!user) return <LoginScreen onAuthenticated={setUser} />
  return <AnalyticsDashboard user={user} onLogout={logout} />
}

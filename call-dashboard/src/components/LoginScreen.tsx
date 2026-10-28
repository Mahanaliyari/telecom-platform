import { useState } from "react"
import type { FormEvent } from "react"
import { Activity, Eye, EyeOff, LoaderCircle, ShieldCheck } from "lucide-react"
import { ApiError, login, register } from "@/lib/api"
import type { CurrentUser } from "@/types"

export default function LoginScreen({ onAuthenticated }: { onAuthenticated: (user: CurrentUser) => void }) {
  const [mode, setMode] = useState<"login" | "register">("login")
  const [fullName, setFullName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)
    setLoading(true)
    try {
      if (mode === "register") {
        await register(fullName, email, password)
      }
      const user = await login(email, password)
      onAuthenticated(user)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Something went wrong. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-950 px-4 py-10 text-slate-100">
      <div className="grid w-full max-w-5xl overflow-hidden rounded-3xl border border-slate-800 bg-slate-900 shadow-2xl md:grid-cols-2">
        <section className="hidden flex-col justify-between bg-gradient-to-br from-indigo-600 via-blue-700 to-slate-900 p-10 md:flex">
          <div className="flex items-center gap-3"><span className="rounded-xl bg-white/15 p-3"><Activity size={24} /></span><span className="font-semibold tracking-wide"></span></div>
          <div><h1 className="text-4xl font-bold leading-tight">Telecom analytics</h1><p className="mt-5 max-w-sm text-blue-100">A secure workspace for call activity, operational trends and telecom insights.</p></div>
          <div className="flex items-center gap-2 text-sm text-blue-100"><ShieldCheck size={18} /> Protected access with role-based permissions</div>
        </section>
        <section className="p-7 sm:p-10">
          <div className="mb-8 flex items-center gap-3 md:hidden"><span className="rounded-xl bg-indigo-500/20 p-3 text-indigo-300"><Activity size={22} /></span><span className="font-semibold"></span></div>
          <p className="text-sm font-semibold uppercase tracking-widest text-indigo-400">Secure workspace</p>
          <h2 className="mt-2 text-3xl font-bold">{mode === "login" ? "Welcome back" : "Create an account"}</h2>
          <p className="mt-2 text-sm text-slate-400">{mode === "login" ? "Sign in to access your call analytics." : "New accounts are created with Analyst access."}</p>
          <form onSubmit={submit} className="mt-8 space-y-5">
            {mode === "register" && <div><label className="mb-2 block text-sm font-medium" htmlFor="fullName">Full name</label><input id="fullName" autoComplete="name" required maxLength={120} value={fullName} onChange={e => setFullName(e.target.value)} className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20" placeholder="Your name" /></div>}
            <div><label className="mb-2 block text-sm font-medium" htmlFor="email">Email address</label><input id="email" type="email" autoComplete="email" required maxLength={254} value={email} onChange={e => setEmail(e.target.value)} className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20" placeholder="you@example.com" /></div>
            <div><label className="mb-2 block text-sm font-medium" htmlFor="password">Password</label><div className="relative"><input id="password" type={showPassword ? "text" : "password"} autoComplete={mode === "login" ? "current-password" : "new-password"} required minLength={8} maxLength={128} value={password} onChange={e => setPassword(e.target.value)} className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 pr-12 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20" placeholder="At least 8 characters" /><button type="button" aria-label={showPassword ? "Hide password" : "Show password"} onClick={() => setShowPassword(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white">{showPassword ? <EyeOff size={18} /> : <Eye size={18} />}</button></div></div>
            {error && <p role="alert" className="rounded-xl border border-red-900 bg-red-950/60 px-4 py-3 text-sm text-red-300">{error}</p>}
            <button disabled={loading} className="flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-500 px-4 py-3 font-semibold text-white transition hover:bg-indigo-400 disabled:cursor-not-allowed disabled:opacity-60">{loading && <LoaderCircle size={18} className="animate-spin" />}{loading ? "Please wait…" : mode === "login" ? "Sign in" : "Create account"}</button>
          </form>
          <p className="mt-6 text-center text-sm text-slate-400">{mode === "login" ? "Don't have an account?" : "Already registered?"}{" "}<button onClick={() => { setMode(mode === "login" ? "register" : "login"); setError(null) }} className="font-semibold text-indigo-400 hover:text-indigo-300">{mode === "login" ? "Create one" : "Sign in"}</button></p>
        </section>
      </div>
    </main>
  )
}

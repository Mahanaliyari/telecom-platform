import { useCallback, useEffect, useMemo, useState } from "react"
import { Activity, CalendarDays, ChevronLeft, ChevronRight, LogOut, RefreshCw, Search, ShieldCheck, X } from "lucide-react"
import { Bar, BarChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { ApiError, apiRequest, queryString } from "@/lib/api"
import type { CallPage, CallRecord, CallsOverTime, CityStats, CurrentUser, DurationBucket, Summary } from "@/types"

const money = (value: number | string) => "$" + Number(value).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })
const duration = (value: number | null) => value == null ? "—" : `${Math.round(value)}s`
const filterParams = (filters: Filters) => ({ dateFrom: filters.dateFrom || undefined, dateTo: filters.dateTo || undefined, city: filters.city.trim() || undefined, callerNumber: filters.callerNumber.trim() || undefined, receiverNumber: filters.receiverNumber.trim() || undefined })

type Filters = { dateFrom: string; dateTo: string; city: string; callerNumber: string; receiverNumber: string }
type DashboardData = { summary: Summary; durations: DurationBucket[]; cities: CityStats; hourly: CallsOverTime; daily: CallsOverTime }

export default function AnalyticsDashboard({ user, onLogout }: { user: CurrentUser; onLogout: () => void }) {
  const [filters, setFilters] = useState<Filters>({ dateFrom: "", dateTo: "", city: "", callerNumber: "", receiverNumber: "" })
  const [appliedFilters, setAppliedFilters] = useState<Filters>(filters)
  const [page, setPage] = useState(1)
  const [callsPage, setCallsPage] = useState<CallPage | null>(null)
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [timeline, setTimeline] = useState<"hourOfDay" | "day">("hourOfDay")
  const isAdmin = user.role === "admin"

  const loadDashboard = useCallback(async () => {
    setLoading(true)
    setError(null)
    const query = queryString(filterParams(appliedFilters))
    try {
      const [summary, durations, cities, hourly, daily] = await Promise.all([
        apiRequest<Summary>(`/analytics/summary${query}`),
        apiRequest<{ items: DurationBucket[] }>(`/analytics/duration-distribution${query}`),
        apiRequest<CityStats>(`/analytics/cities${queryString({ ...filterParams(appliedFilters), sortBy: "calls", limit: 10 })}`),
        apiRequest<CallsOverTime>(`/analytics/calls-over-time${queryString({ ...filterParams(appliedFilters), granularity: "hourOfDay" })}`),
        apiRequest<CallsOverTime>(`/analytics/calls-over-time${queryString({ ...filterParams(appliedFilters), granularity: "day" })}`),
      ])
      setData({ summary, durations: durations.items, cities, hourly, daily })
      if (isAdmin) {
        const callQuery = queryString({ ...filterParams(appliedFilters), page, pageSize: 15 })
        setCallsPage(await apiRequest<CallPage>(`/calls${callQuery}`))
      } else setCallsPage(null)
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) onLogout()
      setError(err instanceof Error ? err.message : "Unable to load dashboard data.")
    } finally {
      setLoading(false)
    }
  }, [appliedFilters, isAdmin, onLogout, page])

  // The effect starts an asynchronous API request; state changes happen when that request resolves.
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { void loadDashboard() }, [loadDashboard])

  const activeFilters = useMemo(() => Object.values(appliedFilters).some(v => v.trim() !== ""), [appliedFilters])
  function applyFilters(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (filters.dateFrom && filters.dateTo && filters.dateFrom > filters.dateTo) {
      setError("Start date must be on or before the end date.")
      return
    }
    setPage(1)
    setAppliedFilters({ ...filters })
  }
  function clearFilters() {
    const empty = { dateFrom: "", dateTo: "", city: "", callerNumber: "", receiverNumber: "" }
    setFilters(empty); setAppliedFilters(empty); setPage(1); setError(null)
  }

  const summary = data?.summary
  const kpis = summary ? [
    { label: "Total Calls", value: summary.totalCalls.toLocaleString("en-GB"), hint: "Matching call records" },
    { label: "Total Call Cost", value: money(summary.totalCost), hint: `Average ${money(summary.averageCost)} per call` },
    { label: "Average Duration", value: duration(summary.averageDurationSeconds), hint: `Longest ${duration(summary.longestCallSeconds)}` },
    { label: "Successful Calls", value: summary.successfulCalls.toLocaleString("en-GB"), hint: `${summary.totalCalls ? (summary.successfulCalls / summary.totalCalls * 100).toFixed(1) : "0.0"}% success rate` },
    { label: "Failed Calls", value: summary.failedCalls.toLocaleString("en-GB"), hint: `Shortest ${duration(summary.shortestCallSeconds)}` },
  ] : []
  const costCities = [...(data?.cities.items ?? [])].sort((a, b) => b.totalCost - a.totalCost).slice(0, 10)
  const timeData = timeline === "hourOfDay" ? data?.hourly.items ?? [] : data?.daily.items ?? []

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-[1500px] items-center justify-between gap-4 px-5 py-4 sm:px-8">
          <div className="flex items-center gap-3"><span className="rounded-xl bg-indigo-600 p-2.5 text-white"><Activity size={22} /></span><div><h1 className="text-xl font-bold tracking-tight">Call Analytics Dashboard</h1><p className="text-sm text-slate-500">Telecom Intelligence Platform</p></div></div>
          <div className="flex items-center gap-3"><div className="hidden text-right sm:block"><p className="text-sm font-semibold">{user.fullName}</p><p className="text-xs capitalize text-slate-500">{user.role}</p></div><span className="hidden items-center gap-1 rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-medium text-emerald-700 sm:flex"><ShieldCheck size={14} /> Authenticated</span><button onClick={onLogout} className="flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium hover:bg-slate-50"><LogOut size={16} /><span className="hidden sm:inline">Sign out</span></button></div>
        </div>
      </header>
      <div className="mx-auto max-w-[1500px] space-y-6 px-5 py-7 sm:px-8">
        <div className="flex flex-wrap items-end justify-between gap-3"><div><p className="text-sm font-semibold uppercase tracking-wider text-indigo-600">Overview</p><h2 className="mt-1 text-2xl font-bold">Call activity</h2><p className="mt-1 text-sm text-slate-500">Analytics are calculated by the backend from stored call records.</p></div><button onClick={() => void loadDashboard()} disabled={loading} className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium hover:bg-slate-100 disabled:opacity-60"><RefreshCw size={15} className={loading ? "animate-spin" : ""} /> Refresh data</button></div>

        <form onSubmit={applyFilters} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="mb-3 flex items-center gap-2 font-semibold"><Search size={17} className="text-indigo-600" /> Filter call records</div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            <label className="text-xs font-medium text-slate-600">From date<input type="date" value={filters.dateFrom} max={filters.dateTo || undefined} onChange={e => setFilters(v => ({ ...v, dateFrom: e.target.value }))} className="mt-1 block w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900" /></label>
            <label className="text-xs font-medium text-slate-600">To date<input type="date" value={filters.dateTo} min={filters.dateFrom || undefined} onChange={e => setFilters(v => ({ ...v, dateTo: e.target.value }))} className="mt-1 block w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900" /></label>
            <label className="text-xs font-medium text-slate-600">City<input value={filters.city} maxLength={120} onChange={e => setFilters(v => ({ ...v, city: e.target.value }))} placeholder="Search city" className="mt-1 block w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" /></label>
            {isAdmin && <label className="text-xs font-medium text-slate-600">Caller number<input inputMode="numeric" value={filters.callerNumber} maxLength={11} onChange={e => setFilters(v => ({ ...v, callerNumber: e.target.value.replace(/\D/g, "") }))} placeholder="Digits only" className="mt-1 block w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" /></label>}
            {isAdmin && <label className="text-xs font-medium text-slate-600">Receiver number<input inputMode="numeric" value={filters.receiverNumber} maxLength={11} onChange={e => setFilters(v => ({ ...v, receiverNumber: e.target.value.replace(/\D/g, "") }))} placeholder="Digits only" className="mt-1 block w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" /></label>}
          </div>
          <div className="mt-4 flex flex-wrap gap-2"><button className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500">Apply filters</button>{activeFilters && <button type="button" onClick={clearFilters} className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium hover:bg-slate-50"><X size={14} /> Clear filters</button>}{!isAdmin && <p className="self-center text-xs text-slate-500">Analyst access is aggregate-only; phone-number filters and raw call logs are restricted.</p>}</div>
        </form>

        {error && <div role="alert" className="flex items-start justify-between gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800"><span>{error}</span><button aria-label="Dismiss error" onClick={() => setError(null)}><X size={16} /></button></div>}
        {loading && !data ? <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center text-slate-500"><RefreshCw className="mx-auto mb-3 animate-spin" />Loading analytics from the API…</div> : data && <>
          <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">{kpis.map(item => <Card key={item.label} className="border-slate-200 shadow-sm"><CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-slate-500">{item.label}</CardTitle></CardHeader><CardContent><p className="text-2xl font-bold tracking-tight">{item.value}</p><p className="mt-1 text-xs text-slate-500">{item.hint}</p></CardContent></Card>)}</section>
          <section className="grid gap-5 xl:grid-cols-2">
            <Card className="border-slate-200 shadow-sm"><CardHeader><CardTitle>Call Duration Distribution</CardTitle><p className="text-sm text-slate-500">Number of calls in each duration range</p></CardHeader><CardContent><ResponsiveContainer width="100%" height={270}><BarChart data={data.durations}><CartesianGrid strokeDasharray="3 3" vertical={false} /><XAxis dataKey="label" tick={{ fontSize: 11 }} /><YAxis allowDecimals={false} /><Tooltip /><Bar dataKey="calls" name="Calls" fill="#4f46e5" radius={[5, 5, 0, 0]} /></BarChart></ResponsiveContainer></CardContent></Card>
            <Card className="border-slate-200 shadow-sm"><CardHeader><CardTitle>Call Cost by City</CardTitle><p className="text-sm text-slate-500">Top cities by total call cost · average per call {money(summary?.averageCost ?? 0)}</p></CardHeader><CardContent><ResponsiveContainer width="100%" height={270}><BarChart data={costCities} margin={{ bottom: 35 }}><CartesianGrid strokeDasharray="3 3" vertical={false} /><XAxis dataKey="city" interval={0} angle={-25} textAnchor="end" height={65} tick={{ fontSize: 10 }} /><YAxis /><Tooltip formatter={(value) => money(Number(value))} /><Bar dataKey="totalCost" name="Total cost" fill="#059669" radius={[5, 5, 0, 0]} /></BarChart></ResponsiveContainer></CardContent></Card>
            <Card className="border-slate-200 shadow-sm"><CardHeader className="flex flex-row flex-wrap items-center justify-between gap-2"><div><CardTitle>Call Activity</CardTitle><p className="mt-1 text-sm text-slate-500">Call start times in UTC</p></div><div className="flex rounded-lg bg-slate-100 p-1"><button onClick={() => setTimeline("hourOfDay")} className={`rounded-md px-3 py-1.5 text-xs font-semibold ${timeline === "hourOfDay" ? "bg-white shadow-sm" : "text-slate-500"}`}>By hour</button><button onClick={() => setTimeline("day")} className={`rounded-md px-3 py-1.5 text-xs font-semibold ${timeline === "day" ? "bg-white shadow-sm" : "text-slate-500"}`}>By day</button></div></CardHeader><CardContent><ResponsiveContainer width="100%" height={270}><LineChart data={timeData}><CartesianGrid strokeDasharray="3 3" vertical={false} /><XAxis dataKey="period" tick={{ fontSize: 10 }} interval={timeline === "day" ? "preserveStartEnd" : 2} /><YAxis allowDecimals={false} /><Tooltip /><Line type="monotone" dataKey="calls" name="Calls" stroke="#7c3aed" strokeWidth={2.5} dot={false} /></LineChart></ResponsiveContainer></CardContent></Card>
            <Card className="border-slate-200 shadow-sm"><CardHeader><CardTitle>Calls by City</CardTitle><p className="text-sm text-slate-500">Top 10 cities · {data.cities.distinctCities.toLocaleString()} distinct cities in the filtered dataset</p></CardHeader><CardContent><ResponsiveContainer width="100%" height={270}><BarChart data={data.cities.items} layout="vertical" margin={{ left: 25 }}><CartesianGrid strokeDasharray="3 3" horizontal={false} /><XAxis type="number" allowDecimals={false} /><YAxis type="category" dataKey="city" width={115} tick={{ fontSize: 10 }} /><Tooltip /><Bar dataKey="calls" name="Calls" fill="#ea580c" radius={[0, 5, 5, 0]} /></BarChart></ResponsiveContainer></CardContent></Card>
          </section>
          {isAdmin && <Card className="border-slate-200 shadow-sm"><CardHeader className="flex flex-row flex-wrap items-center justify-between gap-2"><div><CardTitle>Recent Call Logs</CardTitle><p className="mt-1 text-sm text-slate-500">Server-side pagination · {callsPage?.total.toLocaleString() ?? 0} matching records</p></div><div className="flex items-center gap-2 text-sm text-slate-500"><CalendarDays size={15} /> Newest first</div></CardHeader><CardContent><div className="overflow-x-auto"><Table><TableHeader><TableRow><TableHead>Caller Name</TableHead><TableHead>Caller Number</TableHead><TableHead>Receiver Number</TableHead><TableHead>City</TableHead><TableHead>Duration</TableHead><TableHead>Cost</TableHead><TableHead>Start Time (UTC)</TableHead></TableRow></TableHeader><TableBody>{callsPage?.items.map((call: CallRecord) => <TableRow key={call.id}><TableCell className="whitespace-nowrap font-medium">{call.callerName}</TableCell><TableCell className="whitespace-nowrap">{call.callerNumber}</TableCell><TableCell className="whitespace-nowrap">{call.receiverNumber}</TableCell><TableCell>{call.city}</TableCell><TableCell>{duration(call.callDuration)}</TableCell><TableCell>{money(call.callCost)}</TableCell><TableCell className="whitespace-nowrap">{new Date(call.callStartTime).toLocaleString("en-GB", { timeZone: "UTC" })}</TableCell></TableRow>)}{!callsPage?.items.length && <TableRow><TableCell colSpan={7} className="py-8 text-center text-slate-500">No call records match these filters.</TableCell></TableRow>}</TableBody></Table></div><div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-4"><p className="text-sm text-slate-500">Page {callsPage?.page ?? page} of {Math.max(callsPage?.totalPages ?? 0, 1)}</p><div className="flex gap-2"><button disabled={page <= 1 || loading} onClick={() => setPage(p => Math.max(1, p - 1))} className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-2 text-sm disabled:opacity-40"><ChevronLeft size={16} /> Previous</button><button disabled={!callsPage || page >= callsPage.totalPages || loading} onClick={() => setPage(p => p + 1)} className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-2 text-sm disabled:opacity-40">Next <ChevronRight size={16} /></button></div></div></CardContent></Card>}
          <footer className="flex flex-wrap items-center justify-between gap-2 pb-4 text-xs text-slate-500"><span>Telecom Intelligence Platform · Week 3</span><span>Signed in as {user.email} · {user.role}</span></footer>
        </>}
      </div>
    </main>
  )
}

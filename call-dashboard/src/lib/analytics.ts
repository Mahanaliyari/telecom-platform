import type { CallRecord } from "@/types"

const cost = (c: CallRecord) => Number(c.callCost)

export const formatMoney = (n: number) =>
  "$" + n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })

export const formatDuration = (s: number) => `${Math.round(s)}s`

export function getKpis(calls: CallRecord[]) {
  const total = calls.length
  const totalCost = calls.reduce((sum, c) => sum + cost(c), 0)
  const totalDuration = calls.reduce((sum, c) => sum + c.callDuration, 0)
  const successful = calls.filter((c) => c.callStatus).length
  return {
    total,
    totalCost,
    avgCost: total ? totalCost / total : 0,
    avgDuration: total ? totalDuration / total : 0,
    successful,
    failed: total - successful,
  }
}

export function getDurationStats(calls: CallRecord[]) {
  if (!calls.length) return null
  const sorted = [...calls].sort((a, b) => a.callDuration - b.callDuration)
  return { shortest: sorted[0], longest: sorted[sorted.length - 1] }
}

export function getDurationBuckets(calls: CallRecord[]) {
  const buckets = [
    { range: "0–19s", min: 0, max: 19, count: 0 },
    { range: "20–39s", min: 20, max: 39, count: 0 },
    { range: "40–59s", min: 40, max: 59, count: 0 },
    { range: "60–79s", min: 60, max: 79, count: 0 },
    { range: "80s+", min: 80, max: Infinity, count: 0 },
  ]
  for (const c of calls) {
    const b = buckets.find((b) => c.callDuration >= b.min && c.callDuration <= b.max)
    if (b) b.count++
  }
  return buckets.map(({ range, count }) => ({ range, count }))
}

export function getCityStats(calls: CallRecord[]) {
  const map = new Map<string, { city: string; calls: number; totalCost: number }>()
  for (const c of calls) {
    const entry = map.get(c.city) ?? { city: c.city, calls: 0, totalCost: 0 }
    entry.calls += 1
    entry.totalCost += cost(c)
    map.set(c.city, entry)
  }
  return [...map.values()].map((e) => ({
    ...e,
    totalCost: Math.round(e.totalCost * 100) / 100,
    avgCost: Math.round((e.totalCost / e.calls) * 100) / 100,
  }))
}

export function getCallsByHour(calls: CallRecord[]) {
  const hours = Array.from({ length: 24 }, (_, h) => ({
    hour: `${String(h).padStart(2, "0")}:00`,
    calls: 0,
  }))
  for (const c of calls) hours[new Date(c.callStartTime).getUTCHours()].calls++
  return hours
}

export function getCallsByDay(calls: CallRecord[]) {
  const map = new Map<string, number>()
  for (const c of calls) {
    const day = c.callStartTime.slice(0, 10)
    map.set(day, (map.get(day) ?? 0) + 1)
  }
  return [...map.entries()].sort().map(([date, calls]) => ({ date, calls }))
}
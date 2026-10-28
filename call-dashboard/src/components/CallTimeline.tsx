import { useState } from "react"
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { CallRecord } from "@/types"
import { getCallsByDay, getCallsByHour } from "@/lib/analytics"

export default function CallTimeline({ calls }: { calls: CallRecord[] }) {
  const [view, setView] = useState<"hour" | "day">("hour")
  const data: Record<string, string | number>[] =
  view === "hour" ? getCallsByHour(calls) : getCallsByDay(calls)
  const key = view === "hour" ? "hour" : "date"
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Call Activity (UTC)</CardTitle>
        <div className="flex gap-2 text-sm">
          {(["hour", "day"] as const).map((v) => (
            <button
              key={v}
              onClick={() => setView(v)}
              className={`rounded-md border px-3 py-1 ${view === v ? "bg-primary text-primary-foreground" : ""}`}
            >
              Per {v}
            </button>
          ))}
        </div>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey={key} tick={{ fontSize: 11 }} />
            <YAxis allowDecimals={false} />
            <Tooltip />
            <Line type="monotone" dataKey="calls" stroke="#7c3aed" strokeWidth={2} dot={view === "day"} />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}
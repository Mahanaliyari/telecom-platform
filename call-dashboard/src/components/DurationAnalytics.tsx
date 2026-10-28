import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { CallRecord } from "@/types"
import { getDurationBuckets, getDurationStats, getKpis, formatDuration } from "@/lib/analytics"

export default function DurationAnalytics({ calls }: { calls: CallRecord[] }) {
  const stats = getDurationStats(calls)
  const avg = getKpis(calls).avgDuration
  const data = getDurationBuckets(calls)
  return (
    <Card>
      <CardHeader><CardTitle>Call Duration</CardTitle></CardHeader>
      <CardContent>
        {stats && (
          <div className="mb-4 grid grid-cols-3 gap-2 text-sm">
            <div><p className="text-muted-foreground">Longest</p><p className="font-semibold">{formatDuration(stats.longest.callDuration)}</p></div>
            <div><p className="text-muted-foreground">Shortest</p><p className="font-semibold">{formatDuration(stats.shortest.callDuration)}</p></div>
            <div><p className="text-muted-foreground">Average</p><p className="font-semibold">{formatDuration(avg)}</p></div>
          </div>
        )}
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="range" />
            <YAxis allowDecimals={false} />
            <Tooltip />
            <Bar dataKey="count" name="Calls" fill="#2563eb" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}
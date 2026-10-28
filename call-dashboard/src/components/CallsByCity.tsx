import { useMemo } from "react"
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { CallRecord } from "@/types"
import { getCityStats } from "@/lib/analytics"

export default function CallsByCity({ calls }: { calls: CallRecord[] }) {
  const stats = useMemo(() => getCityStats(calls), [calls])
  const data = [...stats].sort((a, b) => b.calls - a.calls || b.totalCost - a.totalCost).slice(0, 10)
  return (
    <Card>
      <CardHeader>
        <CardTitle>Calls by City (Top 10)</CardTitle>
        <p className="text-sm text-muted-foreground">{stats.length} distinct cities across {calls.length} calls</p>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={data} layout="vertical" margin={{ left: 40 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis type="number" allowDecimals={false} />
            <YAxis type="category" dataKey="city" width={120} tick={{ fontSize: 11 }} />
            <Tooltip />
            <Bar dataKey="calls" fill="#ea580c" radius={[0, 4, 4, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}
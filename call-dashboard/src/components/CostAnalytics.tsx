import { useMemo } from "react"
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { CallRecord } from "@/types"
import { getCityStats, getKpis, formatMoney } from "@/lib/analytics"

export default function CostAnalytics({ calls }: { calls: CallRecord[] }) {
  const data = useMemo(
    () => getCityStats(calls).sort((a, b) => b.totalCost - a.totalCost).slice(0, 10),
    [calls]
  )
  return (
    <Card>
      <CardHeader>
        <CardTitle>Call Cost: Top 10 Cities</CardTitle>
        <p className="text-sm text-muted-foreground">Average cost per call: {formatMoney(getKpis(calls).avgCost)}</p>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="city" interval={0} angle={-35} textAnchor="end" height={80} tick={{ fontSize: 11 }} />
            <YAxis />
            <Tooltip formatter={(v) => formatMoney(Number(v))} />
            <Bar dataKey="totalCost" name="Total cost" fill="#16a34a" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}
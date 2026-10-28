import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { CallRecord } from "@/types"
import { getKpis, formatMoney, formatDuration } from "@/lib/analytics"

export default function KpiCards({ calls }: { calls: CallRecord[] }) {
  const k = getKpis(calls)
  const items = [
    { label: "Total Calls", value: k.total },
    { label: "Total Cost", value: formatMoney(k.totalCost) },
    { label: "Avg Duration", value: formatDuration(k.avgDuration) },
    { label: "Successful Calls", value: k.successful },
    { label: "Failed Calls", value: k.failed },
  ]
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
      {items.map((i) => (
        <Card key={i.label}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">{i.label}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{i.value}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
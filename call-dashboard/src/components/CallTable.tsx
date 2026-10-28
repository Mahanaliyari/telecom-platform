import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import type { CallRecord } from "@/types"
import { formatDuration, formatMoney } from "@/lib/analytics"

export default function CallTable({ calls }: { calls: CallRecord[] }) {
  const recent = [...calls]
    .sort((a, b) => +new Date(b.callStartTime) - +new Date(a.callStartTime))
    .slice(0, 15)
  return (
    <Card>
      <CardHeader><CardTitle>Recent Call Logs</CardTitle></CardHeader>
      <CardContent className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Caller Name</TableHead>
              <TableHead>Caller Number</TableHead>
              <TableHead>Receiver Number</TableHead>
              <TableHead>City</TableHead>
              <TableHead>Duration</TableHead>
              <TableHead>Cost</TableHead>
              <TableHead>Start Time</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {recent.map((c) => (
              <TableRow key={c.id}>
                <TableCell className="font-medium">{c.callerName}</TableCell>
                <TableCell>{c.callerNumber}</TableCell>
                <TableCell>{c.receiverNumber}</TableCell>
                <TableCell>{c.city}</TableCell>
                <TableCell>{formatDuration(c.callDuration)}</TableCell>
                <TableCell>{formatMoney(Number(c.callCost))}</TableCell>
                <TableCell>{new Date(c.callStartTime).toLocaleString("en-GB", { timeZone: "UTC" })}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}
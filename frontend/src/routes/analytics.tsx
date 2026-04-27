import { createFileRoute } from "@tanstack/react-router"
import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card"
import { useTelemetry } from "../queries/useTelemetry"

export const Route = createFileRoute("/analytics")({
  component: AnalyticsPage,
})

function AnalyticsPage() {
  const { data, isLoading } = useTelemetry()

  const chartData =
    data != null
      ? [
          { name: "Defect %", value: data.defect_rate * 100 },
          { name: "OK %", value: (1 - data.defect_rate) * 100 },
        ]
      : []

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-2xl">Analytics</CardTitle>
        <CardDescription>Runtime telemetry for inspection operations.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {isLoading || !data ? (
          <p className="text-muted-foreground">Loading...</p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <MetricCard label="Total inspections" value={`${data.total}`} />
            <MetricCard label="Avg latency" value={`${data.avg_latency_ms.toFixed(1)} ms`} />
            <MetricCard label="P50 latency" value={`${data.p50_latency_ms.toFixed(1)} ms`} />
            <MetricCard label="P95 latency" value={`${data.p95_latency_ms.toFixed(1)} ms`} />
            <MetricCard
              label="Inference mode"
              value={`demo: ${data.demo_inference_count} · prod: ${data.production_inference_count}`}
            />
          </div>
        )}
        {data && !isLoading && (
          <div className="h-64 w-full rounded-lg border border-border p-3">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" />
                <YAxis domain={[0, 100]} stroke="hsl(var(--muted-foreground))" />
                <Tooltip
                  contentStyle={{
                    background: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                  }}
                  labelStyle={{ color: "hsl(var(--foreground))" }}
                />
                <Bar dataKey="value" fill="hsl(var(--primary))" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border bg-muted/30 p-4">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="text-xl font-semibold">{value}</p>
    </div>
  )
}

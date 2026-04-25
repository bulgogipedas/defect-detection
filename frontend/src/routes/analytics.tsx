import { createFileRoute } from "@tanstack/react-router"
import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"
import { useStats } from "../queries/useStats"

export const Route = createFileRoute("/analytics")({
  component: AnalyticsPage,
})

function AnalyticsPage() {
  const { data, isLoading } = useStats()

  const chartData =
    data != null
      ? [
          { name: "Defect %", value: data.defect_rate * 100 },
          { name: "OK %", value: (1 - data.defect_rate) * 100 },
        ]
      : []

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Analytics</h1>
      {isLoading || !data ? (
        <p className="text-gray-500">Loading…</p>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          <div className="p-4 rounded-xl border border-gray-800 bg-gray-900/40">
            <p className="text-sm text-gray-500">Total inspections</p>
            <p className="text-2xl font-semibold text-white">{data.total}</p>
          </div>
          <div className="p-4 rounded-xl border border-gray-800 bg-gray-900/40">
            <p className="text-sm text-gray-500">Avg latency</p>
            <p className="text-2xl font-semibold text-white">{data.avg_latency_ms.toFixed(1)} ms</p>
          </div>
        </div>
      )}
      {data && !isLoading && (
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <XAxis dataKey="name" stroke="#9ca3af" />
              <YAxis domain={[0, 100]} stroke="#9ca3af" />
              <Tooltip
                contentStyle={{ background: "#111827", border: "1px solid #374151" }}
                labelStyle={{ color: "#e5e7eb" }}
              />
              <Bar dataKey="value" fill="#6366f1" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  )
}

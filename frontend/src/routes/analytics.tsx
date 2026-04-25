import { createFileRoute } from "@tanstack/react-router"
import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"
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
    <div className="space-y-6 rounded-3xl border border-black/10 bg-white/75 p-6 shadow-sm backdrop-blur">
      <h1 className="text-2xl font-semibold tracking-tight text-[#1d1d1f]">Analytics</h1>
      {isLoading || !data ? (
        <p className="text-[#6e6e73]">Loading…</p>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          <div className="rounded-xl border border-black/10 bg-[#f5f5f7] p-4">
            <p className="text-sm text-[#6e6e73]">Total inspections</p>
            <p className="text-2xl font-semibold text-[#1d1d1f]">{data.total}</p>
          </div>
          <div className="rounded-xl border border-black/10 bg-[#f5f5f7] p-4">
            <p className="text-sm text-[#6e6e73]">Avg latency</p>
            <p className="text-2xl font-semibold text-[#1d1d1f]">{data.avg_latency_ms.toFixed(1)} ms</p>
          </div>
          <div className="rounded-xl border border-black/10 bg-[#f5f5f7] p-4">
            <p className="text-sm text-[#6e6e73]">P50 latency</p>
            <p className="text-2xl font-semibold text-[#1d1d1f]">{data.p50_latency_ms.toFixed(1)} ms</p>
          </div>
          <div className="rounded-xl border border-black/10 bg-[#f5f5f7] p-4">
            <p className="text-sm text-[#6e6e73]">P95 latency</p>
            <p className="text-2xl font-semibold text-[#1d1d1f]">{data.p95_latency_ms.toFixed(1)} ms</p>
          </div>
          <div className="rounded-xl border border-black/10 bg-[#f5f5f7] p-4">
            <p className="text-sm text-[#6e6e73]">Inference mode</p>
            <p className="text-base text-[#1d1d1f]">
              demo: {data.demo_inference_count} · prod: {data.production_inference_count}
            </p>
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
                contentStyle={{ background: "#ffffff", border: "1px solid #d2d2d7" }}
                labelStyle={{ color: "#1d1d1f" }}
              />
              <Bar dataKey="value" fill="#0071e3" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  )
}

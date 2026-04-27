import { createFileRoute } from "@tanstack/react-router"
import { Suspense, lazy, type ReactNode } from "react"
import { Activity, GaugeCircle, ShieldCheck } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card"
import { Skeleton } from "../components/ui/skeleton"
import { useTelemetry } from "../queries/useTelemetry"

export const Route = createFileRoute("/analytics")({
  component: AnalyticsPage,
})

const LazyDefectRateChart = lazy(async () => {
  const mod = await import("../components/analytics/DefectRateChart")
  return { default: mod.DefectRateChart }
})

function AnalyticsPage() {
  const { data, isLoading } = useTelemetry()

  return (
    <div className="space-y-4 sm:space-y-5" data-page-anim>
      <div data-section-el className="surface-panel panel-interactive p-5">
        <p className="section-eyebrow">Operations Telemetry</p>
        <h1 className="text-lg font-semibold tracking-tight sm:text-xl">
          Latency, defect distribution, and runtime quality signals
        </h1>
      </div>
    <div data-section-el className="grid gap-4 lg:grid-cols-[1fr_300px]">
    <Card className="surface-panel panel-interactive">
      <CardHeader>
        <CardTitle className="text-xl sm:text-2xl">Analytics</CardTitle>
        <CardDescription>Runtime telemetry for inspection operations.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {isLoading || !data ? (
          <div className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <Skeleton className="h-24 w-full" />
              <Skeleton className="h-24 w-full" />
              <Skeleton className="h-24 w-full" />
              <Skeleton className="h-24 w-full" />
              <Skeleton className="h-24 w-full" />
            </div>
            <Skeleton className="h-64 w-full" />
          </div>
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
          <Suspense fallback={<Skeleton className="h-64 w-full" />}>
            <LazyDefectRateChart defectRate={data.defect_rate} />
          </Suspense>
        )}
      </CardContent>
    </Card>
    <aside className="space-y-4">
      <Card className="surface-panel panel-interactive">
        <CardHeader>
          <CardTitle className="text-base">Signal Health</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-2">
          <SideMetric icon={<Activity className="h-4 w-4" />} label="Data freshness" value={isLoading ? "Loading" : "Live"} />
          <SideMetric icon={<GaugeCircle className="h-4 w-4" />} label="P95 guard" value={data ? `${data.p95_latency_ms.toFixed(1)} ms` : "—"} />
          <SideMetric icon={<ShieldCheck className="h-4 w-4" />} label="Ops status" value={data ? "Stable" : "Pending"} />
        </CardContent>
      </Card>
      <Card className="surface-panel panel-interactive">
        <CardHeader>
          <CardTitle className="text-base">How to Read</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-xs text-muted-foreground">
          <p>Use P50 for typical user speed and P95 for worst-case operator wait.</p>
          <p>Compare defect rate with sample context before threshold tuning.</p>
          <p>Track mode split to validate auto/manual adoption.</p>
        </CardContent>
      </Card>
    </aside>
    </div>
    </div>
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

function SideMetric({ icon, label, value }: { icon: ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border bg-muted/30 p-3">
      <div className="flex items-center gap-2 text-muted-foreground">
        {icon}
        <p className="text-xs">{label}</p>
      </div>
      <p className="mt-1 font-semibold">{value}</p>
    </div>
  )
}

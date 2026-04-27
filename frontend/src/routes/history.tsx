import { createFileRoute } from "@tanstack/react-router"
import { Suspense, lazy, useState, type ReactNode } from "react"
import type { SortingState } from "@tanstack/react-table"
import { Clock3, DatabaseZap } from "lucide-react"
import { Button } from "../components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card"
import { Skeleton } from "../components/ui/skeleton"
import { useResults } from "../queries/useResults"

const LazyHistoryTable = lazy(async () => {
  const mod = await import("../components/history/HistoryTable")
  return { default: mod.HistoryTable }
})

export const Route = createFileRoute("/history")({
  component: HistoryPage,
})

const PAGE_SIZE = 20

function HistoryPage() {
  const [page, setPage] = useState(1)
  const [sorting, setSorting] = useState<SortingState>([])
  const { data, isLoading, isFetching } = useResults(page, PAGE_SIZE)

  const maxPage = data ? Math.max(1, Math.ceil(data.total / PAGE_SIZE)) : 1

  return (
    <div className="space-y-4 sm:space-y-5" data-page-anim>
      <div data-section-el className="surface-panel panel-interactive p-5">
        <p className="section-eyebrow">Inspection Ledger</p>
        <h1 className="text-lg font-semibold tracking-tight sm:text-xl">
          Review run history, model mode, and defect decisions
        </h1>
      </div>
    <div data-section-el className="grid gap-4 lg:grid-cols-[1fr_300px]">
    <Card className="surface-panel panel-interactive">
      <CardHeader className="flex-row items-center justify-between space-y-0">
        <CardTitle className="text-xl sm:text-2xl">Inspection History</CardTitle>
        {isFetching && <span className="text-xs text-muted-foreground">Refreshing...</span>}
      </CardHeader>

      <CardContent className="space-y-4">
        {isLoading ? (
          <div className="space-y-3">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        ) : (
          <Suspense fallback={<Skeleton className="h-64 w-full" />}>
            <LazyHistoryTable
              rows={data?.data ?? []}
              sorting={sorting}
              onSortingChange={setSorting}
              total={data?.total ?? 0}
              pageSize={PAGE_SIZE}
            />
          </Suspense>
        )}

        <div className="flex flex-wrap items-center justify-end gap-2 text-sm">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="micro-lift"
          >
            Prev
          </Button>
          <span className="text-muted-foreground">
            Page {page} of {data ? maxPage : "—"}
          </span>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => p + 1)}
            disabled={!data || page >= maxPage}
            className="micro-lift"
          >
            Next
          </Button>
        </div>
      </CardContent>
    </Card>
    <aside className="space-y-4">
      <Card className="surface-panel panel-interactive">
        <CardHeader>
          <CardTitle className="text-base">Snapshot</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-2">
          <InfoPill icon={<DatabaseZap className="h-4 w-4" />} label="Total rows" value={`${data?.total ?? 0}`} />
          <InfoPill icon={<Clock3 className="h-4 w-4" />} label="Current page" value={`${page}/${maxPage}`} />
        </CardContent>
      </Card>
      <Card className="surface-panel panel-interactive">
        <CardHeader>
          <CardTitle className="text-base">Usage Tips</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-xs text-muted-foreground">
          <p>Sort by latency or score to quickly inspect anomalies.</p>
          <p>Track model mode/version drift when deploying updates.</p>
          <p>Use Analytics page for aggregated trend signals.</p>
        </CardContent>
      </Card>
    </aside>
    </div>
    </div>
  )
}

function InfoPill({ icon, label, value }: { icon: ReactNode; label: string; value: string }) {
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

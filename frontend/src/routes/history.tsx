import { createFileRoute } from "@tanstack/react-router"
import { useState } from "react"
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
  type SortingState,
} from "@tanstack/react-table"
import { Badge } from "../components/ui/badge"
import { Button } from "../components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../components/ui/table"
import { useResults } from "../queries/useResults"
import type { ResultRecord } from "../types/api"

const col = createColumnHelper<ResultRecord>()

const columns = [
  col.accessor("created_at", {
    header: "Time",
    cell: (i) => new Date(i.getValue()).toLocaleString("en-US"),
  }),
  col.accessor("category", { header: "Category" }),
  col.accessor("is_defect", {
    header: "Status",
    cell: (i) => (
      <span>
        {i.getValue() ? "Defect" : "OK"}
      </span>
    ),
  }),
  col.accessor("anomaly_score", {
    header: "Score",
    cell: (i) => <code>{i.getValue().toFixed(4)}</code>,
  }),
  col.accessor("latency_ms", {
    header: "Latency",
    cell: (i) => `${i.getValue().toFixed(1)}ms`,
  }),
  col.accessor("model_mode", {
    header: "Mode",
    cell: (i) => i.getValue(),
  }),
  col.accessor("model_version", {
    header: "Version",
    cell: (i) => <code>{i.getValue()}</code>,
  }),
]

export const Route = createFileRoute("/history")({
  component: HistoryPage,
})

const PAGE_SIZE = 20

function HistoryPage() {
  const [page, setPage] = useState(1)
  const [sorting, setSorting] = useState<SortingState>([])
  const { data, isLoading, isFetching } = useResults(page, PAGE_SIZE)

  const table = useReactTable({
    data: data?.data ?? [],
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    manualPagination: true,
    pageCount: data ? Math.ceil(data.total / PAGE_SIZE) : -1,
  })

  const maxPage = data ? Math.max(1, Math.ceil(data.total / PAGE_SIZE)) : 1

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between space-y-0">
        <CardTitle className="text-2xl">Inspection History</CardTitle>
        {isFetching && <span className="text-xs text-muted-foreground">Refreshing...</span>}
      </CardHeader>

      <CardContent className="space-y-4">
        {isLoading ? (
          <div className="text-muted-foreground">Loading...</div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-border">
            <Table className="min-w-[700px]">
              <TableHeader className="bg-muted/30">
                {table.getHeaderGroups().map((hg) => (
                  <TableRow key={hg.id}>
                    {hg.headers.map((h) => (
                      <TableHead
                        key={h.id}
                        onClick={h.column.getToggleSortingHandler()}
                        className="cursor-pointer select-none"
                      >
                        {flexRender(h.column.columnDef.header, h.getContext())}
                        {(
                          { asc: " \u2191", desc: " \u2193" } as Record<string, string>
                        )[h.column.getIsSorted() as string] ?? ""}
                      </TableHead>
                    ))}
                  </TableRow>
                ))}
              </TableHeader>
              <TableBody>
                {table.getRowModel().rows.map((row) => (
                  <TableRow key={row.id}>
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id}>
                        {cell.column.id === "is_defect" ? (
                          <Badge variant={cell.getValue<boolean>() ? "destructive" : "default"}>
                            {cell.getValue<boolean>() ? "Defect" : "OK"}
                          </Badge>
                        ) : (
                          flexRender(cell.column.columnDef.cell, cell.getContext())
                        )}
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}

        <div className="flex flex-wrap items-center justify-end gap-2 text-sm">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
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
          >
            Next
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

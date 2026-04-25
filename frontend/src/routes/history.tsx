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
      <span className={i.getValue() ? "text-red-400 font-medium" : "text-green-400 font-medium"}>
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
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Inspection History</h1>
        {isFetching && <span className="text-xs text-gray-500">Refreshing…</span>}
      </div>

      {isLoading ? (
        <div className="text-gray-500">Loading…</div>
      ) : (
        <div className="rounded-xl border border-gray-800 overflow-x-auto">
          <table className="w-full text-sm min-w-[640px]">
            <thead className="bg-gray-900">
              {table.getHeaderGroups().map((hg) => (
                <tr key={hg.id}>
                  {hg.headers.map((h) => (
                    <th
                      key={h.id}
                      onClick={h.column.getToggleSortingHandler()}
                      className="px-4 py-3 text-left text-gray-400 font-medium
                                 cursor-pointer hover:text-white select-none"
                    >
                      {flexRender(h.column.columnDef.header, h.getContext())}
                      {(
                        { asc: " \u2191", desc: " \u2193" } as Record<string, string>
                      )[h.column.getIsSorted() as string] ?? ""}
                    </th>
                  ))}
                </tr>
              ))}
            </thead>
            <tbody>
              {table.getRowModel().rows.map((row) => (
                <tr
                  key={row.id}
                  className="border-t border-gray-800 hover:bg-gray-900/50 transition-colors"
                >
                  {row.getVisibleCells().map((cell) => (
                    <td key={cell.id} className="px-4 py-3">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="flex items-center gap-2 justify-end text-sm">
        <button
          type="button"
          onClick={() => setPage((p) => Math.max(1, p - 1))}
          disabled={page === 1}
          className="px-3 py-1.5 rounded-lg border border-gray-700
                     disabled:opacity-30 hover:bg-gray-800 transition-colors"
        >
          Prev
        </button>
        <span className="text-gray-400">
          Page {page} of {data ? maxPage : "—"}
        </span>
        <button
          type="button"
          onClick={() => setPage((p) => p + 1)}
          disabled={!data || page >= maxPage}
          className="px-3 py-1.5 rounded-lg border border-gray-700
                     disabled:opacity-30 hover:bg-gray-800 transition-colors"
        >
          Next
        </button>
      </div>
    </div>
  )
}

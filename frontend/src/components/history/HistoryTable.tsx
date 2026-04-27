import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
  type SortingState,
} from "@tanstack/react-table"
import { Badge } from "../ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../ui/table"
import type { ResultRecord } from "../../types/api"

const col = createColumnHelper<ResultRecord>()

const columns = [
  col.accessor("created_at", {
    header: "Time",
    cell: (i) => new Date(i.getValue()).toLocaleString("en-US"),
  }),
  col.accessor("category", { header: "Category" }),
  col.accessor("is_defect", {
    header: "Status",
    cell: (i) => <span>{i.getValue() ? "Defect" : "OK"}</span>,
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

type HistoryTableProps = {
  rows: ResultRecord[]
  sorting: SortingState
  onSortingChange: (next: SortingState) => void
  total: number
  pageSize: number
}

export function HistoryTable({ rows, sorting, onSortingChange, total, pageSize }: HistoryTableProps) {
  const table = useReactTable({
    data: rows,
    columns,
    state: { sorting },
    onSortingChange: (updater) => {
      const next = typeof updater === "function" ? updater(sorting) : updater
      onSortingChange(next)
    },
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    manualPagination: true,
    pageCount: Math.ceil(total / pageSize),
  })

  return (
    <div className="overflow-x-auto rounded-xl border border-border micro-lift">
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
                  {({ asc: " ↑", desc: " ↓" } as Record<string, string>)[h.column.getIsSorted() as string] ?? ""}
                </TableHead>
              ))}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>
          {table.getRowModel().rows.map((row) => (
            <TableRow key={row.id} className="group">
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
  )
}

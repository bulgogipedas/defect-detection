import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"

type DefectRateChartProps = {
  defectRate: number
}

export function DefectRateChart({ defectRate }: DefectRateChartProps) {
  const chartData = [
    { name: "Defect %", value: defectRate * 100 },
    { name: "OK %", value: (1 - defectRate) * 100 },
  ]

  return (
    <div className="h-64 w-full rounded-lg border border-border p-3 micro-lift">
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
  )
}

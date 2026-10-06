import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { MonthSeriesPoint } from "@/lib/calc";
import { monthShortLabel, formatCurrencyCompact, formatCurrency } from "@/lib/format";

export function MonthlyBarChart({ data }: { data: MonthSeriesPoint[] }) {
  const chartData = data.map((d) => ({
    label: monthShortLabel(d.year, d.month),
    Receitas: d.income,
    Despesas: d.expense,
  }));

  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={chartData} barGap={4}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
        <XAxis dataKey="label" stroke="var(--color-text-muted)" fontSize={12} axisLine={false} tickLine={false} />
        <YAxis
          stroke="var(--color-text-muted)"
          fontSize={11}
          axisLine={false}
          tickLine={false}
          tickFormatter={(v) => formatCurrencyCompact(v)}
          width={56}
        />
        <Tooltip
          contentStyle={{
            background: "var(--color-panel)",
            border: "1px solid var(--color-border)",
            borderRadius: 10,
            fontSize: 13,
          }}
          formatter={(value: number) => formatCurrency(value)}
        />
        <Bar dataKey="Receitas" fill="var(--color-income)" radius={[4, 4, 0, 0]} maxBarSize={18} />
        <Bar dataKey="Despesas" fill="var(--color-expense)" radius={[4, 4, 0, 0]} maxBarSize={18} />
      </BarChart>
    </ResponsiveContainer>
  );
}

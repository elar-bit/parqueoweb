'use client'

import { Bar, BarChart, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip } from 'recharts'
import { formatCurrency } from '@/lib/billing'

interface IncomeChartProps {
  data: { fecha: string; total: number }[]
}

export function IncomeChart({ data }: IncomeChartProps) {
  const formattedData = data.map((item) => ({
    ...item,
    label: new Date(item.fecha + 'T00:00:00').toLocaleDateString('es-PE', {
      weekday: 'short',
      day: 'numeric',
    }),
  }))

  if (data.length === 0) {
    return (
      <div className="h-[300px] flex items-center justify-center text-muted-foreground">
        No hay datos disponibles
      </div>
    )
  }

  return (
    <div className="h-[300px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={formattedData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" className="stroke-border" vertical={false} />
          <XAxis
            dataKey="label"
            tickLine={false}
            axisLine={false}
            className="text-xs fill-muted-foreground"
          />
          <YAxis
            tickLine={false}
            axisLine={false}
            className="text-xs fill-muted-foreground"
            tickFormatter={(value) => `S/${value}`}
          />
          <Tooltip
            content={({ active, payload }) => {
              if (active && payload && payload.length) {
                return (
                  <div className="bg-popover border border-border rounded-lg shadow-lg p-3">
                    <p className="text-sm text-muted-foreground">{payload[0].payload.label}</p>
                    <p className="text-lg font-semibold text-foreground">
                      {formatCurrency(payload[0].value as number)}
                    </p>
                  </div>
                )
              }
              return null
            }}
          />
          <Bar
            dataKey="total"
            fill="hsl(var(--primary))"
            radius={[4, 4, 0, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

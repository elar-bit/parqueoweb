'use client'

import { Bar, BarChart, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip, PieChart, Pie, Cell, Legend } from 'recharts'
import { formatCurrency } from '@/lib/billing'

const CHART_COLORS = ['hsl(var(--primary))', 'hsl(var(--primary) / 0.8)', 'hsl(var(--primary) / 0.6)', 'hsl(var(--primary) / 0.5)', 'hsl(var(--primary) / 0.4)', 'hsl(var(--primary) / 0.3)']

interface IncomeChartProps {
  data: { fecha: string; total: number }[]
  tipo?: 'bar' | 'pie'
}

export function IncomeChart({ data, tipo = 'bar' }: IncomeChartProps) {
  const formattedData = data.map((item) => ({
    ...item,
    name: new Date(item.fecha + 'T00:00:00').toLocaleDateString('es-PE', {
      weekday: 'short',
      day: 'numeric',
    }),
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

  const tooltipContent = ({ active, payload }: { active?: boolean; payload?: Array<{ payload: { label: string; total: number } }> }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-popover border border-border rounded-lg shadow-lg p-3">
          <p className="text-sm text-muted-foreground">{payload[0].payload.label}</p>
          <p className="text-lg font-semibold text-foreground">
            {formatCurrency(payload[0].payload.total)}
          </p>
        </div>
      )
    }
    return null
  }

  if (tipo === 'pie') {
    return (
      <div className="h-[300px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={formattedData}
              dataKey="total"
              nameKey="name"
              cx="50%"
              cy="50%"
              outerRadius={100}
              label={({ name, total }) => `${name}: ${formatCurrency(total)}`}
            >
              {formattedData.map((_, index) => (
                <Cell key={index} fill={CHART_COLORS[index % CHART_COLORS.length]} />
              ))}
            </Pie>
            <Tooltip content={tooltipContent} />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
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
          <Tooltip content={tooltipContent} />
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

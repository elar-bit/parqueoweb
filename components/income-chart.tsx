'use client'

import { useState, useEffect } from 'react'
import { Bar, BarChart, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip, PieChart, Pie, Cell, Legend } from 'recharts'
import { formatCurrency } from '@/lib/billing'

const CHART_COLORS = ['hsl(var(--primary))', 'hsl(var(--primary) / 0.8)', 'hsl(var(--primary) / 0.6)', 'hsl(var(--primary) / 0.5)', 'hsl(var(--primary) / 0.4)', 'hsl(var(--primary) / 0.3)']

/* Pastel: verde agua y coral/salmon para buen contraste */
const COLOR_VISITANTES = 'hsl(168, 42%, 72%)'
const COLOR_RESIDENTES = 'hsl(12, 52%, 76%)'

/** Móvil y tablet: ejes y torta legibles sin recortes horizontales */
function useCompactChart() {
  const [compact, setCompact] = useState(false)
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 1023px)')
    const apply = () => setCompact(mq.matches)
    apply()
    mq.addEventListener('change', apply)
    return () => mq.removeEventListener('change', apply)
  }, [])
  return compact
}

interface IncomeChartProps {
  data: { fecha: string; total: number }[]
  tipo?: 'bar' | 'pie'
  leyenda?: string
  /** Cuando se usa filtro "Todos", desglose por tipo para diferenciar visitantes y residentes. */
  dataConTipo?: { fecha: string; visitantes: number; residentes: number }[]
}

export function IncomeChart({ data, tipo = 'bar', leyenda, dataConTipo }: IncomeChartProps) {
  const compact = useCompactChart()
  const useConTipo = dataConTipo && dataConTipo.length > 0

  const barMargins = compact
    ? { top: 8, right: 6, left: 4, bottom: 36 }
    : { top: 10, right: 10, left: 10, bottom: 12 }
  const xAxisCommon = compact
    ? {
        angle: -32,
        textAnchor: 'end' as const,
        height: 52,
        tick: { fontSize: 10 },
        interval: 'preserveStartEnd' as const,
      }
    : {
        tick: { fontSize: 11 },
        interval: 'preserveStartEnd' as const,
      }

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

  const formattedDataConTipo = useConTipo
    ? (dataConTipo ?? []).map((item) => ({
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
    : []

  const pieDataConTipo = useConTipo
    ? (() => {
        const v = (dataConTipo ?? []).reduce((s, d) => s + d.visitantes, 0)
        const r = (dataConTipo ?? []).reduce((s, d) => s + d.residentes, 0)
        return [
          { name: 'Visitantes', total: v, fill: COLOR_VISITANTES },
          { name: 'Residentes', total: r, fill: COLOR_RESIDENTES },
        ].filter((x) => x.total > 0)
      })()
    : []

  const dataLength = useConTipo ? formattedDataConTipo.length : data.length
  const isEmpty = dataLength === 0 && pieDataConTipo.length === 0

  if (isEmpty && !useConTipo) {
    return (
      <div className="space-y-2">
        {leyenda && <p className="text-sm text-muted-foreground font-medium">{leyenda}</p>}
        <div className="h-[260px] sm:h-[300px] flex items-center justify-center text-muted-foreground">
          No hay datos disponibles
        </div>
      </div>
    )
  }

  if (useConTipo && dataLength === 0 && pieDataConTipo.length === 0) {
    return (
      <div className="space-y-2">
        {leyenda && <p className="text-sm text-muted-foreground font-medium">{leyenda}</p>}
        <div className="h-[260px] sm:h-[300px] flex items-center justify-center text-muted-foreground">
          No hay datos disponibles
        </div>
      </div>
    )
  }

  const tooltipContent = ({
    active,
    payload,
  }: {
    active?: boolean
    payload?: Array<{
      payload: { label: string; total?: number; visitantes?: number; residentes?: number }
    }>
  }) => {
    if (!active || !payload?.length) return null
    const p = payload[0].payload
    if (useConTipo && 'visitantes' in p && 'residentes' in p) {
      const v = p.visitantes ?? 0
      const r = p.residentes ?? 0
      return (
        <div className="bg-popover border border-border rounded-lg shadow-lg p-3 min-w-[160px]">
          <p className="text-sm text-muted-foreground font-medium">{p.label}</p>
          <p className="text-sm text-foreground mt-1">
            <span style={{ color: COLOR_VISITANTES }}>Visitantes:</span> {formatCurrency(v)}
          </p>
          <p className="text-sm text-foreground">
            <span style={{ color: COLOR_RESIDENTES }}>Residentes:</span> {formatCurrency(r)}
          </p>
          <p className="text-sm font-semibold text-foreground mt-1 pt-1 border-t border-border">
            Total: {formatCurrency(v + r)}
          </p>
        </div>
      )
    }
    return (
      <div className="bg-popover border border-border rounded-lg shadow-lg p-3">
        <p className="text-sm text-muted-foreground">{p.label}</p>
        <p className="text-lg font-semibold text-foreground">
          {formatCurrency((p as { total?: number }).total ?? 0)}
        </p>
      </div>
    )
  }

  if (useConTipo && tipo === 'pie' && pieDataConTipo.length > 0) {
    return (
      <div className="space-y-2 w-full">
        {leyenda && <p className="text-sm text-muted-foreground font-medium">Datos: {leyenda}</p>}
        <div className="h-[260px] sm:h-[300px] w-full min-w-0">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={pieDataConTipo}
                dataKey="total"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={compact ? '42%' : 100}
                labelLine={!compact}
                label={
                  compact
                    ? false
                    : ({ name, total }) => `${name}: ${formatCurrency(total)}`
                }
              >
                {pieDataConTipo.map((entry, index) => (
                  <Cell key={index} fill={entry.fill} />
                ))}
              </Pie>
              <Tooltip
                content={({ active, payload }) => {
                  if (!active || !payload?.length) return null
                  const entry = payload[0].payload as { name: string; total: number }
                  return (
                    <div className="bg-popover border border-border rounded-lg shadow-lg p-3">
                      <p className="text-sm font-medium text-foreground">{entry.name}</p>
                      <p className="text-lg font-semibold text-foreground">{formatCurrency(entry.total)}</p>
                    </div>
                  )
                }}
              />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    )
  }

  if (useConTipo && tipo === 'bar') {
    return (
      <div className="space-y-2 w-full">
        {leyenda && <p className="text-sm text-muted-foreground font-medium">Datos: {leyenda}</p>}
        <div className="h-[260px] sm:h-[300px] w-full min-w-0">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={formattedDataConTipo} margin={barMargins}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border" vertical={false} />
              <XAxis
                dataKey="label"
                tickLine={false}
                axisLine={false}
                className="text-xs fill-muted-foreground"
                {...xAxisCommon}
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                className="text-xs fill-muted-foreground"
                width={compact ? 42 : undefined}
                tick={{ fontSize: compact ? 10 : 11 }}
                tickFormatter={(value) => `S/${value}`}
              />
              <Tooltip content={tooltipContent} />
              <Bar
                dataKey="visitantes"
                name="Visitantes"
                fill={COLOR_VISITANTES}
                radius={[4, 4, 0, 0]}
              />
              <Bar
                dataKey="residentes"
                name="Residentes"
                fill={COLOR_RESIDENTES}
                radius={[4, 4, 0, 0]}
              />
              <Legend />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    )
  }

  if (tipo === 'pie') {
    return (
      <div className="space-y-2 w-full">
        {leyenda && <p className="text-sm text-muted-foreground font-medium">Datos: {leyenda}</p>}
        <div className="h-[260px] sm:h-[300px] w-full min-w-0">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={formattedData}
                dataKey="total"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={compact ? '42%' : 100}
                labelLine={!compact}
                label={
                  compact
                    ? false
                    : ({ name, total }) => `${name}: ${formatCurrency(total)}`
                }
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
      </div>
    )
  }

  return (
    <div className="space-y-2 w-full">
      {leyenda && <p className="text-sm text-muted-foreground font-medium">Datos: {leyenda}</p>}
      <div className="h-[260px] sm:h-[300px] w-full min-w-0">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={formattedData} margin={barMargins}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-border" vertical={false} />
            <XAxis
              dataKey="label"
              tickLine={false}
              axisLine={false}
              className="text-xs fill-muted-foreground"
              {...xAxisCommon}
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              className="text-xs fill-muted-foreground"
              width={compact ? 42 : undefined}
              tick={{ fontSize: compact ? 10 : 11 }}
              tickFormatter={(value) => `S/${value}`}
            />
            <Tooltip content={tooltipContent} />
            <Bar
              dataKey="total"
              name="Ingresos (S/)"
              fill="hsl(var(--primary))"
              radius={[4, 4, 0, 0]}
            />
            <Legend />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}

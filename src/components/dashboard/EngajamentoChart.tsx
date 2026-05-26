'use client'

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts'
import { Activity } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

interface EngajamentoDataPoint {
  month: string
  fullMonth: string
  pagamentos: number
  cadastros: number
  total: number
}

interface EngajamentoChartProps {
  data: EngajamentoDataPoint[]
}

interface TooltipPayloadItem {
  name: string
  value: number
  color: string
}

interface CustomTooltipProps {
  active?: boolean
  payload?: TooltipPayloadItem[]
  label?: string
}

function CustomTooltip({ active, payload, label }: CustomTooltipProps) {
  if (!active || !payload?.length) return null

  const total = payload.reduce((acc, item) => acc + item.value, 0)

  return (
    <div className="rounded-lg border bg-background p-3 shadow-md text-sm">
      <p className="font-semibold mb-1 capitalize">{label}</p>
      {payload.map((item) => (
        <p key={item.name} style={{ color: item.color }}>
          {item.name}: <span className="font-medium">{item.value}</span>
        </p>
      ))}
      <p className="text-muted-foreground mt-1 border-t pt-1">
        Total: <span className="font-medium text-foreground">{total}</span>
      </p>
    </div>
  )
}

/**
 * Gráfico de Engajamento da Torcida
 * Substitui o feed de atividades recentes — mostra pagamentos + cadastros por mês (últimos 6 meses)
 */
export function EngajamentoChart({ data }: EngajamentoChartProps) {
  const totalGeral = data.reduce((acc, d) => acc + d.total, 0)
  const mediaMensal = data.length > 0 ? Math.round(totalGeral / data.length) : 0

  if (!data || data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-orange-500" />
            Engajamento da Torcida
          </CardTitle>
          <CardDescription>Atividades por mês (pagamentos + cadastros)</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex h-[300px] items-center justify-center text-muted-foreground text-sm">
            Sem dados disponíveis
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="h-5 w-5 text-orange-500" />
          Engajamento da Torcida
        </CardTitle>
        <CardDescription>
          Atividades por mês (pagamentos confirmados + novos cadastros) — últimos 6 meses
        </CardDescription>
        <div className="flex gap-6 text-sm mt-1">
          <span className="text-muted-foreground">
            Total no período:{' '}
            <span className="font-semibold text-foreground">{totalGeral}</span>
          </span>
          <span className="text-muted-foreground">
            Média mensal:{' '}
            <span className="font-semibold text-foreground">{mediaMensal}</span>
          </span>
        </div>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={data} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis
              dataKey="month"
              tick={{ fontSize: 11 }}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              tick={{ fontSize: 11 }}
              tickLine={false}
              axisLine={false}
              allowDecimals={false}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend
              wrapperStyle={{ fontSize: '12px', paddingTop: '16px' }}
              formatter={(value) => value === 'pagamentos' ? 'Pagamentos' : 'Cadastros'}
            />
            <Bar
              dataKey="pagamentos"
              fill="#3b82f6"
              radius={[4, 4, 0, 0]}
              maxBarSize={40}
              name="pagamentos"
            />
            <Bar
              dataKey="cadastros"
              fill="#10b981"
              radius={[4, 4, 0, 0]}
              maxBarSize={40}
              name="cadastros"
            />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}

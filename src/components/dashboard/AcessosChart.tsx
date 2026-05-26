'use client'

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import { Users } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

interface AcessosDataPoint {
  month: string
  fullMonth: string
  acessos: number
}

interface AcessosChartProps {
  data: AcessosDataPoint[]
}

interface CustomTooltipProps {
  active?: boolean
  payload?: { value: number }[]
  label?: string
}

function CustomTooltip({ active, payload, label }: CustomTooltipProps) {
  if (!active || !payload?.length) return null

  return (
    <div className="rounded-lg border bg-background p-3 shadow-md text-sm">
      <p className="font-semibold mb-1 capitalize">{label}</p>
      <p className="text-indigo-500">
        Acessos: <span className="font-medium">{payload[0].value}</span>
      </p>
    </div>
  )
}

/**
 * Gráfico de Acessos da Torcida
 * Exibe o número de logins de sócios por mês (últimos 6 meses)
 * Útil para apresentar alcance e engajamento a potenciais patrocinadores.
 */
export function AcessosChart({ data }: AcessosChartProps) {
  const totalAcessos = data.reduce((acc, d) => acc + d.acessos, 0)
  const mesAtual = data[data.length - 1]
  const mediaMensal = data.length > 0 ? Math.round(totalAcessos / data.length) : 0

  if (!data || data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-indigo-500" />
            Acessos à Plataforma
          </CardTitle>
          <CardDescription>Logins de sócios por mês — útil para patrocinadores</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex h-[300px] items-center justify-center text-muted-foreground text-sm">
            Sem dados de acesso disponíveis
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5 text-indigo-500" />
          Acessos à Plataforma
        </CardTitle>
        <CardDescription>
          Logins de sócios por mês — últimos 6 meses
        </CardDescription>
        <div className="flex gap-6 text-sm mt-1 flex-wrap">
          <span className="text-muted-foreground">
            Este mês:{' '}
            <span className="font-semibold text-indigo-600">{mesAtual?.acessos ?? 0}</span>
          </span>
          <span className="text-muted-foreground">
            Total (6 meses):{' '}
            <span className="font-semibold text-foreground">{totalAcessos}</span>
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
            <Bar
              dataKey="acessos"
              fill="#6366f1"
              radius={[4, 4, 0, 0]}
              maxBarSize={48}
              name="Acessos"
            />
          </BarChart>
        </ResponsiveContainer>
        <p className="text-xs text-muted-foreground text-center mt-2">
          Cada acesso representa um login de sócio-torcedor na plataforma
        </p>
      </CardContent>
    </Card>
  )
}

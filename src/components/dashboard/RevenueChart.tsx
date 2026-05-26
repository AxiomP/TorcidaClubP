'use client'

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import { TrendingUp, DollarSign } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

interface RevenueDataPoint {
  month: string
  fullMonth: string
  revenue: number
  year: number
}

interface RevenueChartProps {
  data: RevenueDataPoint[]
}

/**
 * Gráfico de Receita Mensal
 * Line chart mostrando evolução da receita nos últimos 12 meses
 */
export function RevenueChart({ data }: RevenueChartProps) {
  // Calcular tendência geral
  if (!data || data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-green-500" />
            Receita Mensal
          </CardTitle>
          <CardDescription>Evolução da receita nos últimos 12 meses</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex h-[300px] items-center justify-center text-muted-foreground">
            Nenhum dado disponível
          </div>
        </CardContent>
      </Card>
    )
  }

  const firstRevenue = data[0]?.revenue || 0
  const lastRevenue = data[data.length - 1]?.revenue || 0
  const totalRevenue = data.reduce((sum, item) => sum + item.revenue, 0)
  const avgRevenue = totalRevenue / data.length
  const trend = firstRevenue > 0 ? ((lastRevenue - firstRevenue) / firstRevenue) * 100 : 0

  // Formato personalizado para o tooltip
  const CustomTooltip = ({ active, payload }: { active?: boolean; payload?: Array<{ value: number; payload: RevenueDataPoint }> }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload
      return (
        <div className="rounded-lg border border-border bg-background p-3 shadow-lg">
          <p className="text-sm font-medium">{data.fullMonth}</p>
          <p className="text-lg font-bold text-green-500">
            {new Intl.NumberFormat('pt-BR', {
              style: 'currency',
              currency: 'BRL',
            }).format(data.revenue)}
          </p>
        </div>
      )
    }
    return null
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-green-500" />
              Receita Mensal
            </CardTitle>
            <CardDescription>Evolução da receita nos últimos 12 meses</CardDescription>
          </div>
          <div className="text-right">
            <p className="text-sm text-muted-foreground">Média Mensal</p>
            <p className="text-xl font-bold">
              {new Intl.NumberFormat('pt-BR', {
                style: 'currency',
                currency: 'BRL',
              }).format(avgRevenue)}
            </p>
            <div className="mt-1 flex items-center justify-end gap-1 text-xs">
              <TrendingUp
                className={`h-3 w-3 ${trend >= 0 ? 'text-green-500' : 'text-red-500'}`}
              />
              <span className={trend >= 0 ? 'text-green-500' : 'text-red-500'}>
                {trend >= 0 ? '+' : ''}{trend.toFixed(1)}%
              </span>
              <span className="text-muted-foreground">nos últimos 12 meses</span>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={data} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis
              dataKey="month"
              className="text-xs"
              tick={{ fill: 'hsl(var(--muted-foreground))' }}
            />
            <YAxis
              className="text-xs"
              tick={{ fill: 'hsl(var(--muted-foreground))' }}
              tickFormatter={(value) =>
                new Intl.NumberFormat('pt-BR', {
                  style: 'currency',
                  currency: 'BRL',
                  minimumFractionDigits: 0,
                }).format(value)
              }
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend
              wrapperStyle={{ paddingTop: '20px' }}
              iconType="line"
            />
            <Line
              type="monotone"
              dataKey="revenue"
              name="Receita"
              stroke="#10b981"
              strokeWidth={2}
              dot={{ fill: '#10b981', r: 4 }}
              activeDot={{ r: 6 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}

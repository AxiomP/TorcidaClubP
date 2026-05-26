'use client'

import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import { TrendingUp, UserPlus } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

interface MemberGrowthDataPoint {
  month: string
  fullMonth: string
  newMembers: number
  totalMembers: number
}

interface MemberGrowthChartProps {
  data: MemberGrowthDataPoint[]
}

/**
 * Gráfico de Crescimento de Membros
 * Area chart mostrando novos membros e total acumulado nos últimos 6 meses
 */
export function MemberGrowthChart({ data }: MemberGrowthChartProps) {
  if (!data || data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5 text-blue-500" />
            Crescimento de Membros
          </CardTitle>
          <CardDescription>Evolução do número de sócios nos últimos 6 meses</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex h-[300px] items-center justify-center text-muted-foreground">
            Nenhum dado disponível
          </div>
        </CardContent>
      </Card>
    )
  }

  // Calcular estatísticas
  const totalNewMembers = data.reduce((sum, item) => sum + item.newMembers, 0)
  const avgNewMembers = totalNewMembers / data.length
  const currentTotal = data[data.length - 1]?.totalMembers || 0
  const previousTotal = data[0]?.totalMembers || 0
  const growthRate = previousTotal > 0 ? ((currentTotal - previousTotal) / previousTotal) * 100 : 0

  // Tooltip personalizado
  const CustomTooltip = ({ active, payload }: { active?: boolean; payload?: Array<{ value: number; payload: MemberGrowthDataPoint }> }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload
      return (
        <div className="rounded-lg border border-border bg-background p-3 shadow-lg">
          <p className="text-sm font-medium mb-2">{data.fullMonth}</p>
          <div className="space-y-1">
            <p className="text-sm">
              <span className="text-muted-foreground">Novos: </span>
              <span className="font-bold text-blue-500">+{data.newMembers}</span>
            </p>
            <p className="text-sm">
              <span className="text-muted-foreground">Total: </span>
              <span className="font-bold text-purple-500">{data.totalMembers}</span>
            </p>
          </div>
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
              <UserPlus className="h-5 w-5 text-blue-500" />
              Crescimento de Membros
            </CardTitle>
            <CardDescription>Evolução do número de sócios nos últimos 6 meses</CardDescription>
          </div>
          <div className="text-right">
            <p className="text-sm text-muted-foreground">Média de Novos/Mês</p>
            <p className="text-xl font-bold">+{Math.round(avgNewMembers)}</p>
            <div className="mt-1 flex items-center justify-end gap-1 text-xs">
              <TrendingUp
                className={`h-3 w-3 ${growthRate >= 0 ? 'text-green-500' : 'text-red-500'}`}
              />
              <span className={growthRate >= 0 ? 'text-green-500' : 'text-red-500'}>
                {growthRate >= 0 ? '+' : ''}{growthRate.toFixed(1)}%
              </span>
              <span className="text-muted-foreground">em 6 meses</span>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={data} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
            <defs>
              <linearGradient id="colorNew" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8} />
                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.8} />
                <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis
              dataKey="month"
              className="text-xs"
              tick={{ fill: 'hsl(var(--muted-foreground))' }}
            />
            <YAxis
              className="text-xs"
              tick={{ fill: 'hsl(var(--muted-foreground))' }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend
              wrapperStyle={{ paddingTop: '20px' }}
              iconType="rect"
            />
            <Area
              type="monotone"
              dataKey="newMembers"
              name="Novos Membros"
              stroke="#3b82f6"
              strokeWidth={2}
              fillOpacity={1}
              fill="url(#colorNew)"
            />
            <Area
              type="monotone"
              dataKey="totalMembers"
              name="Total Acumulado"
              stroke="#8b5cf6"
              strokeWidth={2}
              fillOpacity={1}
              fill="url(#colorTotal)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}

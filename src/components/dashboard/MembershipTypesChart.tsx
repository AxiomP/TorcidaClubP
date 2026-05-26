'use client'

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, Cell } from 'recharts'
import { Award } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

interface MembershipTypeData {
  name: string
  count: number
  value: number
  revenue: number
}

interface MembershipTypesChartProps {
  data: MembershipTypeData[]
}

// Cores para as barras
const COLORS = ['#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444']

/**
 * Gráfico de Tipos de Mensalidade
 * Bar chart mostrando os tipos de mensalidade mais populares
 */
export function MembershipTypesChart({ data }: MembershipTypesChartProps) {
  if (!data || data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Award className="h-5 w-5 text-purple-500" />
            Tipos de Mensalidade
          </CardTitle>
          <CardDescription>Ranking dos planos mais populares</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex h-[300px] items-center justify-center text-muted-foreground">
            Nenhum dado disponível
          </div>
        </CardContent>
      </Card>
    )
  }

  const totalMembers = data.reduce((sum, item) => sum + item.count, 0)
  const totalRevenue = data.reduce((sum, item) => sum + item.revenue, 0)

  // Tooltip personalizado
  const CustomTooltip = ({ active, payload }: { active?: boolean; payload?: Array<{ value: number; payload: MembershipTypeData }> }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload
      const percentage = ((data.count / totalMembers) * 100).toFixed(1)
      return (
        <div className="rounded-lg border border-border bg-background p-3 shadow-lg">
          <p className="text-sm font-medium mb-2">{data.name}</p>
          <div className="space-y-1">
            <p className="text-sm">
              <span className="text-muted-foreground">Sócios: </span>
              <span className="font-bold">{data.count}</span>
              <span className="text-xs text-muted-foreground ml-1">({percentage}%)</span>
            </p>
            <p className="text-sm">
              <span className="text-muted-foreground">Valor: </span>
              <span className="font-bold text-green-500">
                {new Intl.NumberFormat('pt-BR', {
                  style: 'currency',
                  currency: 'BRL',
                }).format(data.value)}
              </span>
            </p>
            <p className="text-sm">
              <span className="text-muted-foreground">Receita Total: </span>
              <span className="font-bold text-blue-500">
                {new Intl.NumberFormat('pt-BR', {
                  style: 'currency',
                  currency: 'BRL',
                }).format(data.revenue)}
              </span>
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
              <Award className="h-5 w-5 text-purple-500" />
              Tipos de Mensalidade
            </CardTitle>
            <CardDescription>Top 5 planos mais populares</CardDescription>
          </div>
          <div className="text-right">
            <p className="text-sm text-muted-foreground">Receita Potencial</p>
            <p className="text-xl font-bold text-green-500">
              {new Intl.NumberFormat('pt-BR', {
                style: 'currency',
                currency: 'BRL',
                minimumFractionDigits: 0,
              }).format(totalRevenue)}
            </p>
            <p className="text-xs text-muted-foreground">/mês</p>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={data} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis
              dataKey="name"
              className="text-xs"
              tick={{ fill: 'hsl(var(--muted-foreground))' }}
              angle={-45}
              textAnchor="end"
              height={80}
            />
            <YAxis
              className="text-xs"
              tick={{ fill: 'hsl(var(--muted-foreground))' }}
              label={{
                value: 'Número de Sócios',
                angle: -90,
                position: 'insideLeft',
                style: { fill: 'hsl(var(--muted-foreground))', fontSize: 12 },
              }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend
              wrapperStyle={{ paddingTop: '20px' }}
              formatter={() => 'Sócios'}
            />
            <Bar dataKey="count" name="Sócios" radius={[8, 8, 0, 0]}>
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>

        {/* Lista detalhada */}
        <div className="mt-4 space-y-2 border-t border-border pt-4">
          {data.map((item, index) => {
            const percentage = ((item.count / totalMembers) * 100).toFixed(1)
            return (
              <div key={item.name} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <div
                    className="h-3 w-3 rounded"
                    style={{ backgroundColor: COLORS[index % COLORS.length] }}
                  />
                  <span className="text-muted-foreground">{item.name}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-medium">{item.count} sócios</span>
                  <span className="text-xs text-muted-foreground w-12 text-right">
                    {percentage}%
                  </span>
                  <span className="text-xs text-green-500 w-20 text-right">
                    {new Intl.NumberFormat('pt-BR', {
                      style: 'currency',
                      currency: 'BRL',
                      minimumFractionDigits: 0,
                    }).format(item.value)}
                  </span>
                </div>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}

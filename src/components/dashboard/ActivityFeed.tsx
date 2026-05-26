'use client'

import { Activity, DollarSign, UserCheck } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ActivityItem } from './ActivityItem'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

interface ActivityData {
  id: string
  type: 'payment' | 'registration'
  memberName: string
  amount?: number
  date: string
}

interface ActivityFeedProps {
  payments: ActivityData[]
  registrations: ActivityData[]
}

/**
 * Feed de Atividades Recentes
 * Mostra últimas ações no sistema com abas para filtrar por tipo
 */
export function ActivityFeed({ payments, registrations }: ActivityFeedProps) {
  // Combinar e ordenar todas as atividades por data
  const allActivities = [...payments, ...registrations].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  )

  const hasActivities = allActivities.length > 0

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="h-5 w-5 text-orange-500" />
          Atividades Recentes
        </CardTitle>
        <CardDescription>Últimas ações realizadas no sistema</CardDescription>
      </CardHeader>
      <CardContent>
        {!hasActivities ? (
          <div className="flex h-[300px] items-center justify-center text-muted-foreground">
            Nenhuma atividade recente
          </div>
        ) : (
          <Tabs defaultValue="all" className="w-full">
            <TabsList className="grid w-full grid-cols-3 mb-4">
              <TabsTrigger value="all" className="text-xs">
                Todas ({allActivities.length})
              </TabsTrigger>
              <TabsTrigger value="payments" className="text-xs">
                <DollarSign className="h-3 w-3 mr-1" />
                Pagamentos ({payments.length})
              </TabsTrigger>
              <TabsTrigger value="registrations" className="text-xs">
                <UserCheck className="h-3 w-3 mr-1" />
                Cadastros ({registrations.length})
              </TabsTrigger>
            </TabsList>

            {/* Todas as atividades */}
            <TabsContent value="all" className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
              {allActivities.slice(0, 10).map((activity) => (
                <ActivityItem key={`${activity.type}-${activity.id}`} activity={activity} />
              ))}
            </TabsContent>

            {/* Apenas pagamentos */}
            <TabsContent value="payments" className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
              {payments.length === 0 ? (
                <div className="flex h-40 items-center justify-center text-muted-foreground text-sm">
                  Nenhum pagamento recente
                </div>
              ) : (
                payments.slice(0, 10).map((activity) => (
                  <ActivityItem key={`payment-${activity.id}`} activity={activity} />
                ))
              )}
            </TabsContent>

            {/* Apenas cadastros */}
            <TabsContent
              value="registrations"
              className="space-y-3 max-h-[400px] overflow-y-auto pr-2"
            >
              {registrations.length === 0 ? (
                <div className="flex h-40 items-center justify-center text-muted-foreground text-sm">
                  Nenhum cadastro recente
                </div>
              ) : (
                registrations.slice(0, 10).map((activity) => (
                  <ActivityItem key={`registration-${activity.id}`} activity={activity} />
                ))
              )}
            </TabsContent>
          </Tabs>
        )}
      </CardContent>
    </Card>
  )
}

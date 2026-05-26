'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Skeleton } from '@/components/ui/skeleton'
import { createClient } from '@/lib/supabase/client'
import {
  Bell,
  CreditCard,
  Calendar,
  AlertCircle,
  Clock,
  User,
  X,
  Cake,
} from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { ptBR } from 'date-fns/locale'

interface Notification {
  id: string
  socio_id: string
  titulo: string
  mensagem: string
  tipo: string
  canal: string
  enviado: boolean
  created_at: string
}

interface NotificationDropdownProps {
  children: React.ReactNode
  socioId?: string
  torcidaId?: string
  open: boolean
  onOpenChange: (open: boolean) => void
}

const TIPO_ICONES: Record<string, React.ReactNode> = {
  lembrete_pagamento: <CreditCard className="h-4 w-4 text-orange-500" />,
  pagamento_confirmado: <Clock className="h-4 w-4 text-green-500" />,
  ingresso_aprovado: <Calendar className="h-4 w-4 text-purple-500" />,
  bloqueio: <AlertCircle className="h-4 w-4 text-red-500" />,
  geral: <User className="h-4 w-4 text-blue-500" />,
  aniversario: <Cake className="h-4 w-4 text-pink-500" />,
}

const BIRTHDAY_CACHE_TTL = 5 * 60 * 1000 // 5 minutos

export function NotificationDropdown({
  children,
  socioId,
  torcidaId,
  open,
  onOpenChange,
}: NotificationDropdownProps) {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(false)
  const birthdayDataRef = useRef<{ data: Notification[]; timestamp: number } | null>(null)
  const supabaseRef = useRef(createClient())
  const isFetchingRef = useRef(false)

  const fetchNotifications = useCallback(async () => {
    if ((!socioId && !torcidaId) || isFetchingRef.current) return
    isFetchingRef.current = true
    setLoading(true)
    const supabase = supabaseRef.current
    try {
      let allNotifications: Notification[] = []

      // Gestor vê notificações de toda a torcida
      if (torcidaId && !socioId) {
        const { data, error } = await supabase
          .from('notificacoes')
          .select('*')
          .eq('torcida_id', torcidaId)
          .order('created_at', { ascending: false })
          .limit(20)

        if (!error && data) {
          allNotifications = data
        } else if (error) {
          console.error('[NotificationDropdown] Erro ao buscar notificações por torcida_id:', error.message)
        }
      } else if (socioId) {
        const { data, error } = await supabase
          .from('notificacoes')
          .select('*')
          .eq('socio_id', socioId)
          .order('created_at', { ascending: false })
          .limit(20)

        if (!error && data) {
          allNotifications = data
        }
      }

      // Para gestores: buscar aniversariantes do dia (com cache de 5min)
      if (torcidaId && !socioId) {
        const now = Date.now()
        if (birthdayDataRef.current && now - birthdayDataRef.current.timestamp < BIRTHDAY_CACHE_TTL) {
          allNotifications = [...birthdayDataRef.current.data, ...allNotifications]
        } else {
          try {
            const hoje = new Date()
            const diaAtual = hoje.getDate()
            const mesAtual = hoje.getMonth() + 1

            const { data: socios, error: birthdayError } = await supabase
              .from('socios')
              .select('id, nome_completo, data_nascimento')
              .eq('torcida_id', torcidaId)
              .in('status', ['ativo', 'inadimplente'])

            if (!birthdayError && socios) {
              const aniversariantes = socios.filter((s) => {
                if (!s.data_nascimento) return false
                const nasc = new Date(s.data_nascimento + 'T00:00:00')
                return nasc.getDate() === diaAtual && nasc.getMonth() + 1 === mesAtual
              })

              if (aniversariantes.length > 0) {
                const birthdayNotifications: Notification[] = aniversariantes.slice(0, 10).map((socio) => ({
                  id: `birthday-${socio.id}`,
                  socio_id: socio.id,
                  titulo: 'Aniversariante do dia',
                  mensagem: `${socio.nome_completo} faz aniversario hoje!`,
                  tipo: 'aniversario',
                  canal: 'in_app',
                  enviado: true,
                  created_at: hoje.toISOString(),
                }))

                birthdayDataRef.current = { data: birthdayNotifications, timestamp: now }
                allNotifications = [...birthdayNotifications, ...allNotifications]
              } else {
                birthdayDataRef.current = { data: [], timestamp: now }
              }
            } else if (birthdayError) {
              console.error('[NotificationDropdown] Erro ao buscar aniversariantes:', birthdayError.message)
            }
          } catch (err) {
            console.error('[NotificationDropdown] Erro inesperado na query de aniversários:', err)
          }
        }
      }

      setNotifications(allNotifications)
    } catch (error) {
      console.error('Erro ao buscar notificações:', error)
    } finally {
      setLoading(false)
      isFetchingRef.current = false
    }
  }, [socioId, torcidaId])

  useEffect(() => {
    if (open) {
      fetchNotifications()
    }
  }, [open, fetchNotifications])

  if (!open) {
    return <>{children}</>
  }

  return (
    <div className="relative">
      {children}
      <div className="absolute right-0 top-full mt-2 w-80 bg-popover border rounded-lg shadow-lg z-50">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center gap-2">
            <Bell className="h-4 w-4" />
            <h3 className="font-semibold">Notificacoes</h3>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0"
            onClick={() => onOpenChange(false)}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Lista de Notificações */}
        <ScrollArea className="h-[300px]">
          {loading ? (
            <div className="p-4 space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex gap-3">
                  <Skeleton className="h-8 w-8 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-3 w-2/3" />
                  </div>
                </div>
              ))}
            </div>
          ) : notifications.length === 0 ? (
            <div className="p-8 text-center">
              <Bell className="h-8 w-8 text-muted-foreground mx-auto mb-3 opacity-50" />
              <p className="text-sm text-muted-foreground">
                Nenhuma notificacao
              </p>
            </div>
          ) : (
            <div className="divide-y">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className="w-full text-left p-4 hover:bg-muted/50 transition-colors"
                >
                  <div className="flex gap-3">
                    <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                      {TIPO_ICONES[notification.tipo] || (
                        <Bell className="h-4 w-4" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium">
                        {notification.titulo}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                        {notification.mensagem}
                      </p>
                      <p className="text-xs text-muted-foreground mt-2">
                        {formatDistanceToNow(new Date(notification.created_at), {
                          addSuffix: true,
                          locale: ptBR,
                        })}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </div>
    </div>
  )
}

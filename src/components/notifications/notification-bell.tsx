'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { Bell } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { NotificationDropdown } from './notification-dropdown'
import { createClient } from '@/lib/supabase/client'

const BIRTHDAY_CACHE_TTL = 5 * 60 * 1000 // 5 minutos

interface NotificationBellProps {
  socioId?: string
  torcidaId?: string
}

export function NotificationBell({ socioId, torcidaId }: NotificationBellProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [notificationCount, setNotificationCount] = useState(0)
  const birthdayCountRef = useRef<{ count: number; timestamp: number } | null>(null)
  const supabaseRef = useRef(createClient())
  const isFetchingRef = useRef(false)

  const fetchCount = useCallback(async () => {
    if ((!socioId && !torcidaId) || isFetchingRef.current) return
    isFetchingRef.current = true

    const supabase = supabaseRef.current
    try {
      let totalCount = 0

      // Contar notificações
      if (torcidaId && !socioId) {
        const { count, error } = await supabase
          .from('notificacoes')
          .select('id', { count: 'exact', head: true })
          .eq('torcida_id', torcidaId)

        if (!error) {
          totalCount += count || 0
        } else if (!error.message?.includes('AbortError') && !error.message?.includes('aborted')) {
          console.error('[NotificationBell] Erro ao contar notificações por torcida_id:', error.message)
        }
      } else if (socioId) {
        const { count, error } = await supabase
          .from('notificacoes')
          .select('id', { count: 'exact', head: true })
          .eq('socio_id', socioId)

        if (!error) {
          totalCount += count || 0
        }
      }

      // Para gestores: contar aniversariantes do dia (com cache de 5min)
      if (torcidaId && !socioId) {
        const now = Date.now()
        if (birthdayCountRef.current && now - birthdayCountRef.current.timestamp < BIRTHDAY_CACHE_TTL) {
          totalCount += birthdayCountRef.current.count
        } else {
          try {
            const hoje = new Date()
            const diaAtual = hoje.getDate()
            const mesAtual = hoje.getMonth() + 1

            const res = await fetch('/api/socios?status=ativo&fields=aniversariantes')
            if (res.ok) {
              const { socios } = await res.json()
              const aniversariantes = (socios as Array<{ data_nascimento: string | null }>).filter((s) => {
                if (!s.data_nascimento) return false
                const nasc = new Date(s.data_nascimento + 'T00:00:00')
                return nasc.getDate() === diaAtual && nasc.getMonth() + 1 === mesAtual
              })
              birthdayCountRef.current = { count: aniversariantes.length, timestamp: now }
              totalCount += aniversariantes.length
            }
          } catch (err) {
            if (err instanceof Error && (err.name === 'AbortError' || err.message?.includes('aborted'))) return
            console.error('[NotificationBell] Erro inesperado na query de aniversários:', err)
          }
        }
      }

      setNotificationCount(totalCount)
    } catch (error) {
      if (error instanceof Error && (error.name === 'AbortError' || error.message?.includes('aborted'))) return
      console.error('Erro ao contar notificações:', error)
    } finally {
      isFetchingRef.current = false
    }
  }, [socioId, torcidaId])

  useEffect(() => {
    fetchCount()

    // Atualizar a cada 60 segundos
    const interval = setInterval(fetchCount, 60000)

    return () => clearInterval(interval)
  }, [fetchCount])

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open)
    // Polling de 60s já mantém o count atualizado — sem fetch redundante ao fechar
  }

  return (
    <NotificationDropdown
      socioId={socioId}
      torcidaId={torcidaId}
      open={isOpen}
      onOpenChange={handleOpenChange}
    >
      <Button variant="ghost" size="icon" className="relative" onClick={() => setIsOpen(!isOpen)}>
        <Bell className="h-5 w-5" />
        {notificationCount > 0 && (
          <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-red-500 text-white text-xs flex items-center justify-center font-medium">
            {notificationCount > 99 ? '99+' : notificationCount}
          </span>
        )}
        <span className="sr-only">Notificações</span>
      </Button>
    </NotificationDropdown>
  )
}

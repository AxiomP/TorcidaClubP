'use client'

import { useEffect, useState } from 'react'
import { Card } from '@/components/ui/card'
import { useAuth } from '@/hooks/use-auth'
import { useRouter } from 'next/navigation'
import { Ban, CreditCard, Phone, Mail, AlertTriangle, Building2 } from 'lucide-react'

interface TorcidaInfo {
  nome: string
  plano: string
  status: string
  mensagem_bloqueio: string | null
}

// Contatos do suporte TorcidaClub (configuráveis via env)
const SUPORTE_WHATSAPP = process.env.NEXT_PUBLIC_SUPORTE_WHATSAPP || '5531971186380'
const SUPORTE_EMAIL = process.env.NEXT_PUBLIC_SUPORTE_EMAIL || 'suporte@torcidaclub.com.br'
const CHAVE_PIX_PLATAFORMA = process.env.NEXT_PUBLIC_PIX_PLATAFORMA || 'pagamentos@torcidaclub.com.br'

function formatWhatsapp(num: string): string {
  const digits = num.replace(/\D/g, '')
  if (digits.length >= 12) {
    // +55 31 99999-9999
    return `(${digits.slice(2, 4)}) ${digits.slice(4, 9)}-${digits.slice(9)}`
  }
  if (digits.length >= 10) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`
  }
  return num
}

export default function GestorBloqueadoPage() {
  const { gestorData, loading, isGestor } = useAuth()
  const router = useRouter()
  const [torcidaInfo, setTorcidaInfo] = useState<TorcidaInfo | null>(null)

  useEffect(() => {
    if (!loading && isGestor && gestorData) {
      if (gestorData.ativo) {
        router.replace('/gestor')
        return
      }

      fetch('/api/gestor/financeiro')
        .then(r => r.ok ? r.json() : null)
        .then(data => {
          if (data?.torcida) setTorcidaInfo(data.torcida as TorcidaInfo)
        })
        .catch(console.error)
    }
  }, [loading, isGestor, gestorData, router])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-50 dark:from-red-950 dark:to-orange-950 flex items-center justify-center p-4">
      <div className="max-w-lg w-full space-y-6">
        {/* Card Principal */}
        <Card className="p-8 text-center border-red-200 dark:border-red-800">
          <div className="mx-auto w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mb-6">
            <Ban className="h-8 w-8 text-red-600 dark:text-red-400" />
          </div>

          <h1 className="text-2xl font-bold text-red-700 dark:text-red-400 mb-2">
            Acesso Suspenso
          </h1>

          <p className="text-muted-foreground mb-6">
            Olá, <span className="font-medium">{gestorData?.nome_completo}</span>.
            {torcidaInfo?.mensagem_bloqueio
              ? ` ${torcidaInfo.mensagem_bloqueio}`
              : ' O acesso da sua torcida foi suspenso devido a assinatura pendente.'}
          </p>

          {/* Informacoes da Torcida */}
          {torcidaInfo && (
            <div className="mb-6">
              <div className="flex items-center justify-center gap-2 text-muted-foreground mb-2">
                <Building2 className="h-4 w-4" />
                <span>{torcidaInfo.nome}</span>
              </div>
              <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-4">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <AlertTriangle className="h-4 w-4 text-orange-500" />
                  <span className="text-sm font-medium">Assinatura pendente</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  Plano {torcidaInfo.plano === 'basico' ? 'Basico' : torcidaInfo.plano === 'profissional' ? 'Profissional' : 'Empresarial'}
                </p>
              </div>
            </div>
          )}

          {/* Informativo */}
          <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-4 mb-6 text-left">
            <p className="text-sm text-yellow-800 dark:text-yellow-200">
              <strong>Importante:</strong> Enquanto a assinatura estiver pendente:
            </p>
            <ul className="text-sm text-yellow-700 dark:text-yellow-300 mt-2 space-y-1 list-disc list-inside">
              <li>Os socios nao conseguem acessar a plataforma</li>
              <li>Novos cadastros ficam bloqueados</li>
              <li>Notificacoes automaticas estao suspensas</li>
            </ul>
          </div>

          <p className="text-xs text-muted-foreground">
            Apos a confirmacao do pagamento, o acesso sera liberado em ate 24 horas.
          </p>
        </Card>

        {/* Card de Contato */}
        <Card className="p-6">
          <h3 className="font-semibold mb-4">Entre em contato com o suporte</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Para regularizar sua assinatura ou tirar duvidas sobre o pagamento:
          </p>

          <div className="space-y-3">
            <a
              href={`https://wa.me/${SUPORTE_WHATSAPP.replace(/\D/g, '')}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 p-3 rounded-lg bg-green-50 dark:bg-green-900/20 hover:bg-green-100 dark:hover:bg-green-900/40 transition-colors"
            >
              <Phone className="h-5 w-5 text-green-600" />
              <div>
                <p className="font-medium text-sm">WhatsApp Suporte</p>
                <p className="text-xs text-muted-foreground">{formatWhatsapp(SUPORTE_WHATSAPP)}</p>
              </div>
            </a>

            <a
              href={`mailto:${SUPORTE_EMAIL}`}
              className="flex items-center gap-3 p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-colors"
            >
              <Mail className="h-5 w-5 text-blue-600" />
              <div>
                <p className="font-medium text-sm">Email</p>
                <p className="text-xs text-muted-foreground">{SUPORTE_EMAIL}</p>
              </div>
            </a>
          </div>

          {/* PIX */}
          <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
            <p className="text-sm font-medium mb-2 flex items-center gap-2">
              <CreditCard className="h-4 w-4" />
              Chave PIX para pagamento
            </p>
            <p className="font-mono text-sm bg-white dark:bg-gray-800 p-2 rounded border break-all">
              {CHAVE_PIX_PLATAFORMA}
            </p>
          </div>
        </Card>
      </div>
    </div>
  )
}

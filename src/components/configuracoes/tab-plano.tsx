'use client'

import { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { toast } from 'react-hot-toast'
import dynamic from 'next/dynamic'

const Crown = dynamic(() => import('lucide-react').then(mod => ({ default: mod.Crown })), { ssr: false })
const Copy = dynamic(() => import('lucide-react').then(mod => ({ default: mod.Copy })), { ssr: false })
const ExternalLink = dynamic(() => import('lucide-react').then(mod => ({ default: mod.ExternalLink })), { ssr: false })
const Headphones = dynamic(() => import('lucide-react').then(mod => ({ default: mod.Headphones })), { ssr: false })

interface TabPlanoProps {
  torcida: {
    id: string
    slug: string
    status: 'pendente' | 'ativo' | 'suspenso' | 'cancelado'
    plano: 'basico' | 'profissional' | 'empresarial'
  }
}

const STATUS_LABELS: Record<string, { label: string; variant: 'success' | 'error' | 'warning' | 'info' }> = {
  pendente: { label: 'Pendente', variant: 'warning' },
  ativo: { label: 'Ativo', variant: 'success' },
  suspenso: { label: 'Suspenso', variant: 'error' },
  cancelado: { label: 'Cancelado', variant: 'error' },
}

const PLANO_LABELS: Record<string, string> = {
  basico: 'Básico',
  profissional: 'Profissional',
  empresarial: 'Empresarial',
}

export function TabPlano({ torcida }: TabPlanoProps) {
  const [activating, setActivating] = useState(false)

  const linkTorcida = typeof window !== 'undefined'
    ? `${window.location.origin}/torcida/${torcida.slug}`
    : `/torcida/${torcida.slug}`

  function copyLink() {
    navigator.clipboard.writeText(linkTorcida)
    // TODO: Mostrar toast de sucesso
  }

  async function handleActivate() {
    setActivating(true)
    try {
      const response = await fetch(`/api/torcida/${torcida.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'ativo' }),
      })
      if (!response.ok) {
        const data = await response.json().catch(() => ({}))
        console.error('Erro ao ativar torcida:', data)
        alert(data.error || 'Erro ao ativar torcida. Tente novamente.')
        return
      }
      toast.success('Torcida ativada com sucesso!')
      setTimeout(() => window.location.reload(), 800)
    } catch (error) {
      console.error('Erro ao ativar torcida:', error)
      alert('Erro de conexão. Tente novamente.')
    } finally {
      setActivating(false)
    }
  }

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="h-10 w-10 rounded-lg bg-amber-500/10 flex items-center justify-center">
            <Crown className="h-5 w-5 text-amber-500" />
          </div>
          <div>
            <h2 className="text-lg font-semibold">Seu Plano</h2>
            <p className="text-sm text-muted-foreground">Informações sobre sua assinatura</p>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Status */}
          <div className="space-y-2">
            <p className="text-sm font-medium text-muted-foreground">Status da Torcida</p>
            <div className="flex items-center gap-2">
              <Badge variant={STATUS_LABELS[torcida.status]?.variant || 'info'}>
                {STATUS_LABELS[torcida.status]?.label || torcida.status}
              </Badge>
              {torcida.status === 'pendente' && (
                <Button
                  size="sm"
                  onClick={handleActivate}
                  disabled={activating}
                >
                  {activating ? 'Ativando...' : 'Ativar Torcida'}
                </Button>
              )}
            </div>
          </div>

          {/* Plano */}
          <div className="space-y-2">
            <p className="text-sm font-medium text-muted-foreground">Plano Atual</p>
            <p className="text-lg font-semibold">
              {PLANO_LABELS[torcida.plano] || torcida.plano}
            </p>
          </div>

          {/* Link da Torcida */}
          <div className="space-y-2 md:col-span-2">
            <p className="text-sm font-medium text-muted-foreground">Link da Torcida</p>
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
              <code className="w-full sm:flex-1 px-3 py-2 bg-muted rounded-md text-sm overflow-x-auto">
                {linkTorcida}
              </code>
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={copyLink}
                title="Copiar link"
              >
                <Copy className="h-4 w-4" />
              </Button>
              <Button
                type="button"
                variant="outline"
                size="icon"
                asChild
              >
                <a href={linkTorcida} target="_blank" rel="noopener noreferrer" title="Abrir página">
                  <ExternalLink className="h-4 w-4" />
                </a>
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Compartilhe este link para convidar novos sócios
            </p>
          </div>
        </div>
      </Card>

      {/* Suporte */}
      <Card className="p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
              <Headphones className="h-5 w-5 text-blue-500" />
            </div>
            <div>
              <h2 className="text-lg font-semibold">Precisa de Ajuda?</h2>
              <p className="text-sm text-muted-foreground">Entre em contato com nosso suporte</p>
            </div>
          </div>
          <Button variant="outline" asChild>
            <a
              href="https://wa.me/5531971186380"
              target="_blank"
              rel="noopener noreferrer"
            >
              Falar com Suporte
            </a>
          </Button>
        </div>
      </Card>
    </div>
  )
}

'use client'

import { useEffect, useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import {
  Clock,
  CheckCircle2,
  FileText,
  Mail,
  Users,
  LogOut,
  RefreshCw,
  Loader2,
} from 'lucide-react'
import Image from 'next/image'

interface SocioInfo {
  id: string
  nome_completo: string
  status: string
  data_cadastro: string | null
  torcida?: {
    nome: string
    brasao_url: string | null
    cor_fundo: string | null
  }
}

export default function AguardandoValidacaoPage() {
  const supabase = createClient()
  const router = useRouter()
  const [socioInfo, setSocioInfo] = useState<SocioInfo | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const loadSocioInfo = async () => {
    try {
      const res = await fetch('/api/socio/ficha')
      if (res.status === 401) {
        router.push('/login')
        return
      }
      if (!res.ok) return

      const { socio, torcida } = await res.json()
      if (!socio) return

      if (socio.status !== 'pendente') {
        if (socio.status === 'ativo') {
          router.push('/painel')
        } else if (socio.status === 'rejeitado') {
          router.push('/cadastro-rejeitado')
        }
        return
      }

      setSocioInfo({
        id: socio.id,
        nome_completo: socio.nome_completo,
        status: socio.status,
        data_cadastro: socio.data_cadastro ?? null,
        torcida: torcida
          ? { nome: torcida.nome, brasao_url: torcida.brasao_url ?? null, cor_fundo: torcida.cor_fundo ?? null }
          : undefined,
      })
    } catch (error) {
      console.error('Erro:', error)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    loadSocioInfo()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleRefresh = async () => {
    setRefreshing(true)
    await loadSocioInfo()
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Carregando...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30 py-12 px-4">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header com Torcida */}
        {socioInfo?.torcida && (
          <Card className="p-6">
            <div className="flex items-center gap-4">
              <div
                className="w-16 h-16 rounded-full flex items-center justify-center flex-shrink-0"
                style={{ backgroundColor: socioInfo.torcida.cor_fundo || '#1a1a2e' }}
              >
                {socioInfo.torcida.brasao_url ? (
                  <Image
                    src={socioInfo.torcida.brasao_url}
                    alt={socioInfo.torcida.nome}
                    width={48}
                    height={48}
                    className="rounded-full object-cover"
                  />
                ) : (
                  <Users className="h-8 w-8 text-white" />
                )}
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Voce solicitou participar da</p>
                <h2 className="text-xl font-bold">{socioInfo.torcida.nome}</h2>
              </div>
            </div>
          </Card>
        )}

        {/* Card Principal */}
        <Card className="p-8">
          <div className="text-center space-y-4">
            <div className="w-20 h-20 rounded-full bg-warning-bg mx-auto flex items-center justify-center">
              <Clock className="h-10 w-10 text-warning" />
            </div>

            <div className="space-y-2">
              <h1 className="text-2xl font-bold">Aguardando Validacao</h1>
              <p className="text-muted-foreground">
                Ola, <strong>{socioInfo?.nome_completo?.split(' ')[0]}</strong>! Seu cadastro foi enviado e esta sendo analisado pelo gestor da torcida.
              </p>
            </div>

            {socioInfo?.data_cadastro && (
              <p className="text-sm text-muted-foreground">
                Cadastro realizado em:{' '}
                <strong>
                  {new Date(socioInfo.data_cadastro).toLocaleDateString('pt-BR', {
                    day: '2-digit',
                    month: 'long',
                    year: 'numeric',
                  })}
                </strong>
              </p>
            )}
          </div>
        </Card>

        {/* Timeline de Proximos Passos */}
        <Card className="p-6">
          <h3 className="font-semibold mb-4">Proximos passos</h3>

          <div className="space-y-4">
            <div className="flex gap-4">
              <div className="flex flex-col items-center">
                <div className="w-8 h-8 rounded-full bg-success-bg flex items-center justify-center">
                  <CheckCircle2 className="h-4 w-4 text-success" />
                </div>
                <div className="flex-1 w-0.5 bg-success mt-2" />
              </div>
              <div className="pb-4">
                <p className="font-medium text-success">Cadastro enviado</p>
                <p className="text-sm text-muted-foreground">Seus dados foram recebidos com sucesso</p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex flex-col items-center">
                <div className="w-8 h-8 rounded-full bg-warning-bg flex items-center justify-center animate-pulse">
                  <FileText className="h-4 w-4 text-warning" />
                </div>
                <div className="flex-1 w-0.5 bg-gray-200 mt-2" />
              </div>
              <div className="pb-4">
                <p className="font-medium text-warning">Analise de documentos</p>
                <p className="text-sm text-muted-foreground">O gestor esta verificando suas informacoes</p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex flex-col items-center">
                <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
                  <Mail className="h-4 w-4 text-gray-400" />
                </div>
              </div>
              <div>
                <p className="font-medium text-gray-400">Notificacao por email</p>
                <p className="text-sm text-muted-foreground">Voce recebera um email quando for aprovado</p>
              </div>
            </div>
          </div>
        </Card>

        {/* Info Box */}
        <Card className="p-4 bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800">
          <div className="flex gap-3">
            <Clock className="h-5 w-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-blue-900 dark:text-blue-100">
              <p className="font-medium mb-1">Tempo estimado de analise</p>
              <p>
                O processo de validacao pode levar ate <strong>48 horas uteis</strong>.
                Nao se esqueca de verificar sua caixa de spam.
              </p>
            </div>
          </div>
        </Card>

        {/* Acoes */}
        <div className="flex flex-col sm:flex-row gap-3">
          <Button
            variant="outline"
            className="flex-1"
            onClick={handleRefresh}
            disabled={refreshing}
          >
            {refreshing ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="mr-2 h-4 w-4" />
            )}
            Verificar Status
          </Button>

          <Button
            variant="ghost"
            className="flex-1 text-muted-foreground"
            onClick={handleLogout}
          >
            <LogOut className="mr-2 h-4 w-4" />
            Sair
          </Button>
        </div>
      </div>
    </div>
  )
}

'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { TabMensalidades } from '@/components/configuracoes/tab-mensalidades'
import { CreditCard, Calendar, Save, RefreshCw } from 'lucide-react'

interface TabConfiguracoesPagamentoProps {
  torcidaId: string
  isActive?: boolean
}

interface ConfigData {
  chave_pix: string
  dia_vencimento_mensalidade: number
}

const FETCH_TIMEOUT = 15000 // 15 segundos

export function TabConfiguracoesPagamento({ torcidaId, isActive = false }: TabConfiguracoesPagamentoProps) {
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [hasLoaded, setHasLoaded] = useState(false)
  const [loadAttempted, setLoadAttempted] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [configData, setConfigData] = useState<ConfigData>({
    chave_pix: '',
    dia_vencimento_mensalidade: 10,
  })
  const abortControllerRef = useRef<AbortController | null>(null)

  const loadConfig = useCallback(async () => {
    // Cancelar requisição anterior se existir
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }

    // Criar novo controller
    const controller = new AbortController()
    abortControllerRef.current = controller

    try {
      setLoading(true)
      setError(null)
      setLoadAttempted(true)

      // Timeout com AbortController
      const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT)

      const response = await fetch(`/api/torcida/${torcidaId}`, {
        signal: controller.signal
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || 'Erro ao carregar configurações')
      }

      const data = await response.json()
      setConfigData({
        chave_pix: data.chave_pix || '',
        dia_vencimento_mensalidade: data.dia_vencimento_mensalidade || 10,
      })
      setHasLoaded(true)
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') {
        console.warn('Requisição cancelada ou timeout')
        setError('Tempo limite excedido. Clique para tentar novamente.')
      } else {
        console.error('Erro ao carregar configurações:', err)
        setError(err instanceof Error ? err.message : 'Erro ao carregar configurações')
      }
    } finally {
      setLoading(false)
    }
  }, [torcidaId])

  useEffect(() => {
    if (isActive && !hasLoaded && !loadAttempted) {
      loadConfig()
    }

    // Cleanup: cancelar requisição ao desmontar
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }
    }
  }, [isActive, hasLoaded, loadAttempted, loadConfig])

  const handleSave = useCallback(async () => {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT)

    try {
      setSaving(true)
      setError(null)
      setSuccess(null)

      const response = await fetch(`/api/torcida/${torcidaId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chave_pix: configData.chave_pix,
          dia_vencimento_mensalidade: configData.dia_vencimento_mensalidade,
        }),
        signal: controller.signal
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        const result = await response.json().catch(() => ({}))
        throw new Error(result.error || 'Erro ao salvar configurações')
      }

      setSuccess('Configurações salvas com sucesso!')
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') {
        setError('Tempo limite excedido ao salvar. Tente novamente.')
      } else {
        console.error('Erro ao salvar configurações:', err)
        setError(err instanceof Error ? err.message : 'Erro ao salvar configurações')
      }
    } finally {
      setSaving(false)
    }
  }, [torcidaId, configData.chave_pix, configData.dia_vencimento_mensalidade])

  const handleRetry = useCallback(() => {
    setLoadAttempted(false)
    setError(null)
    loadConfig()
  }, [loadConfig])

  // Loading apenas quando está carregando ativamente
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[200px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  // Erro de carregamento com botão de retry
  if (error && !hasLoaded) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[200px] gap-4">
        <Card className="p-4 border-red-500/50 bg-red-500/10 max-w-md text-center">
          <p className="text-red-400 text-sm mb-4">{error}</p>
          <Button onClick={handleRetry} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Tentar novamente
          </Button>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Alertas */}
      {error && (
        <Card className="p-4 border-red-500/50 bg-red-500/10">
          <p className="text-red-400 text-sm">{error}</p>
        </Card>
      )}

      {success && (
        <Card className="p-4 border-green-500/50 bg-green-500/10">
          <p className="text-green-400 text-sm">{success}</p>
        </Card>
      )}

      {/* Dados PIX */}
      <Card className="p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="h-10 w-10 rounded-lg bg-green-500/10 flex items-center justify-center">
            <CreditCard className="h-5 w-5 text-green-500" />
          </div>
          <div>
            <h2 className="text-lg font-semibold">Dados PIX</h2>
            <p className="text-sm text-muted-foreground">
              Configure a chave PIX para recebimento de pagamentos
            </p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="chave_pix">Chave PIX</Label>
            <Input
              id="chave_pix"
              value={configData.chave_pix}
              onChange={(e) => setConfigData(prev => ({ ...prev, chave_pix: e.target.value }))}
              placeholder="CPF, CNPJ, email, telefone ou chave aleatória"
            />
            <p className="text-xs text-muted-foreground">
              Esta chave será exibida para os sócios realizarem os pagamentos via PIX
            </p>
          </div>
        </div>
      </Card>

      {/* Vencimento */}
      <Card className="p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="h-10 w-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
            <Calendar className="h-5 w-5 text-blue-500" />
          </div>
          <div>
            <h2 className="text-lg font-semibold">Vencimento</h2>
            <p className="text-sm text-muted-foreground">
              Configure o dia de vencimento das mensalidades
            </p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="dia_vencimento">Dia do Vencimento</Label>
            <select
              id="dia_vencimento"
              value={configData.dia_vencimento_mensalidade}
              onChange={(e) => setConfigData(prev => ({
                ...prev,
                dia_vencimento_mensalidade: parseInt(e.target.value) || 10
              }))}
              className="w-full px-3 py-2 border rounded-md bg-background text-sm"
            >
              {Array.from({ length: 28 }, (_, i) => i + 1).map((dia) => (
                <option key={dia} value={dia}>
                  Dia {dia}
                </option>
              ))}
              <option value={31}>Ultimo dia do mes</option>
            </select>
            <p className="text-xs text-muted-foreground">
              Dia do mes para vencimento das mensalidades. Selecione &quot;Ultimo dia do mes&quot; para meses com menos de 31 dias (ex: fevereiro).
            </p>
          </div>
        </div>

        {/* Botão Salvar PIX e Vencimento */}
        <div className="flex justify-end mt-6">
          <Button onClick={handleSave} disabled={saving}>
            {saving ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                Salvando...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Salvar Configurações
              </>
            )}
          </Button>
        </div>
      </Card>

      {/* Tipos de Mensalidade - Reutilizando componente existente */}
      <TabMensalidades torcidaId={torcidaId} isActive={isActive} />
    </div>
  )
}

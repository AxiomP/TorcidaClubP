'use client'

import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { torcidaConfigSchema, type TorcidaConfigData } from '@/lib/validations/torcida-schema'
import { isValidColorPreset, type ColorPresetValue } from '@/lib/utils/color-presets'
import { useAuth } from '@/hooks/use-auth'
import Link from 'next/link'
import dynamic from 'next/dynamic'
import { Plus, Settings } from 'lucide-react'

// Imports estáticos (tabs críticos - aparecem primeiro)
import { TabPlano } from '@/components/configuracoes/tab-plano'
import { TabInformacoes } from '@/components/configuracoes/tab-informacoes'
import { TabRegras } from '@/components/configuracoes/tab-regras'
import { TabVisual } from '@/components/configuracoes/tab-visual'
import { FloatingFeedbackButton } from '@/components/configuracoes/floating-feedback-button'

// Componente de loading para tabs dinâmicos
const TabLoadingSkeleton = () => (
  <div className="flex items-center justify-center py-12">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
  </div>
)

// Imports dinâmicos (tabs secundários - carregam sob demanda)
const TabLinks = dynamic(
  () => import('@/components/configuracoes/tab-links').then(m => m.TabLinks),
  { loading: () => <TabLoadingSkeleton /> }
)
const TabFuncoes = dynamic(
  () => import('@/components/configuracoes/tab-funcoes').then(m => m.TabFuncoes),
  { loading: () => <TabLoadingSkeleton /> }
)
const TabBeneficios = dynamic(
  () => import('@/components/configuracoes/tab-beneficios').then(m => m.TabBeneficios),
  { loading: () => <TabLoadingSkeleton /> }
)
// TabMensalidades movido para Pagamentos > Configurações

interface TorcidaData {
  id: string
  nome: string
  slug: string
  status: 'pendente' | 'ativo' | 'suspenso' | 'cancelado'
  plano: 'basico' | 'profissional' | 'empresarial'
  frase_efeito: string | null
  endereco_sede: string | null
  presidente: string | null
  vice_presidente: string | null
  chave_pix: string | null
  dia_vencimento_mensalidade: number
  idade_min_pagamento: number
  idade_min_compra_ingresso: number
  whatsapp_grupo: string | null
  cor_fundo: string
  brasao_url: string | null
  politica_privacidade: string | null
  termos_uso: string | null
  termos_compra_ingresso: string | null
  quem_somos: string | null
  telefone: string | null
  mensagem_bloqueio: string | null
}

export default function ConfiguracoesPage() {
  const searchParams = useSearchParams()

  // Hook de autenticação - mais confiável que getUser() direto
  const { loading: authLoading, user, gestorData, torcidaId: authTorcidaId, isGestor } = useAuth()

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploadingBrasao, setUploadingBrasao] = useState(false)
  const [torcidaId, setTorcidaId] = useState<string | null>(null)
  const [torcidaData, setTorcidaData] = useState<TorcidaData | null>(null)
  const [brasaoPreview, setBrasaoPreview] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [noTorcida, setNoTorcida] = useState(false)

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<TorcidaConfigData>({
    resolver: zodResolver(torcidaConfigSchema),
    defaultValues: {
      nome: '',
      slug: '',
      frase_efeito: '',
      endereco_sede: '',
      presidente: '',
      vice_presidente: '',
      chave_pix: '',
      dia_vencimento_mensalidade: 10,
      idade_min_pagamento: 16,
      idade_min_compra_ingresso: 12,
      whatsapp_grupo: '',
      cor_fundo: 'preto_carvao',
      brasao_url: '',
      politica_privacidade: '',
      termos_uso: '',
      termos_compra_ingresso: '',
      quem_somos: '',
      telefone: '',
      mensagem_bloqueio: '',
    },
  })

  const corFundo = watch('cor_fundo') as ColorPresetValue
  const [activeTab, setActiveTab] = useState('plano')

  useEffect(() => {
    // Aguardar auth carregar antes de fazer qualquer coisa
    if (authLoading) return

    const controller = new AbortController()
    loadTorcidaData(controller.signal)

    return () => {
      controller.abort()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authLoading, isGestor, authTorcidaId])

  useEffect(() => {
    if (searchParams.get('created') === 'true') {
      setSuccess('Torcida criada com sucesso! Configure os detalhes abaixo.')
    }
  }, [searchParams])

  async function loadTorcidaData(signal?: AbortSignal) {
    try {
      setLoading(true)
      setError(null)
      setNoTorcida(false)
      console.log('[Config] Iniciando carregamento de dados...')

      // Verificações usando dados do hook useAuth (já carregados)
      if (!isGestor || !gestorData) {
        if (!user) {
          // Auth ainda inicializando (safety timeout prematuro). Não mostrar erro.
          console.log('[Config] Auth incompleta, aguardando...')
          return
        }
        console.log('[Config] Usuário autenticado mas não é gestor')
        setError('Perfil de gestor não encontrado')
        setLoading(false)
        return
      }

      if (!authTorcidaId) {
        console.log('[Config] Gestor sem torcida associada')
        setNoTorcida(true)
        setLoading(false)
        return
      }

      if (gestorData.role !== 'admin') {
        console.log('[Config] Gestor sem permissão de admin')
        setError('Apenas administradores podem editar as configurações da torcida')
        setLoading(false)
        return
      }

      setTorcidaId(authTorcidaId)

      // Buscar dados da torcida via API
      console.log('[Config] Buscando dados da torcida via API...')

      const response = await fetch(`/api/torcida/${authTorcidaId}`, {
        signal
      })
      console.log('[Config] API respondeu com status:', response.status)

      // Se torcida foi deletada/não existe mais
      if (response.status === 404) {
        console.log('[Config] Torcida não encontrada (404)')
        setNoTorcida(true)
        setError('Sua torcida foi removida do sistema. Por favor, crie uma nova.')
        setLoading(false)
        return
      }

      if (!response.ok) {
        throw new Error(`Erro na API: ${response.status} ${response.statusText}`)
      }

      // 4. Parse JSON (sem withTimeout - AbortController já foi cancelado)
      const torcida = await response.json()

      console.log('[Config] Dados da torcida recebidos:', torcida.id)
      setTorcidaData(torcida)

      // Preencher formulário
      setValue('nome', torcida.nome || '')
      setValue('slug', torcida.slug || '')
      setValue('frase_efeito', torcida.frase_efeito || '')
      setValue('endereco_sede', torcida.endereco_sede || '')
      setValue('presidente', torcida.presidente || '')
      setValue('vice_presidente', torcida.vice_presidente || '')
      setValue('chave_pix', torcida.chave_pix || '')
      setValue('dia_vencimento_mensalidade', torcida.dia_vencimento_mensalidade || 10)
      setValue('idade_min_pagamento', torcida.idade_min_pagamento || 16)
      setValue('idade_min_compra_ingresso', torcida.idade_min_compra_ingresso || 12)
      setValue('whatsapp_grupo', torcida.whatsapp_grupo || '')
      setValue('quem_somos', torcida.quem_somos || '')
      setValue('telefone', torcida.telefone || '')
      setValue('mensagem_bloqueio', torcida.mensagem_bloqueio || '')
      setValue('politica_privacidade', torcida.politica_privacidade || '')
      setValue('termos_uso', torcida.termos_uso || '')
      setValue('termos_compra_ingresso', torcida.termos_compra_ingresso || '')

      const corFundoValue = isValidColorPreset(torcida.cor_fundo) ? torcida.cor_fundo : 'preto_carvao'
      setValue('cor_fundo', corFundoValue)
      setValue('brasao_url', torcida.brasao_url || '')

      if (torcida.brasao_url) {
        setBrasaoPreview(torcida.brasao_url)
      }

      console.log('[Config] Carregamento concluído com sucesso')

    } catch (err: unknown) {
      // AbortError é esperado quando o componente desmonta (cleanup) - ignorar silenciosamente
      if (err instanceof DOMException && err.name === 'AbortError') {
        console.log('[Config] Requisição cancelada (cleanup do componente)')
        return
      }

      const errorMessage = err instanceof Error ? err.message : String(err)
      const errorName = err instanceof Error ? err.name : 'Unknown'

      console.error('[Config] Erro ao carregar dados:', err)
      console.error('[Config] Tipo de erro:', errorName)
      console.error('[Config] Mensagem:', errorMessage)

      // Mensagens de erro específicas
      if (errorMessage.includes('Timeout')) {
        setError('Timeout ao carregar configurações. O servidor pode estar lento. Aguarde alguns segundos e tente recarregar a página.')
      } else {
        setError(`Erro ao carregar configurações da torcida: ${errorMessage}. Tente recarregar a página.`)
      }
    } finally {
      setLoading(false)
      console.log('[Config] Loading finalizado')
    }
  }

  async function onSubmit(data: TorcidaConfigData) {
    if (!torcidaId) return

    try {
      setSaving(true)
      setError(null)
      setSuccess(null)

      const response = await fetch(`/api/torcida/${torcidaId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Erro ao salvar configurações')
      }

      setSuccess('Configurações salvas com sucesso!')
      window.scrollTo({ top: 0, behavior: 'smooth' })

    } catch (err) {
      console.error('Erro ao salvar:', err)
      setError(err instanceof Error ? err.message : 'Erro ao salvar configurações')
    } finally {
      setSaving(false)
    }
  }

  async function handleBrasaoUpload(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    if (!file || !torcidaId) return

    try {
      setUploadingBrasao(true)
      setError(null)

      const formData = new FormData()
      formData.append('file', file)

      const response = await fetch(`/api/torcida/${torcidaId}/brasao`, {
        method: 'POST',
        body: formData,
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Erro ao fazer upload')
      }

      setBrasaoPreview(result.url)
      setValue('brasao_url', result.url)
      setSuccess('Brasão atualizado com sucesso!')

    } catch (err) {
      console.error('Erro no upload:', err)
      setError(err instanceof Error ? err.message : 'Erro ao fazer upload do brasão')
    } finally {
      setUploadingBrasao(false)
    }
  }

  function handleSave() {
    handleSubmit(onSubmit)()
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Carregando configurações...</p>
        </div>
      </div>
    )
  }

  // Estado: Gestor sem torcida vinculada
  if (noTorcida) {
    return (
      <div className="space-y-6 max-w-2xl">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Configurações da Torcida</h1>
          <p className="text-muted-foreground mt-2">
            Configure os dados e preferências da sua torcida
          </p>
        </div>

        <Card className="p-6">
          <div className="flex items-center gap-4 mb-6">
            <div className="h-12 w-12 rounded-full bg-yellow-500/10 flex items-center justify-center">
              <Settings className="h-6 w-6 text-yellow-500" />
            </div>
            <div>
              <h2 className="text-lg font-semibold">Nenhuma Torcida Vinculada</h2>
              <p className="text-sm text-muted-foreground">
                Você precisa criar ou vincular uma torcida para acessar as configurações.
              </p>
            </div>
          </div>

          <div className="flex gap-3">
            <Button asChild>
              <Link href="/gestor/configuracoes/criar">
                <Plus className="h-4 w-4 mr-2" />
                Criar Nova Torcida
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/gestor/perfil">
                Configurar Perfil
              </Link>
            </Button>
          </div>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Cabeçalho */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Configurações da Torcida</h1>
        <p className="text-muted-foreground mt-1">
          Personalize os dados e configurações do seu clube
        </p>
      </div>

      {/* Alertas */}
      {error && (
        <Card className="p-4 border-red-500/50 bg-red-500/10">
          <div className="flex items-start justify-between gap-4">
            <p className="text-red-400 text-sm flex-1">{error}</p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setError(null)
                loadTorcidaData()
              }}
              className="shrink-0"
            >
              Tentar Novamente
            </Button>
          </div>
        </Card>
      )}

      {success && (
        <Card className="p-4 border-green-500/50 bg-green-500/10">
          <p className="text-green-400 text-sm">{success}</p>
        </Card>
      )}

      {/* Tabs */}
      <div>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="w-full justify-start overflow-x-auto flex-nowrap mb-6">
            <TabsTrigger value="plano">Plano</TabsTrigger>
            <TabsTrigger value="informacoes">Informações</TabsTrigger>
            <TabsTrigger value="regras">Regras</TabsTrigger>
            <TabsTrigger value="visual">Visual</TabsTrigger>
            <TabsTrigger value="links">Links</TabsTrigger>
            <TabsTrigger value="funcoes">Funções</TabsTrigger>
            <TabsTrigger value="beneficios">Benefícios</TabsTrigger>
          </TabsList>

          <TabsContent value="plano">
            {torcidaData && (
              <TabPlano
                torcida={{
                  id: torcidaData.id,
                  slug: torcidaData.slug,
                  status: torcidaData.status,
                  plano: torcidaData.plano,
                }}
              />
            )}
          </TabsContent>

          <TabsContent value="informacoes">
            <TabInformacoes
              register={register}
              errors={errors}
              watch={watch}
              saving={saving}
              onSave={handleSave}
            />
          </TabsContent>

          <TabsContent value="regras">
            <TabRegras
              register={register}
              errors={errors}
              saving={saving}
              onSave={handleSave}
            />
          </TabsContent>

          <TabsContent value="visual">
            <TabVisual
              brasaoPreview={brasaoPreview}
              uploadingBrasao={uploadingBrasao}
              onBrasaoUpload={handleBrasaoUpload}
              corFundo={corFundo}
              setValue={setValue}
              errors={errors}
              saving={saving}
              onSave={handleSave}
            />
          </TabsContent>

          <TabsContent value="links">
            {torcidaId && <TabLinks torcidaId={torcidaId} isActive={activeTab === 'links'} />}
          </TabsContent>

          <TabsContent value="funcoes">
            {torcidaId && <TabFuncoes torcidaId={torcidaId} isActive={activeTab === 'funcoes'} />}
          </TabsContent>

          <TabsContent value="beneficios">
            {torcidaId && <TabBeneficios torcidaId={torcidaId} isActive={activeTab === 'beneficios'} />}
          </TabsContent>
        </Tabs>
      </div>

      {/* Botão flutuante de sugestões */}
      {torcidaId && <FloatingFeedbackButton torcidaId={torcidaId} />}
    </div>
  )
}

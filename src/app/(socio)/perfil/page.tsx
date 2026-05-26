'use client'

import { useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useAuth } from '@/hooks/use-auth'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Textarea } from '@/components/ui/textarea'
import { SignatureCanvasPad } from '@/components/shared/signature-canvas'
import {
  User,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Save,
  Loader2,
  Camera,
  CheckCircle,
  AlertCircle,
  Zap,
  MessageCircle,
  Briefcase,
  Heart,
  FileText,
  Upload,
} from 'lucide-react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { toast } from 'react-hot-toast'
import { TorpixModal } from '@/components/socio/torpix-modal'
import { PatrocinadorPopup } from '@/components/socio/patrocinador-popup'

// Schema de validação
const perfilSchema = z.object({
  nome_completo: z.string().min(3, 'Nome deve ter pelo menos 3 caracteres'),
  email: z.string().email('Email inválido'),
  whatsapp: z.string().min(10, 'WhatsApp inválido'),
  endereco_completo: z.string().optional(),
  bairro: z.string().optional(),
  cidade: z.string().optional(),
  estado: z.string().optional(),
  cep: z.string().optional(),
})

type PerfilFormData = z.infer<typeof perfilSchema>

interface PagamentoAtual {
  id: string
  valor_original: number
  referencia_mes: string
}

// Tipo para perfil
interface PerfilData {
  id: string
  nome_completo: string
  email: string
  cpf: string
  whatsapp: string
  data_nascimento: string
  endereco_completo: string
  bairro: string
  cidade: string
  estado: string
  cep: string
  status: 'ativo' | 'pendente' | 'inadimplente' | 'bloqueado' | 'cancelado'
  data_cadastro: string
  codigo_referencia: string
  foto_url: string | null
  torcida_id: string | null
  profissao: string | null
  alergias: string | null
  usa_medicacao: boolean
  descricao_necessidades: string | null
  medicacao_detalhes: string | null
  necessidades_especiais: boolean
  assinatura_url: string | null
  comprovante_endereco_url: string | null
  doc_identificacao_url: string | null
}

export default function PerfilPage() {
  const { socioData, isDependente, loading: authLoading } = useAuth()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploadingFoto, setUploadingFoto] = useState(false)
  const [perfil, setPerfil] = useState<PerfilData | null>(null)
  const [pagamentoAtual, setPagamentoAtual] = useState<PagamentoAtual | null>(null)
  const [chavePix, setChavePix] = useState<string | null>(null)
  const [whatsappGrupo, setWhatsappGrupo] = useState<string | null>(null)
  const [torpixOpen, setTorpixOpen] = useState(false)
  const [dependentesPendentes, setDependentesPendentes] = useState<{ count: number; totalValor: number } | null>(null)
  const [numeroAssociado, setNumeroAssociado] = useState<string | null>(null)

  const [saudeForm, setSaudeForm] = useState({
    profissao: '',
    alergias: '',
    usa_medicacao: false,
    necessidades_especiais: false,
    descricao_necessidades: '',
    medicacao_detalhes: '',
  })
  const [savingSaude, setSavingSaude] = useState(false)
  const [uploadingDoc, setUploadingDoc] = useState<string | null>(null)

  const fileInputRef = useRef<HTMLInputElement>(null)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isDirty },
  } = useForm<PerfilFormData>({
    resolver: zodResolver(perfilSchema),
  })

  useEffect(() => {
    if (authLoading) return

    const controller = new AbortController()
    const { signal } = controller
    const timeoutId = setTimeout(() => controller.abort(), 30000)

    async function fetchPerfil(signal: AbortSignal) {
      setLoading(true)
      try {
        // Dependentes buscam do endpoint dedicado para obter N° de Associado correto
        if (isDependente) {
          const [depRes, socioRes] = await Promise.all([
            fetch('/api/dependente/perfil', { signal }),
            fetch('/api/socio/perfil', { signal }),
          ])
          if (signal.aborted) return

          let pixFromDep: string | null = null
          let wppFromDep: string | null = null

          if (depRes.ok) {
            const depData = await depRes.json()
            if (signal.aborted) return
            if (depData.numeroAssociado) setNumeroAssociado(depData.numeroAssociado)
            if (depData.whatsappGrupo) { wppFromDep = depData.whatsappGrupo; setWhatsappGrupo(depData.whatsappGrupo) }
            if (depData.chavePix) { pixFromDep = depData.chavePix; setChavePix(depData.chavePix) }
          }

          // Menor auto-cadastrado tem registro em socios com dados de perfil editável
          if (socioRes.ok) {
            const { socio: data, chavePix: pix, whatsappGrupo: wpp } = await socioRes.json()
            if (signal.aborted) return
            if (data) {
              const whatsappLimpo = (data.whatsapp || '').split('@')[0]
              setPerfil({
                id: data.id,
                nome_completo: data.nome_completo,
                email: data.email,
                cpf: data.cpf,
                whatsapp: whatsappLimpo,
                data_nascimento: data.data_nascimento,
                endereco_completo: data.endereco_completo || '',
                bairro: data.bairro || '',
                cidade: data.cidade || '',
                estado: data.estado || '',
                cep: data.cep || '',
                status: data.status as 'ativo',
                data_cadastro: data.data_cadastro || '',
                codigo_referencia: data.codigo_referencia || '',
                foto_url: data.selfie_url,
                torcida_id: data.torcida_id || null,
                profissao: data.profissao || null,
                alergias: data.alergias || null,
                usa_medicacao: data.usa_medicacao || false,
                descricao_necessidades: data.descricao_necessidades || null,
                medicacao_detalhes: data.medicacao_detalhes || null,
                necessidades_especiais: data.necessidades_especiais || false,
                assinatura_url: data.assinatura_url || null,
                comprovante_endereco_url: data.comprovante_endereco_url || null,
                doc_identificacao_url: data.doc_identificacao_url || null,
              })
              setSaudeForm({
                profissao: data.profissao || '',
                alergias: data.alergias || '',
                usa_medicacao: data.usa_medicacao || false,
                necessidades_especiais: data.necessidades_especiais || false,
                descricao_necessidades: data.descricao_necessidades || '',
                medicacao_detalhes: data.medicacao_detalhes || '',
              })
              if (!pixFromDep && pix) setChavePix(pix)
              if (!wppFromDep && wpp) setWhatsappGrupo(wpp)
              reset({
                nome_completo: data.nome_completo || '',
                email: data.email || '',
                whatsapp: whatsappLimpo,
                endereco_completo: data.endereco_completo || '',
                bairro: data.bairro || '',
                cidade: data.cidade || '',
                estado: data.estado || '',
                cep: data.cep || '',
              })
            }
          }
          return
        }

        // Sócio titular
        const res = await fetch('/api/socio/perfil', { signal })
        if (signal.aborted) return
        if (!res.ok) throw new Error('Erro ao carregar perfil')
        const { socio: data, chavePix: pix, whatsappGrupo: wpp, pagamentoAtual: pag, dependentesPendentes: depPend } = await res.json()
        if (signal.aborted) return

        if (data) {
          const whatsappLimpo = (data.whatsapp || '').split('@')[0]
          const perfilData: PerfilData = {
            id: data.id,
            nome_completo: data.nome_completo,
            email: data.email,
            cpf: data.cpf,
            whatsapp: whatsappLimpo,
            data_nascimento: data.data_nascimento,
            endereco_completo: data.endereco_completo || '',
            bairro: data.bairro || '',
            cidade: data.cidade || '',
            estado: data.estado || '',
            cep: data.cep || '',
            status: data.status as 'ativo',
            data_cadastro: data.data_cadastro || '',
            codigo_referencia: data.codigo_referencia || '',
            foto_url: data.selfie_url,
            torcida_id: data.torcida_id || null,
            profissao: data.profissao || null,
            alergias: data.alergias || null,
            usa_medicacao: data.usa_medicacao || false,
            descricao_necessidades: data.descricao_necessidades || null,
            medicacao_detalhes: data.medicacao_detalhes || null,
            necessidades_especiais: data.necessidades_especiais || false,
            assinatura_url: data.assinatura_url || null,
            comprovante_endereco_url: data.comprovante_endereco_url || null,
            doc_identificacao_url: data.doc_identificacao_url || null,
          }
          setPerfil(perfilData)
          setSaudeForm({
            profissao: data.profissao || '',
            alergias: data.alergias || '',
            usa_medicacao: data.usa_medicacao || false,
            necessidades_especiais: data.necessidades_especiais || false,
            descricao_necessidades: data.descricao_necessidades || '',
            medicacao_detalhes: data.medicacao_detalhes || '',
          })
          if (pix) setChavePix(pix)
          if (wpp) setWhatsappGrupo(wpp)
          if (pag) setPagamentoAtual(pag as PagamentoAtual)
          if (depPend) setDependentesPendentes(depPend)
          reset({
            nome_completo: data.nome_completo || '',
            email: data.email || '',
            whatsapp: whatsappLimpo,
            endereco_completo: data.endereco_completo || '',
            bairro: data.bairro || '',
            cidade: data.cidade || '',
            estado: data.estado || '',
            cep: data.cep || '',
          })
        }
      } catch (error) {
        if (error instanceof Error && error.name === 'AbortError') return
        console.error('Erro ao carregar perfil:', error)
        toast.error('Erro ao carregar dados do perfil')
      } finally {
        if (!signal.aborted) setLoading(false)
      }
    }

    fetchPerfil(signal)

    return () => {
      controller.abort()
      clearTimeout(timeoutId)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authLoading])

  async function onSubmit(data: PerfilFormData) {
    setSaving(true)
    try {
      const res = await fetch('/api/socio/perfil', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nome_completo: data.nome_completo,
          whatsapp: data.whatsapp,
          endereco_completo: data.endereco_completo,
          bairro: data.bairro,
          cidade: data.cidade,
          estado: data.estado,
          cep: data.cep,
        }),
      })
      if (!res.ok) throw new Error('Erro ao atualizar perfil')
      toast.success('Perfil atualizado com sucesso!')
    } catch (error) {
      console.error('Erro ao atualizar perfil:', error)
      toast.error('Erro ao atualizar perfil')
    } finally {
      setSaving(false)
    }
  }

  async function handleFotoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file || !socioData?.id) return

    setUploadingFoto(true)
    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('bucket', 'selfies')
      formData.append('folder', socioData.id)

      const uploadRes = await fetch('/api/upload', { method: 'POST', body: formData })
      const uploadData = await uploadRes.json()
      if (!uploadRes.ok) throw new Error(uploadData.error || 'Erro ao fazer upload')

      const patchRes = await fetch('/api/socio/perfil', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ selfie_url: uploadData.url }),
      })
      if (!patchRes.ok) throw new Error('Erro ao atualizar foto')

      setPerfil((prev) => (prev ? { ...prev, foto_url: uploadData.url } : prev))
      toast.success('Foto atualizada com sucesso!')
    } catch (error) {
      console.error('Erro ao atualizar foto:', error)
      toast.error(error instanceof Error ? error.message : 'Erro ao atualizar foto')
    } finally {
      setUploadingFoto(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  async function handleSaudeSubmit() {
    setSavingSaude(true)
    try {
      const res = await fetch('/api/socio/perfil', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          profissao: saudeForm.profissao || null,
          alergias: saudeForm.alergias || null,
          usa_medicacao: saudeForm.usa_medicacao,
          necessidades_especiais: saudeForm.necessidades_especiais,
          descricao_necessidades: saudeForm.descricao_necessidades || null,
          medicacao_detalhes: saudeForm.medicacao_detalhes || null,
        }),
      })
      if (!res.ok) throw new Error('Erro ao atualizar informações')
      toast.success('Informações atualizadas com sucesso!')
    } catch (error) {
      console.error('Erro ao atualizar informações:', error)
      toast.error('Erro ao atualizar informações')
    } finally {
      setSavingSaude(false)
    }
  }

  async function handleDocUpload(field: 'comprovante_endereco_url' | 'doc_identificacao_url', file: File) {
    if (!socioData?.id) return
    setUploadingDoc(field)
    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('bucket', 'documentos-socios')
      formData.append('folder', socioData.id)

      const uploadRes = await fetch('/api/upload', { method: 'POST', body: formData })
      const uploadData = await uploadRes.json()
      if (!uploadRes.ok) throw new Error(uploadData.error || 'Erro ao fazer upload')

      const patchRes = await fetch('/api/socio/perfil', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ [field]: uploadData.url }),
      })
      if (!patchRes.ok) throw new Error('Erro ao atualizar documento')

      setPerfil((prev) => (prev ? { ...prev, [field]: uploadData.url } : prev))
      toast.success('Documento atualizado com sucesso!')
    } catch (error) {
      console.error('Erro ao atualizar documento:', error)
      toast.error(error instanceof Error ? error.message : 'Erro ao atualizar documento')
    } finally {
      setUploadingDoc(null)
    }
  }

  async function handleAssinaturaUpload(url: string) {
    try {
      const res = await fetch('/api/socio/perfil', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ assinatura_url: url }),
      })
      if (!res.ok) throw new Error('Erro ao salvar assinatura')
      setPerfil((prev) => (prev ? { ...prev, assinatura_url: url } : prev))
      toast.success('Assinatura atualizada com sucesso!')
    } catch (error) {
      console.error('Erro ao salvar assinatura:', error)
      toast.error('Erro ao salvar assinatura')
    }
  }

  // Formatadores
  function formatarCPF(cpf: string) {
    if (!cpf) return '-'
    const numeros = cpf.replace(/\D/g, '')
    return numeros.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4')
  }

  const isLoading = authLoading || loading

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-48" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Skeleton className="h-64" />
          <Skeleton className="h-96 lg:col-span-2" />
        </div>
      </div>
    )
  }

  if (!perfil) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Card className="p-8 text-center">
          <User className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-xl font-bold mb-2">Perfil não encontrado</h2>
          <p className="text-muted-foreground">
            Não foi possível carregar seus dados. Tente novamente.
          </p>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <User className="h-6 w-6 text-blue-500" />
          Meu Perfil
        </h1>
        <p className="text-sm text-muted-foreground">
          Visualize e atualize suas informações pessoais
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Card de Resumo */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col items-center text-center">
              {/* Avatar */}
              <div className="relative mb-4">
                {perfil.foto_url ? (
                  <Image
                    src={perfil.foto_url}
                    alt="Foto de perfil"
                    className="h-24 w-24 rounded-full object-cover"
                    width={96}
                    height={96}
                  />
                ) : (
                  <div className="h-24 w-24 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center">
                    <span className="text-3xl font-bold text-white">
                      {perfil.nome_completo.charAt(0).toUpperCase()}
                    </span>
                  </div>
                )}
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadingFoto}
                  className="absolute bottom-0 right-0 h-8 w-8 rounded-full bg-background border-2 border-border flex items-center justify-center hover:bg-muted transition-colors disabled:opacity-50"
                >
                  {uploadingFoto ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Camera className="h-4 w-4" />
                  )}
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleFotoUpload}
                />
              </div>

              <h2 className="text-lg font-semibold">{perfil.nome_completo}</h2>
              <p className="text-sm text-muted-foreground mb-3">{perfil.email}</p>

              <Badge
                variant={perfil.status === 'ativo' ? 'default' : 'destructive'}
                className="mb-4"
              >
                {perfil.status === 'ativo' ? 'Sócio Ativo' : perfil.status}
              </Badge>

              <div className="w-full space-y-3 text-sm">
                <div className="flex items-center justify-between py-2 border-b">
                  <span className="text-muted-foreground">CPF</span>
                  <span className="font-mono">{formatarCPF(perfil.cpf)}</span>
                </div>
                <div className="flex items-center justify-between py-2 border-b">
                  <span className="text-muted-foreground">N° de Associado</span>
                  <span className="font-mono text-primary">
                    {isDependente
                      ? (numeroAssociado || perfil.codigo_referencia || '-')
                      : (perfil.codigo_referencia || '-')}
                  </span>
                </div>
                <div className="flex items-center justify-between py-2">
                  <span className="text-muted-foreground">Desde</span>
                  <span>
                    {perfil.data_cadastro
                      ? format(new Date(perfil.data_cadastro), "MMM 'de' yyyy", { locale: ptBR })
                      : '-'}
                  </span>
                </div>
              </div>

              {/* Alerta de pendências de dependentes — apenas para titular */}
              {!isDependente && dependentesPendentes && dependentesPendentes.count > 0 && (
                <div className="w-full mt-4 rounded-lg overflow-hidden border border-orange-200">
                  <div className="bg-gradient-to-r from-orange-500 to-amber-400 p-3 flex items-center gap-2">
                    <div className="h-8 w-8 rounded-full bg-white/20 flex items-center justify-center shrink-0">
                      <AlertCircle className="h-4 w-4 text-white" />
                    </div>
                    <div className="flex-1">
                      <p className="text-white font-bold leading-none">Dependentes</p>
                      <p className="text-orange-100 text-xs mt-0.5">Mensalidade pendente</p>
                    </div>
                  </div>
                  <div className="p-3 text-center bg-background">
                    <p className="text-sm text-muted-foreground mb-1">
                      {dependentesPendentes.count} dependente{dependentesPendentes.count > 1 ? 's' : ''} com mensalidade em aberto
                    </p>
                    <a
                      href="/mensalidade"
                      className="text-xs font-medium text-orange-600 hover:underline"
                    >
                      Ver em Mensalidades →
                    </a>
                  </div>
                </div>
              )}

              {/* Banner TorPIX — exibido quando há mensalidade pendente (apenas titular) */}
              {!isDependente && pagamentoAtual && chavePix && (
                <div className="w-full mt-4 rounded-lg overflow-hidden border">
                  <div className="bg-gradient-to-r from-green-600 to-emerald-500 p-3 flex items-center gap-2">
                    <div className="h-8 w-8 rounded-full bg-white/20 flex items-center justify-center shrink-0">
                      <Zap className="h-4 w-4 text-white" />
                    </div>
                    <div className="flex-1">
                      <p className="text-white font-bold leading-none">TorPIX</p>
                      <p className="text-green-100 text-xs mt-0.5">Mensalidade pendente</p>
                    </div>
                  </div>
                  <div className="p-3 flex flex-col items-center gap-2 text-center bg-background">
                    <p className="text-sm text-muted-foreground">
                      Pague sua mensalidade via PIX
                    </p>
                    <button
                      type="button"
                      onClick={() => setTorpixOpen(true)}
                      className="w-full flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white text-sm font-medium py-2 px-3 rounded-md transition-colors"
                    >
                      <Zap className="h-4 w-4" />
                      Pagar com TorPIX
                    </button>
                  </div>
                </div>
              )}

              {/* Banner WhatsApp — link para o grupo da torcida */}
              {whatsappGrupo && (
                <div className="w-full mt-4 rounded-lg overflow-hidden border">
                  <div className="bg-gradient-to-r from-[#25D366] to-[#128C7E] p-3 flex items-center gap-2">
                    <div className="h-8 w-8 rounded-full bg-white/20 flex items-center justify-center shrink-0">
                      <MessageCircle className="h-4 w-4 text-white" />
                    </div>
                    <div className="flex-1">
                      <p className="text-white font-bold leading-none">WhatsApp</p>
                      <p className="text-green-100 text-xs mt-0.5">Grupo da Torcida</p>
                    </div>
                  </div>
                  <div className="p-3 flex flex-col items-center gap-2 text-center bg-background">
                    <p className="text-sm text-muted-foreground">
                      Fique por dentro de tudo que acontece
                    </p>
                    <a
                      href={whatsappGrupo}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full flex items-center justify-center gap-2 bg-[#25D366] hover:bg-[#1ebe5c] text-white text-sm font-medium py-2 px-3 rounded-md transition-colors"
                    >
                      <MessageCircle className="h-4 w-4" />
                      Entrar no Grupo
                    </a>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Formulário de Edição */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Informações Pessoais</CardTitle>
            <CardDescription>
              Atualize seus dados nas abas abaixo: contato, endereço, profissão e documentos (comprovante de endereço e assinatura)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="contato" className="w-full">
              <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4 h-auto">
                <TabsTrigger value="contato" className="text-xs sm:text-sm">Contato</TabsTrigger>
                <TabsTrigger value="endereco" className="text-xs sm:text-sm">Endereço</TabsTrigger>
                <TabsTrigger value="saude" className="flex items-center gap-1 text-xs sm:text-sm">
                  <Briefcase className="h-3.5 w-3.5 shrink-0" />
                  Profissão
                </TabsTrigger>
                <TabsTrigger value="documentos" className="flex items-center gap-1 text-xs sm:text-sm">
                  <FileText className="h-3.5 w-3.5 shrink-0" />
                  Documentos
                </TabsTrigger>
              </TabsList>

              <form onSubmit={handleSubmit(onSubmit)}>
                <TabsContent value="contato" className="space-y-4 mt-4">
                  {/* Nome Completo */}
                  <div className="space-y-2">
                    <Label htmlFor="nome_completo">Nome Completo</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="nome_completo"
                        {...register('nome_completo')}
                        className="pl-10"
                        placeholder="Seu nome completo"
                      />
                    </div>
                    {errors.nome_completo && (
                      <p className="text-sm text-red-500">{errors.nome_completo.message}</p>
                    )}
                  </div>

                  {/* Email (readonly) */}
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="email"
                        {...register('email')}
                        className="pl-10 bg-muted"
                        readOnly
                      />
                    </div>
                    <p className="text-xs text-muted-foreground">
                      O email não pode ser alterado. Entre em contato com a administração.
                    </p>
                  </div>

                  {/* WhatsApp */}
                  <div className="space-y-2">
                    <Label htmlFor="whatsapp">WhatsApp</Label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="whatsapp"
                        {...register('whatsapp')}
                        className="pl-10"
                        placeholder="(00) 00000-0000"
                      />
                    </div>
                    {errors.whatsapp && (
                      <p className="text-sm text-red-500">{errors.whatsapp.message}</p>
                    )}
                  </div>

                  {/* Data de Nascimento (readonly) */}
                  <div className="space-y-2">
                    <Label>Data de Nascimento</Label>
                    <div className="relative">
                      <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        value={
                          perfil.data_nascimento
                            ? format(new Date(perfil.data_nascimento), 'dd/MM/yyyy')
                            : ''
                        }
                        className="pl-10 bg-muted"
                        readOnly
                      />
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="endereco" className="space-y-4 mt-4">
                  {/* CEP */}
                  <div className="space-y-2">
                    <Label htmlFor="cep">CEP</Label>
                    <Input
                      id="cep"
                      {...register('cep')}
                      placeholder="00000-000"
                      maxLength={9}
                    />
                  </div>

                  {/* Endereço */}
                  <div className="space-y-2">
                    <Label htmlFor="endereco_completo">Endereço</Label>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="endereco_completo"
                        {...register('endereco_completo')}
                        className="pl-10"
                        placeholder="Rua, número"
                      />
                    </div>
                  </div>

                  {/* Bairro */}
                  <div className="space-y-2">
                    <Label htmlFor="bairro">Bairro</Label>
                    <Input
                      id="bairro"
                      {...register('bairro')}
                      placeholder="Seu bairro"
                    />
                  </div>

                  {/* Cidade e Estado */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="cidade">Cidade</Label>
                      <Input
                        id="cidade"
                        {...register('cidade')}
                        placeholder="Sua cidade"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="estado">Estado</Label>
                      <Input
                        id="estado"
                        {...register('estado')}
                        placeholder="UF"
                        maxLength={2}
                      />
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="saude" className="space-y-4 mt-4">
                  {/* Profissão */}
                  <div className="space-y-2">
                    <Label htmlFor="profissao" className="flex items-center gap-1.5">
                      <Briefcase className="h-4 w-4 text-muted-foreground" />
                      Profissão
                    </Label>
                    <Input
                      id="profissao"
                      value={saudeForm.profissao}
                      onChange={(e) => setSaudeForm((p) => ({ ...p, profissao: e.target.value }))}
                      placeholder="Ex: Engenheiro, Professor..."
                    />
                  </div>

                  {/* Alergias */}
                  <div className="space-y-2">
                    <Label htmlFor="alergias" className="flex items-center gap-1.5">
                      <Heart className="h-4 w-4 text-muted-foreground" />
                      Alergias
                    </Label>
                    <div className="flex items-center gap-2 mb-2">
                      <input
                        type="checkbox"
                        id="tem_alergia"
                        checked={!!saudeForm.alergias}
                        onChange={(e) => setSaudeForm((p) => ({ ...p, alergias: e.target.checked ? p.alergias || '' : '' }))}
                        className="h-4 w-4"
                      />
                      <label htmlFor="tem_alergia" className="text-sm">Possui alergias</label>
                    </div>
                    {saudeForm.alergias !== '' && (
                      <Textarea
                        id="alergias"
                        value={saudeForm.alergias}
                        onChange={(e) => setSaudeForm((p) => ({ ...p, alergias: e.target.value }))}
                        placeholder="Descreva suas alergias..."
                        rows={2}
                      />
                    )}
                  </div>

                  {/* Necessidades Especiais */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="necessidades_especiais"
                        checked={saudeForm.necessidades_especiais}
                        onChange={(e) => setSaudeForm((p) => ({ ...p, necessidades_especiais: e.target.checked }))}
                        className="h-4 w-4"
                      />
                      <label htmlFor="necessidades_especiais" className="text-sm font-medium">Possui necessidades especiais</label>
                    </div>
                    {saudeForm.necessidades_especiais && (
                      <Textarea
                        value={saudeForm.descricao_necessidades}
                        onChange={(e) => setSaudeForm((p) => ({ ...p, descricao_necessidades: e.target.value }))}
                        placeholder="Descreva suas necessidades especiais..."
                        rows={2}
                      />
                    )}
                  </div>

                  {/* Medicação */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="usa_medicacao"
                        checked={saudeForm.usa_medicacao}
                        onChange={(e) => setSaudeForm((p) => ({ ...p, usa_medicacao: e.target.checked }))}
                        className="h-4 w-4"
                      />
                      <label htmlFor="usa_medicacao" className="text-sm font-medium">Usa medicação de uso contínuo</label>
                    </div>
                    {saudeForm.usa_medicacao && (
                      <Textarea
                        value={saudeForm.medicacao_detalhes}
                        onChange={(e) => setSaudeForm((p) => ({ ...p, medicacao_detalhes: e.target.value }))}
                        placeholder="Informe os medicamentos em uso..."
                        rows={2}
                      />
                    )}
                  </div>

                  <Button
                    type="button"
                    onClick={handleSaudeSubmit}
                    disabled={savingSaude}
                    className="w-full"
                  >
                    {savingSaude ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Salvando...
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4 mr-2" />
                        Salvar Profissão & Saúde
                      </>
                    )}
                  </Button>
                </TabsContent>

                <TabsContent value="documentos" className="space-y-5 mt-4">
                  <p className="text-xs text-muted-foreground">
                    Envie seus documentos para manter seu cadastro atualizado. Os arquivos substituem versões anteriores.
                  </p>

                  {/* Comprovante de Endereço */}
                  <div className="space-y-2">
                    <Label className="flex items-center gap-1.5">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      Comprovante de Endereço
                    </Label>
                    {perfil.comprovante_endereco_url && (
                      <a
                        href={perfil.comprovante_endereco_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-blue-500 hover:underline flex items-center gap-1"
                      >
                        <FileText className="h-3 w-3" />
                        Ver documento atual
                      </a>
                    )}
                    <label className="flex items-center gap-2 cursor-pointer border rounded-md px-3 py-2 hover:bg-muted/50 transition-colors text-sm">
                      {uploadingDoc === 'comprovante_endereco_url' ? (
                        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                      ) : (
                        <Upload className="h-4 w-4 text-muted-foreground" />
                      )}
                      {uploadingDoc === 'comprovante_endereco_url' ? 'Enviando...' : 'Selecionar arquivo'}
                      <input
                        type="file"
                        accept="image/*,.pdf"
                        className="hidden"
                        disabled={!!uploadingDoc}
                        onChange={(e) => {
                          const f = e.target.files?.[0]
                          if (f) handleDocUpload('comprovante_endereco_url', f)
                          e.target.value = ''
                        }}
                      />
                    </label>
                  </div>

                  {/* Documento de Identificação */}
                  <div className="space-y-2">
                    <Label className="flex items-center gap-1.5">
                      <FileText className="h-4 w-4 text-muted-foreground" />
                      Documento de Identificação (RG / CNH)
                    </Label>
                    {perfil.doc_identificacao_url && (
                      <a
                        href={perfil.doc_identificacao_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-blue-500 hover:underline flex items-center gap-1"
                      >
                        <FileText className="h-3 w-3" />
                        Ver documento atual
                      </a>
                    )}
                    <label className="flex items-center gap-2 cursor-pointer border rounded-md px-3 py-2 hover:bg-muted/50 transition-colors text-sm">
                      {uploadingDoc === 'doc_identificacao_url' ? (
                        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                      ) : (
                        <Upload className="h-4 w-4 text-muted-foreground" />
                      )}
                      {uploadingDoc === 'doc_identificacao_url' ? 'Enviando...' : 'Selecionar arquivo'}
                      <input
                        type="file"
                        accept="image/*,.pdf"
                        className="hidden"
                        disabled={!!uploadingDoc}
                        onChange={(e) => {
                          const f = e.target.files?.[0]
                          if (f) handleDocUpload('doc_identificacao_url', f)
                          e.target.value = ''
                        }}
                      />
                    </label>
                  </div>

                  {/* Assinatura Digital */}
                  <div className="space-y-2">
                    <SignatureCanvasPad
                      label="Assinatura Digital"
                      valor={perfil.assinatura_url || undefined}
                      onSave={handleAssinaturaUpload}
                    />
                  </div>
                </TabsContent>

                {/* Botão Salvar — apenas para abas Contato e Endereço */}
                <div className="mt-6">
                  <Button type="submit" disabled={saving || !isDirty} className="w-full">
                    {saving ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Salvando...
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4 mr-2" />
                        Salvar Alterações
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </Tabs>
          </CardContent>
        </Card>
      </div>

      {/* Banner de Propaganda */}
      {perfil.torcida_id && (
        <PatrocinadorPopup torcidaId={perfil.torcida_id} />
      )}

      {/* TorPIX Modal */}
      {pagamentoAtual && (
        <TorpixModal
          open={torpixOpen}
          onOpenChange={setTorpixOpen}
          pagamentoId={pagamentoAtual.id}
          valor={pagamentoAtual.valor_original}
          chavePix={chavePix}
          tipo="mensalidade"
          descricao={`Mensalidade ${new Date(pagamentoAtual.referencia_mes).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}`}
          onComprovanteEnviado={() => {
            setPagamentoAtual(null)
            toast.success('Comprovante enviado! Aguarde a confirmação do gestor.')
          }}
        />
      )}

      {/* Info Cadastral */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="p-4">
          <div className="flex items-start gap-3">
            <CheckCircle className="h-5 w-5 text-green-500 shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-sm">Documento Oficial</p>
              <p className="text-xs text-muted-foreground">
                Esta ficha cadastral e seu documento oficial de socio-torcedor,
                valida para apresentacao em estadios e eventos.
              </p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-blue-500 shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-sm">Uso para Orgaos Publicos</p>
              <p className="text-xs text-muted-foreground">
                Este documento pode ser solicitado pela Policia Militar e outros
                orgaos para controle de torcidas organizadas.
              </p>
            </div>
          </div>
        </Card>
      </div>

    </div>
  )
}

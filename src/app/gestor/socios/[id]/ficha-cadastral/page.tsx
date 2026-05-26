'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import Link from 'next/link'
import {
  FileText,
  Download,
  Shield,
  Calendar,
  CheckCircle,
  AlertCircle,
  User,
  MapPin,
  Phone,
  Mail,
  Users,
  ArrowLeft,
} from 'lucide-react'
import { format } from 'date-fns'
import { toast } from 'react-hot-toast'
import { generateFichaCadastralPDF, generatePDFFilename } from '@/lib/services/pdf-service'
import type { SocioDataForPDF, TorcidaDataForPDF } from '@/lib/services/pdf-service'

// Tipos para ficha cadastral
interface FichaSocio {
  id: string
  nome_completo: string
  apelido?: string | null
  cpf: string
  rg?: string | null
  data_nascimento: string | null
  genero?: string | null
  escolaridade?: string | null
  profissao?: string | null
  nome_mae?: string | null
  nome_pai?: string | null
  endereco_completo?: string | null
  numero?: string | null
  complemento?: string | null
  bairro?: string | null
  cidade?: string | null
  estado?: string | null
  cep?: string | null
  email: string
  whatsapp?: string | null
  status: 'ativo' | 'pendente' | 'inadimplente' | 'bloqueado' | 'cancelado'
  data_cadastro: string | null
  data_aprovacao?: string | null
  codigo_referencia: string | null
  selfie_url?: string | null
  tipo_mensalidade?: {
    nome: string
  } | null
}

interface FichaTorcida {
  nome: string
  brasao_url: string | null
}

// Mapeamento de escolaridade
const ESCOLARIDADE_LABELS: Record<string, string> = {
  fundamental_incompleto: 'Fundamental Incompleto',
  fundamental_completo: 'Fundamental Completo',
  medio_incompleto: 'Medio Incompleto',
  medio_completo: 'Medio Completo',
  superior_incompleto: 'Superior Incompleto',
  superior_completo: 'Superior Completo',
  pos_graduacao: 'Pos-Graduacao',
  mestrado: 'Mestrado',
  doutorado: 'Doutorado',
}

// Mapeamento de genero
const GENERO_LABELS: Record<string, string> = {
  masculino: 'Masculino',
  feminino: 'Feminino',
  outro: 'Outro',
  prefiro_nao_informar: 'Nao informado',
}

interface PageProps {
  params: Promise<{ id: string }>
}

export default function GestorFichaCadastralPage({ params }: PageProps) {
  const [loading, setLoading] = useState(true)
  const [socio, setSocio] = useState<FichaSocio | null>(null)
  const [torcida, setTorcida] = useState<FichaTorcida | null>(null)
  const [rawSocioData, setRawSocioData] = useState<Record<string, unknown> | null>(null)
  const [rawTorcidaData, setRawTorcidaData] = useState<Record<string, unknown> | null>(null)
  const [id, setId] = useState<string>('')
  const [signedSelfieUrl, setSignedSelfieUrl] = useState<string | null>(null)

  useEffect(() => {
    params.then(p => {
      setId(p.id)
      loadFicha(p.id)
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function loadFicha(socioId: string) {
    try {
      setLoading(true)
      const res = await fetch(`/api/socios/${socioId}`)
      if (!res.ok) throw new Error('Erro ao carregar ficha')
      const { socio: socioData, torcida: torcidaData } = await res.json()

      if (!socioData) throw new Error('Sócio não encontrado')

      setRawSocioData(socioData as Record<string, unknown>)
      setRawTorcidaData(torcidaData as Record<string, unknown>)
      setSocio({
        ...socioData,
        tipo_mensalidade: socioData.tipo_mensalidade ?? null,
      } as FichaSocio)
      setTorcida(torcidaData as FichaTorcida)

      // Gerar signed URL para selfie via API server-side (admin bypassa RLS)
      if (socioData?.selfie_url) {
        try {
          const res = await fetch('/api/storage/signed-url', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ url: socioData.selfie_url }),
          })
          if (res.ok) {
            const { signedUrl } = await res.json()
            if (signedUrl) setSignedSelfieUrl(signedUrl)
          }
        } catch {
          // Signed URL não disponível, usar URL original
        }
      }
    } catch (error) {
      console.error('Erro ao carregar ficha:', error)
      toast.error('Erro ao carregar ficha cadastral')
    } finally {
      setLoading(false)
    }
  }

  function formatarCPF(cpf: string) {
    if (!cpf) return '-'
    const numeros = cpf.replace(/\D/g, '')
    if (numeros.length !== 11) return cpf
    return `${numeros.slice(0, 3)}.${numeros.slice(3, 6)}.${numeros.slice(6, 9)}-${numeros.slice(9)}`
  }

  function formatarTelefone(telefone: string | null | undefined) {
    if (!telefone) return '-'
    const numeros = telefone.replace(/\D/g, '')
    if (numeros.length === 11) {
      return `(${numeros.slice(0, 2)}) ${numeros.slice(2, 7)}-${numeros.slice(7)}`
    }
    if (numeros.length === 10) {
      return `(${numeros.slice(0, 2)}) ${numeros.slice(2, 6)}-${numeros.slice(6)}`
    }
    return telefone
  }

  function formatarCEP(cep: string | null | undefined) {
    if (!cep) return '-'
    const numeros = cep.replace(/\D/g, '')
    if (numeros.length === 8) {
      return `${numeros.slice(0, 5)}-${numeros.slice(5)}`
    }
    return cep
  }

  function formatarDataSegura(dataString: string | null | undefined, eDataNascimento = false) {
    if (!dataString) return '-'
    
    try {
      let dataParaFormatar = dataString
      
      if (eDataNascimento && dataString.length === 10) {
        dataParaFormatar = `${dataString}T12:00:00`
      }
      
      return format(new Date(dataParaFormatar), 'dd/MM/yyyy')
    } catch /* (  error ) */ { // Adicione o underline aqui
      return '-'
    }
  }

  async function getSignedUrl(originalUrl: string | null): Promise<string | null> {
    if (!originalUrl) return null
    try {
      const res = await fetch('/api/storage/signed-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: originalUrl }),
      })
      if (res.ok) {
        const { signedUrl } = await res.json()
        return signedUrl || originalUrl
      }
    } catch { /* fallback */ }
    return originalUrl
  }

  async function handleDownload() {
    if (!rawSocioData || !rawTorcidaData) {
      toast.error('Dados nao carregados')
      return
    }

    try {
      toast.loading('Gerando PDF...', { id: 'pdf-download' })

      const raw = rawSocioData as Record<string, unknown>

      // Assinar todas as URLs de imagem em paralelo para evitar bloqueio por bucket privado
      const [selfieUrl, docFrenteUrl, docVersoUrl, comprovanteUrl, assinaturaUrl] =
        await Promise.all([
          getSignedUrl(raw.selfie_url as string | null),
          getSignedUrl(raw.doc_frente_url as string | null),
          getSignedUrl(raw.doc_verso_url as string | null),
          getSignedUrl(raw.comprovante_endereco_url as string | null),
          getSignedUrl(raw.assinatura_url as string | null),
        ])

      const socioForPDF: SocioDataForPDF = {
        ...(raw as unknown as SocioDataForPDF),
        data_membro: (raw.data_aprovacao as string | null) || null,
        selfie_url: selfieUrl,
        doc_frente_url: docFrenteUrl,
        doc_verso_url: docVersoUrl,
        comprovante_endereco_url: comprovanteUrl,
        assinatura_url: assinaturaUrl,
      }
      const torcidaForPDF = rawTorcidaData as unknown as TorcidaDataForPDF

      const blob = await generateFichaCadastralPDF(socioForPDF, torcidaForPDF)
      const filename = generatePDFFilename(socioForPDF)

      // Criar link de download
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = filename
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)

      toast.success('PDF baixado com sucesso!', { id: 'pdf-download' })
    } catch (error) {
      console.error('Erro ao gerar PDF:', error)
      toast.error('Erro ao gerar PDF', { id: 'pdf-download' })
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-96 max-w-4xl mx-auto" />
      </div>
    )
  }

  if (!socio || !torcida) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Card className="p-8 text-center">
          <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-xl font-bold mb-2">Ficha Cadastral nao encontrada</h2>
          <p className="text-muted-foreground mb-4">
            Nao foi possivel carregar a ficha cadastral deste socio.
          </p>
          <Button asChild>
            <Link href="/gestor/socios">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Voltar para Lista
            </Link>
          </Button>
        </Card>
      </div>
    )
  }

  const isAtivo = socio.status === 'ativo'

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href={`/gestor/socios/${id}`}>
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <FileText className="h-6 w-6 text-blue-500" />
              Ficha Cadastral
            </h1>
            <p className="text-sm text-muted-foreground">
              {socio.nome_completo}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button onClick={handleDownload} variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Baixar PDF
          </Button>
        </div>
      </div>

      {/* Ficha Cadastral */}
      <div className="max-w-4xl mx-auto print:max-w-full">
        <Card className="overflow-hidden">
          {/* Cabecalho da Ficha */}
          <div className="bg-[#FAB515] px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Shield className="h-8 w-8 text-[#252525]" />
                <div>
                  <p className="font-bold text-[#252525] text-lg">
                    {torcida.nome}
                  </p>
                  <p className="text-sm text-[#252525]/70">Ficha Cadastral de Socio-Torcedor</p>
                </div>
              </div>
              <Badge
                className={
                  isAtivo
                    ? 'bg-green-600 text-white'
                    : 'bg-red-600 text-white'
                }
              >
                {isAtivo ? 'ATIVO' : socio.status.toUpperCase()}
              </Badge>
            </div>
          </div>

          <CardContent className="p-6">
            {/* Foto e Dados Principais */}
            <div className="flex flex-col md:flex-row gap-6 mb-6">
              {/* Foto */}
              <div className="flex-shrink-0">
                <div className="h-32 w-32 rounded-lg bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center border-2 border-gray-300">
                  {socio.selfie_url ? (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img
                      src={signedSelfieUrl || socio.selfie_url}
                      alt="Foto do socio"
                      className="h-full w-full object-cover rounded-lg"
                    />
                  ) : (
                    <span className="text-5xl font-bold text-gray-500">
                      {socio.nome_completo.charAt(0).toUpperCase()}
                    </span>
                  )}
                </div>
                <p className="text-xs text-center text-muted-foreground mt-2">
                  Matricula: {socio.codigo_referencia || 'N/A'}
                </p>
              </div>

              {/* Dados Principais */}
              <div className="flex-1 space-y-4">
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider">Nome Completo</p>
                  <p className="text-lg font-semibold">{socio.nome_completo}</p>
                  {socio.apelido && (
                    <p className="text-sm text-muted-foreground">Apelido: {socio.apelido}</p>
                  )}
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wider">CPF</p>
                    <p className="font-mono text-sm">{formatarCPF(socio.cpf)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wider">RG</p>
                    <p className="font-mono text-sm">{socio.rg || '-'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wider">Data de Nascimento</p>
                    <p className="text-sm">
                        {formatarDataSegura(socio.data_nascimento, true)}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Secoes de Dados */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Dados Pessoais */}
              <div className="space-y-3">
                <h3 className="font-semibold flex items-center gap-2 border-b pb-2">
                  <User className="h-4 w-4" />
                  Dados Pessoais
                </h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Genero:</span>
                    <span>{GENERO_LABELS[socio.genero || ''] || '-'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Escolaridade:</span>
                    <span>{ESCOLARIDADE_LABELS[socio.escolaridade || ''] || '-'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Profissao:</span>
                    <span>{socio.profissao || '-'}</span>
                  </div>
                </div>
              </div>

              {/* Filiacao */}
              <div className="space-y-3">
                <h3 className="font-semibold flex items-center gap-2 border-b pb-2">
                  <Users className="h-4 w-4" />
                  Filiacao
                </h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Mae:</span>
                    <span>{socio.nome_mae || '-'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Pai:</span>
                    <span>{socio.nome_pai || '-'}</span>
                  </div>
                </div>
              </div>

              {/* Endereco */}
              <div className="space-y-3">
                <h3 className="font-semibold flex items-center gap-2 border-b pb-2">
                  <MapPin className="h-4 w-4" />
                  Endereco
                </h3>
                <div className="text-sm space-y-1">
                  <p>
                    {socio.endereco_completo || '-'}
                    {socio.numero && `, ${socio.numero}`}
                    {socio.complemento && ` - ${socio.complemento}`}
                  </p>
                  <p>
                    {socio.bairro || '-'}
                  </p>
                  <p>
                    {socio.cidade || '-'} - {socio.estado || '-'}
                  </p>
                  <p>CEP: {formatarCEP(socio.cep)}</p>
                </div>
              </div>

              {/* Contato */}
              <div className="space-y-3">
                <h3 className="font-semibold flex items-center gap-2 border-b pb-2">
                  <Phone className="h-4 w-4" />
                  Contato
                </h3>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <Phone className="h-3 w-3 text-muted-foreground" />
                    <span>{formatarTelefone(socio.whatsapp)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Mail className="h-3 w-3 text-muted-foreground" />
                    <span>{socio.email}</span>
                  </div>
                </div>
              </div>

              {/* Informacoes de Cadastro */}
              <div className="space-y-3 md:col-span-2">
                <h3 className="font-semibold flex items-center gap-2 border-b pb-2">
                  <Calendar className="h-4 w-4" />
                  Informacoes de Cadastro
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Data de Cadastro:</span>
                    <p className="font-medium">
                      {formatarDataSegura(socio.data_cadastro)}
                    </p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Data de Aprovacao:</span>
                    <p className="font-medium">
                      {formatarDataSegura(socio.data_aprovacao)}
                    </p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Tipo de Mensalidade:</span>
                    <p className="font-medium">{socio.tipo_mensalidade?.nome || 'Padrao'}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Status:</span>
                    <p className="font-medium capitalize">{socio.status}</p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>

          {/* Rodape */}
          <div className="bg-gray-100 dark:bg-gray-800 px-6 py-3 text-center">
            <p className="text-xs text-muted-foreground">
              Documento gerado para fins de identificacao junto a orgaos publicos e policiais.
              Gerado em: {format(new Date(), "dd/MM/yyyy 'as' HH:mm")}
            </p>
          </div>
        </Card>
      </div>

      {/* Info Cards - Ocultar na impressao */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-4xl mx-auto print:hidden">
        <Card className="p-4">
          <div className="flex items-start gap-3">
            <CheckCircle className="h-5 w-5 text-green-500 shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-sm">Documento Oficial</p>
              <p className="text-xs text-muted-foreground">
                Esta ficha cadastral e o documento oficial do socio-torcedor,
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

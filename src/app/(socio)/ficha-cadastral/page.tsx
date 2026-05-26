'use client'

import Image from 'next/image'
import { useEffect, useState } from 'react'
import { useAuth } from '@/hooks/use-auth'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import {
  FileText,
  Download,
  Share2,
  Shield,
  Calendar,
  User,
  MapPin,
  Phone,
  Mail,
  Users,
} from 'lucide-react'
import { format } from 'date-fns'
import { toast } from 'react-hot-toast'
import { generateFichaCadastralPDF, generatePDFFilename, type SocioDataForPDF, type TorcidaDataForPDF } from '@/lib/services/pdf-service'

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
  membro_desde?: string | null
  codigo_referencia: string | null
  funcao_torcida?: string | null
  e_menor?: boolean | null
  nome_responsavel?: string | null
  cpf_responsavel?: string | null
  selfie_url?: string | null
  doc_frente_url?: string | null
  doc_verso_url?: string | null
  comprovante_endereco_url?: string | null
  assinatura_url?: string | null
  termo_menoridade_url?: string | null
  tipo_mensalidade?: {
    nome: string
  } | null
}

interface FichaTorcida {
  nome: string
  brasao_url: string | null
  endereco_sede: string | null
  slug?: string | null
  presidente?: string | null
  vice_presidente?: string | null
}

interface FichaCadastralData {
  socio: FichaSocio
  torcida: FichaTorcida
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

export default function FichaCadastralPage() {
  const { loading: authLoading } = useAuth()
  const [loading, setLoading] = useState(true)
  const [ficha, setFicha] = useState<FichaCadastralData | null>(null)

  useEffect(() => {
    if (authLoading) return

    async function fetchFicha() {
      setLoading(true)
      try {
        const res = await fetch('/api/socio/ficha')
        if (!res.ok) throw new Error('Erro ao carregar ficha')
        const data = await res.json()
        if (data.socio && data.torcida) {
          setFicha({ socio: data.socio as FichaSocio, torcida: data.torcida as FichaTorcida })
        }
      } catch (error) {
        if (error instanceof Error && error.name === 'AbortError') return
        console.error('Erro ao carregar ficha cadastral:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchFicha()
  }, [authLoading])

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

  const [downloading, setDownloading] = useState(false)

  async function handleDownload() {
    if (!ficha) return

    setDownloading(true)
    const loadingToast = toast.loading('Gerando PDF...')

    try {
      // Preparar dados do sócio para o PDF
      const socioForPDF: SocioDataForPDF = {
        id: ficha.socio.id,
        codigo_referencia: ficha.socio.codigo_referencia,
        nome_completo: ficha.socio.nome_completo,
        apelido: ficha.socio.apelido || null,
        cpf: ficha.socio.cpf,
        numero_rg: ficha.socio.rg || null,
        data_nascimento: ficha.socio.data_nascimento || '',
        genero: ficha.socio.genero || null,
        estado_civil: null,
        profissao: ficha.socio.profissao || null,
        escolaridade: ficha.socio.escolaridade || null,
        nome_mae: ficha.socio.nome_mae || null,
        nome_pai: ficha.socio.nome_pai || null,
        email: ficha.socio.email,
        whatsapp: ficha.socio.whatsapp || '',
        endereco_completo: ficha.socio.endereco_completo || '',
        numero: ficha.socio.numero || '',
        complemento: ficha.socio.complemento || null,
        bairro: ficha.socio.bairro || '',
        cidade: ficha.socio.cidade || '',
        estado: ficha.socio.estado || '',
        cep: ficha.socio.cep || null,
        data_membro: ficha.socio.data_aprovacao || null,
        funcao_torcida: ficha.socio.funcao_torcida ?? null,
        e_menor: ficha.socio.e_menor ?? null,
        nome_responsavel: ficha.socio.nome_responsavel ?? null,
        cpf_responsavel: ficha.socio.cpf_responsavel ?? null,
        data_cadastro: ficha.socio.data_cadastro || '',
        doc_frente_url: null,
        doc_verso_url: null,
        comprovante_endereco_url: null,
        selfie_url: ficha.socio.selfie_url || null,
        assinatura_url: null,
        termo_menoridade_url: ficha.socio.termo_menoridade_url ?? null,
      }

      // Use doc URLs already loaded from /api/socio/ficha
      socioForPDF.doc_frente_url = ficha.socio.doc_frente_url ?? null
      socioForPDF.doc_verso_url = ficha.socio.doc_verso_url ?? null
      socioForPDF.comprovante_endereco_url = ficha.socio.comprovante_endereco_url ?? null
      socioForPDF.assinatura_url = ficha.socio.assinatura_url ?? null

      // Preparar dados da torcida — slug/presidente já incluídos na API
      const torcidaForPDF: TorcidaDataForPDF = {
        nome: ficha.torcida.nome,
        slug: ficha.torcida.slug ?? null,
        brasao_url: ficha.torcida.brasao_url,
        presidente: ficha.torcida.presidente ?? null,
        vice_presidente: ficha.torcida.vice_presidente ?? null,
      }

      // Gerar PDF
      const pdfBlob = await generateFichaCadastralPDF(socioForPDF, torcidaForPDF)
      const filename = generatePDFFilename(socioForPDF)

      // Fazer download
      const url = URL.createObjectURL(pdfBlob)
      const link = document.createElement('a')
      link.href = url
      link.download = filename
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)

      toast.dismiss(loadingToast)
      toast.success('PDF gerado com sucesso!')
    } catch (error) {
      console.error('Erro ao gerar PDF:', error)
      toast.dismiss(loadingToast)
      toast.error('Erro ao gerar PDF. Tente novamente.')
    } finally {
      setDownloading(false)
    }
  }

  function handleShare() {
    const shareText = `Ficha Cadastral - ${ficha?.torcida.nome}\nSocio: ${ficha?.socio.nome_completo}\nMatricula: ${ficha?.socio.codigo_referencia || 'N/A'}`

    if (navigator.share) {
      navigator.share({
        title: 'Ficha Cadastral',
        text: shareText,
      })
    } else {
      navigator.clipboard.writeText(shareText)
      toast.success('Informacoes copiadas para a area de transferencia')
    }
  }

  const isLoading = authLoading || loading

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-96 max-w-4xl mx-auto" />
      </div>
    )
  }

  if (!ficha) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Card className="p-8 text-center">
          <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-xl font-bold mb-2">Ficha Cadastral nao disponivel</h2>
          <p className="text-muted-foreground">
            Nao foi possivel carregar sua ficha cadastral. Tente novamente.
          </p>
        </Card>
      </div>
    )
  }

  const isAtivo = ficha.socio.status === 'ativo'

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <FileText className="h-6 w-6 text-blue-500" />
          Ficha Cadastral
        </h1>
        <p className="text-sm text-muted-foreground">
          Documento oficial de identificacao como socio-torcedor
        </p>
      </div>

      {/* Ficha Cadastral */}
      <div className="max-w-4xl mx-auto">
        <Card className="overflow-hidden">
          {/* Cabecalho da Ficha */}
          <div className="bg-[#FAB515] px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {ficha.torcida.brasao_url ? (
                  <Image src={ficha.torcida.brasao_url} alt="Brasão" width={48} height={48} className="object-contain" />
                ) : (
                  <Shield className="h-8 w-8 text-[#252525]" />
                )}
                <div>
                  <p className="font-bold text-[#252525] text-lg">
                    {ficha.torcida.nome}
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
                {isAtivo ? 'ATIVO' : ficha.socio.status.toUpperCase()}
              </Badge>
            </div>
          </div>

          <CardContent className="p-6">
            {/* Foto e Dados Principais */}
            <div className="flex flex-col md:flex-row gap-6 mb-6">
              {/* Foto */}
              <div className="flex-shrink-0">
                <div className="h-32 w-32 rounded-lg bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center border-2 border-gray-300">
                  {ficha.socio.selfie_url ? (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img
                      src={ficha.socio.selfie_url}
                      alt="Foto do socio"
                      className="h-full w-full object-cover rounded-lg"
                    />
                  ) : (
                    <span className="text-5xl font-bold text-gray-500">
                      {ficha.socio.nome_completo.charAt(0).toUpperCase()}
                    </span>
                  )}
                </div>
                <p className="text-xs text-center text-muted-foreground mt-2">
                  Matricula: {ficha.socio.codigo_referencia || 'N/A'}
                </p>
              </div>

              {/* Dados Principais */}
              <div className="flex-1 space-y-4">
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider">Nome Completo</p>
                  <p className="text-lg font-semibold">{ficha.socio.nome_completo}</p>
                  {ficha.socio.apelido && (
                    <p className="text-sm text-muted-foreground">Apelido: {ficha.socio.apelido}</p>
                  )}
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wider">CPF</p>
                    <p className="font-mono text-sm">{formatarCPF(ficha.socio.cpf)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wider">RG</p>
                    <p className="font-mono text-sm">{ficha.socio.rg || '-'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wider">Data de Nascimento</p>
                    <p className="text-sm">
                      {ficha.socio.data_nascimento
                        ? format(new Date(ficha.socio.data_nascimento), 'dd/MM/yyyy')
                        : '-'}
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
                    <span>{GENERO_LABELS[ficha.socio.genero || ''] || '-'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Escolaridade:</span>
                    <span>{ESCOLARIDADE_LABELS[ficha.socio.escolaridade || ''] || '-'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Profissao:</span>
                    <span>{ficha.socio.profissao || '-'}</span>
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
                    <span>{ficha.socio.nome_mae || '-'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Pai:</span>
                    <span>{ficha.socio.nome_pai || '-'}</span>
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
                    {ficha.socio.endereco_completo || '-'}
                    {ficha.socio.numero && `, ${ficha.socio.numero}`}
                    {ficha.socio.complemento && ` - ${ficha.socio.complemento}`}
                  </p>
                  <p>
                    {ficha.socio.bairro || '-'}
                  </p>
                  <p>
                    {ficha.socio.cidade || '-'} - {ficha.socio.estado || '-'}
                  </p>
                  <p>CEP: {formatarCEP(ficha.socio.cep)}</p>
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
                    <span>{formatarTelefone(ficha.socio.whatsapp)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Mail className="h-3 w-3 text-muted-foreground" />
                    <span>{ficha.socio.email}</span>
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
                      {ficha.socio.data_cadastro
                        ? format(new Date(ficha.socio.data_cadastro), 'dd/MM/yyyy')
                        : '-'}
                    </p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Data de Membro:</span>
                    <p className="font-medium">
                      {ficha.socio.data_aprovacao
                        ? format(new Date(ficha.socio.data_aprovacao), 'dd/MM/yyyy')
                        : '-'}
                    </p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Tipo de Mensalidade:</span>
                    <p className="font-medium">{ficha.socio.tipo_mensalidade?.nome || 'Padrao'}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Status:</span>
                    <p className="font-medium capitalize">{ficha.socio.status}</p>
                  </div>
                </div>
                {ficha.torcida.endereco_sede && (
                  <div className="mt-3">
                    <span className="text-muted-foreground text-sm">Sede da Torcida:</span>
                    <p className="font-medium text-sm flex items-center gap-1">
                      <MapPin className="h-3 w-3" />{ficha.torcida.endereco_sede}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </CardContent>

          {/* Rodape */}
          <div className="bg-gray-100 dark:bg-gray-800 px-6 py-3 text-center">
            <p className="text-xs text-muted-foreground">
              Documento gerado para fins de identificacao junto a orgaos publicos e policiais.
              Este documento deve ser apresentado junto com documento oficial com foto.
            </p>
          </div>
        </Card>

        {/* Acoes */}
        <div className="flex gap-3 mt-4">
          <Button onClick={handleDownload} variant="outline" className="flex-1" disabled={downloading}>
            {downloading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2" />
                Gerando...
              </>
            ) : (
              <>
                <Download className="h-4 w-4 mr-2" />
                Baixar PDF
              </>
            )}
          </Button>
          <Button onClick={handleShare} variant="outline" className="flex-1">
            <Share2 className="h-4 w-4 mr-2" />
            Compartilhar
          </Button>
        </div>
      </div>

    </div>
  )
}

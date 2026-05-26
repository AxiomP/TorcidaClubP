'use client'

import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { RankingBadge, type RankingType } from '@/components/ui/ranking-badge'
import Link from 'next/link'
import {
  ArrowLeft,
  Mail,
  Phone,
  Calendar,
  MapPin,
  FileText,
  Download,
  Ban,
  CheckCircle,
  MessageSquare,
  ClipboardList,
  Medal,
  Ticket,
  Heart,
  ChevronDown,
  ChevronUp,
} from 'lucide-react'
import { toast } from 'react-hot-toast'

type SocioStatus = 'pendente' | 'ativo' | 'cancelado' | 'inadimplente' | 'bloqueado' | 'rejeitado'

interface Socio {
  id: string
  nome_completo: string
  email: string
  cpf: string
  whatsapp: string | null
  data_nascimento: string
  endereco_completo: string | null
  numero: string | null
  complemento?: string | null
  bairro: string | null
  cidade: string | null
  estado: string | null
  cep: string | null
  status: SocioStatus
  ranking: RankingType
  data_cadastro: string | null
  data_aprovacao?: string | null
  codigo_referencia?: string | null
  selfie_url?: string | null
  alergias?: string | null
  usa_medicacao?: boolean
  medicacao_detalhes?: string | null
  necessidades_especiais?: boolean
  descricao_necessidades?: string | null
  funcao_torcida?: string | null
}

interface PageProps {
  params: Promise<{ id: string }>
}

export default function SocioDetalhesPage({ params }: PageProps) {
  const [socio, setSocio] = useState<Socio | null>(null)
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(false)
  const [id, setId] = useState<string>('')
  const [totalIngressos, setTotalIngressos] = useState<number>(0)
  const [showMedical, setShowMedical] = useState(false)
  const [funcaoInput, setFuncaoInput] = useState<string>('')

  useEffect(() => {
    params.then(p => {
      setId(p.id)
      loadSocio(p.id)
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function loadSocio(socioId: string) {
    try {
      setLoading(true)
      const res = await fetch(`/api/socios/${socioId}`)
      if (!res.ok) throw new Error('Erro ao carregar sócio')
      const { socio: data, totalIngressos: count } = await res.json()
      setSocio(data as Socio)
      setFuncaoInput((data as Socio).funcao_torcida || '')
      setTotalIngressos(count ?? 0)
    } catch (error) {
      console.error('Erro ao carregar sócio:', error)
      toast.error('Erro ao carregar dados do sócio')
    } finally {
      setLoading(false)
    }
  }

  async function patchSocio(payload: Record<string, unknown>) {
    const res = await fetch(`/api/socios/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    if (!res.ok) {
      const data = await res.json()
      throw new Error(data.error || 'Erro ao atualizar sócio')
    }
  }

  async function updateStatus(newStatus: SocioStatus) {
    if (!socio) return
    try {
      setUpdating(true)
      await patchSocio({ status: newStatus })
      setSocio({ ...socio, status: newStatus })
      toast.success(`Status atualizado para ${newStatus}`)
    } catch (error) {
      console.error('Erro ao atualizar status:', error)
      toast.error('Erro ao atualizar status')
    } finally {
      setUpdating(false)
    }
  }

  async function updateRanking(newRanking: RankingType) {
    if (!socio) return
    try {
      setUpdating(true)
      await patchSocio({ ranking: newRanking })
      setSocio({ ...socio, ranking: newRanking })
      const rankingLabels = { bronze: 'Bronze', prata: 'Prata', ouro: 'Ouro' }
      toast.success(`Ranking atualizado para ${rankingLabels[newRanking]}`)
    } catch (error) {
      console.error('Erro ao atualizar ranking:', error)
      toast.error('Erro ao atualizar ranking')
    } finally {
      setUpdating(false)
    }
  }

  async function updateFuncaoTorcida() {
    if (!socio) return
    try {
      setUpdating(true)
      await patchSocio({ funcao_torcida: funcaoInput || null })
      setSocio({ ...socio, funcao_torcida: funcaoInput || null })
      toast.success('Função atualizada com sucesso')
    } catch (error) {
      console.error('Erro ao atualizar função:', error)
      toast.error('Erro ao atualizar função')
    } finally {
      setUpdating(false)
    }
  }

  function handleExportarDados() {
    if (!socio) return
    try {
      function esc(val: unknown): string {
        if (val === null || val === undefined) return ''
        const str = String(val)
        if (str.includes(',') || str.includes('"') || str.includes('\n')) {
          return `"${str.replace(/"/g, '""')}"`
        }
        return str
      }

      const headers = 'Matrícula,Nome Completo,CPF,Email,WhatsApp,Data Nascimento,Endereço,Número,Complemento,Bairro,Cidade,Estado,CEP,Status,Ranking,Data Cadastro,Data Aprovação'
      const row = [
        esc(socio.codigo_referencia),
        esc(socio.nome_completo),
        esc(socio.cpf),
        esc(socio.email),
        esc(socio.whatsapp),
        esc(socio.data_nascimento),
        esc(socio.endereco_completo),
        esc(socio.numero),
        esc(socio.complemento),
        esc(socio.bairro),
        esc(socio.cidade),
        esc(socio.estado),
        esc(socio.cep),
        esc(socio.status),
        esc(socio.ranking),
        esc(socio.data_cadastro),
        esc(socio.data_aprovacao),
      ].join(',')

      const csv = '\uFEFF' + [headers, row].join('\n')
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `socio_${socio.cpf.replace(/\D/g, '')}.csv`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
      toast.success('Dados exportados com sucesso')
    } catch (error) {
      console.error('Erro ao exportar:', error)
      toast.error('Erro ao exportar dados')
    } finally {
      setUpdating(false)
    }
  }

  function formatarDataSegura(dataString: string | null | undefined) {
    if (!dataString) return '-'
    const [year, month, day] = dataString.split('-').map(Number)
    const date = new Date(Date.UTC(year, month - 1, day))
    return date.toLocaleDateString('pt-BR', { timeZone: 'UTC' })
  }

  // Função para obter badge de status
  const getStatusBadge = (status: string) => {
    const styles = {
      pendente: 'bg-yellow-100 text-yellow-800 border-yellow-300',
      ativo: 'bg-green-100 text-green-800 border-green-300',
      inativo: 'bg-gray-100 text-gray-800 border-gray-300',
      bloqueado: 'bg-red-100 text-red-800 border-red-300',
      inadimplente: 'bg-orange-100 text-orange-800 border-orange-300',
    }

    const labels = {
      pendente: 'Pendente',
      ativo: 'Ativo',
      inativo: 'Inativo',
      bloqueado: 'Bloqueado',
      inadimplente: 'Inadimplente',
    }

    return (
      <Badge className={styles[status as keyof typeof styles]}>
        {labels[status as keyof typeof labels]}
      </Badge>
    )
  }

  if (loading) {
    return (
      <div className="p-8 text-center">
        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent"></div>
        <p className="mt-2 text-sm text-muted-foreground">Carregando dados do sócio...</p>
      </div>
    )
  }

  if (!socio) {
    return (
      <div className="p-8 text-center">
        <p className="text-muted-foreground">Sócio não encontrado.</p>
        <Button asChild className="mt-4">
          <Link href="/gestor/socios">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar para Lista
          </Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Cabeçalho */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/gestor/socios">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{socio.nome_completo}</h1>
            <p className="text-muted-foreground">
              {socio.codigo_referencia ? `Matricula: ${socio.codigo_referencia}` : 'Sem matricula'}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" asChild>
            <Link href={`/gestor/socios/${id}/ficha-cadastral`}>
              <ClipboardList className="mr-2 h-4 w-4" />
              Ver Ficha Cadastral
            </Link>
          </Button>
          {socio.whatsapp ? (
            <Button variant="outline" size="sm" asChild>
              <a
                href={`https://wa.me/55${socio.whatsapp.replace(/\D/g, '')}?text=${encodeURIComponent(`Olá, ${socio.nome_completo}! Aqui é o gestor da torcida.`)}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                <MessageSquare className="mr-2 h-4 w-4" />
                Enviar Mensagem
              </a>
            </Button>
          ) : (
            <Button variant="outline" size="sm" disabled title="Sócio sem WhatsApp cadastrado">
              <MessageSquare className="mr-2 h-4 w-4" />
              Enviar Mensagem
            </Button>
          )}
          <Button variant="outline" size="sm" onClick={handleExportarDados}>
            <Download className="mr-2 h-4 w-4" />
            Exportar Dados
          </Button>
        </div>
      </div>

      {/* Status e Ações Rápidas */}
      <Card className="p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium">Status Atual:</span>
            {getStatusBadge(socio.status)}
          </div>
          <div className="flex gap-2">
            {socio.status !== 'ativo' && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => updateStatus('ativo')}
                disabled={updating}
              >
                <CheckCircle className="mr-2 h-4 w-4" />
                Ativar
              </Button>
            )}
            {socio.status !== 'bloqueado' && (
              <Button
                size="sm"
                variant="destructive"
                onClick={() => updateStatus('bloqueado')}
                disabled={updating}
              >
                <Ban className="mr-2 h-4 w-4" />
                Bloquear
              </Button>
            )}
          </div>
        </div>
      </Card>

      {/* Ranking do Sócio */}
      <Card className="p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <Medal className="h-5 w-5 text-muted-foreground" />
            <span className="text-sm font-medium">Ranking:</span>
            <RankingBadge ranking={socio.ranking || 'bronze'} />
          </div>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant={socio.ranking === 'bronze' ? 'default' : 'outline'}
              onClick={() => updateRanking('bronze')}
              disabled={updating || socio.ranking === 'bronze'}
              className={socio.ranking === 'bronze' ? 'bg-amber-700 hover:bg-amber-800' : ''}
            >
              Bronze
            </Button>
            <Button
              size="sm"
              variant={socio.ranking === 'prata' ? 'default' : 'outline'}
              onClick={() => updateRanking('prata')}
              disabled={updating || socio.ranking === 'prata'}
              className={socio.ranking === 'prata' ? 'bg-gray-500 hover:bg-gray-600' : ''}
            >
              Prata
            </Button>
            <Button
              size="sm"
              variant={socio.ranking === 'ouro' ? 'default' : 'outline'}
              onClick={() => updateRanking('ouro')}
              disabled={updating || socio.ranking === 'ouro'}
              className={socio.ranking === 'ouro' ? 'bg-yellow-500 hover:bg-yellow-600 text-black' : ''}
            >
              Ouro
            </Button>
          </div>
        </div>
      </Card>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Dados Pessoais */}
        <Card className="p-6">
          <h2 className="text-lg font-semibold mb-4">Dados Pessoais</h2>
          <div className="space-y-3">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Nome Completo</p>
              <p className="text-sm">{socio.nome_completo}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">CPF</p>
              <p className="text-sm">{socio.cpf}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Data de Nascimento</p>
              <p className="text-sm flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                {formatarDataSegura(socio.data_nascimento)}
              </p>
            </div>
          </div>
        </Card>

        {/* Contato */}
        <Card className="p-6">
          <h2 className="text-lg font-semibold mb-4">Contato</h2>
          <div className="space-y-3">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Email</p>
              <p className="text-sm flex items-center gap-2">
                <Mail className="h-4 w-4" />
                {socio.email}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">WhatsApp</p>
              <p className="text-sm flex items-center gap-2">
                <Phone className="h-4 w-4" />
                {socio.whatsapp || '-'}
              </p>
            </div>
          </div>
        </Card>

        {/* Endereço */}
        <Card className="p-6">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Endereço
          </h2>
          <div className="space-y-2 text-sm">
            <p>{socio.endereco_completo || '-'}{socio.numero ? `, ${socio.numero}` : ''}</p>
            {socio.complemento && <p>{socio.complemento}</p>}
            <p>{socio.bairro || '-'}</p>
            <p>{socio.cidade || '-'} - {socio.estado || '-'}</p>
            <p>CEP: {socio.cep || '-'}</p>
          </div>
        </Card>

        {/* Informações de Cadastro */}
        <Card className="p-6">
          <h2 className="text-lg font-semibold mb-4">Informações de Cadastro</h2>
          <div className="space-y-3">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Data de Cadastro</p>
              <p className="text-sm">{formatarDataSegura(socio.data_cadastro)}</p>
            </div>
            {socio.data_aprovacao && (
              <div>
                <p className="text-sm font-medium text-muted-foreground">Data de Aprovação</p>
                <p className="text-sm">{formatarDataSegura(socio.data_aprovacao)}</p>
              </div>
            )}
            <div className="pt-2 border-t">
              <p className="text-sm font-medium text-muted-foreground mb-1">Ingressos Comprados</p>
              <p className="text-sm flex items-center gap-2 font-semibold">
                <Ticket className="h-4 w-4 text-primary" />
                {totalIngressos} {totalIngressos === 1 ? 'ingresso' : 'ingressos'}
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Função na Torcida */}
      <Card className="p-6">
        <h2 className="text-lg font-semibold mb-4">Função na Torcida</h2>
        <div className="flex gap-2">
          <Input
            value={funcaoInput}
            onChange={(e) => setFuncaoInput(e.target.value)}
            placeholder="Ex: Cozinheiro, Marketing, Líder..."
            className="flex-1"
          />
          <Button
            onClick={updateFuncaoTorcida}
            disabled={updating || funcaoInput === (socio.funcao_torcida || '')}
            size="sm"
          >
            Salvar
          </Button>
        </div>
        <p className="text-xs text-muted-foreground mt-2">
          Esta função aparece na ficha cadastral em PDF do sócio.
        </p>
      </Card>

      {/* Informações Médicas */}
      <Card className="p-6">
        <button
          className="w-full flex items-center justify-between"
          onClick={() => setShowMedical(!showMedical)}
        >
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Heart className="h-5 w-5 text-red-500" />
            Informações Médicas
          </h2>
          {showMedical ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </button>
        {showMedical && (
          <div className="mt-4 space-y-3">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Necessidades Especiais</p>
              <p className="text-sm">{socio.necessidades_especiais ? 'Sim' : 'Não'}</p>
              {socio.necessidades_especiais && socio.descricao_necessidades && (
                <p className="text-sm text-muted-foreground mt-1">{socio.descricao_necessidades}</p>
              )}
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Usa Medicação</p>
              <p className="text-sm">{socio.usa_medicacao ? 'Sim' : 'Não'}</p>
              {socio.usa_medicacao && socio.medicacao_detalhes && (
                <p className="text-sm text-muted-foreground mt-1">{socio.medicacao_detalhes}</p>
              )}
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Alergias</p>
              <p className="text-sm">{socio.alergias || 'Nenhuma informada'}</p>
            </div>
          </div>
        )}
      </Card>

      {/* Histórico de Pagamentos */}
      <Card className="p-6">
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Histórico de Pagamentos
        </h2>
        <p className="text-sm text-muted-foreground">
          Em breve: visualize todo o histórico de pagamentos deste sócio.
        </p>
        <Button variant="outline" size="sm" className="mt-4" asChild>
          <Link href={`/gestor/pagamentos?socio_id=${socio.id}`}>
            Ver Pagamentos
          </Link>
        </Button>
      </Card>
    </div>
  )
}

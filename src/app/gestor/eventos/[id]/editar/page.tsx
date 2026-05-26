'use client'

import { useState, useEffect, useRef } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import Link from 'next/link'
import { useRouter, useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { ArrowLeft, Calendar, MapPin, Users, Trophy, Save, Loader2, DollarSign, Download, FileText, UserCheck, UserPlus } from 'lucide-react'
import { toast } from 'react-hot-toast'

interface CompraIngresso {
  id: string
  status: string
  tipo_ingresso: string
  valor: number | null
  created_at: string
  socio: { nome_completo: string; cpf: string } | null
}

const FETCH_TIMEOUT = 30000

export default function EditarEventoPage() {
  const router = useRouter()
  const params = useParams()
  const id = params.id as string
  const supabase = createClient()
  const [loading, setLoading] = useState(false)
  const [loadingData, setLoadingData] = useState(true)
  const [compras, setCompras] = useState<CompraIngresso[]>([])
  const [loadingCompras, setLoadingCompras] = useState(true)
  const abortControllerRef = useRef<AbortController | null>(null)
  const [formData, setFormData] = useState({
    nome_evento: '',
    time_casa: '',
    time_visitante: '',
    data_evento: '',
    hora_evento: '',
    local: '',
    qtd_ingressos_total: '',
    status: 'ativo',
    ranking_minimo: '',
    valor_socio: '',
    valor_dependente: '',
    valor_adicional: '',
    data_fim_vendas: '',
    pagar_ate: '',
    permite_dependentes: true,
    permite_adicionais: true,
  })

  // Carregar dados do evento
  useEffect(() => {
    async function loadEvento() {
      try {
        const res = await fetch(`/api/eventos/${id}`)
        if (!res.ok) {
          toast.error('Evento não encontrado')
          router.push('/gestor/eventos')
          return
        }
        const { evento } = await res.json()

        // Extrair data e hora do data_hora
        const dataHora = new Date(evento.data_hora)
        const dataEvento = dataHora.toISOString().split('T')[0]
        const horaEvento = dataHora.toTimeString().slice(0, 5)

        setFormData({
          nome_evento: evento.nome_evento || '',
          time_casa: evento.time_casa || '',
          time_visitante: evento.time_visitante || '',
          data_evento: dataEvento,
          hora_evento: horaEvento,
          local: evento.local || '',
          qtd_ingressos_total: evento.qtd_ingressos_total?.toString() || '',
          status: evento.status || 'ativo',
          ranking_minimo: evento.ranking_minimo || '',
          valor_socio: evento.valor_socio?.toString() || '',
          valor_dependente: evento.valor_dependente?.toString() || '',
          valor_adicional: evento.valor_adicional?.toString() || '',
          data_fim_vendas: evento.data_fim_vendas ? new Date(evento.data_fim_vendas).toISOString().split('T')[0] : '',
          pagar_ate: evento.pagar_ate || '',
          permite_dependentes: evento.permite_dependentes !== false,
          permite_adicionais: evento.permite_adicionais !== false,
        })
        // Buscar compras de ingressos para este evento
        setLoadingCompras(true)
        const { data: comprasData } = await supabase
          .from('compras_ingressos')
          .select(`id, status, tipo_ingresso, valor, created_at, socio:socios(nome_completo, cpf)`)
          .eq('evento_id', id)
          .order('created_at', { ascending: false })
        if (comprasData) setCompras(comprasData as unknown as CompraIngresso[])
        setLoadingCompras(false)
      } catch (err) {
        console.error('Erro ao carregar evento:', err)
        toast.error('Erro ao carregar evento')
      } finally {
        setLoadingData(false)
      }
    }

    loadEvento()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    if (!formData.nome_evento || !formData.data_evento || !formData.hora_evento || !formData.local) {
      toast.error('Preencha todos os campos obrigatorios')
      return
    }

    if (!formData.qtd_ingressos_total || parseInt(formData.qtd_ingressos_total) <= 0) {
      toast.error('Informe a quantidade de ingressos disponíveis')
      return
    }

    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }

    const controller = new AbortController()
    abortControllerRef.current = controller

    try {
      setLoading(true)

      const dataHoraEvento = `${formData.data_evento}T${formData.hora_evento}:00`

      const eventoData = {
        id,
        nome_evento: formData.nome_evento,
        time_casa: formData.time_casa || null,
        time_visitante: formData.time_visitante || null,
        data_hora: dataHoraEvento,
        local: formData.local,
        qtd_ingressos_total: parseInt(formData.qtd_ingressos_total),
        status: formData.status,
        ranking_minimo: formData.ranking_minimo || null,
        valor_socio: formData.valor_socio ? parseFloat(formData.valor_socio) : null,
        valor_dependente: formData.valor_dependente ? parseFloat(formData.valor_dependente) : null,
        valor_adicional: formData.valor_adicional ? parseFloat(formData.valor_adicional) : null,
        data_fim_vendas: formData.data_fim_vendas || null,
        pagar_ate: formData.pagar_ate || null,
        permite_dependentes: formData.permite_dependentes,
        permite_adicionais: formData.permite_adicionais,
      }

      const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT)

      const response = await fetch('/api/eventos', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(eventoData),
        signal: controller.signal
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        const result = await response.json().catch(() => ({}))
        throw new Error(result.error || 'Erro ao atualizar evento')
      }

      toast.success('Evento atualizado com sucesso!')
      router.push('/gestor/eventos')
    } catch (error: unknown) {
      if (error instanceof Error && error.name === 'AbortError') {
        toast.error('Tempo limite excedido. Tente novamente.')
      } else {
        console.error('Erro ao atualizar evento:', error)
        toast.error(error instanceof Error ? error.message : 'Erro ao atualizar evento. Tente novamente.')
      }
    } finally {
      setLoading(false)
    }
  }

  function handleChange(field: string, value: string) {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  function handleDownloadCSVIngressos() {
    if (compras.length === 0) return
    const headers = 'Nome,CPF,Status,Tipo,Valor'
    const rows = compras.map((r) => {
      const nome = `"${(r.socio?.nome_completo || '').replace(/"/g, '""')}"`
      const cpf = (r.socio?.cpf || '').replace(/\D/g, '')
      return `${nome},${cpf},${r.status},${r.tipo_ingresso},${(r.valor || 0).toFixed(2)}`
    })
    const csv = '\uFEFF' + [headers, ...rows].join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `ingressos_${id}.csv`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  if (loadingData) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto" />
          <p className="mt-2 text-sm text-muted-foreground">Carregando evento...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      {/* Cabecalho */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/gestor/eventos">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Editar Evento</h1>
          <p className="text-muted-foreground">
            Atualize as informacoes do evento
          </p>
        </div>
      </div>

      {/* Formulario */}
      <form onSubmit={handleSubmit}>
        <Card className="p-6">
          <div className="space-y-6">
            {/* Nome do Evento */}
            <div className="space-y-2">
              <Label htmlFor="nome_evento">
                Nome do Evento <span className="text-red-500">*</span>
              </Label>
              <div className="relative">
                <Trophy className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="nome_evento"
                  placeholder="Ex: Brasileirao - Rodada 15"
                  value={formData.nome_evento}
                  onChange={(e) => handleChange('nome_evento', e.target.value)}
                  className="pl-10"
                  required
                />
              </div>
            </div>

            {/* Times */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="time_casa">Time da Casa</Label>
                <Input
                  id="time_casa"
                  placeholder="Ex: Atletico-MG"
                  value={formData.time_casa}
                  onChange={(e) => handleChange('time_casa', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="time_visitante">Time Visitante</Label>
                <Input
                  id="time_visitante"
                  placeholder="Ex: Flamengo"
                  value={formData.time_visitante}
                  onChange={(e) => handleChange('time_visitante', e.target.value)}
                />
              </div>
            </div>

            {/* Data e Hora */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="data_evento">
                  Data <span className="text-red-500">*</span>
                </Label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="data_evento"
                    type="date"
                    value={formData.data_evento}
                    onChange={(e) => handleChange('data_evento', e.target.value)}
                    className="pl-10"
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="hora_evento">
                  Horario <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="hora_evento"
                  type="time"
                  value={formData.hora_evento}
                  onChange={(e) => handleChange('hora_evento', e.target.value)}
                  required
                />
              </div>
            </div>

            {/* Local */}
            <div className="space-y-2">
              <Label htmlFor="local">
                Local <span className="text-red-500">*</span>
              </Label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="local"
                  placeholder="Ex: Maracana - Rio de Janeiro"
                  value={formData.local}
                  onChange={(e) => handleChange('local', e.target.value)}
                  className="pl-10"
                  required
                />
              </div>
            </div>

            {/* Capacidade */}
            <div className="space-y-2">
              <Label htmlFor="qtd_ingressos_total">
                Quantidade de Ingressos <span className="text-red-500">*</span>
              </Label>
              <div className="relative">
                <Users className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="qtd_ingressos_total"
                  type="number"
                  placeholder="Ex: 500"
                  value={formData.qtd_ingressos_total}
                  onChange={(e) => handleChange('qtd_ingressos_total', e.target.value)}
                  className="pl-10"
                  min="1"
                  required
                />
              </div>
            </div>

            {/* Status */}
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <select
                id="status"
                value={formData.status}
                onChange={(e) => handleChange('status', e.target.value)}
                className="w-full px-3 py-2 border rounded-md bg-background"
              >
                <option value="ativo">Ativo</option>
                <option value="encerrado">Encerrado</option>
                <option value="cancelado">Cancelado</option>
              </select>
            </div>

            {/* Ranking Minimo */}
            <div className="space-y-2">
              <Label htmlFor="ranking_minimo">Ranking Minimo</Label>
              <select
                id="ranking_minimo"
                value={formData.ranking_minimo}
                onChange={(e) => handleChange('ranking_minimo', e.target.value)}
                className="w-full px-3 py-2 border rounded-md bg-background"
              >
                <option value="">Aberto a todos</option>
                <option value="bronze">Bronze</option>
                <option value="prata">Prata</option>
                <option value="ouro">Ouro</option>
              </select>
            </div>

            {/* Secao de Precos */}
            <div className="space-y-4 pt-4 border-t">
              <h3 className="font-semibold flex items-center gap-2">
                <DollarSign className="h-4 w-4" />
                Valores dos Ingressos
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="valor_socio">Valor Socio (R$)</Label>
                  <Input
                    id="valor_socio"
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="Ex: 50.00"
                    value={formData.valor_socio}
                    onChange={(e) => handleChange('valor_socio', e.target.value)}
                  />
                </div>
                {formData.permite_dependentes && (
                  <div className="space-y-2">
                    <Label htmlFor="valor_dependente">Valor Dependente (R$)</Label>
                    <Input
                      id="valor_dependente"
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="Ex: 30.00"
                      value={formData.valor_dependente}
                      onChange={(e) => handleChange('valor_dependente', e.target.value)}
                    />
                  </div>
                )}
                {formData.permite_adicionais && (
                  <div className="space-y-2">
                    <Label htmlFor="valor_adicional">Valor Adicional (R$)</Label>
                    <Input
                      id="valor_adicional"
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="Ex: 80.00"
                      value={formData.valor_adicional}
                      onChange={(e) => handleChange('valor_adicional', e.target.value)}
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Permissoes de Ingressos */}
            <div className="space-y-4 pt-4 border-t">
              <h3 className="font-semibold flex items-center gap-2">
                <UserCheck className="h-4 w-4" />
                Quem pode comprar ingressos
              </h3>
              <div className="space-y-3">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.permite_dependentes}
                    onChange={(e) => setFormData(prev => ({ ...prev, permite_dependentes: e.target.checked }))}
                    className="w-4 h-4 rounded border-gray-300"
                  />
                  <div>
                    <p className="text-sm font-medium flex items-center gap-2">
                      <UserCheck className="h-4 w-4 text-blue-500" />
                      Permitir ingressos para Dependentes
                    </p>
                    <p className="text-xs text-muted-foreground">Socios poderao comprar ingressos para seus dependentes cadastrados</p>
                  </div>
                </label>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.permite_adicionais}
                    onChange={(e) => setFormData(prev => ({ ...prev, permite_adicionais: e.target.checked }))}
                    className="w-4 h-4 rounded border-gray-300"
                  />
                  <div>
                    <p className="text-sm font-medium flex items-center gap-2">
                      <UserPlus className="h-4 w-4 text-green-500" />
                      Permitir ingressos Adicionais
                    </p>
                    <p className="text-xs text-muted-foreground">Socios poderao comprar ingressos para acompanhantes informando nome e CPF</p>
                  </div>
                </label>
              </div>
            </div>

            {/* Datas de Venda */}
            <div className="space-y-4 pt-4 border-t">
              <h3 className="font-semibold flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Prazos de Venda
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="data_fim_vendas">Data Limite de Vendas</Label>
                  <Input
                    id="data_fim_vendas"
                    type="date"
                    value={formData.data_fim_vendas}
                    onChange={(e) => handleChange('data_fim_vendas', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="pagar_ate">Data Limite para Pagamento</Label>
                  <Input
                    id="pagar_ate"
                    type="date"
                    value={formData.pagar_ate}
                    onChange={(e) => handleChange('pagar_ate', e.target.value)}
                  />
                </div>
              </div>
            </div>

            {/* Botoes */}
            <div className="flex flex-col sm:flex-row gap-3 pt-4">
              <Button
                type="submit"
                disabled={loading}
                className="flex-1 sm:flex-initial"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Salvando...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Salvar Alteracoes
                  </>
                )}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
                disabled={loading}
              >
                Cancelar
              </Button>
            </div>
          </div>
        </Card>
      </form>

      {/* Seção de Ingressos / Reservas */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Reservas de Ingressos ({compras.length})
          </h2>
          {compras.length > 0 && (
            <Button variant="outline" size="sm" onClick={handleDownloadCSVIngressos}>
              <Download className="h-4 w-4 mr-2" />
              Baixar CSV
            </Button>
          )}
        </div>
        {loadingCompras ? (
          <div className="flex justify-center p-4">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : compras.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            Nenhuma reserva encontrada para este evento.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/50">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-muted-foreground uppercase">Nome</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-muted-foreground uppercase">CPF</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-muted-foreground uppercase">Status</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-muted-foreground uppercase">Tipo</th>
                  <th className="px-4 py-2 text-right text-xs font-medium text-muted-foreground uppercase">Valor</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {compras.map((compra) => (
                  <tr key={compra.id} className="hover:bg-muted/30">
                    <td className="px-4 py-2">{compra.socio?.nome_completo || '-'}</td>
                    <td className="px-4 py-2 font-mono text-xs">{compra.socio?.cpf.replace(/\D/g, '') || '-'}</td>
                    <td className="px-4 py-2">{compra.status}</td>
                    <td className="px-4 py-2">{compra.tipo_ingresso}</td>
                    <td className="px-4 py-2 text-right">R$ {(compra.valor || 0).toFixed(2).replace('.', ',')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  )
}

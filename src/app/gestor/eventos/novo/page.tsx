'use client'

import { useState, useRef } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { ArrowLeft, Calendar, MapPin, Users, Trophy, Save, Loader2, DollarSign, UserCheck, UserPlus } from 'lucide-react'
import { toast } from 'react-hot-toast'

const FETCH_TIMEOUT = 30000 // 30 segundos

export default function NovoEventoPage() {
  const router = useRouter()
  const supabase = createClient()
  const [loading, setLoading] = useState(false)
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

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    // Validacoes basicas
    if (!formData.nome_evento || !formData.data_evento || !formData.hora_evento || !formData.local) {
      toast.error('Preencha todos os campos obrigatorios')
      return
    }

    // Quantidade de ingressos é obrigatória no schema
    if (!formData.qtd_ingressos_total || parseInt(formData.qtd_ingressos_total) <= 0) {
      toast.error('Informe a quantidade de ingressos disponíveis')
      return
    }

    // Cancelar requisição anterior se existir
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }

    const controller = new AbortController()
    abortControllerRef.current = controller

    try {
      setLoading(true)
      const { data: { session } } = await supabase.auth.getSession()
      const user = session?.user

      if (!user) {
        toast.error('Voce precisa estar autenticado')
        setLoading(false)
        return
      }

      // Buscar gestor
      const { data: gestor } = await supabase
        .from('gestores')
        .select('torcida_id')
        .eq('auth_user_id', user.id)
        .maybeSingle()

      if (!gestor) {
        toast.error('Gestor nao encontrado')
        setLoading(false)
        return
      }

      // Combinar data e hora
      const dataHoraEvento = `${formData.data_evento}T${formData.hora_evento}:00`

      // Preparar dados para a API (usando nomes corretos do schema)
      const eventoData = {
        torcida_id: gestor.torcida_id,
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

      // Timeout para a requisição
      const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT)

      // Enviar para a API
      const response = await fetch('/api/eventos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(eventoData),
        signal: controller.signal
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        const result = await response.json().catch(() => ({}))
        throw new Error(result.error || 'Erro ao criar evento')
      }

      toast.success('Evento criado com sucesso!')
      router.push('/gestor/eventos')
    } catch (error: unknown) {
      if (error instanceof Error && error.name === 'AbortError') {
        console.warn('Requisição cancelada ou timeout')
        toast.error('Tempo limite excedido. Tente novamente.')
      } else {
        console.error('Erro ao criar evento:', error)
        toast.error(error instanceof Error ? error.message : 'Erro ao criar evento. Tente novamente.')
      }
    } finally {
      setLoading(false)
    }
  }

  function handleChange(field: string, value: string) {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      {/* Cabeçalho */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/gestor/eventos">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Novo Evento</h1>
          <p className="text-muted-foreground">
            Crie um novo evento, jogo ou atividade para sua torcida
          </p>
        </div>
      </div>

      {/* Formulário */}
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
                  placeholder="Ex: Brasileirão - Rodada 15"
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
                  placeholder="Ex: Atlético-MG"
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
                  Horário <span className="text-red-500">*</span>
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
                  placeholder="Ex: Maracanã - Rio de Janeiro"
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
              <p className="text-sm text-muted-foreground">
                Número total de ingressos disponíveis para este evento
              </p>
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

            {/* Ranking Mínimo */}
            <div className="space-y-2">
              <Label htmlFor="ranking_minimo">Ranking Mínimo</Label>
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
              <p className="text-xs text-muted-foreground">
                Define o ranking mínimo necessário para participar do evento
              </p>
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
              <p className="text-sm text-muted-foreground">
                Deixe em branco para eventos gratuitos ou sem venda de ingressos
              </p>
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
                    <p className="text-xs text-muted-foreground">Sócios poderão comprar ingressos para seus dependentes cadastrados</p>
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
                    <p className="text-xs text-muted-foreground">Sócios poderão comprar ingressos para acompanhantes informando nome e CPF</p>
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
                  <p className="text-xs text-muted-foreground">
                    Ate quando os socios podem solicitar ingressos
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="pagar_ate">Data Limite para Pagamento</Label>
                  <Input
                    id="pagar_ate"
                    type="date"
                    value={formData.pagar_ate}
                    onChange={(e) => handleChange('pagar_ate', e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">
                    Prazo maximo para pagamento dos ingressos
                  </p>
                </div>
              </div>
            </div>

            {/* Informativo */}
            <Card className="p-4 border-blue-200 bg-blue-50">
              <div className="flex gap-3">
                <Calendar className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-semibold text-blue-800">Sobre a criação de eventos</h3>
                  <p className="text-sm text-blue-700 mt-1">
                    Após criar o evento, você poderá gerenciar a distribuição de ingressos,
                    enviar notificações para os sócios e acompanhar a lista de presença.
                  </p>
                </div>
              </div>
            </Card>

            {/* Botões */}
            <div className="flex flex-col sm:flex-row gap-3 pt-4">
              <Button
                type="submit"
                disabled={loading}
                className="flex-1 sm:flex-initial"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Criando...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Criar Evento
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

    </div>
  )
}

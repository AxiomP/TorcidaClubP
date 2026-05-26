'use client'

import { useMemo } from 'react'
import { PagamentoStatus } from '@/types/pagamento'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Search } from 'lucide-react'

interface PaymentFiltersProps {
  onStatusChange: (status: PagamentoStatus | 'todos') => void
  onMesChange: (mes: string) => void
  onBuscaChange: (busca: string) => void
}

export function PaymentFilters({
  onStatusChange,
  onMesChange,
  onBuscaChange,
}: PaymentFiltersProps) {
  // Gerar lista de meses dinamicamente (últimos 12 meses)
  const mesesOptions = useMemo(() => {
    const meses: { value: string; label: string }[] = []
    const hoje = new Date()

    for (let i = 0; i < 12; i++) {
      const data = new Date(hoje.getFullYear(), hoje.getMonth() - i, 1)
      const value = `${data.getFullYear()}-${String(data.getMonth() + 1).padStart(2, '0')}`
      const label = data.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })
      meses.push({ value, label: label.charAt(0).toUpperCase() + label.slice(1) })
    }

    return meses
  }, [])

  return (
    <div className="flex flex-col md:flex-row gap-4">
      {/* Busca por nome */}
      <div className="relative flex-1 md:max-w-xs">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
        <Input
          type="text"
          placeholder="Buscar por nome do sócio..."
          className="pl-10"
          onChange={(e) => onBuscaChange(e.target.value)}
        />
      </div>

      {/* Filtro de status */}
      <Select
        defaultValue="todos"
        onValueChange={(value) => onStatusChange(value as PagamentoStatus | 'todos')}
      >
        <SelectTrigger className="w-full md:w-[200px]">
          <SelectValue placeholder="Todos os status" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="todos">Todos os status</SelectItem>
          <SelectItem value="pendente">Pendente</SelectItem>
          <SelectItem value="comprovante_enviado">Aguardando Aprovação</SelectItem>
          <SelectItem value="confirmado">Confirmado</SelectItem>
          <SelectItem value="recusado">Recusado</SelectItem>
          <SelectItem value="perdoado">Perdoado</SelectItem>
        </SelectContent>
      </Select>

      {/* Filtro de mês */}
      <Select
        defaultValue="todos"
        onValueChange={(value) => onMesChange(value)}
      >
        <SelectTrigger className="w-full md:w-[180px]">
          <SelectValue placeholder="Todos os meses" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="todos">Todos os meses</SelectItem>
          {mesesOptions.map((mes) => (
            <SelectItem key={mes.value} value={mes.value}>
              {mes.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}

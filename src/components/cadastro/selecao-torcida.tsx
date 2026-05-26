'use client'

import { useState, useEffect, useCallback } from 'react'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { Search, Loader2, Users, Check } from 'lucide-react'
import Image from 'next/image'
import { cn } from '@/lib/utils'

interface Torcida {
  id: string
  nome: string
  slug: string
  brasao_url: string | null
  cor_fundo: string | null
  frase_efeito: string | null
}

interface SelecaoTorcidaProps {
  value?: string
  onSelect: (torcidaId: string, torcida: Torcida) => void
  onClear?: () => void
  error?: string
}

export function SelecaoTorcida({ value, onSelect, onClear, error }: SelecaoTorcidaProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [torcidas, setTorcidas] = useState<Torcida[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedTorcida, setSelectedTorcida] = useState<Torcida | null>(null)
  const [hasSearched, setHasSearched] = useState(false)

  // Debounce para a busca
  const searchTorcidas = useCallback(async (term: string) => {
    try {
      setLoading(true)
      const response = await fetch(`/api/torcidas/buscar?q=${encodeURIComponent(term)}&limit=20`)

      if (!response.ok) {
        throw new Error('Erro ao buscar torcidas')
      }

      const data = await response.json()
      setTorcidas(data.torcidas || [])
      setHasSearched(true)
    } catch (error) {
      console.error('Erro ao buscar torcidas:', error)
      setTorcidas([])
    } finally {
      setLoading(false)
    }
  }, [])

  // Debounce effect
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchTerm.trim().length >= 2) {
        searchTorcidas(searchTerm)
      } else if (searchTerm.trim().length === 0 && !hasSearched) {
        // Buscar todas as torcidas inicialmente
        searchTorcidas('')
      }
    }, 300)

    return () => clearTimeout(timer)
  }, [searchTerm, searchTorcidas, hasSearched])

  // Carregar torcidas iniciais
  useEffect(() => {
    searchTorcidas('')
  }, [searchTorcidas])

  // Se tiver um valor selecionado e nao tiver a torcida, buscar
  useEffect(() => {
    if (value && !selectedTorcida) {
      const found = torcidas.find(t => t.id === value)
      if (found) {
        setSelectedTorcida(found)
      }
    }
  }, [value, torcidas, selectedTorcida])

  const handleSelect = (torcida: Torcida) => {
    setSelectedTorcida(torcida)
    onSelect(torcida.id, torcida)
  }

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium mb-2">
          Buscar Torcida <span className="text-error">*</span>
        </label>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <Input
            type="text"
            placeholder="Digite o nome da torcida..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={cn("pl-10", error && "border-error")}
          />
          {loading && (
            <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-gray-400" />
          )}
        </div>
        {error && <p className="text-sm text-error mt-1">{error}</p>}
      </div>

      {/* Torcida Selecionada */}
      {selectedTorcida && (
        <Card className="p-4 border-2 border-success bg-success-bg">
          <div className="flex items-center gap-3">
            <div
              className="w-12 h-12 rounded-full flex items-center justify-center"
              style={{ backgroundColor: selectedTorcida.cor_fundo || '#1a1a2e' }}
            >
              {selectedTorcida.brasao_url ? (
                <Image
                  src={selectedTorcida.brasao_url}
                  alt={selectedTorcida.nome}
                  width={40}
                  height={40}
                  className="rounded-full object-cover"
                  unoptimized
                />
              ) : (
                <Users className="h-6 w-6 text-white" />
              )}
            </div>
            <div className="flex-1">
              <p className="font-semibold text-success-dark">{selectedTorcida.nome}</p>
              {selectedTorcida.frase_efeito && (
                <p className="text-sm text-gray-600 italic">&ldquo;{selectedTorcida.frase_efeito}&rdquo;</p>
              )}
            </div>
            <Check className="h-5 w-5 text-success" />
          </div>
        </Card>
      )}

      {/* Lista de Resultados */}
      {!selectedTorcida && torcidas.length > 0 && (
        <div className="space-y-2 max-h-[300px] overflow-y-auto">
          <p className="text-sm text-gray-600">
            {torcidas.length} torcida{torcidas.length !== 1 ? 's' : ''} encontrada{torcidas.length !== 1 ? 's' : ''}
          </p>
          {torcidas.map((torcida) => (
            <Card
              key={torcida.id}
              className={cn(
                "p-3 cursor-pointer transition-all hover:border-primary hover:bg-primary/5",
                value === torcida.id && "border-primary bg-primary/5"
              )}
              onClick={() => handleSelect(torcida)}
            >
              <div className="flex items-center gap-3">
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: torcida.cor_fundo || '#1a1a2e' }}
                >
                  {torcida.brasao_url ? (
                    <Image
                      src={torcida.brasao_url}
                      alt={torcida.nome}
                      width={32}
                      height={32}
                      className="rounded-full object-cover"
                      unoptimized
                    />
                  ) : (
                    <Users className="h-5 w-5 text-white" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{torcida.nome}</p>
                  {torcida.frase_efeito && (
                    <p className="text-xs text-gray-500 truncate italic">&ldquo;{torcida.frase_efeito}&rdquo;</p>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Estado vazio */}
      {!loading && hasSearched && torcidas.length === 0 && !selectedTorcida && (
        <div className="text-center py-8 text-gray-500">
          <Users className="h-12 w-12 mx-auto mb-2 opacity-50" />
          <p>Nenhuma torcida encontrada</p>
          {searchTerm && (
            <p className="text-sm">Tente buscar por outro nome</p>
          )}
        </div>
      )}

      {/* Botao para trocar torcida */}
      {selectedTorcida && (
        <button
          type="button"
          onClick={() => {
            setSelectedTorcida(null)
            setSearchTerm('')
            setHasSearched(false)
            onClear?.()
          }}
          className="text-sm text-primary hover:underline"
        >
          Escolher outra torcida
        </button>
      )}
    </div>
  )
}

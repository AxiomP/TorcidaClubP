'use client'

import { useRef, useState, useCallback } from 'react'
import { Pagamento } from '@/types/pagamento'
import { PaymentCard } from './payment-card'
import { EmptyState } from '@/components/ui/empty-state'
import { Receipt, ChevronLeft, ChevronRight } from 'lucide-react'

interface PaymentListProps {
  pagamentos: Pagamento[]
  showActions?: boolean
  onRefresh?: () => void
  chavePix?: string | null
  torcidaNome?: string
  torcidaSlug?: string
  onComprovanteClick?: (pagamentoId: string) => void
  onVisualizar?: (pagamentoId: string) => void
  layout?: 'grid' | 'carousel'
}

export function PaymentList({ pagamentos, showActions = false, onRefresh, chavePix, torcidaNome, torcidaSlug, onComprovanteClick, onVisualizar, layout = 'grid' }: PaymentListProps) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const [canLeft, setCanLeft] = useState(false)
  const [canRight, setCanRight] = useState(pagamentos.length > 1)

  const onScroll = useCallback(() => {
    const el = scrollRef.current
    if (!el) return
    setCanLeft(el.scrollLeft > 4)
    setCanRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 4)
  }, [])

  const scroll = (dir: 'left' | 'right') =>
    scrollRef.current?.scrollBy({ left: dir === 'left' ? -312 : 312, behavior: 'smooth' })

  if (pagamentos.length === 0) {
    return (
      <EmptyState
        icon={Receipt}
        title="Nenhum pagamento encontrado"
        message="Não há pagamentos que correspondam aos filtros selecionados."
      />
    )
  }

  if (layout === 'carousel') {
    return (
      <div className="relative">
        {canLeft && (
          <>
            <div className="absolute left-0 top-0 bottom-2 w-10 bg-gradient-to-r from-background to-transparent pointer-events-none z-[5]" />
            <button
              onClick={() => scroll('left')}
              className="absolute left-1 top-1/2 -translate-y-1/2 z-10 h-9 w-9 rounded-full bg-background shadow-md border flex items-center justify-center hover:bg-muted transition-colors"
              aria-label="Anterior"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
          </>
        )}
        <div
          ref={scrollRef}
          onScroll={onScroll}
          className="flex gap-3 overflow-x-auto pb-2 px-1 scroll-smooth [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          style={{ scrollSnapType: 'x mandatory' }}
        >
          {pagamentos.map((pagamento) => (
            <div
              key={pagamento.id}
              className="shrink-0 w-[min(300px,82vw)]"
              style={{ scrollSnapAlign: 'start' }}
            >
              <PaymentCard
                pagamento={pagamento}
                showActions={showActions}
                onRefresh={onRefresh}
                chavePix={chavePix}
                torcidaNome={torcidaNome}
                torcidaSlug={torcidaSlug}
                onComprovanteClick={onComprovanteClick ? () => onComprovanteClick(pagamento.id) : undefined}
                onVisualizar={onVisualizar ? () => onVisualizar(pagamento.id) : undefined}
              />
            </div>
          ))}
          <div className="shrink-0 w-4" aria-hidden />
        </div>
        {canRight && (
          <>
            <div className="absolute right-0 top-0 bottom-2 w-10 bg-gradient-to-l from-background to-transparent pointer-events-none z-[5]" />
            <button
              onClick={() => scroll('right')}
              className="absolute right-1 top-1/2 -translate-y-1/2 z-10 h-9 w-9 rounded-full bg-background shadow-md border flex items-center justify-center hover:bg-muted transition-colors"
              aria-label="Próximo"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </>
        )}
      </div>
    )
  }

  return (
    <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
      {pagamentos.map((pagamento) => (
        <PaymentCard
          key={pagamento.id}
          pagamento={pagamento}
          showActions={showActions}
          onRefresh={onRefresh}
          chavePix={chavePix}
          torcidaNome={torcidaNome}
          torcidaSlug={torcidaSlug}
          onComprovanteClick={onComprovanteClick ? () => onComprovanteClick(pagamento.id) : undefined}
          onVisualizar={onVisualizar ? () => onVisualizar(pagamento.id) : undefined}
        />
      ))}
    </div>
  )
}

import React from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils/cn'

interface PaginationProps {
  currentPage: number
  totalPages: number
  onPageChange: (page: number) => void
  className?: string
}

export function Pagination({
  currentPage,
  totalPages,
  onPageChange,
  className,
}: PaginationProps) {
  const pages = Array.from({ length: totalPages }, (_, i) => i + 1)

  // Show only a subset of pages if there are too many
  const getVisiblePages = () => {
    if (totalPages <= 7) {
      return pages
    }

    if (currentPage <= 3) {
      return [...pages.slice(0, 5), '...', totalPages]
    }

    if (currentPage >= totalPages - 2) {
      return [1, '...', ...pages.slice(totalPages - 5)]
    }

    return [
      1,
      '...',
      currentPage - 1,
      currentPage,
      currentPage + 1,
      '...',
      totalPages,
    ]
  }

  const visiblePages = getVisiblePages()

  return (
    <div className={cn('flex items-center justify-center gap-1', className)}>
      <button
        className="btn btn-ghost btn-sm"
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
      >
        <ChevronLeft className="w-4 h-4" />
      </button>

      {visiblePages.map((page, index) => {
        if (page === '...') {
          return (
            <span key={`ellipsis-${index}`} className="px-3 py-2 text-gray-500">
              ...
            </span>
          )
        }

        return (
          <button
            key={page}
            className={cn(
              'btn btn-sm',
              page === currentPage ? 'btn-primary' : 'btn-ghost'
            )}
            onClick={() => onPageChange(page as number)}
          >
            {page}
          </button>
        )
      })}

      <button
        className="btn btn-ghost btn-sm"
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
      >
        <ChevronRight className="w-4 h-4" />
      </button>
    </div>
  )
}

// Componente auxiliar para mostrar informações da paginação
interface PaginationInfoProps {
  currentPage: number
  pageSize: number
  totalItems: number
  className?: string
}

export function PaginationInfo({
  currentPage,
  pageSize,
  totalItems,
  className,
}: PaginationInfoProps) {
  const start = (currentPage - 1) * pageSize + 1
  const end = Math.min(currentPage * pageSize, totalItems)

  return (
    <div className={cn('text-sm text-gray-600', className)}>
      Mostrando {start} - {end} de {totalItems} resultados
    </div>
  )
}

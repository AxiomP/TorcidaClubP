import React from 'react'
import { cn } from '@/lib/utils/cn'

interface SkeletonProps {
  className?: string
  height?: string | number
  width?: string | number
  variant?: 'text' | 'circular' | 'rectangular'
}

export function Skeleton({
  className,
  height,
  width,
  variant = 'rectangular',
}: SkeletonProps) {
  const style: React.CSSProperties = {}

  if (height) {
    style.height = typeof height === 'number' ? `${height}px` : height
  }

  if (width) {
    style.width = typeof width === 'number' ? `${width}px` : width
  }

  const variantClasses = {
    text: 'h-4',
    circular: 'rounded-full',
    rectangular: '',
  }

  return (
    <div
      className={cn('skeleton', variantClasses[variant], className)}
      style={style}
    />
  )
}

// Card Skeleton
export function SkeletonCard({ lines = 3 }: { lines?: number }) {
  return (
    <div className="card">
      <div className="card-header">
        <div className="flex items-center gap-3">
          <Skeleton variant="circular" width={48} height={48} />
          <div className="flex-1 space-y-2">
            <Skeleton width="60%" height={20} />
            <Skeleton width="40%" height={16} />
          </div>
        </div>
      </div>
      <div className="card-body space-y-3">
        {Array.from({ length: lines }).map((_, i) => (
          <div key={i} className="flex justify-between">
            <Skeleton width="30%" />
            <Skeleton width="20%" />
          </div>
        ))}
      </div>
    </div>
  )
}

// Stat Card Skeleton
export function SkeletonStatCard() {
  return (
    <div className="stat-card">
      <div className="flex items-start justify-between">
        <div className="flex-1 space-y-2">
          <Skeleton width="60%" height={12} />
          <Skeleton width="40%" height={28} />
        </div>
        <Skeleton variant="circular" width={48} height={48} className="shrink-0" />
      </div>
      <div className="mt-4">
        <Skeleton width="50%" height={14} />
      </div>
    </div>
  )
}

// Table Row Skeleton
export function SkeletonTableRow({ columns = 4 }: { columns?: number }) {
  return (
    <tr>
      {Array.from({ length: columns }).map((_, i) => (
        <td key={i} className="p-4">
          <Skeleton />
        </td>
      ))}
    </tr>
  )
}

// List Item Skeleton
export function SkeletonListItem() {
  return (
    <div className="flex items-center gap-3 p-4 border-b border-gray-200">
      <Skeleton variant="circular" width={40} height={40} />
      <div className="flex-1 space-y-2">
        <Skeleton width="70%" />
        <Skeleton width="40%" />
      </div>
      <Skeleton width={80} height={32} />
    </div>
  )
}

// Pagamento Card Skeleton
export function SkeletonPagamentoCard() {
  return (
    <div className="card">
      <div className="card-header">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 flex-1">
            <Skeleton variant="circular" width={40} height={40} />
            <div className="flex-1 space-y-2">
              <Skeleton width="50%" height={20} />
              <Skeleton width="30%" height={16} />
            </div>
          </div>
          <Skeleton width={80} height={24} />
        </div>
      </div>
      <div className="card-body space-y-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="flex justify-between">
            <Skeleton width="35%" />
            <Skeleton width="25%" />
          </div>
        ))}
      </div>
      <div className="card-footer">
        <div className="flex gap-2 justify-end">
          <Skeleton width={100} height={36} />
          <Skeleton width={100} height={36} />
        </div>
      </div>
    </div>
  )
}

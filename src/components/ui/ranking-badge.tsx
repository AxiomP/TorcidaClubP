'use client'

import { cn } from '@/lib/utils/cn'
import { Medal, Award, Trophy } from 'lucide-react'

export type RankingType = 'bronze' | 'prata' | 'ouro'

interface RankingBadgeProps {
  ranking: RankingType
  showLabel?: boolean
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

const rankingConfig: Record<RankingType, {
  label: string
  bgColor: string
  textColor: string
  borderColor: string
  icon: typeof Medal
}> = {
  bronze: {
    label: 'Bronze',
    bgColor: 'bg-amber-700/20',
    textColor: 'text-amber-700',
    borderColor: 'border-amber-700/30',
    icon: Medal,
  },
  prata: {
    label: 'Prata',
    bgColor: 'bg-gray-400/20',
    textColor: 'text-gray-500',
    borderColor: 'border-gray-400/30',
    icon: Award,
  },
  ouro: {
    label: 'Ouro',
    bgColor: 'bg-yellow-500/20',
    textColor: 'text-yellow-600',
    borderColor: 'border-yellow-500/30',
    icon: Trophy,
  },
}

const sizeConfig = {
  sm: {
    badge: 'px-2 py-0.5 text-xs',
    icon: 'h-3 w-3',
  },
  md: {
    badge: 'px-2.5 py-1 text-sm',
    icon: 'h-4 w-4',
  },
  lg: {
    badge: 'px-3 py-1.5 text-base',
    icon: 'h-5 w-5',
  },
}

export function RankingBadge({
  ranking,
  showLabel = true,
  size = 'md',
  className,
}: RankingBadgeProps) {
  const config = rankingConfig[ranking]
  const sizes = sizeConfig[size]
  const Icon = config.icon

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 font-medium rounded-full border',
        config.bgColor,
        config.textColor,
        config.borderColor,
        sizes.badge,
        className
      )}
    >
      <Icon className={sizes.icon} />
      {showLabel && config.label}
    </span>
  )
}

// Helper para exibir o badge de ranking mínimo de eventos
export function RankingMinimoEventoBadge({
  rankingMinimo,
  size = 'sm',
}: {
  rankingMinimo: RankingType | null
  size?: 'sm' | 'md' | 'lg'
}) {
  if (!rankingMinimo) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-full bg-green-500/20 text-green-600 border border-green-500/30">
        Todos os Sócios
      </span>
    )
  }

  return (
    <span className="inline-flex items-center gap-1 text-xs">
      <span className="text-muted-foreground">Exclusivo:</span>
      <RankingBadge ranking={rankingMinimo} size={size} />
    </span>
  )
}

import React from 'react'
import { LucideIcon, TrendingUp, TrendingDown } from 'lucide-react'
import { cn } from '@/lib/utils/cn'

interface StatCardProps {
  icon: LucideIcon
  iconColor?: string
  iconBgColor?: string
  value: string | number
  label: string
  trend?: {
    value: string | number
    isPositive?: boolean
    label?: string
  }
  className?: string
}

export function StatCard({
  icon: Icon,
  iconColor = 'text-gray-600',
  iconBgColor = 'bg-gray-100',
  value,
  label,
  trend,
  className,
}: StatCardProps) {
  return (
    <div className={cn('stat-card', className)}>
      {/* Layout: Label e valor à esquerda, ícone à direita */}
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <div className="stat-card-label">{label}</div>
          <div className="stat-card-value">{value}</div>
        </div>

        <div className={cn('stat-card-icon shrink-0', iconBgColor)}>
          <Icon className={cn('w-6 h-6', iconColor)} />
        </div>
      </div>

      {trend && (
        <div
          className={cn(
            'stat-card-trend mt-2',
            trend.isPositive ? 'stat-card-trend-up' : 'stat-card-trend-down'
          )}
        >
          {trend.isPositive ? (
            <TrendingUp className="w-4 h-4" />
          ) : (
            <TrendingDown className="w-4 h-4" />
          )}
          <span>
            {trend.value}{trend.label ? ` ${trend.label}` : ''}
          </span>
        </div>
      )}
    </div>
  )
}

// Card específico para valores monetários
interface MoneyStatCardProps {
  icon: LucideIcon
  iconColor?: string
  iconBgColor?: string
  value: number
  label: string
  trend?: number
  trendLabel?: string
  className?: string
}

export function MoneyStatCard({
  value,
  trend,
  trendLabel,
  ...props
}: MoneyStatCardProps) {
  const formattedValue = new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value)

  const formattedTrend = trend !== undefined
    ? {
        value: trend > 0 ? `+${trend.toFixed(1)}%` : `${trend.toFixed(1)}%`,
        isPositive: trend >= 0,
        label: trendLabel,
      }
    : undefined

  return <StatCard {...props} value={formattedValue} trend={formattedTrend} />
}

// Card específico para contadores
interface CountStatCardProps {
  icon: LucideIcon
  iconColor?: string
  iconBgColor?: string
  value: number
  label: string
  trend?: number
  trendLabel?: string
  suffix?: string
  className?: string
}

export function CountStatCard({
  value,
  trend,
  trendLabel,
  suffix,
  ...props
}: CountStatCardProps) {
  // Adicionar suffix ao valor se fornecido (ex: "85%")
  const displayValue = suffix ? `${value}${suffix}` : value

  const formattedTrend = trend !== undefined
    ? {
        value: trend > 0 ? `+${trend.toFixed(1)}%` : `${trend.toFixed(1)}%`,
        isPositive: trend >= 0,
        label: trendLabel,
      }
    : undefined

  return <StatCard {...props} value={displayValue} trend={formattedTrend} />
}

/**
 * VelocityMetrics Component
 * 
 * Displays VERA velocity metrics in animated cards:
 * - Revenue Protected (in millions)
 * - Days Saved
 * - Auto-Clear Rate
 * - Pending Seals
 */

import React, { useEffect, useState } from 'react'
import { 
  DollarSign, 
  Clock, 
  Zap, 
  FileCheck,
  TrendingUp,
  TrendingDown,
  Minus,
  RefreshCw
} from 'lucide-react'
import type { VelocityMetrics as VelocityMetricsType } from '../../services/vera/veraDashboardService'

interface VelocityMetricsProps {
  metrics: VelocityMetricsType | null
  isLoading?: boolean
  onRefresh?: () => void
  className?: string
}

interface MetricCardProps {
  label: string
  value: string | number
  subValue?: string
  icon: React.ReactNode
  trend?: {
    value: number
    direction: 'up' | 'down' | 'neutral'
    label?: string
  }
  color: 'emerald' | 'blue' | 'purple' | 'amber' | 'rose'
  isLoading?: boolean
  animationDelay?: number
}

const colorClasses = {
  emerald: {
    bg: 'bg-gradient-to-br from-emerald-500 to-teal-600',
    light: 'bg-emerald-50',
    text: 'text-emerald-600',
    ring: 'ring-emerald-500/20'
  },
  blue: {
    bg: 'bg-gradient-to-br from-blue-500 to-indigo-600',
    light: 'bg-blue-50',
    text: 'text-blue-600',
    ring: 'ring-blue-500/20'
  },
  purple: {
    bg: 'bg-gradient-to-br from-purple-500 to-violet-600',
    light: 'bg-purple-50',
    text: 'text-purple-600',
    ring: 'ring-purple-500/20'
  },
  amber: {
    bg: 'bg-gradient-to-br from-amber-500 to-orange-600',
    light: 'bg-amber-50',
    text: 'text-amber-600',
    ring: 'ring-amber-500/20'
  },
  rose: {
    bg: 'bg-gradient-to-br from-rose-500 to-pink-600',
    light: 'bg-rose-50',
    text: 'text-rose-600',
    ring: 'ring-rose-500/20'
  }
}

function MetricCard({ 
  label, 
  value, 
  subValue, 
  icon, 
  trend, 
  color, 
  isLoading,
  animationDelay = 0 
}: MetricCardProps) {
  const [isVisible, setIsVisible] = useState(false)
  const [displayValue, setDisplayValue] = useState<string | number>(0)
  const colors = colorClasses[color]

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), animationDelay)
    return () => clearTimeout(timer)
  }, [animationDelay])

  // Animate number counting up
  useEffect(() => {
    if (isLoading || !isVisible) {
      setDisplayValue(0)
      return
    }

    const numValue = typeof value === 'string' ? parseFloat(value.replace(/[^0-9.-]/g, '')) : value
    if (isNaN(numValue)) {
      setDisplayValue(value)
      return
    }

    const duration = 1000
    const steps = 30
    const increment = numValue / steps
    let current = 0
    let step = 0

    const timer = setInterval(() => {
      step++
      current += increment
      if (step >= steps) {
        setDisplayValue(value)
        clearInterval(timer)
      } else {
        // Format appropriately
        if (typeof value === 'string' && value.includes('$')) {
          setDisplayValue(`$${current.toFixed(2)}M`)
        } else if (typeof value === 'string' && value.includes('%')) {
          setDisplayValue(`${Math.round(current)}%`)
        } else {
          setDisplayValue(Math.round(current))
        }
      }
    }, duration / steps)

    return () => clearInterval(timer)
  }, [value, isLoading, isVisible])

  return (
    <div 
      className={`
        relative overflow-hidden rounded-none bg-white border border-slate-200 shadow-sm
        transition-all duration-500 ease-out
        hover:shadow-lg hover:scale-[1.02] hover:border-slate-300
        ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}
      `}
    >
      {/* Gradient accent bar */}
      <div className={`absolute top-0 left-0 right-0 h-1 ${colors.bg}`} />
      
      <div className="p-6">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
              {label}
            </p>
            
            <div className="flex items-baseline gap-2">
              <span className={`text-3xl font-bold text-slate-900 tabular-nums ${isLoading ? 'animate-pulse' : ''}`}>
                {isLoading ? '—' : displayValue}
              </span>
              {subValue && (
                <span className="text-sm text-slate-500">{subValue}</span>
              )}
            </div>

            {trend && !isLoading && (
              <div className="mt-3 flex items-center gap-1.5">
                {trend.direction === 'up' && (
                  <TrendingUp className="w-4 h-4 text-emerald-500" />
                )}
                {trend.direction === 'down' && (
                  <TrendingDown className="w-4 h-4 text-rose-500" />
                )}
                {trend.direction === 'neutral' && (
                  <Minus className="w-4 h-4 text-slate-400" />
                )}
                <span className={`text-xs font-medium ${
                  trend.direction === 'up' ? 'text-emerald-600' :
                  trend.direction === 'down' ? 'text-rose-600' :
                  'text-slate-500'
                }`}>
                  {trend.value > 0 ? '+' : ''}{trend.value}%
                </span>
                {trend.label && (
                  <span className="text-xs text-slate-400">{trend.label}</span>
                )}
              </div>
            )}
          </div>

          <div className={`p-3 rounded-none ${colors.light} ${colors.ring} ring-4`}>
            <div className={colors.text}>
              {icon}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export function VelocityMetrics({ 
  metrics, 
  isLoading = false, 
  onRefresh,
  className = '' 
}: VelocityMetricsProps) {
  return (
    <div className={className}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-lg font-bold text-slate-900">Velocity Metrics</h2>
          <p className="text-sm text-slate-500">Real-time governance performance</p>
        </div>
        {onRefresh && (
          <button
            onClick={onRefresh}
            disabled={isLoading}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-none transition-colors disabled:opacity-50"
            title="Refresh metrics"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        )}
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          label="Revenue Protected"
          value={metrics ? `$${metrics.revenueProtected.toFixed(2)}M` : '—'}
          subValue="this quarter"
          icon={<DollarSign className="w-5 h-5" />}
          trend={{ value: 12, direction: 'up', label: 'vs last quarter' }}
          color="emerald"
          isLoading={isLoading}
          animationDelay={0}
        />
        
        <MetricCard
          label="Days Saved"
          value={metrics?.daysSaved ?? '—'}
          subValue="cumulative"
          icon={<Clock className="w-5 h-5" />}
          trend={{ value: 8, direction: 'up', label: 'vs last month' }}
          color="blue"
          isLoading={isLoading}
          animationDelay={100}
        />
        
        <MetricCard
          label="Auto-Clear Rate"
          value={metrics ? `${metrics.autoClearRate}%` : '—'}
          subValue="of decisions"
          icon={<Zap className="w-5 h-5" />}
          trend={{ value: metrics?.autoClearRate ? (metrics.autoClearRate > 90 ? 5 : -2) : 0, direction: metrics?.autoClearRate && metrics.autoClearRate > 90 ? 'up' : 'neutral' }}
          color="purple"
          isLoading={isLoading}
          animationDelay={200}
        />
        
        <MetricCard
          label="Pending Seals"
          value={metrics?.pendingSeals ?? '—'}
          subValue="awaiting review"
          icon={<FileCheck className="w-5 h-5" />}
          trend={metrics?.pendingSeals && metrics.pendingSeals > 5 
            ? { value: metrics.pendingSeals, direction: 'down' as const }
            : { value: 0, direction: 'neutral' as const }
          }
          color={metrics?.pendingSeals && metrics.pendingSeals > 10 ? 'rose' : 'amber'}
          isLoading={isLoading}
          animationDelay={300}
        />
      </div>
    </div>
  )
}

export default VelocityMetrics


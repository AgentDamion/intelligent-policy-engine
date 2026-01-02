/**
 * ComplianceScoreCard Component
 * 
 * Displays compliance metrics with visual indicators:
 * - Overall compliance score (circular gauge)
 * - Policy adherence
 * - Audit completeness
 * - Tool approval rate
 * - 7-day and 30-day trends
 */

import React, { useEffect, useState } from 'react'
import {
  Shield,
  TrendingUp,
  TrendingDown,
  Minus,
  FileText,
  CheckCircle,
  AlertCircle,
  RefreshCw,
  Info
} from 'lucide-react'
import type { ComplianceScore } from '../../services/vera/veraDashboardService'

interface ComplianceScoreCardProps {
  score: ComplianceScore | null
  isLoading?: boolean
  onRefresh?: () => void
  className?: string
}

interface CircularProgressProps {
  value: number
  size?: number
  strokeWidth?: number
  color?: string
  backgroundColor?: string
  showLabel?: boolean
  animated?: boolean
}

function CircularProgress({
  value,
  size = 120,
  strokeWidth = 10,
  color = '#8b5cf6',
  backgroundColor = '#e2e8f0',
  showLabel = true,
  animated = true
}: CircularProgressProps) {
  const [displayValue, setDisplayValue] = useState(0)
  const radius = (size - strokeWidth) / 2
  const circumference = radius * 2 * Math.PI
  const offset = circumference - (displayValue / 100) * circumference

  useEffect(() => {
    if (!animated) {
      setDisplayValue(value)
      return
    }

    const duration = 1000
    const steps = 50
    const increment = value / steps
    let current = 0
    let step = 0

    const timer = setInterval(() => {
      step++
      current += increment
      if (step >= steps) {
        setDisplayValue(value)
        clearInterval(timer)
      } else {
        setDisplayValue(Math.round(current))
      }
    }, duration / steps)

    return () => clearInterval(timer)
  }, [value, animated])

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg width={size} height={size} className="transform -rotate-90">
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={backgroundColor}
          strokeWidth={strokeWidth}
        />
        {/* Progress circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="transition-all duration-1000 ease-out"
        />
      </svg>
      {showLabel && (
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-3xl font-bold text-slate-900">{displayValue}</span>
          <span className="text-xs text-slate-500">/ 100</span>
        </div>
      )}
    </div>
  )
}

interface MetricRowProps {
  label: string
  value: number
  icon: React.ReactNode
  color: string
}

function MetricRow({ label, value, icon, color }: MetricRowProps) {
  const [displayValue, setDisplayValue] = useState(0)

  useEffect(() => {
    const duration = 800
    const steps = 30
    const increment = value / steps
    let current = 0
    let step = 0

    const timer = setInterval(() => {
      step++
      current += increment
      if (step >= steps) {
        setDisplayValue(value)
        clearInterval(timer)
      } else {
        setDisplayValue(Math.round(current))
      }
    }, duration / steps)

    return () => clearInterval(timer)
  }, [value])

  return (
    <div className="flex items-center justify-between py-3">
      <div className="flex items-center gap-3">
        <div className={`p-1.5 rounded-none ${color}`}>
          {icon}
        </div>
        <span className="text-sm text-slate-600">{label}</span>
      </div>
      <div className="flex items-center gap-2">
        <div className="w-24 h-2 bg-slate-100 rounded-full overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-purple-500 to-violet-500 rounded-full transition-all duration-1000 ease-out"
            style={{ width: `${displayValue}%` }}
          />
        </div>
        <span className="text-sm font-semibold text-slate-900 w-10 text-right tabular-nums">
          {displayValue}%
        </span>
      </div>
    </div>
  )
}

function TrendBadge({ value, label }: { value: number; label: string }) {
  const isPositive = value > 0
  const isNeutral = value === 0

  return (
    <div className={`
      flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium
      ${isPositive ? 'bg-emerald-50 text-emerald-700' :
        isNeutral ? 'bg-slate-100 text-slate-600' :
        'bg-rose-50 text-rose-700'}
    `}>
      {isPositive && <TrendingUp className="w-3 h-3" />}
      {isNeutral && <Minus className="w-3 h-3" />}
      {!isPositive && !isNeutral && <TrendingDown className="w-3 h-3" />}
      <span>{isPositive ? '+' : ''}{value}%</span>
      <span className="text-slate-400 ml-0.5">{label}</span>
    </div>
  )
}

function getScoreColor(score: number): string {
  if (score >= 90) return '#10b981' // emerald-500
  if (score >= 75) return '#8b5cf6' // violet-500
  if (score >= 60) return '#f59e0b' // amber-500
  return '#ef4444' // red-500
}

function getScoreLabel(score: number): { text: string; color: string } {
  if (score >= 90) return { text: 'Excellent', color: 'text-emerald-600' }
  if (score >= 75) return { text: 'Good', color: 'text-violet-600' }
  if (score >= 60) return { text: 'Fair', color: 'text-amber-600' }
  return { text: 'Needs Attention', color: 'text-rose-600' }
}

export function ComplianceScoreCard({
  score,
  isLoading = false,
  onRefresh,
  className = ''
}: ComplianceScoreCardProps) {
  const scoreLabel = score ? getScoreLabel(score.overall) : null

  return (
    <div className={`bg-white rounded-none border border-slate-200 shadow-sm ${className}`}>
      {/* Header */}
      <div className="px-6 py-4 border-b border-slate-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-none bg-violet-50 ring-4 ring-violet-500/10">
              <Shield className="w-5 h-5 text-violet-600" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Compliance Score</h3>
              <p className="text-xs text-slate-500">Governance health overview</p>
            </div>
          </div>
          {onRefresh && (
            <button
              onClick={onRefresh}
              disabled={isLoading}
              className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-none transition-colors disabled:opacity-50"
              title="Refresh score"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-8">
            <div className="w-28 h-28 rounded-full bg-slate-100 animate-pulse" />
            <div className="h-4 w-20 bg-slate-100 rounded mt-4 animate-pulse" />
          </div>
        ) : score ? (
          <>
            {/* Main Score */}
            <div className="flex flex-col items-center mb-6">
              <CircularProgress
                value={score.overall}
                size={140}
                strokeWidth={12}
                color={getScoreColor(score.overall)}
              />
              <div className="mt-4 text-center">
                <span className={`text-lg font-bold ${scoreLabel?.color}`}>
                  {scoreLabel?.text}
                </span>
              </div>

              {/* Trends */}
              <div className="flex gap-3 mt-4">
                <TrendBadge value={score.trend7d} label="7d" />
                <TrendBadge value={score.trend30d} label="30d" />
              </div>
            </div>

            {/* Score Breakdown */}
            <div className="border-t border-slate-100 pt-4">
              <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
                Score Breakdown
              </h4>
              <div className="divide-y divide-slate-100">
                <MetricRow
                  label="Policy Adherence"
                  value={score.policyAdherence}
                  icon={<FileText className="w-4 h-4 text-blue-600" />}
                  color="bg-blue-50"
                />
                <MetricRow
                  label="Audit Completeness"
                  value={score.auditCompleteness}
                  icon={<CheckCircle className="w-4 h-4 text-emerald-600" />}
                  color="bg-emerald-50"
                />
                <MetricRow
                  label="Tool Approval Rate"
                  value={score.toolApprovalRate}
                  icon={<Shield className="w-4 h-4 text-violet-600" />}
                  color="bg-violet-50"
                />
              </div>
            </div>

            {/* Alert if score is low */}
            {score.overall < 75 && (
              <div className="mt-4 p-3 rounded-none bg-amber-50 border border-amber-200">
                <div className="flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
                  <div className="text-xs text-amber-700">
                    <p className="font-medium">Attention needed</p>
                    <p className="mt-0.5 text-amber-600">
                      Your compliance score is below target. Review pending items to improve.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="py-12 text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-slate-100 flex items-center justify-center">
              <Info className="w-8 h-8 text-slate-300" />
            </div>
            <p className="text-sm font-medium text-slate-600">No data available</p>
            <p className="text-xs text-slate-400 mt-1">Compliance data will appear here</p>
          </div>
        )}
      </div>
    </div>
  )
}

export default ComplianceScoreCard


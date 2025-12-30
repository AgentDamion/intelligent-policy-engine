import React from 'react'
import { EdgeCard } from '../ui/edge-card'
import { StatusBadge } from '../ui/status-badge'

interface WorkflowStepIndicatorProps {
  currentStep: number
  totalSteps: number
  stepName: string
  variant?: 'current' | 'completed' | 'pending'
}

export function WorkflowStepIndicator({
  currentStep,
  totalSteps,
  stepName,
  variant = 'current',
}: WorkflowStepIndicatorProps) {
  const getEdgeColor = () => {
    switch (variant) {
      case 'current':
        return 'border-l-aicomplyr-yellow'
      case 'completed':
        return 'border-l-aicomplyr-black'
      case 'pending':
        return 'border-l-neutral-300'
      default:
        return 'border-l-neutral-300'
    }
  }

  const getStepLabel = () => {
    if (variant === 'completed') {
      return 'Completed'
    }
    if (variant === 'current') {
      return `Step ${currentStep} of ${totalSteps}`
    }
    return `Pending`
  }

  return (
    <EdgeCard variant={variant === 'current' ? 'selected' : variant === 'completed' ? 'default' : 'default'}>
      <div className={`p-2 border-l-4 ${getEdgeColor()}`}>
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <div className="text-xs font-semibold uppercase tracking-wider text-neutral-500 mb-1">
              {getStepLabel()}
            </div>
            <div className="text-sm font-semibold text-neutral-800">{stepName}</div>
          </div>
          {variant === 'current' && (
            <StatusBadge variant="conditional" className="text-xs">
              Active
            </StatusBadge>
          )}
        </div>
      </div>
    </EdgeCard>
  )
}


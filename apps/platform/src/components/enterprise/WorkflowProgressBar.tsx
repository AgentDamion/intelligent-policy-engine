import React from 'react'

interface WorkflowProgressBarProps {
  currentStep: number
  totalSteps: number
  stepName: string
  estimatedTimeRemaining?: number
}

export function WorkflowProgressBar({
  currentStep,
  totalSteps,
  stepName,
  estimatedTimeRemaining,
}: WorkflowProgressBarProps) {
  const progressPercentage = (currentStep / totalSteps) * 100

  const formatTimeRemaining = (hours?: number) => {
    if (!hours) return null
    if (hours < 1) return '< 1 hour'
    if (hours < 24) return `${Math.round(hours)} hours`
    const days = Math.floor(hours / 24)
    const remainingHours = Math.round(hours % 24)
    if (days === 0) return `${remainingHours} hours`
    if (remainingHours === 0) return `${days} day${days > 1 ? 's' : ''}`
    return `${days}d ${remainingHours}h`
  }

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-xs">
        <span className="font-semibold text-neutral-700">
          Step {currentStep} of {totalSteps}: {stepName}
        </span>
        {estimatedTimeRemaining && (
          <span className="text-neutral-500">{formatTimeRemaining(estimatedTimeRemaining)} remaining</span>
        )}
      </div>
      <div className="w-full bg-neutral-200 h-2 border border-neutral-300">
        <div
          className="h-full bg-aicomplyr-yellow transition-all duration-300"
          style={{ width: `${progressPercentage}%` }}
        />
      </div>
    </div>
  )
}


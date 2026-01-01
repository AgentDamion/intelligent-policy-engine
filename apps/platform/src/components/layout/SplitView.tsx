import React from 'react'

export interface SplitViewProps {
  left: React.ReactNode
  main: React.ReactNode
  right?: React.ReactNode
  className?: string
  leftClassName?: string
  mainClassName?: string
  rightClassName?: string
}

/**
 * Standard enterprise operations layout:
 * - Left: list (scanable)
 * - Main: detail (high-signal)
 * - Right: optional context rail
 *
 * The shell (`Layout.tsx`) should be the primary scroll parent.
 * SplitView itself should avoid nested scrolling unless intentional per-pane.
 */
export default function SplitView({
  left,
  main,
  right,
  className = '',
  leftClassName = '',
  mainClassName = '',
  rightClassName = '',
}: SplitViewProps) {
  return (
    <div className={`flex w-full min-h-[calc(100vh-56px-72px)] ${className}`}>
      <div className={`w-full md:w-[380px] flex-shrink-0 ${leftClassName}`}>{left}</div>
      <div className={`flex-1 min-w-0 ${mainClassName}`}>{main}</div>
      {right && <div className={`hidden xl:block w-[320px] flex-shrink-0 ${rightClassName}`}>{right}</div>}
    </div>
  )
}










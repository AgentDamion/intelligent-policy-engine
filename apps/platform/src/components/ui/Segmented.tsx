import React, { useEffect, useRef } from 'react'

export interface SegmentedItem {
  key: string
  label: string
}

export interface SegmentedProps {
  items: SegmentedItem[]
  value: string
  onChange: (key: string) => void
  ariaLabel?: string
  className?: string
}

export const Segmented: React.FC<SegmentedProps> = ({ items, value, onChange, ariaLabel, className = '' }) => {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLElement && containerRef.current?.contains(e.target)) {
        const currentIndex = items.findIndex(item => item.key === value)

        if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
          e.preventDefault()
          const newIndex = currentIndex > 0 ? currentIndex - 1 : items.length - 1
          onChange(items[newIndex].key)
        } else if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
          e.preventDefault()
          const newIndex = currentIndex < items.length - 1 ? currentIndex + 1 : 0
          onChange(items[newIndex].key)
        }
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [items, value, onChange])

  return (
    <div
      ref={containerRef}
      className={`inline-flex rounded-none bg-gray-100 p-1 ${className}`}
      role="tablist"
      aria-label={ariaLabel}
    >
      {items.map((item) => {
        const isActive = item.key === value
        return (
          <button
            key={item.key}
            onClick={() => onChange(item.key)}
            className={`
              relative inline-flex items-center justify-center rounded-none px-3 py-1.5
              text-sm font-medium transition-all focus:outline-none focus:ring-2
              focus:ring-offset-2 focus:ring-blue-500
              ${isActive ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'}
            `}
            role="tab"
            aria-selected={isActive}
            aria-controls={`${item.key}-panel`}
            id={`${item.key}-tab`}
            tabIndex={isActive ? 0 : -1}
          >
            {item.label}
          </button>
        )
      })}
    </div>
  )
}


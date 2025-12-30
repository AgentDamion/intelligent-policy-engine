import React from 'react'
import { EdgeCard, EdgeCardBody } from '../ui/edge-card'

interface VisibilityLevelSelectorProps {
  value: 'role_only' | 'person_level' | 'full_detail'
  onChange: (level: 'role_only' | 'person_level' | 'full_detail') => void
  msaReference?: string
  onMSAReferenceChange?: (reference: string) => void
  effectiveDate?: string
  onEffectiveDateChange?: (date: string) => void
  expirationDate?: string
  onExpirationDateChange?: (date: string) => void
}

const LEVEL_DESCRIPTIONS = {
  role_only: {
    title: 'Role Only',
    description: 'Enterprise sees only role titles (e.g., "Creative Director"). Most private option.',
    example: 'Creative Director',
  },
  person_level: {
    title: 'Person Level',
    description: 'Enterprise sees person names but not roles or internal processes.',
    example: 'Sarah Chen',
  },
  full_detail: {
    title: 'Full Detail',
    description: 'Full transparency including name, role, and email. Most transparent option.',
    example: 'Sarah Chen (Creative Director) - sarah@agency.com',
  },
}

export function VisibilityLevelSelector({
  value,
  onChange,
  msaReference,
  onMSAReferenceChange,
  effectiveDate,
  onEffectiveDateChange,
  expirationDate,
  onExpirationDateChange,
}: VisibilityLevelSelectorProps) {
  return (
    <EdgeCard>
      <EdgeCardBody>
        <div className="space-y-6">
          {/* Visibility Level Selection */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-500 mb-3">
              Default Visibility Level
            </label>
            <div className="space-y-3">
              {(['role_only', 'person_level', 'full_detail'] as const).map((level) => {
                const info = LEVEL_DESCRIPTIONS[level]
                const isSelected = value === level

                return (
                  <label
                    key={level}
                    className={`flex items-start gap-3 p-4 border-2 cursor-pointer transition-colors ${
                      isSelected
                        ? 'border-l-4 border-l-aicomplyr-yellow bg-yellow-50'
                        : 'border-neutral-300 bg-white hover:bg-neutral-50'
                    }`}
                  >
                    <input
                      type="radio"
                      name="visibility_level"
                      value={level}
                      checked={isSelected}
                      onChange={() => onChange(level)}
                      className="mt-1 accent-aicomplyr-black"
                    />
                    <div className="flex-1">
                      <div className="font-semibold text-aicomplyr-black mb-1">{info.title}</div>
                      <div className="text-sm text-neutral-600 mb-2">{info.description}</div>
                      <div className="text-xs text-neutral-500 font-mono bg-neutral-100 px-2 py-1 rounded">
                        Example: {info.example}
                      </div>
                    </div>
                  </label>
                )
              })}
            </div>
          </div>

          {/* MSA Reference */}
          {onMSAReferenceChange && (
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-500 mb-2">
                MSA Reference (Optional)
              </label>
              <input
                type="text"
                value={msaReference || ''}
                onChange={(e) => onMSAReferenceChange(e.target.value)}
                placeholder="e.g., MSA-2024-001"
                className="w-full px-4 py-2 border border-neutral-300 bg-white text-sm"
              />
            </div>
          )}

          {/* Dates */}
          <div className="grid grid-cols-2 gap-4">
            {onEffectiveDateChange && (
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-500 mb-2">
                  Effective Date (Optional)
                </label>
                <input
                  type="date"
                  value={effectiveDate || ''}
                  onChange={(e) => onEffectiveDateChange(e.target.value)}
                  className="w-full px-4 py-2 border border-neutral-300 bg-white text-sm"
                />
              </div>
            )}
            {onExpirationDateChange && (
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-500 mb-2">
                  Expiration Date (Optional)
                </label>
                <input
                  type="date"
                  value={expirationDate || ''}
                  onChange={(e) => onExpirationDateChange(e.target.value)}
                  className="w-full px-4 py-2 border border-neutral-300 bg-white text-sm"
                />
              </div>
            )}
          </div>
        </div>
      </EdgeCardBody>
    </EdgeCard>
  )
}


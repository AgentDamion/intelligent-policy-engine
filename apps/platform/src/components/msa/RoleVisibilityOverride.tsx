import React from 'react'
import { EdgeCard, EdgeCardHeader, EdgeCardBody } from '../ui/edge-card'
import { AICOMPLYRButton } from '../ui/aicomplyr-button'
import { X, User } from 'lucide-react'
import { useRoleArchetypes } from '../../hooks/useRoleArchetypes'

interface RoleVisibilityOverrideProps {
  overrides: Record<string, 'role_only' | 'person_level' | 'full_detail'>
  onOverrideChange: (roleId: string, level: 'role_only' | 'person_level' | 'full_detail' | null) => void
}

export function RoleVisibilityOverride({ overrides, onOverrideChange }: RoleVisibilityOverrideProps) {
  const { archetypes, loading } = useRoleArchetypes()

  const getOverrideLevel = (roleId: string): 'role_only' | 'person_level' | 'full_detail' | null => {
    return overrides[roleId] || null
  }

  if (loading) {
    return (
      <EdgeCard>
        <EdgeCardBody>
          <div className="animate-pulse space-y-3">
            <div className="h-4 bg-neutral-200 w-3/4"></div>
            <div className="h-4 bg-neutral-200 w-1/2"></div>
          </div>
        </EdgeCardBody>
      </EdgeCard>
    )
  }

  return (
    <EdgeCard>
      <EdgeCardHeader>
        <div className="flex items-center gap-2">
          <User className="w-5 h-5 text-neutral-400" />
          <h3 className="text-lg font-semibold text-aicomplyr-black">Role-Specific Overrides</h3>
        </div>
      </EdgeCardHeader>
      <EdgeCardBody>
        {archetypes.length === 0 ? (
          <div className="text-sm text-neutral-500">No role archetypes available</div>
        ) : (
          <div className="space-y-3">
            {archetypes.map((archetype) => {
              const currentOverride = getOverrideLevel(archetype.id)
              const hasOverride = currentOverride !== null

              return (
                <div
                  key={archetype.id}
                  className={`p-4 border-l-4 ${
                    hasOverride ? 'border-l-aicomplyr-yellow bg-yellow-50' : 'border-l-neutral-300 bg-white'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold text-aicomplyr-black">{archetype.name}</span>
                        {hasOverride && (
                          <span className="text-xs px-2 py-0.5 bg-aicomplyr-yellow text-aicomplyr-black font-semibold uppercase">
                            Override Active
                          </span>
                        )}
                      </div>
                      {archetype.description && (
                        <div className="text-xs text-neutral-500">{archetype.description}</div>
                      )}
                      {hasOverride ? (
                        <div className="text-sm text-neutral-600 mt-1">
                          Current: <span className="font-semibold capitalize">{currentOverride.replace('_', ' ')}</span>
                        </div>
                      ) : (
                        <div className="text-sm text-neutral-500 mt-1">Using default visibility level</div>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      {!hasOverride ? (
                        <select
                          value=""
                          onChange={(e) => {
                            if (e.target.value) {
                              onOverrideChange(archetype.id, e.target.value as any)
                            }
                          }}
                          className="px-3 py-1.5 border border-neutral-300 bg-white text-sm"
                        >
                          <option value="">Set Override...</option>
                          <option value="role_only">Role Only</option>
                          <option value="person_level">Person Level</option>
                          <option value="full_detail">Full Detail</option>
                        </select>
                      ) : (
                        <>
                          <select
                            value={currentOverride}
                            onChange={(e) => onOverrideChange(archetype.id, e.target.value as any)}
                            className="px-3 py-1.5 border border-neutral-300 bg-white text-sm"
                          >
                            <option value="role_only">Role Only</option>
                            <option value="person_level">Person Level</option>
                            <option value="full_detail">Full Detail</option>
                          </select>
                          <AICOMPLYRButton
                            variant="tertiary"
                            onClick={() => onOverrideChange(archetype.id, null)}
                            className="p-1"
                          >
                            <X className="w-4 h-4" />
                          </AICOMPLYRButton>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </EdgeCardBody>
    </EdgeCard>
  )
}


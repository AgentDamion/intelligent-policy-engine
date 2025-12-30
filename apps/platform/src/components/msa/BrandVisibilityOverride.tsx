import React from 'react'
import { EdgeCard, EdgeCardHeader, EdgeCardBody } from '../ui/edge-card'
import { AICOMPLYRButton } from '../ui/aicomplyr-button'
import { X, Package } from 'lucide-react'

interface Brand {
  id: string
  name: string
}

interface BrandVisibilityOverrideProps {
  brands: Brand[]
  overrides: Record<string, 'role_only' | 'person_level' | 'full_detail'>
  onOverrideChange: (brandId: string, level: 'role_only' | 'person_level' | 'full_detail' | null) => void
}

export function BrandVisibilityOverride({
  brands,
  overrides,
  onOverrideChange,
}: BrandVisibilityOverrideProps) {
  const getOverrideLevel = (brandId: string): 'role_only' | 'person_level' | 'full_detail' | null => {
    return overrides[brandId] || null
  }

  return (
    <EdgeCard>
      <EdgeCardHeader>
        <div className="flex items-center gap-2">
          <Package className="w-5 h-5 text-neutral-400" />
          <h3 className="text-lg font-semibold text-aicomplyr-black">Brand-Specific Overrides</h3>
        </div>
      </EdgeCardHeader>
      <EdgeCardBody>
        {brands.length === 0 ? (
          <div className="text-sm text-neutral-500">No brands available</div>
        ) : (
          <div className="space-y-3">
            {brands.map((brand) => {
              const currentOverride = getOverrideLevel(brand.id)
              const hasOverride = currentOverride !== null

              return (
                <div
                  key={brand.id}
                  className={`p-4 border-l-4 ${
                    hasOverride ? 'border-l-aicomplyr-yellow bg-yellow-50' : 'border-l-neutral-300 bg-white'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="font-semibold text-aicomplyr-black">{brand.name}</span>
                        {hasOverride && (
                          <span className="text-xs px-2 py-0.5 bg-aicomplyr-yellow text-aicomplyr-black font-semibold uppercase">
                            Override Active
                          </span>
                        )}
                      </div>
                      {hasOverride ? (
                        <div className="text-sm text-neutral-600">
                          Current: <span className="font-semibold capitalize">{currentOverride.replace('_', ' ')}</span>
                        </div>
                      ) : (
                        <div className="text-sm text-neutral-500">Using default visibility level</div>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      {!hasOverride ? (
                        <select
                          value=""
                          onChange={(e) => {
                            if (e.target.value) {
                              onOverrideChange(brand.id, e.target.value as any)
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
                            onChange={(e) => onOverrideChange(brand.id, e.target.value as any)}
                            className="px-3 py-1.5 border border-neutral-300 bg-white text-sm"
                          >
                            <option value="role_only">Role Only</option>
                            <option value="person_level">Person Level</option>
                            <option value="full_detail">Full Detail</option>
                          </select>
                          <AICOMPLYRButton
                            variant="tertiary"
                            onClick={() => onOverrideChange(brand.id, null)}
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


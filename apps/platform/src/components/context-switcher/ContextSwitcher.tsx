/**
 * Enhanced Context Switcher Component
 * 
 * Dropdown component for switching between workspaces with:
 * - Workspace grouping by tenancy type
 * - Brand selector within workspace
 * - Boundary indicator visualization
 * - Compliance scores and pending counts
 * - Search/filter functionality
 * 
 * Follows edge-defined design system (4px borders, yellow selected, 0px radius)
 */

import React, { memo, useState, useCallback, Fragment, useMemo } from 'react'
import { Menu, Transition } from '@headlessui/react'
import {
  Building2,
  ChevronDown,
  Check,
  Briefcase,
  Loader2,
  AlertCircle,
  Search,
  X,
} from 'lucide-react'
import { useWorkspaceContext } from '@/contexts/WorkspaceContext'
import { cn } from '@/lib/utils'

// ============================================================
// TYPE DEFINITIONS
// ============================================================

interface ContextSwitcherProps {
  compact?: boolean
  onContextChange?: (workspaceId: string, brandId?: string) => void
}

// ============================================================
// SUB-COMPONENTS
// ============================================================

const WorkspaceIcon = memo(() => (
  <Briefcase className="w-4 h-4 text-aicomplyr-black" />
))
WorkspaceIcon.displayName = 'WorkspaceIcon'

const BrandIcon = memo(() => (
  <div className="w-2 h-2 bg-aicomplyr-yellow" />
))
BrandIcon.displayName = 'BrandIcon'

/**
 * Boundary Indicator Visualization
 * Shows: ○ Enterprise ─── ◉ ─── ● Partner
 */
const BoundaryIndicator = memo(({ 
  enterpriseName, 
  partnerName 
}: { 
  enterpriseName: string
  partnerName: string 
}) => (
  <div className="flex items-center gap-2 px-3 py-1.5 bg-neutral-50 border-l-structural border-l-aicomplyr-yellow">
    <span className="text-neutral-600 text-xs font-display">○</span>
    <span className="text-xs font-semibold text-aicomplyr-black uppercase tracking-wider">{enterpriseName}</span>
    <span className="text-aicomplyr-yellow text-xs tracking-[-2px]">───</span>
    <span className="text-aicomplyr-yellow text-sm font-bold">◉</span>
    <span className="text-aicomplyr-yellow text-xs tracking-[-2px]">───</span>
    <span className="text-neutral-600 text-xs font-display">●</span>
    <span className="text-xs font-semibold text-aicomplyr-black uppercase tracking-wider">{partnerName}</span>
  </div>
))
BoundaryIndicator.displayName = 'BoundaryIndicator'

/**
 * Compliance Metrics Display
 */
const ComplianceMetrics = memo(({ 
  score, 
  pending 
}: { 
  score?: number
  pending?: number 
}) => (
  <div className="flex items-center gap-3 text-xs text-neutral-500">
    {score !== undefined && (
      <span>
        Compliance: <span className="font-semibold text-aicomplyr-black">{score}%</span>
      </span>
    )}
    {pending !== undefined && pending > 0 && (
      <span>
        Pending: <span className="font-semibold text-status-escalated">{pending}</span>
      </span>
    )}
  </div>
))
ComplianceMetrics.displayName = 'ComplianceMetrics'

/**
 * Brand Selector (simple dropdown)
 */
const BrandSelector = memo(({ 
  brands, 
  selectedBrandId, 
  onSelect 
}: { 
  brands: Array<{ id: string; name: string }>
  selectedBrandId?: string
  onSelect: (brandId: string) => void
}) => {
  const [isOpen, setIsOpen] = useState(false)

  if (brands.length <= 1) return null

  return (
    <div className="relative">
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation()
          setIsOpen(!isOpen)
        }}
        className="flex items-center gap-1 px-2 py-1 text-xs text-neutral-600 hover:text-aicomplyr-black hover:bg-neutral-100 transition-colors"
      >
        <BrandIcon />
        <span className="font-semibold">
          {selectedBrandId 
            ? brands.find(b => b.id === selectedBrandId)?.name || 'All Brands'
            : 'All Brands'
          }
        </span>
        <ChevronDown className="w-3 h-3" />
      </button>
      {isOpen && (
        <div
          className="absolute left-0 mt-1 w-48 bg-white border-l-4 border-l-aicomplyr-black border border-neutral-200 z-50"
          onClick={(e) => e.stopPropagation()}
          onBlur={() => setIsOpen(false)}
        >
          <div className="p-1">
            {brands.map((brand) => (
              <button
                key={brand.id}
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  onSelect(brand.id)
                  setIsOpen(false)
                }}
                className={cn(
                  'w-full flex items-center gap-2 px-3 py-2 text-left text-xs transition-colors',
                  selectedBrandId === brand.id && 'bg-neutral-100 border-l-4 border-l-aicomplyr-yellow'
                )}
              >
                <BrandIcon />
                <span className={cn(
                  'flex-1',
                  selectedBrandId === brand.id ? 'font-semibold text-aicomplyr-black' : 'text-neutral-700'
                )}>
                  {brand.name}
                </span>
                {selectedBrandId === brand.id && (
                  <Check className="w-3 h-3 text-aicomplyr-yellow" />
                )}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
})
BrandSelector.displayName = 'BrandSelector'

// ============================================================
// MAIN COMPONENT
// ============================================================

export const ContextSwitcher = memo(({ compact = false, onContextChange }: ContextSwitcherProps) => {
  const {
    currentWorkspace,
    currentBrand,
    owningWorkspaces,
    sharedWorkspaces,
    boundaryContext,
    loading,
    error,
    switchToWorkspace,
    selectBrand,
  } = useWorkspaceContext()

  const [searchQuery, setSearchQuery] = useState('')
  const [isSwitching, setIsSwitching] = useState(false)

  // Filter workspaces by search query
  const filteredOwningWorkspaces = useMemo(() => {
    if (!searchQuery) return owningWorkspaces
    const query = searchQuery.toLowerCase()
    return owningWorkspaces.filter(
      w => w.name.toLowerCase().includes(query) || 
           w.enterpriseName.toLowerCase().includes(query)
    )
  }, [owningWorkspaces, searchQuery])

  const filteredSharedWorkspaces = useMemo(() => {
    if (!searchQuery) return sharedWorkspaces
    const query = searchQuery.toLowerCase()
    return sharedWorkspaces.filter(
      w => w.name.toLowerCase().includes(query) || 
           w.enterpriseName.toLowerCase().includes(query)
    )
  }, [sharedWorkspaces, searchQuery])

  const handleWorkspaceSwitch = useCallback(async (workspaceId: string, brandId?: string) => {
    setIsSwitching(true)
    try {
      await switchToWorkspace(workspaceId, brandId)
      onContextChange?.(workspaceId, brandId)
    } catch (err) {
      console.error('[ContextSwitcher] Error switching workspace:', err)
    } finally {
      setIsSwitching(false)
    }
  }, [switchToWorkspace, onContextChange])

  const handleBrandSelect = useCallback((brandId: string) => {
    selectBrand(brandId)
    if (currentWorkspace) {
      onContextChange?.(currentWorkspace.id, brandId)
    }
  }, [selectBrand, currentWorkspace, onContextChange])

  // Loading state
  if (loading) {
    return (
      <div className="flex items-center gap-2 px-3 py-2 bg-neutral-100 border-l-4 border-l-aicomplyr-black">
        <Loader2 className="w-4 h-4 animate-spin text-neutral-400" />
        <span className="text-sm text-neutral-500">Loading workspaces...</span>
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <div className="flex items-center gap-2 px-3 py-2 bg-red-50 border-l-4 border-l-status-denied">
        <AlertCircle className="w-4 h-4 text-status-denied" />
        <span className="text-sm text-status-denied">Error loading workspaces</span>
      </div>
    )
  }

  // Single workspace - no switcher needed
  const allWorkspaces = [...owningWorkspaces, ...sharedWorkspaces]
  if (allWorkspaces.length <= 1 && !boundaryContext) {
    return (
      <div className="flex items-center gap-2 px-3 py-2 bg-neutral-100 border-l-4 border-l-aicomplyr-black">
        <WorkspaceIcon />
        <span className="text-sm font-display text-aicomplyr-black">
          {currentWorkspace?.name || 'Workspace'}
        </span>
      </div>
    )
  }

  // Main dropdown
  return (
    <Menu as="div" className="relative">
      <Menu.Button
        className={cn(
          'flex items-center gap-2 px-3 py-2 bg-white border border-neutral-200',
          'hover:bg-neutral-100 hover:border-neutral-300',
          'transition-colors focus:outline-none focus:ring-2 focus:ring-aicomplyr-black focus:ring-offset-1',
          compact && 'text-sm'
        )}
        disabled={isSwitching}
      >
        {isSwitching ? (
          <Loader2 className="w-4 h-4 animate-spin text-aicomplyr-black" />
        ) : (
          <WorkspaceIcon />
        )}
        <span className="font-display text-sm text-aicomplyr-black max-w-[150px] truncate">
          {currentWorkspace?.name || 'Select Workspace'}
        </span>
        {currentBrand && (
          <span className="text-xs text-neutral-500 font-semibold">
            · {currentBrand.name}
          </span>
        )}
        <ChevronDown className="w-4 h-4 text-neutral-400" />
      </Menu.Button>

      <Transition
        as={Fragment}
        enter="transition ease-out duration-100"
        enterFrom="transform opacity-0 scale-95"
        enterTo="transform opacity-100 scale-100"
        leave="transition ease-in duration-75"
        leaveFrom="transform opacity-100 scale-100"
        leaveTo="transform opacity-0 scale-95"
      >
        <Menu.Items className="absolute left-0 mt-2 w-80 origin-top-left bg-white border-l-structural border-l-aicomplyr-black border border-neutral-200 focus:outline-none z-50 rounded-none shadow-xl">
          <div className="p-2">
            {/* Header */}
            <div className="px-3 py-2 text-[10px] font-bold uppercase tracking-widest text-neutral-400 border-b border-neutral-200 mb-2">
              Switch Workspace
            </div>

            {/* Search */}
            {allWorkspaces.length > 3 && (
              <div className="px-2 mb-2">
                <div className="relative">
                  <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                  <input
                    type="text"
                    placeholder="Search workspaces..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-8 pr-8 py-1.5 text-xs border border-neutral-200 focus:outline-none focus:ring-2 focus:ring-aicomplyr-black focus:border-transparent"
                    onClick={(e) => e.stopPropagation()}
                  />
                  {searchQuery && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        setSearchQuery('')
                      }}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-aicomplyr-black"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Boundary Indicator */}
            {boundaryContext && (
              <div className="px-2 mb-2">
                <BoundaryIndicator
                  enterpriseName={boundaryContext.enterpriseName}
                  partnerName={boundaryContext.partnerName || 'Partner'}
                />
              </div>
            )}

            {/* Workspace List */}
            <div className="space-y-1 max-h-96 overflow-y-auto">
              {/* Owning Workspaces */}
              {filteredOwningWorkspaces.length > 0 && (
                <>
                  <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest text-neutral-400">
                    Owning Tenants
                  </div>
                  {filteredOwningWorkspaces.map((workspace) => {
                    const isSelected = currentWorkspace?.id === workspace.id
                    return (
                      <Menu.Item key={workspace.id}>
                        {({ active }) => (
                          <div
                            className={cn(
                              'w-full',
                              active && 'bg-neutral-100',
                              isSelected && 'bg-neutral-100 border-l-4 border-l-aicomplyr-yellow'
                            )}
                          >
                            <div className="w-full flex flex-col">
                              <button
                                onClick={() => handleWorkspaceSwitch(workspace.id)}
                                className="w-full flex flex-col px-3 py-2.5 text-left transition-colors"
                              >
                                <div className="flex items-center gap-2">
                                  <WorkspaceIcon />
                                  <span className={cn(
                                    'font-display text-sm flex-1 truncate',
                                    isSelected ? 'text-aicomplyr-black' : 'text-neutral-700'
                                  )}>
                                    {workspace.name}
                                  </span>
                                  {isSelected && (
                                    <Check className="w-4 h-4 text-aicomplyr-yellow flex-shrink-0" />
                                  )}
                                </div>
                                <div className="mt-1 flex items-center justify-between">
                                  <span className="text-xs text-neutral-500">{workspace.enterpriseName}</span>
                                </div>
                                <ComplianceMetrics
                                  score={workspace.complianceScore}
                                  pending={workspace.pendingActions}
                                />
                              </button>
                              {workspace.brands && workspace.brands.length > 0 && (
                                <div className="px-3 pb-2" onClick={(e) => e.stopPropagation()}>
                                  <BrandSelector
                                    brands={workspace.brands}
                                    selectedBrandId={isSelected ? currentBrand?.id : undefined}
                                    onSelect={(brandId) => {
                                      handleWorkspaceSwitch(workspace.id, brandId)
                                    }}
                                  />
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </Menu.Item>
                    )
                  })}
                </>
              )}

              {/* Shared Workspaces */}
              {filteredSharedWorkspaces.length > 0 && (
                <>
                  <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest text-neutral-400 mt-2">
                    Shared Tenants
                  </div>
                  {filteredSharedWorkspaces.map((workspace) => {
                    const isSelected = currentWorkspace?.id === workspace.id
                    return (
                      <Menu.Item key={workspace.id}>
                        {({ active }) => (
                          <div
                            className={cn(
                              'w-full',
                              active && 'bg-neutral-100',
                              isSelected && 'bg-neutral-100 border-l-4 border-l-aicomplyr-yellow'
                            )}
                          >
                            <div className="w-full flex flex-col">
                              <button
                                onClick={() => handleWorkspaceSwitch(workspace.id)}
                                className="w-full flex flex-col px-3 py-2.5 text-left transition-colors"
                              >
                                <div className="flex items-center gap-2">
                                  <WorkspaceIcon />
                                  <span className={cn(
                                    'font-display text-sm flex-1 truncate',
                                    isSelected ? 'text-aicomplyr-black' : 'text-neutral-700'
                                  )}>
                                    {workspace.name}
                                  </span>
                                  {isSelected && (
                                    <Check className="w-4 h-4 text-aicomplyr-yellow flex-shrink-0" />
                                  )}
                                </div>
                                <div className="mt-1 flex items-center justify-between">
                                  <span className="text-xs text-neutral-500">{workspace.enterpriseName}</span>
                                </div>
                                <ComplianceMetrics
                                  score={workspace.complianceScore}
                                  pending={workspace.pendingActions}
                                />
                              </button>
                              {workspace.brands && workspace.brands.length > 0 && (
                                <div className="px-3 pb-2" onClick={(e) => e.stopPropagation()}>
                                  <BrandSelector
                                    brands={workspace.brands}
                                    selectedBrandId={isSelected ? currentBrand?.id : undefined}
                                    onSelect={(brandId) => {
                                      handleWorkspaceSwitch(workspace.id, brandId)
                                    }}
                                  />
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </Menu.Item>
                    )
                  })}
                </>
              )}

              {/* Empty state */}
              {filteredOwningWorkspaces.length === 0 && filteredSharedWorkspaces.length === 0 && (
                <div className="px-3 py-8 text-center text-sm text-neutral-500">
                  {searchQuery ? 'No workspaces match your search' : 'No workspaces available'}
                </div>
              )}
            </div>
          </div>
        </Menu.Items>
      </Transition>
    </Menu>
  )
})
ContextSwitcher.displayName = 'ContextSwitcher'

export default ContextSwitcher


/**
 * ContextSwitcher Component
 * 
 * Enables context switching between enterprises and partner contexts.
 * Uses the unified auth context service for seamless multi-tenant navigation.
 * 
 * Week 4: Auth Dashboard Integration
 */

import { memo, useState, useCallback, Fragment } from 'react'
import { Menu, Transition } from '@headlessui/react'
import {
  Building2,
  ChevronDown,
  Check,
  Users,
  Briefcase,
  Loader2,
  AlertCircle,
} from 'lucide-react'
import { useUnifiedAuthContext, type AvailableContext, type ContextSwitchRequest } from '@/services/auth/unifiedAuthContext'

interface ContextSwitcherProps {
  compact?: boolean
  onContextChange?: (context: AvailableContext) => void
}

const ContextIcon = memo(({ type }: { type: 'enterprise' | 'partner' | 'workspace' }) => {
  switch (type) {
    case 'enterprise':
      return <Building2 className="w-4 h-4 text-indigo-500" />
    case 'partner':
      return <Users className="w-4 h-4 text-blue-500" />
    case 'workspace':
      return <Briefcase className="w-4 h-4 text-amber-500" />
    default:
      return <Building2 className="w-4 h-4 text-slate-500" />
  }
})
ContextIcon.displayName = 'ContextIcon'

const ContextTypeBadge = memo(({ type }: { type: 'enterprise' | 'partner' | 'workspace' }) => {
  const styles = {
    enterprise: 'bg-indigo-100 text-indigo-700',
    partner: 'bg-blue-100 text-blue-700',
    workspace: 'bg-amber-100 text-amber-700',
  }
  return (
    <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium uppercase ${styles[type]}`}>
      {type}
    </span>
  )
})
ContextTypeBadge.displayName = 'ContextTypeBadge'

export const ContextSwitcher = memo(({ compact = false, onContextChange }: ContextSwitcherProps) => {
  const {
    currentContext,
    availableContexts,
    isLoading,
    error,
    switchContext,
  } = useUnifiedAuthContext()

  const [isSwitching, setIsSwitching] = useState(false)
  const [switchError, setSwitchError] = useState<string | null>(null)

  const handleSwitchContext = useCallback(async (context: AvailableContext) => {
    if (currentContext?.enterpriseId === context.enterpriseId && 
        currentContext?.partnerId === context.partnerId) {
      return // Already in this context
    }

    setIsSwitching(true)
    setSwitchError(null)

    try {
      const request: ContextSwitchRequest = {
        enterpriseId: context.enterpriseId,
        workspaceId: context.workspaceId,
        partnerId: context.partnerId,
        contextType: context.type === 'partner' ? 'partner' : 'enterprise',
      }
      await switchContext(request)
      onContextChange?.(context)
    } catch (err) {
      setSwitchError(err instanceof Error ? err.message : 'Failed to switch context')
    } finally {
      setIsSwitching(false)
    }
  }, [currentContext, switchContext, onContextChange])

  // Find current context display info
  const currentContextInfo = availableContexts.find(
    c => c.enterpriseId === currentContext?.enterpriseId && 
         c.partnerId === currentContext?.partnerId
  )

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 px-3 py-2 bg-slate-100 rounded-lg">
        <Loader2 className="w-4 h-4 animate-spin text-slate-400" />
        <span className="text-sm text-slate-500">Loading contexts...</span>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center gap-2 px-3 py-2 bg-red-50 rounded-lg border border-red-100">
        <AlertCircle className="w-4 h-4 text-red-500" />
        <span className="text-sm text-red-600">Error loading contexts</span>
      </div>
    )
  }

  if (availableContexts.length <= 1) {
    // Only one context available, no need for switcher
    return (
      <div className="flex items-center gap-2 px-3 py-2 bg-slate-50 rounded-lg">
        <ContextIcon type={currentContextInfo?.type || 'enterprise'} />
        <span className="text-sm font-medium text-slate-700">
          {currentContextInfo?.name || 'Default Context'}
        </span>
      </div>
    )
  }

  return (
    <Menu as="div" className="relative">
      <Menu.Button
        className={`
          flex items-center gap-2 px-3 py-2 bg-white border border-slate-200 
          rounded-lg hover:bg-slate-50 hover:border-slate-300 
          transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-1
          ${compact ? 'text-sm' : ''}
        `}
        disabled={isSwitching}
      >
        {isSwitching ? (
          <Loader2 className="w-4 h-4 animate-spin text-indigo-500" />
        ) : (
          <ContextIcon type={currentContextInfo?.type || 'enterprise'} />
        )}
        <span className="font-medium text-slate-700 max-w-[150px] truncate">
          {currentContextInfo?.name || 'Select Context'}
        </span>
        {!compact && currentContextInfo && (
          <ContextTypeBadge type={currentContextInfo.type} />
        )}
        <ChevronDown className="w-4 h-4 text-slate-400" />
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
        <Menu.Items className="absolute left-0 mt-2 w-72 origin-top-left rounded-xl bg-white shadow-lg ring-1 ring-black/5 focus:outline-none z-50">
          <div className="p-2">
            <div className="px-3 py-2 text-xs font-semibold text-slate-500 uppercase tracking-wide">
              Switch Context
            </div>

            {switchError && (
              <div className="mx-2 mb-2 p-2 bg-red-50 rounded-lg border border-red-100">
                <div className="flex items-center gap-2 text-sm text-red-600">
                  <AlertCircle className="w-4 h-4" />
                  {switchError}
                </div>
              </div>
            )}

            <div className="space-y-1">
              {availableContexts.map((context) => {
                const isSelected = 
                  currentContext?.enterpriseId === context.enterpriseId &&
                  currentContext?.partnerId === context.partnerId

                return (
                  <Menu.Item key={context.id}>
                    {({ active }) => (
                      <button
                        onClick={() => handleSwitchContext(context)}
                        className={`
                          w-full flex items-center gap-3 px-3 py-2.5 rounded-lg
                          transition-colors text-left
                          ${active ? 'bg-slate-100' : ''}
                          ${isSelected ? 'bg-indigo-50' : ''}
                        `}
                      >
                        <ContextIcon type={context.type} />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className={`font-medium truncate ${isSelected ? 'text-indigo-700' : 'text-slate-700'}`}>
                              {context.name}
                            </span>
                            <ContextTypeBadge type={context.type} />
                          </div>
                          <div className="text-xs text-slate-500 mt-0.5">
                            {context.role}
                          </div>
                        </div>
                        {isSelected && (
                          <Check className="w-4 h-4 text-indigo-600 flex-shrink-0" />
                        )}
                      </button>
                    )}
                  </Menu.Item>
                )
              })}
            </div>
          </div>
        </Menu.Items>
      </Transition>
    </Menu>
  )
})
ContextSwitcher.displayName = 'ContextSwitcher'

export default ContextSwitcher


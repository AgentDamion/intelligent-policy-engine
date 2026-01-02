import { useState, useEffect, useMemo } from 'react'
import { Search, Check, Calendar, AlertCircle, ChevronDown, ChevronUp, Settings } from 'lucide-react'
import { Input } from '../ui/Input'
import LoadingSpinner from '../ui/LoadingSpinner'
import { supabase } from '@/lib/supabase'

export interface Framework {
  id: string
  name: string
  short_code: string
  jurisdiction: string
  jurisdiction_display: string
  regulatory_body?: string
  framework_type: string
  effective_date?: string
  enforcement_date?: string
  status: string
  summary?: string
  requirement_count?: number
  penalty_info?: any
}

export interface FrameworkSelection {
  frameworkId: string
  enabled: boolean
  configuration: FrameworkConfig
}

export interface FrameworkConfig {
  actorType?: 'provider' | 'deployer' | 'both'
  riskLevel?: 'high_risk' | 'limited' | 'minimal' | 'all'
  customExclusions?: string[]
}

interface FrameworkSelectorProps {
  selectedFrameworks: FrameworkSelection[]
  onSelectionChange: (frameworks: FrameworkSelection[]) => void
  className?: string
}

export default function FrameworkSelector({
  selectedFrameworks,
  onSelectionChange,
  className = ''
}: FrameworkSelectorProps) {
  const [frameworks, setFrameworks] = useState<Framework[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [expandedFramework, setExpandedFramework] = useState<string | null>(null)
  const [configuringFramework, setConfiguringFramework] = useState<string | null>(null)

  useEffect(() => {
    fetchFrameworks()
  }, [])

  const fetchFrameworks = async () => {
    try {
      setLoading(true)
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return

      const response = await fetch('/api/frameworks', {
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      })

      if (!response.ok) throw new Error('Failed to fetch frameworks')

      const result = await response.json()
      setFrameworks(result.data?.frameworks || [])
    } catch (error) {
      console.error('Error fetching frameworks:', error)
    } finally {
      setLoading(false)
    }
  }

  const toggleFramework = (frameworkId: string) => {
    const existing = selectedFrameworks.find(f => f.frameworkId === frameworkId)
    if (existing) {
      // Toggle enabled
      onSelectionChange(
        selectedFrameworks.map(f =>
          f.frameworkId === frameworkId
            ? { ...f, enabled: !f.enabled }
            : f
        )
      )
    } else {
      // Add new framework with default config
      onSelectionChange([
        ...selectedFrameworks,
        {
          frameworkId,
          enabled: true,
          configuration: {
            actorType: 'both',
            riskLevel: 'all',
            customExclusions: []
          }
        }
      ])
    }
  }

  const updateConfiguration = (frameworkId: string, config: Partial<FrameworkConfig>) => {
    onSelectionChange(
      selectedFrameworks.map(f =>
        f.frameworkId === frameworkId
          ? { ...f, configuration: { ...f.configuration, ...config } }
          : f
      )
    )
  }

  const groupedFrameworks = useMemo(() => {
    const groups: Record<string, Framework[]> = {}
    frameworks.forEach(framework => {
      const jurisdiction = framework.jurisdiction_display || framework.jurisdiction
      if (!groups[jurisdiction]) {
        groups[jurisdiction] = []
      }
      groups[jurisdiction].push(framework)
    })
    return groups
  }, [frameworks])

  const filteredFrameworks = useMemo(() => {
    return frameworks.filter(framework => {
      const matchesSearch = !searchTerm ||
        framework.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        framework.short_code.toLowerCase().includes(searchTerm.toLowerCase()) ||
        framework.summary?.toLowerCase().includes(searchTerm.toLowerCase())
      return matchesSearch
    })
  }, [frameworks, searchTerm])

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
      case 'enforced':
        return 'bg-green-100 text-green-800 border-green-200'
      case 'enacted':
        return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'pending':
      case 'proposed':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getDaysUntilEnforcement = (enforcementDate?: string) => {
    if (!enforcementDate) return null
    const days = Math.ceil((new Date(enforcementDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    return days
  }

  const totalRequirements = selectedFrameworks.reduce((sum, f) => {
    const framework = frameworks.find(fw => fw.id === f.frameworkId)
    return sum + (framework?.requirement_count || 0)
  }, 0)

  const nearestDeadline = selectedFrameworks.reduce((nearest, f) => {
    const framework = frameworks.find(fw => fw.id === f.frameworkId)
    if (!framework?.enforcement_date) return nearest
    const date = new Date(framework.enforcement_date)
    if (!nearest || date < nearest) return date
    return nearest
  }, null as Date | null)

  if (loading) {
    return (
      <div className={`flex items-center justify-center p-12 ${className}`}>
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Search */}
      <div className="relative">
        <Input
          placeholder="Search frameworks..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          leadingIcon={<Search className="h-4 w-4 text-slate-400" />}
          className="w-full"
        />
      </div>

      {/* Framework Groups */}
      {Object.entries(groupedFrameworks).map(([jurisdiction, jurisdictionFrameworks]) => {
        const visibleFrameworks = jurisdictionFrameworks.filter(f => 
          filteredFrameworks.some(ff => ff.id === f.id)
        )
        if (visibleFrameworks.length === 0) return null

        return (
          <div key={jurisdiction} className="border border-slate-200 rounded-none p-4">
            <h3 className="text-lg font-semibold text-slate-900 mb-4">{jurisdiction}</h3>
            <div className="space-y-3">
              {visibleFrameworks.map((framework) => {
                const selection = selectedFrameworks.find(f => f.frameworkId === framework.id)
                const isSelected = !!selection && selection.enabled
                const isExpanded = expandedFramework === framework.id
                const isConfiguring = configuringFramework === framework.id
                const daysUntil = getDaysUntilEnforcement(framework.enforcement_date)

                return (
                  <div
                    key={framework.id}
                    className={`border rounded-none transition-all ${
                      isSelected
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-slate-200 bg-white hover:border-slate-300'
                    }`}
                  >
                    <div className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-3 flex-1">
                          <button
                            onClick={() => toggleFramework(framework.id)}
                            className={`mt-1 flex items-center justify-center w-5 h-5 rounded border-2 transition-colors ${
                              isSelected
                                ? 'bg-blue-500 border-blue-500'
                                : 'border-slate-300 hover:border-slate-400'
                            }`}
                          >
                            {isSelected && <Check className="h-3 w-3 text-white" />}
                          </button>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <h4 className="font-semibold text-slate-900">{framework.name}</h4>
                              <span className={`px-2 py-0.5 text-xs font-medium rounded border ${getStatusColor(framework.status)}`}>
                                {framework.status}
                              </span>
                            </div>
                            <div className="flex items-center gap-4 text-sm text-slate-600 mb-2">
                              {framework.enforcement_date && (
                                <div className="flex items-center gap-1">
                                  <Calendar className="h-4 w-4" />
                                  <span>
                                    Enforcement: {new Date(framework.enforcement_date).toLocaleDateString()}
                                    {daysUntil !== null && daysUntil > 0 && (
                                      <span className="ml-1">({daysUntil} days)</span>
                                    )}
                                  </span>
                                </div>
                              )}
                              {framework.requirement_count && (
                                <span>{framework.requirement_count} requirements</span>
                              )}
                            </div>
                            {framework.summary && (
                              <p className="text-sm text-slate-600">{framework.summary}</p>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {isSelected && (
                            <button
                              onClick={() => setConfiguringFramework(
                                isConfiguring ? null : framework.id
                              )}
                              className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded"
                              title="Configure"
                            >
                              <Settings className="h-4 w-4" />
                            </button>
                          )}
                          <button
                            onClick={() => setExpandedFramework(
                              isExpanded ? null : framework.id
                            )}
                            className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded"
                          >
                            {isExpanded ? (
                              <ChevronUp className="h-4 w-4" />
                            ) : (
                              <ChevronDown className="h-4 w-4" />
                            )}
                          </button>
                        </div>
                      </div>

                      {/* Configuration Panel */}
                      {isSelected && isConfiguring && (
                        <div className="mt-4 pt-4 border-t border-slate-200">
                          <div className="space-y-4">
                            <div>
                              <label className="block text-sm font-medium text-slate-700 mb-2">
                                Your Role
                              </label>
                              <div className="flex gap-4">
                                {(['provider', 'deployer', 'both'] as const).map(role => (
                                  <label key={role} className="flex items-center gap-2">
                                    <input
                                      type="radio"
                                      name={`role-${framework.id}`}
                                      value={role}
                                      checked={selection?.configuration.actorType === role}
                                      onChange={() => updateConfiguration(framework.id, { actorType: role })}
                                      className="text-blue-600"
                                    />
                                    <span className="text-sm capitalize">{role}</span>
                                  </label>
                                ))}
                              </div>
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-slate-700 mb-2">
                                Risk Level
                              </label>
                              <div className="flex gap-4">
                                {(['high_risk', 'limited', 'minimal', 'all'] as const).map(level => (
                                  <label key={level} className="flex items-center gap-2">
                                    <input
                                      type="radio"
                                      name={`risk-${framework.id}`}
                                      value={level}
                                      checked={selection?.configuration.riskLevel === level}
                                      onChange={() => updateConfiguration(framework.id, { riskLevel: level })}
                                      className="text-blue-600"
                                    />
                                    <span className="text-sm capitalize">{level.replace('_', ' ')}</span>
                                  </label>
                                ))}
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )
      })}

      {/* Selection Summary */}
      {selectedFrameworks.filter(f => f.enabled).length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-none p-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Check className="h-5 w-5 text-blue-600" />
              <span className="font-medium text-blue-900">
                {selectedFrameworks.filter(f => f.enabled).length} framework{selectedFrameworks.filter(f => f.enabled).length !== 1 ? 's' : ''} enabled
              </span>
            </div>
            <div className="text-sm text-blue-800 ml-7">
              <div>• {totalRequirements} requirements to track</div>
              {nearestDeadline && (
                <div>
                  • Nearest deadline: {nearestDeadline.toLocaleDateString()} ({Math.ceil((nearestDeadline.getTime() - Date.now()) / (1000 * 60 * 60 * 24))} days)
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {filteredFrameworks.length === 0 && (
        <div className="text-center py-12 text-slate-500">
          <AlertCircle className="h-12 w-12 mx-auto mb-4 text-slate-400" />
          <p>No frameworks found matching your search.</p>
        </div>
      )}
    </div>
  )
}


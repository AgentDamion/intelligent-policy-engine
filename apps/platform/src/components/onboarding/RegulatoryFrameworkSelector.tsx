import React, { useState, useEffect } from 'react'
import { Search, Check, Globe, Building2, Calendar, AlertCircle } from 'lucide-react'
import { Input } from '../ui/Input'
import { Button } from '../ui/button'
import LoadingSpinner from '../ui/LoadingSpinner'

export interface RegulatoryFramework {
  id: string
  name: string
  short_name: string
  jurisdiction: string
  regulatory_body?: string
  framework_type: string
  effective_date?: string
  enforcement_date?: string
  status: string
  summary?: string
  requirement_count?: number
  template_count?: number
}

interface RegulatoryFrameworkSelectorProps {
  organizationId: string
  selectedFrameworkIds: string[]
  onSelectionChange: (frameworkIds: string[]) => void
  onContinue?: () => void
  className?: string
}

export default function RegulatoryFrameworkSelector({
  organizationId,
  selectedFrameworkIds,
  onSelectionChange,
  onContinue,
  className = ''
}: RegulatoryFrameworkSelectorProps) {
  const [frameworks, setFrameworks] = useState<RegulatoryFramework[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterJurisdiction, setFilterJurisdiction] = useState<string>('')
  const [filterType, setFilterType] = useState<string>('')

  useEffect(() => {
    fetchFrameworks()
  }, [])

  const fetchFrameworks = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/regulatory-frameworks', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token') || ''}`
        }
      })
      
      if (!response.ok) throw new Error('Failed to fetch frameworks')
      
      const data = await response.json()
      setFrameworks(data.data || [])
    } catch (error) {
      console.error('Error fetching frameworks:', error)
    } finally {
      setLoading(false)
    }
  }

  const toggleFramework = (frameworkId: string) => {
    const newSelection = selectedFrameworkIds.includes(frameworkId)
      ? selectedFrameworkIds.filter(id => id !== frameworkId)
      : [...selectedFrameworkIds, frameworkId]
    onSelectionChange(newSelection)
  }

  // Group frameworks by jurisdiction
  const frameworksByJurisdiction = frameworks.reduce((acc, framework) => {
    const jurisdiction = framework.jurisdiction
    if (!acc[jurisdiction]) {
      acc[jurisdiction] = []
    }
    acc[jurisdiction].push(framework)
    return acc
  }, {} as Record<string, RegulatoryFramework[]>)

  // Filter frameworks
  const filteredFrameworks = frameworks.filter(framework => {
    const matchesSearch = !searchTerm || 
      framework.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      framework.short_name.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesJurisdiction = !filterJurisdiction || framework.jurisdiction === filterJurisdiction
    const matchesType = !filterType || framework.framework_type === filterType
    return matchesSearch && matchesJurisdiction && matchesType
  })

  // Get unique jurisdictions and types for filters
  const jurisdictions = Array.from(new Set(frameworks.map(f => f.jurisdiction))).sort()
  const types = Array.from(new Set(frameworks.map(f => f.framework_type))).sort()

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'enforced':
        return 'bg-green-100 text-green-800 border-green-200'
      case 'enacted':
        return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'proposed':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      'disclosure': 'Disclosure',
      'transparency': 'Transparency',
      'audit': 'Audit Trail',
      'data_protection': 'Data Protection',
      'classification': 'Classification'
    }
    return labels[type] || type
  }

  if (loading) {
    return (
      <div className={`flex items-center justify-center p-12 ${className}`}>
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-slate-900">Select Regulatory Frameworks</h2>
        <p className="mt-2 text-sm text-slate-600">
          Choose which regulatory frameworks apply to your organization. We'll configure policy templates and compliance tracking accordingly.
        </p>
      </div>

      {/* Search and Filters */}
      <div className="space-y-4">
        <div className="relative">
          <Input
            placeholder="Search frameworks..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            leadingIcon={<Search className="h-4 w-4 text-slate-400" />}
            className="w-full"
          />
        </div>

        <div className="flex gap-4">
          <select
            value={filterJurisdiction}
            onChange={(e) => setFilterJurisdiction(e.target.value)}
            className="px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Jurisdictions</option>
            {jurisdictions.map(j => (
              <option key={j} value={j}>{j}</option>
            ))}
          </select>

          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Types</option>
            {types.map(t => (
              <option key={t} value={t}>{getTypeLabel(t)}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Selected Summary */}
      {selectedFrameworkIds.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center gap-2">
            <Check className="h-5 w-5 text-blue-600" />
            <span className="font-medium text-blue-900">
              {selectedFrameworkIds.length} framework{selectedFrameworkIds.length !== 1 ? 's' : ''} selected
            </span>
          </div>
        </div>
      )}

      {/* Framework List */}
      <div className="space-y-4 max-h-[600px] overflow-y-auto">
        {filteredFrameworks.length === 0 ? (
          <div className="text-center py-12 text-slate-500">
            <AlertCircle className="h-12 w-12 mx-auto mb-4 text-slate-400" />
            <p>No frameworks found matching your criteria.</p>
          </div>
        ) : (
          filteredFrameworks.map((framework) => {
            const isSelected = selectedFrameworkIds.includes(framework.id)
            return (
              <div
                key={framework.id}
                onClick={() => toggleFramework(framework.id)}
                className={`
                  border rounded-lg p-4 cursor-pointer transition-all
                  ${isSelected 
                    ? 'border-blue-500 bg-blue-50 shadow-sm' 
                    : 'border-slate-200 bg-white hover:border-slate-300 hover:shadow-sm'
                  }
                `}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <div className={`
                        flex items-center justify-center w-6 h-6 rounded border-2
                        ${isSelected 
                          ? 'bg-blue-500 border-blue-500' 
                          : 'border-slate-300'
                        }
                      `}>
                        {isSelected && <Check className="h-4 w-4 text-white" />}
                      </div>
                      <h3 className="font-semibold text-slate-900">{framework.name}</h3>
                      <span className={`
                        px-2 py-1 text-xs font-medium rounded border
                        ${getStatusColor(framework.status)}
                      `}>
                        {framework.status}
                      </span>
                    </div>

                    <div className="ml-9 space-y-2">
                      <div className="flex items-center gap-4 text-sm text-slate-600">
                        <div className="flex items-center gap-1">
                          <Globe className="h-4 w-4" />
                          <span>{framework.jurisdiction}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Building2 className="h-4 w-4" />
                          <span>{getTypeLabel(framework.framework_type)}</span>
                        </div>
                        {framework.enforcement_date && (
                          <div className="flex items-center gap-1">
                            <Calendar className="h-4 w-4" />
                            <span>Effective: {new Date(framework.enforcement_date).toLocaleDateString()}</span>
                          </div>
                        )}
                      </div>

                      {framework.summary && (
                        <p className="text-sm text-slate-600 ml-9">{framework.summary}</p>
                      )}

                      {framework.requirement_count !== undefined && (
                        <div className="text-xs text-slate-500 ml-9">
                          {framework.requirement_count} requirement{framework.requirement_count !== 1 ? 's' : ''}
                          {framework.template_count !== undefined && framework.template_count > 0 && (
                            <span> • {framework.template_count} policy template{framework.template_count !== 1 ? 's' : ''} available</span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )
          })
        )}
      </div>

      {/* Continue Button */}
      {onContinue && (
        <div className="flex justify-end pt-4 border-t border-slate-200">
          <Button
            onClick={onContinue}
            disabled={selectedFrameworkIds.length === 0}
            className="px-6"
          >
            Continue
          </Button>
        </div>
      )}
    </div>
  )
}


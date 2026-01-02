import React, { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { EdgeCard } from '@/components/ui/edge-card'
import { AICOMPLYRButton as Button } from '@/components/ui/aicomplyr-button'
import { Input } from '@/components/ui/Input'
import { StatusBadge } from '@/components/ui/status-badge'

interface ToolLookupResult {
  status: 'found' | 'unknown'
  tool?: {
    id: string
    name: string
    category: string
    similarity_score?: number
  }
  policyStatus?: string
  requirements?: string[]
  inferredCategory?: {
    category: string
    confidence: number
    policy?: {
      name: string
      requirements: string[]
    }
  }
  alternatives?: Array<{
    id: string
    name: string
    category: string
    status: string
  }>
  fuzzyMatches?: Array<{
    name: string
    category: string
    similarity: number
  }>
  confidence?: number
}

interface ToolLookupProps {
  onToolFound?: (tool: any) => void
  onUnknownTool?: (result: ToolLookupResult) => void
}

export function ToolLookup({ onToolFound, onUnknownTool }: ToolLookupProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [isSearching, setIsSearching] = useState(false)
  const [result, setResult] = useState<ToolLookupResult | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleSearch = async () => {
    if (!searchTerm.trim()) return

    setIsSearching(true)
    setError(null)
    setResult(null)

    try {
      const { data, error } = await supabase.functions.invoke('cursor-agent-adapter', {
        body: {
          agent: 'tool-discovery',
          action: 'lookup',
          input: {
            toolName: searchTerm.trim(),
            enterpriseId: 'test-enterprise-id' // TODO: Get from context
          }
        }
      })

      if (error) {
        throw error
      }

      setResult(data)

      // Call callbacks
      if (data.status === 'found' && onToolFound && data.tool) {
        onToolFound(data.tool)
      } else if (data.status === 'unknown' && onUnknownTool) {
        onUnknownTool(data)
      }

    } catch (err) {
      console.error('Tool lookup failed:', err)
      setError(err instanceof Error ? err.message : 'Search failed')
    } finally {
      setIsSearching(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch()
    }
  }

  return (
    <div className="space-y-4">
      <EdgeCard>
        <div className="p-6">
          <h3 className="text-[10px] font-bold uppercase tracking-[1.5px] text-neutral-400 mb-4">
            Tool Lookup
          </h3>

          <div className="flex gap-3">
            <div className="flex-1">
              <Input
                placeholder="Search for an AI tool..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyPress={handleKeyPress}
                disabled={isSearching}
              />
            </div>
            <Button
              onClick={handleSearch}
              disabled={isSearching || !searchTerm.trim()}
            >
              {isSearching ? 'Searching...' : 'Lookup'}
            </Button>
          </div>

          {error && (
            <div className="mt-3 p-3 bg-red-50 border border-red-200 text-red-700 text-sm">
              {error}
            </div>
          )}
        </div>
      </EdgeCard>

      {result && (
        <EdgeCard variant={result.status === 'found' ? 'default' : 'attention'}>
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-sm font-semibold">
                {result.status === 'found' ? 'Tool Found' : 'Tool Not Recognized'}
              </h4>
              {result.confidence && (
                <span className="text-xs text-neutral-500">
                  Confidence: {Math.round(result.confidence * 100)}%
                </span>
              )}
            </div>

            {result.status === 'found' && result.tool && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h5 className="font-semibold text-aicomplyr-black">{result.tool.name}</h5>
                    <p className="text-sm text-neutral-600">{result.tool.category}</p>
                    {result.tool.similarity_score && result.tool.similarity_score < 1 && (
                      <p className="text-xs text-neutral-500">
                        Similarity: {Math.round(result.tool.similarity_score * 100)}%
                      </p>
                    )}
                  </div>
                  {result.policyStatus && (
                    <StatusBadge variant={
                      result.policyStatus === 'approved' ? 'approved' :
                      result.policyStatus === 'conditional' ? 'conditional' :
                      result.policyStatus === 'denied' ? 'denied' : 'pending'
                    }>
                      {result.policyStatus}
                    </StatusBadge>
                  )}
                </div>

                {result.requirements && result.requirements.length > 0 && (
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-[1.5px] text-neutral-400 mb-2">
                      Requirements
                    </p>
                    <ul className="text-sm text-neutral-700 space-y-1">
                      {result.requirements.map((req, idx) => (
                        <li key={idx}>• {req}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {result.fuzzyMatches && result.fuzzyMatches.length > 0 && (
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-[1.5px] text-neutral-400 mb-2">
                      Other Matches
                    </p>
                    <div className="space-y-1">
                      {result.fuzzyMatches.slice(0, 2).map((match, idx) => (
                        <div key={idx} className="text-sm text-neutral-600">
                          {match.name} ({match.category}) - {Math.round(match.similarity * 100)}%
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {result.status === 'unknown' && (
              <div className="space-y-3">
                <p className="text-sm text-neutral-700">
                  "{searchTerm}" is not in the tool registry.
                </p>

                {result.inferredCategory && (
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-[1.5px] text-neutral-400 mb-2">
                      Inferred Category
                    </p>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">{result.inferredCategory.category}</span>
                      <span className="text-xs text-neutral-500 font-mono">
                        {Math.round(result.inferredCategory.confidence * 100)}% confidence
                      </span>
                    </div>

                    {result.inferredCategory.policy && (
                      <div className="mt-3">
                        <p className="text-[10px] font-bold uppercase tracking-[1.5px] text-neutral-400 mb-1">
                          Policy: {result.inferredCategory.policy.name}
                        </p>
                        <ul className="text-sm text-neutral-700 space-y-1">
                          {result.inferredCategory.policy.requirements.map((req, idx) => (
                            <li key={idx}>• {req}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}

                {result.alternatives && result.alternatives.length > 0 && (
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-[1.5px] text-neutral-400 mb-2">
                      Approved Alternatives
                    </p>
                    <div className="space-y-1">
                      {result.alternatives.map((alt, idx) => (
                        <div key={idx} className="text-sm text-neutral-700">
                          {alt.name} ({alt.category})
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </EdgeCard>
      )}
    </div>
  )
}

import React, { useState, useEffect } from 'react'
import { useSandboxAgents, TestScenario } from '../../hooks/useSandboxAgents'
import { Card } from '../ui/card'
import { Button } from '../ui/button'
import { Badge } from '../ui/badge'
import { Loader2, Play, FileDown, Sparkles, AlertCircle, CheckCircle2 } from 'lucide-react'
import { supabase } from '../../lib/supabase'

interface SandboxDashboardProps {
  enterpriseId: string
  userId?: string
}

/**
 * SandboxDashboard Component
 * 
 * Minimal MVP UI for Policy Sandbox with AI agent orchestration
 * 
 * Features:
 * - Policy selection
 * - Scenario input (with AI generation)
 * - Run simulation button
 * - Real-time agent activity display
 * - Export results
 * - Simulation history
 */
export const SandboxDashboard: React.FC<SandboxDashboardProps> = ({ 
  enterpriseId, 
  userId 
}) => {
  const [policies, setPolicies] = useState<any[]>([])
  const [selectedPolicy, setSelectedPolicy] = useState<string | null>(null)
  const [scenarioInput, setScenarioInput] = useState('')
  const [generatedScenarios, setGeneratedScenarios] = useState<TestScenario[]>([])
  const [selectedScenario, setSelectedScenario] = useState<TestScenario | null>(null)
  const [simulationResult, setSimulationResult] = useState<any>(null)
  
  const {
    runIntelligentSimulation,
    generateTestScenarios,
    exportResults,
    fetchSimulationHistory,
    agentActivities,
    isProcessing,
    currentRun,
    error,
    simulationHistory
  } = useSandboxAgents(enterpriseId, userId)

  // Fetch policies on mount
  useEffect(() => {
    const fetchPolicies = async () => {
      const { data } = await supabase
        .from('policies')
        .select('id, name, title, version, status')
        .eq('enterprise_id', enterpriseId)
        .eq('status', 'published')
        .order('created_at', { ascending: false })
        .limit(50)

      setPolicies(data || [])
    }

    fetchPolicies()
    fetchSimulationHistory()
  }, [enterpriseId, fetchSimulationHistory])

  const handleGenerateScenarios = async () => {
    if (!selectedPolicy) return

    try {
      const scenarios = await generateTestScenarios(selectedPolicy, 5, {
        scenario_type: 'comprehensive'
      })
      setGeneratedScenarios(scenarios)
    } catch (err) {
      console.error('Failed to generate scenarios:', err)
    }
  }

  const handleRunSimulation = async () => {
    if (!selectedPolicy) return

    let scenario: any
    
    if (selectedScenario) {
      // Use selected AI-generated scenario
      scenario = {
        name: selectedScenario.scenario_name,
        scenario_name: selectedScenario.scenario_name,
        config: selectedScenario.test_inputs,
        expected_outcome: selectedScenario.expected_outcome
      }
    } else if (scenarioInput.trim()) {
      // Parse manual scenario input
      try {
        scenario = JSON.parse(scenarioInput)
      } catch {
        // Treat as plain text description
        scenario = {
          name: 'Manual Scenario',
          scenario_name: 'Manual Scenario',
          description: scenarioInput,
          config: { description: scenarioInput }
        }
      }
    } else {
      // Default test scenario
      scenario = {
        name: 'Default Test Scenario',
        scenario_name: 'Default Test Scenario',
        config: {
          tool: 'GPT-4',
          data_class: 'general',
          jurisdiction: 'US',
          usage_context: 'testing'
        }
      }
    }

    const result = await runIntelligentSimulation({
      policy_id: selectedPolicy,
      scenario
    })

    if (result.success) {
      setSimulationResult(result.result)
    }
  }

  const handleExport = async (format: 'json' | 'markdown' = 'json') => {
    if (!currentRun) return

    try {
      const exportData = await exportResults(currentRun, format, {
        include_ai_insights: true
      })

      // Create download link
      const blob = new Blob([JSON.stringify(exportData.export_data, null, 2)], { 
        type: 'application/json' 
      })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = exportData.file_name
      a.click()
      URL.revokeObjectURL(url)
    } catch (err) {
      console.error('Export failed:', err)
    }
  }

  const selectedPolicyData = policies.find(p => p.id === selectedPolicy)
  const compliancePercent = simulationResult?.compliance_score 
    ? Math.round(simulationResult.compliance_score * 100) 
    : 0

  return (
    <div className="space-y-6 p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Policy Sandbox</h1>
          <p className="text-gray-600 mt-1">AI-powered policy simulation and testing</p>
        </div>
        <Badge variant="outline" className="gap-2">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
          </span>
          AI Agents Active
        </Badge>
      </div>

      {/* Error Display */}
      {error && (
        <Card className="p-4 border-red-200 bg-red-50">
          <div className="flex items-center gap-2 text-red-800">
            <AlertCircle className="h-5 w-5" />
            <span className="font-medium">Error:</span>
            <span>{error}</span>
          </div>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Simulation Controls */}
        <div className="lg:col-span-2 space-y-6">
          {/* Policy Selection */}
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">1. Select Policy</h2>
            
            <select
              className="w-full px-4 py-3 border rounded-none bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              value={selectedPolicy || ''}
              onChange={(e) => setSelectedPolicy(e.target.value)}
              disabled={isProcessing}
            >
              <option value="">Select a policy to test...</option>
              {policies.map(policy => (
                <option key={policy.id} value={policy.id}>
                  {policy.name || policy.title} (v{policy.version || '1.0'})
                </option>
              ))}
            </select>

            {selectedPolicyData && (
              <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-none">
                <div className="text-sm text-blue-900">
                  <strong>Selected:</strong> {selectedPolicyData.name || selectedPolicyData.title}
                </div>
              </div>
            )}
          </Card>

          {/* Scenario Input */}
          <Card className="p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">2. Define Test Scenario</h2>
              <Button
                variant="outline"
                size="sm"
                onClick={handleGenerateScenarios}
                disabled={!selectedPolicy || isProcessing}
                className="gap-2"
              >
                <Sparkles className="h-4 w-4" />
                Generate with AI
              </Button>
            </div>

            {/* AI-Generated Scenarios */}
            {generatedScenarios.length > 0 && (
              <div className="mb-4 space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  AI-Generated Scenarios:
                </label>
                <div className="grid grid-cols-1 gap-2">
                  {generatedScenarios.slice(0, 5).map((scenario) => (
                    <button
                      key={scenario.id}
                      onClick={() => setSelectedScenario(scenario)}
                      className={`text-left p-3 rounded-none border transition-all ${
                        selectedScenario?.id === scenario.id
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 bg-white hover:border-blue-300'
                      }`}
                    >
                      <div className="font-medium">{scenario.scenario_name}</div>
                      <div className="text-sm text-gray-600 mt-1">
                        {scenario.scenario_description}
                      </div>
                      <div className="flex gap-2 mt-2">
                        <Badge variant={scenario.risk_level === 'high' ? 'destructive' : 'secondary'}>
                          {scenario.risk_level} risk
                        </Badge>
                        <Badge variant="outline">{scenario.edge_case_type}</Badge>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Manual Scenario Input */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Or enter scenario manually (JSON or plain text):
              </label>
              <textarea
                className="w-full px-3 py-2 border rounded-none font-mono text-sm"
                rows={6}
                placeholder={`{
  "tool": "GPT-4",
  "data_class": "PHI",
  "jurisdiction": "US",
  "usage_context": "Patient diagnosis assistance"
}`}
                value={scenarioInput}
                onChange={(e) => {
                  setScenarioInput(e.target.value)
                  setSelectedScenario(null) // Clear AI scenario selection
                }}
                disabled={isProcessing}
              />
            </div>
          </Card>

          {/* Run Simulation */}
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold">3. Run Simulation</h2>
                <p className="text-sm text-gray-600 mt-1">
                  AI agents will orchestrate: Policy validation → Simulation → Compliance scoring → Risk assessment
                </p>
              </div>
              <Button
                onClick={handleRunSimulation}
                disabled={!selectedPolicy || isProcessing}
                size="lg"
                className="gap-2"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    Running...
                  </>
                ) : (
                  <>
                    <Play className="h-5 w-5" />
                    Run Simulation
                  </>
                )}
              </Button>
            </div>
          </Card>

          {/* Simulation Results */}
          {simulationResult && (
            <Card className="p-6 border-2 border-green-200 bg-green-50">
              <div className="flex items-center gap-2 mb-4">
                <CheckCircle2 className="h-6 w-6 text-green-600" />
                <h2 className="text-xl font-semibold text-green-900">Simulation Complete</h2>
              </div>

              <div className="grid grid-cols-3 gap-4 mb-4">
                <div className="bg-white p-4 rounded-none">
                  <div className="text-sm text-gray-600">Validation</div>
                  <div className="text-2xl font-bold mt-1">
                    {simulationResult.validation_status ? '✅ Pass' : '❌ Fail'}
                  </div>
                </div>
                <div className="bg-white p-4 rounded-none">
                  <div className="text-sm text-gray-600">Compliance Score</div>
                  <div className="text-2xl font-bold mt-1">{compliancePercent}%</div>
                </div>
                <div className="bg-white p-4 rounded-none">
                  <div className="text-sm text-gray-600">Risk Flags</div>
                  <div className="text-2xl font-bold mt-1">{simulationResult.risk_flags?.length || 0}</div>
                </div>
              </div>

              <div className="mb-4">
                <h3 className="font-semibold text-gray-900 mb-2">AI Insights:</h3>
                <p className="text-sm text-gray-700">
                  {simulationResult.ai_insights?.simulation_analysis}
                </p>
              </div>

              {simulationResult.ai_insights?.key_findings?.length > 0 && (
                <div className="mb-4">
                  <h3 className="font-semibold text-gray-900 mb-2">Key Findings:</h3>
                  <ul className="list-disc list-inside space-y-1 text-sm text-gray-700">
                    {simulationResult.ai_insights.key_findings.map((finding: string, i: number) => (
                      <li key={i}>{finding}</li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="flex gap-3 mt-4">
                <Button onClick={() => handleExport('json')} variant="outline" className="gap-2">
                  <FileDown className="h-4 w-4" />
                  Export JSON
                </Button>
                <Button onClick={() => handleExport('markdown')} variant="outline" className="gap-2">
                  <FileDown className="h-4 w-4" />
                  Export Markdown
                </Button>
              </div>
            </Card>
          )}
        </div>

        {/* Right Column: Agent Activity & History */}
        <div className="space-y-6">
          {/* Agent Activity Panel */}
          {agentActivities.length > 0 && (
            <Card className="p-6">
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-blue-600" />
                AI Agent Activity
              </h2>
              <div className="space-y-3">
                {agentActivities.map((activity) => (
                  <div
                    key={activity.id}
                    className="flex items-start gap-3 p-3 bg-gray-50 rounded-none"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant={activity.status === 'completed' ? 'default' : 'secondary'}>
                          {activity.agentName}
                        </Badge>
                        {activity.status === 'running' && (
                          <Loader2 className="h-3 w-3 animate-spin text-blue-600" />
                        )}
                        {activity.status === 'completed' && (
                          <span className="text-green-600 text-xs">✓</span>
                        )}
                        {activity.status === 'failed' && (
                          <span className="text-red-600 text-xs">✗</span>
                        )}
                      </div>
                      <div className="text-sm text-gray-600">{activity.action}</div>
                      {activity.confidence && (
                        <div className="text-xs text-gray-500 mt-1">
                          Confidence: {Math.round(activity.confidence * 100)}%
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Simulation History */}
          <Card className="p-6">
            <h2 className="text-lg font-semibold mb-4">Recent Simulations</h2>
            {simulationHistory.length === 0 ? (
              <p className="text-sm text-gray-500">No simulation history yet</p>
            ) : (
              <div className="space-y-2">
                {simulationHistory.slice(0, 5).map((run) => (
                  <div key={run.id} className="p-3 bg-gray-50 rounded-none">
                    <div className="font-medium text-sm">{run.scenario_name}</div>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge 
                        variant={run.status === 'completed' ? 'default' : 'secondary'}
                        className="text-xs"
                      >
                        {run.status}
                      </Badge>
                      {run.compliance_score && (
                        <span className="text-xs text-gray-600">
                          {Math.round(run.compliance_score * 100)}% compliant
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      {new Date(run.created_at).toLocaleString()}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  )
}


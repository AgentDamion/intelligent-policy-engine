import React from 'react'
import { Card } from '../ui/card'
import { Badge } from '../ui/badge'
import { Loader2, CheckCircle2, XCircle, Sparkles, Brain, Shield, BarChart3 } from 'lucide-react'

interface AgentActivity {
  id: string
  agentName: string
  action: string
  status: 'running' | 'completed' | 'failed'
  result?: any
  error?: string
  timestamp: string
  confidence?: number
}

interface AgentActivityPanelProps {
  activities: AgentActivity[]
  isProcessing: boolean
  className?: string
}

/**
 * AgentActivityPanel Component
 * 
 * Real-time display of AI agent execution during policy simulations
 * Shows agent orchestration, status, and confidence scores
 */
export const AgentActivityPanel: React.FC<AgentActivityPanelProps> = ({
  activities,
  isProcessing,
  className = ''
}) => {
  const getAgentIcon = (agentName: string) => {
    switch (agentName) {
      case 'policy':
        return <Shield className="h-4 w-4" />
      case 'sandbox':
        return <Sparkles className="h-4 w-4" />
      case 'compliance-scoring':
        return <BarChart3 className="h-4 w-4" />
      case 'monitoring':
        return <Brain className="h-4 w-4" />
      default:
        return <Sparkles className="h-4 w-4" />
    }
  }

  const getAgentColor = (agentName: string) => {
    switch (agentName) {
      case 'policy':
        return 'text-blue-600 bg-blue-100'
      case 'sandbox':
        return 'text-purple-600 bg-purple-100'
      case 'compliance-scoring':
        return 'text-green-600 bg-green-100'
      case 'monitoring':
        return 'text-orange-600 bg-orange-100'
      default:
        return 'text-gray-600 bg-gray-100'
    }
  }

  const getStatusIcon = (status: AgentActivity['status']) => {
    switch (status) {
      case 'running':
        return <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
      case 'completed':
        return <CheckCircle2 className="h-4 w-4 text-green-600" />
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-600" />
    }
  }

  const getActionDescription = (action: string, agentName: string): string => {
    const actionMap: Record<string, string> = {
      'validate': 'Validating policy structure and rules',
      'simulate_policy_execution': 'Simulating policy execution with AI',
      'score': 'Scoring compliance against regulations',
      'detect_anomalies': 'Detecting risks and anomalies',
      'generate_test_scenarios': 'Generating test scenarios with AI',
      'analyze_simulation_results': 'Analyzing simulation outcomes',
      'suggest_controls': 'Suggesting sandbox controls',
      'generate_report_insights': 'Generating executive insights'
    }

    return actionMap[action] || action.replace(/_/g, ' ')
  }

  const completedCount = activities.filter(a => a.status === 'completed').length
  const failedCount = activities.filter(a => a.status === 'failed').length
  const totalCount = activities.length

  return (
    <Card className={`p-6 ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-blue-600" />
          <h2 className="text-lg font-semibold">AI Agent Orchestration</h2>
        </div>
        {isProcessing && (
          <Badge variant="secondary" className="gap-2">
            <Loader2 className="h-3 w-3 animate-spin" />
            Processing...
          </Badge>
        )}
      </div>

      {/* Progress Summary */}
      {totalCount > 0 && (
        <div className="mb-4 p-3 bg-gray-50 rounded-lg">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">Progress</span>
            <span className="font-medium">
              {completedCount} / {totalCount} agents completed
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${(completedCount / totalCount) * 100}%` }}
            />
          </div>
          {failedCount > 0 && (
            <div className="text-xs text-red-600 mt-2">
              {failedCount} agent(s) failed
            </div>
          )}
        </div>
      )}

      {/* Agent Activities */}
      {activities.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <Sparkles className="h-12 w-12 mx-auto mb-3 opacity-20" />
          <p className="text-sm">No agent activity yet</p>
          <p className="text-xs mt-1">Run a simulation to see AI agents in action</p>
        </div>
      ) : (
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {activities.map((activity, index) => (
            <div
              key={activity.id}
              className="relative"
            >
              {/* Connection Line */}
              {index < activities.length - 1 && (
                <div className="absolute left-[18px] top-[36px] w-0.5 h-6 bg-gray-200" />
              )}

              <div className="flex items-start gap-3 p-3 bg-white border rounded-lg hover:shadow-sm transition-shadow">
                {/* Agent Icon */}
                <div className={`flex-shrink-0 w-9 h-9 rounded-full flex items-center justify-center ${getAgentColor(activity.agentName)}`}>
                  {getAgentIcon(activity.agentName)}
                </div>

                {/* Activity Details */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge variant="outline" className="text-xs">
                      {activity.agentName}
                    </Badge>
                    {getStatusIcon(activity.status)}
                  </div>

                  <div className="text-sm text-gray-700">
                    {getActionDescription(activity.action, activity.agentName)}
                  </div>

                  {activity.confidence !== undefined && activity.status === 'completed' && (
                    <div className="flex items-center gap-2 mt-2">
                      <div className="flex-1 bg-gray-100 rounded-full h-1.5">
                        <div
                          className={`h-1.5 rounded-full transition-all ${
                            activity.confidence >= 0.8
                              ? 'bg-green-500'
                              : activity.confidence >= 0.6
                              ? 'bg-yellow-500'
                              : 'bg-red-500'
                          }`}
                          style={{ width: `${activity.confidence * 100}%` }}
                        />
                      </div>
                      <span className="text-xs text-gray-500 font-medium">
                        {Math.round(activity.confidence * 100)}%
                      </span>
                    </div>
                  )}

                  {activity.error && (
                    <div className="mt-2 text-xs text-red-600 bg-red-50 px-2 py-1 rounded">
                      {activity.error}
                    </div>
                  )}

                  <div className="text-xs text-gray-400 mt-1">
                    {new Date(activity.timestamp).toLocaleTimeString()}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Agent Legend */}
      {activities.length > 0 && (
        <div className="mt-4 pt-4 border-t">
          <div className="text-xs font-medium text-gray-600 mb-2">Agents</div>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="flex items-center gap-2">
              <Shield className="h-3 w-3 text-blue-600" />
              <span className="text-gray-700">PolicyAgent</span>
            </div>
            <div className="flex items-center gap-2">
              <Sparkles className="h-3 w-3 text-purple-600" />
              <span className="text-gray-700">SandboxAgent</span>
            </div>
            <div className="flex items-center gap-2">
              <BarChart3 className="h-3 w-3 text-green-600" />
              <span className="text-gray-700">ComplianceAgent</span>
            </div>
            <div className="flex items-center gap-2">
              <Brain className="h-3 w-3 text-orange-600" />
              <span className="text-gray-700">MonitoringAgent</span>
            </div>
          </div>
        </div>
      )}
    </Card>
  )
}


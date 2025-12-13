import React from 'react'
import { ACChatWidget } from '@/components/agentic/ac/ACChatWidget'
import { useEnterprise } from '@/contexts/EnterpriseContext'

/**
 * Dedicated "Agentic" screen.
 * The platform already wraps the whole app in SpineLayout (floating widget),
 * but this page gives a full-page agent workspace like the Lovable /agentic screen.
 */
const AgenticPage: React.FC = () => {
  const { currentEnterprise } = useEnterprise()

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_420px] gap-6">
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h1 className="text-2xl font-semibold text-gray-900">Agentic Workspace</h1>
        <p className="text-sm text-gray-600 mt-2">
          This is the dedicated agentic screen. Use the chat on the right to talk to Vera/agents and drive workflows.
        </p>

        <div className="mt-6 space-y-3 text-sm text-gray-700">
          <div className="p-4 rounded-lg bg-gray-50 border border-gray-200">
            <div className="font-medium">What you can do here</div>
            <ul className="list-disc list-inside mt-2 space-y-1">
              <li>Ask the agent to summarize policies or run compliance checks</li>
              <li>Kick off sandbox simulations and review results</li>
              <li>Route recommendations to review and track audit events</li>
            </ul>
          </div>

          <div className="p-4 rounded-lg bg-blue-50 border border-blue-200">
            <div className="font-medium text-blue-900">Tip</div>
            <div className="text-blue-900 mt-1">
              If you don’t see responses, confirm the agent worker is running and Supabase Realtime is enabled.
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <div className="h-[700px]">
          <ACChatWidget enterpriseId={currentEnterprise?.id} />
        </div>
      </div>
    </div>
  )
}

export default AgenticPage


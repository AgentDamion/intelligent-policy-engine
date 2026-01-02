import React from 'react'
import { VERAChatWidget } from '@/components/vera/VERAChatWidget'
import { useEnterprise } from '@/contexts/EnterpriseContext'

/**
 * Dedicated "Agentic" screen with VERA Chat.
 * VERA (Velocity Engine for Risk & Assurance) is the AI Governance Officer
 * that provides policy explanations, decision reasoning, and compliance guidance.
 */
const AgenticPage: React.FC = () => {
  const { currentEnterprise } = useEnterprise()

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_420px] gap-6">
      <div className="bg-white border border-gray-200 rounded-none p-6">
        <h1 className="text-2xl font-semibold text-gray-900">VERA Workspace</h1>
        <p className="text-sm text-gray-600 mt-2">
          Chat with VERA, your AI Governance Officer. Get instant answers about policies, 
          compliance decisions, and tool approvals.
        </p>

        <div className="mt-6 space-y-3 text-sm text-gray-700">
          <div className="p-4 rounded-none bg-gray-50 border border-gray-200">
            <div className="font-medium">What you can ask VERA:</div>
            <ul className="list-disc list-inside mt-2 space-y-1">
              <li>"Why was this tool approved/rejected?" - Get policy explanations</li>
              <li>"Can I use ChatGPT for healthcare content?" - Compliance guidance</li>
              <li>"What tools are approved for my brand?" - Tool discovery</li>
              <li>"Explain the decision for submission #123" - Decision reasoning</li>
            </ul>
          </div>

          <div className="p-4 rounded-none bg-purple-50 border border-purple-200">
            <div className="font-medium text-purple-900">About VERA</div>
            <div className="text-purple-900 mt-1">
              VERA operates at "The Boundary" between your enterprise and partners, 
              providing real-time governance decisions with full transparency and auditability.
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-none overflow-hidden">
        <div className="h-[700px]">
          <VERAChatWidget enterpriseId={currentEnterprise?.id} />
        </div>
      </div>
    </div>
  )
}

export default AgenticPage


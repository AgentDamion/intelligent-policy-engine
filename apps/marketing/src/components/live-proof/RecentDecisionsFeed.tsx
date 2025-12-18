import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import DecisionTypeBadge from './DecisionTypeBadge';
import { formatTimeAgo } from './utils';
import type { RecentDecisionsFeedProps } from '@/types/live-proof';

const RecentDecisionsFeed: React.FC<RecentDecisionsFeedProps> = ({ decisions }) => {
  // Filter out invalid decisions and provide safe defaults
  const safeDecisions = (decisions || []).filter(decision => 
    decision && typeof decision === 'object' && decision.id
  ).map(decision => ({
    id: decision.id || `decision-${Date.now()}`,
    type: (decision.type && ['approve', 'flag', 'modify', 'escalate'].includes(decision.type)) ? decision.type : 'unknown' as const,
    context: decision.context || 'No context available',
    tool: decision.tool || 'Unknown tool',
    citation: decision.citation || 'No citation',
    timestamp: decision.timestamp || new Date().toISOString(),
    human_involved: decision.human_involved || false
  }));

  return (
    <div className="space-y-3">
      <h4 className="font-semibold text-gray-900 text-sm">Recent Governance Decisions</h4>
      <div className="space-y-2 max-h-48 overflow-y-auto">
        {safeDecisions.length === 0 ? (
          <div className="text-sm text-gray-500 text-center py-4">
            No recent decisions available
          </div>
        ) : (
          <AnimatePresence>
            {safeDecisions.map((decision) => (
              <motion.div
                key={decision.id}
                className="bg-white rounded-lg p-3 border border-gray-200 shadow-sm"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
              >
                <div className="flex justify-between items-center mb-2">
                  <DecisionTypeBadge type={decision.type} />
                  <span className="text-xs text-gray-500">
                    {formatTimeAgo(decision.timestamp)}
                  </span>
                </div>
                
                <div className="text-sm text-gray-800 mb-2">
                  {decision.context}
                </div>
                
                <div className="flex flex-wrap gap-2 text-xs">
                  <span className="bg-gray-100 px-2 py-1 rounded text-gray-700">
                    Tool: {decision.tool}
                  </span>
                  <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded">
                    {decision.citation}
                  </span>
                  {decision.human_involved && (
                    <span className="bg-orange-100 text-orange-800 px-2 py-1 rounded">
                      Human Override
                    </span>
                  )}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        )}
      </div>
    </div>
  );
};

export default RecentDecisionsFeed;
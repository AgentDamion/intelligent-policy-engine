import React from 'react';
import { Bot, User, Terminal, CheckCircle2, AlertCircle, Clock } from 'lucide-react';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';

interface ActivityItem {
  id: string;
  type: string;
  actor: {
    name: string;
    type: 'agent' | 'human' | 'system';
  };
  object: string;
  time: string;
  status: 'success' | 'warning' | 'error' | 'pending';
}

const mockActivity: ActivityItem[] = [
  {
    id: '1',
    type: 'Policy Check',
    actor: { name: 'PolicyAgent-V4', type: 'agent' },
    object: 'Thread T-2934 / GPT-4o',
    time: '2m ago',
    status: 'success'
  },
  {
    id: '2',
    type: 'Human Review',
    actor: { name: 'Sarah Chen', type: 'human' },
    object: 'Decision D-9021',
    time: '12m ago',
    status: 'success'
  },
  {
    id: '3',
    type: 'Redline Trigger',
    actor: { name: 'SafetyGuard', type: 'agent' },
    object: 'Thread T-2935 / Claude 3.5',
    time: '15m ago',
    status: 'warning'
  },
  {
    id: '4',
    type: 'Evidence Compile',
    actor: { name: 'EvidenceBot', type: 'agent' },
    object: 'Bundle B-102',
    time: '45m ago',
    status: 'success'
  }
];

export const AgentActivityStream: React.FC = () => {
  return (
    <div className="bg-white border-l-[4px] border-l-aicomplyr-black shadow-none overflow-hidden rounded-none">
      <div className="px-6 pt-6 pb-4 flex items-start justify-between gap-4">
        <div>
          <div className="text-[12px] font-semibold text-neutral-500 uppercase tracking-wider">Live Agent Activity</div>
          <div className="mt-1 text-sm font-semibold text-aicomplyr-black">Agent Activity Stream</div>
        </div>
        <Button
          variant="secondary-light"
          size="sm"
          className="h-8 px-3 text-xs gap-2"
        >
          <Terminal className="h-4 w-4" />
          Raw Log
        </Button>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left border-t border-neutral-200">
          <thead>
            <tr className="bg-aicomplyr-black text-[11px] font-bold text-white uppercase tracking-widest border-b border-neutral-200">
              <th className="px-6 py-3">Type</th>
              <th className="px-6 py-3">Actor</th>
              <th className="px-6 py-3">Object</th>
              <th className="px-6 py-3">Time</th>
              <th className="px-6 py-3">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-200">
            {mockActivity.map((item) => (
              <tr key={item.id} className="hover:bg-neutral-50 transition-colors">
                <td className="px-6 py-4">
                  <span className="text-sm font-medium text-aicomplyr-black">{item.type}</span>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    <div className="h-7 w-7 bg-neutral-100 border border-neutral-200 flex items-center justify-center">
                      {item.actor.type === 'agent' ? (
                        <Bot className="h-4 w-4 text-neutral-600" />
                      ) : (
                        <User className="h-4 w-4 text-neutral-600" />
                      )}
                    </div>
                    <span className="text-sm text-neutral-700">{item.actor.name}</span>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className="text-sm text-neutral-600 font-mono">{item.object}</span>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-1.5 text-xs text-neutral-500">
                    <Clock className="h-3 w-3" />
                    {item.time}
                  </div>
                </td>
                <td className="px-6 py-4">
                  {item.status === 'success' && (
                    <Badge variant="success" className="gap-1 border border-emerald-200 bg-emerald-50 text-emerald-700 rounded-none">
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      Success
                    </Badge>
                  )}
                  {item.status === 'warning' && (
                    <Badge variant="warning" className="gap-1 border border-amber-200 bg-amber-50 text-amber-800 rounded-none">
                      <AlertCircle className="h-3.5 w-3.5" />
                      Warning
                    </Badge>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};


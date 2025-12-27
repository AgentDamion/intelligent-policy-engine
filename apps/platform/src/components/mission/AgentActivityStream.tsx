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
    <div className="bg-white border border-gray-100 rounded-xl shadow-none overflow-hidden">
      <div className="px-6 pt-6 pb-4 flex items-start justify-between gap-4">
        <div>
          <div className="text-sm font-semibold text-slate-900">Live Agent Activity</div>
          <div className="mt-1 text-xs text-slate-500">Agent Activity Stream</div>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="h-8 px-3 text-xs border-slate-200 text-slate-700 hover:bg-slate-50 gap-2"
        >
          <Terminal className="h-4 w-4" />
          Raw Log
        </Button>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left border-t border-gray-100">
          <thead>
            <tr className="bg-slate-50 text-[11px] font-bold text-slate-400 uppercase tracking-widest border-b border-gray-100">
              <th className="px-6 py-3">Type</th>
              <th className="px-6 py-3">Actor</th>
              <th className="px-6 py-3">Object</th>
              <th className="px-6 py-3">Time</th>
              <th className="px-6 py-3">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {mockActivity.map((item) => (
              <tr key={item.id} className="hover:bg-slate-50/60 transition-colors">
                <td className="px-6 py-4">
                  <span className="text-sm font-medium text-slate-900">{item.type}</span>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    <div className="h-7 w-7 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center">
                      {item.actor.type === 'agent' ? (
                        <Bot className="h-4 w-4 text-slate-600" />
                      ) : (
                        <User className="h-4 w-4 text-slate-600" />
                      )}
                    </div>
                    <span className="text-sm text-slate-700">{item.actor.name}</span>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className="text-sm text-slate-600 font-mono">{item.object}</span>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-1.5 text-xs text-slate-500">
                    <Clock className="h-3 w-3" />
                    {item.time}
                  </div>
                </td>
                <td className="px-6 py-4">
                  {item.status === 'success' && (
                    <Badge variant="success" className="gap-1 border border-green-200 bg-green-50 text-green-700">
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      Success
                    </Badge>
                  )}
                  {item.status === 'warning' && (
                    <Badge variant="warning" className="gap-1 border border-yellow-200 bg-yellow-50 text-yellow-800">
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


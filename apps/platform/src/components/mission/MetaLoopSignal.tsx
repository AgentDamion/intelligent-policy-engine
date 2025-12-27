import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { AlertTriangle } from 'lucide-react';

interface SignalProgressBarProps {
  label: string;
  value: number;
  colorClass: string;
}

const SignalProgressBar: React.FC<SignalProgressBarProps> = ({ label, value, colorClass }) => (
  <div className="space-y-1.5">
    <div className="flex justify-between items-center text-xs">
      <span className="text-slate-700">{label}</span>
      <span className="text-slate-500">{value}%</span>
    </div>
    <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
      <div 
        className={`h-full ${colorClass} transition-all duration-500`} 
        style={{ width: `${value}%` }}
      />
    </div>
  </div>
);

export const MetaLoopSignal: React.FC = () => {
  return (
    <Card className="border border-gray-100 shadow-none bg-white h-full">
      <CardHeader className="px-6 pt-6 pb-0 border-b-0">
        <CardTitle className="text-sm font-semibold text-slate-900">Meta-Loop Signal</CardTitle>
      </CardHeader>
      <CardContent className="px-6 pt-4 pb-6">
        <div className="space-y-5">
          <SignalProgressBar label="Policy Compliance" value={94} colorClass="bg-emerald-500" />
          <SignalProgressBar label="Agent Efficiency" value={87} colorClass="bg-blue-500" />
          <SignalProgressBar label="Audit Readiness" value={98} colorClass="bg-emerald-500" />
        </div>

        {/* Alert card below progress bars */}
        <div className="mt-6 rounded-lg border border-rose-100 bg-rose-50 px-4 py-3">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-rose-600" aria-hidden="true" />
            <div className="text-sm font-semibold text-rose-700">Thread T-2934</div>
          </div>
          <div className="mt-1 text-xs text-rose-700/80">SLA breach requires attention</div>
        </div>
      </CardContent>
    </Card>
  );
};



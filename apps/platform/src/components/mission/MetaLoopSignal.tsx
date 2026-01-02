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
    <div className="flex justify-between items-center text-[11px] font-semibold uppercase tracking-wider text-neutral-500">
      <span>{label}</span>
      <span className="font-mono text-xs">{value}%</span>
    </div>
    <div className="h-1.5 w-full bg-neutral-100 rounded-none overflow-hidden">
      <div 
        className={`h-full ${colorClass} transition-all duration-500 rounded-none`} 
        style={{ width: `${value}%` }}
      />
    </div>
  </div>
);

export const MetaLoopSignal: React.FC = () => {
  return (
    <Card className="shadow-none bg-white h-full">
      <CardHeader className="px-6 pt-6 pb-0 border-b-0">
        <CardTitle>Meta-Loop Signal</CardTitle>
      </CardHeader>
      <CardContent className="px-6 pt-4 pb-6">
        <div className="space-y-5">
          <SignalProgressBar label="Policy Compliance" value={94} colorClass="bg-status-approved" />
          <SignalProgressBar label="Agent Efficiency" value={87} colorClass="bg-aicomplyr-black" />
          <SignalProgressBar label="Audit Readiness" value={98} colorClass="bg-status-approved" />
        </div>

        {/* Alert card below progress bars */}
        <div className="mt-6 rounded-none border-l-structural border-l-status-denied bg-red-50 px-4 py-3 border border-neutral-200">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-status-denied" aria-hidden="true" />
            <div className="text-sm font-semibold text-status-denied uppercase tracking-wider">Thread T-2934</div>
          </div>
          <div className="mt-1 text-xs text-status-denied font-medium">SLA breach requires attention</div>
        </div>
      </CardContent>
    </Card>
  );
};



import React from 'react';
import { Shield } from 'lucide-react';

export function SecurityBadge() {
  return (
    <div className="glass-badge group hover:scale-105 transition-all duration-300 cursor-default">
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-lg bg-brand-teal/10 group-hover:bg-brand-teal/20 transition-colors">
          <Shield className="w-5 h-5 text-brand-teal" />
        </div>
        <div>
          <p className="text-sm font-semibold text-white">Enterprise-Grade Security</p>
          <p className="text-xs text-slate-300">SOC 2 • GDPR • HIPAA Ready</p>
        </div>
      </div>
    </div>
  );
}

import React, { useState, useEffect } from 'react';
import { CheckCircle } from 'lucide-react';
import { mockMetrics } from '@/content/alternate2LandingNew';

export function AnnouncementRibbon() {
  const [count, setCount] = useState(mockMetrics.currentMonthAccelerations);

  useEffect(() => {
    const interval = setInterval(() => {
      setCount(prev => prev + Math.floor(Math.random() * 3) + 1);
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="w-full bg-mint-50 border-b border-mint-500/20 py-3">
      <div className="container mx-auto px-6 flex justify-center">
        <div className="inline-flex items-center gap-2 px-6 py-2 bg-white rounded-full shadow-sm border border-mint-500/20">
          <CheckCircle className="w-4 h-4 text-mint-500" />
          <span className="text-sm font-medium text-slate-700">
            Approvals accelerated this month:
          </span>
          <span className="font-bold text-mint-500">
            {count.toLocaleString()}
          </span>
          <div className="w-2 h-2 bg-mint-500 rounded-full animate-pulse"></div>
        </div>
      </div>
    </div>
  );
}
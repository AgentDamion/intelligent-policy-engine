import React from 'react';
import { Check, X, AlertTriangle } from 'lucide-react';

const LiveComplianceMetrics = () => {
  const metrics = [
    { label: "AI Tools Monitored", value: "247", trend: "+12 this week" },
    { label: "Compliance Rate", value: "99.7%", trend: "↑ 0.3%" },
    { label: "Policy Violations", value: "0", trend: "24 hrs clean" },
    { label: "Audit-Ready Reports", value: "156", trend: "Auto-generated" }
  ];

  const terminalLogs = [
    { time: "14:23:17", status: "compliant", message: "Document review policy applied - FDA 21 CFR Part 11", icon: Check },
    { time: "14:23:12", status: "escalated", message: "Content policy review required - Client Brand Safety", icon: AlertTriangle },
    { time: "14:23:08", status: "compliant", message: "Data processing validated - GDPR Article 22", icon: Check },
    { time: "14:23:03", status: "blocked", message: "PII detected in prompt - Data Protection Policy", icon: X },
    { time: "14:22:58", status: "compliant", message: "Model selection approved - Enterprise AI Policy", icon: Check },
    { time: "14:22:54", status: "compliant", message: "Bias testing passed - Fairness Framework", icon: Check }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'compliant': return 'text-green-500';
      case 'blocked': return 'text-red-500';
      case 'escalated': return 'text-orange-500';
      default: return 'text-gray-500';
    }
  };

  return (
    <section className="py-16 lg:py-24 bg-brand-taupe">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl lg:text-5xl font-bold text-brand-dark mb-6 font-heading">
            Live Compliance Metrics
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Real-time visibility into AI governance decisions across all your tools and processes.
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-12">
          {/* Left Column - Metrics */}
          <div className="bg-white rounded-xl p-8 shadow-lg">
            <h3 className="text-2xl font-bold text-brand-dark mb-8">
              Live Governance Dashboard
            </h3>
            <div className="grid grid-cols-2 gap-6">
              {metrics.map((metric, index) => (
                <div key={index} className="text-center p-4">
                  <div className="text-3xl font-bold text-brand-teal mb-2">{metric.value}</div>
                  <div className="text-sm font-medium text-brand-dark mb-1">{metric.label}</div>
                  <div className="text-xs text-gray-500">{metric.trend}</div>
                </div>
              ))}
            </div>
            
            <div className="mt-8 p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-brand-dark">Overall Compliance Score</span>
                <span className="text-2xl font-bold text-green-600">99.7%</span>
              </div>
              <div className="mt-2 bg-gray-200 rounded-full h-2">
                <div className="bg-green-500 h-2 rounded-full" style={{ width: '99.7%' }}></div>
              </div>
            </div>
          </div>

          {/* Right Column - Terminal Mockup */}
          <div className="bg-gray-900 rounded-xl p-6 shadow-lg">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-white">Live Compliance Feed</h3>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
                <span className="text-green-400 text-sm">Live</span>
              </div>
            </div>
            
            <div className="space-y-3 font-mono text-sm max-h-96 overflow-y-auto">
              {terminalLogs.map((log, index) => (
                <div key={index} className="flex items-start space-x-3">
                  <span className="text-gray-400">{log.time}</span>
                  <log.icon className={`w-4 h-4 mt-0.5 ${getStatusColor(log.status)}`} />
                  <span className="text-gray-300 flex-1">{log.message}</span>
                </div>
              ))}
            </div>
            
            <div className="mt-4 p-3 bg-gray-800 rounded border-l-4 border-blue-400">
              <div className="text-blue-400 text-xs font-medium">SYSTEM STATUS</div>
              <div className="text-white text-sm">All systems operational • Next policy sync in 47 seconds</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default LiveComplianceMetrics;
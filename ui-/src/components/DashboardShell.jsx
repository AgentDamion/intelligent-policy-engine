// File: ui/components/DashboardShell.jsx

import React, { useState } from 'react';
import MetaLoopStatus from './MetaLoopStatus';
import AgentPanel from './AgentPanel';

const DashboardShell = ({ children, pageTitle = "Dashboard", onSectionChange }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [agentPanelOpen, setAgentPanelOpen] = useState(false);
  const [activeNav, setActiveNav] = useState('dashboard');

  const navigation = [
    { name: 'Dashboard', href: 'dashboard', icon: '📊' },
    { name: 'Policy Engine', href: 'policy-engine', icon: '⚙️' },
    { name: 'Inventory', href: 'inventory', icon: '📦' },
    { name: 'Audit Log', href: 'audit-log', icon: '📋' },
    { name: 'Partners', href: 'partners', icon: '🤝' },
    { name: 'Settings', href: 'settings', icon: '⚙️' }
  ];

  const handleNavClick = (href) => {
    setActiveNav(href);
    setSidebarOpen(false); // Close sidebar on mobile after selection
    if (onSectionChange) {
      onSectionChange(href);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-40 bg-gray-600 bg-opacity-75 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`
        fixed inset-y-0 left-0 z-50 w-64 transform bg-gradient-to-b from-teal-600 to-blue-700 
        transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="flex h-full flex-col">
          {/* Logo */}
          <div className="flex h-16 items-center justify-center border-b border-teal-500/20">
            <div className="flex items-center space-x-2">
              <div className="h-8 w-8 rounded-full bg-white/20 flex items-center justify-center">
                <span className="text-white text-lg">🐦</span>
              </div>
              <span className="text-white font-semibold text-lg">AICOMPLYR</span>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 space-y-1 px-4 py-6">
            {navigation.map((item) => (
              <button
                key={item.name}
                onClick={() => handleNavClick(item.href)}
                className={`
                  group flex w-full items-center px-3 py-2 text-sm font-medium rounded-lg
                  transition-colors duration-200
                  ${activeNav === item.href
                    ? 'bg-white/20 text-white shadow-lg'
                    : 'text-white/80 hover:bg-white/10 hover:text-white'
                  }
                `}
              >
                <span className="mr-3 text-lg">{item.icon}</span>
                {item.name}
              </button>
            ))}
          </nav>

          {/* Bottom section */}
          <div className="border-t border-teal-500/20 p-4">
            <div className="flex items-center space-x-3">
              <div className="h-8 w-8 rounded-full bg-white/20 flex items-center justify-center">
                <span className="text-white text-sm">👤</span>
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-white">John Doe</p>
                <p className="text-xs text-white/70">Enterprise Admin</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="lg:pl-64">
        {/* Top navbar */}
        <div className="sticky top-0 z-30 bg-white shadow-sm border-b border-gray-200">
          <div className="flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
            {/* Left: Mobile menu button and logo */}
            <div className="flex items-center">
              <button
                type="button"
                className="lg:hidden -m-2.5 inline-flex items-center justify-center rounded-md p-2.5 text-gray-700"
                onClick={() => setSidebarOpen(true)}
              >
                <span className="sr-only">Open sidebar</span>
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
                </svg>
              </button>
              
              {/* Desktop logo */}
              <div className="hidden lg:flex items-center ml-4">
                <div className="h-8 w-8 rounded-full bg-gradient-to-r from-teal-500 to-blue-600 flex items-center justify-center">
                  <span className="text-white text-sm font-bold">🐦</span>
                </div>
              </div>
            </div>

            {/* Center: Page title */}
            <div className="flex-1 flex justify-center lg:justify-start lg:ml-8">
              <h1 className="text-xl font-semibold text-gray-900">{pageTitle}</h1>
            </div>

            {/* Right: Meta-Loop status and user profile */}
            <div className="flex items-center space-x-4">
              {/* Meta-Loop Status */}
              <MetaLoopStatus />
              
              {/* User profile */}
              <div className="flex items-center space-x-3">
                <button
                  onClick={() => setAgentPanelOpen(!agentPanelOpen)}
                  className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors duration-200"
                >
                  <span className="text-gray-600">🤖</span>
                </button>
                
                <div className="h-8 w-8 rounded-full bg-gradient-to-r from-teal-500 to-blue-600 flex items-center justify-center">
                  <span className="text-white text-sm font-medium">JD</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Main content area */}
        <main className="flex-1">
          <div className="py-6">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
              {children}
            </div>
          </div>
        </main>
      </div>

      {/* Agent Panel */}
      <AgentPanel isOpen={agentPanelOpen} onClose={() => setAgentPanelOpen(false)} />
    </div>
  );
};

export default DashboardShell; 
// src/App.jsx
import React from 'react';
import './App.css';
import UnifiedPlatform from './components/UnifiedPlatform';
import { UserProvider } from './contexts/UserContext';
import { AgentProvider } from './contexts/AgentContext';
import { WorkflowProvider } from './contexts/WorkflowContext';

function App() {
  return (
    <UserProvider>
      <AgentProvider>
        <WorkflowProvider>
          <UnifiedPlatform />
        </WorkflowProvider>
      </AgentProvider>
    </UserProvider>
  );
}

export default App;
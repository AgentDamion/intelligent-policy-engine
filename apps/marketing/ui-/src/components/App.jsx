import React, { useState } from 'react';
import DashboardShell from './DashboardShell';
import DashboardContent from './DashboardContent';
import WebSocketTest from './WebSocketTest';

const App = () => {
  const [activeSection, setActiveSection] = useState('dashboard');

  const handleSectionChange = (section) => {
    console.log('📍 Navigating to section:', section);
    setActiveSection(section);
  };

  return (
    <div>
      <WebSocketTest />
      <DashboardShell
        pageTitle={activeSection === 'dashboard' ? 'Dashboard' : activeSection.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
        onSectionChange={handleSectionChange}
      >
        <DashboardContent activeSection={activeSection} />
      </DashboardShell>
    </div>
  );
};

export default App;

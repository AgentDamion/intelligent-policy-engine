import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { initializeEnvironment } from './utils/envValidation'
import { monitoring } from './utils/monitoring'
import { displayProductionReport } from './utils/productionCheck'

// Initialize monitoring and environment validation
try {
  initializeEnvironment();
  monitoring.info('Application starting', { version: '1.0.0' });
  
  // Run production readiness checks in development
  if (import.meta.env.DEV) {
    displayProductionReport();
  }
} catch (error) {
  monitoring.error('Failed to initialize application', error);
  throw error;
}

createRoot(document.getElementById("root")!).render(<App />);

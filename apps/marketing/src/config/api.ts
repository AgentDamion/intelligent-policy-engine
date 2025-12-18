// Get API base URL from localStorage settings or fallback to defaults
const getStoredSettings = () => {
  try {
    const stored = localStorage.getItem('api-settings');
    return stored ? JSON.parse(stored) : null;
  } catch {
    return null;
  }
};

const getAPIBaseURL = () => {
  const settings = getStoredSettings();
  return settings?.apiBaseUrl || import.meta.env.VITE_API_URL || 'http://localhost:3000';
};

const getWSBaseURL = () => {
  const settings = getStoredSettings();
  return settings?.wsBaseUrl || import.meta.env.VITE_WS_URL || 'ws://localhost:3000';
};

export const API_BASE_URL = getAPIBaseURL();
export const WS_BASE_URL = getWSBaseURL();

// Listen for settings changes and update configuration
window.addEventListener('api-settings-changed', () => {
  // Force a page reload to update all API calls with new settings
  window.location.reload();
});

// Log configuration for debugging (development only)
if (import.meta.env.DEV) {
  console.log('API Configuration:', {
    VITE_API_URL: import.meta.env.VITE_API_URL,
    VITE_WS_URL: import.meta.env.VITE_WS_URL,
    API_BASE_URL,
    WS_BASE_URL,
    storedSettings: getStoredSettings()
  });
}

// Helper function to construct API URLs
export const getApiUrl = (endpoint: string) => {
  if (!API_BASE_URL) {
    // Fallback to relative paths if no base URL is set
    return endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  }
  
  // Remove leading slash from endpoint to avoid double slashes
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint.slice(1) : endpoint;
  
  // Ensure we don't duplicate /api in the URL
  if (API_BASE_URL.endsWith('/api') && cleanEndpoint.startsWith('api/')) {
    return `${API_BASE_URL}/${cleanEndpoint.slice(4)}`;
  }
  
  return `${API_BASE_URL}/${cleanEndpoint}`;
};

// Helper function to construct WebSocket URLs
export const getWsUrl = (endpoint: string = '') => {
  if (!WS_BASE_URL) {
    return endpoint;
  }
  
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint.slice(1) : endpoint;
  return cleanEndpoint ? `${WS_BASE_URL}/${cleanEndpoint}` : WS_BASE_URL;
};
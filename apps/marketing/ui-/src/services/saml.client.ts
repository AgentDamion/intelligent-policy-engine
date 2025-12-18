// SAML helpers for Okta and other SAML providers

export interface SAMLConfig {
  entityId: string;
  ssoUrl: string;
  certificate: string;
}

// Initiate SAML SSO flow
export const initiateSAMLSSO = (returnUrl?: string) => {
  const params = new URLSearchParams();
  if (returnUrl) {
    params.append('RelayState', returnUrl);
  }
  
  // Redirect to backend SAML endpoint which will handle the SAML request
  window.location.assign(`/api/saml/start?${params.toString()}`);
};

// Handle SAML callback/assertion
export const handleSAMLCallback = async (samlResponse: string, relayState?: string) => {
  const response = await fetch('/api/saml/callback', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ 
      SAMLResponse: samlResponse,
      RelayState: relayState 
    }),
    credentials: 'include',
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'SAML authentication failed');
  }

  return response.json();
};

// Get SAML metadata for configuration
export const getSAMLMetadata = async (): Promise<string> => {
  const response = await fetch('/api/saml/metadata');
  
  if (!response.ok) {
    throw new Error('Failed to fetch SAML metadata');
  }
  
  return response.text();
};

// Check if SAML is configured for the organization
export const checkSAMLConfig = async (emailDomain: string): Promise<boolean> => {
  try {
    const response = await fetch(`/api/saml/check-config?domain=${emailDomain}`);
    if (!response.ok) {
      return false;
    }
    const data = await response.json();
    return data.configured;
  } catch {
    return false;
  }
};

// SAML logout
export const initiateSAMLLogout = () => {
  window.location.assign('/api/saml/logout');
};

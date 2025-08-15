// OAuth helpers for Google and Microsoft authentication

export interface OAuthConfig {
  provider: 'google' | 'microsoft';
  clientId: string;
  redirectUri: string;
  scope: string[];
}

export const getOAuthUrl = (config: OAuthConfig): string => {
  const baseUrls = {
    google: 'https://accounts.google.com/o/oauth2/v2/auth',
    microsoft: 'https://login.microsoftonline.com/common/oauth2/v2.0/authorize',
  };

  const params = new URLSearchParams({
    client_id: config.clientId,
    redirect_uri: config.redirectUri,
    response_type: 'code',
    scope: config.scope.join(' '),
    access_type: 'offline',
    prompt: 'select_account',
  });

  return `${baseUrls[config.provider]}?${params.toString()}`;
};

export const handleOAuthCallback = async (code: string, provider: 'google' | 'microsoft') => {
  const response = await fetch(`/api/oauth/callback/${provider}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ code }),
    credentials: 'include',
  });

  if (!response.ok) {
    throw new Error('OAuth authentication failed');
  }

  return response.json();
};

// Popup-based OAuth flow (alternative to redirect)
export const openOAuthPopup = (provider: 'google' | 'microsoft'): Promise<void> => {
  return new Promise((resolve, reject) => {
    const width = 500;
    const height = 600;
    const left = window.screenX + (window.outerWidth - width) / 2;
    const top = window.screenY + (window.outerHeight - height) / 2;

    const popup = window.open(
      `/api/oauth/start/${provider}`,
      `${provider}-oauth`,
      `width=${width},height=${height},left=${left},top=${top}`
    );

    const checkInterval = setInterval(() => {
      try {
        if (popup?.closed) {
          clearInterval(checkInterval);
          reject(new Error('OAuth popup was closed'));
        }
      } catch (e) {
        // Cross-origin error, popup is still open
      }
    }, 1000);

    // Listen for success message from popup
    const handleMessage = (event: MessageEvent) => {
      if (event.data.type === 'oauth-success' && event.data.provider === provider) {
        clearInterval(checkInterval);
        window.removeEventListener('message', handleMessage);
        popup?.close();
        resolve();
      }
    };

    window.addEventListener('message', handleMessage);
  });
};

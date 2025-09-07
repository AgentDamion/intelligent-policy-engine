// frontend/lib/supabase-client.js
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
});

// Auth helper functions
export const auth = {
  // Sign up with enterprise context
  async signUp(email, password, enterpriseId, role = 'member') {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          enterprise_id: enterpriseId,
          enterprise_role: role
        }
      }
    });
    
    if (!error && data.user) {
      // Set enterprise context server-side
      await fetch(`${import.meta.env.VITE_API_URL}/api/users/${data.user.id}/enterprise`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${data.session.access_token}`
        },
        body: JSON.stringify({ enterprise_id: enterpriseId, role })
      });
    }
    
    return { data, error };
  },
  
  // Sign in
  async signIn(email, password) {
    return await supabase.auth.signInWithPassword({ email, password });
  },
  
  // Sign out
  async signOut() {
    return await supabase.auth.signOut();
  },
  
  // Get current user
  async getUser() {
    return await supabase.auth.getUser();
  },
  
  // Get session (includes token)
  async getSession() {
    return await supabase.auth.getSession();
  },
  
  // Subscribe to auth changes
  onAuthStateChange(callback) {
    return supabase.auth.onAuthStateChange(callback);
  }
};

// API client with automatic auth
export const api = {
  async request(endpoint, options = {}) {
    const { data: { session } } = await supabase.auth.getSession();
    
    const response = await fetch(`${import.meta.env.VITE_API_URL}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(session?.access_token && {
          'Authorization': `Bearer ${session.access_token}`
        }),
        ...options.headers
      }
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'API request failed');
    }
    
    return response.json();
  },
  
  get(endpoint) {
    return this.request(endpoint, { method: 'GET' });
  },
  
  post(endpoint, data) {
    return this.request(endpoint, {
      method: 'POST',
      body: JSON.stringify(data)
    });
  },
  
  put(endpoint, data) {
    return this.request(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  },
  
  delete(endpoint) {
    return this.request(endpoint, { method: 'DELETE' });
  }
};

// WebSocket client with auth
export class AuthenticatedWebSocket {
  constructor() {
    this.ws = null;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
  }
  
  async connect() {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      throw new Error('No authentication session');
    }
    
    const wsUrl = `${import.meta.env.VITE_WS_URL}/ws?token=${session.access_token}`;
    
    this.ws = new WebSocket(wsUrl);
    
    this.ws.onopen = () => {
      console.log('WebSocket connected');
      this.reconnectAttempts = 0;
    };
    
    this.ws.onclose = () => {
      console.log('WebSocket disconnected');
      this.attemptReconnect();
    };
    
    this.ws.onerror = (error) => {
      console.error('WebSocket error:', error);
    };
    
    return new Promise((resolve, reject) => {
      this.ws.onopen = () => {
        this.reconnectAttempts = 0;
        resolve(this.ws);
      };
      this.ws.onerror = reject;
    });
  }
  
  async attemptReconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      console.log(`Reconnecting... (${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
      setTimeout(() => this.connect(), 2000 * this.reconnectAttempts);
    }
  }
  
  send(data) {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(data));
    }
  }
  
  close() {
    if (this.ws) {
      this.ws.close();
    }
  }
}

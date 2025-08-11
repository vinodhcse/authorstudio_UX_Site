// API Client for authentication and user management

export interface LoginRequest {
  email: string;
  password: string;
  deviceId: string;
}

export interface SignupRequest {
  name: string;
  email: string;
  password: string;
  deviceId: string;
}

export interface AuthResponse {
  token: string;
  userId: string;
  globalRole?: string;
  name?: string;
  email?: string;
}

export interface RefreshTokenRequest {
  refreshToken: string;
}

export interface SubscriptionInfo {
  status: 'active' | 'grace' | 'expired';
  expiresAt: number;
  lastCheckedAt: number;
}

export interface LocalSession {
  userId: string;
  email: string;
  name: string;
  deviceId: string;
  accessToken?: string;
  accessExp?: number;
  refreshTokenEnc?: string;  // AES-GCM with AppKey
  subscription: SubscriptionInfo;
  appKeyBundle: { appKeyEnc: string; salt: string; iterations: number };
  deviceKeypair: { publicKey: string; privateKeyEnc: string };
  sessionVersion: number;
  updatedAt: number;
}

// Check if running in Tauri environment
const isTauri = () => {
  return typeof window !== 'undefined' && '__TAURI__' in window;
};

class ApiClient {
  private baseUrl: string;
  private authToken: string | null = null;

  constructor() {
    this.baseUrl = (import.meta as any).env?.VITE_API_BASE_URL || 'http://localhost:4000/api';
  }

  private async makeRequest<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    
    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    };

    // Add auth token if available
    const token = this.authToken || await this.getStoredToken();
    if (token && !endpoint.includes('/auth/login') && !endpoint.includes('/auth/signup')) {
      config.headers = {
        ...config.headers,
        Authorization: `Bearer ${token}`,
      };
    }

    try {
      const response = await fetch(url, config);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        
        // Handle unauthorized errors
        if (response.status === 401) {
          await this.handleUnauthorized();
          throw new Error('Authentication failed. Please login again.');
        }
        
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('API request failed:', error);
      throw error;
    }
  }

  private async handleUnauthorized() {
    // Clear stored tokens and trigger re-authentication
    this.authToken = null;
    await this.clearStoredAuth();
  }

  // Storage methods - use Tauri file system if available, fallback to localStorage
  private async setSecureItem(key: string, value: string): Promise<void> {
    if (isTauri()) {
      try {
        const { writeTextFile } = await import('@tauri-apps/plugin-fs');
        const { appDataDir } = await import('@tauri-apps/api/path');
        
        const appDir = await appDataDir();
        const filePath = `${appDir}/auth/${key}.dat`;
        
        await writeTextFile(filePath, value);
      } catch (error) {
        console.warn('Failed to store in Tauri, falling back to localStorage:', error);
        localStorage.setItem(key, value);
      }
    } else {
      localStorage.setItem(key, value);
    }
  }

  private async getSecureItem(key: string): Promise<string | null> {
    if (isTauri()) {
      try {
        const { readTextFile } = await import('@tauri-apps/plugin-fs');
        const { appDataDir } = await import('@tauri-apps/api/path');
        
        const appDir = await appDataDir();
        const filePath = `${appDir}/auth/${key}.dat`;
        
        return await readTextFile(filePath);
      } catch (error) {
        console.warn('Failed to read from Tauri, falling back to localStorage:', error);
        return localStorage.getItem(key);
      }
    } else {
      return localStorage.getItem(key);
    }
  }

  private async removeSecureItem(key: string): Promise<void> {
    if (isTauri()) {
      try {
        const { remove } = await import('@tauri-apps/plugin-fs');
        const { appDataDir } = await import('@tauri-apps/api/path');
        
        const appDir = await appDataDir();
        const filePath = `${appDir}/auth/${key}.dat`;
        
        await remove(filePath);
      } catch (error) {
        console.warn('Failed to remove from Tauri, falling back to localStorage:', error);
        localStorage.removeItem(key);
      }
    } else {
      localStorage.removeItem(key);
    }
  }

  private async getStoredToken(): Promise<string | null> {
    if (this.authToken) return this.authToken;
    
    const token = await this.getSecureItem('authToken');
    if (token) {
      this.authToken = token;
    }
    return token;
  }

  private async clearStoredAuth(): Promise<void> {
    const keysToRemove = [
      'authToken', 'userId', 'userName', 'userEmail', 'userRole', 
      'refreshToken', 'localSession', 'deviceId'
    ];
    
    for (const key of keysToRemove) {
      await this.removeSecureItem(key);
    }
  }

  // Authentication methods
  async login(credentials: LoginRequest): Promise<AuthResponse> {
    const response = await this.makeRequest<AuthResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });

    // Store token and user info securely
    this.authToken = response.token;
    await this.setSecureItem('authToken', response.token);
    await this.setSecureItem('userId', response.userId);
    
    if (response.name) await this.setSecureItem('userName', response.name);
    if (response.email) await this.setSecureItem('userEmail', response.email);
    if (response.globalRole) await this.setSecureItem('userRole', response.globalRole);

    return response;
  }

  async signup(userData: SignupRequest): Promise<AuthResponse> {
    const response = await this.makeRequest<AuthResponse>('/auth/signup', {
      method: 'POST',
      body: JSON.stringify(userData),
    });

    // Store token and user info securely
    this.authToken = response.token;
    await this.setSecureItem('authToken', response.token);
    await this.setSecureItem('userId', response.userId);

    return response;
  }

  async refreshToken(): Promise<AuthResponse> {
    const currentRefreshToken = await this.getSecureItem('refreshToken');
    if (!currentRefreshToken) {
      throw new Error('No refresh token available');
    }

    const response = await this.makeRequest<AuthResponse>('/auth/refresh-token', {
      method: 'POST',
      body: JSON.stringify({ refreshToken: currentRefreshToken }),
    });

    // Update stored token
    this.authToken = response.token;
    await this.setSecureItem('authToken', response.token);

    return response;
  }

  // Enhanced auth utilities with Tauri support
  async isAuthenticated(): Promise<boolean> {
    const token = await this.getStoredToken();
    return !!token;
  }

  async logout(): Promise<void> {
    this.authToken = null;
    await this.clearStoredAuth();
  }

  async getCurrentUser() {
    const [token, userId, name, email, role] = await Promise.all([
      this.getSecureItem('authToken'),
      this.getSecureItem('userId'),
      this.getSecureItem('userName'),
      this.getSecureItem('userEmail'),
      this.getSecureItem('userRole')
    ]);

    return {
      token,
      userId,
      name,
      email,
      role,
    };
  }

  // Enhanced device ID generation with Tauri-specific identifiers
  async generateDeviceId(): Promise<string> {
    let deviceId = await this.getSecureItem('deviceId');
    
    if (!deviceId) {
      let identifier = 'web';
      
      if (isTauri()) {
        try {
          // Try to get more specific device info from Tauri if available
          identifier = 'tauri';
          // Could be enhanced later with platform-specific info
        } catch (error) {
          console.warn('Failed to get Tauri device info:', error);
          identifier = 'tauri';
        }
      }
      
      deviceId = `${identifier}_${Math.random().toString(36).substr(2, 9)}_${Date.now()}`;
      await this.setSecureItem('deviceId', deviceId);
    }
    
    return deviceId;
  }

  // Enhanced token management
  async ensureAccessToken(): Promise<string> {
    let token = await this.getStoredToken();
    
    if (!token) {
      throw new Error('No access token available. Please login.');
    }

    // TODO: Add token expiry checking logic here
    // For now, return the token as-is
    return token;
  }

  // Subscription management
  async getSubscriptionInfo(): Promise<SubscriptionInfo | null> {
    const sessionData = await this.getSecureItem('localSession');
    if (!sessionData) return null;

    try {
      const session: LocalSession = JSON.parse(sessionData);
      return session.subscription;
    } catch (error) {
      console.error('Failed to parse local session:', error);
      return null;
    }
  }

  async updateSubscriptionInfo(subscription: SubscriptionInfo): Promise<void> {
    const sessionData = await this.getSecureItem('localSession');
    if (!sessionData) return;

    try {
      const session: LocalSession = JSON.parse(sessionData);
      session.subscription = subscription;
      session.updatedAt = Date.now();
      
      await this.setSecureItem('localSession', JSON.stringify(session));
    } catch (error) {
      console.error('Failed to update subscription info:', error);
    }
  }

  // Network status checking
  isOnline(): boolean {
    return typeof navigator !== 'undefined' ? navigator.onLine : true;
  }

  // Enhanced error handling for offline scenarios
  async makeAuthenticatedRequest<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    if (!this.isOnline()) {
      throw new Error('Network unavailable. Operating in offline mode.');
    }

    try {
      const token = await this.ensureAccessToken();
      
      const config = {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
          ...options.headers,
        },
      };

      return await this.makeRequest<T>(endpoint, config);
    } catch (error) {
      if (error instanceof Error && error.message.includes('401')) {
        // Try to refresh token once
        try {
          await this.refreshToken();
          const newToken = await this.ensureAccessToken();
          
          const retryConfig = {
            ...options,
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${newToken}`,
              ...options.headers,
            },
          };

          return await this.makeRequest<T>(endpoint, retryConfig);
        } catch (refreshError) {
          // If refresh fails, clear auth and throw
          await this.logout();
          throw new Error('Session expired. Please login again.');
        }
      }
      throw error;
    }
  }
}

export const apiClient = new ApiClient();

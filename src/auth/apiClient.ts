// API Client for Tauri-only authentication
import { fetch } from '@tauri-apps/plugin-http';

export interface LoginRequest {
  email: string;
  password: string;
  deviceId: string;
}

export interface SignupRequest {
  name: string;
  email: string;
  password: string;
}

export interface AuthResponse {
  token: string;
  refreshToken: string;
  userId: string;
  globalRole?: string;
  name?: string;
  email?: string;
}

export interface RefreshTokenRequest {
  refreshToken: string;
}

export interface RefreshTokenResponse {
  token: string;
}

export interface SignupResponse {
  userId: string;
  requiresEmailVerification?: boolean;
}

export interface EmailVerificationRequest {
  email: string;
  code: string;
}

export interface EmailVerificationResponse {
  ok: boolean;
}

export interface SubscriptionResponse {
  status: 'active' | 'grace' | 'expired';
  expiresAt: number;
}

export interface DeviceRegistrationRequest {
  deviceId: string;
  devicePublicKey: string;
  platform: string;
  appVersion: string;
}

class TauriApiClient {
  private baseUrl: string;
  private accessToken: string | null = null;

  constructor() {
    // Read from environment variable or use default
    this.baseUrl = (import.meta as any).env?.VITE_API_BASE_URL || 'http://localhost:4000/api';
  }

  /**
   * Set access token for authenticated requests
   */
  setAccessToken(token: string | null): void {
    this.accessToken = token;
  }

  /**
   * Get current access token
   */
  getAccessToken(): string | null {
    return this.accessToken;
  }

  /**
   * Make HTTP request with JSON body and bearer token
   */
  private async makeRequest<T>(
    endpoint: string,
    options: {
      method?: string;
      body?: any;
      requiresAuth?: boolean;
    } = {}
  ): Promise<T> {
    const { method = 'GET', body, requiresAuth = false } = options;
    const url = `${this.baseUrl}${endpoint}`;
    
    console.log('🌐 [HTTP] Starting request:', {
      method,
      endpoint,
      url,
      requiresAuth,
      hasToken: !!this.accessToken,
      isOnline: this.isOnline()
    });

    // Prepare headers
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    // Add authorization header if required and token available
    if (requiresAuth && this.accessToken) {
      headers['Authorization'] = `Bearer ${this.accessToken}`;
      console.log('🔑 [HTTP] Authorization header added');
    }

    // Prepare request body
    let requestBody: string | undefined;
    if (body) {
      requestBody = JSON.stringify(body);
      console.log('📦 [HTTP] Request body prepared:', {
        bodySize: requestBody.length,
        hasEmail: body.email ? '✓' : '✗',
        hasPassword: body.password ? '✓' : '✗',
        hasDeviceId: body.deviceId ? '✓' : '✗'
      });
    }

    try {
      console.log('📡 [HTTP] Sending request to:', url);
      
      const response = await fetch(url, {
        method,
        headers,
        body: requestBody,
      });

      console.log('Response status:', response.status);
      console.log('Response headers:', response.headers);

      if (!response.ok) {
        let errorMessage = `HTTP error! status: ${response.status}`;
        
        try {
          const errorData = await response.json();
          errorMessage = errorData.message || errorMessage;
        } catch {
          // Ignore JSON parsing errors for error responses
        }
        
        throw new Error(errorMessage);
      }

      return await response.json();
    } catch (error) {
      console.error('API request failed:', error);
      console.error('Error details:', {
        name: (error as any)?.name,
        message: (error as any)?.message,
        stack: (error as any)?.stack,
        url,
        method,
        headers
      });
      throw error;
    }
  }

  /**
   * Sign up new user
   */
  async signup(userData: SignupRequest): Promise<SignupResponse> {
    return await this.makeRequest<SignupResponse>('/auth/signup', {
      method: 'POST',
      body: userData,
    });
  }

  /**
   * Verify email with code
   */
  async verifyEmail(request: EmailVerificationRequest): Promise<EmailVerificationResponse> {
    return await this.makeRequest<EmailVerificationResponse>('/auth/verify-email', {
      method: 'POST',
      body: request,
    });
  }

  /**
   * Login user
   */
  async login(credentials: LoginRequest): Promise<AuthResponse> {
    console.log('🌐 [API] Starting login request for:', credentials.email);
    console.log('🔧 [API] Device ID:', credentials.deviceId);
    
    const response = await this.makeRequest<AuthResponse>('/auth/login', {
      method: 'POST',
      body: credentials,
    });

    console.log('✅ [API] Login response received:', {
      userId: response.userId,
      email: response.email,
      name: response.name,
      hasToken: !!response.token
    });

    // Store the access token
    this.setAccessToken(response.token);
    console.log('💾 [API] Access token stored');

    return response;
  }

  /**
   * Refresh access token
   */
  async refreshToken(request: RefreshTokenRequest): Promise<RefreshTokenResponse> {
    const response = await this.makeRequest<RefreshTokenResponse>('/auth/refresh-token', {
      method: 'POST',
      body: request,
    });

    // Update the stored access token
    this.setAccessToken(response.token);

    return response;
  }

  /**
   * Get subscription info
   */
  async getSubscription(): Promise<SubscriptionResponse> {
    return await this.makeRequest<SubscriptionResponse>('/auth/subscription', {
      method: 'GET',
      requiresAuth: true,
    });
  }

  /**
   * Register device with server (optional)
   */
  async registerDevice(request: DeviceRegistrationRequest): Promise<void> {
    await this.makeRequest<void>('/devices/register', {
      method: 'POST',
      body: request,
      requiresAuth: true,
    });
  }

  /**
   * Make authenticated request (helper for future API calls)
   */
  async authenticatedRequest<T>(
    endpoint: string,
    options: {
      method?: string;
      body?: any;
    } = {}
  ): Promise<T> {
    return await this.makeRequest<T>(endpoint, {
      ...options,
      requiresAuth: true,
    });
  }

  /**
   * Check if we're online
   */
  isOnline(): boolean {
    return typeof navigator !== 'undefined' ? navigator.onLine : true;
  }

  /**
   * Clear access token (on logout)
   */
  clearAccessToken(): void {
    this.accessToken = null;
  }
}

// Export singleton instance
export const apiClient = new TauriApiClient();

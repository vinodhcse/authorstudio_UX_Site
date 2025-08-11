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

class ApiClient {
  private baseUrl: string;

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
    const token = localStorage.getItem('authToken');
    if (token && !endpoint.includes('/auth/')) {
      config.headers = {
        ...config.headers,
        Authorization: `Bearer ${token}`,
      };
    }

    try {
      const response = await fetch(url, config);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('API request failed:', error);
      throw error;
    }
  }

  // Authentication methods
  async login(credentials: LoginRequest): Promise<AuthResponse> {
    const response = await this.makeRequest<AuthResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });

    // Store token and user info
    localStorage.setItem('authToken', response.token);
    localStorage.setItem('userId', response.userId);
    if (response.name) localStorage.setItem('userName', response.name);
    if (response.email) localStorage.setItem('userEmail', response.email);
    if (response.globalRole) localStorage.setItem('userRole', response.globalRole);

    return response;
  }

  async signup(userData: SignupRequest): Promise<AuthResponse> {
    const response = await this.makeRequest<AuthResponse>('/auth/signup', {
      method: 'POST',
      body: JSON.stringify(userData),
    });

    // Store token and user info
    localStorage.setItem('authToken', response.token);
    localStorage.setItem('userId', response.userId);

    return response;
  }

  async refreshToken(): Promise<AuthResponse> {
    const currentToken = localStorage.getItem('authToken');
    if (!currentToken) {
      throw new Error('No token available for refresh');
    }

    const response = await this.makeRequest<AuthResponse>('/auth/refresh-token', {
      method: 'POST',
      body: JSON.stringify({ refreshToken: currentToken }),
    });

    // Update stored token
    localStorage.setItem('authToken', response.token);

    return response;
  }

  // Auth utilities
  isAuthenticated(): boolean {
    return !!localStorage.getItem('authToken');
  }

  logout(): void {
    localStorage.removeItem('authToken');
    localStorage.removeItem('userId');
    localStorage.removeItem('userName');
    localStorage.removeItem('userEmail');
    localStorage.removeItem('userRole');
  }

  getCurrentUser() {
    return {
      token: localStorage.getItem('authToken'),
      userId: localStorage.getItem('userId'),
      name: localStorage.getItem('userName'),
      email: localStorage.getItem('userEmail'),
      role: localStorage.getItem('userRole'),
    };
  }

  // Generate a simple device ID if not provided
  generateDeviceId(): string {
    let deviceId = localStorage.getItem('deviceId');
    if (!deviceId) {
      deviceId = 'device_' + Math.random().toString(36).substr(2, 9) + '_' + Date.now();
      localStorage.setItem('deviceId', deviceId);
    }
    return deviceId;
  }
}

export const apiClient = new ApiClient();

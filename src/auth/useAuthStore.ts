// Zustand store for Tauri-only authentication management
import { create } from 'zustand';
import { apiClient } from './apiClient';
import { HTTPTestClient } from './httpTestClient';
import { clearAllLocalData } from './clearData';
import { getOrCreateDeviceId } from './deviceId';
import { 
  deriveAppKey, 
  generateDeviceKeypair, 
  encryptDevicePrivateKey,
  generateProbe,
  encryptProbe,
  verifyProbe,
  encryptString,
  decryptString,
  pack,
  unpack
} from './crypto';
import { 
  getSessionRow, 
  upsertSessionRow, 
  clearSession,
  SessionRow 
} from './sqlite';

export interface User {
  id: string;
  name: string;
  email: string;
  role: string;
}

export interface AuthState {
  // State
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isOnline: boolean;
  appKey: CryptoKey | null;
  accessToken: string | null;
  accessTokenExp: number | null;
  
  // Actions
  signup: (name: string, email: string, password: string) => Promise<{ requiresEmailVerification?: boolean }>;
  verifyEmail: (email: string, code: string) => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  unlock: (passphrase: string) => Promise<void>;
  ensureAccessToken: () => Promise<string>;
  refreshSubscription: () => Promise<void>;
  logout: () => Promise<void>;
  clearLocalData: () => Promise<void>; // Add clear data function
  setOnlineStatus: (online: boolean) => void;
  clearInMemoryData: () => void;
  
  // Internal helpers
  _setUser: (user: User | null) => void;
  _setAppKey: (key: CryptoKey | null) => void;
  _setAccessToken: (token: string | null, exp?: number) => void;
  _setLoading: (loading: boolean) => void;
}

const GRACE_PERIOD_MS = 7 * 24 * 60 * 60 * 1000; // 7 days
const TOKEN_REFRESH_THRESHOLD_MS = 5 * 60 * 1000; // 5 minutes

export const useAuthStore = create<AuthState>((set, get) => ({
  // Initial state
  user: null,
  isAuthenticated: false,
  isLoading: false,
  isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,
  appKey: null,
  accessToken: null,
  accessTokenExp: null,

  // Set user
  _setUser: (user) => {
    set({ 
      user, 
      isAuthenticated: !!user 
    });
  },

  // Set app key
  _setAppKey: (appKey) => {
    set({ appKey });
  },

  // Set access token
  _setAccessToken: (accessToken, accessTokenExp) => {
    set({ 
      accessToken, 
      accessTokenExp: accessTokenExp || null 
    });
    
    // Update API client
    apiClient.setAccessToken(accessToken);
  },

  // Set loading state
  _setLoading: (isLoading) => {
    set({ isLoading });
  },

  // Set online status
  setOnlineStatus: (isOnline) => {
    set({ isOnline });
  },

  // Signup (online only)
  signup: async (name, email, password) => {
    const { _setLoading } = get();
    
    try {
      _setLoading(true);
      
      if (!apiClient.isOnline()) {
        throw new Error('Signup requires internet connection');
      }

      const response = await apiClient.signup({ name, email, password });
      
      return { 
        requiresEmailVerification: response.requiresEmailVerification 
      };
      
    } catch (error) {
      console.error('Signup failed:', error);
      throw error;
    } finally {
      _setLoading(false);
    }
  },

  // Verify email
  verifyEmail: async (email, code) => {
    const { _setLoading } = get();
    
    try {
      _setLoading(true);
      
      if (!apiClient.isOnline()) {
        throw new Error('Email verification requires internet connection');
      }

      await apiClient.verifyEmail({ email, code });
      
    } catch (error) {
      console.error('Email verification failed:', error);
      throw error;
    } finally {
      _setLoading(false);
    }
  },

  // Login (online only)
  login: async (email, password) => {
    const { _setUser, _setAppKey, _setAccessToken, _setLoading } = get();
    
    try {
      _setLoading(true);
      
      // Run HTTP connectivity tests for debugging
      console.log('🔍 Running HTTP connectivity tests before login...');
      await HTTPTestClient.runAllTests();
      
      if (!apiClient.isOnline()) {
        throw new Error('Login requires internet connection');
      }

      // Get device ID
      const deviceId = await getOrCreateDeviceId();
      
      // Login with server
      const authResponse = await apiClient.login({ email, password, deviceId });
      
      // Derive AppKey from passphrase (using same password)
      const { key: appKey, salt, iters } = await deriveAppKey(password);
      
      // Generate device keypair
      const { publicKeyPem, privateKey } = await generateDeviceKeypair();
      
      // Encrypt private key with AppKey
      const encryptedPrivateKey = await encryptDevicePrivateKey(privateKey, appKey);
      
      // Generate and encrypt probe for offline verification
      const probe = generateProbe();
      const encryptedProbe = await encryptProbe(probe, appKey);
      
      // Get subscription info (if available)
      let subscriptionStatus = 'active';
      let subscriptionExpiresAt = Date.now() + 365 * 24 * 60 * 60 * 1000; // 1 year default
      
      try {
        const subscription = await apiClient.getSubscription();
        subscriptionStatus = subscription.status;
        subscriptionExpiresAt = subscription.expiresAt;
      } catch (error) {
        console.warn('Could not fetch subscription info:', error);
      }
      
      // Encrypt refresh token (we'll use the access token as refresh for now)
      const encryptedRefreshToken = await encryptString(authResponse.token, appKey);
      
      // Store session in SQLite
      const sessionData: Partial<SessionRow> = {
        user_id: authResponse.userId,
        email: authResponse.email || email,
        name: authResponse.name || '',
        device_id: deviceId,
        refresh_token_enc: pack(encryptedRefreshToken.iv, encryptedRefreshToken.data),
        device_private_key_enc: encryptedPrivateKey,
        appkey_wrap_salt: salt,
        appkey_wrap_iters: iters,
        appkey_probe: encryptedProbe,
        access_exp: Date.now() + 15 * 60 * 1000, // 15 minutes
        subscription_status: subscriptionStatus,
        subscription_expires_at: subscriptionExpiresAt,
        subscription_last_checked_at: Date.now(),
        updated_at: Date.now(),
      };
      
      await upsertSessionRow(sessionData);
      
      // Optional: Register device with server
      try {
        await apiClient.registerDevice({
          deviceId,
          devicePublicKey: publicKeyPem,
          platform: 'tauri',
          appVersion: '1.0.0',
        });
      } catch (error) {
        console.warn('Device registration failed:', error);
      }
      
      // Set state
      _setUser({
        id: authResponse.userId,
        name: authResponse.name || '',
        email: authResponse.email || email,
        role: authResponse.globalRole || 'FREE_USER',
      });
      
      _setAppKey(appKey);
      _setAccessToken(authResponse.token, Date.now() + 15 * 60 * 1000);
      
    } catch (error) {
      console.error('Login failed:', error);
      throw error;
    } finally {
      _setLoading(false);
    }
  },

  // Unlock (offline/online)
  unlock: async (passphrase) => {
    const { 
      _setUser, 
      _setAppKey, 
      _setAccessToken, 
      _setLoading,
      isOnline 
    } = get();
    
    try {
      _setLoading(true);
      
      // Get session from SQLite
      const session = await getSessionRow();
      if (!session) {
        throw new Error('No session found. Please login first.');
      }
      
      console.log('🔍 Debug - Session data types:', {
        saltType: typeof session.appkey_wrap_salt,
        saltIsArray: Array.isArray(session.appkey_wrap_salt),
        saltLength: session.appkey_wrap_salt?.length,
        probeType: typeof session.appkey_probe,
        probeIsArray: Array.isArray(session.appkey_probe),
        probeLength: session.appkey_probe?.length,
        iters: session.appkey_wrap_iters
      });
      
      // Derive AppKey from passphrase
      const { key: appKey } = await deriveAppKey(
        passphrase, 
        session.appkey_wrap_salt!, 
        session.appkey_wrap_iters!
      );
      
      console.log('🔍 Debug - AppKey derived successfully');
      
      // Verify passphrase by decrypting probe
      const isValidPassphrase = await verifyProbe(session.appkey_probe!, appKey);
      console.log('🔍 Debug - Probe verification result:', isValidPassphrase);
      
      if (!isValidPassphrase) {
        throw new Error('Invalid passphrase');
      }
      
      // Check subscription validity
      const now = Date.now();
      const subscriptionValid = checkSubscriptionValidity(
        session.subscription_status!,
        session.subscription_expires_at!,
        now
      );
      
      if (!subscriptionValid) {
        throw new Error('Subscription expired');
      }
      
      // Set user and appKey
      _setUser({
        id: session.user_id,
        name: session.name,
        email: session.email,
        role: 'FREE_USER', // Could store this in session
      });
      
      _setAppKey(appKey);
      
      // If online, refresh token and subscription
      if (isOnline) {
        try {
          // Decrypt refresh token
          const { iv, data } = unpack(session.refresh_token_enc!);
          const refreshToken = await decryptString(data, iv, appKey);
          
          // Refresh access token
          const refreshResponse = await apiClient.refreshToken({ refreshToken });
          _setAccessToken(refreshResponse.token, Date.now() + 15 * 60 * 1000);
          
          // Update subscription info
          try {
            const subscription = await apiClient.getSubscription();
            await upsertSessionRow({
              subscription_status: subscription.status,
              subscription_expires_at: subscription.expiresAt,
              subscription_last_checked_at: Date.now(),
              updated_at: Date.now(),
            });
          } catch (error) {
            console.warn('Failed to refresh subscription:', error);
          }
          
        } catch (error) {
          console.warn('Failed to refresh token online:', error);
          // Continue with offline mode
        }
      }
      
    } catch (error) {
      console.error('Unlock failed:', error);
      throw error;
    } finally {
      _setLoading(false);
    }
  },

  // Ensure access token is valid
  ensureAccessToken: async () => {
    const { 
      accessToken, 
      accessTokenExp, 
      appKey, 
      isOnline,
      _setAccessToken 
    } = get();
    
    // Check if token exists and is not expiring soon
    if (accessToken && accessTokenExp && 
        (accessTokenExp - Date.now()) > TOKEN_REFRESH_THRESHOLD_MS) {
      return accessToken;
    }
    
    if (!isOnline) {
      throw new Error('Cannot refresh token while offline');
    }
    
    if (!appKey) {
      throw new Error('App key not available. Please unlock first.');
    }
    
    // Get session and refresh token
    const session = await getSessionRow();
    if (!session?.refresh_token_enc) {
      throw new Error('No refresh token available');
    }
    
    try {
      // Decrypt refresh token
      const { iv, data } = unpack(session.refresh_token_enc);
      const refreshToken = await decryptString(data, iv, appKey);
      
      // Refresh access token
      const response = await apiClient.refreshToken({ refreshToken });
      const newExpiry = Date.now() + 15 * 60 * 1000;
      
      _setAccessToken(response.token, newExpiry);
      
      // Update session
      await upsertSessionRow({
        access_exp: newExpiry,
        updated_at: Date.now(),
      });
      
      return response.token;
      
    } catch (error) {
      console.error('Token refresh failed:', error);
      throw new Error('Failed to refresh access token');
    }
  },

  // Refresh subscription info
  refreshSubscription: async () => {
    const { isOnline } = get();
    
    if (!isOnline) {
      throw new Error('Cannot refresh subscription while offline');
    }
    
    try {
      await get().ensureAccessToken();
      
      const subscription = await apiClient.getSubscription();
      
      await upsertSessionRow({
        subscription_status: subscription.status,
        subscription_expires_at: subscription.expiresAt,
        subscription_last_checked_at: Date.now(),
        updated_at: Date.now(),
      });
      
    } catch (error) {
      console.error('Subscription refresh failed:', error);
      throw error;
    }
  },

  // Logout
  logout: async () => {
    const { _setUser, _setAppKey, _setAccessToken } = get();
    
    try {
      // Clear session from SQLite
      await clearSession();
      
      // Clear in-memory state
      _setUser(null);
      _setAppKey(null);
      _setAccessToken(null);
      
      // Clear API client token
      apiClient.clearAccessToken();
      
    } catch (error) {
      console.error('Logout failed:', error);
      throw error;
    }
  },

  // Clear in-memory data (for idle timeout)
  clearInMemoryData: () => {
    const { _setAppKey, _setAccessToken } = get();
    
    console.log('Clearing in-memory authentication data due to idle timeout');
    
    // Clear sensitive in-memory data but keep user info
    _setAppKey(null);
    _setAccessToken(null);
    
    // Clear API client token
    apiClient.clearAccessToken();
    
    // Don't clear user - they can unlock again without full login
    // SQLite session data remains encrypted on disk
  },

  // Clear all local data (for corrupted data recovery)
  clearLocalData: async () => {
    const { _setUser, _setAppKey, _setAccessToken, _setLoading } = get();
    
    try {
      _setLoading(true);
      console.log('🧹 Clearing all local authentication data...');
      
      // Clear all local data
      await clearAllLocalData();
      
      // Reset in-memory state
      _setUser(null);
      _setAppKey(null);
      _setAccessToken(null);
      
      // Clear API client
      apiClient.clearAccessToken();
      
      console.log('✅ All local data cleared successfully');
      
      // Force reload to ensure clean state
      if (typeof window !== 'undefined') {
        window.location.reload();
      }
    } catch (error) {
      console.error('❌ Error clearing local data:', error);
      
      // Force reload even if clearing failed
      if (typeof window !== 'undefined') {
        window.location.reload();
      }
    } finally {
      _setLoading(false);
    }
  },
}));

/**
 * Check if subscription is still valid (including grace period)
 */
function checkSubscriptionValidity(
  status: string,
  expiresAt: number,
  now: number
): boolean {
  switch (status) {
    case 'active':
      return expiresAt > now;
    case 'grace':
      return (expiresAt + GRACE_PERIOD_MS) > now;
    case 'expired':
      return false;
    default:
      return false;
  }
}

// Set up online/offline detection
if (typeof window !== 'undefined') {
  window.addEventListener('online', () => {
    useAuthStore.getState().setOnlineStatus(true);
  });
  
  window.addEventListener('offline', () => {
    useAuthStore.getState().setOnlineStatus(false);
  });
}

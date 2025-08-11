// Zustand store for Tauri-only authentication management
import { create } from 'zustand';
import { apiClient } from './apiClient';
import { HTTPTestClient } from './httpTestClient';
import { sealSession, activateSession } from './sqlite';
import { clearAllLocalData } from './clearData';
import { getOrCreateDeviceId } from './deviceId';
import { appLog } from './fileLogger';
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
      console.log('🔐 [LOGIN] Starting login process for:', email);
      
      // Run HTTP connectivity tests for debugging
      console.log('🔍 [LOGIN] Running HTTP connectivity tests before login...');
      await HTTPTestClient.runAllTests();
      
      if (!apiClient.isOnline()) {
        console.error('❌ [LOGIN] No internet connection available');
        throw new Error('Login requires internet connection');
      }

      console.log('✅ [LOGIN] Internet connectivity confirmed');

      // Get device ID
      console.log('🔧 [LOGIN] Getting or creating device ID...');
      const deviceId = await getOrCreateDeviceId();
      console.log('✅ [LOGIN] Device ID obtained:', deviceId);
      
      // Check for existing sealed session
      console.log('🔍 [LOGIN] Checking for existing sealed session...');
      const existingSession = await getSessionRow();
      if (existingSession) {
        console.log('📋 [LOGIN] Found existing session:', {
          state: existingSession.session_state,
          user_id: existingSession.user_id,
          sealed_at: existingSession.sealed_at
        });
        if (existingSession.session_state === 'sealed') {
          console.log('� [LOGIN] Found sealed session, will check user match after server login...');
        }
      } else {
        console.log('📋 [LOGIN] No existing session found');
      }
      
      // Login with server
      console.log('🌐 [LOGIN] Sending login request to server...');
      const authResponse = await apiClient.login({ email, password, deviceId });
      console.log('✅ [LOGIN] Server login successful:', {
        userId: authResponse.userId,
        email: authResponse.email,
        name: authResponse.name
      });
      
      // If we had a sealed session, try to activate it for the same user
      if (existingSession && existingSession.session_state === 'sealed') {
        console.log('🔒 [LOGIN] Attempting to activate sealed session for user:', authResponse.userId);
        const activated = await activateSession(authResponse.userId);
        if (activated) {
          console.log('✅ [LOGIN] Sealed session successfully activated for same user');
          
          // Update tokens in the activated session
          console.log('🔄 [LOGIN] Updating access token in activated session...');
          await upsertSessionRow({
            access_exp: Date.now() + 15 * 60 * 1000, // 15 minutes
            updated_at: Date.now(),
          });
          
          // Set user and access token in memory
          console.log('💾 [LOGIN] Setting user and token in memory state...');
          _setUser({
            id: authResponse.userId,
            email: authResponse.email || email,
            name: authResponse.name || '',
            role: 'user', // Default role
          });
          _setAccessToken(authResponse.token, Date.now() + 15 * 60 * 1000);
          apiClient.setAccessToken(authResponse.token);
          
          console.log('🎉 [LOGIN] Login complete via sealed session activation');
          return; // Session unsealed, login complete
        } else {
          console.log('⚠️ [LOGIN] Sealed session belongs to different user, keeping it sealed');
          console.log('🔄 [LOGIN] Continuing with normal login for new user...');
          // Continue with normal login for the new user, keeping old data sealed
        }
      }
      
      // Normal login flow (first time or different user)
      console.log('� [LOGIN] Performing full login setup...');
      
      // Derive AppKey from passphrase (using same password)
      console.log('🔑 [LOGIN] Deriving app key from password...');
      const { key: appKey, salt, iters } = await deriveAppKey(password);
      console.log('✅ [LOGIN] App key derived successfully');
      
      // Generate device keypair
      console.log('🔐 [LOGIN] Generating device keypair...');
      const { publicKeyPem, privateKey } = await generateDeviceKeypair();
      console.log('✅ [LOGIN] Device keypair generated');
      
      // Encrypt private key with AppKey
      console.log('🔒 [LOGIN] Encrypting device private key...');
      const encryptedPrivateKey = await encryptDevicePrivateKey(privateKey, appKey);
      console.log('✅ [LOGIN] Device private key encrypted');
      
      // Generate and encrypt probe for offline verification
      console.log('🧪 [LOGIN] Generating and encrypting probe...');
      const probe = generateProbe();
      const encryptedProbe = await encryptProbe(probe, appKey);
      console.log('✅ [LOGIN] Probe generated and encrypted');
      
      // Get subscription info (if available)
      console.log('📋 [LOGIN] Getting subscription status...');
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
      console.log('🔓 [UNLOCK] Starting unlock process...');
      
      // Get session from SQLite
      console.log('📋 [UNLOCK] Retrieving session from SQLite...');
      const session = await getSessionRow();
      if (!session) {
        console.error('❌ [UNLOCK] No session found in SQLite');
        throw new Error('No session found. Please login first.');
      }
      
      console.log('✅ [UNLOCK] Session found:', {
        user_id: session.user_id,
        state: session.session_state,
        updated_at: session.updated_at ? new Date(session.updated_at).toISOString() : null,
        sealed_at: session.sealed_at ? new Date(session.sealed_at).toISOString() : null
      });
      
      // Check if session is sealed
      if (session.session_state === 'sealed') {
        console.error('🔒 [UNLOCK] Session is sealed, requires online login');
        throw new Error('Session is sealed. Please log in online to unseal your data.');
      }
      
      console.log('🔍 [UNLOCK] Session data format verification:', {
        saltType: typeof session.appkey_wrap_salt,
        saltIsArray: Array.isArray(session.appkey_wrap_salt),
        saltLength: session.appkey_wrap_salt?.length,
        probeType: typeof session.appkey_probe,
        probeIsArray: Array.isArray(session.appkey_probe),
        probeLength: session.appkey_probe?.length,
        iters: session.appkey_wrap_iters,
        sessionState: session.session_state
      });
      
      // Derive AppKey from passphrase
      console.log('🔑 [UNLOCK] Deriving app key from passphrase...');
      const { key: appKey } = await deriveAppKey(
        passphrase, 
        session.appkey_wrap_salt!, 
        session.appkey_wrap_iters!
      );
      
      console.log('✅ [UNLOCK] App key derived successfully');
      
      // Verify passphrase by decrypting probe
      console.log('🧪 [UNLOCK] Verifying passphrase with encrypted probe...');
      const isValidPassphrase = await verifyProbe(session.appkey_probe!, appKey);
      console.log('🔍 [UNLOCK] Probe verification result:', isValidPassphrase);
      
      if (!isValidPassphrase) {
        console.error('❌ [UNLOCK] Invalid passphrase - probe verification failed');
        throw new Error('Invalid passphrase');
      }
      
      console.log('✅ [UNLOCK] Passphrase verified successfully');
      
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

  // Logout (seal session, don't delete data)
  logout: async () => {
    const { _setUser, _setAppKey, _setAccessToken, user } = get();
    
    try {
      await appLog.info('logout', `Starting logout process for user: ${user?.email}`);
      await appLog.info('logout', 'Sealing session to preserve encrypted data...');
      
      // Seal session instead of clearing it
      await sealSession();
      await appLog.info('logout', 'Session successfully sealed');
      
      // Clear in-memory state
      await appLog.info('logout', 'Clearing in-memory authentication state...');
      _setUser(null);
      _setAppKey(null);
      _setAccessToken(null);
      
      // Clear API client token
      await appLog.info('logout', 'Clearing API client access token...');
      apiClient.clearAccessToken();
      
      await appLog.success('logout', 'Logout complete - session sealed, data preserved');
      
      // Force a reload to trigger AuthGate re-evaluation
      window.location.reload();
      
    } catch (error) {
      await appLog.error('logout', `Logout failed: ${error instanceof Error ? error.message : 'Unknown error'}`, error);
      // If there's an error, still try to clear in-memory state
      _setUser(null);
      _setAppKey(null);
      _setAccessToken(null);
      apiClient.clearAccessToken();
      
      // Reload to show login page
      window.location.reload();
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

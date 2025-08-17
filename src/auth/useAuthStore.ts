// Zustand store for Tauri-only authentication management
import { create } from 'zustand';
import { apiClient } from './apiClient';
import { apiClient as libApiClient } from '../lib/apiClient';
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
  currentSession: SessionRow | null; // Add current session to state
  
  // Actions
  signup: (name: string, email: string, password: string) => Promise<{ requiresEmailVerification?: boolean }>;
  verifyEmail: (email: string, code: string) => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  unlock: (passphrase: string) => Promise<void>;
  lock: () => Promise<void>;
  ensureAccessToken: () => Promise<string>;
  refreshSubscription: () => Promise<void>;
  logout: () => Promise<void>;
  clearLocalData: () => Promise<void>; // Add clear data function
  setOnlineStatus: (online: boolean) => void;
  clearInMemoryData: () => void;
  
  // Session management helpers
  updateSessionInContext: (updates: Partial<SessionRow>) => void;
  saveSessionToDatabase: () => Promise<void>;
  refreshSessionFromDatabase: () => Promise<SessionRow | null>;
  
  // Internal helpers
  _setUser: (user: User | null) => void;
  _setAppKey: (key: CryptoKey | null) => void;
  _setAccessToken: (token: string | null, exp?: number) => void;
  _setLoading: (loading: boolean) => void;
}

const GRACE_PERIOD_MS = 7 * 24 * 60 * 60 * 1000; // 7 days
const TOKEN_REFRESH_THRESHOLD_MS = 5 * 60 * 1000; // 5 minutes

// Guard against concurrent token refresh attempts
let tokenRefreshPromise: Promise<string> | null = null;

export const useAuthStore = create<AuthState>((set, get) => ({
  // Initial state
  user: null,
  isAuthenticated: false,
  isLoading: false,
  isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,
  appKey: null,
  accessToken: null,
  accessTokenExp: null,
  currentSession: null,

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
    
    // Update API clients
    apiClient.setAccessToken(accessToken);
    libApiClient.setAccessToken(accessToken);
  },

  // Set loading state
  _setLoading: (isLoading) => {
    set({ isLoading });
  },

  // Set online status
  setOnlineStatus: (isOnline) => {
    set({ isOnline });
  },

  // Session management helpers
  updateSessionInContext: (updates) => {
    const { currentSession } = get();
    if (currentSession) {
      const updatedSession = { ...currentSession, ...updates };
      set({ currentSession: updatedSession });
    }
  },

  saveSessionToDatabase: async () => {
    const { currentSession } = get();
    if (currentSession) {
      await upsertSessionRow(currentSession);
    }
  },

  refreshSessionFromDatabase: async () => {
    const session = await getSessionRow();
    set({ currentSession: session });
    return session;
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
      console.log('✅ [LOGIN] Server login successful:', authResponse);
      
      // If we had a sealed session, try to activate it for the same user
      if (existingSession && existingSession.session_state === 'sealed') {
        console.log('🔒 [LOGIN] Attempting to activate sealed session for user:', authResponse.userId);
        const activated = await activateSession(authResponse.userId);
        if (activated) {
          console.log('✅ [LOGIN] Sealed session successfully activated for same user');
          
          // Even with sealed session activation, we need to update the refresh token
          // with the new one from the current login response
          console.log('🔄 [LOGIN] Updating refresh token in activated session...');
          
          // Get the app key from the activated session to encrypt the new refresh token
          const { key: appKey } = await deriveAppKey(
            password, 
            existingSession.appkey_wrap_salt!, 
            existingSession.appkey_wrap_iters!
          );
          
          console.log('� [LOGIN] Auth response tokens for sealed session:', {
            accessToken: authResponse.token ? 'present' : 'missing',
            refreshToken: authResponse.refreshToken ? 'present' : 'missing',
            accessTokenLength: authResponse.token?.length,
            refreshTokenLength: authResponse.refreshToken?.length,
            tokensAreDifferent: authResponse.token !== authResponse.refreshToken
          });
          
          if (!authResponse.refreshToken) {
            console.error('❌ [LOGIN] No refresh token in auth response for sealed session');
            throw new Error('Server did not provide refresh token');
          }
          
          // Encrypt the new refresh token
          const encryptedRefreshToken = await encryptString(authResponse.refreshToken, appKey);
          console.log('✅ [LOGIN] New refresh token encrypted for sealed session');
          
          // Get the current session state to update it properly
          const currentSessionState = await getSessionRow();
          if (currentSessionState) {
            // Update session with new tokens and expiry
            const updatedSession: SessionRow = {
              ...currentSessionState,
              refresh_token_enc: pack(encryptedRefreshToken.iv, encryptedRefreshToken.data),
              access_exp: Date.now() + 15 * 60 * 1000, // 15 minutes
              updated_at: Date.now(),
            };
            await upsertSessionRow(updatedSession);
            // Store updated session in context
            set({ currentSession: updatedSession });
          }
          
          // Set user, app key, and access token in memory
          console.log('💾 [LOGIN] Setting user, app key, and token in memory state...');
          _setUser({
            id: authResponse.userId,
            email: authResponse.email || email,
            name: authResponse.name || '',
            role: authResponse.globalRole || 'FREE_USER',
          });
          _setAppKey(appKey);
          _setAccessToken(authResponse.token, Date.now() + 15 * 60 * 1000);
          
          console.log('🎉 [LOGIN] Login complete via sealed session activation with fresh tokens');
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
      
      // Encrypt refresh token
      console.log('🔐 [LOGIN] Encrypting refresh token...');
      console.log('🔍 [LOGIN] Auth response tokens:', {
        accessToken: authResponse.token ? 'present' : 'missing',
        refreshToken: authResponse.refreshToken ? 'present' : 'missing',
        accessTokenLength: authResponse.token?.length,
        refreshTokenLength: authResponse.refreshToken?.length,
        tokensAreDifferent: authResponse.token !== authResponse.refreshToken
      });
      
      if (!authResponse.refreshToken) {
        console.error('❌ [LOGIN] No refresh token in auth response');
        throw new Error('Server did not provide refresh token');
      }
      
      const encryptedRefreshToken = await encryptString(authResponse.refreshToken, appKey);
      console.log('✅ [LOGIN] Refresh token encrypted successfully');
      
  // Store session in local SurrealDB (via tauri commands)
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
      // Store session in context for future updates
      set({ currentSession: sessionData as SessionRow });
      
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
      isOnline,
      updateSessionInContext,
      saveSessionToDatabase
    } = get();
    
    try {
      _setLoading(true);
      console.log('🔓 [UNLOCK] Starting unlock process...');
      
  // Get session from local SurrealDB and store in context
  console.log('📋 [UNLOCK] Retrieving session from local store...');
      const session = await getSessionRow();
      if (!session) {
  console.error('❌ [UNLOCK] No session found');
        throw new Error('No session found. Please login first.');
      }
      
      // Store session in context for future updates
      set({ currentSession: session });
      
      console.log('✅ [UNLOCK] Session found:', {
        user_id: session.user_id,
        state: session.session_state,
        updated_at: session.updated_at ? new Date(session.updated_at).toISOString() : null,
        sealed_at: session.sealed_at ? new Date(session.sealed_at).toISOString() : null
      });
      
      // Check if session is sealed
      if (session.session_state === 'sealed') {
        console.log('🔒 [UNLOCK] Session is sealed, attempting to unseal...');
        // For lock scenario testing: allow unsealing if we have all necessary data
        if (!session.appkey_wrap_salt || !session.appkey_probe || !session.appkey_wrap_iters) {
          console.error('🔒 [UNLOCK] Session is sealed and missing encryption data, requires online login');
          throw new Error('Session is sealed and missing encryption data. Please log in online to restore your data.');
        }
        console.log('✅ [UNLOCK] Sealed session has encryption data, proceeding with unlock...');
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
      
      // Initialize encryption service with user credentials
      try {
        console.log('🔐 [UNLOCK] Initializing encryption service...');
        const { encryptionService } = await import('../services/encryptionService');
        console.log('🔐 [UNLOCK] Encryption service imported, checking current state:', {
          isInitialized: encryptionService.isInitialized(),
          userId: session.user_id
        });
        
        await encryptionService.initialize(session.user_id, passphrase);
        
        console.log('🔐 [UNLOCK] Encryption service initialization completed, checking state:', {
          isInitialized: encryptionService.isInitialized()
        });
        
        if (encryptionService.isInitialized()) {
          console.log('✅ [UNLOCK] Encryption service initialized successfully');
        } else {
          console.error('❌ [UNLOCK] Encryption service initialization failed - service not initialized after initialize() call');
        }
      } catch (encryptionError) {
        console.error('❌ [UNLOCK] Failed to initialize encryption service:', encryptionError);
        // Continue with unlock even if encryption service fails
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
          
          // Update session in context with new access token expiry
          updateSessionInContext({
            access_exp: Date.now() + 15 * 60 * 1000, // 15 minutes
            updated_at: Date.now(),
          });

          // Save complete session to database
          await saveSessionToDatabase();
          
          console.log('✅ [UNLOCK] Access token refreshed successfully');
          
          // Update subscription info
          try {
            const subscription = await apiClient.getSubscription();
            updateSessionInContext({
              subscription_status: subscription.status,
              subscription_expires_at: subscription.expiresAt,
              subscription_last_checked_at: Date.now(),
              updated_at: Date.now(),
            });
            await saveSessionToDatabase();
          } catch (error) {
            console.warn('Failed to refresh subscription:', error);
          }
          
        } catch (error) {
          console.warn('Failed to refresh token online:', error);
          // Continue with offline mode - no access token available
          console.log('🔓 [UNLOCK] Continuing in offline mode without access token');
        }
      } else {
        console.log('🔓 [UNLOCK] Offline mode - no access token available');
        // In offline mode, we don't have an access token
        // But we still have the user authenticated locally
      }
      
      // If we successfully unlocked a sealed session, update its state to active
      if (session.session_state === 'sealed') {
        console.log('🔓 [UNLOCK] Updating sealed session state to active...');
        updateSessionInContext({
          session_state: 'active',
          updated_at: Date.now(),
        });
        await saveSessionToDatabase();
        console.log('✅ [UNLOCK] Session state updated to active');
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
    // Guard against concurrent refresh attempts
    if (tokenRefreshPromise) {
      console.log('🔍 [ENSURE_TOKEN] Concurrent refresh detected, waiting for existing refresh...');
      return await tokenRefreshPromise;
    }
    
    const { 
      accessToken, 
      accessTokenExp, 
      appKey, 
      isOnline,
      _setAccessToken,
      _setUser,
      currentSession,
      refreshSessionFromDatabase,
      updateSessionInContext,
      saveSessionToDatabase
    } = get();
    
    console.log('🔍 [ENSURE_TOKEN] Checking access token validity...', {
      hasToken: !!accessToken,
      tokenExp: accessTokenExp,
      timeUntilExp: accessTokenExp ? (accessTokenExp - Date.now()) : null,
      threshold: TOKEN_REFRESH_THRESHOLD_MS,
      isOnline,
      hasAppKey: !!appKey
    });
    
    // Check if token exists and is not expiring soon
    if (accessToken && accessTokenExp && 
        (accessTokenExp - Date.now()) > TOKEN_REFRESH_THRESHOLD_MS) {
      console.log('✅ [ENSURE_TOKEN] Current token is still valid');
      return accessToken;
    }
    
    // Start the refresh process with promise guard
    tokenRefreshPromise = (async () => {
      try {
        if (!isOnline) {
          console.error('❌ [ENSURE_TOKEN] Cannot refresh token while offline');
          throw new Error('Cannot refresh token while offline');
        }
        
        if (!appKey) {
          console.error('❌ [ENSURE_TOKEN] No app key available');
          throw new Error('App key not available. Please unlock first.');
        }
        
        // Get session - use cached version or refresh from database
        console.log('🔍 [ENSURE_TOKEN] Getting session...');
        const session = currentSession || await refreshSessionFromDatabase();
        if (!session?.refresh_token_enc) {
          console.error('❌ [ENSURE_TOKEN] No refresh token in session');
          throw new Error('No refresh token available');
        }
        
        console.log('🔓 [ENSURE_TOKEN] Decrypting refresh token...');
        // Decrypt refresh token
        const { iv, data } = unpack(session.refresh_token_enc);
        const refreshToken = await decryptString(data, iv, appKey);
        console.log('✅ [ENSURE_TOKEN] Refresh token decrypted successfully');
        console.log('🔍 [ENSURE_TOKEN] Refresh token info:', {
          length: refreshToken?.length,
          firstChars: refreshToken?.substring(0, 10) + '...',
          lastChars: '...' + refreshToken?.substring(refreshToken.length - 10)
        });
        
        // Compare with current access token to make sure they're different
        const { accessToken: currentAccessToken } = get();
        console.log('🔍 [ENSURE_TOKEN] Token comparison:', {
          accessTokenLength: currentAccessToken?.length,
          refreshTokenLength: refreshToken?.length,
          tokensAreDifferent: currentAccessToken !== refreshToken,
          refreshTokenIsValid: refreshToken && refreshToken.length > 0
        });
        
        // Refresh access token
        console.log('🌐 [ENSURE_TOKEN] Calling refresh token API...');
        const response = await apiClient.refreshToken({ refreshToken });
        const newExpiry = Date.now() + 15 * 60 * 1000;
        
        console.log('✅ [ENSURE_TOKEN] New access token received', response);
        _setAccessToken(response.token, newExpiry);
        
        // Restore user state from session if not already set
        const { user } = get();
        if (!user && session.user_id) {
          _setUser({
            id: session.user_id,
            email: session.email,
            name: session.email.split('@')[0], // Fallback name
            role: 'user'
          });
          console.log('✅ [ENSURE_TOKEN] User state restored from session', { 
            userId: session.user_id,
            email: session.email 
          });
        }
        
        // Update session in context and save to database
        updateSessionInContext({
          access_exp: newExpiry,
          updated_at: Date.now(),
        });
        await saveSessionToDatabase();
        
        console.log('✅ [ENSURE_TOKEN] Token refresh complete');
        return response.token;
        
      } catch (error) {
        console.error('❌ [ENSURE_TOKEN] Token refresh failed:', error);
        throw new Error('Failed to refresh access token');
      } finally {
        // Clear the promise guard
        tokenRefreshPromise = null;
      }
    })();
    
    return await tokenRefreshPromise;
  },

  // Refresh subscription info
  refreshSubscription: async () => {
    const { isOnline, updateSessionInContext, saveSessionToDatabase } = get();
    
    if (!isOnline) {
      throw new Error('Cannot refresh subscription while offline');
    }
    
    try {
      await get().ensureAccessToken();
      
      const subscription = await apiClient.getSubscription();
      
      updateSessionInContext({
        subscription_status: subscription.status,
        subscription_expires_at: subscription.expiresAt,
        subscription_last_checked_at: Date.now(),
        updated_at: Date.now(),
      });
      await saveSessionToDatabase();
      
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
      set({ currentSession: null });
      
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
      set({ currentSession: null });
      apiClient.clearAccessToken();
      
      // Reload to show login page
      window.location.reload();
    }
  },

  // Lock app (seal session but stay on the same page - for testing unlock scenario)
  lock: async () => {
    const { _setAppKey, _setAccessToken, user } = get();
    
    try {
      await appLog.info('lock', `Starting lock process for user: ${user?.email}`);
      await appLog.info('lock', 'Sealing session to preserve encrypted data...');
      
      // Seal session instead of clearing it
      await sealSession();
      await appLog.info('lock', 'Session successfully sealed');
      
      // Clear in-memory state but keep user info for display
      await appLog.info('lock', 'Clearing in-memory authentication state...');
      _setAppKey(null);
      _setAccessToken(null);
      
      // Clear API client token
      await appLog.info('lock', 'Clearing API client access token...');
      apiClient.clearAccessToken();
      
      await appLog.success('lock', 'Lock complete - session sealed, data preserved');
      
      // Note: Unlike logout, we don't reload the page, allowing unlock testing
      
    } catch (error) {
      await appLog.error('lock', `Lock failed: ${error instanceof Error ? error.message : 'Unknown error'}`, error);
      // If there's an error, still try to clear in-memory state
      _setAppKey(null);
      _setAccessToken(null);
      apiClient.clearAccessToken();
      throw error; // Re-throw so UI can handle the error
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
  // Local session data remains encrypted on disk
  },

  // Clear all local data (for corrupted data recovery)
  clearLocalData: async () => {
    const { _setUser, _setAppKey, _setAccessToken, _setLoading } = get();
    
    try {
      _setLoading(true);
      console.log('🧹 Clearing all local authentication data...');
      
      await clearSession();
      // Clear all local data
      await clearAllLocalData();
      
      // Reset in-memory state including session
      _setUser(null);
      _setAppKey(null);
      _setAccessToken(null);
      set({ currentSession: null });
      
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

// Authentication setup and integration guide
export { useAuthStore } from './useAuthStore';
export { default as AuthGate } from './AuthGate';
export { default as UnlockOffline } from './UnlockOffline';
export { default as IdleWarningModal } from './IdleWarningModal';
export { useIdleTimer, DEFAULT_IDLE_CONFIG } from './idleTimer';
export { apiClient } from './apiClient';

// Import clear data utilities to make global functions available
import './clearData';

// Types
export type { User, AuthState } from './useAuthStore';

// Re-export utilities for advanced usage
export { 
  deriveAppKey, 
  generateDeviceKeypair, 
  encryptString, 
  decryptString,
  pack,
  unpack
} from './crypto';

export {
  getSessionRow,
  upsertSessionRow,
  clearSession
} from './sqlite';

export {
  getOrCreateDeviceId,
  clearDeviceId,
  regenerateDeviceId
} from './deviceId';

/**
 * Usage Guide:
 * 
 * 1. Wrap your main app component with AuthGate:
 * ```tsx
 * import { AuthGate } from './auth';
 * 
 * function App() {
 *   return (
 *     <AuthGate>
 *       <YourAppContent />
 *     </AuthGate>
 *   );
 * }
 * ```
 * 
 * 2. Use the auth store in components:
 * ```tsx
 * import { useAuthStore } from './auth';
 * 
 * function UserProfile() {
 *   const { user, logout } = useAuthStore();
 *   
 *   return (
 *     <div>
 *       <p>Welcome, {user?.name}</p>
 *       <button onClick={logout}>Logout</button>
 *     </div>
 *   );
 * }
 * ```
 * 
 * 3. Configure idle timeout (optional):
 * ```tsx
 * import { AuthGate, useIdleTimer } from './auth';
 * 
 * const CUSTOM_IDLE_CONFIG = {
 *   idleTimeout: 45 * 60 * 1000, // 45 minutes
 *   warningTime: 10 * 60 * 1000,  // 10 minutes warning
 * };
 * 
 * function App() {
 *   return (
 *     <AuthGate>
 *       <YourAppContent />
 *     </AuthGate>
 *   );
 * }
 * ```
 * 
 * Features:
 * - Tauri-only authentication with SQLite storage
 * - AES-GCM encryption for all sensitive data
 * - Device ID management
 * - Offline/online detection
 * - JWT token management with auto-refresh
 * - Idle timeout with warning modal
 * - Passphrase-based session unlock
 * - Encrypted session persistence
 */

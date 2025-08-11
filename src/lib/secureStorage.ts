// Secure storage utilities for encrypted local session data
import { 
  encryptWithPassword, 
  decryptWithPassword, 
  deriveAppKey,
  generateDeviceKeypair,
  encryptDevicePrivateKey,
  isCryptoAvailable 
} from './cryptoUtils';
import { LocalSession, SubscriptionInfo } from './apiClient';

// Check if running in Tauri environment
const isTauri = () => {
  return typeof window !== 'undefined' && '__TAURI__' in window;
};

export class SecureStorage {
  private static instance: SecureStorage;
  
  static getInstance(): SecureStorage {
    if (!SecureStorage.instance) {
      SecureStorage.instance = new SecureStorage();
    }
    return SecureStorage.instance;
  }

  private constructor() {
    if (!isCryptoAvailable()) {
      console.warn('Crypto APIs not available. Secure storage will be limited.');
    }
  }

  // Store encrypted session data
  async storeEncryptedSession(session: LocalSession, password: string): Promise<void> {
    if (!isCryptoAvailable()) {
      throw new Error('Crypto APIs not available');
    }

    const sessionData = JSON.stringify(session);
    const encrypted = await encryptWithPassword(sessionData, password);
    
    const encryptedSession = {
      data: encrypted.encrypted,
      iv: encrypted.iv,
      salt: encrypted.salt,
      iterations: 200000,
      version: 1,
    };

    await this.setSecureItem('localSession', JSON.stringify(encryptedSession));
  }

  // Retrieve and decrypt session data
  async getDecryptedSession(password: string): Promise<LocalSession | null> {
    if (!isCryptoAvailable()) {
      return null;
    }

    try {
      const encryptedSessionStr = await this.getSecureItem('localSession');
      if (!encryptedSessionStr) return null;

      const encryptedSession = JSON.parse(encryptedSessionStr);
      
      const decryptedData = await decryptWithPassword(
        encryptedSession.data,
        encryptedSession.iv,
        encryptedSession.salt,
        password,
        encryptedSession.iterations || 200000
      );

      return JSON.parse(decryptedData);
    } catch (error) {
      console.error('Failed to decrypt session:', error);
      return null;
    }
  }

  // Create new session with device keypair
  async createNewSession(
    userId: string,
    email: string,
    name: string,
    deviceId: string,
    password: string,
    subscription: SubscriptionInfo
  ): Promise<LocalSession> {
    if (!isCryptoAvailable()) {
      throw new Error('Crypto APIs not available');
    }

    // Generate device keypair
    const { publicKey, privateKey } = await generateDeviceKeypair();
    
    // Derive app key for encrypting private key
    const { key: appKey, salt } = await deriveAppKey(password);
    
    // Encrypt private key with app key
    const encryptedPrivateKey = await encryptDevicePrivateKey(privateKey, appKey);
    
    // Create app key bundle
    const appKeyBundle = {
      appKeyEnc: '', // We don't store the key itself, only derive it from password
      salt: arrayBufferToBase64(salt.buffer as ArrayBuffer),
      iterations: 200000,
    };

    const session: LocalSession = {
      userId,
      email,
      name,
      deviceId,
      subscription,
      appKeyBundle,
      deviceKeypair: {
        publicKey,
        privateKeyEnc: encryptedPrivateKey.encrypted,
      },
      sessionVersion: 1,
      updatedAt: Date.now(),
    };

    await this.storeEncryptedSession(session, password);
    return session;
  }

  // Validate session and subscription
  async validateSession(session: LocalSession): Promise<boolean> {
    const now = Date.now();
    const gracePeriod = 7 * 24 * 60 * 60 * 1000; // 7 days in milliseconds

    switch (session.subscription.status) {
      case 'active':
        return session.subscription.expiresAt > now;
      case 'grace':
        return (session.subscription.expiresAt + gracePeriod) > now;
      case 'expired':
        return false;
      default:
        return false;
    }
  }

  // Update subscription in stored session
  async updateSubscription(
    password: string, 
    subscription: SubscriptionInfo
  ): Promise<boolean> {
    try {
      const session = await this.getDecryptedSession(password);
      if (!session) return false;

      session.subscription = subscription;
      session.updatedAt = Date.now();
      
      await this.storeEncryptedSession(session, password);
      return true;
    } catch (error) {
      console.error('Failed to update subscription:', error);
      return false;
    }
  }

  // Clear all stored session data
  async clearSession(): Promise<void> {
    const keysToRemove = [
      'localSession',
      'authToken',
      'userId',
      'userName', 
      'userEmail',
      'userRole',
      'refreshToken',
      'deviceId'
    ];

    for (const key of keysToRemove) {
      await this.removeSecureItem(key);
    }
  }

  // Check if session exists
  async hasSession(): Promise<boolean> {
    const sessionData = await this.getSecureItem('localSession');
    return !!sessionData;
  }

  // Private storage methods with Tauri/localStorage fallback
  private async setSecureItem(key: string, value: string): Promise<void> {
    if (isTauri()) {
      try {
        const { writeTextFile } = await import('@tauri-apps/plugin-fs');
        const { appDataDir } = await import('@tauri-apps/api/path');
        
        const appDir = await appDataDir();
        const filePath = `${appDir}/secure/${key}.enc`;
        
        await writeTextFile(filePath, value);
      } catch (error) {
        console.warn('Failed to store in Tauri, falling back to localStorage:', error);
        localStorage.setItem(`secure_${key}`, value);
      }
    } else {
      localStorage.setItem(`secure_${key}`, value);
    }
  }

  private async getSecureItem(key: string): Promise<string | null> {
    if (isTauri()) {
      try {
        const { readTextFile } = await import('@tauri-apps/plugin-fs');
        const { appDataDir } = await import('@tauri-apps/api/path');
        
        const appDir = await appDataDir();
        const filePath = `${appDir}/secure/${key}.enc`;
        
        return await readTextFile(filePath);
      } catch (error) {
        console.warn('Failed to read from Tauri, falling back to localStorage:', error);
        return localStorage.getItem(`secure_${key}`);
      }
    } else {
      return localStorage.getItem(`secure_${key}`);
    }
  }

  private async removeSecureItem(key: string): Promise<void> {
    if (isTauri()) {
      try {
        const { remove } = await import('@tauri-apps/plugin-fs');
        const { appDataDir } = await import('@tauri-apps/api/path');
        
        const appDir = await appDataDir();
        const filePath = `${appDir}/secure/${key}.enc`;
        
        await remove(filePath);
      } catch (error) {
        console.warn('Failed to remove from Tauri, falling back to localStorage:', error);
        localStorage.removeItem(`secure_${key}`);
      }
    } else {
      localStorage.removeItem(`secure_${key}`);
    }
  }
}

// Utility function for array buffer conversion
function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

// Export singleton instance
export const secureStorage = SecureStorage.getInstance();

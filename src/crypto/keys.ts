// Key derivation and management for UDEK and BSK
import { appLog } from '../auth/fileLogger';

/**
 * Convert base64 string to Uint8Array
 */
function base64ToBytes(base64: string): Uint8Array {
  const binaryString = atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

/**
 * Convert hex string to Uint8Array
 */
function hexToBytes(hex: string): Uint8Array {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.slice(i, i + 2), 16);
  }
  return bytes;
}

/**
 * Ensure a value is converted to proper Uint8Array BufferSource
 */
function ensureBufferSource(value: any): Uint8Array {
  if (value instanceof Uint8Array) {
    return value;
  } else if (Array.isArray(value)) {
    // Convert array to Uint8Array
    return new Uint8Array(value);
  } else if (typeof value === 'string') {
    // Check if it's a JSON array string (SQLite seems to store Uint8Array as JSON)
    if (value.startsWith('[') && value.endsWith(']')) {
      try {
        const arrayData = JSON.parse(value);
        if (Array.isArray(arrayData)) {
          return new Uint8Array(arrayData);
        }
      } catch (e) {
        // Fallback to generating new salt if parsing fails
      }
    }
    
    // Detect if it's a base64 string (contains only base64 chars)
    if (/^[A-Za-z0-9+/]+=*$/.test(value)) {
      try {
        return base64ToBytes(value);
      } catch (e) {
        // Fallback to generating new salt if decode fails
      }
    }
    
    // Detect if it's a hex string
    if (/^[0-9a-fA-F]+$/.test(value)) {
      try {
        return hexToBytes(value);
      } catch (e) {
        // Fallback to generating new salt if decode fails
      }
    }
  }
  
  // Fallback: generate new salt
  throw new Error('Invalid salt format - cannot convert to Uint8Array');
}

/**
 * Derive the App Key from user passphrase using PBKDF2
 */
export async function deriveAppKey(passphrase: string, salt: Uint8Array | any, iterations: number): Promise<CryptoKey> {
  try {
    const encoder = new TextEncoder();
    const passphraseBuffer = encoder.encode(passphrase);
    
    // Import the passphrase as a key for PBKDF2
    const baseKey = await crypto.subtle.importKey(
      'raw',
      passphraseBuffer,
      'PBKDF2',
      false,
      ['deriveKey']
    );
    
    // Ensure salt is a proper BufferSource (Uint8Array)
    let saltBuffer: Uint8Array;
    try {
      saltBuffer = ensureBufferSource(salt);
    } catch (error) {
      await appLog.error('crypto', 'Salt conversion failed', error);
      throw error;
    }
    
    // Derive the App Key
    const appKey = await crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt: saltBuffer as BufferSource,
        iterations: iterations,
        hash: 'SHA-256'
      },
      baseKey,
      {
        name: 'AES-GCM',
        length: 256
      },
      false, // not extractable
      ['encrypt', 'decrypt']
    );
    
    return appKey;
  } catch (error) {
    await appLog.error('crypto', 'App key derivation failed', error);
    throw new Error('Failed to derive app key');
  }
}

/**
 * Generate a new UDEK (User Data Encryption Key)
 */
export function generateUDEK(): Uint8Array {
  return crypto.getRandomValues(new Uint8Array(32)); // 256-bit key
}

/**
 * Derive a Book Share Key (BSK) from UDEK using HKDF
 */
export async function hkdfBookKey(udek: Uint8Array, userId: string, bookId: string): Promise<Uint8Array> {
  try {
    // Import UDEK as key material
    const keyMaterial = await crypto.subtle.importKey(
      'raw',
      udek as BufferSource,
      'HKDF',
      false,
      ['deriveKey']
    );
    
    // Create salt from userId
    const salt = new TextEncoder().encode(userId);
    
    // Create info context from bookId
    const info = new TextEncoder().encode(`book-share:${bookId}`);
    
    // Derive BSK using HKDF
    const bsk = await crypto.subtle.deriveKey(
      {
        name: 'HKDF',
        salt: salt,
        info: info,
        hash: 'SHA-256'
      },
      keyMaterial,
      {
        name: 'AES-GCM',
        length: 256
      },
      true, // extractable to get raw bytes
      ['encrypt', 'decrypt']
    );
    
    // Export as raw bytes
    const bskBuffer = await crypto.subtle.exportKey('raw', bsk);
    return new Uint8Array(bskBuffer);
  } catch (error) {
    await appLog.error('crypto', 'BSK derivation failed', error);
    throw new Error('Failed to derive book share key');
  }
}

/**
 * Import raw key bytes as AES-GCM key
 */
export async function importAESKey(keyBytes: Uint8Array): Promise<CryptoKey> {
  try {
    return await crypto.subtle.importKey(
      'raw',
      keyBytes as BufferSource,
      {
        name: 'AES-GCM',
        length: 256
      },
      false,
      ['encrypt', 'decrypt']
    );
  } catch (error) {
    await appLog.error('crypto', 'AES key import failed', error);
    throw new Error('Failed to import AES key');
  }
}

/**
 * Generate KDF salt
 */
export function generateSalt(): Uint8Array {
  return crypto.getRandomValues(new Uint8Array(32));
}

/**
 * Wrap UDEK with App Key for storage
 */
export async function wrapUDEKWithAppKey(udek: Uint8Array, appKey: CryptoKey): Promise<{ wrapped: Uint8Array; iv: Uint8Array }> {
  try {
    const iv = crypto.getRandomValues(new Uint8Array(12));
    
    const wrapped = await crypto.subtle.encrypt(
      {
        name: 'AES-GCM',
        iv: iv as BufferSource
      },
      appKey,
      udek as BufferSource
    );
    
    return {
      wrapped: new Uint8Array(wrapped),
      iv
    };
  } catch (error) {
    await appLog.error('crypto', 'UDEK wrapping failed', error);
    throw new Error('Failed to wrap UDEK');
  }
}

/**
 * Unwrap UDEK with App Key
 */
export async function unwrapUDEKWithAppKey(wrappedUDEK: Uint8Array, iv: Uint8Array, appKey: CryptoKey): Promise<Uint8Array> {
  try {
    const unwrapped = await crypto.subtle.decrypt(
      {
        name: 'AES-GCM',
        iv: iv as BufferSource
      },
      appKey,
      wrappedUDEK as BufferSource
    );
    
    return new Uint8Array(unwrapped);
  } catch (error) {
    await appLog.error('crypto', 'UDEK unwrapping failed', error);
    throw new Error('Failed to unwrap UDEK');
  }
}

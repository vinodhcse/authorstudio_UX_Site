// AES-GCM encryption helpers for content encryption
import { appLog } from '../auth/fileLogger';

export interface EncryptedData {
  iv: Uint8Array;
  data: Uint8Array;
}

/**
 * Encrypt data using AES-GCM with a given key
 */
export async function aesGcmEncrypt(plaintext: Uint8Array, key: CryptoKey): Promise<EncryptedData> {
  try {
    const iv = crypto.getRandomValues(new Uint8Array(12)); // 96-bit IV for GCM
    
    const encrypted = await crypto.subtle.encrypt(
      {
        name: 'AES-GCM',
        iv: iv as BufferSource
      },
      key,
      plaintext as BufferSource
    );
    
    return {
      iv,
      data: new Uint8Array(encrypted)
    };
  } catch (error) {
    await appLog.error('crypto', 'AES-GCM encryption failed', error);
    throw new Error('Failed to encrypt data');
  }
}

/**
 * Decrypt data using AES-GCM with a given key
 */
export async function aesGcmDecrypt(ciphertext: Uint8Array, iv: Uint8Array, key: CryptoKey): Promise<Uint8Array> {
  try {
    console.log('🔓 [AES] Decryption input details:', {
      ciphertextLength: ciphertext.length,
      ivLength: iv.length,
      ciphertextSample: Array.from(ciphertext.slice(0, 8)),
      ivSample: Array.from(iv.slice(0, 8)),
      keyAlgorithm: key.algorithm
    });
    
    const decrypted = await crypto.subtle.decrypt(
      {
        name: 'AES-GCM',
        iv: iv as BufferSource
      },
      key,
      ciphertext as BufferSource
    );
    
    console.log('✅ [AES] Decryption successful, plaintext length:', decrypted.byteLength);
    return new Uint8Array(decrypted);
  } catch (error) {
    console.error('❌ [AES] Decryption failed with inputs:', {
      ciphertextLength: ciphertext.length,
      ivLength: iv.length,
      error
    });
    await appLog.error('crypto', 'AES-GCM decryption failed', error);
    throw new Error('Failed to decrypt data');
  }
}

/**
 * Convert Uint8Array to base64 string
 */
export function uint8ArrayToBase64(bytes: Uint8Array): string {
  return btoa(String.fromCharCode(...bytes));
}

/**
 * Convert base64 string to Uint8Array
 */
export function base64ToUint8Array(base64: string): Uint8Array {
  return new Uint8Array(atob(base64).split('').map(c => c.charCodeAt(0)));
}

/**
 * Encrypt JSON content for scene storage
 */
export async function encryptSceneContent(content: any, key: CryptoKey): Promise<{ contentEnc: string; contentIv: string }> {
  const jsonString = JSON.stringify(content);
  const plaintext = new TextEncoder().encode(jsonString);
  
  const { iv, data } = await aesGcmEncrypt(plaintext, key);
  
  return {
    contentEnc: uint8ArrayToBase64(data),
    contentIv: uint8ArrayToBase64(iv)
  };
}

/**
 * Decrypt JSON content from scene storage
 */
export async function decryptSceneContent(contentEnc: string, contentIv: string, key: CryptoKey): Promise<any> {
  console.log('🔓 [DecryptScene] Input details:', {
    contentEncLength: contentEnc.length,
    contentIvLength: contentIv.length,
    contentEncSample: contentEnc.substring(0, 20) + '...',
    contentIvSample: contentIv.substring(0, 20) + '...'
  });
  
  const ciphertext = base64ToUint8Array(contentEnc);
  const iv = base64ToUint8Array(contentIv);
  
  console.log('🔓 [DecryptScene] After base64 conversion:', {
    ciphertextLength: ciphertext.length,
    ivLength: iv.length,
    ciphertextSample: Array.from(ciphertext.slice(0, 8)),
    ivSample: Array.from(iv.slice(0, 8))
  });
  
  const decrypted = await aesGcmDecrypt(ciphertext, iv, key);
  const jsonString = new TextDecoder().decode(decrypted);
  
  console.log('✅ [DecryptScene] JSON string length:', jsonString.length);
  return JSON.parse(jsonString);
}

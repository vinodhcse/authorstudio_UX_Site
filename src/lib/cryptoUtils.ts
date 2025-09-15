// Crypto utilities for AES-GCM + PBKDF2 encryption/decryption
// Implementation for secure local storage of sensitive data

export interface EncryptionResult {
  encrypted: string;
  iv: string;
  salt?: string;
}

export interface AppKeyBundle {
  appKeyEnc: string;
  salt: string;
  iterations: number;
}

// PBKDF2 key derivation
export async function deriveAppKey(
  password: string,
  salt?: Uint8Array,
  iterations: number = 200000
): Promise<{ key: CryptoKey; salt: Uint8Array }> {
  const encoder = new TextEncoder();
  const passwordKey = await crypto.subtle.importKey(
    'raw',
    encoder.encode(password),
    'PBKDF2',
    false,
    ['deriveKey']
  );

  const actualSalt = salt || crypto.getRandomValues(new Uint8Array(16));

  const derivedKey = await crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: actualSalt as BufferSource,
      iterations,
      hash: 'SHA-256',
    },
    passwordKey,
    {
      name: 'AES-GCM',
      length: 256,
    },
    false,
    ['encrypt', 'decrypt']
  );

  return { key: derivedKey, salt: actualSalt };
}

// AES-GCM encryption
export async function encryptData(
  data: string,
  key: CryptoKey
): Promise<EncryptionResult> {
  const encoder = new TextEncoder();
  const iv = crypto.getRandomValues(new Uint8Array(12));

  const encrypted = await crypto.subtle.encrypt(
    {
      name: 'AES-GCM',
      iv,
    },
    key,
    encoder.encode(data)
  );

  return {
    encrypted: arrayBufferToBase64(encrypted),
    iv: arrayBufferToBase64(iv.buffer),
  };
}

// AES-GCM decryption
export async function decryptData(
  encryptedData: string,
  iv: string,
  key: CryptoKey
): Promise<string> {
  const decoder = new TextDecoder();

  const decrypted = await crypto.subtle.decrypt(
    {
      name: 'AES-GCM',
      iv: base64ToArrayBuffer(iv),
    },
    key,
    base64ToArrayBuffer(encryptedData)
  );

  return decoder.decode(decrypted);
}

// Utility functions for base64 conversion
function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}

// Encrypt with password (combines key derivation and encryption)
export async function encryptWithPassword(
  data: string,
  password: string,
  iterations: number = 200000
): Promise<EncryptionResult & { salt: string }> {
  const { key, salt } = await deriveAppKey(password, undefined, iterations);
  const result = await encryptData(data, key);
  
  return {
    ...result,
    salt: arrayBufferToBase64(salt.buffer as ArrayBuffer),
  };
}

// Decrypt with password (combines key derivation and decryption)
export async function decryptWithPassword(
  encryptedData: string,
  iv: string,
  salt: string,
  password: string,
  iterations: number = 200000
): Promise<string> {
  const saltBuffer = base64ToArrayBuffer(salt);
  const { key } = await deriveAppKey(password, new Uint8Array(saltBuffer), iterations);
  
  return await decryptData(encryptedData, iv, key);
}

// Generate RSA/ECC keypair for device keys
export async function generateDeviceKeypair(): Promise<{
  publicKey: string;
  privateKey: CryptoKey;
}> {
  const keyPair = await crypto.subtle.generateKey(
    {
      name: 'RSA-OAEP',
      modulusLength: 2048,
      publicExponent: new Uint8Array([1, 0, 1]),
      hash: 'SHA-256',
    },
    true,
    ['encrypt', 'decrypt']
  );

  const publicKeyJwk = await crypto.subtle.exportKey('jwk', keyPair.publicKey);
  
  return {
    publicKey: JSON.stringify(publicKeyJwk),
    privateKey: keyPair.privateKey,
  };
}

// Encrypt device private key with AppKey
export async function encryptDevicePrivateKey(
  privateKey: CryptoKey,
  appKey: CryptoKey
): Promise<EncryptionResult> {
  const privateKeyJwk = await crypto.subtle.exportKey('jwk', privateKey);
  const privateKeyString = JSON.stringify(privateKeyJwk);
  
  return await encryptData(privateKeyString, appKey);
}

// Decrypt and import device private key
export async function decryptDevicePrivateKey(
  encryptedPrivateKey: string,
  iv: string,
  appKey: CryptoKey
): Promise<CryptoKey> {
  const privateKeyString = await decryptData(encryptedPrivateKey, iv, appKey);
  const privateKeyJwk = JSON.parse(privateKeyString);
  
  return await crypto.subtle.importKey(
    'jwk',
    privateKeyJwk,
    {
      name: 'RSA-OAEP',
      hash: 'SHA-256',
    },
    false,
    ['decrypt']
  );
}

// Secure random string generation
export function generateSecureRandomString(length: number = 32): string {
  const array = new Uint8Array(length);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
}

// Validate if crypto is available
export function isCryptoAvailable(): boolean {
  return typeof crypto !== 'undefined' && 
         typeof crypto.subtle !== 'undefined' &&
         typeof crypto.getRandomValues !== 'undefined';
}

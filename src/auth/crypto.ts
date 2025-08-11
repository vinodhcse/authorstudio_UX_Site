// Crypto utilities for PBKDF2 + AES-GCM encryption/decryption
// Implementation for secure authentication storage

export interface EncryptedData {
  iv: Uint8Array;
  data: Uint8Array;
}

export interface AppKeyResult {
  key: CryptoKey;
  salt: Uint8Array;
  iters: number;
}

// Default iterations for PBKDF2 (minimum 200k)
const DEFAULT_PBKDF2_ITERATIONS = 200000;

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
  // Remove any whitespace and convert to lowercase
  const cleanHex = hex.replace(/\s/g, '').toLowerCase();
  
  // Check if it's a valid hex string
  if (!/^[0-9a-f]*$/i.test(cleanHex)) {
    throw new Error('Invalid hex string');
  }
  
  // Ensure even length
  const paddedHex = cleanHex.length % 2 === 0 ? cleanHex : '0' + cleanHex;
  
  const bytes = new Uint8Array(paddedHex.length / 2);
  for (let i = 0; i < paddedHex.length; i += 2) {
    bytes[i / 2] = parseInt(paddedHex.substr(i, 2), 16);
  }
  return bytes;
}

/**
 * Ensure a value is converted to proper Uint8Array BufferSource
 */
function ensureBufferSource(value: any): Uint8Array {
  console.log('🔍 ensureBufferSource input:', { 
    type: typeof value, 
    isArray: Array.isArray(value),
    isUint8Array: value instanceof Uint8Array,
    length: value?.length,
    constructor: value?.constructor?.name,
    sample: value instanceof Uint8Array ? `[${Array.from(value.slice(0, 5)).join(', ')}...]` : 
            typeof value === 'string' ? `"${value.substring(0, 50)}..."` : 'N/A',
    firstChars: typeof value === 'string' ? value.split('').slice(0, 10).map(c => c.charCodeAt(0)) : 'N/A'
  });
  
  if (value instanceof Uint8Array) {
    return value;
  } else if (Array.isArray(value)) {
    // Convert array to Uint8Array
    return new Uint8Array(value);
  } else if (typeof value === 'string') {
    // Check if it's a JSON array string (SQLite seems to store Uint8Array as JSON)
    if (value.startsWith('[') && value.endsWith(']')) {
      console.log('🔍 Detected JSON array format, parsing...');
      try {
        const arrayData = JSON.parse(value);
        if (Array.isArray(arrayData)) {
          return new Uint8Array(arrayData);
        }
      } catch (e) {
        console.error('🔍 JSON parse failed:', e);
      }
    }
    
    // Detect if it's a base64 string (contains only base64 chars)
    if (/^[A-Za-z0-9+/]+=*$/.test(value)) {
      console.log('🔍 Detected base64 format, decoding...');
      try {
        return base64ToBytes(value);
      } catch (e) {
        console.error('🔍 Base64 decode failed:', e);
      }
    }
    
    // Detect if it's a hex string
    if (/^[0-9a-fA-F]+$/.test(value)) {
      console.log('🔍 Detected hex format, decoding...');
      try {
        return hexToBytes(value);
      } catch (e) {
        console.error('🔍 Hex decode failed:', e);
      }
    }
    
    // If it looks like a UTF-8 encoded binary string, try converting directly
    console.log('🔍 Treating as raw binary string...');
    try {
      const bytes = new Uint8Array(value.length);
      for (let i = 0; i < value.length; i++) {
        bytes[i] = value.charCodeAt(i);
      }
      return bytes;
    } catch (e) {
      console.error('🔍 Raw binary conversion failed:', e);
      throw new Error(`Failed to decode string data: ${value.substring(0, 20)}...`);
    }
  } else if (value && typeof value === 'object' && value.data && Array.isArray(value.data)) {
    // Handle SQLite BLOB format which might come as {data: number[]}
    return new Uint8Array(value.data);
  } else {
    throw new Error(`Invalid buffer source format: ${typeof value}`);
  }
}

/**
 * Derive AppKey from passphrase using PBKDF2
 */
export async function deriveAppKey(
  passphrase: string,
  salt?: Uint8Array,
  iterations?: number
): Promise<AppKeyResult> {
  const encoder = new TextEncoder();
  const iters = iterations || DEFAULT_PBKDF2_ITERATIONS;
  
  // Import passphrase as raw key material
  const passwordKey = await crypto.subtle.importKey(
    'raw',
    encoder.encode(passphrase),
    'PBKDF2',
    false,
    ['deriveKey']
  );

  // Generate salt if not provided
  const actualSalt = salt || randomBytes(16);

  // Ensure salt is a proper BufferSource (Uint8Array)
  let saltBuffer: Uint8Array;
  try {
    saltBuffer = ensureBufferSource(actualSalt);
  } catch {
    // Fallback: create new salt if conversion fails
    saltBuffer = randomBytes(16);
  }

  // Create a proper ArrayBuffer from the Uint8Array
  const saltArrayBuffer = new ArrayBuffer(saltBuffer.length);
  const saltView = new Uint8Array(saltArrayBuffer);
  saltView.set(saltBuffer);

  // Derive AES-GCM key
  const derivedKey = await crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: saltArrayBuffer,
      iterations: iters,
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

  return { 
    key: derivedKey, 
    salt: saltBuffer, // Return the original Uint8Array
    iters 
  };
}

/**
 * Encrypt data using AES-GCM
 */
export async function aesGcmEncrypt(
  plain: Uint8Array,
  key: CryptoKey
): Promise<EncryptedData> {
  // Generate random IV (12 bytes for GCM)
  const iv = randomBytes(12);

  // Encrypt the data
  const encrypted = await crypto.subtle.encrypt(
    {
      name: 'AES-GCM',
      iv: iv as BufferSource,
    },
    key,
    plain as BufferSource
  );

  return {
    iv,
    data: new Uint8Array(encrypted),
  };
}

/**
 * Decrypt data using AES-GCM
 */
export async function aesGcmDecrypt(
  data: Uint8Array,
  iv: Uint8Array,
  key: CryptoKey
): Promise<Uint8Array> {
  const decrypted = await crypto.subtle.decrypt(
    {
      name: 'AES-GCM',
      iv: iv as BufferSource,
    },
    key,
    data as BufferSource
  );

  return new Uint8Array(decrypted);
}

/**
 * Generate cryptographically secure random bytes
 */
export function randomBytes(n: number): Uint8Array {
  return crypto.getRandomValues(new Uint8Array(n));
}

/**
 * Encrypt string data with AppKey
 */
export async function encryptString(
  plaintext: string,
  key: CryptoKey
): Promise<EncryptedData> {
  const encoder = new TextEncoder();
  const plain = encoder.encode(plaintext);
  return await aesGcmEncrypt(plain, key);
}

/**
 * Decrypt string data with AppKey
 */
export async function decryptString(
  data: Uint8Array,
  iv: Uint8Array,
  key: CryptoKey
): Promise<string> {
  const decrypted = await aesGcmDecrypt(data, iv, key);
  const decoder = new TextDecoder();
  return decoder.decode(decrypted);
}

/**
 * Pack IV and data into a single Uint8Array for storage
 * Format: [iv_length(1 byte)][iv][data]
 */
export function pack(iv: Uint8Array, data: Uint8Array): Uint8Array {
  const packed = new Uint8Array(1 + iv.length + data.length);
  packed[0] = iv.length;
  packed.set(iv, 1);
  packed.set(data, 1 + iv.length);
  return packed;
}

/**
 * Unpack IV and data from a single Uint8Array
 */
export function unpack(packed: Uint8Array | any): EncryptedData {
  // Ensure packed data is in the right format
  let packedBuffer: Uint8Array;
  try {
    packedBuffer = ensureBufferSource(packed);
  } catch (error) {
    throw new Error(`Invalid packed data format: ${error}`);
  }
  
  if (packedBuffer.length < 2) {
    throw new Error('Packed data too short');
  }
  
  const ivLength = packedBuffer[0];
  if (ivLength > packedBuffer.length - 1) {
    throw new Error('Invalid IV length in packed data');
  }
  
  const iv = packedBuffer.slice(1, 1 + ivLength);
  const data = packedBuffer.slice(1 + ivLength);
  return { iv, data };
}

/**
 * Generate a random probe value for passphrase verification
 */
export function generateProbe(): Uint8Array {
  return randomBytes(32);
}

/**
 * Encrypt the probe value with AppKey for storage
 */
export async function encryptProbe(
  probe: Uint8Array,
  appKey: CryptoKey
): Promise<Uint8Array> {
  const encrypted = await aesGcmEncrypt(probe, appKey);
  return pack(encrypted.iv, encrypted.data);
}

/**
 * Verify passphrase by attempting to decrypt the stored probe
 * Throws error if passphrase is incorrect
 */
export async function verifyProbe(
  storedProbe: Uint8Array | any,
  appKey: CryptoKey
): Promise<boolean> {
  try {
    // Ensure the stored probe is in the right format
    let probeBuffer: Uint8Array;
    try {
      probeBuffer = ensureBufferSource(storedProbe);
    } catch {
      console.error('Failed to convert stored probe to proper format');
      return false;
    }
    
    const { iv, data } = unpack(probeBuffer);
    await aesGcmDecrypt(data, iv, appKey);
    return true;
  } catch (error) {
    console.error('Probe verification failed:', error);
    return false;
  }
}

/**
 * Generate RSA/ECC keypair for device keys
 */
export async function generateDeviceKeypair(): Promise<{
  publicKeyPem: string;
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

  // Export public key to PEM format
  const publicKeyBuffer = await crypto.subtle.exportKey('spki', keyPair.publicKey);
  const publicKeyPem = bufferToPem(publicKeyBuffer, 'PUBLIC KEY');

  return {
    publicKeyPem,
    privateKey: keyPair.privateKey,
  };
}

/**
 * Encrypt device private key with AppKey
 */
export async function encryptDevicePrivateKey(
  privateKey: CryptoKey,
  appKey: CryptoKey
): Promise<Uint8Array> {
  // Export private key to JWK format
  const privateKeyJwk = await crypto.subtle.exportKey('jwk', privateKey);
  const privateKeyString = JSON.stringify(privateKeyJwk);
  
  // Encrypt with AppKey
  const encrypted = await encryptString(privateKeyString, appKey);
  return pack(encrypted.iv, encrypted.data);
}

/**
 * Decrypt and import device private key
 */
export async function decryptDevicePrivateKey(
  encryptedPrivateKey: Uint8Array,
  appKey: CryptoKey
): Promise<CryptoKey> {
  const { iv, data } = unpack(encryptedPrivateKey);
  const privateKeyString = await decryptString(data, iv, appKey);
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

/**
 * Convert ArrayBuffer to PEM format
 */
function bufferToPem(buffer: ArrayBuffer, label: string): string {
  const base64 = btoa(String.fromCharCode(...new Uint8Array(buffer)));
  const formatted = base64.match(/.{1,64}/g)?.join('\n') || base64;
  return `-----BEGIN ${label}-----\n${formatted}\n-----END ${label}-----`;
}

/**
 * Check if Web Crypto API is available
 */
export function isCryptoAvailable(): boolean {
  return typeof crypto !== 'undefined' && 
         typeof crypto.subtle !== 'undefined' &&
         typeof crypto.getRandomValues !== 'undefined';
}

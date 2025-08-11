// Device ID management using Tauri app config directory
import { writeTextFile, readTextFile, exists } from '@tauri-apps/plugin-fs';
import { join, appConfigDir } from '@tauri-apps/api/path';

export interface DeviceConfig {
  deviceId: string;
}

/**
 * Get or create device ID from {appConfigDir}/device.json
 * This is the only file stored in appConfigDir - everything else goes to SQLite
 */
export async function getOrCreateDeviceId(): Promise<string> {
  try {
    const configDir = await appConfigDir();
    const devicePath = await join(configDir, 'device.json');
    
    // Check if device.json exists
    const fileExists = await exists(devicePath);
    
    if (fileExists) {
      // Read existing device ID
      const content = await readTextFile(devicePath);
      const config: DeviceConfig = JSON.parse(content);
      
      if (config.deviceId && typeof config.deviceId === 'string') {
        return config.deviceId;
      }
    }
    
    // Generate new device ID (UUID v4)
    const deviceId = generateUuidV4();
    const config: DeviceConfig = { deviceId };
    
    // Save to device.json
    await writeTextFile(devicePath, JSON.stringify(config, null, 2));
    
    return deviceId;
    
  } catch (error) {
    console.error('Failed to get/create device ID:', error);
    throw new Error('Failed to manage device ID');
  }
}

/**
 * Generate UUID v4
 */
function generateUuidV4(): string {
  // Use crypto.randomUUID if available (modern browsers/Node.js)
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  
  // Fallback implementation
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

/**
 * Check if we're running in Tauri environment
 */
export function isTauri(): boolean {
  return typeof window !== 'undefined' && '__TAURI__' in window;
}

/**
 * Clear device ID (used during complete logout/reset)
 */
export async function clearDeviceId(): Promise<void> {
  try {
    const configDir = await appConfigDir();
    const devicePath = await join(configDir, 'device.json');
    
    const fileExists = await exists(devicePath);
    if (fileExists) {
      // For now, we keep the device ID even on logout
      // Only remove it if explicitly requested by user
      console.log('Device ID preserved on logout');
    }
  } catch (error) {
    console.warn('Failed to clear device ID:', error);
  }
}

/**
 * Force regenerate device ID (for complete device reset)
 */
export async function regenerateDeviceId(): Promise<string> {
  try {
    const configDir = await appConfigDir();
    const devicePath = await join(configDir, 'device.json');
    
    // Generate new device ID
    const deviceId = generateUuidV4();
    const config: DeviceConfig = { deviceId };
    
    // Overwrite existing file
    await writeTextFile(devicePath, JSON.stringify(config, null, 2));
    
    return deviceId;
    
  } catch (error) {
    console.error('Failed to regenerate device ID:', error);
    throw new Error('Failed to regenerate device ID');
  }
}

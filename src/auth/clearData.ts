// Utilities for clearing local authentication data
// Use this to reset the app to initial state when data is corrupted

import { openDb } from './sqlite';

/**
 * Clear all local authentication data
 * This will reset the app to initial state (login required)
 */
export async function clearAllLocalData(): Promise<void> {
  try {
    console.log('🧹 Clearing all local authentication data...');
    
    // 1. Clear SQLite database
    await clearSQLiteData();
    
    // 2. Clear any localStorage data (if any)
    clearLocalStorage();
    
    // 3. Clear any sessionStorage data (if any)
    clearSessionStorage();
    
    console.log('✅ All local data cleared successfully');
  } catch (error) {
    console.error('❌ Error clearing local data:', error);
    throw error;
  }
}

/**
 * Clear SQLite database tables
 */
async function clearSQLiteData(): Promise<void> {
  try {
    const db = await openDb();
    
    // Clear all tables
    await db.execute('DELETE FROM session');
    await db.execute('DELETE FROM device');
    await db.execute('DELETE FROM kv');
    
    // Reset auto-increment counters
    await db.execute('DELETE FROM sqlite_sequence WHERE name IN ("session", "device", "kv")');
    
    console.log('✅ SQLite data cleared');
  } catch (error) {
    console.error('❌ Error clearing SQLite data:', error);
    throw error;
  }
}

/**
 * Clear localStorage keys related to auth
 */
function clearLocalStorage(): void {
  try {
    // Clear any auth-related localStorage keys
    const keysToRemove = [
      'auth-token',
      'user-data',
      'device-id',
      'session-data',
      'app-key',
      // Add any other keys your app might use
    ];
    
    keysToRemove.forEach(key => {
      if (localStorage.getItem(key)) {
        localStorage.removeItem(key);
        console.log(`Removed localStorage key: ${key}`);
      }
    });
    
    console.log('✅ localStorage cleared');
  } catch (error) {
    console.error('❌ Error clearing localStorage:', error);
  }
}

/**
 * Clear sessionStorage keys related to auth
 */
function clearSessionStorage(): void {
  try {
    // Clear any auth-related sessionStorage keys
    const keysToRemove = [
      'temp-session',
      'unlock-state',
      // Add any other keys your app might use
    ];
    
    keysToRemove.forEach(key => {
      if (sessionStorage.getItem(key)) {
        sessionStorage.removeItem(key);
        console.log(`Removed sessionStorage key: ${key}`);
      }
    });
    
    console.log('✅ sessionStorage cleared');
  } catch (error) {
    console.error('❌ Error clearing sessionStorage:', error);
  }
}

/**
 * Clear only session data (keep device registration)
 * Use this for logout while keeping device trusted
 */
export async function clearSessionData(): Promise<void> {
  try {
    console.log('🧹 Clearing session data...');
    
    const db = await openDb();
    
    // Clear only session table, keep device table
    await db.execute('DELETE FROM session');
    await db.execute('DELETE FROM sqlite_sequence WHERE name = "session"');
    
    console.log('✅ Session data cleared');
  } catch (error) {
    console.error('❌ Error clearing session data:', error);
    throw error;
  }
}

/**
 * Emergency reset - clear everything and reload the app
 */
export async function emergencyReset(): Promise<void> {
  try {
    await clearAllLocalData();
    
    // Force reload the app
    if (typeof window !== 'undefined') {
      window.location.reload();
    }
  } catch (error) {
    console.error('❌ Emergency reset failed:', error);
    // Force reload even if clearing failed
    if (typeof window !== 'undefined') {
      window.location.reload();
    }
  }
}

// Add global functions for console debugging
if (typeof window !== 'undefined') {
  (window as any).clearAuthData = clearAllLocalData;
  (window as any).emergencyReset = emergencyReset;
  console.log('🔧 Debug functions available:');
  console.log('  - window.clearAuthData() - Clear all auth data');
  console.log('  - window.emergencyReset() - Clear data and reload');
}

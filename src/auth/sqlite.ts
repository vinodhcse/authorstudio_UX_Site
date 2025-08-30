// Tauri Store-backed authentication storage
import { load } from '@tauri-apps/plugin-store';
import { isTauri } from '../data/dal';
import { appLog } from './fileLogger';

export interface SessionRow {
  id?: string;
  user_id: string;
  email: string;
  name: string;
  device_id: string;
  refresh_token_enc?: Uint8Array;
  device_private_key_enc?: Uint8Array;
  appkey_wrap_salt?: Uint8Array;
  appkey_wrap_iters?: number;
  appkey_probe?: Uint8Array;
  access_exp?: number;
  subscription_status?: string;
  subscription_expires_at?: number;
  subscription_last_checked_at?: number;
  session_state?: 'active' | 'sealed';
  sealed_at?: number;
  updated_at?: number;
}

export interface DeviceRow {
  id?: number;
  device_id: string;
}

let storePromise: Promise<any> | null = null;

function getStore() {
  if (!storePromise) {
    storePromise = load('authorstudio-session.dat', { autoSave: false, defaults: {} });
  }
  return storePromise;
}
// LocalStorage fallback for browser
const LS_KEY = 'authorstudio-session';

// No-op shim to keep API compatible
export async function openDb(): Promise<void> { return; }

// Session CRUD
export async function getSessionRow(userEmail?: string, userId?: string): Promise<SessionRow | null> {
  appLog.info('sqlite', 'Retrieving session...', { userEmail: !!userEmail, userId: !!userId });
  if (isTauri()) {
    try {
  const store = await getStore();
  const session = await store.get('session');
      if (!session) {
        appLog.info('sqlite', 'No session found');
        return null;
      }
      if (userEmail && session.email !== userEmail) return null;
      if (userId && session.user_id !== userId) return null;
      appLog.info('sqlite', 'Session retrieved successfully', session);
      return session;
    } catch (error) {
      appLog.error('sqlite', 'Failed to get session', { error: String(error) });
      return null;
    }
  } else {
    // Browser fallback
    try {
      const raw = localStorage.getItem(LS_KEY);
      if (!raw) return null;
      const session = JSON.parse(raw) as SessionRow;
      if (userEmail && session.email !== userEmail) return null;
      if (userId && session.user_id !== userId) return null;
      return session;
    } catch (error) {
      return null;
    }
  }
}

export async function upsertSessionRow(data: Partial<SessionRow>): Promise<Boolean | null> {
  appLog.info('sqlite', 'Upserting session data...', data);
  if (isTauri()) {
    try {
  const store = await getStore();
  await store.set('session', data);
  await store.save();
      appLog.success('sqlite', 'Session upserted successfully', { userId: data.user_id });
      return true;
    } catch (err) {
      appLog.error('sqlite', 'Failed to upsert session', { error: err, data });
      return false;
    }
  } else {
    // Browser fallback
    try {
      localStorage.setItem(LS_KEY, JSON.stringify(data));
      return true;
    } catch (err) {
      return false;
    }
  }
}

export async function clearsession1(): Promise<Boolean | null> {
  appLog.info('sqlite', 'Clearing session...');
  if (isTauri()) {
    try {
  const store = await getStore();
  await store.delete('session');
  await store.save();
      appLog.info('sqlite', 'Session cleared');
      return true;
    } catch (error) {
      appLog.error('sqlite', 'Failed to clear session', { error: String(error) });
      return false;
    }
  } else {
    // Browser fallback
    try {
      localStorage.removeItem(LS_KEY);
      return true;
    } catch (error) {
      return false;
    }
  }
}

export async function clearSession(): Promise<void> {
  if (isTauri()) {
  const store = await getStore();
  await store.delete('session');
  await store.save();
  } else {
    localStorage.removeItem(LS_KEY);
  }
  appLog.info('sqlite', 'Session cleared completely');
}

export async function sealSession(): Promise<void> {
  const store = await getStore();
  const session = await store.get('session');
  if (session) {
    session.session_state = 'sealed';
    session.sealed_at = Date.now();
    await store.set('session', session);
    await store.save();
    appLog.success('sqlite', 'Session sealed successfully - data preserved but access locked');
  }
}

export async function activateSession(userId: string): Promise<boolean> {
  const store = await getStore();
  const session = await store.get('session');
  if (session && session.user_id === userId) {
    session.session_state = 'active';
    await store.set('session', session);
    await store.save();
    appLog.success('sqlite', 'Session activated successfully');
    return true;
  }
  return false;
}

// Device CRUD
export async function getDeviceRow(): Promise<DeviceRow | null> {
  const store = await getStore();
  return await store.get('device');
}

export async function upsertDeviceRow(deviceId: string): Promise<void> {
  const store = await getStore();
  await store.set('device', { device_id: deviceId });
  await store.save();
}

// KV operations for future encrypted secrets
export async function setKV(key: string, value: Uint8Array): Promise<void> {
  const store = await getStore();
  await store.set(key, Array.from(value));
  await store.save();
}

export async function getKV(key: string): Promise<Uint8Array | null> {
  const store = await getStore();
  const v = await store.get(key);
  return v ? new Uint8Array(v) : null;
}

export async function deleteKV(key: string): Promise<void> {
  const store = await getStore();
  await store.delete(key);
  await store.save();
}

// Close database connection
export async function closeDb(): Promise<void> {
  // no-op for Tauri Store
}

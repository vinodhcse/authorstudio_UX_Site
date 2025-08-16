// Surreal-backed authentication storage via Tauri commands
import { invoke } from '@tauri-apps/api/core';
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
  session_state?: 'active' | 'sealed'; // New: session sealing state
  sealed_at?: number; // New: when session was sealed
  updated_at?: number;
}

export interface DeviceRow {
  id?: number;
  device_id: string;
}

// No-op shim to keep API compatible
export async function openDb(): Promise<void> { return; }

export async function getSessionRow(userEmail?: string, userId?: string): Promise<SessionRow | null> {
  appLog.info('sqlite', 'Retrieving session from database...', { userEmail: !!userEmail, userId: !!userId });
  
  try {
    // Use our new DAL system to get session
    const session = await invoke<any>('app_get_session');
    appLog.info('sqlite', 'Session retrieved from database', { session });
    if (session) {
      // Convert from our new Session format to SessionRow format
      const result: SessionRow = {
        id: session.id,
        user_id: session.userId,
        email: session.email,
        name: session.name,
        device_id: session.device_id,
        refresh_token_enc: session.refresh_token_enc,
        device_private_key_enc: session.device_private_key_enc,
        appkey_wrap_salt: session.appkey_wrap_salt,
        appkey_wrap_iters: session.appkey_wrap_iters,
        appkey_probe: session.appkey_probe,
        access_exp: session.access_exp,
        subscription_status: session.subscription_status,
        subscription_expires_at: session.subscription_expires_at,
        subscription_last_checked_at: session.subscription_last_checked_at,
        session_state: session.session_state,
        sealed_at: session.sealed_at,
        updated_at: session.updated_at,
      };
      
      // Filter by email or userId if provided
      if (userEmail && result.email !== userEmail) {
        appLog.info('sqlite', 'Session found but email does not match', { 
          sessionEmail: result.email, 
          requestedEmail: userEmail 
        });
        return null;
      } else if (userId && result.user_id !== userId) {
        appLog.info('sqlite', 'Session found but user ID does not match', { 
          sessionUserId: result.user_id, 
          requestedUserId: userId 
        });
        return null;
      }
      
      appLog.info('sqlite', 'Session retrieved successfully', {
        user_id: result.user_id,
        email: result.email,
        state: result.session_state,
        sealed_at: result.sealed_at
      });
      
      return result;
    }
    
    appLog.info('sqlite', 'No session found');
    return null;
    
  } catch (error) {
    appLog.error('sqlite', 'Failed to get session', { error: String(error) });
    return null;
  }
}


export async function clearsession1(userEmail?: string, userId?: string): Promise<Boolean | null> {
  appLog.info('sqlite', 'Retrieving session from database...', { userEmail: !!userEmail, userId: !!userId });
  
  try {
    // Use our new DAL system to get session
    const response = await invoke<any>('app_clear_session');
    appLog.info('sqlite', 'Session cleared response', response);

    return true;
    
  } catch (error) {
    appLog.error('sqlite', 'Failed to get session', { error: String(error) });
    return true;
  }
}

export async function upsertSessionRow(data: Partial<SessionRow>): Promise<void> {
  appLog.info('sqlite', 'Upserting session data...', {
    fieldsToUpdate: Object.keys(data),
    hasUserId: !!data.user_id,
    hasEmail: !!data.email,
    sessionState: data.session_state
  });
  console.log('🔄 Upserting session data:', data);
  try {
    // Convert SessionRow format to our new Session format
    const sessionData = {
      user_id: data.user_id,
      email: data.email,
      device_id: data.device_id,
      name: data.name,
      refresh_token_enc: data.refresh_token_enc,
      device_private_key_enc: data.device_private_key_enc,
      appkey_wrap_salt: data.appkey_wrap_salt,
      appkey_wrap_iters: data.appkey_wrap_iters,
      appkey_probe: data.appkey_probe,
      access_exp: data.access_exp,
      subscription_status: data.subscription_status,
      subscription_expires_at: data.subscription_expires_at,
      subscription_last_checked_at: data.subscription_last_checked_at,
      session_state: data.session_state,
      sealed_at: data.sealed_at,
      updated_at: data.updated_at,
    };

    /* const sessionData = {
      user_id: data.user_id,
      email: data.email,
      name: data.name
     
    };*/

    // Use our new DAL system
    await invoke('app_save_session', { session: sessionData });
    appLog.success('sqlite', 'Session upserted successfully', { userId: data.user_id });
  } catch (err) {
    appLog.error('sqlite', 'Failed to upsert session', { error: err, data });
    throw err;
  }
}

export async function clearSession(): Promise<void> {
  console.log('🗑️ Clearing session completely...');
  await invoke('app_clear_session');
  // Also clear kv entirely is handled by callers via kv_delete per key if needed
  console.log('✅ Session cleared completely');
}

/**
 * Seal the current session (logout but keep data)
 */
export async function sealSession(): Promise<void> {
  appLog.info('sqlite', 'Starting session sealing process...');
  console.log('📊 Updating session to sealed state in Surreal...');
  await invoke('session_seal');
  appLog.success('sqlite', 'Session sealed successfully - data preserved but access locked');
}

/**
 * Activate (unseal) the session for the same user
 */
export async function activateSession(userId: string): Promise<boolean> {
  console.log('🔓 Starting session activation for user:', userId);
  const ok = await invoke<boolean>('session_activate', { userId });
  console.log('✅ Session activation result:', ok);
  return ok;
}

export async function getDeviceRow(): Promise<DeviceRow | null> {
  return await invoke<DeviceRow | null>('device_get');
}

export async function upsertDeviceRow(deviceId: string): Promise<void> {
  await invoke('device_upsert', { deviceId });
}

// KV operations for future encrypted secrets
export async function setKV(key: string, value: Uint8Array): Promise<void> {
  await invoke('kv_set', { k: key, v: Array.from(value) });
}

export async function getKV(key: string): Promise<Uint8Array | null> {
  const v = await invoke<number[] | null>('kv_get', { k: key });
  return v ? new Uint8Array(v) : null;
}

export async function deleteKV(key: string): Promise<void> {
  await invoke('kv_delete', { k: key });
}

// Close database connection
export async function closeDb(): Promise<void> {
  // no-op for Surreal client
}

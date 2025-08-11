// SQLite database operations for Tauri authentication
import Database from '@tauri-apps/plugin-sql';
import { appLog } from './fileLogger';

let db: Database | null = null;

export interface SessionRow {
  id?: number;
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

export async function openDb(): Promise<Database> {
  if (db) return db;
  
  db = await Database.load("sqlite:app.db");
  await db.execute("PRAGMA journal_mode=WAL;");
  
  // Create session table
  await db.execute(`
    CREATE TABLE IF NOT EXISTS session (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      user_id TEXT NOT NULL,
      email TEXT NOT NULL,
      name TEXT NOT NULL,
      device_id TEXT NOT NULL,
      refresh_token_enc BLOB,
      device_private_key_enc BLOB,
      appkey_wrap_salt BLOB,
      appkey_wrap_iters INTEGER,
      appkey_probe BLOB,
      access_exp INTEGER,
      subscription_status TEXT,
      subscription_expires_at INTEGER,
      subscription_last_checked_at INTEGER,
      session_state TEXT DEFAULT 'active' CHECK (session_state IN ('active', 'sealed')),
      sealed_at INTEGER,
      updated_at INTEGER
    )
  `);
  
  // Add migration for existing databases that might not have the new columns
  try {
    await db.execute(`
      ALTER TABLE session ADD COLUMN session_state TEXT DEFAULT 'active' CHECK (session_state IN ('active', 'sealed'))
    `);
    appLog.info('migration', 'Added session_state column');
  } catch (error) {
    // Column already exists, ignore error
    appLog.info('migration', 'session_state column already exists');
  }
  
  try {
    await db.execute(`
      ALTER TABLE session ADD COLUMN sealed_at INTEGER
    `);
    appLog.info('migration', 'Added sealed_at column');
  } catch (error) {
    // Column already exists, ignore error
    appLog.info('migration', 'sealed_at column already exists');
  }
  
  // Create device table
  await db.execute(`
    CREATE TABLE IF NOT EXISTS device (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      device_id TEXT NOT NULL UNIQUE
    )
  `);
  
  // Create kv table for future secrets
  await db.execute(`
    CREATE TABLE IF NOT EXISTS kv (
      k TEXT PRIMARY KEY,
      v BLOB NOT NULL
    )
  `);
  
  return db;
}

export async function getSessionRow(): Promise<SessionRow | null> {
  appLog.info('sqlite', 'Retrieving session from database...');
  const database = await openDb();
  
  const result = await database.select<SessionRow[]>(
    "SELECT * FROM session WHERE id = 1"
  );
  
  if (result.length > 0) {
    appLog.info('sqlite', 'Session found', {
      user_id: result[0].user_id,
      email: result[0].email,
      state: result[0].session_state,
      sealed_at: result[0].sealed_at
    });
    return result[0];
  } else {
    appLog.info('sqlite', 'No session found in database');
    return null;
  }
}

export async function upsertSessionRow(data: Partial<SessionRow>): Promise<void> {
  appLog.info('sqlite', 'Upserting session data...', {
    fieldsToUpdate: Object.keys(data),
    hasUserId: !!data.user_id,
    hasEmail: !!data.email,
    sessionState: data.session_state
  });
  const database = await openDb();
  
  // Check if row exists
  const existing = await getSessionRow();
  
  if (existing) {
    appLog.info('sqlite', 'Updating existing session...');
    // Update existing row
    const updateFields: string[] = [];
    const values: any[] = [];
    
    Object.entries(data).forEach(([key, value]) => {
      if (key !== 'id' && value !== undefined) {
        updateFields.push(`${key} = ?`);
        values.push(value);
      }
    });
    
    if (updateFields.length > 0) {
      values.push(1); // WHERE id = 1
      console.log('📊 [SQLITE] Executing UPDATE with fields:', updateFields);
      await database.execute(
        `UPDATE session SET ${updateFields.join(', ')} WHERE id = 1`,
        values
      );
      console.log('✅ [SQLITE] Session updated successfully');
    } else {
      console.log('⚠️ [SQLITE] No fields to update');
    }
  } else {
    console.log('➕ [SQLITE] Creating new session...');
    // Insert new row
    const fields = ['id', ...Object.keys(data).filter(k => data[k as keyof SessionRow] !== undefined)];
    const placeholders = fields.map(() => '?').join(', ');
    const values = [1, ...Object.values(data).filter(v => v !== undefined)];
    
    await database.execute(
      `INSERT INTO session (${fields.join(', ')}) VALUES (${placeholders})`,
      values
    );
  }
}

export async function clearSession(): Promise<void> {
  console.log('🗑️ Clearing session completely...');
  const database = await openDb();
  
  // Clear session data
  await database.execute("DELETE FROM session WHERE id = 1");
  
  // Clear all KV secrets
  await database.execute("DELETE FROM kv");
  
  console.log('✅ Session cleared completely');
}

/**
 * Seal the current session (logout but keep data)
 */
export async function sealSession(): Promise<void> {
  appLog.info('sqlite', 'Starting session sealing process...');
  const database = await openDb();
  
  console.log('📊 [SQLITE] Updating session table to sealed state...');
  await database.execute(`
    UPDATE session 
    SET session_state = 'sealed', 
        sealed_at = ?1, 
        access_exp = NULL,
        updated_at = ?2
    WHERE id = 1
  `, [Date.now(), Date.now()]);
  
  appLog.success('sqlite', 'Session sealed successfully - data preserved but access locked');
}

/**
 * Activate (unseal) the session for the same user
 */
export async function activateSession(userId: string): Promise<boolean> {
  console.log('🔓 [SQLITE] Starting session activation for user:', userId);
  const database = await openDb();
  
  // Check if session exists and belongs to the same user
  console.log('📋 [SQLITE] Checking existing session for user match...');
  const session = await getSessionRow();
  if (!session) {
    console.log('❌ [SQLITE] No session found to activate');
    return false;
  }
  
  console.log('🔍 [SQLITE] Session found - verifying user match:', {
    sessionUserId: session.user_id,
    requestedUserId: userId,
    currentState: session.session_state
  });
  
  if (session.user_id !== userId) {
    console.log('❌ [SQLITE] Session belongs to different user - keeping sealed');
    return false;
  }
  
  console.log('📊 [SQLITE] Updating session to active state...');
  await database.execute(`
    UPDATE session 
    SET session_state = 'active', 
        sealed_at = NULL,
        updated_at = ?1
    WHERE id = 1
  `, [Date.now()]);
  
  console.log('✅ [SQLITE] Session activated successfully for user:', userId);
  return true;
}

export async function getDeviceRow(): Promise<DeviceRow | null> {
  const database = await openDb();
  
  const result = await database.select<DeviceRow[]>(
    "SELECT * FROM device WHERE id = 1"
  );
  
  return result.length > 0 ? result[0] : null;
}

export async function upsertDeviceRow(deviceId: string): Promise<void> {
  const database = await openDb();
  
  await database.execute(
    `INSERT OR REPLACE INTO device (id, device_id) VALUES (1, ?)`,
    [deviceId]
  );
}

// KV operations for future encrypted secrets
export async function setKV(key: string, value: Uint8Array): Promise<void> {
  const database = await openDb();
  
  await database.execute(
    "INSERT OR REPLACE INTO kv (k, v) VALUES (?, ?)",
    [key, value]
  );
}

export async function getKV(key: string): Promise<Uint8Array | null> {
  const database = await openDb();
  
  const result = await database.select<{ v: Uint8Array }[]>(
    "SELECT v FROM kv WHERE k = ?",
    [key]
  );
  
  return result.length > 0 ? result[0].v : null;
}

export async function deleteKV(key: string): Promise<void> {
  const database = await openDb();
  
  await database.execute("DELETE FROM kv WHERE k = ?", [key]);
}

// Close database connection
export async function closeDb(): Promise<void> {
  if (db) {
    await db.close();
    db = null;
  }
}

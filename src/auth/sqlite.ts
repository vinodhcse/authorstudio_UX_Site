// SQLite database operations for Tauri authentication
import Database from "@tauri-apps/plugin-sql";

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
      updated_at INTEGER
    )
  `);
  
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
  const database = await openDb();
  
  const result = await database.select<SessionRow[]>(
    "SELECT * FROM session WHERE id = 1"
  );
  
  return result.length > 0 ? result[0] : null;
}

export async function upsertSessionRow(data: Partial<SessionRow>): Promise<void> {
  const database = await openDb();
  
  // Check if row exists
  const existing = await getSessionRow();
  
  if (existing) {
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
      await database.execute(
        `UPDATE session SET ${updateFields.join(', ')} WHERE id = 1`,
        values
      );
    }
  } else {
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
  const database = await openDb();
  
  // Clear session data
  await database.execute("DELETE FROM session WHERE id = 1");
  
  // Clear all KV secrets
  await database.execute("DELETE FROM kv");
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

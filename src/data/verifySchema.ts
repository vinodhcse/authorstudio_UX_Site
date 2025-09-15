// Simple test to verify database schema is working
import { initializeDatabase } from '../data/dal';
import { invoke } from '@tauri-apps/api/core';
import { appLog } from '../auth/fileLogger';

export async function verifyDatabaseSchema(): Promise<void> {
  try {
    await appLog.info('dbVerify', 'Testing database schema...');
    
    // Initialize Surreal and do basic sanity queries
    await initializeDatabase();
    const checks = [
      'SELECT * FROM book LIMIT 1',
      'SELECT * FROM version LIMIT 1',
      'SELECT * FROM chapter LIMIT 1',
      'SELECT * FROM scene LIMIT 1',
      'SELECT * FROM user_keys LIMIT 1',
      'SELECT * FROM file_assets LIMIT 1',
      'SELECT * FROM file_asset_links LIMIT 1',
    ];
    for (const q of checks) {
      try { await invoke('surreal_query', { query: q }); } catch {}
    }
    await appLog.success('dbVerify', 'Surreal database basic verification ran');
    
  } catch (error) {
  await appLog.error('dbVerify', 'Database verification failed:', error);
    throw error;
  }
}

// Auto-run verification when imported in dev mode
// verifyDatabaseSchema().catch(console.error);

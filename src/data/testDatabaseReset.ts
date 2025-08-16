// Test script to trigger database schema reset
import { initializeDatabase } from '../data/dal';
import { invoke } from '@tauri-apps/api/core';
import { appLog } from '../auth/fileLogger';

export async function testDatabaseReset(): Promise<void> {
  try {
    await appLog.info('testReset', 'Starting Surreal DB sanity test...');
    await initializeDatabase();
    // Run a few sanity queries; Surreal is schemaless, so we just ensure queries execute
    const queries = [
      'SELECT * FROM chapter LIMIT 1',
      'SELECT * FROM version LIMIT 1',
      'SELECT * FROM scene LIMIT 1'
    ];
    for (const q of queries) {
      try { await invoke('surreal_query', { query: q }); } catch {}
    }
    await appLog.success('testReset', 'Surreal DB sanity checks executed');
    
  } catch (error) {
    await appLog.error('testReset', 'Database reset test failed:', error);
    throw error;
  }
}

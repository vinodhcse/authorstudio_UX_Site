import { initializeDatabase, VersionRow, putVersion, getVersion, putBook, BookRow } from './dal';
import { invoke } from '@tauri-apps/api/core';
import { appLog } from '../auth/fileLogger';

// Test function to verify database write operations
export async function testDatabaseWrite(): Promise<void> {
  try {
    appLog.info('test', 'Starting database write test...');
    
    const testVersionId = `test_${Date.now()}`;
    const testBookId = 'test_book_123';
    const testUserId = 'test_user_456';
    
    // First, create a test book to satisfy foreign key constraint
    const testBook: BookRow = {
      book_id: testBookId,
      owner_user_id: testUserId,
      title: 'Test Book',
      is_shared: 0,
      enc_schema: 'udek',
      rev_local: undefined,
      rev_cloud: undefined,
      sync_state: 'dirty',
      conflict_state: 'none',
      last_local_change: undefined,
      last_cloud_change: undefined,
      updated_at: Date.now()
    } as unknown as BookRow;
    
    appLog.info('test', 'Creating test book first to satisfy foreign key...');
    await putBook(testBook);
    appLog.info('test', 'Test book created successfully');
    
    // Create test version data
    const testVersion: VersionRow = {
      version_id: testVersionId,
      book_id: testBookId,
      owner_user_id: testUserId,
      title: 'Test Version',
      description: 'Test version for debugging',
      is_current: 1,
      enc_scheme: 'udek',
      has_proposals: 0,
      pending_ops: 0,
      sync_state: 'dirty',
      conflict_state: 'none',
      created_at: Date.now(),
      updated_at: Date.now()
    };
    
    appLog.info('test', 'Test version data created', { testVersion });
    
    // Try to save the version
    appLog.info('test', 'Attempting to save test version...');
    await putVersion(testVersion);
    appLog.info('test', 'putVersion completed without error');
    
    // Try to retrieve the version immediately
    appLog.info('test', 'Attempting to retrieve test version...');
    const retrievedVersion = await getVersion(testVersionId, testUserId);
    
    if (retrievedVersion) {
      appLog.success('test', 'SUCCESS: Test version was saved and retrieved', { 
        savedData: retrievedVersion 
      });
    } else {
      appLog.error('test', 'FAILURE: Test version was not found in database after save', {
        testVersionId,
        testUserId
      });
    }
    
    // Also try a direct database query
  await initializeDatabase();
  const directQuery = await invoke<any[]>('surreal_query', { query: 'SELECT * FROM version WHERE version_id = $vid', vars: { vid: testVersionId } });
    
    appLog.info('test', 'Direct database query result', { 
      directQueryResults: directQuery,
      foundRecords: directQuery.length
    });
    
  } catch (error) {
    appLog.error('test', 'Database write test failed with error', { 
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    });
  }
}

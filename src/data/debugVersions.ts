// Debug helper to check version existence
import { initializeDatabase } from './dal';
import { invoke } from '@tauri-apps/api/core';
import { appLog } from '../auth/fileLogger';

export async function debugVersions(bookId?: string, versionId?: string, userId?: string): Promise<void> {
  try {
  await initializeDatabase();
  // Check all versions in database
  const allVersions = await invoke<any[]>('surreal_query', { query: 'SELECT * FROM version ORDER BY created_at DESC' });
    await appLog.info('debugVersions', 'All versions in database:', { 
      count: allVersions.length,
      versions: allVersions 
    });
    
    // Check if specific version exists
    if (versionId) {
  const specificVersion = await invoke<any[]>('surreal_query', { query: 'SELECT * FROM version WHERE version_id = $vid', vars: { vid: versionId } });
      await appLog.info('debugVersions', 'Specific version check:', { 
        versionId,
        exists: specificVersion.length > 0,
        version: specificVersion[0] || null
      });
    }
    
    // Check versions for specific book and user
    if (bookId && userId) {
  const bookVersions = await invoke<any[]>('surreal_query', { query: 'SELECT * FROM version WHERE book_id = $bid AND owner_user_id = $uid', vars: { bid: bookId, uid: userId } });
      await appLog.info('debugVersions', 'Book versions for user:', { 
        bookId,
        userId,
        count: bookVersions.length,
        versions: bookVersions
      });
    } else if (bookId) {
  const bookVersions = await invoke<any[]>('surreal_query', { query: 'SELECT * FROM version WHERE book_id = $bid', vars: { bid: bookId } });
      await appLog.info('debugVersions', 'Book versions (all users):', { 
        bookId,
        count: bookVersions.length,
        versions: bookVersions
      });
    }
    
    // Check if book exists
    if (bookId) {
  const book = await invoke<any[]>('surreal_query', { query: 'SELECT * FROM book WHERE book_id = $bid', vars: { bid: bookId } });
      await appLog.info('debugVersions', 'Book check:', { 
        bookId,
        exists: book.length > 0,
        book: book[0] || null
      });
    }
    
    // Check all tables exist
  await appLog.info('debugVersions', 'Surreal DB sanity check completed');
    
  } catch (error) {
    await appLog.error('debugVersions', 'Debug failed:', error);
  }
}

// Helper to create a default version for a book if none exists
export async function ensureBookVersion(bookId: string, userId: string): Promise<string> {
  try {
  await initializeDatabase();
    
    // Check if book has any versions
  const existingVersions = await invoke<any[]>('surreal_query', { query: 'SELECT * FROM version WHERE book_id = $bid AND owner_user_id = $uid', vars: { bid: bookId, uid: userId } });
    
    if (existingVersions.length > 0) {
      await appLog.info('ensureBookVersion', 'Version already exists:', { 
        bookId, 
        versionId: existingVersions[0].version_id 
      });
      return existingVersions[0].version_id;
    }
    
    // Create default version
    const versionId = `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const now = Date.now();
    await invoke('version_put', { row: {
      version_id: versionId,
      book_id: bookId,
      owner_user_id: userId,
      title: 'Main',
      description: 'Default version',
      is_current: 1,
      enc_scheme: 'udek',
      has_proposals: 0,
      pending_ops: 0,
      sync_state: 'dirty',
      conflict_state: 'none',
      created_at: now,
      updated_at: now
    } });
    
    await appLog.success('ensureBookVersion', 'Created default version:', { 
      bookId, 
      versionId 
    });
    
    return versionId;
    
  } catch (error) {
    await appLog.error('ensureBookVersion', 'Failed to ensure version:', error);
    throw error;
  }
}

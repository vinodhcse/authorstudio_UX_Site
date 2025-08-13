// Debug helper to check version existence
import { initializeDatabase } from './dal';
import { appLog } from '../auth/fileLogger';

export async function debugVersions(bookId?: string, versionId?: string, userId?: string): Promise<void> {
  try {
    const db = await initializeDatabase();
    
    // Check all versions in database
    const allVersions = await db.select<any[]>('SELECT * FROM versions ORDER BY created_at DESC');
    await appLog.info('debugVersions', 'All versions in database:', { 
      count: allVersions.length,
      versions: allVersions 
    });
    
    // Check if specific version exists
    if (versionId) {
      const specificVersion = await db.select<any[]>(
        'SELECT * FROM versions WHERE version_id = ?', 
        [versionId]
      );
      await appLog.info('debugVersions', 'Specific version check:', { 
        versionId,
        exists: specificVersion.length > 0,
        version: specificVersion[0] || null
      });
    }
    
    // Check versions for specific book and user
    if (bookId && userId) {
      const bookVersions = await db.select<any[]>(
        'SELECT * FROM versions WHERE book_id = ? AND owner_user_id = ?', 
        [bookId, userId]
      );
      await appLog.info('debugVersions', 'Book versions for user:', { 
        bookId,
        userId,
        count: bookVersions.length,
        versions: bookVersions
      });
    } else if (bookId) {
      const bookVersions = await db.select<any[]>(
        'SELECT * FROM versions WHERE book_id = ?', 
        [bookId]
      );
      await appLog.info('debugVersions', 'Book versions (all users):', { 
        bookId,
        count: bookVersions.length,
        versions: bookVersions
      });
    }
    
    // Check if book exists
    if (bookId) {
      const book = await db.select<any[]>(
        'SELECT * FROM books WHERE book_id = ?', 
        [bookId]
      );
      await appLog.info('debugVersions', 'Book check:', { 
        bookId,
        exists: book.length > 0,
        book: book[0] || null
      });
    }
    
    // Check all tables exist
    const tables = await db.select<any[]>(
      "SELECT name FROM sqlite_master WHERE type='table' ORDER BY name"
    );
    await appLog.info('debugVersions', 'Database tables:', { 
      tables: tables.map(t => t.name)
    });
    
  } catch (error) {
    await appLog.error('debugVersions', 'Debug failed:', error);
  }
}

// Helper to create a default version for a book if none exists
export async function ensureBookVersion(bookId: string, userId: string): Promise<string> {
  try {
    const db = await initializeDatabase();
    
    // Check if book has any versions
    const existingVersions = await db.select<any[]>(
      'SELECT * FROM versions WHERE book_id = ? AND owner_user_id = ?', 
      [bookId, userId]
    );
    
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
    
    await db.execute(`
      INSERT INTO versions (
        version_id, book_id, owner_user_id, title, description, 
        is_current, enc_scheme, has_proposals, pending_ops, 
        sync_state, conflict_state, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      versionId, bookId, userId, 'Main', 'Default version',
      1, 'udek', 0, 0, 'dirty', 'none', now, now
    ]);
    
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

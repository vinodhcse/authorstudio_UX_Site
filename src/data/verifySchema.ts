// Simple test to verify database schema is working
import { initializeDatabase } from '../data/dal';
import { runMigrations } from '../data/migrations';
import { appLog } from '../auth/fileLogger';

export async function verifyDatabaseSchema(): Promise<void> {
  try {
    await appLog.info('dbVerify', 'Testing database schema...');
    
    // Initialize database and run migrations
    const db = await initializeDatabase();
    await runMigrations(db);
    
    // Check that all required tables exist
    const tables = await db.select<any[]>(
      "SELECT name FROM sqlite_master WHERE type='table' ORDER BY name"
    );
    const tableNames = tables.map(t => t.name);
    
    const requiredTables = [
      'session',
      'user_keys', 
      'books',
      'versions',
      'chapters',
      'scenes',
      'grants',
      'file_assets',
      'file_asset_links'
    ];
    
    const missingTables = requiredTables.filter(table => !tableNames.includes(table));
    
    if (missingTables.length > 0) {
      await appLog.error('dbVerify', 'Missing tables:', { missingTables });
      return;
    }
    
    // Verify chapters table has all required columns
    const chaptersSchema = await db.select<any[]>('PRAGMA table_info(chapters)');
    const chapterColumns = chaptersSchema.map(col => col.name);
    
    const requiredChapterColumns = [
      'chapter_id', 'book_id', 'version_id', 'owner_user_id', 'title',
      'order_index', 'word_count', 'character_count', 'created_at', 'updated_at'
    ];
    
    const missingColumns = requiredChapterColumns.filter(col => !chapterColumns.includes(col));
    
    if (missingColumns.length > 0) {
      await appLog.error('dbVerify', 'Chapters table missing columns:', { missingColumns });
      return;
    }
    
    // Check foreign key constraints
    const foreignKeys = await db.select<any[]>('PRAGMA foreign_key_list(chapters)');
    const hasVersionFK = foreignKeys.some(fk => fk.table === 'versions' && fk.from === 'version_id');
    const hasBookFK = foreignKeys.some(fk => fk.table === 'books' && fk.from === 'book_id');
    
    if (!hasVersionFK || !hasBookFK) {
      await appLog.error('dbVerify', 'Chapters table missing foreign keys:', { hasVersionFK, hasBookFK });
      return;
    }
    
    await appLog.success('dbVerify', 'Database schema verification successful!', {
      tables: tableNames,
      chapterColumns,
      foreignKeyCount: foreignKeys.length
    });
    
  } catch (error) {
    await appLog.error('dbVerify', 'Database schema verification failed:', error);
    throw error;
  }
}

// Auto-run verification when imported in dev mode
// verifyDatabaseSchema().catch(console.error);

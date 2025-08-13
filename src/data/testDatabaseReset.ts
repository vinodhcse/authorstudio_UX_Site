// Test script to trigger database schema reset
import { initializeDatabase } from '../data/dal';
import { runMigrations } from '../data/migrations';
import { appLog } from '../auth/fileLogger';

export async function testDatabaseReset(): Promise<void> {
  try {
    await appLog.info('testReset', 'Starting database reset test...');
    
    // Initialize database and run migrations (which includes our reset)
    const db = await initializeDatabase();
    await runMigrations(db);
    
    // Test the schema by checking table info
    const chaptersSchema = await db.select<any[]>('PRAGMA table_info(chapters)');
    const versionsSchema = await db.select<any[]>('PRAGMA table_info(versions)');
    const scenesSchema = await db.select<any[]>('PRAGMA table_info(scenes)');
    
    await appLog.info('testReset', 'Chapters table schema:', {
      columns: chaptersSchema.map(col => ({ name: col.name, type: col.type, notnull: col.notnull }))
    });
    
    await appLog.info('testReset', 'Versions table schema:', {
      columns: versionsSchema.map(col => ({ name: col.name, type: col.type, notnull: col.notnull }))
    });
    
    await appLog.info('testReset', 'Scenes table schema:', {
      columns: scenesSchema.map(col => ({ name: col.name, type: col.type, notnull: col.notnull }))
    });
    
    // Verify the word_count column exists
    const hasWordCount = chaptersSchema.some(col => col.name === 'word_count');
    const hasCharacterCount = chaptersSchema.some(col => col.name === 'character_count');
    const hasCreatedAt = chaptersSchema.some(col => col.name === 'created_at');
    
    if (hasWordCount && hasCharacterCount && hasCreatedAt) {
      await appLog.success('testReset', 'Database schema reset successful! All required columns present.');
    } else {
      await appLog.error('testReset', 'Database schema reset failed! Missing columns:', {
        hasWordCount,
        hasCharacterCount,
        hasCreatedAt
      });
    }
    
  } catch (error) {
    await appLog.error('testReset', 'Database reset test failed:', error);
    throw error;
  }
}

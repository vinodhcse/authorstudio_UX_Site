// Diagnostic functions for debugging database state
import { initializeDatabase } from './dal';
import { appLog } from '../auth/fileLogger';

export async function diagnoseDatabaseState() {
  try {
    const database = await initializeDatabase();
    
    // Check versions table
    const versions = await database.select('SELECT version_id, book_id, title, content_data FROM versions ORDER BY created_at DESC LIMIT 5');
    console.log('📊 Recent versions:', versions);
    
    // Check chapters table 
    const chapters = await database.select('SELECT chapter_id, book_id, version_id, title, order_index, created_at FROM chapters ORDER BY created_at DESC LIMIT 10');
    console.log('📖 Recent chapters:', chapters);
    
    // Check plot canvas data
    for (const version of versions as any[]) {
      if (version.content_data) {
        try {
          const contentData = JSON.parse(version.content_data);
          console.log(`🎨 Version ${version.version_id} content data:`, {
            hasPlotCanvas: !!contentData.plotCanvas,
            hasCharacters: !!contentData.characters,
            hasWorlds: !!contentData.worlds,
            plotCanvasNodes: contentData.plotCanvas?.nodes?.length || 0,
            charactersCount: contentData.characters?.length || 0,
            worldsCount: contentData.worlds?.length || 0
          });
        } catch (error) {
          console.log(`❌ Failed to parse content data for version ${version.version_id}:`, error);
        }
      }
    }
    
    await appLog.info('diagnostics', 'Database state diagnosed', { 
      versionsCount: (versions as any[]).length, 
      chaptersCount: (chapters as any[]).length 
    });
    
    return { versions, chapters };
    
  } catch (error) {
    console.error('❌ Database diagnostics failed:', error);
    await appLog.error('diagnostics', 'Database diagnostics failed', error);
    throw error;
  }
}

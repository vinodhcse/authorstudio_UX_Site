// Diagnostic functions for debugging database state
import { initializeDatabase } from './dal';
import { invoke } from '@tauri-apps/api/core';
import { appLog } from '../auth/fileLogger';

export async function diagnoseDatabaseState() {
  try {
  await initializeDatabase();
  // Check versions table
  const versions = await invoke<any[]>('surreal_query', { query: 'SELECT version_id, book_id, title, content_data FROM version ORDER BY created_at DESC LIMIT 5' });
  console.log('📊 Recent versions:', versions);
  // Check chapters table
  const chapters = await invoke<any[]>('surreal_query', { query: 'SELECT chapter_id, book_id, version_id, title, order_index, created_at FROM chapter ORDER BY created_at DESC LIMIT 10' });
  console.log('📖 Recent chapters:', chapters);
    
    // Check plot canvas data
    for (const version of versions as any[]) {
    if ((version as any).content_data) {
        try {
      const contentData = JSON.parse((version as any).content_data);
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

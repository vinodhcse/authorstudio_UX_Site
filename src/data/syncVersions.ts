// Helper to sync existing UI versions to local database
import { putVersion, VersionRow, getVersionsByBook } from '../data/dal';
import { useAuthStore } from '../auth/useAuthStore';
import { appLog } from '../auth/fileLogger';
import { Version } from '../types';

export async function syncVersionsToDatabase(bookId: string, uiVersions: Version[]): Promise<void> {
  try {
    const authState = useAuthStore.getState();
    if (!authState.user?.id) {
      throw new Error('User not authenticated');
    }

    if (!uiVersions || uiVersions.length === 0) {
      await appLog.info('syncVersions', 'No versions to sync', { bookId });
      return;
    }

    // Get existing versions from database
    const existingVersions = await getVersionsByBook(bookId, authState.user.id);
    const existingVersionIds = new Set(existingVersions.map(v => v.version_id));

    // Sync any missing versions from UI to database
    for (const version of uiVersions) {
      if (!existingVersionIds.has(version.id)) {
        const versionRow: VersionRow = {
          version_id: version.id,
          book_id: bookId,
          owner_user_id: authState.user.id,
          title: version.name,
          description: `Synced version: ${version.name}`,
          is_current: version.status === 'FINAL' ? 1 : 0, // Final versions are considered current
          enc_scheme: 'udek',
          has_proposals: 0,
          pending_ops: 0,
          sync_state: 'dirty',
          conflict_state: 'none',
          created_at: new Date(version.createdAt).getTime(),
          updated_at: Date.now()
        };
        
        await putVersion(versionRow);
        await appLog.info('syncVersions', 'Synced version to database', { 
          bookId, 
          versionId: version.id,
          title: version.name 
        });
      }
    }

    await appLog.success('syncVersions', 'All versions synced to database', { 
      bookId, 
      totalVersions: uiVersions.length,
      existingInDB: existingVersions.length 
    });

  } catch (error) {
    await appLog.error('syncVersions', 'Failed to sync versions to database', { bookId, error });
    throw error;
  }
}

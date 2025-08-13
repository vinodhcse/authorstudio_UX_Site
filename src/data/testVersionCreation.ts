// Quick test to verify version creation
import { debugVersions } from '../data/debugVersions';
import { ensureDefaultVersion } from '../data/dal';
import { appLog } from '../auth/fileLogger';

export async function testVersionCreation(): Promise<void> {
  try {
    // Test data
    const testBookId = 'test_book_123';
    const testUserId = 'test_user_456';
    
    await appLog.info('testVersion', 'Starting version creation test...');
    
    // Debug current state
    await debugVersions(testBookId, undefined, testUserId);
    
    // Try to ensure a version exists
    const versionId = await ensureDefaultVersion(testBookId, testUserId);
    
    await appLog.success('testVersion', 'Version creation test completed', { 
      bookId: testBookId,
      userId: testUserId,
      versionId 
    });
    
    // Debug after creation
    await debugVersions(testBookId, versionId, testUserId);
    
  } catch (error) {
    await appLog.error('testVersion', 'Version creation test failed:', error);
  }
}

// Run test (uncomment to execute)
// testVersionCreation().catch(console.error);

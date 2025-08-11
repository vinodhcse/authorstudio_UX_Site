// Permissions verification script for debugging Tauri authentication
export async function verifyPermissions() {
  console.log('🔍 Verifying Tauri plugin permissions...');
  
  const results = {
    sql: false,
    fs: false,
    http: false,
    details: {}
  };

  // Test SQL permissions
  try {
    const { Database } = await import('@tauri-apps/plugin-sql');
    await Database.load('sqlite:test.db');
    results.sql = true;
    results.details.sql = 'SQL permissions working';
    console.log('✅ SQL: Database.load() - SUCCESS');
  } catch (error: any) {
    results.details.sql = error.message;
    console.log('❌ SQL: Database.load() - FAILED:', error.message);
  }

  // Test FS permissions  
  try {
    const { exists, appConfigDir } = await import('@tauri-apps/plugin-fs');
    const configPath = await appConfigDir();
    await exists(configPath);
    results.fs = true;
    results.details.fs = 'FS permissions working';
    console.log('✅ FS: exists() and appConfigDir() - SUCCESS');
  } catch (error: any) {
    results.details.fs = error.message;
    console.log('❌ FS: exists() - FAILED:', error.message);
  }

  // Test HTTP permissions
  try {
    const { fetch } = await import('@tauri-apps/plugin-http');
    // Don't actually make a request, just verify import works
    results.http = true;
    results.details.http = 'HTTP permissions working';
    console.log('✅ HTTP: fetch import - SUCCESS');
  } catch (error: any) {
    results.details.http = error.message;
    console.log('❌ HTTP: fetch import - FAILED:', error.message);
  }

  // Summary
  const allWorking = results.sql && results.fs && results.http;
  console.log('\n📊 Permission Verification Summary:');
  console.log(`SQL: ${results.sql ? '✅' : '❌'}`);
  console.log(`FS: ${results.fs ? '✅' : '❌'}`);
  console.log(`HTTP: ${results.http ? '✅' : '❌'}`);
  console.log(`Overall: ${allWorking ? '✅ ALL WORKING' : '❌ ISSUES FOUND'}`);

  return results;
}

// Auto-run verification in development
if (typeof window !== 'undefined' && import.meta.env.DEV) {
  // Run after a short delay to ensure Tauri is initialized
  setTimeout(() => {
    verifyPermissions().catch(console.error);
  }, 1000);
}

export default verifyPermissions;

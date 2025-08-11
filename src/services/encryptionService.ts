// Encryption service for managing UDEK, BSK, and content encryption
import { appLog } from '../auth/fileLogger';
import { 
  deriveAppKey, 
  generateUDEK, 
  hkdfBookKey, 
  importAESKey, 
  generateSalt, 
  wrapUDEKWithAppKey, 
  unwrapUDEKWithAppKey 
} from '../crypto/keys';
import { 
  encryptSceneContent, 
  decryptSceneContent,
  uint8ArrayToBase64,
  base64ToUint8Array 
} from '../crypto/aes';
import { 
  getUserKeys, 
  setUserKeys, 
  getScene, 
  putScene, 
  computeRevisionHash,
  SceneRow 
} from '../data/dal';

export class EncryptionService {
  private appKey: CryptoKey | null = null;
  private udek: Uint8Array | null = null;
  private bskCache: Map<string, Uint8Array> = new Map();

  /**
   * Initialize encryption service with user passphrase
   */
  async initialize(userId: string, passphrase: string): Promise<void> {
    try {
      appLog.info('encryption', 'Initializing encryption service', { userId });

      // Get or create user keys
      let userKeys = await getUserKeys(userId);
      
      if (!userKeys) {
        // First time setup - generate new keys
        appLog.info('encryption', 'First time setup - generating new keys');
        
        const salt = generateSalt();
        const iterations = 100000;
        this.appKey = await deriveAppKey(passphrase, salt, iterations);
        
        this.udek = generateUDEK();
        const { wrapped, iv } = await wrapUDEKWithAppKey(this.udek, this.appKey);
        
        // Combine IV and wrapped data for storage
        const combinedData = new Uint8Array(iv.length + wrapped.length);
        combinedData.set(iv, 0);
        combinedData.set(wrapped, iv.length);
        
        // Store encrypted UDEK
        await setUserKeys({
          user_id: userId,
          udek_wrap_appkey: combinedData,
          kdf_salt: salt,
          kdf_iters: iterations,
          updated_at: Date.now()
        });
        
        appLog.success('encryption', 'New encryption keys generated and stored');
      } else {
        // Existing user - decrypt UDEK
        appLog.info('encryption', 'Existing user - decrypting UDEK');
        
        this.appKey = await deriveAppKey(passphrase, userKeys.kdf_salt, userKeys.kdf_iters);
        
        // Convert wrapped data from storage format to Uint8Array
        let wrappedData: Uint8Array;
        const rawWrappedData = userKeys.udek_wrap_appkey as any; // SQLite may return as string
        
        if (typeof rawWrappedData === 'string') {
          // Handle JSON string format from SQLite
          if (rawWrappedData.startsWith('[') && rawWrappedData.endsWith(']')) {
            try {
              const arrayData = JSON.parse(rawWrappedData);
              wrappedData = new Uint8Array(arrayData);
            } catch (e) {
              throw new Error('Failed to parse wrapped UDEK data');
            }
          } else {
            throw new Error('Invalid wrapped UDEK data format');
          }
        } else if (rawWrappedData instanceof Uint8Array) {
          wrappedData = rawWrappedData;
        } else if (Array.isArray(rawWrappedData)) {
          wrappedData = new Uint8Array(rawWrappedData);
        } else {
          throw new Error('Unsupported wrapped UDEK data type');
        }
        
        // Extract IV (first 12 bytes) and wrapped UDEK (rest)
        const iv = wrappedData.slice(0, 12);
        const wrapped = wrappedData.slice(12);
        
        this.udek = await unwrapUDEKWithAppKey(wrapped, iv, this.appKey);
        
        appLog.success('encryption', 'UDEK successfully decrypted');
      }
    } catch (error) {
      appLog.error('encryption', 'Failed to initialize encryption service', error);
      throw error;
    }
  }

  /**
   * Get encryption key for a book (UDEK for private, BSK for shared)
   */
  async getBookKey(userId: string, bookId: string, isShared: boolean): Promise<CryptoKey> {
    if (!this.udek) {
      throw new Error('Encryption service not initialized');
    }

    if (!isShared) {
      // Private book - use UDEK
      return await importAESKey(this.udek);
    } else {
      // Shared book - derive BSK
      let bsk = this.bskCache.get(bookId);
      if (!bsk) {
        bsk = await hkdfBookKey(this.udek, userId, bookId);
        this.bskCache.set(bookId, bsk);
      }
      return await importAESKey(bsk);
    }
  }

  /**
   * Load and decrypt scene content
   */
  async loadSceneContent(sceneId: string, userId: string): Promise<any> {
    try {
      appLog.debug('encryption', 'Loading scene content', { sceneId });
      
      const sceneRow = await getScene(sceneId, userId);
      if (!sceneRow) {
        throw new Error(`Scene not found: ${sceneId}`);
      }

      // Determine encryption scheme and get appropriate key
      const isShared = sceneRow.enc_scheme === 'bsk';
      const key = await this.getBookKey(userId, sceneRow.book_id, isShared);

      // Convert binary data to base64 for decryption
      const contentEnc = uint8ArrayToBase64(sceneRow.content_enc);
      const contentIv = uint8ArrayToBase64(sceneRow.content_iv);

      const content = await decryptSceneContent(contentEnc, contentIv, key);
      
      appLog.debug('encryption', 'Scene content decrypted successfully', { sceneId });
      return content;
    } catch (error) {
      appLog.error('encryption', 'Failed to load scene content', { sceneId, error });
      throw error;
    }
  }

  /**
   * Encrypt and save scene content
   */
  async saveSceneContent(
    sceneId: string, 
    bookId: string, 
    versionId: string, 
    chapterId: string, 
    userId: string, 
    content: any,
    isShared: boolean = false
  ): Promise<void> {
    try {
      appLog.debug('encryption', 'Saving scene content', { sceneId });

      // Get encryption key
      const key = await this.getBookKey(userId, bookId, isShared);

      // Encrypt content
      const { contentEnc, contentIv } = await encryptSceneContent(content, key);

      // Convert base64 to binary for storage
      const contentEncBinary = base64ToUint8Array(contentEnc);
      const contentIvBinary = base64ToUint8Array(contentIv);

      // Compute revision hash
      const revLocal = await computeRevisionHash({
        content,
        sceneId,
        timestamp: Date.now()
      });

      // Calculate word count (rough estimate)
      const contentText = JSON.stringify(content);
      const wordCount = contentText.split(/\s+/).length;

      // Create scene row
      const sceneRow: SceneRow = {
        scene_id: sceneId,
        book_id: bookId,
        version_id: versionId,
        chapter_id: chapterId,
        owner_user_id: userId,
        enc_scheme: isShared ? 'bsk' : 'udek',
        content_enc: contentEncBinary,
        content_iv: contentIvBinary,
        has_proposals: 0,
        rev_local: revLocal,
        rev_cloud: undefined,
        pending_ops: 0,
        sync_state: 'dirty',
        conflict_state: 'none',
        word_count: wordCount,
        title: content.title || 'Untitled Scene',
        updated_at: Date.now()
      };

      await putScene(sceneRow);
      
      appLog.success('encryption', 'Scene content encrypted and saved', { sceneId, wordCount });
    } catch (error) {
      appLog.error('encryption', 'Failed to save scene content', { sceneId, error });
      throw error;
    }
  }

  /**
   * Clear sensitive data from memory
   */
  clear(): void {
    this.appKey = null;
    this.udek = null;
    this.bskCache.clear();
    appLog.info('encryption', 'Encryption service cleared');
  }

  /**
   * Check if service is initialized
   */
  isInitialized(): boolean {
    return this.appKey !== null && this.udek !== null;
  }
}

// Singleton instance
export const encryptionService = new EncryptionService();

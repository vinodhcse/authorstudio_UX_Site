// Encryption service with chapter support
import { appLog } from '../auth/fileLogger';
import { 
  deriveUDEK,
  generateAppKey,
  wrapUDEK,
  unwrapUDEK,
  generateBookKey,
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
  getChapter,
  putChapter,
  computeRevisionHash,
  SceneRow,
  ChapterRow 
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

      // Check if we already have user keys
      let userKeys = await getUserKeys(userId);
      
      if (!userKeys) {
        // First time setup - generate new keys
        appLog.info('encryption', 'First time setup - generating new encryption keys');
        
        // Generate app key and UDEK
        this.appKey = await generateAppKey();
        this.udek = await deriveUDEK(passphrase, new Uint8Array(32)); // Generate salt
        
        // Wrap UDEK with app key and store
        const { wrappedUDEK, salt, iterations } = await wrapUDEK(this.udek, this.appKey);
        
        await setUserKeys(userId, {
          udekWrapAppkey: wrappedUDEK,
          kdfSalt: salt,
          kdfIters: iterations
        });
        
        appLog.success('encryption', 'New encryption keys generated and stored');
      } else {
        // Load existing keys
        appLog.info('encryption', 'Loading existing encryption keys');
        
  // Handle potential JSON string format if present
  const rawWrappedData = userKeys.udek_wrap_appkey as any;
        let wrappedUDEK: Uint8Array;
        
        if (typeof rawWrappedData === 'string') {
          // Handle JSON string format if present
          wrappedUDEK = new Uint8Array(JSON.parse(rawWrappedData));
        } else {
          wrappedUDEK = new Uint8Array(rawWrappedData);
        }
        
        // Derive UDEK from passphrase
        this.udek = await deriveUDEK(passphrase, userKeys.kdf_salt);
        
        // Unwrap app key using UDEK
        this.appKey = await unwrapUDEK(wrappedUDEK, this.udek);
        
        appLog.success('encryption', 'Existing encryption keys loaded successfully');
      }
    } catch (error) {
      appLog.error('encryption', 'Failed to initialize encryption service', { userId, error });
      throw error;
    }
  }

  /**
   * Get book-specific encryption key
   */
  async getBookKey(userId: string, bookId: string, isShared: boolean = false): Promise<Uint8Array> {
    if (!this.udek) {
      throw new Error('Encryption service not initialized');
    }

    const cacheKey = `${userId}_${bookId}_${isShared}`;
    
    // Check cache first
    if (this.bskCache.has(cacheKey)) {
      return this.bskCache.get(cacheKey)!;
    }

    let bookKey: Uint8Array;
    
    if (isShared) {
      // For shared books, we need to implement BSK (Book Shared Key) logic
      // For now, derive from UDEK + bookId
      bookKey = await generateBookKey(this.udek, bookId);
    } else {
      // For private books, derive from UDEK + bookId
      bookKey = await generateBookKey(this.udek, bookId);
    }

    // Cache the key
    this.bskCache.set(cacheKey, bookKey);
    
    return bookKey;
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
   * Load and decrypt chapter content
   */
  async loadChapterContent(chapterId: string, userId: string): Promise<any> {
    try {
      appLog.debug('encryption', 'Loading chapter content', { chapterId });
      
      const chapterRow = await getChapter(chapterId, userId);
      if (!chapterRow) {
        throw new Error(`Chapter not found: ${chapterId}`);
      }

      // If no content stored yet, return null
      if (!chapterRow.content_enc || !chapterRow.content_iv) {
        appLog.debug('encryption', 'No encrypted content found for chapter', { chapterId });
        return null;
      }

      // Determine encryption scheme and get appropriate key
      const isShared = chapterRow.enc_scheme === 'bsk';
      const key = await this.getBookKey(userId, chapterRow.book_id, isShared);

      // Convert binary data to base64 for decryption
      const contentEnc = uint8ArrayToBase64(chapterRow.content_enc);
      const contentIv = uint8ArrayToBase64(chapterRow.content_iv);

      const content = await decryptSceneContent(contentEnc, contentIv, key);
      
      appLog.debug('encryption', 'Chapter content decrypted successfully', { chapterId });
      return content;
    } catch (error) {
      appLog.error('encryption', 'Failed to load chapter content', { chapterId, error });
      throw error;
    }
  }

  /**
   * Encrypt and save chapter content
   */
  async saveChapterContent(
    chapterId: string, 
    bookId: string, 
    versionId: string, 
    userId: string, 
    content: any,
    isShared: boolean = false
  ): Promise<void> {
    try {
      appLog.debug('encryption', 'Saving chapter content', { chapterId });

      // Get encryption key
      const key = await this.getBookKey(userId, bookId, isShared);

      // Encrypt content - reuse scene encryption functions
      const { contentEnc, contentIv } = await encryptSceneContent(content, key);

      // Convert base64 to binary for storage
      const contentEncBinary = base64ToUint8Array(contentEnc);
      const contentIvBinary = base64ToUint8Array(contentIv);

      // Compute revision hash
      const revLocal = await computeRevisionHash({
        content,
        chapterId,
        timestamp: Date.now()
      });

      // Calculate word count (rough estimate)
      const contentText = JSON.stringify(content);
      const wordCount = contentText.split(/\s+/).length;

      // Create chapter row
      const chapterRow: ChapterRow = {
        chapter_id: chapterId,
        book_id: bookId,
        version_id: versionId,
        owner_user_id: userId,
        title: content.title || 'Untitled Chapter',
        order_index: 0, // Will be updated by useChapters
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
        updated_at: Date.now()
      };

      await putChapter(chapterRow);
      
      appLog.success('encryption', 'Chapter content encrypted and saved', { chapterId, wordCount });
    } catch (error) {
      appLog.error('encryption', 'Failed to save chapter content', { chapterId, error });
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

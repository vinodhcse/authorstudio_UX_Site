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
  getChapter,
  putChapter,
  computeRevisionHash,
  SceneRow,
  
} from '../data/dal';export class EncryptionService {
  private appKey: CryptoKey | null = null;
  private udek: Uint8Array | null = null;
  private bskCache: Map<string, Uint8Array> = new Map();

  /**
   * Download encryption keys from server for multi-device support
   */
  private async downloadKeysFromServer(_userId: string): Promise<any> {
    // TODO: Implement server API call to get encrypted keys
    // For now, return null to indicate no server keys available
    console.log('🌐 [EncryptionService] downloadKeysFromServer not yet implemented');
    return null;
  }

  // (Optional) uploadKeysToServer intentionally omitted until server API exists

  /**
   * Initialize encryption service with user passphrase
   * Now supports multi-device by checking server for keys
   */
  async initialize(userId: string, passphrase: string): Promise<void> {
    // Get user keys outside try block for recovery access
  let userKeys: any = await getUserKeys(userId);
    
    try {
      appLog.info('encryption', 'Initializing encryption service', { userId });
      console.log('🔐 [EncryptionService] Starting initialization for user:', userId);
      console.log('🔐 [EncryptionService] User keys retrieved locally:', !!userKeys);
      
      if (!userKeys) {
        // Try to get keys from server for multi-device support
        console.log('🌐 [EncryptionService] No local keys found, checking server...');
        try {
          userKeys = await this.downloadKeysFromServer(userId);
          if (userKeys) {
            console.log('✅ [EncryptionService] Keys downloaded from server');
            // Store locally for offline access
            await setUserKeys(userKeys); // Persist downloaded keys
          }
        } catch (serverError) {
          console.log('ℹ️ [EncryptionService] No keys on server or server unavailable, will generate new keys');
        }
      }
      
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
  const rawWrappedData = userKeys.udek_wrap_appkey as any;
        
        console.log('🔐 [EncryptionService] Raw wrapped data type and sample:', {
          type: typeof rawWrappedData,
          isArray: Array.isArray(rawWrappedData),
          isUint8Array: rawWrappedData instanceof Uint8Array,
          length: rawWrappedData?.length,
          sample: typeof rawWrappedData === 'string' ? rawWrappedData.substring(0, 50) + '...' : 'not-string',
          fullSample: typeof rawWrappedData === 'string' && rawWrappedData.length < 200 ? rawWrappedData : 'too-long'
        });
        
        if (typeof rawWrappedData === 'string') {
          // Handle JSON string format if present
          if (rawWrappedData.startsWith('[') && rawWrappedData.endsWith(']')) {
            try {
              const arrayData = JSON.parse(rawWrappedData);
              wrappedData = new Uint8Array(arrayData);
              console.log('🔐 [EncryptionService] Parsed direct JSON array, length:', wrappedData.length);
            } catch (e) {
              throw new Error('Failed to parse wrapped UDEK data');
            }
          } else if (rawWrappedData.startsWith('"[') && rawWrappedData.endsWith(']"')) {
            // Handle double-encoded JSON string
            try {
              const unescapedJson = JSON.parse(rawWrappedData); // First parse to get the JSON string
              const arrayData = JSON.parse(unescapedJson); // Second parse to get the array
              wrappedData = new Uint8Array(arrayData);
              console.log('🔐 [EncryptionService] Parsed double-encoded JSON array, length:', wrappedData.length);
            } catch (e) {
              console.error('🔐 [EncryptionService] Failed to parse double-encoded JSON:', e);
              throw new Error('Failed to parse double-encoded wrapped UDEK data');
            }
          } else {
            throw new Error('Invalid wrapped UDEK data format');
          }
        } else if (rawWrappedData instanceof Uint8Array) {
          wrappedData = rawWrappedData;
          console.log('🔐 [EncryptionService] Using direct Uint8Array, length:', wrappedData.length);
        } else if (Array.isArray(rawWrappedData)) {
          wrappedData = new Uint8Array(rawWrappedData);
          console.log('🔐 [EncryptionService] Converted from array, length:', wrappedData.length);
        } else {
          throw new Error('Unsupported wrapped UDEK data type');
        }
        
        // Extract IV (first 12 bytes) and wrapped UDEK (rest)
        const iv = wrappedData.slice(0, 12);
        const wrapped = wrappedData.slice(12);
        
        console.log('🔐 [EncryptionService] Data extraction details:', {
          totalLength: wrappedData.length,
          ivLength: iv.length,
          wrappedLength: wrapped.length,
          ivSample: Array.from(iv.slice(0, 8)),
          wrappedSample: Array.from(wrapped.slice(0, 8))
        });
        
        this.udek = await unwrapUDEKWithAppKey(wrapped, iv, this.appKey);
        
        appLog.success('encryption', 'UDEK successfully decrypted');
        console.log('🔐 [EncryptionService] UDEK successfully decrypted');
      }
      
      // Final state check
      console.log('🔐 [EncryptionService] Initialization complete. Final state:', {
        hasAppKey: !!this.appKey,
        hasUdek: !!this.udek,
        isInitialized: this.isInitialized()
      });

      // Notify UI that encryption is ready so components can refresh/decrypt
      try {
        window.dispatchEvent(new CustomEvent('encryptionInitialized', { detail: { userId } }));
      } catch (_) {}
      
    } catch (error) {
      console.error('🔐 [EncryptionService] Initialization failed:', error);
      
      // If unwrap failed, do NOT generate new keys automatically; require correct passphrase
      if (error instanceof Error && error.message === 'Failed to unwrap UDEK') {
        appLog.error('encryption', 'Passphrase incorrect for stored keys; initialization aborted');
        this.appKey = null;
        this.udek = null;
        throw new Error('Incorrect passphrase. Unable to unlock encryption keys.');
      }

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
      
      const sceneRow = await getScene(sceneId);
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
      
      // Get the chapter from the database
      const chapterRow = await getChapter(chapterId);
      if (!chapterRow) {
        appLog.debug('encryption', 'Chapter not found in database', { chapterId });
        return null; // Return null instead of throwing error for missing chapters
      }

      // If no content stored yet, return null
      if (!chapterRow.contentEnc || !chapterRow.contentIv) {
        appLog.debug('encryption', 'No encrypted content found for chapter', { chapterId });
        return null;
      }

      // Check for empty content arrays that can't be decrypted
      const hasValidContent = (chapterRow.contentEnc.length > 0 && chapterRow.contentIv.length > 0);
      if (!hasValidContent) {
        appLog.debug('encryption', 'Empty content arrays found for chapter', { chapterId });
        return null;
      }

      // Determine encryption scheme and get appropriate key
      const isShared = chapterRow.encScheme === 'bsk';
      const key = await this.getBookKey(userId, chapterRow.bookId, isShared);

      // Debug the raw data from database first
      console.log('🔍 [EncryptionService] Raw database data:', {
        chapterId,
        contentEncType: typeof (chapterRow as any).contentEnc,
        contentIvType: typeof (chapterRow as any).contentIv,
        contentEncConstructor: (chapterRow as any).contentEnc?.constructor?.name,
        contentIvConstructor: (chapterRow as any).contentIv?.constructor?.name,
        contentEncLength: (chapterRow as any).contentEnc?.length,
        contentIvLength: (chapterRow as any).contentIv?.length,
        contentEncSample: (chapterRow as any).contentEnc instanceof Uint8Array ? 
          Array.from(((chapterRow as any).contentEnc as Uint8Array).slice(0, 8)) : 
          typeof (chapterRow as any).contentEnc === 'string' ? ((chapterRow as any).contentEnc as string).substring(0, 20) : 'unknown',
        contentIvSample: (chapterRow as any).contentIv instanceof Uint8Array ? 
          Array.from(((chapterRow as any).contentIv as Uint8Array).slice(0, 8)) : 
          typeof (chapterRow as any).contentIv === 'string' ? ((chapterRow as any).contentIv as string).substring(0, 20) : 'unknown'
      });

      // Convert database data to Uint8Array (handle JSON string format)
      let contentEncBinary: Uint8Array;
      let contentIvBinary: Uint8Array;
      
      const rawEnc: any = (chapterRow as any).contentEnc;
      const rawIv: any = (chapterRow as any).contentIv;

      if (typeof rawEnc === 'string') {
        const encArray = JSON.parse(rawEnc);
        contentEncBinary = new Uint8Array(encArray);
      } else if (rawEnc instanceof Uint8Array) {
        contentEncBinary = rawEnc;
      } else if (Array.isArray(rawEnc)) {
        contentEncBinary = new Uint8Array(rawEnc);
      } else {
        throw new Error('Unsupported contentEnc type');
      }

      if (typeof rawIv === 'string') {
        const ivArray = JSON.parse(rawIv);
        contentIvBinary = new Uint8Array(ivArray);
      } else if (rawIv instanceof Uint8Array) {
        contentIvBinary = rawIv;
      } else if (Array.isArray(rawIv)) {
        contentIvBinary = new Uint8Array(rawIv);
      } else {
        throw new Error('Unsupported contentIv type');
      }

      console.log('🔧 [EncryptionService] After JSON parsing:', {
        contentEncBinaryLength: contentEncBinary.length,
        contentIvBinaryLength: contentIvBinary.length,
        contentEncBinarySample: Array.from(contentEncBinary.slice(0, 8)),
        contentIvBinarySample: Array.from(contentIvBinary.slice(0, 8))
      });

      // Convert binary data to base64 for decryption
      const contentEnc = uint8ArrayToBase64(contentEncBinary);
      const contentIv = uint8ArrayToBase64(contentIvBinary);

      console.log('🔓 [EncryptionService] Decryption details:', {
        chapterId,
  encScheme: (chapterRow as any).encScheme,
  contentEncLength: (chapterRow as any).contentEnc.length,
  contentIvLength: (chapterRow as any).contentIv.length,
  contentEncSample: Array.from(((chapterRow as any).contentEnc as Uint8Array).slice(0, 8)),
  contentIvSample: Array.from(((chapterRow as any).contentIv as Uint8Array).slice(0, 8)),
        keyType: isShared ? 'BSK' : 'UDEK',
        hasUdek: !!this.udek,
        hasAppKey: !!this.appKey
      });

      const content = await decryptSceneContent(contentEnc, contentIv, key);
      
      appLog.debug('encryption', 'Chapter content decrypted successfully', { chapterId });
      return content;
    } catch (error) {
      appLog.error('encryption', 'Failed to load chapter content', { chapterId, error });
      // Return null instead of throwing for better error handling
      return null;
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

      console.log('🔐 [SaveChapter] Encryption result:', {
        chapterId,
        contentEncLength: contentEnc.length,
        contentIvLength: contentIv.length,
        contentEncSample: contentEnc.substring(0, 20) + '...',
        contentIvSample: contentIv.substring(0, 20) + '...'
      });

      // Convert base64 to binary for storage
      const contentEncBinary = base64ToUint8Array(contentEnc);
      const contentIvBinary = base64ToUint8Array(contentIv);

      console.log('🔐 [SaveChapter] Binary conversion result:', {
        contentEncBinaryLength: contentEncBinary.length,
        contentIvBinaryLength: contentIvBinary.length,
        contentEncBinarySample: Array.from(contentEncBinary.slice(0, 8)),
        contentIvBinarySample: Array.from(contentIvBinary.slice(0, 8))
      });

      // Compute revision hash
  // Optionally compute a local revision hash for diagnostics or future sync
  // await computeRevisionHash({ content, chapterId, timestamp: Date.now() });

      // Calculate word count (rough estimate)
      const contentText = JSON.stringify(content);
      const wordCount = contentText.split(/\s+/).length;

      // Persist encrypted payload into simplified chapters table
      const dbChapter = {
        id: chapterId,
        bookId,
        versionId,
        title: content.title || 'Untitled Chapter',
        encScheme: isShared ? 'bsk' : 'udek',
        contentEnc: contentEncBinary,
        contentIv: contentIvBinary,
        wordCount,
        updatedAt: new Date().toISOString(),
        revLocal: (Math.random().toString(36).slice(2)),
        syncState: 'dirty',
      } as any;

      await putChapter(dbChapter);
      
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

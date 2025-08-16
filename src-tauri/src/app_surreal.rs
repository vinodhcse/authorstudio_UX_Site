use serde::{Deserialize, Serialize};
use std::sync::Arc;
use surrealdb::{
    engine::local::{Db, RocksDb},
    sql::Thing as RecordId,
    Surreal,
};
use tauri::{Manager, State};
use tokio::sync::Mutex;

// Data structures matching types.ts interfaces (without encryption for now)

#[derive(Debug, Deserialize, Serialize)]
pub struct AppRecord {
    #[allow(dead_code)]
    id: RecordId,
}

// Book structures
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Book {
    pub title: String,
    pub subtitle: Option<String>,
    pub author: Option<String>,
    pub author_id: Option<String>,
    pub cover_image: Option<String>,
    pub last_modified: String,
    pub progress: f64,
    pub word_count: i32,
    pub genre: String,
    pub subgenre: Option<String>,
    pub collaborator_count: i32,
    pub featured: bool,
    pub book_type: String,
    pub prose: String,
    pub language: String,
    pub publisher: String,
    pub published_status: String, // 'Published' | 'Unpublished' | 'Scheduled'
    pub publisher_link: Option<String>,
    pub print_isbn: Option<String>,
    pub ebook_isbn: Option<String>,
    pub publisher_logo: Option<String>,
    pub synopsis: String,
    pub description: Option<String>,
    pub is_shared: Option<bool>,
    pub sync_state: Option<String>, // 'idle' | 'dirty' | 'pushing' | 'pulling' | 'conflict'
    pub conflict_state: Option<String>, // 'none' | 'needs_review' | 'blocked'
    pub updated_at: Option<i64>,
    pub book_genre: Option<String>, 
}

#[derive(Debug, Deserialize, Serialize)]
pub struct BookRecord {
    #[allow(dead_code)]
    id: RecordId,
    pub title: String,
    pub subtitle: Option<String>,
    pub author: Option<String>,
    pub author_id: Option<String>,
    pub cover_image: Option<String>,
    pub last_modified: String,
    pub progress: f64,
    pub word_count: i32,
    pub genre: String,
    pub subgenre: Option<String>,
    pub collaborator_count: i32,
    pub featured: bool,
    pub book_type: String,
    pub prose: String,
    pub language: String,
    pub publisher: String,
    pub published_status: String,
    pub publisher_link: Option<String>,
    pub print_isbn: Option<String>,
    pub ebook_isbn: Option<String>,
    pub publisher_logo: Option<String>,
    pub synopsis: String,
    pub description: Option<String>,
    pub is_shared: Option<bool>,
    pub sync_state: Option<String>,
    pub conflict_state: Option<String>,
    pub updated_at: Option<i64>,
    pub book_genre: Option<String>, 
}

// Version structures
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Version {
    pub book_id: String,
    pub name: String,
    pub status: String, // 'DRAFT' | 'IN_REVIEW' | 'FINAL'
    pub word_count: i32,
    pub created_at: String,
    pub is_current: bool,
    pub sync_state: Option<String>,
    pub conflict_state: Option<String>,
    pub updated_at: Option<i64>,
}

#[derive(Debug, Deserialize, Serialize)]
pub struct VersionRecord {
    #[allow(dead_code)]
    id: RecordId,
    pub book_id: String,
    pub name: String,
    pub status: String,
    pub word_count: i32,
    pub created_at: String,
    pub is_current: bool,
    pub sync_state: Option<String>,
    pub conflict_state: Option<String>,
    pub updated_at: Option<i64>,
}

// Chapter structures
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Chapter {
    pub book_id: String,
    pub version_id: String,
    pub title: String,
    pub position: i32,
    pub created_at: String,
    pub updated_at: String,
    pub word_count: i32,
    pub has_proposals: bool,
    pub status: String, // 'DRAFT' | 'IN_PROGRESS' | 'REVIEW' | 'APPROVED' | 'PUBLISHED'
    pub author_id: String,
    pub last_modified_by: String,
    pub summary: Option<String>,
    pub goals: Option<String>,
    pub notes: Option<String>,
    pub is_complete: bool,
    pub sync_state: Option<String>,
    pub conflict_state: Option<String>,
}

#[derive(Debug, Deserialize, Serialize)]
pub struct ChapterRecord {
    #[allow(dead_code)]
    id: RecordId,
    pub book_id: String,
    pub version_id: String,
    pub title: String,
    pub position: i32,
    pub created_at: String,
    pub updated_at: String,
    pub word_count: i32,
    pub has_proposals: bool,
    pub status: String,
    pub author_id: String,
    pub last_modified_by: String,
    pub summary: Option<String>,
    pub goals: Option<String>,
    pub notes: Option<String>,
    pub is_complete: bool,
    pub sync_state: Option<String>,
    pub conflict_state: Option<String>,
}

// Character structures
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Character {
    pub book_id: String,
    pub name: String,
    pub image: Option<String>,
    pub quote: Option<String>,
    pub full_name: Option<String>,
    pub age: Option<i32>,
    pub gender: Option<String>,
    pub role: Option<String>,
    pub backstory: Option<String>,
    pub personality_type: Option<String>,
    pub motivations: Option<String>, // JSON string of array
    pub notes: Option<String>,
    pub tags: Option<String>, // JSON string of array
}

#[derive(Debug, Deserialize, Serialize)]
pub struct CharacterRecord {
    #[allow(dead_code)]
    id: RecordId,
    pub book_id: String,
    pub name: String,
    pub image: Option<String>,
    pub quote: Option<String>,
    pub full_name: Option<String>,
    pub age: Option<i32>,
    pub gender: Option<String>,
    pub role: Option<String>,
    pub backstory: Option<String>,
    pub personality_type: Option<String>,
    pub motivations: Option<String>,
    pub notes: Option<String>,
    pub tags: Option<String>,
}

// Session/Auth structures
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Session {
    pub user_id: Option<String>,
    pub email: Option<String>,
    pub name: Option<String>,
    pub device_id: Option<String>,
    pub refresh_token_enc: Option<Vec<u8>>,
    pub device_private_key_enc: Option<Vec<u8>>,
    pub appkey_wrap_salt: Option<Vec<u8>>,
    pub appkey_wrap_iters: Option<i64>,
    pub appkey_probe: Option<Vec<u8>>,
    pub access_exp: Option<i64>,
    pub subscription_status: Option<String>,
    pub subscription_expires_at: Option<i64>,
    pub subscription_last_checked_at: Option<i64>,
    pub session_state: Option<String>,
    pub sealed_at: Option<i64>,
    pub updated_at: Option<i64>,
    
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct UserKeys {
    pub user_id: String,
    pub udek_wrap_appkey: Vec<u8>,
    pub kdf_salt: Vec<u8>,
    pub kdf_iters: i64,
    pub updated_at: i64,
}

// Database implementation
pub struct AppDatabase {
    db: Arc<Mutex<Surreal<Db>>>,
}

impl AppDatabase {
    pub async fn new(app_handle: tauri::AppHandle) -> Result<Self, String> {
        let app_data_dir = app_handle.path().app_data_dir().map_err(|e| e.to_string())?;
        let db_path = app_data_dir.join("app_db.db");

        // Create parent directories
        if let Some(parent) = db_path.parent() {
            std::fs::create_dir_all(parent).map_err(|e| e.to_string())?;
        }

        println!("Creating main app database at: {:?}", db_path);
        
        let db = Surreal::new::<RocksDb>(db_path).await.map_err(|e| e.to_string())?;

        // Initialize database with namespace/database
        db.use_ns("authorstudio").use_db("main").await.map_err(|e| e.to_string())?;

        Ok(Self {
            db: Arc::new(Mutex::new(db)),
        })
    }

    // Book operations
    pub async fn create_book(
        &self,
        book: Book,
    ) -> Result<Option<AppRecord>, surrealdb::Error> {
        let created = {
            let db = self.db.lock().await;
            let res = db
                .create("book")
                .content(book)
                .await?;
            // Ensure the transaction is flushed
            db.query("COMMIT TRANSACTION").await?;
            res
        };
        Ok(created)
    }

    pub async fn get_books(&self) -> Result<Vec<BookRecord>, surrealdb::Error> {
        let books = {
            let db = self.db.lock().await;
            db.query("BEGIN TRANSACTION").await?;
            let result: Vec<BookRecord> = db.query("SELECT * FROM book ORDER BY last_modified DESC").await?.take(0)?;
            db.query("COMMIT TRANSACTION").await?;
            result
        };
        Ok(books)
    }

    pub async fn get_book_by_id(&self, book_id: String) -> Result<Option<BookRecord>, surrealdb::Error> {
        let book = {
            let db = self.db.lock().await;
            db.query("BEGIN TRANSACTION").await?;
            let mut result = db.query("SELECT * FROM book WHERE id = $book_id").bind(("book_id", format!("book:{}", book_id))).await?;
            let book: Option<BookRecord> = result.take(0)?;
            db.query("COMMIT TRANSACTION").await?;
            book
        };
        Ok(book)
    }

    pub async fn update_book(
        &self,
        book_id: String,
        book: Book,
    ) -> Result<Option<AppRecord>, surrealdb::Error> {
        let updated = {
            let db = self.db.lock().await;
            let res = db
                .update(("book", book_id))
                .content(book)
                .await?;
            db.query("COMMIT TRANSACTION").await?;
            res
        };
        Ok(updated)
    }

    pub async fn delete_book(&self, book_id: String) -> Result<(), surrealdb::Error> {
        {
            let db = self.db.lock().await;
            let _: Option<BookRecord> = db.delete(("book", book_id)).await?;
            db.query("COMMIT TRANSACTION").await?;
        };
        Ok(())
    }

    // Version operations
    pub async fn create_version(
        &self,
        version: Version,
    ) -> Result<Option<AppRecord>, surrealdb::Error> {
        let created = {
            let db = self.db.lock().await;
            let res = db
                .create("version")
                .content(version)
                .await?;
            db.query("COMMIT TRANSACTION").await?;
            res
        };
        Ok(created)
    }

    pub async fn get_versions_by_book(&self, book_id: String) -> Result<Vec<VersionRecord>, surrealdb::Error> {
        let versions = {
            let db = self.db.lock().await;
            db.query("BEGIN TRANSACTION").await?;
            let mut result = db.query("SELECT * FROM version WHERE book_id = $book_id ORDER BY created_at DESC").bind(("book_id", book_id)).await?;
            let versions: Vec<VersionRecord> = result.take(0)?;
            db.query("COMMIT TRANSACTION").await?;
            versions
        };
        Ok(versions)
    }

    pub async fn get_version_by_id(&self, version_id: String) -> Result<Option<VersionRecord>, surrealdb::Error> {
        let version = {
            let db = self.db.lock().await;
            db.query("BEGIN TRANSACTION").await?;
            let mut result = db.query("SELECT * FROM version WHERE id = $version_id").bind(("version_id", format!("version:{}", version_id))).await?;
            let version: Option<VersionRecord> = result.take(0)?;
            db.query("COMMIT TRANSACTION").await?;
            version
        };
        Ok(version)
    }

    // Chapter operations
    pub async fn create_chapter(
        &self,
        chapter: Chapter,
    ) -> Result<Option<AppRecord>, surrealdb::Error> {
        let created = {
            let db = self.db.lock().await;
            let res = db
                .create("chapter")
                .content(chapter)
                .await?;
            db.query("COMMIT TRANSACTION").await?;
            res
        };
        Ok(created)
    }

    pub async fn get_chapters_by_version(&self, book_id: String, version_id: String) -> Result<Vec<ChapterRecord>, surrealdb::Error> {
        let chapters = {
            let db = self.db.lock().await;
            db.query("BEGIN TRANSACTION").await?;
            let mut result = db.query("SELECT * FROM chapter WHERE book_id = $book_id AND version_id = $version_id ORDER BY position ASC").bind(("book_id", book_id)).bind(("version_id", version_id)).await?;
            let chapters: Vec<ChapterRecord> = result.take(0)?;
            db.query("COMMIT TRANSACTION").await?;
            chapters
        };
        Ok(chapters)
    }

    pub async fn get_chapter_by_id(&self, chapter_id: String) -> Result<Option<ChapterRecord>, surrealdb::Error> {
        let chapter = {
            let db = self.db.lock().await;
            db.query("BEGIN TRANSACTION").await?;
            let mut result = db.query("SELECT * FROM chapter WHERE id = $chapter_id").bind(("chapter_id", format!("chapter:{}", chapter_id))).await?;
            let chapter: Option<ChapterRecord> = result.take(0)?;
            db.query("COMMIT TRANSACTION").await?;
            chapter
        };
        Ok(chapter)
    }

    // Character operations
    pub async fn create_character(
        &self,
        character: Character,
    ) -> Result<Option<AppRecord>, surrealdb::Error> {
        let created = {
            let db = self.db.lock().await;
            let res = db
                .create("character")
                .content(character)
                .await?;
            db.query("COMMIT TRANSACTION").await?;
            res
        };
        Ok(created)
    }

    pub async fn get_characters_by_book(&self, book_id: String) -> Result<Vec<CharacterRecord>, surrealdb::Error> {
        let characters = {
            let db = self.db.lock().await;
            db.query("BEGIN TRANSACTION").await?;
            let mut result = db.query("SELECT * FROM character WHERE book_id = $book_id ORDER BY name ASC").bind(("book_id", book_id)).await?;
            let characters: Vec<CharacterRecord> = result.take(0)?;
            db.query("COMMIT TRANSACTION").await?;
            characters
        };
        Ok(characters)
    }

    pub async fn delete_all_data(&self) -> Result<(), surrealdb::Error> {
        {
            let db = self.db.lock().await;
            db.query("DELETE book").await?;
            db.query("DELETE version").await?;
            db.query("DELETE chapter").await?;
            db.query("DELETE character").await?;
            db.query("COMMIT TRANSACTION").await?;
        };
        Ok(())
    }

    // Session operations
    pub async fn get_session(&self) -> Result<Option<Session>, surrealdb::Error> {
        let session = {
            let db = self.db.lock().await;
            db.query("BEGIN TRANSACTION").await?;
            let mut result = db.query("SELECT * FROM session WHERE id = type::thing($session_id)").bind(("session_id", "session:current")).await?;
            let session: Option<Session> = result.take(0)?;
            db.query("COMMIT TRANSACTION").await?;
            session
        };
        println!("Session retrieved: {:?}", session);
        Ok(session)
    }

    pub async fn save_session(&self, session: Session) -> Result<Option<AppRecord>, surrealdb::Error> {
        let updated = {
            let db = self.db.lock().await;
            let res = db
                .upsert(("session", "current"))
                .content(session)
                .await?;
            db.query("COMMIT TRANSACTION").await?;
            res
        };
        println!("Session saved: {:?}", updated);
        Ok(updated)
    }

    pub async fn clear_session(&self) -> Result<bool, String> {
        let db = self.db.lock().await;
        let mut deleted: bool = false;
        db.query("BEGIN TRANSACTION").await.map_err(|e| e.to_string())?;

     
        db.query("DELETE session:current;")
            .await
            .map_err(|e| e.to_string())?;

        db.query("COMMIT TRANSACTION")
            .await
            .map_err(|e| e.to_string())?;
        deleted = true;
        Ok(deleted)
    }

    // User keys operations
    pub async fn get_user_keys(&self, user_id: String) -> Result<Option<UserKeys>, surrealdb::Error> {
        let keys = {
            let db = self.db.lock().await;
            db.query("BEGIN TRANSACTION").await?;
            let mut result = db.query("SELECT * FROM user_keys WHERE user_id = $user_id LIMIT 1").bind(("user_id", user_id)).await?;
            let keys: Option<UserKeys> = result.take(0)?;
            db.query("COMMIT TRANSACTION").await?;
            keys
        };
        Ok(keys)
    }

    pub async fn save_user_keys(&self, user_keys: UserKeys) -> Result<(), surrealdb::Error> {
        {
            let db = self.db.lock().await;
            db.query("BEGIN TRANSACTION").await?;
            
            // Upsert user keys
            let q = r#"
                LET $existing = (SELECT * FROM user_keys WHERE user_id = $user_id LIMIT 1);
                IF array::len($existing) > 0 THEN
                    UPDATE user_keys SET
                        udek_wrap_appkey = $udek_wrap_appkey,
                        kdf_salt = $kdf_salt,
                        kdf_iters = $kdf_iters,
                        updated_at = $updated_at
                    WHERE user_id = $user_id;
                ELSE
                    CREATE user_keys CONTENT {
                        user_id: $user_id,
                        udek_wrap_appkey: $udek_wrap_appkey,
                        kdf_salt: $kdf_salt,
                        kdf_iters: $kdf_iters,
                        updated_at: $updated_at
                    };
                END;
            "#;

            db.query(q)
                .bind(("user_id", user_keys.user_id))
                .bind(("udek_wrap_appkey", user_keys.udek_wrap_appkey))
                .bind(("kdf_salt", user_keys.kdf_salt))
                .bind(("kdf_iters", user_keys.kdf_iters))
                .bind(("updated_at", user_keys.updated_at))
                .await?;
            
            db.query("COMMIT TRANSACTION").await?;
            println!("User keys saved for user");
        };
        Ok(())
    }
}

// Tauri commands
// Tauri command
#[tauri::command]
pub async fn app_create_book(
    db: State<'_, AppDatabase>,
    book: Book,
) -> Result<String, String> {
    db.create_book(book.clone())
        .await
        .map(|_| format!("Created book: {}", book.title))
        .map_err(|e| {
            eprintln!("[app_create_book] Failed to create book '{}': {:?}", book.title, e);
            e.to_string()
        })
}


#[tauri::command]
pub async fn app_get_books(db: State<'_, AppDatabase>) -> Result<Vec<BookRecord>, String> {
    match db.get_books().await {
        Ok(books) => Ok(books),
        Err(e) => Err(e.to_string()),
    }
}

#[tauri::command]
pub async fn app_get_book_by_id(db: State<'_, AppDatabase>, book_id: String) -> Result<Option<BookRecord>, String> {
    match db.get_book_by_id(book_id).await {
        Ok(book) => Ok(book),
        Err(e) => Err(e.to_string()),
    }
}

#[tauri::command]
pub async fn app_update_book(
    db: State<'_, AppDatabase>,
    book_id: String,
    book: Book,
) -> Result<String, String> {
    db.update_book(book_id.clone(), book)
        .await
        .map(|_| format!("Updated book: {}", book_id))
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn app_delete_book(db: State<'_, AppDatabase>, book_id: String) -> Result<String, String> {
    match db.delete_book(book_id.clone()).await {
        Ok(_) => Ok(format!("Deleted book: {}", book_id)),
        Err(e) => Err(e.to_string()),
    }
}

#[tauri::command]
pub async fn app_create_version(
    db: State<'_, AppDatabase>,
    version: Version,
) -> Result<String, String> {
    db.create_version(version.clone())
        .await
        .map(|_| format!("Created version: {}", version.name))
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn app_get_versions_by_book(db: State<'_, AppDatabase>, book_id: String) -> Result<Vec<VersionRecord>, String> {
    match db.get_versions_by_book(book_id).await {
        Ok(versions) => Ok(versions),
        Err(e) => Err(e.to_string()),
    }
}

#[tauri::command]
pub async fn app_create_chapter(
    db: State<'_, AppDatabase>,
    chapter: Chapter,
) -> Result<String, String> {
    db.create_chapter(chapter.clone())
        .await
        .map(|_| format!("Created chapter: {}", chapter.title))
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn app_get_chapters_by_version(
    db: State<'_, AppDatabase>, 
    book_id: String, 
    version_id: String
) -> Result<Vec<ChapterRecord>, String> {
    match db.get_chapters_by_version(book_id, version_id).await {
        Ok(chapters) => Ok(chapters),
        Err(e) => Err(e.to_string()),
    }
}

#[tauri::command]
pub async fn app_create_character(
    db: State<'_, AppDatabase>,
    character: Character,
) -> Result<String, String> {
    db.create_character(character.clone())
        .await
        .map(|_| format!("Created character: {}", character.name))
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn app_get_characters_by_book(db: State<'_, AppDatabase>, book_id: String) -> Result<Vec<CharacterRecord>, String> {
    match db.get_characters_by_book(book_id).await {
        Ok(characters) => Ok(characters),
        Err(e) => Err(e.to_string()),
    }
}

#[tauri::command]
pub async fn app_delete_all_data(db: State<'_, AppDatabase>) -> Result<String, String> {
    match db.delete_all_data().await {
        Ok(_) => Ok("All application data deleted successfully".to_string()),
        Err(e) => Err(e.to_string()),
    }
}

// Session commands
#[tauri::command]
pub async fn app_get_session(db: State<'_, AppDatabase>) -> Result<Option<Session>, String> {
    match db.get_session().await {
        Ok(session) => Ok(session),
        Err(e) => Err(e.to_string()),
    }
}

#[tauri::command]
pub async fn app_save_session(
    db: State<'_, AppDatabase>,
    session: Session,
) -> Result<String, String> {
    db.save_session(session.clone())
        .await
        .map(|_| format!("Session saved for user: {:?}", session.user_id))
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn app_clear_session(db: State<'_, AppDatabase>) -> Result<String, String> {
    match db.clear_session().await {
        Ok(existed) => {
            if existed {
                Ok("Session cleared successfully".to_string())
            } else {
                Ok("No session to clear".to_string())
            }
        },
        Err(e) => Err(e),
    }
}

// User keys commands
#[tauri::command]
pub async fn app_get_user_keys(db: State<'_, AppDatabase>, user_id: String) -> Result<Option<UserKeys>, String> {
    match db.get_user_keys(user_id).await {
        Ok(keys) => Ok(keys),
        Err(e) => Err(e.to_string()),
    }
}

#[tauri::command]
pub async fn app_save_user_keys(
    db: State<'_, AppDatabase>,
    user_keys: UserKeys,
) -> Result<String, String> {
    db.save_user_keys(user_keys.clone())
        .await
        .map(|_| format!("User keys saved for user: {}", user_keys.user_id))
        .map_err(|e| e.to_string())
}

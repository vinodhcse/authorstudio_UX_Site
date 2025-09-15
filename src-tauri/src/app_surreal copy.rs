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

// Database implementation
pub struct AppDatabase {
    db: Arc<Mutex<Surreal<Db>>>,
}

impl AppDatabase {
    pub async fn new(app_handle: tauri::AppHandle) -> Result<Self, String> {
        let app_data_dir = app_handle.path().app_data_dir().map_err(|e| e.to_string())?;
        let db_path = app_data_dir.join("app_database.db");

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
}

// Tauri commands
#[tauri::command]
pub async fn app_create_book(
    db: State<'_, AppDatabase>,
    book: Book,
) -> Result<String, String> {
    db.create_book(book.clone())
        .await
        .map(|_| format!("Created book: {}", book.title))
        .map_err(|e| e.to_string())
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

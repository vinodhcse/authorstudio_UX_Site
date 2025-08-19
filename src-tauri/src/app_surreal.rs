use serde::{Deserialize, Serialize};
use std::sync::Arc;
use surrealdb::{
    engine::local::{Db, RocksDb},
    sql::Thing as RecordId,
    Surreal,
};
use tauri::{Manager, State};
use tokio::sync::Mutex;
use serde_json::Value;

// Data structures matching types.ts interfaces (without encryption for now)

#[derive(Debug, Deserialize, Serialize)]
pub struct AppRecord {
    #[allow(dead_code)]
    id: RecordId,
}

// Book structures
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Book {
    pub book_id: Option<String>,
    pub title: Option<String>,
    pub subtitle: Option<String>,
    pub author: Option<String>,
    pub author_id: Option<String>,
    pub cover_image: Option<String>,
    pub cover_image_ref: Option<FileRef>,
    pub cover_images: Option<Vec<String>>,
    pub last_modified: Option<String>,
    pub progress: Option<f64>,
    pub word_count: Option<i32>,
    pub genre: Option<String>,
    pub subgenre: Option<String>,
    pub collaborator_count: Option<i32>,
    pub featured: Option<bool>,
    pub book_type: Option<String>,
    pub prose: Option<String>,
    pub language: Option<String>,
    pub publisher: Option<String>,
    pub published_status: Option<String>, // 'Published' | 'Unpublished' | 'Scheduled'
    pub publisher_link: Option<String>,
    pub print_isbn: Option<String>,
    pub ebook_isbn: Option<String>,
    pub publisher_logo: Option<String>,
    pub synopsis: Option<String>,
    pub description: Option<String>,
    pub is_shared: Option<bool>,
    pub rev_local: Option<String>,
    pub rev_cloud: Option<String>,
    pub sync_state: Option<String>, // 'idle' | 'dirty' | 'pushing' | 'pulling' | 'conflict'
    pub conflict_state: Option<String>, // 'none' | 'needs_review' | 'blocked'
    pub updated_at: Option<i64>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub versions: Option<Vec<Value>>,   // <— freeform versions array
    pub status: Option<String>, // 'ACTIVE' | 'DELETED'
    #[serde(skip_serializing_if = "Option::is_none")]
    pub collaborators: Option<Vec<Collaborator>>,
}

#[derive(Debug, Deserialize, Serialize)]
pub struct BookRecord {
    #[allow(dead_code)]
    id: RecordId,
    pub book_id: Option<String>,
    pub title: String,
    pub subtitle: Option<String>,
    pub author: Option<String>,
    pub author_id: Option<String>,
    pub cover_image: Option<String>,
    pub cover_image_ref: Option<FileRef>,
    pub cover_images: Option<Vec<String>>,
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
    pub rev_local: Option<String>,
    pub rev_cloud: Option<String>,
    pub sync_state: Option<String>,
    pub conflict_state: Option<String>,
    pub updated_at: Option<i64>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub versions: Option<Vec<Value>>,   // <— same on the read model
    #[serde(skip_serializing_if = "Option::is_none")]
    pub collaborators: Option<Vec<CollaboratorRecord>>,
}

// Version structures
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Version {
    pub version_id: Option<String>,
    pub book_id: Option<String>,
    pub name: Option<String>,
    pub status: Option<String>, // 'DRAFT' | 'IN_REVIEW' | 'FINAL'
    pub word_count: Option<i32>,
    pub created_at: Option<String>,
    pub contributor: Option<serde_json::Value>,
    pub rev_local: Option<String>,
    pub rev_cloud: Option<String>,
    pub sync_state: Option<String>,
    pub conflict_state: Option<String>,
    pub updated_at: Option<i64>,
}

#[derive(Debug, Deserialize, Serialize)]
pub struct VersionRecord {
    #[allow(dead_code)]
    id: RecordId,
    pub version_id: Option<String>,
    pub book_id: String,
    pub name: String,
    pub status: String,
    pub word_count: i32,
    pub created_at: String,
    pub contributor: serde_json::Value,
    pub rev_local: Option<String>,
    pub rev_cloud: Option<String>,
    pub sync_state: Option<String>,
    pub conflict_state: Option<String>,
    pub updated_at: Option<i64>,
    pub chapters: Option<Vec<String>>,
    pub plot_canvas: Option<String>,
}

// Chapter structures
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Chapter {
    pub chapter_id: Option<String>,
    pub book_id: Option<String>,
    pub version_id: Option<String>,
    pub title: Option<String>,
    pub position: Option<i32>,
    pub created_at: Option<String>,
    pub updated_at: Option<String>,
    pub image: Option<String>,
    pub linked_plot_node_id: Option<String>,
    pub linked_act: Option<String>,
    pub linked_outline: Option<String>,
    pub linked_scenes: Option<Vec<String>>,
    pub total_characters: Option<i32>,
    pub total_words: Option<i32>,
    pub reading_time: Option<i32>,
    pub last_edited_by: Option<String>,
    pub last_edited_at: Option<String>,
    pub enc_scheme: Option<String>,
    pub content_enc: Option<String>,
    pub content_iv: Option<String>,
    pub rev_local: Option<String>,
    pub rev_cloud: Option<String>,
    pub sync_state: Option<String>,
    pub conflict_state: Option<String>,
    pub word_count: Option<i32>,
    pub has_proposals: Option<bool>,
    pub summary: Option<String>,
    pub goals: Option<String>,
    pub characters: Option<Vec<String>>,
    pub tags: Option<Vec<String>>,
    pub notes: Option<String>,
    pub is_complete: Option<bool>,
    pub status: Option<String>, // 'DRAFT' | 'IN_PROGRESS' | 'REVIEW' | 'APPROVED' | 'PUBLISHED'
    pub author_id: Option<String>,
    pub last_modified_by: Option<String>,
}

#[derive(Debug, Deserialize, Serialize)]
pub struct ChapterRecord {
    pub chapter_id: String,
    pub book_id: Option<String>,
    pub version_id: Option<String>,
    pub title: Option<String>,
    pub position: Option<i32>,
    pub created_at: Option<String>,
    pub updated_at: Option<String>,
    pub image: Option<String>,
    pub linked_plot_node_id: Option<String>,
    pub linked_act: Option<String>,
    pub linked_outline: Option<String>,
    pub linked_scenes: Option<Vec<String>>,
    pub total_characters: Option<i32>,
    pub total_words: Option<i32>,
    pub reading_time: Option<i32>,
    pub last_edited_by: Option<String>,
    pub last_edited_at: Option<String>,
    pub enc_scheme: Option<String>,
    pub content_enc: Option<String>,
    pub content_iv: Option<String>,
    pub rev_local: Option<String>,
    pub rev_cloud: Option<String>,
    pub sync_state: Option<String>,
    pub conflict_state: Option<String>,
    pub word_count: Option<i32>,
    pub has_proposals: Option<bool>,
    pub summary: Option<String>,
    pub goals: Option<String>,
    pub characters: Option<Vec<String>>,
    pub tags: Option<Vec<String>>,
    pub notes: Option<String>,
    pub is_complete: Option<bool>,
    pub status: Option<String>,
    pub author_id: Option<String>,
    pub last_modified_by: Option<String>,
}

// Character structures
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Character {
    pub character_id: Option<String>,
    pub book_id: Option<String>,
    pub name: Option<String>,
    pub image: Option<String>,
    pub avatar_ref: Option<FileRef>,
    pub gallery_refs: Option<Vec<FileRef>>,
    pub quote: Option<String>,
    pub full_name: Option<String>,
    pub aliases: Option<Vec<String>>,
    pub title: Option<String>,
    pub age: Option<i32>,
    pub date_of_birth: Option<String>,
    pub place_of_birth: Option<String>,
    pub nationality: Option<String>,
    pub species: Option<String>,
    pub gender: Option<String>,
    pub sexuality: Option<String>,
    pub pronouns: Option<String>,
    pub character_arc: Option<String>,
    pub internal_conflict: Option<String>,
    pub external_conflict: Option<String>,
    pub growth: Option<String>,
    pub role: Option<String>,
    pub importance: Option<String>,
    pub first_appearance: Option<String>,
    pub last_appearance: Option<String>,
    pub backstory: Option<String>,
    pub personality_type: Option<String>,
    pub created_at: Option<String>,
    pub updated_at: Option<String>,
}

#[derive(Debug, Deserialize, Serialize)]
pub struct CharacterRecord {
    pub character_id: String,
    pub book_id: Option<String>,
    pub name: Option<String>,
    pub image: Option<String>,
    pub avatar_ref: Option<FileRef>,
    pub gallery_refs: Option<Vec<FileRef>>,
    pub quote: Option<String>,
    pub full_name: Option<String>,
    pub aliases: Option<Vec<String>>,
    pub title: Option<String>,
    pub age: Option<i32>,
    pub date_of_birth: Option<String>,
    pub place_of_birth: Option<String>,
    pub nationality: Option<String>,
    pub species: Option<String>,
    pub gender: Option<String>,
    pub sexuality: Option<String>,
    pub pronouns: Option<String>,
    pub character_arc: Option<String>,
    pub internal_conflict: Option<String>,
    pub external_conflict: Option<String>,
    pub growth: Option<String>,
    pub role: Option<String>,
    pub importance: Option<String>,
    pub first_appearance: Option<String>,
    pub last_appearance: Option<String>,
    pub backstory: Option<String>,
    pub personality_type: Option<String>,
    pub created_at: Option<String>,
    pub updated_at: Option<String>,
}

// Collaborator structures
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Collaborator {
    pub collaborator_id: Option<String>,
    pub book_id: Option<String>,
    pub user_id: Option<String>,
    pub avatar: Option<String>,
    pub name: Option<String>,
    pub email: Option<String>,
    pub role: Option<String>, // 'AUTHOR' | 'EDITOR' | 'REVIEWER' | 'ADMIN'
    pub created_at: Option<String>,
    pub updated_at: Option<String>,
    pub status: Option<String>, // 'ACTIVE' | 'PENDING' | 'REMOVED'
}

#[derive(Debug, Deserialize, Serialize)]
pub struct CollaboratorRecord {
    pub collaborator_id: String,
    pub book_id: Option<String>,
    pub user_id: Option<String>,
    pub avatar: Option<String>,
    pub name: Option<String>,
    pub email: Option<String>,
    pub role: Option<String>,
    pub created_at: Option<String>,
    pub updated_at: Option<String>,
    pub status: Option<String>,
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

// File Asset Types
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FileRef {
    pub asset_id: String,
    pub sha256: Option<String>,
    pub role: Option<String>, // 'cover' | 'avatar' | 'gallery' | 'divider' | 'attachment' | 'map' | 'lore'
    pub mime: Option<String>,
    pub width: Option<i32>,
    pub height: Option<i32>,
    pub remote_id: Option<String>,
    pub remote_url: Option<String>,
    pub local_path: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub struct FileAsset {
    pub file_asset_id: Option<String>,
    pub sha256: Option<String>,
    pub ext: Option<String>,
    pub mime: Option<String>,
    pub size_bytes: Option<i64>,
    pub width: Option<i32>,
    pub height: Option<i32>,
    pub local_path: Option<String>,
    pub remote_id: Option<String>,
    pub remote_url: Option<String>,
    pub status: Option<String>, // 'local_only' | 'pending_upload' | 'uploaded' | 'failed'
    pub created_at: Option<String>,
    pub updated_at: Option<String>,
}

#[derive(Debug, Deserialize, Serialize)]
pub struct FileAssetRecord {
    pub file_asset_id: String,
    pub sha256: Option<String>,
    pub ext: Option<String>,
    pub mime: Option<String>,
    pub size_bytes: Option<i64>,
    pub width: Option<i32>,
    pub height: Option<i32>,
    pub local_path: Option<String>,
    pub remote_id: Option<String>,
    pub remote_url: Option<String>,
    pub status: Option<String>,
    pub created_at: Option<String>,
    pub updated_at: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FileAssetLink {
    pub file_asset_link_id: Option<String>,
    pub asset_id: Option<String>,
    pub entity_type: Option<String>, // 'book' | 'character' | 'world' | 'location' | 'object' | 'chapter' | 'divider'
    pub entity_id: Option<String>,
    pub role: Option<String>,
    pub sort_order: Option<i32>,
    pub tags: Option<String>,
    pub description: Option<String>,
    pub created_at: Option<String>,
    pub updated_at: Option<String>,
}

#[derive(Debug, Deserialize, Serialize)]
pub struct FileAssetLinkRecord {
    pub file_asset_link_id: String,
    pub asset_id: Option<String>,
    pub entity_type: Option<String>,
    pub entity_id: Option<String>,
    pub role: Option<String>,
    pub sort_order: Option<i32>,
    pub tags: Option<String>,
    pub description: Option<String>,
    pub created_at: Option<String>,
    pub updated_at: Option<String>,
}

// World building structures
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct World {
    pub world_id: Option<String>,
    pub book_id: Option<String>,
    pub name: Option<String>,
    pub description: Option<String>,
    pub created_at: Option<String>,
    pub updated_at: Option<String>,
    pub locations: Option<Vec<String>>,
    pub objects: Option<Vec<String>>,
    pub lore: Option<Vec<String>>,
}

#[derive(Debug, Deserialize, Serialize)]
pub struct WorldRecord {
    pub world_id: String,
    pub book_id: Option<String>,
    pub name: Option<String>,
    pub description: Option<String>,
    pub created_at: Option<String>,
    pub updated_at: Option<String>,
    pub locations: Option<Vec<String>>,
    pub objects: Option<Vec<String>>,
    pub lore: Option<Vec<String>>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Location {
    pub location_id: Option<String>,
    pub world_id: Option<String>,
    pub book_id: Option<String>,
    pub name: Option<String>,
    pub description: Option<String>,
    pub geography: Option<String>,
    pub history: Option<String>,
    pub politics: Option<String>,
    pub economy: Option<String>,
    pub culture: Option<String>,
    pub created_at: Option<String>,
    pub updated_at: Option<String>,
}

#[derive(Debug, Deserialize, Serialize)]
pub struct LocationRecord {
    pub location_id: String,
    pub world_id: Option<String>,
    pub book_id: Option<String>,
    pub name: Option<String>,
    pub description: Option<String>,
    pub geography: Option<String>,
    pub history: Option<String>,
    pub politics: Option<String>,
    pub economy: Option<String>,
    pub culture: Option<String>,
    pub created_at: Option<String>,
    pub updated_at: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Object {
    pub object_id: Option<String>,
    pub world_id: Option<String>,
    pub book_id: Option<String>,
    pub name: Option<String>,
    pub description: Option<String>,
    pub object_type: Option<String>,
    pub significance: Option<String>,
    pub created_at: Option<String>,
    pub updated_at: Option<String>,
}

#[derive(Debug, Deserialize, Serialize)]
pub struct ObjectRecord {
    pub object_id: String,
    pub world_id: Option<String>,
    pub book_id: Option<String>,
    pub name: Option<String>,
    pub description: Option<String>,
    pub object_type: Option<String>,
    pub significance: Option<String>,
    pub created_at: Option<String>,
    pub updated_at: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Lore {
    pub lore_id: Option<String>,
    pub world_id: Option<String>,
    pub book_id: Option<String>,
    pub title: Option<String>,
    pub content: Option<String>,
    pub lore_type: Option<String>,
    pub importance: Option<String>,
    pub created_at: Option<String>,
    pub updated_at: Option<String>,
}

#[derive(Debug, Deserialize, Serialize)]
pub struct LoreRecord {
    pub lore_id: String,
    pub world_id: Option<String>,
    pub book_id: Option<String>,
    pub title: Option<String>,
    pub content: Option<String>,
    pub lore_type: Option<String>,
    pub importance: Option<String>,
    pub created_at: Option<String>,
    pub updated_at: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Scene {
    pub scene_id: Option<String>,
    pub title: Option<String>,
    pub enc_scheme: Option<String>,
    pub sync_state: Option<String>,
    pub conflict_state: Option<String>,
    pub updated_at: Option<i64>,
    pub word_count: Option<i32>,
    pub has_proposals: Option<bool>,
}

#[derive(Debug, Deserialize, Serialize)]
pub struct SceneRecord {
    pub scene_id: String,
    pub title: Option<String>,
    pub enc_scheme: Option<String>,
    pub sync_state: Option<String>,
    pub conflict_state: Option<String>,
    pub updated_at: Option<i64>,
    pub word_count: Option<i32>,
    pub has_proposals: Option<bool>,
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
                .upsert(("book", book_id))
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
            db.query("DELETE file_asset").await?;
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
        println!("Saving session: {:?}", session.user_id);
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
        let deleted: bool;
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

    // User Books operations
    pub async fn get_user_books(&self, user_id: String) -> Result<Vec<BookRecord>, surrealdb::Error> {
        let input: String = user_id.clone();
        print!("Fetching User books for user: {:?}", input);
        let books = {
            let db = self.db.lock().await;
            db.query("BEGIN TRANSACTION").await?;
            let mut result = db.query("SELECT * FROM book WHERE author_id = $author_id ORDER BY updated_at DESC").bind(("author_id", user_id)).await?;
            let books: Vec<BookRecord> = result.take(0)?;
            db.query("COMMIT TRANSACTION").await?;
            books
        };
        print!("User books retrieved: {:?}", books);
        Ok(books)
    }

    pub async fn get_book(&self, book_id: String, user_id: String) -> Result<Option<BookRecord>, surrealdb::Error> {
        let input: String = user_id.clone();
        print!("Fetching User book for user: {:?}", input);
        let book = {
            let db = self.db.lock().await;
            db.query("BEGIN TRANSACTION").await?;
            let mut result = db.query("SELECT * FROM book WHERE id = $id AND author_id = $author_id LIMIT 1").bind(("id", book_id)).bind(("author_id", user_id)).await?;
            let book: Option<BookRecord> = result.take(0)?;
            db.query("COMMIT TRANSACTION").await?;
            book
        };
        print!("User book retrieved: {:?}", book);
        Ok(book)
    }

    pub async fn update_book_by_user(&self, book: Book) -> Result<BookRecord, surrealdb::Error> {
        let book_id = book.book_id.clone();
        print!("Fetching User book for user: {:?}", book_id);
        let updated = {
            let db = self.db.lock().await;
            db.query("BEGIN TRANSACTION").await?;
            let mut result = db.query("UPDATE $rid CONTENT $data").bind(("rid", book_id)).bind(("data", book)).await?;
            let updated: Option<BookRecord> = result.take(0)?;
            db.query("COMMIT TRANSACTION").await?;
            print!("Updated user book status: {:?}", updated);
            updated
        };
        updated.ok_or_else(|| surrealdb::Error::Db(surrealdb::error::Db::Thrown("Book not found or update failed".to_string())))
    }

    pub async fn delete_book_by_user(&self, book_id: String, user_id: String) -> Result<(), surrealdb::Error> {
        {
            let db = self.db.lock().await;
            db.query("BEGIN TRANSACTION").await?;
            // Verify ownership first
            let mut verify = db.query("SELECT id FROM book WHERE id = $id AND author_id = $author_id LIMIT 1").bind(("id", book_id.clone())).bind(("author_id", user_id)).await?;
            let exists: Option<serde_json::Value> = verify.take(0)?;
            if exists.is_none() {
                db.query("COMMIT TRANSACTION").await?;
                return Err(surrealdb::Error::Db(surrealdb::error::Db::Thrown("Book not found or not owned by user".to_string())));
            }
            // Delete
            db.query("DELETE $rid").bind(("rid", book_id)).await?;
            db.query("COMMIT TRANSACTION").await?;
        };
        Ok(())
    }

    // FileAsset operations
    pub async fn create_file_asset(&self, file_asset: FileAsset) -> Result<Option<AppRecord>, surrealdb::Error> {
        let created = {
            let db = self.db.lock().await;
            let res = db
                .create("file_asset")
                .content(file_asset)
                .await?;
            db.query("COMMIT TRANSACTION").await?;
            res
        };
        Ok(created)
    }

    pub async fn get_file_asset_by_id(&self, asset_id: String) -> Result<Option<FileAssetRecord>, surrealdb::Error> {
        let asset = {
            let db = self.db.lock().await;
            db.query("BEGIN TRANSACTION").await?;
            let mut result = db.query("SELECT * FROM file_asset WHERE file_asset_id = $asset_id").bind(("asset_id", asset_id)).await?;
            let asset: Option<FileAssetRecord> = result.take(0)?;
            db.query("COMMIT TRANSACTION").await?;
            asset
        };
        Ok(asset)
    }

    pub async fn get_file_asset_by_sha256(&self, sha256: String) -> Result<Option<FileAssetRecord>, surrealdb::Error> {
        let asset = {
            let db = self.db.lock().await;
            db.query("BEGIN TRANSACTION").await?;
            let mut result = db.query("SELECT * FROM file_asset WHERE sha256 = $sha256 LIMIT 1").bind(("sha256", sha256)).await?;
            let asset: Option<FileAssetRecord> = result.take(0)?;
            db.query("COMMIT TRANSACTION").await?;
            asset
        };
        Ok(asset)
    }

    pub async fn update_file_asset(&self, asset_id: String, file_asset: FileAsset) -> Result<Option<AppRecord>, surrealdb::Error> {
        let updated = {
            let db = self.db.lock().await;
            let res = db
                .update(("file_asset", asset_id))
                .content(file_asset)
                .await?;
            db.query("COMMIT TRANSACTION").await?;
            res
        };
        Ok(updated)
    }

    pub async fn get_file_assets_by_status(&self, status: String) -> Result<Vec<FileAssetRecord>, surrealdb::Error> {
        let assets = {
            let db = self.db.lock().await;
            db.query("BEGIN TRANSACTION").await?;
            let mut result = db.query("SELECT * FROM file_asset WHERE status = $status ORDER BY created_at DESC").bind(("status", status)).await?;
            let assets: Vec<FileAssetRecord> = result.take(0)?;
            db.query("COMMIT TRANSACTION").await?;
            assets
        };
        Ok(assets)
    }

    pub async fn delete_file_asset(&self, asset_id: String) -> Result<(), surrealdb::Error> {
        {
            let db = self.db.lock().await;
            let _: Option<FileAssetRecord> = db.delete(("file_asset", asset_id)).await?;
            db.query("COMMIT TRANSACTION").await?;
        };
        Ok(())
    }

    pub async fn delete_all_file_assets(&self) -> Result<usize, surrealdb::Error> {
        let db = self.db.lock().await;
        let mut response = db.query("DELETE file_asset; RETURN count()").await?;
        let count: Option<usize> = response.take("count").unwrap_or(Some(0));
        db.query("COMMIT TRANSACTION").await?;
        Ok(count.unwrap_or(0))
    }

    // FileAssetLink operations
    pub async fn create_file_asset_link(&self, link: FileAssetLink) -> Result<Option<AppRecord>, surrealdb::Error> {
        let created = {
            let db = self.db.lock().await;
            let res = db
                .create("file_asset_link")
                .content(link)
                .await?;
            db.query("COMMIT TRANSACTION").await?;
            res
        };
        Ok(created)
    }

    pub async fn upsert_file_asset_link(&self, link: FileAssetLink) -> Result<Option<AppRecord>, surrealdb::Error> {
        let link_id = link.file_asset_link_id.clone().unwrap_or_else(|| "new_link".to_string());
        let upserted = {
            let db = self.db.lock().await;
            let res = db
                .upsert(("file_asset_link", link_id))
                .content(link)
                .await?;
            db.query("COMMIT TRANSACTION").await?;
            res
        };
        Ok(upserted)
    }

    pub async fn get_file_asset_links_by_entity(&self, entity_type: String, entity_id: String) -> Result<Vec<FileAssetLinkRecord>, surrealdb::Error> {
        let links = {
            let db = self.db.lock().await;
            db.query("BEGIN TRANSACTION").await?;
            let mut result = db.query("SELECT * FROM file_asset_link WHERE entity_type = $entity_type AND entity_id = $entity_id ORDER BY sort_order ASC").bind(("entity_type", entity_type)).bind(("entity_id", entity_id)).await?;
            let links: Vec<FileAssetLinkRecord> = result.take(0)?;
            db.query("COMMIT TRANSACTION").await?;
            links
        };
        Ok(links)
    }

    pub async fn get_file_asset_links_by_entity_role(&self, entity_type: String, entity_id: String, role: String) -> Result<Vec<FileAssetLinkRecord>, surrealdb::Error> {
        let links = {
            let db = self.db.lock().await;
            db.query("BEGIN TRANSACTION").await?;
            let mut result = db.query("SELECT * FROM file_asset_link WHERE entity_type = $entity_type AND entity_id = $entity_id AND role = $role ORDER BY sort_order ASC").bind(("entity_type", entity_type)).bind(("entity_id", entity_id)).bind(("role", role)).await?;
            let links: Vec<FileAssetLinkRecord> = result.take(0)?;
            db.query("COMMIT TRANSACTION").await?;
            links
        };
        Ok(links)
    }

    pub async fn get_file_asset_links_by_asset(&self, asset_id: String) -> Result<Vec<FileAssetLinkRecord>, surrealdb::Error> {
        let links = {
            let db = self.db.lock().await;
            db.query("BEGIN TRANSACTION").await?;
            let mut result = db.query("SELECT * FROM file_asset_link WHERE asset_id = $asset_id ORDER BY sort_order ASC").bind(("asset_id", asset_id)).await?;
            let links: Vec<FileAssetLinkRecord> = result.take(0)?;
            db.query("COMMIT TRANSACTION").await?;
            links
        };
        Ok(links)
    }

    pub async fn delete_file_asset_link(&self, link_id: String) -> Result<(), surrealdb::Error> {
        {
            let db = self.db.lock().await;
            let _: Option<FileAssetLinkRecord> = db.delete(("file_asset_link", link_id)).await?;
            db.query("COMMIT TRANSACTION").await?;
        };
        Ok(())
    }

    pub async fn delete_file_asset_links_by_entity_role(&self, entity_type: String, entity_id: String, role: String) -> Result<(), surrealdb::Error> {
        {
            let db = self.db.lock().await;
            db.query("BEGIN TRANSACTION").await?;
            db.query("DELETE file_asset_link WHERE entity_type = $entity_type AND entity_id = $entity_id AND role = $role").bind(("entity_type", entity_type)).bind(("entity_id", entity_id)).bind(("role", role)).await?;
            db.query("COMMIT TRANSACTION").await?;
        };
        Ok(())
    }

    pub async fn delete_file_asset_links_by_asset(&self, asset_id: String) -> Result<(), surrealdb::Error> {
        {
            let db = self.db.lock().await;
            db.query("BEGIN TRANSACTION").await?;
            db.query("DELETE file_asset_link WHERE asset_id = $asset_id").bind(("asset_id", asset_id)).await?;
            db.query("COMMIT TRANSACTION").await?;
        };
        Ok(())
    }

    // World operations
    pub async fn create_world(&self, world: World) -> Result<Option<AppRecord>, surrealdb::Error> {
        let created = {
            let db = self.db.lock().await;
            let res = db
                .create("world")
                .content(world)
                .await?;
            db.query("COMMIT TRANSACTION").await?;
            res
        };
        Ok(created)
    }

    pub async fn get_worlds_by_book(&self, book_id: String) -> Result<Vec<WorldRecord>, surrealdb::Error> {
        let worlds = {
            let db = self.db.lock().await;
            db.query("BEGIN TRANSACTION").await?;
            let mut result = db.query("SELECT * FROM world WHERE book_id = $book_id ORDER BY created_at DESC").bind(("book_id", book_id)).await?;
            let worlds: Vec<WorldRecord> = result.take(0)?;
            db.query("COMMIT TRANSACTION").await?;
            worlds
        };
        Ok(worlds)
    }

    pub async fn get_world_by_id(&self, world_id: String) -> Result<Option<WorldRecord>, surrealdb::Error> {
        let world = {
            let db = self.db.lock().await;
            db.query("BEGIN TRANSACTION").await?;
            let mut result = db.query("SELECT * FROM world WHERE id = $world_id").bind(("world_id", format!("world:{}", world_id))).await?;
            let world: Option<WorldRecord> = result.take(0)?;
            db.query("COMMIT TRANSACTION").await?;
            world
        };
        Ok(world)
    }

    pub async fn update_world(&self, world_id: String, world: World) -> Result<Option<AppRecord>, surrealdb::Error> {
        let updated = {
            let db = self.db.lock().await;
            let res = db
                .update(("world", world_id))
                .content(world)
                .await?;
            db.query("COMMIT TRANSACTION").await?;
            res
        };
        Ok(updated)
    }

    pub async fn delete_world(&self, world_id: String) -> Result<(), surrealdb::Error> {
        {
            let db = self.db.lock().await;
            let _: Option<WorldRecord> = db.delete(("world", world_id)).await?;
            db.query("COMMIT TRANSACTION").await?;
        };
        Ok(())
    }

    // Location operations
    pub async fn create_location(&self, location: Location) -> Result<Option<AppRecord>, surrealdb::Error> {
        let created = {
            let db = self.db.lock().await;
            let res = db
                .create("location")
                .content(location)
                .await?;
            db.query("COMMIT TRANSACTION").await?;
            res
        };
        Ok(created)
    }

    pub async fn get_locations_by_world(&self, world_id: String) -> Result<Vec<LocationRecord>, surrealdb::Error> {
        let locations = {
            let db = self.db.lock().await;
            db.query("BEGIN TRANSACTION").await?;
            let mut result = db.query("SELECT * FROM location WHERE world_id = $world_id ORDER BY name ASC").bind(("world_id", world_id)).await?;
            let locations: Vec<LocationRecord> = result.take(0)?;
            db.query("COMMIT TRANSACTION").await?;
            locations
        };
        Ok(locations)
    }

    pub async fn get_locations_by_book(&self, book_id: String) -> Result<Vec<LocationRecord>, surrealdb::Error> {
        let locations = {
            let db = self.db.lock().await;
            db.query("BEGIN TRANSACTION").await?;
            let mut result = db.query("SELECT * FROM location WHERE book_id = $book_id ORDER BY name ASC").bind(("book_id", book_id)).await?;
            let locations: Vec<LocationRecord> = result.take(0)?;
            db.query("COMMIT TRANSACTION").await?;
            locations
        };
        Ok(locations)
    }

    pub async fn update_location(&self, location_id: String, location: Location) -> Result<Option<AppRecord>, surrealdb::Error> {
        let updated = {
            let db = self.db.lock().await;
            let res = db
                .update(("location", location_id))
                .content(location)
                .await?;
            db.query("COMMIT TRANSACTION").await?;
            res
        };
        Ok(updated)
    }

    pub async fn delete_location(&self, location_id: String) -> Result<(), surrealdb::Error> {
        {
            let db = self.db.lock().await;
            let _: Option<LocationRecord> = db.delete(("location", location_id)).await?;
            db.query("COMMIT TRANSACTION").await?;
        };
        Ok(())
    }

    // Object operations
    pub async fn create_object(&self, object: Object) -> Result<Option<AppRecord>, surrealdb::Error> {
        let created = {
            let db = self.db.lock().await;
            let res = db
                .create("object")
                .content(object)
                .await?;
            db.query("COMMIT TRANSACTION").await?;
            res
        };
        Ok(created)
    }

    pub async fn get_objects_by_world(&self, world_id: String) -> Result<Vec<ObjectRecord>, surrealdb::Error> {
        let objects = {
            let db = self.db.lock().await;
            db.query("BEGIN TRANSACTION").await?;
            let mut result = db.query("SELECT * FROM object WHERE world_id = $world_id ORDER BY name ASC").bind(("world_id", world_id)).await?;
            let objects: Vec<ObjectRecord> = result.take(0)?;
            db.query("COMMIT TRANSACTION").await?;
            objects
        };
        Ok(objects)
    }

    pub async fn get_objects_by_book(&self, book_id: String) -> Result<Vec<ObjectRecord>, surrealdb::Error> {
        let objects = {
            let db = self.db.lock().await;
            db.query("BEGIN TRANSACTION").await?;
            let mut result = db.query("SELECT * FROM object WHERE book_id = $book_id ORDER BY name ASC").bind(("book_id", book_id)).await?;
            let objects: Vec<ObjectRecord> = result.take(0)?;
            db.query("COMMIT TRANSACTION").await?;
            objects
        };
        Ok(objects)
    }

    pub async fn update_object(&self, object_id: String, object: Object) -> Result<Option<AppRecord>, surrealdb::Error> {
        let updated = {
            let db = self.db.lock().await;
            let res = db
                .update(("object", object_id))
                .content(object)
                .await?;
            db.query("COMMIT TRANSACTION").await?;
            res
        };
        Ok(updated)
    }

    pub async fn delete_object(&self, object_id: String) -> Result<(), surrealdb::Error> {
        {
            let db = self.db.lock().await;
            let _: Option<ObjectRecord> = db.delete(("object", object_id)).await?;
            db.query("COMMIT TRANSACTION").await?;
        };
        Ok(())
    }

    // Lore operations
    pub async fn create_lore(&self, lore: Lore) -> Result<Option<AppRecord>, surrealdb::Error> {
        let created = {
            let db = self.db.lock().await;
            let res = db
                .create("lore")
                .content(lore)
                .await?;
            db.query("COMMIT TRANSACTION").await?;
            res
        };
        Ok(created)
    }

    pub async fn get_lore_by_world(&self, world_id: String) -> Result<Vec<LoreRecord>, surrealdb::Error> {
        let lore = {
            let db = self.db.lock().await;
            db.query("BEGIN TRANSACTION").await?;
            let mut result = db.query("SELECT * FROM lore WHERE world_id = $world_id ORDER BY title ASC").bind(("world_id", world_id)).await?;
            let lore: Vec<LoreRecord> = result.take(0)?;
            db.query("COMMIT TRANSACTION").await?;
            lore
        };
        Ok(lore)
    }

    pub async fn get_lore_by_book(&self, book_id: String) -> Result<Vec<LoreRecord>, surrealdb::Error> {
        let lore = {
            let db = self.db.lock().await;
            db.query("BEGIN TRANSACTION").await?;
            let mut result = db.query("SELECT * FROM lore WHERE book_id = $book_id ORDER BY title ASC").bind(("book_id", book_id)).await?;
            let lore: Vec<LoreRecord> = result.take(0)?;
            db.query("COMMIT TRANSACTION").await?;
            lore
        };
        Ok(lore)
    }

    pub async fn update_lore(&self, lore_id: String, lore: Lore) -> Result<Option<AppRecord>, surrealdb::Error> {
        let updated = {
            let db = self.db.lock().await;
            let res = db
                .update(("lore", lore_id))
                .content(lore)
                .await?;
            db.query("COMMIT TRANSACTION").await?;
            res
        };
        Ok(updated)
    }

    pub async fn delete_lore(&self, lore_id: String) -> Result<(), surrealdb::Error> {
        {
            let db = self.db.lock().await;
            let _: Option<LoreRecord> = db.delete(("lore", lore_id)).await?;
            db.query("COMMIT TRANSACTION").await?;
        };
        Ok(())
    }

    // Scene operations
    pub async fn create_scene(&self, scene: Scene) -> Result<Option<AppRecord>, surrealdb::Error> {
        let created = {
            let db = self.db.lock().await;
            let res = db
                .create("scene")
                .content(scene)
                .await?;
            db.query("COMMIT TRANSACTION").await?;
            res
        };
        Ok(created)
    }

    pub async fn get_scene_by_id(&self, scene_id: String) -> Result<Option<SceneRecord>, surrealdb::Error> {
        let scene = {
            let db = self.db.lock().await;
            db.query("BEGIN TRANSACTION").await?;
            let mut result = db.query("SELECT * FROM scene WHERE id = $scene_id").bind(("scene_id", format!("scene:{}", scene_id))).await?;
            let scene: Option<SceneRecord> = result.take(0)?;
            db.query("COMMIT TRANSACTION").await?;
            scene
        };
        Ok(scene)
    }

    pub async fn get_scenes_by_book(&self, book_id: String) -> Result<Vec<SceneRecord>, surrealdb::Error> {
        let scenes = {
            let db = self.db.lock().await;
            db.query("BEGIN TRANSACTION").await?;
            let mut result = db.query("SELECT * FROM scene WHERE book_id = $book_id ORDER BY title ASC").bind(("book_id", book_id)).await?;
            let scenes: Vec<SceneRecord> = result.take(0)?;
            db.query("COMMIT TRANSACTION").await?;
            scenes
        };
        Ok(scenes)
    }

    pub async fn update_scene(&self, scene_id: String, scene: Scene) -> Result<Option<AppRecord>, surrealdb::Error> {
        let updated = {
            let db = self.db.lock().await;
            let res = db
                .update(("scene", scene_id))
                .content(scene)
                .await?;
            db.query("COMMIT TRANSACTION").await?;
            res
        };
        Ok(updated)
    }

    pub async fn delete_scene(&self, scene_id: String) -> Result<(), surrealdb::Error> {
        {
            let db = self.db.lock().await;
            let _: Option<SceneRecord> = db.delete(("scene", scene_id)).await?;
            db.query("COMMIT TRANSACTION").await?;
        };
        Ok(())
    }

    // Generic query operation for complex queries
    pub async fn execute_query(&self, query: String) -> Result<surrealdb::Value, surrealdb::Error> {
        let db = self.db.lock().await;
        db.query("BEGIN TRANSACTION").await?;
        let mut result = db.query(&query).await?;
        let value: surrealdb::Value = result.take(0)?;
        db.query("COMMIT TRANSACTION").await?;
        Ok(value)
    }
}

// Tauri commands - User Books operations
#[tauri::command]
pub async fn app_get_user_books(db: State<'_, AppDatabase>, user_id: String) -> Result<Vec<BookRecord>, String> {
    println!("Getting books for user: {}", user_id);
    match db.get_user_books(user_id).await {
        Ok(books) => Ok(books),
        Err(e) => Err(e.to_string()),
    }
}



#[tauri::command]
pub async fn app_get_book(db: State<'_, AppDatabase>, book_id: String, user_id: String) -> Result<Option<BookRecord>, String> {
    match db.get_book(book_id, user_id).await {
        Ok(book) => Ok(book),
        Err(e) => Err(e.to_string()),
    }
}

#[tauri::command]
pub async fn app_update_book_by_user(db: State<'_, AppDatabase>, book: Book) -> Result<BookRecord, String> {
    match db.update_book_by_user(book).await {
        Ok(book) => Ok(book),
        Err(e) => Err(e.to_string()),
    }
}

#[tauri::command]
pub async fn app_delete_book_by_user(db: State<'_, AppDatabase>, book_id: String, user_id: String) -> Result<String, String> {
    match db.delete_book_by_user(book_id, user_id).await {
        Ok(_) => Ok("Book deleted successfully".to_string()),
        Err(e) => Err(e.to_string()),
    }
}

// FileAsset commands
#[tauri::command]
pub async fn app_create_file_asset(db: State<'_, AppDatabase>, file_asset: FileAsset) -> Result<String, String> {
    db.create_file_asset(file_asset.clone())
        .await
        .map(|_| format!("Created file asset: {}", file_asset.file_asset_id.unwrap_or_default()))
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn app_get_file_asset_by_id(db: State<'_, AppDatabase>, asset_id: String) -> Result<Option<FileAssetRecord>, String> {
    match db.get_file_asset_by_id(asset_id).await {
        Ok(asset) => Ok(asset),
        Err(e) => Err(e.to_string()),
    }
}

#[tauri::command]
pub async fn app_get_file_asset_by_sha256(db: State<'_, AppDatabase>, sha256: String) -> Result<Option<FileAssetRecord>, String> {
    match db.get_file_asset_by_sha256(sha256).await {
        Ok(asset) => Ok(asset),
        Err(e) => Err(e.to_string()),
    }
}

#[tauri::command]
pub async fn app_update_file_asset(db: State<'_, AppDatabase>, asset_id: String, file_asset: FileAsset) -> Result<String, String> {
    db.update_file_asset(asset_id, file_asset)
        .await
        .map(|_| "File asset updated successfully".to_string())
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn app_get_file_assets_by_status(db: State<'_, AppDatabase>, status: String) -> Result<Vec<FileAssetRecord>, String> {
    match db.get_file_assets_by_status(status).await {
        Ok(assets) => Ok(assets),
        Err(e) => Err(e.to_string()),
    }
}

#[tauri::command]
pub async fn app_delete_file_asset(db: State<'_, AppDatabase>, asset_id: String) -> Result<String, String> {
    match db.delete_file_asset(asset_id).await {
        Ok(_) => Ok("File asset deleted successfully".to_string()),
        Err(e) => Err(e.to_string()),
    }
}

#[tauri::command]
pub async fn app_delete_all_file_assets(db: State<'_, AppDatabase>) -> Result<String, String> {
    match db.delete_all_file_assets().await {
        Ok(count) => Ok(format!("Deleted {} file assets", count)),
        Err(e) => Err(e.to_string()),
    }
}

// FileAssetLink commands
#[tauri::command]
pub async fn app_create_file_asset_link(db: State<'_, AppDatabase>, link: FileAssetLink) -> Result<String, String> {
    db.create_file_asset_link(link.clone())
        .await
        .map(|_| format!("Created file asset link: {}", link.file_asset_link_id.unwrap_or_default()))
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn app_upsert_file_asset_link(db: State<'_, AppDatabase>, link: FileAssetLink) -> Result<String, String> {
    db.upsert_file_asset_link(link.clone())
        .await
        .map(|_| format!("Upserted file asset link: {}", link.file_asset_link_id.unwrap_or_default()))
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn app_get_file_asset_links_by_entity(db: State<'_, AppDatabase>, entity_type: String, entity_id: String) -> Result<Vec<FileAssetLinkRecord>, String> {
    match db.get_file_asset_links_by_entity(entity_type, entity_id).await {
        Ok(links) => Ok(links),
        Err(e) => Err(e.to_string()),
    }
}

#[tauri::command]
pub async fn app_get_file_asset_links_by_entity_role(db: State<'_, AppDatabase>, entity_type: String, entity_id: String, role: String) -> Result<Vec<FileAssetLinkRecord>, String> {
    match db.get_file_asset_links_by_entity_role(entity_type, entity_id, role).await {
        Ok(links) => Ok(links),
        Err(e) => Err(e.to_string()),
    }
}

#[tauri::command]
pub async fn app_get_file_asset_links_by_asset(db: State<'_, AppDatabase>, asset_id: String) -> Result<Vec<FileAssetLinkRecord>, String> {
    match db.get_file_asset_links_by_asset(asset_id).await {
        Ok(links) => Ok(links),
        Err(e) => Err(e.to_string()),
    }
}

#[tauri::command]
pub async fn app_delete_file_asset_link(db: State<'_, AppDatabase>, link_id: String) -> Result<String, String> {
    match db.delete_file_asset_link(link_id).await {
        Ok(_) => Ok("File asset link deleted successfully".to_string()),
        Err(e) => Err(e.to_string()),
    }
}

#[tauri::command]
pub async fn app_delete_file_asset_links_by_entity_role(db: State<'_, AppDatabase>, entity_type: String, entity_id: String, role: String) -> Result<String, String> {
    match db.delete_file_asset_links_by_entity_role(entity_type, entity_id, role).await {
        Ok(_) => Ok("File asset links deleted successfully".to_string()),
        Err(e) => Err(e.to_string()),
    }
}

#[tauri::command]
pub async fn app_delete_file_asset_links_by_asset(db: State<'_, AppDatabase>, asset_id: String) -> Result<String, String> {
    match db.delete_file_asset_links_by_asset(asset_id).await {
        Ok(_) => Ok("File asset links deleted successfully".to_string()),
        Err(e) => Err(e.to_string()),
    }
}

// World commands
#[tauri::command]
pub async fn app_create_world(db: State<'_, AppDatabase>, world: World) -> Result<String, String> {
    db.create_world(world.clone())
        .await
        .map(|_| format!("Created world: {}", world.name.unwrap_or_default()))
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn app_get_worlds_by_book(db: State<'_, AppDatabase>, book_id: String) -> Result<Vec<WorldRecord>, String> {
    match db.get_worlds_by_book(book_id).await {
        Ok(worlds) => Ok(worlds),
        Err(e) => Err(e.to_string()),
    }
}

#[tauri::command]
pub async fn app_get_world_by_id(db: State<'_, AppDatabase>, world_id: String) -> Result<Option<WorldRecord>, String> {
    match db.get_world_by_id(world_id).await {
        Ok(world) => Ok(world),
        Err(e) => Err(e.to_string()),
    }
}

#[tauri::command]
pub async fn app_update_world(db: State<'_, AppDatabase>, world_id: String, world: World) -> Result<String, String> {
    db.update_world(world_id, world)
        .await
        .map(|_| "World updated successfully".to_string())
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn app_delete_world(db: State<'_, AppDatabase>, world_id: String) -> Result<String, String> {
    match db.delete_world(world_id).await {
        Ok(_) => Ok("World deleted successfully".to_string()),
        Err(e) => Err(e.to_string()),
    }
}

// Location commands
#[tauri::command]
pub async fn app_create_location(db: State<'_, AppDatabase>, location: Location) -> Result<String, String> {
    db.create_location(location.clone())
        .await
        .map(|_| format!("Created location: {}", location.name.unwrap_or_default()))
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn app_get_locations_by_world(db: State<'_, AppDatabase>, world_id: String) -> Result<Vec<LocationRecord>, String> {
    match db.get_locations_by_world(world_id).await {
        Ok(locations) => Ok(locations),
        Err(e) => Err(e.to_string()),
    }
}

#[tauri::command]
pub async fn app_get_locations_by_book(db: State<'_, AppDatabase>, book_id: String) -> Result<Vec<LocationRecord>, String> {
    match db.get_locations_by_book(book_id).await {
        Ok(locations) => Ok(locations),
        Err(e) => Err(e.to_string()),
    }
}

#[tauri::command]
pub async fn app_update_location(db: State<'_, AppDatabase>, location_id: String, location: Location) -> Result<String, String> {
    db.update_location(location_id, location)
        .await
        .map(|_| "Location updated successfully".to_string())
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn app_delete_location(db: State<'_, AppDatabase>, location_id: String) -> Result<String, String> {
    match db.delete_location(location_id).await {
        Ok(_) => Ok("Location deleted successfully".to_string()),
        Err(e) => Err(e.to_string()),
    }
}

// Object commands
#[tauri::command]
pub async fn app_create_object(db: State<'_, AppDatabase>, object: Object) -> Result<String, String> {
    db.create_object(object.clone())
        .await
        .map(|_| format!("Created object: {}", object.name.unwrap_or_default()))
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn app_get_objects_by_world(db: State<'_, AppDatabase>, world_id: String) -> Result<Vec<ObjectRecord>, String> {
    match db.get_objects_by_world(world_id).await {
        Ok(objects) => Ok(objects),
        Err(e) => Err(e.to_string()),
    }
}

#[tauri::command]
pub async fn app_get_objects_by_book(db: State<'_, AppDatabase>, book_id: String) -> Result<Vec<ObjectRecord>, String> {
    match db.get_objects_by_book(book_id).await {
        Ok(objects) => Ok(objects),
        Err(e) => Err(e.to_string()),
    }
}

#[tauri::command]
pub async fn app_update_object(db: State<'_, AppDatabase>, object_id: String, object: Object) -> Result<String, String> {
    db.update_object(object_id, object)
        .await
        .map(|_| "Object updated successfully".to_string())
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn app_delete_object(db: State<'_, AppDatabase>, object_id: String) -> Result<String, String> {
    match db.delete_object(object_id).await {
        Ok(_) => Ok("Object deleted successfully".to_string()),
        Err(e) => Err(e.to_string()),
    }
}

// Lore commands
#[tauri::command]
pub async fn app_create_lore(db: State<'_, AppDatabase>, lore: Lore) -> Result<String, String> {
    db.create_lore(lore.clone())
        .await
        .map(|_| format!("Created lore: {}", lore.title.unwrap_or_default()))
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn app_get_lore_by_world(db: State<'_, AppDatabase>, world_id: String) -> Result<Vec<LoreRecord>, String> {
    match db.get_lore_by_world(world_id).await {
        Ok(lore) => Ok(lore),
        Err(e) => Err(e.to_string()),
    }
}

#[tauri::command]
pub async fn app_get_lore_by_book(db: State<'_, AppDatabase>, book_id: String) -> Result<Vec<LoreRecord>, String> {
    match db.get_lore_by_book(book_id).await {
        Ok(lore) => Ok(lore),
        Err(e) => Err(e.to_string()),
    }
}

#[tauri::command]
pub async fn app_update_lore(db: State<'_, AppDatabase>, lore_id: String, lore: Lore) -> Result<String, String> {
    db.update_lore(lore_id, lore)
        .await
        .map(|_| "Lore updated successfully".to_string())
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn app_delete_lore(db: State<'_, AppDatabase>, lore_id: String) -> Result<String, String> {
    match db.delete_lore(lore_id).await {
        Ok(_) => Ok("Lore deleted successfully".to_string()),
        Err(e) => Err(e.to_string()),
    }
}

// Scene commands
#[tauri::command]
pub async fn app_create_scene(db: State<'_, AppDatabase>, scene: Scene) -> Result<String, String> {
    db.create_scene(scene.clone())
        .await
        .map(|_| format!("Created scene: {}", scene.title.unwrap_or_default()))
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn app_get_scene_by_id(db: State<'_, AppDatabase>, scene_id: String) -> Result<Option<SceneRecord>, String> {
    match db.get_scene_by_id(scene_id).await {
        Ok(scene) => Ok(scene),
        Err(e) => Err(e.to_string()),
    }
}

#[tauri::command]
pub async fn app_get_scenes_by_book(db: State<'_, AppDatabase>, book_id: String) -> Result<Vec<SceneRecord>, String> {
    match db.get_scenes_by_book(book_id).await {
        Ok(scenes) => Ok(scenes),
        Err(e) => Err(e.to_string()),
    }
}

#[tauri::command]
pub async fn app_update_scene(db: State<'_, AppDatabase>, scene_id: String, scene: Scene) -> Result<String, String> {
    db.update_scene(scene_id, scene)
        .await
        .map(|_| "Scene updated successfully".to_string())
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn app_delete_scene(db: State<'_, AppDatabase>, scene_id: String) -> Result<String, String> {
    match db.delete_scene(scene_id).await {
        Ok(_) => Ok("Scene deleted successfully".to_string()),
        Err(e) => Err(e.to_string()),
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
        .map(|_| format!("Created book: {}", book.title.as_ref().unwrap_or(&String::new())))
        .map_err(|e| {
            eprintln!("[app_create_book] Failed to create book '{}': {:?}", book.title.as_ref().unwrap_or(&String::new()), e);
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
        .map(|_| format!("Created version: {}", version.name.unwrap_or_default()))
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
        .map(|_| format!("Created chapter: {}", chapter.title.unwrap_or_default()))
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
        .map(|_| format!("Created character: {}", character.name.unwrap_or_default()))
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

// Get full filesystem path for asset
#[tauri::command]
pub async fn app_get_asset_file_path(
    app_handle: tauri::AppHandle,
    relative_path: String,
) -> Result<String, String> {
    let app_config_dir = app_handle
        .path()
        .app_config_dir()
        .map_err(|e| format!("Failed to get app config dir: {}", e))?;
    
    let full_path = app_config_dir.join(&relative_path);
    
    // Check if file exists
    if !full_path.exists() {
        return Err(format!("Asset file not found: {}", relative_path));
    }
    
    full_path
        .to_str()
        .map(|s| s.to_string())
        .ok_or_else(|| "Invalid file path".to_string())
}

// Generic query command for complex queries
#[tauri::command]
pub async fn app_surreal_query(db: State<'_, AppDatabase>, query: String) -> Result<surrealdb::Value, String> {
    match db.execute_query(query).await {
        Ok(result) => Ok(result),
        Err(e) => Err(e.to_string()),
    }
}

use serde::{Deserialize, Serialize};
use std::sync::Arc;
use surrealdb::{
    engine::local::{Db, RocksDb},
    sql::Thing as RecordId,
    Surreal,
};
use tauri::{Manager, State};
use tokio::sync::Mutex;

// Type definitions matching the frontend TypeScript interfaces

// File Asset Types
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FileRef {
    pub asset_id: String,
    pub sha256: String,
    pub role: String, // AssetRole: 'cover' | 'avatar' | 'gallery' | 'divider' | 'attachment' | 'map' | 'lore'
    pub mime: Option<String>,
    pub width: Option<i32>,
    pub height: Option<i32>,
    pub remote_id: Option<String>,
    pub remote_url: Option<String>,
    pub local_path: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FileAsset {
    pub id: String,
    pub sha256: String,
    pub ext: String,
    pub mime: String,
    pub size_bytes: i64,
    pub width: Option<i32>,
    pub height: Option<i32>,
    pub local_path: Option<String>,
    pub remote_id: Option<String>,
    pub remote_url: Option<String>,
    pub status: String, // AssetStatus: 'local_only' | 'pending_upload' | 'uploaded' | 'failed'
    pub created_at: String,
    pub updated_at: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FileAssetLink {
    pub id: String,
    pub asset_id: String,
    pub entity_type: String, // EntityType: 'book' | 'character' | 'world' | 'location' | 'object' | 'chapter' | 'divider'
    pub entity_id: String,
    pub role: String, // AssetRole
    pub sort_order: i32,
    pub tags: Option<String>,
    pub description: Option<String>,
    pub created_at: String,
    pub updated_at: String,
}

// Character Types
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Character {
    pub id: String,
    pub name: String,
    pub image: String, // Legacy field
    pub avatar_ref: Option<FileRef>,
    pub gallery_refs: Option<Vec<FileRef>>,
    pub quote: String,
    
    // Core Identity
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
    
    // Story Elements
    pub character_arc: Option<String>,
    pub internal_conflict: Option<String>,
    pub external_conflict: Option<String>,
    pub growth: Option<String>,
    pub role: Option<String>,
    pub importance: Option<String>,
    pub first_appearance: Option<String>,
    pub last_appearance: Option<String>,
    
    // Additional fields can be added as needed
    pub backstory: Option<String>,
    pub personality_type: Option<String>,
    pub created_at: String,
    pub updated_at: String,
}

// Book Types
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Book {
    pub id: String,
    pub title: String,
    pub subtitle: Option<String>,
    pub author: Option<String>,
    pub author_id: Option<String>,
    pub cover_image: Option<String>, // Legacy field
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
    pub published_status: String, // PublishedStatus: 'Published' | 'Unpublished' | 'Scheduled'
    pub publisher_link: Option<String>,
    pub print_isbn: Option<String>,
    pub ebook_isbn: Option<String>,
    pub publisher_logo: Option<String>,
    pub synopsis: String,
    pub description: Option<String>,
    
    // Sync and sharing fields
    pub is_shared: Option<bool>,
    pub rev_local: Option<String>,
    pub rev_cloud: Option<String>,
    pub sync_state: Option<String>, // SyncState: 'idle' | 'dirty' | 'pushing' | 'pulling' | 'conflict'
    pub conflict_state: Option<String>, // ConflictState: 'none' | 'needs_review' | 'blocked'
    pub updated_at: Option<i64>,
}

// Version Types
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Version {
    pub id: String,
    pub name: String,
    pub status: String, // VersionStatus: 'DRAFT' | 'IN_REVIEW' | 'FINAL'
    pub word_count: i32,
    pub created_at: String,
    pub contributor: serde_json::Value, // { name: string, avatar: string }
    
    // Sync fields
    pub rev_local: Option<String>,
    pub rev_cloud: Option<String>,
    pub sync_state: Option<String>,
    pub conflict_state: Option<String>,
    pub updated_at: Option<i64>,
}

// Chapter Types
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Chapter {
    pub id: String,
    pub title: String,
    pub position: i32,
    pub created_at: String,
    pub updated_at: String,
    pub image: Option<String>,
    
    // Plot structure references
    pub linked_plot_node_id: String,
    pub linked_act: String,
    pub linked_outline: String,
    pub linked_scenes: Vec<String>,
    
    // Content metadata
    pub total_characters: i32,
    pub total_words: i32,
    pub reading_time: Option<i32>,
    pub last_edited_by: Option<String>,
    pub last_edited_at: Option<String>,
    
    // Encryption and sync
    pub enc_scheme: Option<String>, // EncryptionScheme: 'udek' | 'bsk'
    pub content_enc: Option<String>, // base64 encrypted content
    pub content_iv: Option<String>,  // base64 IV
    pub rev_local: Option<String>,
    pub rev_cloud: Option<String>,
    pub sync_state: Option<String>,
    pub conflict_state: Option<String>,
    
    // Chapter metadata
    pub word_count: i32,
    pub has_proposals: bool,
    pub summary: Option<String>,
    pub goals: Option<String>,
    pub characters: Vec<String>, // Character IDs
    pub tags: Option<Vec<String>>,
    pub notes: Option<String>,
    pub is_complete: bool,
    
    // Status tracking
    pub status: String, // 'DRAFT' | 'IN_PROGRESS' | 'REVIEW' | 'APPROVED' | 'PUBLISHED'
    pub author_id: String,
    pub last_modified_by: String,
}

// Scene Types (simplified, now part of chapters)
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Scene {
    pub id: String,
    pub title: String,
    pub enc_scheme: String, // 'udek' | 'bsk'
    pub sync_state: String, // 'idle' | 'dirty' | 'syncing' | 'conflict'
    pub conflict_state: String, // 'none' | 'local_wins' | 'cloud_wins'
    pub updated_at: i64,
    pub word_count: i32,
    pub has_proposals: Option<bool>,
}

// Session and Auth Types
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Session {
    pub id: Option<String>,  // Changed from i64 to String to match user_id format
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
    pub id: Option<i64>,
    pub user_id: String,
    pub udek_wrap_appkey: Vec<u8>,
    pub kdf_salt: Vec<u8>,
    pub kdf_iters: i64,
    pub updated_at: i64,
}

// Database record structures with RecordId and proper relationships
#[derive(Debug, Deserialize, Serialize)]
pub struct BookRecord {
    #[allow(dead_code)]
    id: RecordId,
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
    
    // Relationships
    pub versions: Option<Vec<String>>, // Version IDs
    pub characters: Option<Vec<String>>, // Character IDs
    pub worlds: Option<Vec<String>>, // World IDs
}

#[derive(Debug, Deserialize, Serialize)]
pub struct VersionRecord {
    #[allow(dead_code)]
    id: RecordId,
    pub book_id: String, // Parent book
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
    
    // Relationships
    pub chapters: Option<Vec<String>>, // Chapter IDs
    pub plot_canvas: Option<String>, // Plot canvas data
}

#[derive(Debug, Deserialize, Serialize)]
pub struct ChapterRecord {
    #[allow(dead_code)]
    id: RecordId,
    pub book_id: String, // Parent book
    pub version_id: String, // Parent version
    pub title: String,
    pub position: i32,
    pub created_at: String,
    pub updated_at: String,
    pub image: Option<String>,
    pub linked_plot_node_id: String,
    pub linked_act: String,
    pub linked_outline: String,
    pub linked_scenes: Vec<String>,
    pub total_characters: i32,
    pub total_words: i32,
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
    pub word_count: i32,
    pub has_proposals: bool,
    pub summary: Option<String>,
    pub goals: Option<String>,
    pub characters: Vec<String>,
    pub tags: Option<Vec<String>>,
    pub notes: Option<String>,
    pub is_complete: bool,
    pub status: String,
    pub author_id: String,
    pub last_modified_by: String,
}

// World building types
#[derive(Debug, Deserialize, Serialize)]
pub struct WorldRecord {
    #[allow(dead_code)]
    id: RecordId,
    pub book_id: String, // Parent book
    pub name: String,
    pub description: Option<String>,
    pub created_at: String,
    pub updated_at: String,
    
    // Relationships
    pub locations: Option<Vec<String>>, // Location IDs
    pub objects: Option<Vec<String>>, // Object IDs
    pub lore: Option<Vec<String>>, // Lore IDs
}

#[derive(Debug, Deserialize, Serialize)]
pub struct LocationRecord {
    #[allow(dead_code)]
    id: RecordId,
    pub world_id: String, // Parent world
    pub book_id: String, // Parent book
    pub name: String,
    pub description: Option<String>,
    pub geography: Option<String>,
    pub history: Option<String>,
    pub politics: Option<String>,
    pub economy: Option<String>,
    pub culture: Option<String>,
    pub created_at: String,
    pub updated_at: String,
}

#[derive(Debug, Deserialize, Serialize)]
pub struct ObjectRecord {
    #[allow(dead_code)]
    id: RecordId,
    pub world_id: String, // Parent world
    pub book_id: String, // Parent book
    pub name: String,
    pub description: Option<String>,
    pub object_type: String, // 'artifact', 'weapon', 'tool', 'building', etc.
    pub significance: Option<String>,
    pub created_at: String,
    pub updated_at: String,
}

#[derive(Debug, Deserialize, Serialize)]
pub struct LoreRecord {
    #[allow(dead_code)]
    id: RecordId,
    pub world_id: String, // Parent world
    pub book_id: String, // Parent book
    pub title: String,
    pub content: String,
    pub lore_type: String, // 'legend', 'myth', 'history', 'religion', 'custom', etc.
    pub importance: Option<String>,
    pub created_at: String,
    pub updated_at: String,
}

// Enhanced Character record with book relationship
#[derive(Debug, Deserialize, Serialize)]
pub struct CharacterRecord {
    #[allow(dead_code)]
    id: RecordId,
    pub book_id: String, // Parent book
    pub name: String,
    pub image: String,
    pub avatar_ref: Option<FileRef>,
    pub gallery_refs: Option<Vec<FileRef>>,
    pub quote: String,
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
    pub created_at: String,
    pub updated_at: String,
}

// Database state management
pub struct AppDatabase {
    db: Surreal<Db>,
}

impl AppDatabase {
    pub async fn new(data_dir: &str) -> Result<Self, surrealdb::Error> {
        let db = Surreal::new::<RocksDb>(data_dir).await?;
        db.use_ns("authorstudio").use_db("main").await?;
        
        let app_db = AppDatabase { db };
        app_db.setup_schema().await?;
        Ok(app_db)
    }

    async fn setup_schema(&self) -> Result<(), surrealdb::Error> {
        // Define tables and indexes with proper relationships
        let schema = r#"
            -- Core content tables with relationships
            DEFINE TABLE books SCHEMAFULL;
            DEFINE FIELD title ON books TYPE string;
            DEFINE FIELD author_id ON books TYPE option<string>;
            DEFINE FIELD versions ON books TYPE option<array<string>>;
            DEFINE FIELD characters ON books TYPE option<array<string>>;
            DEFINE FIELD worlds ON books TYPE option<array<string>>;
            DEFINE FIELD created_at ON books TYPE datetime DEFAULT time::now();
            DEFINE FIELD updated_at ON books TYPE datetime DEFAULT time::now();
            DEFINE INDEX books_author ON books FIELDS author_id;
            DEFINE INDEX books_updated ON books FIELDS updated_at;

            DEFINE TABLE versions SCHEMAFULL;
            DEFINE FIELD book_id ON versions TYPE string;
            DEFINE FIELD name ON versions TYPE string;
            DEFINE FIELD status ON versions TYPE string;
            DEFINE FIELD chapters ON versions TYPE option<array<string>>;
            DEFINE FIELD plot_canvas ON versions TYPE option<string>;
            DEFINE FIELD created_at ON versions TYPE datetime DEFAULT time::now();
            DEFINE FIELD updated_at ON versions TYPE datetime DEFAULT time::now();
            DEFINE INDEX versions_book ON versions FIELDS book_id;

            DEFINE TABLE chapters SCHEMAFULL;
            DEFINE FIELD book_id ON chapters TYPE string;
            DEFINE FIELD version_id ON chapters TYPE string;
            DEFINE FIELD title ON chapters TYPE string;
            DEFINE FIELD position ON chapters TYPE int;
            DEFINE FIELD created_at ON chapters TYPE datetime DEFAULT time::now();
            DEFINE FIELD updated_at ON chapters TYPE datetime DEFAULT time::now();
            DEFINE INDEX chapters_version ON chapters FIELDS book_id, version_id;
            DEFINE INDEX chapters_position ON chapters FIELDS book_id, version_id, position;

            DEFINE TABLE characters SCHEMAFULL;
            DEFINE FIELD book_id ON characters TYPE string;
            DEFINE FIELD name ON characters TYPE string;
            DEFINE FIELD created_at ON characters TYPE datetime DEFAULT time::now();
            DEFINE FIELD updated_at ON characters TYPE datetime DEFAULT time::now();
            DEFINE INDEX characters_book ON characters FIELDS book_id;

            -- World building tables
            DEFINE TABLE worlds SCHEMAFULL;
            DEFINE FIELD book_id ON worlds TYPE string;
            DEFINE FIELD name ON worlds TYPE string;
            DEFINE FIELD description ON worlds TYPE option<string>;
            DEFINE FIELD locations ON worlds TYPE option<array<string>>;
            DEFINE FIELD objects ON worlds TYPE option<array<string>>;
            DEFINE FIELD lore ON worlds TYPE option<array<string>>;
            DEFINE FIELD created_at ON worlds TYPE datetime DEFAULT time::now();
            DEFINE FIELD updated_at ON worlds TYPE datetime DEFAULT time::now();
            DEFINE INDEX worlds_book ON worlds FIELDS book_id;

            DEFINE TABLE locations SCHEMAFULL;
            DEFINE FIELD world_id ON locations TYPE string;
            DEFINE FIELD book_id ON locations TYPE string;
            DEFINE FIELD name ON locations TYPE string;
            DEFINE FIELD description ON locations TYPE option<string>;
            DEFINE FIELD geography ON locations TYPE option<string>;
            DEFINE FIELD history ON locations TYPE option<string>;
            DEFINE FIELD politics ON locations TYPE option<string>;
            DEFINE FIELD economy ON locations TYPE option<string>;
            DEFINE FIELD culture ON locations TYPE option<string>;
            DEFINE FIELD created_at ON locations TYPE datetime DEFAULT time::now();
            DEFINE FIELD updated_at ON locations TYPE datetime DEFAULT time::now();
            DEFINE INDEX locations_world ON locations FIELDS world_id;
            DEFINE INDEX locations_book ON locations FIELDS book_id;

            DEFINE TABLE objects SCHEMAFULL;
            DEFINE FIELD world_id ON objects TYPE string;
            DEFINE FIELD book_id ON objects TYPE string;
            DEFINE FIELD name ON objects TYPE string;
            DEFINE FIELD description ON objects TYPE option<string>;
            DEFINE FIELD object_type ON objects TYPE string;
            DEFINE FIELD significance ON objects TYPE option<string>;
            DEFINE FIELD created_at ON objects TYPE datetime DEFAULT time::now();
            DEFINE FIELD updated_at ON objects TYPE datetime DEFAULT time::now();
            DEFINE INDEX objects_world ON objects FIELDS world_id;
            DEFINE INDEX objects_book ON objects FIELDS book_id;
            DEFINE INDEX objects_type ON objects FIELDS object_type;

            DEFINE TABLE lore SCHEMAFULL;
            DEFINE FIELD world_id ON lore TYPE string;
            DEFINE FIELD book_id ON lore TYPE string;
            DEFINE FIELD title ON lore TYPE string;
            DEFINE FIELD content ON lore TYPE string;
            DEFINE FIELD lore_type ON lore TYPE string;
            DEFINE FIELD importance ON lore TYPE option<string>;
            DEFINE FIELD created_at ON lore TYPE datetime DEFAULT time::now();
            DEFINE FIELD updated_at ON lore TYPE datetime DEFAULT time::now();
            DEFINE INDEX lore_world ON lore FIELDS world_id;
            DEFINE INDEX lore_book ON lore FIELDS book_id;
            DEFINE INDEX lore_type ON lore FIELDS lore_type;

            -- Auth and session tables
            DEFINE TABLE sessions SCHEMAFULL;
            DEFINE FIELD user_id ON sessions TYPE option<string>;
            DEFINE FIELD email ON sessions TYPE option<string>;
            DEFINE FIELD updated_at ON sessions TYPE datetime DEFAULT time::now();
            DEFINE INDEX sessions_user ON sessions FIELDS user_id;
            DEFINE INDEX sessions_email ON sessions FIELDS email;

            DEFINE TABLE user_keys SCHEMAFULL;
            DEFINE FIELD user_id ON user_keys TYPE string;
            DEFINE FIELD updated_at ON user_keys TYPE datetime DEFAULT time::now();
            DEFINE INDEX user_keys_user ON user_keys FIELDS user_id UNIQUE;

            -- Asset system tables
            DEFINE TABLE file_assets SCHEMAFULL;
            DEFINE FIELD sha256 ON file_assets TYPE string;
            DEFINE FIELD status ON file_assets TYPE string;
            DEFINE FIELD created_at ON file_assets TYPE datetime DEFAULT time::now();
            DEFINE FIELD updated_at ON file_assets TYPE datetime DEFAULT time::now();
            DEFINE INDEX file_assets_sha256 ON file_assets FIELDS sha256 UNIQUE;
            DEFINE INDEX file_assets_status ON file_assets FIELDS status;

            DEFINE TABLE file_asset_links SCHEMAFULL;
            DEFINE FIELD asset_id ON file_asset_links TYPE string;
            DEFINE FIELD entity_type ON file_asset_links TYPE string;
            DEFINE FIELD entity_id ON file_asset_links TYPE string;
            DEFINE FIELD role ON file_asset_links TYPE string;
            DEFINE FIELD created_at ON file_asset_links TYPE datetime DEFAULT time::now();
            DEFINE FIELD updated_at ON file_asset_links TYPE datetime DEFAULT time::now();
            DEFINE INDEX file_asset_links_entity ON file_asset_links FIELDS entity_type, entity_id;
            DEFINE INDEX file_asset_links_asset ON file_asset_links FIELDS asset_id;
        "#;

        self.db.query(schema).await?;
        Ok(())
    }
}

// Global database instance
type AppDatabaseState = Arc<Mutex<Option<AppDatabase>>>;

// Database initialization
#[tauri::command]
pub async fn init_database(data_dir: String, app_handle: tauri::AppHandle) -> Result<(), String> {
    println!("Initializing database at: {}", data_dir);
    
    match AppDatabase::new(&data_dir).await {
        Ok(db) => {
            let state: AppDatabaseState = Arc::new(Mutex::new(Some(db)));
            app_handle.manage(state);
            println!("Database initialized successfully");
            Ok(())
        }
        Err(e) => {
            eprintln!("Failed to initialize database: {}", e);
            Err(format!("Failed to initialize database: {}", e))
        }
    }
}

// Helper function to get database
async fn get_db(app_handle: &tauri::AppHandle) -> Result<AppDatabase, String> {
    let state = app_handle.state::<AppDatabaseState>();
    let db_guard = state.lock().await;
    
    match db_guard.as_ref() {
        Some(db) => {
            // We need to clone the database connection
            // For now, let's create a new connection - this should be optimized later
            drop(db_guard);
            // Return error for now, will implement proper connection sharing
            Err("Database connection sharing not implemented yet".to_string())
        }
        None => Err("Database not initialized".to_string()),
    }
}

// Book operations
#[tauri::command]
pub async fn get_user_books(user_id: String, app_handle: tauri::AppHandle) -> Result<Vec<Book>, String> {
    println!("Getting books for user: {}", user_id);
    
    let state = app_handle.state::<AppDatabaseState>();
    let db_guard = state.lock().await;
    
    if let Some(ref db) = *db_guard {
        // Query books by author_id
        let query = "SELECT * FROM books WHERE author_id = $author_id";
        match db.db.query(query).bind(("author_id", user_id.clone())).await {
            Ok(mut response) => {
                let books: Vec<Book> = response.take(0).map_err(|e| format!("Query error: {}", e))?;
                println!("Retrieved {} books for user: {}", books.len(), user_id);
                Ok(books)
            }
            Err(e) => {
                println!("Failed to get books: {}", e);
                Err(format!("Failed to get books: {}", e))
            }
        }
    } else {
        Err("Database not initialized".to_string())
    }
}

#[tauri::command]
pub async fn get_book(book_id: String, user_id: String, app_handle: tauri::AppHandle) -> Result<Option<Book>, String> {
    println!("Getting book: {} for user: {}", book_id, user_id);
    
    let state = app_handle.state::<AppDatabaseState>();
    let db_guard = state.lock().await;
    
    if let Some(ref db) = *db_guard {
        // Query specific book by ID and verify ownership
        let query = "SELECT * FROM books WHERE id = $book_id AND author_id = $author_id LIMIT 1";
        match db.db.query(query)
            .bind(("book_id", book_id.clone()))
            .bind(("author_id", user_id.clone()))
            .await {
            Ok(mut response) => {
                let book: Option<Book> = response.take(0).map_err(|e| format!("Query error: {}", e))?;
                if book.is_some() {
                    println!("Retrieved book: {} for user: {}", book_id, user_id);
                } else {
                    println!("Book not found: {} for user: {}", book_id, user_id);
                }
                Ok(book)
            }
            Err(e) => {
                println!("Failed to get book: {}", e);
                Err(format!("Failed to get book: {}", e))
            }
        }
    } else {
        Err("Database not initialized".to_string())
    }
}

#[tauri::command]
pub async fn create_book(book: Book, app_handle: tauri::AppHandle) -> Result<Book, String> {
    println!("Creating book: {}", book.title);
    
    let state = app_handle.state::<AppDatabaseState>();
    let db_guard = state.lock().await;
    
    if let Some(ref db) = *db_guard {
        // Create new book with SurrealDB
        let mut new_book = book;
        new_book.id = "".to_string(); // Will be set by SurrealDB
        new_book.updated_at = Some(chrono::Utc::now().timestamp_millis());
        
        let query = "CREATE books CONTENT $book";
        match db.db.query(query)
            .bind(("book", new_book))
            .await {
            Ok(mut response) => {
                let created_book: Option<Book> = response.take(0).map_err(|e| format!("Query error: {}", e))?;
                match created_book {
                    Some(book) => {
                        println!("Created book with ID: {}", book.id);
                        Ok(book)
                    }
                    None => Err("Failed to create book".to_string())
                }
            }
            Err(e) => {
                println!("Failed to create book: {}", e);
                Err(format!("Failed to create book: {}", e))
            }
        }
    } else {
        Err("Database not initialized".to_string())
    }
}

#[tauri::command]
pub async fn update_book(book: Book, app_handle: tauri::AppHandle) -> Result<Book, String> {
    println!("Updating book: {}", book.id);
    
    let state = app_handle.state::<AppDatabaseState>();
    let db_guard = state.lock().await;
    
    if let Some(ref db) = *db_guard {
        // Update book with SurrealDB
        let mut updated_book = book;
        updated_book.updated_at = Some(chrono::Utc::now().timestamp_millis());
        
        let book_id = updated_book.id.clone();
        let query = "UPDATE $book_id CONTENT $book";
        match db.db.query(query)
            .bind(("book_id", book_id))
            .bind(("book", updated_book))
            .await {
            Ok(mut response) => {
                let result_book: Option<Book> = response.take(0).map_err(|e| format!("Query error: {}", e))?;
                match result_book {
                    Some(book) => {
                        println!("Updated book with ID: {}", book.id);
                        Ok(book)
                    }
                    None => Err("Book not found or update failed".to_string())
                }
            }
            Err(e) => {
                println!("Failed to update book: {}", e);
                Err(format!("Failed to update book: {}", e))
            }
        }
    } else {
        Err("Database not initialized".to_string())
    }
}

#[tauri::command]
pub async fn delete_book(book_id: String, user_id: String, app_handle: tauri::AppHandle) -> Result<(), String> {
    println!("Deleting book: {} for user: {}", book_id, user_id);
    
    let state = app_handle.state::<AppDatabaseState>();
    let db_guard = state.lock().await;
    
    if let Some(ref db) = *db_guard {
        // First verify ownership before deletion
        let verify_query = "SELECT id FROM books WHERE id = $book_id AND author_id = $author_id LIMIT 1";
        match db.db.query(verify_query)
            .bind(("book_id", book_id.clone()))
            .bind(("author_id", user_id.clone()))
            .await {
            Ok(mut response) => {
                let book_exists: Option<serde_json::Value> = response.take(0).map_err(|e| format!("Query error: {}", e))?;
                if book_exists.is_none() {
                    return Err("Book not found or not owned by user".to_string());
                }
                
                // Delete the book
                let delete_query = "DELETE $book_id";
                let book_id_clone = book_id.clone();
                match db.db.query(delete_query)
                    .bind(("book_id", book_id_clone))
                    .await {
                    Ok(_) => {
                        println!("Successfully deleted book: {} for user: {}", book_id, user_id);
                        Ok(())
                    }
                    Err(e) => {
                        println!("Failed to delete book: {}", e);
                        Err(format!("Failed to delete book: {}", e))
                    }
                }
            }
            Err(e) => {
                println!("Failed to verify book ownership: {}", e);
                Err(format!("Failed to verify book ownership: {}", e))
            }
        }
    } else {
        Err("Database not initialized".to_string())
    }
}

// Session operations
#[tauri::command]
pub async fn get_session(app_handle: tauri::AppHandle) -> Result<Option<Session>, String> {
    println!("Getting current session");
    
    let state = app_handle.state::<AppDatabaseState>();
    let db_guard = state.lock().await;
    
    if let Some(ref db) = *db_guard {
        match db.db.select(("sessions", "current")).await {
            Ok(session) => {
                println!("Retrieved session from database");
                Ok(session)
            }
            Err(e) => {
                println!("Failed to get session: {}", e);
                Ok(None) // Return None if no session found rather than error
            }
        }
    } else {
        Err("Database not initialized".to_string())
    }
}

#[tauri::command]
pub async fn save_session(session: Session, app_handle: tauri::AppHandle) -> Result<(), String> {
    println!("Saving session for user: {:?}", session.user_id);
    
    let state = app_handle.state::<AppDatabaseState>();
    let db_guard = state.lock().await;
    
    if let Some(ref db) = *db_guard {
        // Always save/update the session with ID "current"
        match db.db.update::<Option<Session>>(("sessions", "current")).content(session).await {
            Ok(_) => {
                println!("Session saved successfully");
                Ok(())
            }
            Err(e) => {
                println!("Failed to save session: {}", e);
                Err(format!("Failed to save session: {}", e))
            }
        }
    } else {
        Err("Database not initialized".to_string())
    }
}

#[tauri::command]
pub async fn clear_session(app_handle: tauri::AppHandle) -> Result<(), String> {
    println!("Clearing current session");
    
    let state = app_handle.state::<AppDatabaseState>();
    let db_guard = state.lock().await;
    
    if let Some(ref db) = *db_guard {
        match db.db.delete::<Option<Session>>(("sessions", "current")).await {
            Ok(_) => {
                println!("Session cleared successfully");
                Ok(())
            }
            Err(e) => {
                println!("Failed to clear session: {}", e);
                Err(format!("Failed to clear session: {}", e))
            }
        }
    } else {
        Err("Database not initialized".to_string())
    }
}

// User keys operations
#[tauri::command]
pub async fn get_user_keys(user_id: String, app_handle: tauri::AppHandle) -> Result<Option<UserKeys>, String> {
    println!("Getting user keys for: {}", user_id);
    
    let state = app_handle.state::<AppDatabaseState>();
    let db_guard = state.lock().await;
    
    if let Some(ref db) = *db_guard {
        // Query user keys by user_id
        let query = "SELECT * FROM user_keys WHERE user_id = $user_id LIMIT 1";
        match db.db.query(query).bind(("user_id", user_id.clone())).await {
            Ok(mut response) => {
                let keys: Option<UserKeys> = response.take(0).map_err(|e| format!("Query error: {}", e))?;
                println!("Retrieved user keys for: {}", user_id);
                Ok(keys)
            }
            Err(e) => {
                println!("Failed to get user keys: {}", e);
                Ok(None) // Return None if no keys found rather than error
            }
        }
    } else {
        Err("Database not initialized".to_string())
    }
}

#[tauri::command]
pub async fn save_user_keys(user_keys: UserKeys, app_handle: tauri::AppHandle) -> Result<(), String> {
    println!("Saving user keys for: {}", user_keys.user_id);
    
    let state = app_handle.state::<AppDatabaseState>();
    let db_guard = state.lock().await;
    
    if let Some(ref db) = *db_guard {
        // Use upsert to insert or update user keys
        let query = "UPDATE user_keys SET 
            udek_wrap_appkey = $udek_wrap_appkey,
            kdf_salt = $kdf_salt, 
            kdf_iters = $kdf_iters,
            updated_at = $updated_at
            WHERE user_id = $user_id;
            IF !$RESULT {
                CREATE user_keys CONTENT {
                    user_id: $user_id,
                    udek_wrap_appkey: $udek_wrap_appkey,
                    kdf_salt: $kdf_salt,
                    kdf_iters: $kdf_iters,
                    updated_at: $updated_at
                };
            }";
        
        match db.db.query(query)
            .bind(("user_id", user_keys.user_id.clone()))
            .bind(("udek_wrap_appkey", user_keys.udek_wrap_appkey.clone()))
            .bind(("kdf_salt", user_keys.kdf_salt.clone()))
            .bind(("kdf_iters", user_keys.kdf_iters))
            .bind(("updated_at", user_keys.updated_at))
            .await {
            Ok(_) => {
                println!("User keys saved successfully");
                Ok(())
            }
            Err(e) => {
                println!("Failed to save user keys: {}", e);
                Err(format!("Failed to save user keys: {}", e))
            }
        }
    } else {
        Err("Database not initialized".to_string())
    }
}

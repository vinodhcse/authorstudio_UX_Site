use anyhow::{anyhow, Result};
use once_cell::sync::OnceCell;
use serde::{Deserialize, Serialize};
use serde_json::json;
use surrealdb::engine::local::{Db, RocksDb};
use surrealdb::Surreal;

static DB: OnceCell<Surreal<Db>> = OnceCell::new();

// ---------- Domain rows (mirror TS DAL shapes) ----------
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub struct BookRow {
    pub book_id: String,
    pub owner_user_id: String,
    pub title: String,
    pub is_shared: i64,
    pub enc_metadata: Option<Vec<u8>>, // stored as bytes
    pub enc_schema: Option<String>,
    // Access permissions
    pub is_authored: Option<i64>,    // User is the author
    pub is_editable: Option<i64>,    // User can edit
    pub is_reviewable: Option<i64>,  // User can review
    pub access_role: Option<String>, // "author", "editor", "reviewer", "reader"
    // Sync fields
    pub rev_local: Option<String>,
    pub rev_cloud: Option<String>,
    pub sync_state: String,
    pub conflict_state: String,
    pub last_local_change: Option<i64>,
    pub last_cloud_change: Option<i64>,
    pub updated_at: Option<i64>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub struct VersionRow {
    pub version_id: String,
    pub book_id: String,
    pub owner_user_id: String,
    pub title: String,
    pub description: Option<String>,
    pub is_current: i64,
    pub parent_version_id: Option<String>,
    pub branch_point: Option<String>,
    pub enc_scheme: String,
    pub has_proposals: i64,
    pub rev_local: Option<String>,
    pub rev_cloud: Option<String>,
    pub pending_ops: i64,
    pub sync_state: String,
    pub conflict_state: String,
    pub created_at: i64,
    pub updated_at: i64,
    pub content_data: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub struct ChapterRow {
    pub chapter_id: String,
    pub book_id: String,
    pub version_id: String,
    pub owner_user_id: String,
    pub title: Option<String>,
    pub order_index: Option<i64>,
    pub enc_scheme: String,
    pub content_enc: Vec<u8>,
    pub content_iv: Vec<u8>,
    pub has_proposals: i64,
    pub rev_local: Option<String>,
    pub rev_cloud: Option<String>,
    pub pending_ops: i64,
    pub sync_state: String,
    pub conflict_state: String,
    pub word_count: Option<i64>,
    pub character_count: Option<i64>,
    pub created_at: Option<i64>,
    pub updated_at: Option<i64>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub struct SceneRow {
    pub scene_id: String,
    pub book_id: String,
    pub version_id: String,
    pub chapter_id: String,
    pub owner_user_id: String,
    pub enc_scheme: String,
    pub content_enc: Vec<u8>,
    pub content_iv: Vec<u8>,
    pub has_proposals: i64,
    pub rev_local: Option<String>,
    pub rev_cloud: Option<String>,
    pub pending_ops: i64,
    pub sync_state: String,
    pub conflict_state: String,
    pub word_count: Option<i64>,
    pub title: Option<String>,
    pub updated_at: Option<i64>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub struct UserKeysRow {
    pub id: Option<i64>,
    pub user_id: String,
    pub udek_wrap_appkey: Vec<u8>,
    pub kdf_salt: Vec<u8>,
    pub kdf_iters: i64,
    pub updated_at: i64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub struct SessionRow {
    pub id: Option<i64>,
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
#[serde(rename_all = "snake_case")]
pub struct DeviceRow {
    pub id: Option<i64>,
    pub device_id: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub struct KvRow {
    pub k: String,
    pub v: Vec<u8>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub struct FileAsset {
    pub id: String,
    pub sha256: String,
    pub ext: String,
    pub mime: String,
    pub size_bytes: i64,
    pub width: Option<i64>,
    pub height: Option<i64>,
    pub local_path: Option<String>,
    pub remote_id: Option<String>,
    pub remote_url: Option<String>,
    pub status: String,
    pub created_at: String,
    pub updated_at: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub struct FileAssetLink {
    pub id: String,
    pub asset_id: String,
    pub entity_type: String,
    pub entity_id: String,
    pub role: String,
    pub sort_order: i64,
    pub tags: Option<String>,
    pub description: Option<String>,
    pub created_at: String,
    pub updated_at: String,
}

// ---------- Init & helpers ----------
pub async fn ensure_db() -> Result<&'static Surreal<Db>> {
    DB.get().ok_or_else(|| anyhow!("SurrealDB not initialized. Call surreal_init_db first."))
}

#[tauri::command]
pub async fn surreal_init_db(path: String) -> Result<(), String> {
    // Use RocksDb for persistence
    println!("surreal_init_db called with path={}", path);
    let db: Surreal<Db> = Surreal::new::<RocksDb>(path)
        .await
        .map_err(|e| format!("Failed to open SurrealDB: {e}"))?;
    
    // Use simpler namespace/database names like the reference
    db.use_ns("test").use_db("test").await.map_err(|e| e.to_string())?;

    // Basic schema ensures (schemaless tables are fine; optional indexes can be added later)
    let schema = r#"
        DEFINE TABLE book SCHEMALESS;
        DEFINE INDEX book_owner ON TABLE book FIELDS owner_user_id;

        DEFINE TABLE version SCHEMALESS;
        DEFINE INDEX ver_book ON TABLE version FIELDS book_id;

        DEFINE TABLE chapter SCHEMALESS;
        DEFINE INDEX chap_ver ON TABLE chapter FIELDS version_id;

        DEFINE TABLE session SCHEMALESS;
        DEFINE TABLE passage SCHEMALESS;
        DEFINE INDEX passage_ver ON TABLE passage FIELDS version_id;

        DEFINE TABLE scene SCHEMALESS;
        DEFINE INDEX scene_book ON TABLE scene FIELDS book_id;
        DEFINE INDEX scene_owner ON TABLE scene FIELDS owner_user_id;

        DEFINE TABLE user_keys SCHEMALESS;
        DEFINE INDEX user_keys_user ON TABLE user_keys FIELDS user_id;

        DEFINE TABLE session SCHEMALESS;
        DEFINE TABLE device SCHEMALESS;
        DEFINE TABLE kv SCHEMALESS;

        DEFINE TABLE file_assets SCHEMALESS;
        DEFINE INDEX file_assets_sha ON TABLE file_assets FIELDS sha256 UNIQUE;
        DEFINE INDEX file_assets_status ON TABLE file_assets FIELDS status;
        DEFINE TABLE file_asset_links SCHEMALESS;
        DEFINE INDEX links_entity ON TABLE file_asset_links FIELDS entity_type, entity_id;
        DEFINE INDEX links_asset ON TABLE file_asset_links FIELDS asset_id;
    "#;
    if let Err(e) = db.query(schema).await {
        eprintln!("Surreal schema init failed: {e}");
    }

    let _ = DB.set(db);
    println!("surreal_init_db: DB singleton set");
    Ok(())
}

// ---------- Generic query (compat shim) ----------
#[tauri::command]
pub async fn surreal_query(query: String, vars: Option<serde_json::Value>) -> Result<serde_json::Value, String> {
    let db = ensure_db().await.map_err(|e| e.to_string())?;
    let mut req = db.query(query);
    if let Some(v) = vars {
        req = req.bind(v);
    }
    let mut resp = req.await.map_err(|e| e.to_string())?;
    let rows: Vec<serde_json::Value> = resp.take(0).unwrap_or_default();
    Ok(serde_json::Value::Array(rows))
}

// ---------- Book commands ----------
#[tauri::command]
pub async fn book_create(row: BookRow) -> Result<(), String> {
    println!("Creating book: {:?}", row);
    let db = ensure_db().await.map_err(|e| e.to_string())?;
    
    // Begin transaction for consistency with proven pattern
    db.query("BEGIN TRANSACTION").await.map_err(|e| e.to_string())?;
    
    // Clone the row data to avoid borrowing issues
    let row_clone = row.clone();
    // Use CREATE with explicit ID like the working pattern
    let _: Option<BookRow> = db
        .create(("book", row.book_id.as_str()))
        .content(row_clone)
        .await
        .map_err(|e| e.to_string())?;
    
    // Commit transaction to ensure data is persisted
    db.query("COMMIT TRANSACTION").await.map_err(|e| e.to_string())?;
    
    // Verify the book exists after commit
    match db.query("SELECT * FROM book LIMIT 10").await {
        Ok(mut resp) => {
            let rows: Vec<serde_json::Value> = resp.take(0).unwrap_or_default();
            println!("book_create: verify rows json={}", serde_json::to_string(&rows).unwrap_or("<json error>".to_string()));
        }
        Err(e) => { println!("book_create: verify query failed: {}", e); }
    }
    Ok(())
}

#[tauri::command]
pub async fn book_get_by_user(ownerUserId: String) -> Result<Vec<BookRow>, String> {
    let db = ensure_db().await.map_err(|e| e.to_string())?;
    println!("Calling book_get_by_user with userId: {}", ownerUserId);
    // Use transaction pattern for consistency  
    db.query("BEGIN TRANSACTION").await.map_err(|e| e.to_string())?;
    let mut resp = db
        .query("SELECT * FROM book WHERE owner_user_id = $uid")
        .bind(("uid", ownerUserId))
        .await
        .map_err(|e| e.to_string())?;
    let rows: Vec<BookRow> = resp.take(0).unwrap_or_default();
    db.query("COMMIT TRANSACTION").await.map_err(|e| e.to_string())?;
    println!("book_get_by_user: found books {}", rows.len());
    
    Ok(rows)
}

// ---------- Scene commands ----------
#[tauri::command]
pub async fn scene_get(sceneId: String, ownerUserId: String) -> Result<Option<SceneRow>, String> {
    let db = ensure_db().await.map_err(|e| e.to_string())?;
    let mut resp = db
        .query("SELECT * FROM scene WHERE scene_id = $sid AND owner_user_id = $uid LIMIT 1")
    .bind(("sid", sceneId))
    .bind(("uid", ownerUserId))
        .await
        .map_err(|e| e.to_string())?;
    let rows: Vec<SceneRow> = resp.take(0).unwrap_or_default();
    Ok(rows.into_iter().next())
}

#[tauri::command]
pub async fn scenes_by_book(bookId: String, ownerUserId: String) -> Result<Vec<SceneRow>, String> {
    let db = ensure_db().await.map_err(|e| e.to_string())?;
    let mut resp = db
        .query("SELECT * FROM scene WHERE book_id = $bid AND owner_user_id = $uid")
    .bind(("bid", bookId))
    .bind(("uid", ownerUserId))
        .await
        .map_err(|e| e.to_string())?;
    let rows: Vec<SceneRow> = resp.take(0).unwrap_or_default();
    Ok(rows)
}

#[tauri::command]
pub async fn scene_put(row: SceneRow) -> Result<(), String> {
    let db = ensure_db().await.map_err(|e| e.to_string())?;
    let _: Option<SceneRow> = db
        .update(("scene", row.scene_id.as_str()))
        .merge(serde_json::to_value(&row).map_err(|e| e.to_string())?)
        .await
        .map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
pub async fn scenes_get_dirty(ownerUserId: String) -> Result<Vec<SceneRow>, String> {
    let db = ensure_db().await.map_err(|e| e.to_string())?;
    let mut resp = db
        .query("SELECT * FROM scene WHERE owner_user_id = $uid AND sync_state = 'dirty'")
    .bind(("uid", ownerUserId))
        .await
        .map_err(|e| e.to_string())?;
    let rows: Vec<SceneRow> = resp.take(0).unwrap_or_default();
    Ok(rows)
}

#[tauri::command]
pub async fn scene_mark_sync(sceneId: String, ownerUserId: String, syncState: String) -> Result<(), String> {
    let db = ensure_db().await.map_err(|e| e.to_string())?;
    db.query("UPDATE scene SET sync_state = $ss, updated_at = time::now() WHERE scene_id = $sid AND owner_user_id = $uid")
    .bind(("ss", syncState))
    .bind(("sid", sceneId))
    .bind(("uid", ownerUserId))
        .await
        .map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
pub async fn scene_mark_conflict(sceneId: String, ownerUserId: String, conflictState: String) -> Result<(), String> {
    let db = ensure_db().await.map_err(|e| e.to_string())?;
    db.query("UPDATE scene SET conflict_state = $cs, updated_at = time::now() WHERE scene_id = $sid AND owner_user_id = $uid")
    .bind(("cs", conflictState))
    .bind(("sid", sceneId))
    .bind(("uid", ownerUserId))
        .await
        .map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
pub async fn book_get(bookId: String, ownerUserId: String) -> Result<Option<BookRow>, String> {
    let db = ensure_db().await.map_err(|e| e.to_string())?;
    
    // Use transaction pattern for consistency
    db.query("BEGIN TRANSACTION").await.map_err(|e| e.to_string())?;
    let mut resp = db
        .query("SELECT * FROM book WHERE book_id = $bid AND owner_user_id = $uid LIMIT 1")
        .bind(("bid", bookId))
        .bind(("uid", ownerUserId))
        .await
        .map_err(|e| e.to_string())?;
    let rows: Vec<BookRow> = resp.take(0).unwrap_or_default();
    db.query("COMMIT TRANSACTION").await.map_err(|e| e.to_string())?;
    
    Ok(rows.into_iter().next())
}

#[tauri::command]
pub async fn book_put(row: BookRow) -> Result<(), String> {
    println!("Updating book: {:?}", row);
    let db = ensure_db().await.map_err(|e| e.to_string())?;
    
    // Begin transaction like the proven pattern
    db.query("BEGIN TRANSACTION").await.map_err(|e| e.to_string())?;
    
    // Clone the row data to avoid borrowing issues
    let row_clone = row.clone();
    // Use UPDATE with content like the working pattern
    let _: Option<BookRow> = db
        .update(("book", row.book_id.as_str()))
        .content(row_clone)
        .await
        .map_err(|e| e.to_string())?;
    
    // Commit transaction to ensure data is persisted
    db.query("COMMIT TRANSACTION").await.map_err(|e| e.to_string())?;
    
    // Verify the book exists after commit
    match db.query("SELECT * FROM book LIMIT 10").await {
        Ok(mut resp) => {
            let rows: Vec<serde_json::Value> = resp.take(0).unwrap_or_default();
            println!("book_put: verify rows json={}", serde_json::to_string(&rows).unwrap_or("<json error>".to_string()));
        }
        Err(e) => { println!("book_put: verify query failed: {}", e); }
    }
    Ok(())
}

#[tauri::command]
pub async fn book_delete(bookId: String, ownerUserId: String) -> Result<(), String> {
    let db = ensure_db().await.map_err(|e| e.to_string())?;
    
    // Use transaction pattern for consistency
    db.query("BEGIN TRANSACTION").await.map_err(|e| e.to_string())?;
    // Ensure owner matches; perform conditional delete
    db.query("DELETE book WHERE book_id = $bid AND owner_user_id = $uid")
        .bind(("bid", bookId))
        .bind(("uid", ownerUserId))
        .await
        .map_err(|e| e.to_string())?;
    db.query("COMMIT TRANSACTION").await.map_err(|e| e.to_string())?;
    
    Ok(())
}

#[tauri::command]
pub async fn book_mark_sync(bookId: String, ownerUserId: String, syncState: String) -> Result<(), String> {
    let db = ensure_db().await.map_err(|e| e.to_string())?;
    
    // Use transaction pattern for consistency
    db.query("BEGIN TRANSACTION").await.map_err(|e| e.to_string())?;
    db.query("UPDATE book SET sync_state = $ss, updated_at = time::now() WHERE book_id = $bid AND owner_user_id = $uid")
        .bind(("ss", syncState))
        .bind(("bid", bookId))
        .bind(("uid", ownerUserId))
        .await
        .map_err(|e| e.to_string())?;
    db.query("COMMIT TRANSACTION").await.map_err(|e| e.to_string())?;
    
    Ok(())
}

#[tauri::command]
pub async fn book_get_dirty(ownerUserId: String) -> Result<Vec<BookRow>, String> {
    let db = ensure_db().await.map_err(|e| e.to_string())?;
    
    // Use transaction pattern for consistency
    db.query("BEGIN TRANSACTION").await.map_err(|e| e.to_string())?;
    let mut resp = db
        .query("SELECT * FROM book WHERE owner_user_id = $uid AND sync_state = 'dirty'")
        .bind(("uid", ownerUserId))
        .await
        .map_err(|e| e.to_string())?;
    let rows: Vec<BookRow> = resp.take(0).unwrap_or_default();
    db.query("COMMIT TRANSACTION").await.map_err(|e| e.to_string())?;
    
    Ok(rows)
}

// ---------- Version commands ----------
#[tauri::command]
pub async fn version_get(versionId: String, ownerUserId: String) -> Result<Option<VersionRow>, String> {
    let db = ensure_db().await.map_err(|e| e.to_string())?;
    let mut resp = db
        .query("SELECT * FROM version WHERE version_id = $vid AND owner_user_id = $uid LIMIT 1")
    .bind(("vid", versionId))
    .bind(("uid", ownerUserId))
        .await
        .map_err(|e| e.to_string())?;
    let rows: Vec<VersionRow> = resp.take(0).unwrap_or_default();
    Ok(rows.into_iter().next())
}

#[tauri::command]
pub async fn versions_by_book(bookId: String, ownerUserId: String) -> Result<Vec<VersionRow>, String> {
    let db = ensure_db().await.map_err(|e| e.to_string())?;
    let mut resp = db
        .query("SELECT * FROM version WHERE book_id = $bid AND owner_user_id = $uid ORDER BY created_at DESC")
    .bind(("bid", bookId))
    .bind(("uid", ownerUserId))
        .await
        .map_err(|e| e.to_string())?;
    let rows: Vec<VersionRow> = resp.take(0).unwrap_or_default();
    Ok(rows)
}

// ---------- User keys commands ----------
#[tauri::command]
pub async fn user_keys_get(userId: String) -> Result<Option<UserKeysRow>, String> {
    let db = ensure_db().await.map_err(|e| e.to_string())?;
    let mut resp = db
        .query("SELECT * FROM user_keys WHERE user_id = $uid LIMIT 1")
    .bind(("uid", userId))
        .await
        .map_err(|e| e.to_string())?;
    let rows: Vec<UserKeysRow> = resp.take(0).unwrap_or_default();
    Ok(rows.into_iter().next())
}

#[tauri::command]
pub async fn user_keys_set(row: UserKeysRow) -> Result<(), String> {
    let db = ensure_db().await.map_err(|e| e.to_string())?;
    let _: Option<UserKeysRow> = db
        .update(("user_keys", row.user_id.as_str()))
        .merge(serde_json::to_value(&row).map_err(|e| e.to_string())?)
        .await
        .map_err(|e| e.to_string())?;
    Ok(())
}

// ---------- Session / Device / KV commands ----------
#[tauri::command]
pub async fn session_get() -> Result<Option<SessionRow>, String> {
    let db = ensure_db().await.map_err(|e| e.to_string())?;
    // Get the most recent session (assuming one session per device/app)
    let mut resp = db
        .query("SELECT * FROM session ORDER BY updated_at DESC LIMIT 1")
        .await
        .map_err(|e| e.to_string())?;
    let rows: Vec<SessionRow> = resp.take(0).unwrap_or_default();
    Ok(rows.into_iter().next())
}

#[tauri::command]
pub async fn session_get_by_email(email: String) -> Result<Option<SessionRow>, String> {
    let db = ensure_db().await.map_err(|e| e.to_string())?;
    let mut resp = db
        .query("SELECT * FROM session WHERE email = $email ORDER BY updated_at DESC LIMIT 1")
        .bind(("email", email))
        .await
        .map_err(|e| e.to_string())?;
    let rows: Vec<SessionRow> = resp.take(0).unwrap_or_default();
    Ok(rows.into_iter().next())
}

#[tauri::command]
pub async fn session_get_by_user_id(user_id: String) -> Result<Option<SessionRow>, String> {
    let db = ensure_db().await.map_err(|e| e.to_string())?;
    let mut resp = db
        .query("SELECT * FROM session WHERE user_id = $user_id ORDER BY updated_at DESC LIMIT 1")
        .bind(("user_id", user_id))
        .await
        .map_err(|e| e.to_string())?;
    let rows: Vec<SessionRow> = resp.take(0).unwrap_or_default();
    Ok(rows.into_iter().next())
}

#[tauri::command]
pub async fn session_upsert(data: serde_json::Value) -> Result<(), String> {
    let db = ensure_db().await.map_err(|e| e.to_string())?;
    println!("session_upsert invoked; incoming keys: {:?}", data.as_object().map(|o| o.keys().cloned().collect::<Vec<_>>()));
    
    // Begin transaction
    db.query("BEGIN TRANSACTION").await.map_err(|e| e.to_string())?;
    
    // Clear any existing sessions (only keep one session per device)
    db.query("DELETE session").await.map_err(|e| e.to_string())?;
    
    // Prepare the session data
    let mut value = data;
    if let Some(obj) = value.as_object_mut() {
        obj.insert("id".to_string(), serde_json::json!(1));
        obj.insert("updated_at".to_string(), serde_json::json!(chrono::Utc::now().timestamp_millis()));
    }
    
    // Create new session record
    let mut resp = db
        .query("CREATE session:1 CONTENT $data")
        .bind(("data", value))
        .await
        .map_err(|e| e.to_string())?;
    
    // Take the result to ensure the query executed
    let _result: Vec<serde_json::Value> = resp.take(0).unwrap_or_default();
    
    // Commit transaction to ensure data is persisted
    db.query("COMMIT TRANSACTION").await.map_err(|e| e.to_string())?;
    
    println!("session_upsert: created new session row");
    Ok(())
}

#[tauri::command]
pub async fn session_clear() -> Result<(), String> {
    let db = ensure_db().await.map_err(|e| e.to_string())?;
    db.query("DELETE session WHERE id = 1").await.map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
pub async fn session_seal() -> Result<(), String> {
    let db = ensure_db().await.map_err(|e| e.to_string())?;
    db.query("UPDATE session SET session_state = 'sealed', sealed_at = time::now(), access_exp = NONE, updated_at = time::now() WHERE id = 1")
        .await
        .map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
pub async fn session_activate(userId: String) -> Result<bool, String> {
    // Verify session belongs to user and unseal
    let db = ensure_db().await.map_err(|e| e.to_string())?;
    let mut resp = db
        .query("SELECT * FROM session WHERE id = 1 LIMIT 1")
        .await
        .map_err(|e| e.to_string())?;
    let rows: Vec<SessionRow> = resp.take(0).unwrap_or_default();
    if let Some(row) = rows.into_iter().next() {
            if row.user_id.as_deref() == Some(userId.as_str()) {
            db.query("UPDATE session SET session_state = 'active', sealed_at = NONE, updated_at = time::now() WHERE id = 1")
                .await
                .map_err(|e| e.to_string())?;
            return Ok(true);
        }
    }
    Ok(false)
}

#[tauri::command]
pub async fn device_get() -> Result<Option<DeviceRow>, String> {
    let db = ensure_db().await.map_err(|e| e.to_string())?;
    let mut resp = db.query("SELECT * FROM device WHERE id = 1 LIMIT 1").await.map_err(|e| e.to_string())?;
    let rows: Vec<DeviceRow> = resp.take(0).unwrap_or_default();
    Ok(rows.into_iter().next())
}

#[tauri::command]
pub async fn device_upsert(deviceId: String) -> Result<(), String> {
    let db = ensure_db().await.map_err(|e| e.to_string())?;
    let _: Option<DeviceRow> = db
        .update(("device", "1"))
    .merge(serde_json::json!({"id": 1, "device_id": deviceId}))
        .await
        .map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
pub async fn kv_set(k: String, v: Vec<u8>) -> Result<(), String> {
    let db = ensure_db().await.map_err(|e| e.to_string())?;
    let _: Option<KvRow> = db
        .update(("kv", k.as_str()))
        .merge(serde_json::json!({"k": k, "v": v}))
        .await
        .map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
pub async fn kv_get(k: String) -> Result<Option<Vec<u8>>, String> {
    let db = ensure_db().await.map_err(|e| e.to_string())?;
    let mut resp = db
        .query("SELECT v FROM kv WHERE k = $k LIMIT 1")
        .bind(("k", k))
        .await
        .map_err(|e| e.to_string())?;
    #[derive(Deserialize)]
    struct Row { v: Vec<u8> }
    let rows: Vec<Row> = resp.take(0).unwrap_or_default();
    Ok(rows.into_iter().next().map(|r| r.v))
}

#[tauri::command]
pub async fn kv_delete(k: String) -> Result<(), String> {
    let db = ensure_db().await.map_err(|e| e.to_string())?;
    db.query("DELETE kv WHERE k = $k").bind(("k", k)).await.map_err(|e| e.to_string())?;
    Ok(())
}

// ---------- Asset commands ----------
#[tauri::command]
pub async fn asset_create(asset: FileAsset) -> Result<(), String> {
    let db = ensure_db().await.map_err(|e| e.to_string())?;
    println!("asset_create: id={} sha256={}", asset.id, asset.sha256);
    
    // Begin transaction
    db.query("BEGIN TRANSACTION").await.map_err(|e| e.to_string())?;
    
    // Use CREATE OR UPDATE syntax for file_assets
    let query = format!("UPDATE file_assets:{} CONTENT $data", asset.id);
    let mut resp = db
        .query(query)
        .bind(("data", serde_json::to_value(&asset).map_err(|e| e.to_string())?))
        .await
        .map_err(|e| e.to_string())?;
    
    // Take the result to ensure the query executed
    let _result: Vec<serde_json::Value> = resp.take(0).unwrap_or_default();
    
    // Commit transaction to ensure data is persisted
    db.query("COMMIT TRANSACTION").await.map_err(|e| e.to_string())?;
    
    println!("asset_create: merged asset {}", asset.id);
    // Verify asset persisted
    match db.query("SELECT * FROM file_assets LIMIT 10").await {
        Ok(mut resp) => {
            let rows: Vec<serde_json::Value> = resp.take(0).unwrap_or_default();
            println!("asset_create: verify rows json={}", serde_json::to_string(&rows).unwrap_or("<json error>".to_string()));
        }
        Err(e) => { println!("asset_create: verify query failed: {}", e); }
    }
    Ok(())
}

#[tauri::command]
pub async fn asset_get(id: String) -> Result<Option<FileAsset>, String> {
    let db = ensure_db().await.map_err(|e| e.to_string())?;
    let mut resp = db
        .query("SELECT * FROM file_assets WHERE id = $id LIMIT 1")
        .bind(("id", id))
        .await
        .map_err(|e| e.to_string())?;
    let rows: Vec<FileAsset> = resp.take(0).unwrap_or_default();
    Ok(rows.into_iter().next())
}

#[tauri::command]
pub async fn asset_get_by_sha256(sha256: String) -> Result<Option<FileAsset>, String> {
    let db = ensure_db().await.map_err(|e| e.to_string())?;
    let mut resp = db
        .query("SELECT * FROM file_assets WHERE sha256 = $s LIMIT 1")
        .bind(("s", sha256))
        .await
        .map_err(|e| e.to_string())?;
    let rows: Vec<FileAsset> = resp.take(0).unwrap_or_default();
    Ok(rows.into_iter().next())
}

#[tauri::command]
pub async fn asset_update(id: String, updates: serde_json::Value) -> Result<(), String> {
    let db = ensure_db().await.map_err(|e| e.to_string())?;
    let _: Option<FileAsset> = db
        .update(("file_assets", id.as_str()))
        .merge(updates)
        .await
        .map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
pub async fn assets_by_status(status: String) -> Result<Vec<FileAsset>, String> {
    let db = ensure_db().await.map_err(|e| e.to_string())?;
    let mut resp = db
        .query("SELECT * FROM file_assets WHERE status = $st")
        .bind(("st", status))
        .await
        .map_err(|e| e.to_string())?;
    let rows: Vec<FileAsset> = resp.take(0).unwrap_or_default();
    Ok(rows)
}

#[tauri::command]
pub async fn asset_delete(id: String) -> Result<(), String> {
    let db = ensure_db().await.map_err(|e| e.to_string())?;
    db.query("DELETE file_assets WHERE id = $id").bind(("id", id)).await.map_err(|e| e.to_string())?;
    Ok(())
}

// Links
#[tauri::command]
pub async fn link_create(link: FileAssetLink) -> Result<(), String> {
    let db = ensure_db().await.map_err(|e| e.to_string())?;
    let _: Option<FileAssetLink> = db
        .update(("file_asset_links", link.id.as_str()))
        .merge(serde_json::to_value(&link).map_err(|e| e.to_string())?)
        .await
        .map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
pub async fn link_upsert(asset_id: String, entity_type: String, entity_id: String, role: String, sort_order: i64, tags: Option<String>, description: Option<String>) -> Result<String, String> {
    let db = ensure_db().await.map_err(|e| e.to_string())?;
    println!("link_upsert called with asset_id={} entity_type={} entity_id={} role={}", asset_id, entity_type, entity_id, role);
    
    // Begin transaction
    db.query("BEGIN TRANSACTION").await.map_err(|e| e.to_string())?;
    
    // Clone inputs to local variables so we can reuse them after moves
    let aid_cl = asset_id.clone();
    let et_cl = entity_type.clone();
    let eid_cl = entity_id.clone();
    let role_cl = role.clone();
    
    // Check if exists
    let mut resp = db
        .query("SELECT * FROM file_asset_links WHERE asset_id = $aid AND entity_type = $et AND entity_id = $eid AND role = $role LIMIT 1")
        .bind(("aid", aid_cl.clone()))
        .bind(("et", et_cl.clone()))
        .bind(("eid", eid_cl.clone()))
        .bind(("role", role_cl.clone()))
        .await
        .map_err(|e| e.to_string())?;
    let rows: Vec<FileAssetLink> = resp.take(0).unwrap_or_default();
    let id = if let Some(existing) = rows.into_iter().next() {
        // Update existing record
        let update_query = format!("UPDATE file_asset_links:`{}` MERGE $data", existing.id);
        let mut resp = db
            .query(update_query)
            .bind(("data", serde_json::json!({
                "sort_order": sort_order,
                "tags": tags,
                "description": description,
                "updated_at": chrono::Utc::now().to_rfc3339(),
            })))
            .await
            .map_err(|e| e.to_string())?;
        let _result: Vec<serde_json::Value> = resp.take(0).unwrap_or_default();
        existing.id
    } else {
        // Create new record
        let id = nanoid::nanoid!();
        let link = FileAssetLink {
            id: id.clone(),
            asset_id: aid_cl.clone(),
            entity_type: et_cl.clone(),
            entity_id: eid_cl.clone(),
            role: role_cl.clone(),
            sort_order,
            tags,
            description,
            created_at: chrono::Utc::now().to_rfc3339(),
            updated_at: chrono::Utc::now().to_rfc3339(),
        };
        let create_query = format!("CREATE file_asset_links:`{}` CONTENT $data", id);
        let mut resp = db
            .query(create_query)
            .bind(("data", serde_json::to_value(&link).map_err(|e| e.to_string())?))
            .await
            .map_err(|e| e.to_string())?;
        let _result: Vec<serde_json::Value> = resp.take(0).unwrap_or_default();
        id
    };
    
    // Commit transaction to ensure data is persisted
    db.query("COMMIT TRANSACTION").await.map_err(|e| e.to_string())?;
    
    // Verify link exists
    match db.query("SELECT * FROM file_asset_links LIMIT 10").await {
        Ok(mut resp) => {
            let rows: Vec<serde_json::Value> = resp.take(0).unwrap_or_default();
            println!("link_upsert: verify rows json={}", serde_json::to_string(&rows).unwrap_or("<json error>".to_string()));
        }
        Err(e) => { println!("link_upsert: verify query failed: {}", e); }
    }
    Ok(id)
}

#[tauri::command]
pub async fn links_by_entity(entity_type: String, entity_id: String) -> Result<Vec<FileAssetLink>, String> {
    let db = ensure_db().await.map_err(|e| e.to_string())?;
    let mut resp = db
        .query("SELECT * FROM file_asset_links WHERE entity_type = $et AND entity_id = $eid")
        .bind(("et", entity_type))
        .bind(("eid", entity_id))
        .await
        .map_err(|e| e.to_string())?;
    let rows: Vec<FileAssetLink> = resp.take(0).unwrap_or_default();
    Ok(rows)
}

#[tauri::command]
pub async fn links_by_entity_role(entity_type: String, entity_id: String, role: String) -> Result<Vec<FileAssetLink>, String> {
    let db = ensure_db().await.map_err(|e| e.to_string())?;
    let mut resp = db
        .query("SELECT * FROM file_asset_links WHERE entity_type = $et AND entity_id = $eid AND role = $role")
        .bind(("et", entity_type))
        .bind(("eid", entity_id))
        .bind(("role", role))
        .await
        .map_err(|e| e.to_string())?;
    let rows: Vec<FileAssetLink> = resp.take(0).unwrap_or_default();
    Ok(rows)
}

#[tauri::command]
pub async fn links_by_asset(asset_id: String) -> Result<Vec<FileAssetLink>, String> {
    let db = ensure_db().await.map_err(|e| e.to_string())?;
    let mut resp = db
        .query("SELECT * FROM file_asset_links WHERE asset_id = $aid")
        .bind(("aid", asset_id))
        .await
        .map_err(|e| e.to_string())?;
    let rows: Vec<FileAssetLink> = resp.take(0).unwrap_or_default();
    Ok(rows)
}

#[tauri::command]
pub async fn link_delete(id: String) -> Result<(), String> {
    let db = ensure_db().await.map_err(|e| e.to_string())?;
    db.query("DELETE file_asset_links WHERE id = $id").bind(("id", id)).await.map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
pub async fn links_delete_by_entity_role(entity_type: String, entity_id: String, role: String) -> Result<(), String> {
    let db = ensure_db().await.map_err(|e| e.to_string())?;
    db.query("DELETE file_asset_links WHERE entity_type = $et AND entity_id = $eid AND role = $role")
        .bind(("et", entity_type))
        .bind(("eid", entity_id))
        .bind(("role", role))
        .await
        .map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
pub async fn links_delete_by_asset(asset_id: String) -> Result<(), String> {
    let db = ensure_db().await.map_err(|e| e.to_string())?;
    db.query("DELETE file_asset_links WHERE asset_id = $aid")
        .bind(("aid", asset_id))
        .await
        .map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
pub async fn version_put(row: VersionRow) -> Result<(), String> {
    let db = ensure_db().await.map_err(|e| e.to_string())?;
    let _: Option<VersionRow> = db
        .update(("version", row.version_id.as_str()))
        .merge(serde_json::to_value(&row).map_err(|e| e.to_string())?)
        .await
        .map_err(|e| e.to_string())?;
    Ok(())
}

// ---------- Version content helpers ----------
#[tauri::command]
pub async fn version_content_get(versionId: String, ownerUserId: String) -> Result<Option<serde_json::Value>, String> {
    let db = ensure_db().await.map_err(|e| e.to_string())?;
    let mut resp = db
        .query("SELECT content_data FROM version WHERE version_id = $vid AND owner_user_id = $uid LIMIT 1")
        .bind(("vid", versionId))
        .bind(("uid", ownerUserId))
        .await
        .map_err(|e| e.to_string())?;
    #[derive(Deserialize)]
    struct Row { content_data: Option<String> }
    let rows: Vec<Row> = resp.take(0).unwrap_or_default();
    if let Some(Row { content_data: Some(s) }) = rows.into_iter().next() {
        let v: serde_json::Value = serde_json::from_str(&s).unwrap_or(json!({}));
        return Ok(Some(v));
    }
    Ok(None)
}

#[tauri::command]
pub async fn version_content_update(versionId: String, ownerUserId: String, updates: serde_json::Value) -> Result<(), String> {
    let db = ensure_db().await.map_err(|e| e.to_string())?;
    // Read existing
    let mut existing = version_content_get(versionId.clone(), ownerUserId.clone()).await.ok().flatten().unwrap_or(json!({}));
    // shallow merge
    if let (Some(map), Some(up)) = (existing.as_object_mut(), updates.as_object()) {
        for (k, v) in up.iter() { map.insert(k.clone(), v.clone()); }
    } else {
        existing = updates;
    }
    let s = existing.to_string();
    db.query("UPDATE version SET content_data = $cd, updated_at = time::now() WHERE version_id = $vid AND owner_user_id = $uid")
        .bind(("cd", s))
        .bind(("vid", versionId))
        .bind(("uid", ownerUserId))
        .await
        .map_err(|e| e.to_string())?;
    Ok(())
}

// ---------- Chapter commands ----------
#[tauri::command]
pub async fn chapter_get(chapterId: String, ownerUserId: String) -> Result<Option<ChapterRow>, String> {
    let db = ensure_db().await.map_err(|e| e.to_string())?;
    let mut resp = db
        .query("SELECT * FROM chapter WHERE chapter_id = $cid AND owner_user_id = $uid LIMIT 1")
    .bind(("cid", chapterId))
    .bind(("uid", ownerUserId))
        .await
        .map_err(|e| e.to_string())?;
    let rows: Vec<ChapterRow> = resp.take(0).unwrap_or_default();
    Ok(rows.into_iter().next())
}

#[tauri::command]
pub async fn chapter_put(row: ChapterRow) -> Result<(), String> {
    let db = ensure_db().await.map_err(|e| e.to_string())?;
    let _: Option<ChapterRow> = db
        .update(("chapter", row.chapter_id.as_str()))
        .merge(serde_json::to_value(&row).map_err(|e| e.to_string())?)
        .await
        .map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
pub async fn chapters_by_version(bookId: String, versionId: String, ownerUserId: String) -> Result<Vec<ChapterRow>, String> {
    let db = ensure_db().await.map_err(|e| e.to_string())?;
    let mut resp = db
        .query("SELECT * FROM chapter WHERE book_id = $bid AND version_id = $vid AND owner_user_id = $uid ORDER BY order_index ASC")
    .bind(("bid", bookId))
    .bind(("vid", versionId))
    .bind(("uid", ownerUserId))
        .await
        .map_err(|e| e.to_string())?;
    let rows: Vec<ChapterRow> = resp.take(0).unwrap_or_default();
    Ok(rows)
}

#[tauri::command]
pub async fn chapter_mark_sync(chapterId: String, ownerUserId: String, syncState: String) -> Result<(), String> {
    let db = ensure_db().await.map_err(|e| e.to_string())?;
    db.query("UPDATE chapter SET sync_state = $ss, updated_at = time::now() WHERE chapter_id = $cid AND owner_user_id = $uid")
    .bind(("ss", syncState))
    .bind(("cid", chapterId))
    .bind(("uid", ownerUserId))
        .await
        .map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
pub async fn chapter_mark_conflict(chapterId: String, ownerUserId: String, conflictState: String) -> Result<(), String> {
    let db = ensure_db().await.map_err(|e| e.to_string())?;
    db.query("UPDATE chapter SET conflict_state = $cs, updated_at = time::now() WHERE chapter_id = $cid AND owner_user_id = $uid")
    .bind(("cs", conflictState))
    .bind(("cid", chapterId))
    .bind(("uid", ownerUserId))
        .await
        .map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
pub async fn chapters_get_dirty(ownerUserId: String) -> Result<Vec<ChapterRow>, String> {
    let db = ensure_db().await.map_err(|e| e.to_string())?;
    let mut resp = db
        .query("SELECT * FROM chapter WHERE owner_user_id = $uid AND sync_state = 'dirty'")
    .bind(("uid", ownerUserId))
        .await
        .map_err(|e| e.to_string())?;
    let rows: Vec<ChapterRow> = resp.take(0).unwrap_or_default();
    Ok(rows)
}

// Helper command to get config directory
#[tauri::command]
pub async fn get_config_dir() -> Result<String, String> {
    use std::env;
    
    // Try different approaches to get a suitable directory
    let config_path = if let Ok(app_data) = env::var("APPDATA") {
        std::path::PathBuf::from(app_data).join("AuthorStudio")
    } else if let Ok(home) = env::var("HOME") {
        std::path::PathBuf::from(home).join(".config").join("AuthorStudio")
    } else {
        std::path::PathBuf::from(".").join("config")
    };
    
    Ok(config_path.to_string_lossy().to_string())
}

// Helper commands for validation
#[tauri::command]
pub async fn asset_list_all() -> Result<Vec<serde_json::Value>, String> {
    let db = ensure_db().await.map_err(|e| e.to_string())?;
    let mut resp = db
        .query("SELECT * FROM file_assets LIMIT 100")
        .await
        .map_err(|e| e.to_string())?;
    let rows: Vec<serde_json::Value> = resp.take(0).unwrap_or_default();
    Ok(rows)
}

#[tauri::command]
pub async fn link_list_all() -> Result<Vec<serde_json::Value>, String> {
    let db = ensure_db().await.map_err(|e| e.to_string())?;
    let mut resp = db
        .query("SELECT * FROM file_asset_links LIMIT 100")
        .await
        .map_err(|e| e.to_string())?;
    let rows: Vec<serde_json::Value> = resp.take(0).unwrap_or_default();
    Ok(rows)
}

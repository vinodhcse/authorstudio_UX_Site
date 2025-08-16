use serde::{Deserialize, Serialize};
use std::sync::Arc;
use surrealdb::{
    engine::local::{Db, RocksDb},
    sql::Thing as RecordId,
    Surreal,
};
use tauri::{Manager, State};
use tokio::sync::Mutex;

// Data structures
#[derive(Debug, Deserialize, Serialize)]
pub struct TestRecord {
    #[allow(dead_code)]
    id: RecordId,
}

#[derive(Debug, Deserialize, Serialize)]
pub struct TestPerson {
    title: String,
    name: String,
    marketing: bool,
}

#[derive(Debug, Deserialize, Serialize)]
pub struct TestPersonRecord {
    #[allow(dead_code)]
    id: RecordId,
    title: String,
    name: String,
    marketing: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TestBook {
    pub title: String,
    pub author: String,
}

#[derive(Debug, Deserialize, Serialize)]
pub struct TestBookRecord {
    #[allow(dead_code)]
    id: RecordId,
    title: String,
    author: String,
}

// Database implementation
pub struct TestDatabase {
    db: Arc<Mutex<Surreal<Db>>>,
}

impl TestDatabase {
    pub async fn new(app_handle: tauri::AppHandle) -> Result<Self, String> {
        let app_data_dir = app_handle.path().app_data_dir().map_err(|e| e.to_string())?;
        let db_path = app_data_dir.join("test_db").join("test_persistent.db");

        // Create parent directories
        if let Some(parent) = db_path.parent() {
            std::fs::create_dir_all(parent).map_err(|e| e.to_string())?;
        }

        println!("Creating test database at: {:?}", db_path);
        
        let db = Surreal::new::<RocksDb>(db_path).await.map_err(|e| e.to_string())?;

        // Initialize database with simple namespace/database names
        db.use_ns("test").use_db("test").await.map_err(|e| e.to_string())?;

        Ok(Self {
            db: Arc::new(Mutex::new(db)),
        })
    }

    // Person operations
    pub async fn create_person(
        &self,
        title: String,
        name: String,
    ) -> Result<Option<TestRecord>, surrealdb::Error> {
        let created = {
            let db = self.db.lock().await;
            let res = db
                .create("person")
                .content(TestPerson {
                    title,
                    name,
                    marketing: true,
                })
                .await?;
            // Ensure the transaction is flushed
            db.query("COMMIT TRANSACTION").await?;
            res
        };
        Ok(created)
    }

    pub async fn get_people(&self) -> Result<Vec<TestPersonRecord>, surrealdb::Error> {
        let people = {
            let db = self.db.lock().await;
            // Force a new transaction
            db.query("BEGIN TRANSACTION").await?;
            let result: Vec<TestPersonRecord> = db.query("SELECT * FROM person").await?.take(0)?;
            // End transaction
            db.query("COMMIT TRANSACTION").await?;
            result
        };
        Ok(people)
    }

    pub async fn delete_all_people(&self) -> Result<(), surrealdb::Error> {
        {
            let db = self.db.lock().await;
            db.query("DELETE person").await?;
            // Ensure the transaction is flushed
            db.query("COMMIT TRANSACTION").await?;
        };
        Ok(())
    }

    // Book operations
    pub async fn create_book(
        &self,
        title: String,
        author: String,
    ) -> Result<Option<TestRecord>, surrealdb::Error> {
        let created = {
            let db = self.db.lock().await;
            let res = db
                .create("book")
                .content(TestBook {
                    title,
                    author,
                })
                .await?;
            // Ensure the transaction is flushed
            db.query("COMMIT TRANSACTION").await?;
            res
        };
        Ok(created)
    }

    pub async fn get_books(&self) -> Result<Vec<TestBookRecord>, surrealdb::Error> {
        let books = {
            let db = self.db.lock().await;
            // Force a new transaction
            db.query("BEGIN TRANSACTION").await?;
            let result: Vec<TestBookRecord> = db.query("SELECT * FROM book").await?.take(0)?;
            // End transaction
            db.query("COMMIT TRANSACTION").await?;
            result
        };
        Ok(books)
    }

    pub async fn delete_all_books(&self) -> Result<(), surrealdb::Error> {
        {
            let db = self.db.lock().await;
            db.query("DELETE book").await?;
            // Ensure the transaction is flushed
            db.query("COMMIT TRANSACTION").await?;
        };
        Ok(())
    }
}

// Tauri commands
#[tauri::command]
pub async fn test_create_person(
    db: State<'_, TestDatabase>,
    title: String,
    name: String,
) -> Result<String, String> {
    db.create_person(title, name.clone())
        .await
        .map(|_| format!("Created person: {}", name))
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn test_get_people(db: State<'_, TestDatabase>) -> Result<Vec<TestPersonRecord>, String> {
    match db.get_people().await {
        Ok(people) => Ok(people),
        Err(e) => Err(e.to_string()),
    }
}

#[tauri::command]
pub async fn test_delete_all_people(db: State<'_, TestDatabase>) -> Result<String, String> {
    match db.delete_all_people().await {
        Ok(_) => Ok("All people deleted successfully".to_string()),
        Err(e) => Err(e.to_string()),
    }
}

#[tauri::command]
pub async fn test_create_book(
    db: State<'_, TestDatabase>,
    title: String,
    author: String,
) -> Result<String, String> {
    db.create_book(title.clone(), author)
        .await
        .map(|_| format!("Created book: {}", title))
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn test_get_books(db: State<'_, TestDatabase>) -> Result<Vec<TestBookRecord>, String> {
    match db.get_books().await {
        Ok(books) => Ok(books),
        Err(e) => Err(e.to_string()),
    }
}

#[tauri::command]
pub async fn test_delete_all_books(db: State<'_, TestDatabase>) -> Result<String, String> {
    match db.delete_all_books().await {
        Ok(_) => Ok("All books deleted successfully".to_string()),
        Err(e) => Err(e.to_string()),
    }
}

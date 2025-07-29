use std::collections::HashMap;
use std::sync::Mutex;
use serde::{Deserialize, Serialize};
use tauri::{
    command, AppHandle, Manager, State, WebviewWindowBuilder,
    WindowEvent, Emitter,
};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct WindowPosition {
    pub x: f64,
    pub y: f64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct WindowSize {
    pub width: f64,
    pub height: f64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ToolWindow {
    pub id: String,
    pub tool_name: String,
    pub book_id: String,
    pub version_id: String,
    pub docked: bool,
    pub visible: bool,
    pub last_position: WindowPosition,
    pub last_size: WindowSize,
    pub window_label: String,
    pub icon_path: Option<String>,
    pub title: String,
}

pub type WindowRegistry = Mutex<HashMap<String, HashMap<String, ToolWindow>>>;

pub fn get_book_version_key(book_id: &str, version_id: &str) -> String {
    format!("{}:{}", book_id, version_id)
}

pub fn get_window_label(book_id: &str, version_id: &str, tool_name: &str) -> String {
    format!("{}-{}-{}", book_id, version_id, tool_name)
}

pub fn get_tool_route(tool_name: &str) -> String {
    match tool_name {
        "name-generator" => "/tool/name-generator".to_string(),
        "plot-assistant" => "/tool/plot-assistant".to_string(),
        "character-tracker" => "/tool/character-tracker".to_string(),
        "world-builder" => "/tool/world-builder".to_string(),
        "timeline" => "/tool/timeline".to_string(),
        _ => format!("/tool/{}", tool_name),
    }
}

pub fn get_tool_title(tool_name: &str) -> String {
    match tool_name {
        "name-generator" => "Name Generator".to_string(),
        "plot-assistant" => "Plot Assistant".to_string(),
        "character-tracker" => "Character Tracker".to_string(),
        "world-builder" => "World Builder".to_string(),
        "timeline" => "Timeline".to_string(),
        _ => tool_name.replace("-", " ").to_string(),
    }
}

#[command]
pub async fn open_tool_window(
    app: AppHandle,
    registry: State<'_, WindowRegistry>,
    book_id: String,
    version_id: String,
    tool_name: String,
    position: WindowPosition,
    size: WindowSize,
    theme: Option<String>,
) -> Result<ToolWindow, String> {
    let window_label = get_window_label(&book_id, &version_id, &tool_name);
    let book_version_key = get_book_version_key(&book_id, &version_id);
    
    // Check if window already exists
    if let Some(existing_window) = app.get_webview_window(&window_label) {
        // If window exists but is hidden, show it
        existing_window.show().map_err(|e| e.to_string())?;
        existing_window.unminimize().map_err(|e| e.to_string())?;
        existing_window.set_focus().map_err(|e| e.to_string())?;
        
        // Update registry
        let mut registry_guard = registry.lock().unwrap();
        let book_windows = registry_guard.entry(book_version_key.clone()).or_insert_with(HashMap::new);
        
        if let Some(tool_window) = book_windows.get_mut(&tool_name) {
            tool_window.visible = true;
            tool_window.docked = false;
            return Ok(tool_window.clone());
        }
    }

    // Create new window
    let route = get_tool_route(&tool_name);
    let title = get_tool_title(&tool_name);
    
    println!("Creating tool window - tool_name: {}, route: {}, title: {}", tool_name, route, title);
    
    // Get the main window to set as parent
    let main_window = app.get_webview_window("main");

    println!("New Url: {:?}", tauri::WebviewUrl::App(route.parse().unwrap()));
    
    let mut window_builder = WebviewWindowBuilder::new(
        &app,
        &window_label,
        tauri::WebviewUrl::App(format!("/#{}?tool={}&bookId={}&versionId={}", route, tool_name, book_id, version_id).parse().unwrap()),
    )
    .title(&title)
    .inner_size(size.width, size.height)
    .position(position.x, position.y)
    .resizable(true)
    .minimizable(true)
    .maximizable(true)
    .closable(true)
    .decorations(true)
    .always_on_top(false)
    .content_protected(false);
    
    // Set parent if main window exists
    if let Some(parent_window) = main_window {
        window_builder = window_builder.parent(&parent_window).map_err(|e| e.to_string())?;
    }
    
    let webview_window = window_builder.build().map_err(|e| e.to_string())?;

    // Set context data for the child window
    let theme_value = theme.unwrap_or_else(|| "dark".to_string());
    let context_script = format!(
        r#"
        // Set context data
        window.__BOOK_CONTEXT__ = {{ bookId: '{}', versionId: '{}', toolName: '{}' }};
        window.__THEME__ = '{}';
        console.log('Tool window context set:', window.__BOOK_CONTEXT__);
        console.log('Tool window theme set:', window.__THEME__);
        
        // Apply theme immediately to document
        function applyTheme() {{
            if ('{}' === 'dark') {{
                document.documentElement.classList.add('dark');
                document.body.classList.add('dark');
            }} else {{
                document.documentElement.classList.remove('dark');
                document.body.classList.remove('dark');
            }}
            console.log('Tool window theme applied:', '{}');
        }}
        
        // Apply theme immediately
        applyTheme();
        
        // Also apply when DOM is ready
        if (document.readyState === 'loading') {{
            document.addEventListener('DOMContentLoaded', applyTheme);
        }}
        
        // And when window loads
        window.addEventListener('load', applyTheme);
        "#,
        book_id, version_id, tool_name, theme_value, theme_value, theme_value
    );
    
    webview_window.eval(&context_script).map_err(|e| e.to_string())?;

    let tool_window = ToolWindow {
        id: format!("{}-{}-{}", book_id, version_id, tool_name),
        tool_name: tool_name.clone(),
        book_id: book_id.clone(),
        version_id: version_id.clone(),
        docked: false,
        visible: true,
        last_position: position,
        last_size: size,
        window_label: window_label.clone(),
        icon_path: None,
        title,
    };

    // Register window
    let mut registry_guard = registry.lock().unwrap();
    let book_windows = registry_guard.entry(book_version_key.clone()).or_insert_with(HashMap::new);
    book_windows.insert(tool_name.clone(), tool_window.clone());
    drop(registry_guard); // Release the lock

    // Setup window event handlers
    let app_handle = app.clone();
    let tool_name_clone = tool_name.clone();
    let book_id_clone = book_id.clone();
    let version_id_clone = version_id.clone();

    webview_window.on_window_event(move |event| {
        match event {
            WindowEvent::CloseRequested { .. } => {
                if let Some(registry) = app_handle.try_state::<WindowRegistry>() {
                    let book_version_key = get_book_version_key(&book_id_clone, &version_id_clone);
                    let mut registry_guard = registry.lock().unwrap();
                    if let Some(book_windows) = registry_guard.get_mut(&book_version_key) {
                        // Get the window data before removing it
                        if let Some(tool_window) = book_windows.get(&tool_name_clone) {
                            let tool_window_clone = tool_window.clone();
                            
                            // Remove from registry
                            book_windows.remove(&tool_name_clone);
                            if book_windows.is_empty() {
                                registry_guard.remove(&book_version_key);
                            }
                            
                            // Drop the lock before emitting event
                            drop(registry_guard);
                            
                            // Emit close event to frontend
                            if let Err(e) = app_handle.emit("tool-window-closed", &tool_window_clone) {
                                eprintln!("Failed to emit tool-window-closed event: {}", e);
                            } else {
                                println!("Emitted tool-window-closed event for: {}", tool_window_clone.id);
                            }
                        }
                    }
                }
            }
            // Handle focus events to detect minimize/restore
            WindowEvent::Focused(focused) => {
                if !focused {
                    // Window lost focus, check if it's minimized
                    if let Some(window) = app_handle.get_webview_window(&get_window_label(&book_id_clone, &version_id_clone, &tool_name_clone)) {
                        if let Ok(is_minimized) = window.is_minimized() {
                            if is_minimized {
                                // Check if already docked to prevent duplicate events
                                let mut should_dock = false;
                                if let Some(registry) = app_handle.try_state::<WindowRegistry>() {
                                    let book_version_key = get_book_version_key(&book_id_clone, &version_id_clone);
                                    let registry_guard = registry.lock().unwrap();
                                    if let Some(book_windows) = registry_guard.get(&book_version_key) {
                                        if let Some(tool_window) = book_windows.get(&tool_name_clone) {
                                            should_dock = !tool_window.docked; // Only dock if not already docked
                                        }
                                    }
                                }
                                
                                if should_dock {
                                    // Hide the window completely to prevent taskbar presence
                                    if let Err(e) = window.hide() {
                                        eprintln!("Failed to hide minimized window: {}", e);
                                    }
                                    
                                    // Window was minimized via system button, mark as docked
                                    if let Some(registry) = app_handle.try_state::<WindowRegistry>() {
                                        let book_version_key = get_book_version_key(&book_id_clone, &version_id_clone);
                                        let mut registry_guard = registry.lock().unwrap();
                                        if let Some(book_windows) = registry_guard.get_mut(&book_version_key) {
                                            if let Some(tool_window) = book_windows.get_mut(&tool_name_clone) {
                                                tool_window.docked = true;
                                                tool_window.visible = false;
                                                println!("Window {} minimized via system button, marked as docked", tool_name_clone);
                                                
                                                // Emit event to frontend to notify of dock state change
                                                if let Err(e) = app_handle.emit("tool-window-docked", &tool_window.clone()) {
                                                    eprintln!("Failed to emit tool-window-docked event: {}", e);
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
            WindowEvent::Moved(position) => {
                if let Some(registry) = app_handle.try_state::<WindowRegistry>() {
                    let book_version_key = get_book_version_key(&book_id_clone, &version_id_clone);
                    let mut registry_guard = registry.lock().unwrap();
                    if let Some(book_windows) = registry_guard.get_mut(&book_version_key) {
                        if let Some(tool_window) = book_windows.get_mut(&tool_name_clone) {
                            tool_window.last_position = WindowPosition {
                                x: position.x as f64,
                                y: position.y as f64,
                            };
                        }
                    }
                }
            }
            WindowEvent::Resized(size) => {
                if let Some(registry) = app_handle.try_state::<WindowRegistry>() {
                    let book_version_key = get_book_version_key(&book_id_clone, &version_id_clone);
                    let mut registry_guard = registry.lock().unwrap();
                    if let Some(book_windows) = registry_guard.get_mut(&book_version_key) {
                        if let Some(tool_window) = book_windows.get_mut(&tool_name_clone) {
                            tool_window.last_size = WindowSize {
                                width: size.width as f64,
                                height: size.height as f64,
                            };
                        }
                    }
                }
            }
            _ => {}
        }
    });

    Ok(tool_window)
}

#[command]
pub async fn minimize_tool_window(
    app: AppHandle,
    registry: State<'_, WindowRegistry>,
    book_id: String,
    version_id: String,
    tool_name: String,
) -> Result<(), String> {
    let window_label = get_window_label(&book_id, &version_id, &tool_name);
    let book_version_key = get_book_version_key(&book_id, &version_id);
    println!("Minimizing tool window: book_id={}, version_id={}, tool_name={}", book_id, version_id, tool_name);
    if let Some(window) = app.get_webview_window(&window_label) {
        // Get current position and size before hiding
        let position = window.outer_position().map_err(|e| e.to_string())?;
        let size = window.outer_size().map_err(|e| e.to_string())?;
        println!("Current position: {:?}, size: {:?}", position, size);
        // Update registry with current position/size
        let mut registry_guard = registry.lock().unwrap();
        if let Some(book_windows) = registry_guard.get_mut(&book_version_key) {
            println!("Updating registry for book version key: {}", book_version_key);
            if let Some(tool_window) = book_windows.get_mut(&tool_name) {
                tool_window.last_position = WindowPosition {
                    x: position.x as f64,
                    y: position.y as f64,
                };
                tool_window.last_size = WindowSize {
                    width: size.width as f64,
                    height: size.height as f64,
                };
                tool_window.docked = true;
                tool_window.visible = false;
                
                // Emit event to frontend
                if let Err(e) = app.emit("tool-window-docked", &tool_window.clone()) {
                    eprintln!("Failed to emit tool-window-docked event: {}", e);
                }
            }
        }

        window.hide().map_err(|e| e.to_string())?;
    }

    Ok(())
}

#[command]
pub async fn restore_tool_window(
    app: AppHandle,
    registry: State<'_, WindowRegistry>,
    book_id: String,
    version_id: String,
    tool_name: String,
    position: WindowPosition,
    size: WindowSize,
) -> Result<(), String> {
    let window_label = get_window_label(&book_id, &version_id, &tool_name);
    let book_version_key = get_book_version_key(&book_id, &version_id);
    println!("Restoring tool window: book_id={}, version_id={}, tool_name={}", book_id, version_id, tool_name);
    if let Some(window) = app.get_webview_window(&window_label) {
        // Restore position and size
        window.set_position(tauri::Position::Physical(tauri::PhysicalPosition {
            x: position.x as i32,
            y: position.y as i32,
        })).map_err(|e| e.to_string())?;
        
        window.set_size(tauri::Size::Physical(tauri::PhysicalSize {
            width: size.width as u32,
            height: size.height as u32,
        })).map_err(|e| e.to_string())?;

        window.show().map_err(|e| e.to_string())?;
        window.unminimize().map_err(|e| e.to_string())?;
        window.set_focus().map_err(|e| e.to_string())?;

        // Update registry
        let mut registry_guard = registry.lock().unwrap();
        if let Some(book_windows) = registry_guard.get_mut(&book_version_key) {
            if let Some(tool_window) = book_windows.get_mut(&tool_name) {
                tool_window.docked = false;
                tool_window.visible = true;
                tool_window.last_position = position;
                tool_window.last_size = size;
                
                // Emit event to frontend
                if let Err(e) = app.emit("tool-window-undocked", &tool_window.clone()) {
                    eprintln!("Failed to emit tool-window-undocked event: {}", e);
                }
            }
        }
    }

    Ok(())
}

#[command]
pub async fn close_tool_window(
    app: AppHandle,
    registry: State<'_, WindowRegistry>,
    book_id: String,
    version_id: String,
    tool_name: String,
) -> Result<(), String> {
    let window_label = get_window_label(&book_id, &version_id, &tool_name);
    let book_version_key = get_book_version_key(&book_id, &version_id);

    if let Some(window) = app.get_webview_window(&window_label) {
        window.close().map_err(|e| e.to_string())?;
    }

    // Remove from registry
    let mut registry_guard = registry.lock().unwrap();
    if let Some(book_windows) = registry_guard.get_mut(&book_version_key) {
        if let Some(tool_window) = book_windows.remove(&tool_name) {
            // Emit close event to frontend
            if let Err(e) = app.emit("tool-window-closed", &tool_window) {
                eprintln!("Failed to emit tool-window-closed event: {}", e);
            }
        }
        if book_windows.is_empty() {
            registry_guard.remove(&book_version_key);
        }
    }

    Ok(())
}

#[command]
pub async fn get_tool_windows_state(
    registry: State<'_, WindowRegistry>,
    book_id: String,
    version_id: String,
) -> Result<Vec<ToolWindow>, String> {
    let book_version_key = get_book_version_key(&book_id, &version_id);
    let registry_guard = registry.lock().unwrap();
    
    if let Some(book_windows) = registry_guard.get(&book_version_key) {
        Ok(book_windows.values().cloned().collect())
    } else {
        Ok(vec![])
    }
}

#[command]
pub async fn close_all_tools(
    app: AppHandle,
    registry: State<'_, WindowRegistry>,
    book_id: String,
    version_id: String,
) -> Result<(), String> {
    let book_version_key = get_book_version_key(&book_id, &version_id);
    
    let tool_names: Vec<String> = {
        let registry_guard = registry.lock().unwrap();
        registry_guard
            .get(&book_version_key)
            .map(|book_windows| book_windows.keys().cloned().collect())
            .unwrap_or_default()
    };

    for tool_name in tool_names {
        let window_label = get_window_label(&book_id, &version_id, &tool_name);
        if let Some(window) = app.get_webview_window(&window_label) {
            let _ = window.close();
        }
    }

    // Clear registry for this book/version
    let mut registry_guard = registry.lock().unwrap();
    registry_guard.remove(&book_version_key);

    Ok(())
}

#[command]
pub async fn list_tool_windows(
    registry: State<'_, WindowRegistry>,
    book_id: String,
    version_id: String,
) -> Result<Vec<ToolWindow>, String> {
    let book_version_key = get_book_version_key(&book_id, &version_id);
    let registry_guard = registry.lock().unwrap();
    
    let windows = registry_guard
        .get(&book_version_key)
        .map(|book_windows| book_windows.values().cloned().collect())
        .unwrap_or_default();

    Ok(windows)
}

#[command]
pub async fn broadcast_theme_change(
    app: AppHandle,
    theme: String,
) -> Result<(), String> {
    // Broadcast theme change to all tool windows
    println!("Broadcasting theme change: {}", theme);
    if let Err(e) = app.emit("theme-changed", &theme) {
        eprintln!("Failed to emit theme-changed event: {}", e);
    }
    Ok(())
}

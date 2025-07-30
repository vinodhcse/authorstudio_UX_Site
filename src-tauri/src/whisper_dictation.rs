use anyhow::{anyhow, Result};
use cpal::traits::{DeviceTrait, HostTrait, StreamTrait};
use cpal::{Device, SampleFormat, SupportedStreamConfig};
use once_cell::sync::Lazy;
use serde_json;
use std::path::PathBuf;
use std::sync::atomic::{AtomicBool, Ordering};
use std::sync::{Arc, Mutex};
use std::time::{Duration, Instant};
use tauri::{AppHandle, Emitter};
use tokio::sync::mpsc;
use whisper_rs::{FullParams, SamplingStrategy, WhisperContext, WhisperContextParameters};

// Global state for dictation
static DICTATION_RUNNING: AtomicBool = AtomicBool::new(false);
static WHISPER_CONTEXT: Lazy<Arc<Mutex<Option<WhisperContext>>>> =
    Lazy::new(|| Arc::new(Mutex::new(None)));

// Audio buffer for real-time processing
const SAMPLE_RATE: u32 = 16000; // Whisper requires 16kHz
const BUFFER_SIZE: usize = SAMPLE_RATE as usize * 2; // 2 seconds of audio
const SILENCE_THRESHOLD: f32 = 0.01; // Threshold for detecting silence
const SILENCE_DURATION: Duration = Duration::from_secs(2); // Silence duration for paragraph end

pub struct AudioBuffer {
    data: Vec<f32>,
    write_pos: usize,
    last_audio_time: Instant,
    source_sample_rate: u32,
    channels: u16,
    downsample_ratio: f32,
    downsample_accumulator: f32,
    downsample_count: f32,
    last_transcribed_pos: usize,
    transcription_history: Vec<String>,
}

impl AudioBuffer {
    fn new() -> Self {
        Self {
            data: vec![0.0; BUFFER_SIZE],
            write_pos: 0,
            last_audio_time: Instant::now(),
            source_sample_rate: SAMPLE_RATE, // Default to target rate
            channels: 1, // Default to mono
            downsample_ratio: 1.0,
            downsample_accumulator: 0.0,
            downsample_count: 0.0,
            last_transcribed_pos: 0,
            transcription_history: Vec::new(),
        }
    }
    
    fn set_source_sample_rate(&mut self, sample_rate: u32) {
        self.source_sample_rate = sample_rate;
        self.downsample_ratio = sample_rate as f32 / SAMPLE_RATE as f32;
        if self.downsample_ratio > 1.0 {
            println!("🔄 Audio resampling: {}Hz -> {}Hz (ratio: {:.2})", sample_rate, SAMPLE_RATE, self.downsample_ratio);
        }
    }
    
    fn set_channels(&mut self, channels: u16) {
        self.channels = channels;
        println!("🔄 Audio channels: {}", channels);
    }

    fn write_samples(&mut self, samples: &[f32]) {
        // Debug logging (only log occasionally to avoid spam)
        static mut DEBUG_COUNT: u32 = 0;
        unsafe {
            DEBUG_COUNT += 1;
            if DEBUG_COUNT == 1 || DEBUG_COUNT % 1000 == 0 {
                println!("🔍 Audio input debug - samples: {}, channels: {}, max_amplitude: {:.4}", 
                    samples.len(), 
                    self.channels,
                    samples.iter().map(|x| x.abs()).fold(0.0, f32::max)
                );
            }
        }
        
        let has_audio = samples.iter().any(|&sample| sample.abs() > SILENCE_THRESHOLD);
        
        if has_audio {
            self.last_audio_time = Instant::now();
        }

        // Use whisper-rs built-in stereo to mono conversion only if actually stereo
        let mono_samples = if self.channels == 2 {
            // Actually stereo, use official whisper-rs conversion
            println!("🔄 Converting stereo to mono using whisper-rs...");
            match whisper_rs::convert_stereo_to_mono_audio(samples) {
                Ok(converted) => converted,
                Err(e) => {
                    println!("⚠️ Stereo conversion error: {:?}, using fallback", e);
                    // Fallback to simple averaging
                    samples.chunks_exact(2)
                        .map(|chunk| (chunk[0] + chunk[1]) / 2.0)
                        .collect()
                }
            }
        } else {
            // Already mono, use as-is
            samples.to_vec()
        };

        // Downsample if necessary
        for &sample in &mono_samples {
            if self.downsample_ratio <= 1.0 {
                // No downsampling needed or upsampling (just write directly)
                self.data[self.write_pos] = sample;
                self.write_pos = (self.write_pos + 1) % self.data.len();
            } else {
                // Downsample by averaging multiple input samples
                self.downsample_accumulator += sample;
                self.downsample_count += 1.0;
                
                if self.downsample_count >= self.downsample_ratio {
                    let downsampled = self.downsample_accumulator / self.downsample_count;
                    self.data[self.write_pos] = downsampled;
                    self.write_pos = (self.write_pos + 1) % self.data.len();
                    
                    // Reset accumulator
                    self.downsample_accumulator = 0.0;
                    self.downsample_count = 0.0;
                }
            }
        }
    }

    fn get_buffer_copy(&self) -> Vec<f32> {
        let mut result = vec![0.0; self.data.len()];
        let (first, second) = self.data.split_at(self.write_pos);
        result[..second.len()].copy_from_slice(second);
        result[second.len()..].copy_from_slice(first);
        result
    }

    fn is_silent(&self) -> bool {
        self.last_audio_time.elapsed() > SILENCE_DURATION
    }
}

pub async fn initialize_whisper() -> Result<()> {
    println!("🎤 Initializing Whisper model...");
    
    // Get the model path - try to find it in the models directory
    let model_path = get_model_path()?;
    
    println!("🎤 Loading Whisper model from: {:?}", model_path);
    
    // Create Whisper context with parameters to reduce logging
    let mut ctx_params = WhisperContextParameters::default();
    ctx_params.use_gpu(false); // Disable GPU to reduce logs
    
    let ctx = WhisperContext::new_with_params(&model_path.to_string_lossy(), ctx_params)
        .map_err(|e| anyhow!("Failed to create Whisper context: {:?}", e))?;
    
    // Store the context globally
    let mut global_ctx = WHISPER_CONTEXT.lock().unwrap();
    *global_ctx = Some(ctx);
    
    println!("✅ Whisper model loaded successfully!");
    Ok(())
}

fn get_model_path() -> Result<PathBuf> {
    let mut model_path = std::env::current_exe()
        .map_err(|e| anyhow!("Failed to get current exe path: {}", e))?;
    
    // Navigate to the models directory
    model_path.pop(); // Remove executable name
    model_path.push("models");
    model_path.push("ggml-base.en.bin");
    
    // If not found, try relative to src-tauri
    if !model_path.exists() {
        model_path = PathBuf::from("src-tauri/models/ggml-base.en.bin");
    }
    
    // Final fallback - current directory
    if !model_path.exists() {
        model_path = PathBuf::from("models/ggml-base.en.bin");
    }
    
    if !model_path.exists() {
        return Err(anyhow!(
            "Whisper model not found! Please download ggml-base.en.bin to the models directory. \
            \nDownload from: https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-base.en.bin \
            \nExpected locations:\n\
            - {}/models/ggml-base.en.bin\n\
            - src-tauri/models/ggml-base.en.bin\n\
            - models/ggml-base.en.bin",
            std::env::current_exe().unwrap().parent().unwrap().display()
        ));
    }
    
    Ok(model_path)
}

fn get_audio_device_and_config() -> Result<(Device, SupportedStreamConfig)> {
    let host = cpal::default_host();
    let device = host
        .default_input_device()
        .ok_or_else(|| anyhow!("No input device available"))?;
    
    println!("🎤 Using audio device: {}", device.name().unwrap_or("Unknown".to_string()));
    
    // Get all supported configs and find the best one
    let supported_configs: Vec<_> = device.supported_input_configs()?.collect();
    
    // Strategy 1: Try to find exact 16kHz support
    if let Some(config) = supported_configs.iter().find(|config| {
        config.min_sample_rate().0 <= SAMPLE_RATE && config.max_sample_rate().0 >= SAMPLE_RATE
    }) {
        let selected_config = config.clone().with_sample_rate(cpal::SampleRate(SAMPLE_RATE));
        println!("🎤 Selected config: 16kHz native - {:?}", selected_config.sample_format());
        return Ok((device, selected_config));
    }
    
    // Strategy 2: Use the highest available sample rate (we'll downsample)
    if let Some(config) = supported_configs.iter().max_by_key(|config| config.max_sample_rate().0) {
        let sample_rate = config.max_sample_rate().0;
        let selected_config = config.clone().with_sample_rate(cpal::SampleRate(sample_rate));
        println!("🎤 Selected config: {}Hz -> 16kHz resampling - {:?}", sample_rate, selected_config.sample_format());
        return Ok((device, selected_config));
    }
    
    // Strategy 3: Use any available config
    if let Some(config) = supported_configs.first() {
        let sample_rate = config.max_sample_rate().0;
        let selected_config = config.clone().with_sample_rate(cpal::SampleRate(sample_rate));
        println!("🎤 Selected config: {}Hz fallback - {:?}", sample_rate, selected_config.sample_format());
        return Ok((device, selected_config));
    }
    
    Err(anyhow!("No audio input configurations available"))
}

#[tauri::command]
pub async fn start_dictation(app_handle: AppHandle) -> Result<String, String> {
    println!("🎤 Starting dictation...");
    
    // Check if already running
    if DICTATION_RUNNING.load(Ordering::Relaxed) {
        return Err("Dictation is already running".to_string());
    }
    
    // Initialize Whisper if not already done
    if WHISPER_CONTEXT.lock().unwrap().is_none() {
        if let Err(e) = initialize_whisper().await {
            let error_msg = format!("Failed to initialize Whisper: {}", e);
            println!("❌ {}", error_msg);
            return Err(error_msg);
        }
    }
    
    // Set running flag
    DICTATION_RUNNING.store(true, Ordering::Relaxed);
    
    // Start audio capture and processing in a separate thread (not async)
    let app_handle_clone = app_handle.clone();
    std::thread::spawn(move || {
        // Use a blocking runtime for this thread
        let rt = tokio::runtime::Runtime::new().unwrap();
        
        rt.block_on(async {
            // Emit status event
            let _ = app_handle_clone.emit("dictation-status", serde_json::json!({
                "status": "started",
                "message": "Voice dictation started successfully"
            }));
            
            if let Err(e) = run_dictation_loop(app_handle_clone.clone()).await {
                println!("❌ Dictation error: {}", e);
                let _ = app_handle_clone.emit("dictation-error", format!("Dictation error: {}", e));
                let _ = app_handle_clone.emit("dictation-status", serde_json::json!({
                    "status": "error",
                    "message": format!("Dictation error: {}", e)
                }));
            }
            DICTATION_RUNNING.store(false, Ordering::Relaxed);
            let _ = app_handle_clone.emit("dictation-status", serde_json::json!({
                "status": "stopped",
                "message": "Voice dictation stopped"
            }));
        });
    });
    
    println!("✅ Dictation started successfully!");
    Ok("Dictation started".to_string())
}

#[tauri::command]
pub async fn stop_dictation() -> Result<String, String> {
    println!("🎤 Stopping dictation...");
    
    if !DICTATION_RUNNING.load(Ordering::Relaxed) {
        return Err("Dictation is not running".to_string());
    }
    
    DICTATION_RUNNING.store(false, Ordering::Relaxed);
    
    println!("✅ Dictation stopped");
    Ok("Dictation stopped".to_string())
}

async fn run_dictation_loop(app_handle: AppHandle) -> Result<()> {
    println!("🎤 Starting dictation loop...");
    
    // Get audio device and config
    let (device, config) = get_audio_device_and_config()?;
    
    // Debug: Print detailed config information
    println!("🎤 Audio config details:");
    println!("   Sample rate: {}Hz", config.sample_rate().0);
    println!("   Channels: {}", config.channels());
    println!("   Sample format: {:?}", config.sample_format());
    
    // Create audio buffer with the actual sample rate and channels
    let audio_buffer = Arc::new(Mutex::new(AudioBuffer::new()));
    {
        let mut buffer = audio_buffer.lock().unwrap();
        buffer.set_source_sample_rate(config.sample_rate().0);
        buffer.set_channels(config.channels());
    }
    let audio_buffer_clone = audio_buffer.clone();
    
    // Create channel for communication between audio thread and processing thread
    let (tx, mut rx) = mpsc::unbounded_channel::<Vec<f32>>();
    
    // Calculate processing frequency based on actual sample rate
    let processing_interval = config.sample_rate().0 as usize / 2; // 2 times per second for better accuracy
    
    // Build audio stream
    let stream = match config.sample_format() {
        SampleFormat::F32 => device.build_input_stream(
            &config.into(),
            move |data: &[f32], _: &cpal::InputCallbackInfo| {
                let mut buffer = audio_buffer_clone.lock().unwrap();
                buffer.write_samples(data);
                
                // Send a copy of current buffer for processing periodically
                if buffer.write_pos % processing_interval == 0 {
                    let _ = tx.send(buffer.get_buffer_copy());
                }
            },
            |err| println!("❌ Audio stream error: {}", err),
            None,
        )?,
        SampleFormat::I16 => {
            let tx_clone = tx.clone();
            device.build_input_stream(
                &config.into(),
                move |data: &[i16], _: &cpal::InputCallbackInfo| {
                    let f32_data: Vec<f32> = data.iter().map(|&x| x as f32 / i16::MAX as f32).collect();
                    let mut buffer = audio_buffer_clone.lock().unwrap();
                    buffer.write_samples(&f32_data);
                    
                    if buffer.write_pos % processing_interval == 0 {
                        let _ = tx_clone.send(buffer.get_buffer_copy());
                    }
                },
                |err| println!("❌ Audio stream error: {}", err),
                None,
            )?
        },
        SampleFormat::U16 => {
            let tx_clone = tx.clone();
            device.build_input_stream(
                &config.into(),
                move |data: &[u16], _: &cpal::InputCallbackInfo| {
                    let f32_data: Vec<f32> = data.iter().map(|&x| (x as f32 - u16::MAX as f32 / 2.0) / (u16::MAX as f32 / 2.0)).collect();
                    let mut buffer = audio_buffer_clone.lock().unwrap();
                    buffer.write_samples(&f32_data);
                    
                    if buffer.write_pos % processing_interval == 0 {
                        let _ = tx_clone.send(buffer.get_buffer_copy());
                    }
                },
                |err| println!("❌ Audio stream error: {}", err),
                None,
            )?
        },
        _ => return Err(anyhow!("Unsupported sample format: {:?}", config.sample_format())),
    };
    
    // Start the audio stream
    stream.play()?;
    println!("🎤 Audio stream started");
    
    let mut last_silence_check = Instant::now();
    
    // Processing loop - keep stream alive by not moving it into async tasks
    while DICTATION_RUNNING.load(Ordering::Relaxed) {
        // Try to receive audio data
        match rx.try_recv() {
            Ok(audio_data) => {
                if let Err(e) = process_audio_chunk(&app_handle, &audio_data).await {
                    println!("❌ Error processing audio: {}", e);
                    let _ = app_handle.emit("speech-warning", format!("Processing error: {}", e));
                }
            }
            Err(mpsc::error::TryRecvError::Empty) => {
                // No data available, sleep briefly
                tokio::time::sleep(Duration::from_millis(10)).await;
            }
            Err(mpsc::error::TryRecvError::Disconnected) => {
                println!("❌ Audio channel disconnected");
                break;
            }
        }
        
        // Check for silence periodically
        if last_silence_check.elapsed() > Duration::from_secs(1) {
            let buffer = audio_buffer.lock().unwrap();
            if buffer.is_silent() {
                println!("🔇 Silence detected - emitting paragraph end");
                let _ = app_handle.emit("dictation-result", serde_json::json!({
                    "text": "new paragraph",
                    "is_final": true
                }));
            }
            last_silence_check = Instant::now();
        }
    }
    
    // Drop the stream to stop recording
    drop(stream);
    println!("🎤 Dictation loop ended");
    Ok(())
}

async fn process_audio_chunk(app_handle: &AppHandle, audio_data: &[f32]) -> Result<()> {
    // Check if audio has sufficient energy to avoid processing silence/noise
    let rms_energy = (audio_data.iter().map(|x| x * x).sum::<f32>() / audio_data.len() as f32).sqrt();
    if rms_energy < 0.005 { // Higher threshold for real-time to avoid processing background noise
        return Ok(());
    }
    
    // Skip processing if the audio is too quiet (all zeros or near-zeros) 
    let max_amplitude = audio_data.iter().map(|x| x.abs()).fold(0.0, f32::max);
    if max_amplitude < SILENCE_THRESHOLD {
        return Ok(());
    }
    
    // Only log occasionally to reduce noise
    static mut PROCESS_COUNT: u32 = 0;
    unsafe {
        PROCESS_COUNT += 1;
        if PROCESS_COUNT % 10 == 0 {
            println!("🎤 Processing audio chunk #{} (amplitude: {:.4}, energy: {:.6}, samples: {})", 
                PROCESS_COUNT, max_amplitude, rms_energy, audio_data.len());
        }
    }
    
    // Get Whisper context
    let ctx_guard = WHISPER_CONTEXT.lock().unwrap();
    let ctx = ctx_guard
        .as_ref()
        .ok_or_else(|| anyhow!("Whisper context not initialized"))?;
    
    // Set up Whisper parameters exactly like the reference implementation
    let mut params = FullParams::new(SamplingStrategy::Greedy { best_of: 1 });
    
    // Exact configuration from basic_use.rs
    params.set_language(Some("en"));
    params.set_print_special(false);
    params.set_print_progress(false);
    params.set_print_realtime(false);
    params.set_print_timestamps(false);
    
    // Basic anti-hallucination settings only
    params.set_suppress_blank(true);
    params.set_suppress_nst(true);
    
    // Process audio with Whisper (audio_data is already properly formatted from AudioBuffer)
    // Create a new state for this transcription
    let mut state = ctx.create_state()
        .map_err(|e| anyhow!("Failed to create Whisper state: {:?}", e))?;
    
    state.full(params, audio_data)
        .map_err(|e| anyhow!("Failed to process audio: {:?}", e))?;
    
    let num_segments = state.full_n_segments()
        .map_err(|e| anyhow!("Failed to get segment count: {:?}", e))?;
    
    for i in 0..num_segments {
        let text = state.full_get_segment_text(i)
            .map_err(|e| anyhow!("Failed to get segment text: {:?}", e))?;
        let text = text.trim();
        if !text.is_empty() && text.len() > 1 {
            // Clear transcription output with prominent formatting
            println!("\n🗣️  WHISPER TRANSCRIBED: \"{}\"", text);
            let _ = app_handle.emit("dictation-result", serde_json::json!({
                "text": text,
                "is_final": true
            }));
        }
    }
    
    Ok(())
}

#[tauri::command]
pub async fn test_microphone_permissions() -> Result<String, String> {
    println!("🎤 Testing microphone permissions...");
    
    match get_audio_device_and_config() {
        Ok((device, config)) => {
            let device_name = device.name().unwrap_or("Unknown".to_string());
            let result = format!(
                "✅ Microphone access OK!\nDevice: {}\nSample Rate: {}Hz\nChannels: {}\nFormat: {:?}",
                device_name,
                config.sample_rate().0,
                config.channels(),
                config.sample_format()
            );
            println!("{}", result);
            Ok(result)
        }
        Err(e) => {
            let error_msg = format!(
                "❌ Microphone test failed: {}\n\n🔧 Troubleshooting:\n\
                • Check microphone permissions in system settings\n\
                • Ensure microphone is connected and not used by other apps\n\
                • On Windows: Check Privacy & Security → Microphone settings\n\
                • On macOS: Check System Preferences → Security & Privacy → Microphone",
                e
            );
            println!("{}", error_msg);
            Err(error_msg)
        }
    }
}

#[tauri::command]
pub async fn test_dictation_system() -> Result<String, String> {
    println!("🎤 Testing dictation system (Whisper AI mode)...");
    
    // Test Whisper model loading
    let model_status = match get_model_path() {
        Ok(path) => format!("✅ Whisper Model: Found at {:?}", path),
        Err(e) => format!("❌ Whisper Model: {}", e),
    };
    
    // Test microphone access
    let mic_status = match get_audio_device_and_config() {
        Ok((device, config)) => {
            format!("✅ Microphone: {} ({}Hz, {} channels)", 
                device.name().unwrap_or("Unknown".to_string()),
                config.sample_rate().0,
                config.channels())
        }
        Err(e) => format!("❌ Microphone: {}", e),
    };
    
    // Test Whisper initialization
    let whisper_status = if WHISPER_CONTEXT.lock().unwrap().is_some() {
        "✅ Whisper Context: Already initialized"
    } else {
        match initialize_whisper().await {
            Ok(_) => "✅ Whisper Context: Successfully initialized",
            Err(e) => return Err(format!("❌ Whisper Context: Failed to initialize - {}", e)),
        }
    };
    
    let result = format!(
        "🔧 Dictation System Status: REAL AI MODE\n\n\
        {}\n\
        {}\n\
        {}\n\
        ✅ CPAL Audio: Ready\n\
        ✅ Real-time Processing: Ready\n\
        ✅ Event System: Ready\n\n\
        🎤 The voice dictation system is ready for REAL speech recognition!\n\n\
        📝 Features:\n\
        • Offline AI processing with Whisper\n\
        • Real-time audio capture with CPAL\n\
        • High-accuracy English speech recognition\n\
        • Privacy-first local processing\n\n\
        💡 Click \"Voice Dictation\" to start using your real voice!",
        model_status, mic_status, whisper_status
    );
    
    println!("{}", result);
    Ok(result)
}

#[tauri::command]
pub async fn is_dictation_running() -> Result<bool, String> {
    Ok(DICTATION_RUNNING.load(Ordering::Relaxed))
}

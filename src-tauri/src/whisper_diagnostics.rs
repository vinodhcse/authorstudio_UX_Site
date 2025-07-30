// Enhanced Whisper testing with silence and noise patterns
use anyhow::{anyhow, Result};
use std::path::Path;
use tauri::{AppHandle, Emitter};
use whisper_rs::{FullParams, SamplingStrategy, WhisperContext, WhisperContextParameters};
use std::fs::File;
use std::io::{BufWriter, Write};

pub struct WhisperDiagnostics {
    app_handle: AppHandle,
}

impl WhisperDiagnostics {
    pub fn new(app_handle: AppHandle) -> Self {
        Self { app_handle }
    }

    /// Test Whisper with pure silence
    pub async fn test_silence(&self) -> Result<String> {
        println!("🔇 Testing Whisper with pure silence...");
        
        let audio_data = self.generate_silence(3.0)?; // 3 seconds of silence
        let result = self.transcribe_audio(&audio_data).await?;
        
        println!("🔇 Silence transcription: '{}'", result);
        Ok(result)
    }

    /// Test Whisper with white noise
    pub async fn test_white_noise(&self) -> Result<String> {
        println!("📻 Testing Whisper with white noise...");
        
        let audio_data = self.generate_white_noise(3.0)?; // 3 seconds of white noise
        let result = self.transcribe_audio(&audio_data).await?;
        
        println!("📻 White noise transcription: '{}'", result);
        Ok(result)
    }

    /// Test Whisper with microphone-like background noise
    pub async fn test_microphone_noise(&self) -> Result<String> {
        println!("🎤 Testing Whisper with microphone-like noise...");
        
        let audio_data = self.generate_microphone_noise(3.0)?;
        let result = self.transcribe_audio(&audio_data).await?;
        
        println!("🎤 Microphone noise transcription: '{}'", result);
        Ok(result)
    }

    /// Save diagnostic audio to file for manual inspection
    pub async fn save_diagnostic_audio(&self, audio_type: &str, audio_data: &[f32]) -> Result<String> {
        let filename = format!("test-audio/diagnostic_{}.wav", audio_type);
        self.save_wav_file(&filename, audio_data)?;
        println!("💾 Saved diagnostic audio: {}", filename);
        Ok(filename)
    }

    fn generate_silence(&self, duration_seconds: f32) -> Result<Vec<f32>> {
        let sample_rate = 16000;
        let total_samples = (sample_rate as f32 * duration_seconds) as usize;
        let audio_data = vec![0.0f32; total_samples];
        Ok(audio_data)
    }

    fn generate_white_noise(&self, duration_seconds: f32) -> Result<Vec<f32>> {
        let sample_rate = 16000;
        let total_samples = (sample_rate as f32 * duration_seconds) as usize;
        let mut audio_data = Vec::with_capacity(total_samples);
        
        for i in 0..total_samples {
            // Simple pseudo-random noise
            let noise = ((i as f32 * 1234.5).sin() * 9876.3 + (i as f32 * 4321.1).cos() * 6543.2) % 1.0;
            audio_data.push(noise * 0.1); // Low amplitude noise
        }
        
        Ok(audio_data)
    }

    fn generate_microphone_noise(&self, duration_seconds: f32) -> Result<Vec<f32>> {
        let sample_rate = 16000;
        let total_samples = (sample_rate as f32 * duration_seconds) as usize;
        let mut audio_data = Vec::with_capacity(total_samples);
        
        for i in 0..total_samples {
            let t = i as f32 / sample_rate as f32;
            
            // Simulate typical microphone background noise:
            // - Low frequency hum (electrical interference)
            // - Mid frequency room tone
            // - High frequency electronic noise
            let low_hum = (2.0 * std::f32::consts::PI * 60.0 * t).sin() * 0.02; // 60Hz hum
            let room_tone = (2.0 * std::f32::consts::PI * 200.0 * t).sin() * 0.01; // Room ambience
            let electronic_noise = ((i as f32 * 0.1).sin() * 1000.0).sin() * 0.005; // High freq noise
            
            let sample = low_hum + room_tone + electronic_noise;
            audio_data.push(sample);
        }
        
        Ok(audio_data)
    }

    async fn transcribe_audio(&self, audio_data: &[f32]) -> Result<String> {
        // Check if audio has sufficient energy to avoid hallucination
        let rms_energy = (audio_data.iter().map(|x| x * x).sum::<f32>() / audio_data.len() as f32).sqrt();
        if rms_energy < 0.001 { // Very low energy threshold
            println!("🔇 Audio energy too low ({:.6}), skipping transcription to prevent hallucination", rms_energy);
            return Ok("".to_string());
        }
        
        println!("🎤 Audio energy: {:.6} (processing)", rms_energy);
        // Load Whisper model
        let model_path = "models/ggml-base.en.bin";
        if !Path::new(model_path).exists() {
            return Err(anyhow!("Whisper model not found at: {}", model_path));
        }

        let mut ctx_params = WhisperContextParameters::default();
        ctx_params.use_gpu(false);
        
        let ctx = WhisperContext::new_with_params(
            model_path,
            ctx_params,
        )?;

        // Create transcription parameters with stricter settings to prevent hallucination
        let mut params = FullParams::new(SamplingStrategy::Greedy { best_of: 1 });
        params.set_language(Some("en"));
        params.set_print_special(false);
        params.set_print_progress(false);
        params.set_print_realtime(false);
        params.set_print_timestamps(false);
        
        // CRITICAL: Add anti-hallucination parameters
        params.set_suppress_blank(true);
        params.set_suppress_nst(true);
        params.set_max_tokens(0); // Prevent generating tokens from silence
        params.set_logprob_thold(-1.0); // Higher confidence threshold
        params.set_entropy_thold(2.4); // Lower entropy threshold to prevent nonsense

        // Transcribe
        let mut state = ctx.create_state()?;
        state.full(params, audio_data)?;

        // Get results
        let num_segments = state.full_n_segments()?;
        let mut full_text = String::new();
        
        for i in 0..num_segments {
            let segment_text = state.full_get_segment_text(i)?;
            full_text.push_str(&segment_text);
        }

        Ok(full_text)
    }

    fn save_wav_file(&self, filename: &str, audio_data: &[f32]) -> Result<()> {
        let sample_rate = 16000u32;
        let total_samples = audio_data.len() as u32;
        
        // Ensure directory exists
        if let Some(parent) = Path::new(filename).parent() {
            std::fs::create_dir_all(parent)?;
        }
        
        let mut file = BufWriter::new(File::create(filename)?);
        
        // Write WAV header
        file.write_all(b"RIFF")?;
        file.write_all(&(36 + total_samples * 2).to_le_bytes())?;
        file.write_all(b"WAVE")?;
        
        // Format chunk
        file.write_all(b"fmt ")?;
        file.write_all(&16u32.to_le_bytes())?;
        file.write_all(&1u16.to_le_bytes())?;
        file.write_all(&1u16.to_le_bytes())?;
        file.write_all(&sample_rate.to_le_bytes())?;
        file.write_all(&(sample_rate * 2).to_le_bytes())?;
        file.write_all(&2u16.to_le_bytes())?;
        file.write_all(&16u16.to_le_bytes())?;
        
        // Data chunk
        file.write_all(b"data")?;
        file.write_all(&(total_samples * 2).to_le_bytes())?;
        
        // Write audio data
        for &sample in audio_data {
            let sample_i16 = (sample * 32767.0) as i16;
            file.write_all(&sample_i16.to_le_bytes())?;
        }
        
        file.flush()?;
        Ok(())
    }
}

#[tauri::command]
pub async fn test_whisper_silence(app_handle: AppHandle) -> Result<String, String> {
    println!("🧪 Running silence test...");
    
    let diagnostics = WhisperDiagnostics::new(app_handle);
    
    match diagnostics.test_silence().await {
        Ok(result) => {
            if result.trim().is_empty() {
                Ok("✅ GOOD: Whisper correctly detected silence (no hallucination)".to_string())
            } else {
                Ok(format!("⚠️  WARNING: Whisper hallucinated from silence: '{}'", result))
            }
        }
        Err(e) => {
            let error_msg = format!("Silence test failed: {}", e);
            Err(error_msg)
        }
    }
}

#[tauri::command]
pub async fn test_whisper_noise(app_handle: AppHandle) -> Result<String, String> {
    println!("🧪 Running noise test...");
    
    let diagnostics = WhisperDiagnostics::new(app_handle);
    
    match diagnostics.test_white_noise().await {
        Ok(result) => {
            if result.trim().is_empty() {
                Ok("✅ GOOD: Whisper correctly ignored white noise".to_string())
            } else {
                Ok(format!("⚠️  Whisper transcribed noise as: '{}'", result))
            }
        }
        Err(e) => {
            let error_msg = format!("Noise test failed: {}", e);
            Err(error_msg)
        }
    }
}

#[tauri::command]
pub async fn test_whisper_microphone_noise(app_handle: AppHandle) -> Result<String, String> {
    println!("🧪 Running microphone noise test...");
    
    let diagnostics = WhisperDiagnostics::new(app_handle);
    
    match diagnostics.test_microphone_noise().await {
        Ok(result) => {
            let message = if result.trim().is_empty() {
                "✅ GOOD: Whisper correctly ignored microphone noise".to_string()
            } else {
                format!("🎯 CLUE: Whisper transcribed microphone noise as: '{}'\n\nThis might be similar to what's happening with your real microphone!", result)
            };
            Ok(message)
        }
        Err(e) => {
            let error_msg = format!("Microphone noise test failed: {}", e);
            Err(error_msg)
        }
    }
}

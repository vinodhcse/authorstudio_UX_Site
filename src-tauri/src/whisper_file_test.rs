// Test Whisper with a known audio file to verify transcription accuracy
use anyhow::{anyhow, Result};
use std::path::Path;
use tauri::{AppHandle, Emitter};
use whisper_rs::{FullParams, SamplingStrategy, WhisperContext, WhisperContextParameters};

// Import our audio test generator
use crate::audio_test_generator::AudioTestGenerator;

pub struct WhisperFileTest {
    app_handle: AppHandle,
}

impl WhisperFileTest {
    pub fn new(app_handle: AppHandle) -> Self {
        Self { app_handle }
    }

    pub async fn test_with_file(&self, audio_file_path: &str) -> Result<String> {
        println!("🎤 Testing Whisper with audio file: {}", audio_file_path);
        
        // Load Whisper model
        let model_path = "models/ggml-base.en.bin";
        if !Path::new(model_path).exists() {
            return Err(anyhow!("Whisper model not found at: {}", model_path));
        }

        println!("🔄 Loading Whisper model...");
        let ctx = WhisperContext::new_with_params(
            model_path,
            WhisperContextParameters::default(),
        )?;
        println!("✅ Whisper model loaded!");

        // Load and process audio file
        println!("🔄 Loading audio file...");
        let audio_data = if audio_file_path == "placeholder" {
            // Generate a test sine wave
            self.generate_sine_wave()
        } else if audio_file_path == "test-speech" {
            // Generate a test speech-like pattern
            self.generate_speech_pattern("mike testing 123")
        } else {
            // Try to load actual WAV file
            AudioTestGenerator::load_wav_file(audio_file_path)?
        };
        println!("✅ Audio data loaded: {} samples", audio_data.len());

        // Create transcription parameters
        let mut params = FullParams::new(SamplingStrategy::Greedy { best_of: 1 });
        params.set_language(Some("en"));
        params.set_print_special(false);
        params.set_print_progress(false);
        params.set_print_realtime(false);
        params.set_print_timestamps(false);

        // Transcribe
        println!("🔄 Transcribing audio...");
        let mut state = ctx.create_state()?;
        state.full(params, &audio_data)?;

        // Get results
        let num_segments = state.full_n_segments()?;
        let mut full_text = String::new();
        
        for i in 0..num_segments {
            let segment_text = state.full_get_segment_text(i)?;
            full_text.push_str(&segment_text);
            println!("📝 Segment {}: {}", i, segment_text);
        }

        println!("🗣️  FINAL TRANSCRIPTION: '{}'", full_text);
        
        // Emit result to frontend
        let _ = self.app_handle.emit("file-test-result", &full_text);
        
        Ok(full_text)
    }

    fn generate_sine_wave(&self) -> Vec<f32> {
        println!("🎵 Generating sine wave for testing...");
        
        let sample_rate = 16000;
        let duration_seconds = 3;
        let frequency = 440.0; // A4 note
        
        let mut audio_data = Vec::with_capacity(sample_rate * duration_seconds);
        
        for i in 0..(sample_rate * duration_seconds) {
            let t = i as f32 / sample_rate as f32;
            let sample = (2.0 * std::f32::consts::PI * frequency * t).sin() * 0.1;
            audio_data.push(sample);
        }
        
        audio_data
    }
    
    fn generate_speech_pattern(&self, text: &str) -> Vec<f32> {
        println!("🗣️  Generating speech-like pattern for: '{}'", text);
        
        let sample_rate = 16000;
        let duration_seconds = 3;
        let total_samples = sample_rate * duration_seconds;
        
        let mut audio_data = Vec::with_capacity(total_samples);
        
        // Create more complex waveform that might resemble speech
        let frequencies = [200.0, 400.0, 800.0, 1200.0]; // Formant-like frequencies
        let samples_per_char = total_samples / text.len().max(1);
        
        for (char_idx, char) in text.chars().enumerate() {
            let start_sample = char_idx * samples_per_char;
            let end_sample = (start_sample + samples_per_char).min(total_samples);
            
            for i in start_sample..end_sample {
                let t = i as f32 / sample_rate as f32;
                let mut sample = 0.0;
                
                // Mix multiple frequencies to simulate speech formants
                for (freq_idx, &freq) in frequencies.iter().enumerate() {
                    let char_freq_mod = (char as u8 as f32) / 255.0; // Character-based frequency modulation
                    let mod_freq = freq * (1.0 + char_freq_mod * 0.5);
                    let amplitude = 0.1 / frequencies.len() as f32;
                    sample += (2.0 * std::f32::consts::PI * mod_freq * t).sin() * amplitude;
                }
                
                // Add some noise for realism
                let noise = (i as f32 * 0.001).sin() * 0.01;
                sample += noise;
                
                audio_data.push(sample);
            }
        }
        
        // Pad remaining samples with silence
        while audio_data.len() < total_samples {
            audio_data.push(0.0);
        }
        
        audio_data
    }
}

#[tauri::command]
pub async fn test_whisper_with_file(app_handle: AppHandle, file_path: String) -> Result<String, String> {
    println!("🧪 Starting Whisper file test...");
    
    let tester = WhisperFileTest::new(app_handle);
    
    match tester.test_with_file(&file_path).await {
        Ok(result) => {
            println!("✅ File test completed successfully!");
            Ok(result)
        }
        Err(e) => {
            let error_msg = format!("File test failed: {}", e);
            println!("❌ {}", error_msg);
            Err(error_msg)
        }
    }
}

#[tauri::command]
pub async fn test_whisper_with_sine_wave(app_handle: AppHandle) -> Result<String, String> {
    println!("🧪 Testing Whisper with generated sine wave...");
    
    let tester = WhisperFileTest::new(app_handle);
    
    // Test with a placeholder sine wave
    match tester.test_with_file("placeholder").await {
        Ok(result) => {
            println!("✅ Sine wave test completed!");
            println!("📝 Result: '{}'", result);
            
            // A sine wave should either produce silence or minimal transcription
            if result.trim().is_empty() {
                Ok("✅ Whisper correctly detected silence/noise (sine wave produced no text)".to_string())
            } else {
                Ok(format!("⚠️  Whisper transcribed sine wave as: '{}' (this suggests audio processing issues)", result))
            }
        }
        Err(e) => {
            let error_msg = format!("Sine wave test failed: {}", e);
            println!("❌ {}", error_msg);
            Err(error_msg)
        }
    }
}

#[tauri::command]
pub async fn test_whisper_with_speech_pattern(app_handle: AppHandle) -> Result<String, String> {
    println!("🧪 Testing Whisper with speech-like pattern...");
    
    let tester = WhisperFileTest::new(app_handle);
    
    // Test with a speech-like pattern for "mike testing 123"
    match tester.test_with_file("test-speech").await {
        Ok(result) => {
            println!("✅ Speech pattern test completed!");
            println!("📝 Result: '{}'", result);
            
            // This should hopefully produce some recognizable text
            Ok(format!("🎯 Whisper transcribed speech pattern as: '{}'", result))
        }
        Err(e) => {
            let error_msg = format!("Speech pattern test failed: {}", e);
            println!("❌ {}", error_msg);
            Err(error_msg)
        }
    }
}

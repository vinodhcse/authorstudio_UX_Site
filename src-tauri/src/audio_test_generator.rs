// Audio file generator for testing Whisper transcription
use anyhow::{anyhow, Result};
use std::fs::File;
use std::io::{BufWriter, Write};
use std::path::Path;
use hound::{WavReader, WavSpec};

pub struct AudioTestGenerator;

impl AudioTestGenerator {
    /// Generate a WAV file with a known spoken phrase for testing
    pub fn generate_test_wav(output_path: &str, text_content: &str) -> Result<()> {
        println!("🎵 Generating test WAV file: {}", output_path);
        println!("📝 Content: '{}'", text_content);
        
        let sample_rate = 16000u32;
        let duration_seconds = 3u32;
        let total_samples = sample_rate * duration_seconds;
        
        // WAV header
        let mut file = BufWriter::new(File::create(output_path)?);
        
        // Write WAV header
        file.write_all(b"RIFF")?;
        file.write_all(&(36 + total_samples * 2).to_le_bytes())?; // File size - 8
        file.write_all(b"WAVE")?;
        
        // Format chunk
        file.write_all(b"fmt ")?;
        file.write_all(&16u32.to_le_bytes())?; // Format chunk size
        file.write_all(&1u16.to_le_bytes())?;  // Audio format PCM
        file.write_all(&1u16.to_le_bytes())?;  // Mono
        file.write_all(&sample_rate.to_le_bytes())?; // Sample rate
        file.write_all(&(sample_rate * 2).to_le_bytes())?; // Byte rate
        file.write_all(&2u16.to_le_bytes())?;  // Block align
        file.write_all(&16u16.to_le_bytes())?; // Bits per sample
        
        // Data chunk
        file.write_all(b"data")?;
        file.write_all(&(total_samples * 2).to_le_bytes())?; // Data size
        
        // Generate more realistic speech-like audio
        Self::generate_speech_like_audio(&mut file, total_samples, sample_rate, text_content)?;
        
        file.flush()?;
        println!("✅ WAV file generated: {}", output_path);
        Ok(())
    }
    
    /// Generate speech-like audio patterns that Whisper might recognize
    fn generate_speech_like_audio(
        file: &mut BufWriter<File>, 
        total_samples: u32, 
        sample_rate: u32, 
        text: &str
    ) -> Result<()> {
        let words: Vec<&str> = text.split_whitespace().collect();
        let samples_per_word = total_samples / words.len().max(1) as u32;
        
        for (word_idx, word) in words.iter().enumerate() {
            let start_sample = word_idx as u32 * samples_per_word;
            let end_sample = if word_idx == words.len() - 1 {
                total_samples
            } else {
                (word_idx as u32 + 1) * samples_per_word
            };
            
            // Generate word-specific patterns
            match word.to_lowercase().as_str() {
                "mike" => Self::write_vowel_consonant_pattern(file, start_sample, end_sample, sample_rate, 250.0, 1800.0)?,
                "testing" => Self::write_consonant_vowel_pattern(file, start_sample, end_sample, sample_rate, 350.0, 2100.0)?,
                "123" | "one" | "two" | "three" => Self::write_number_pattern(file, start_sample, end_sample, sample_rate, 400.0)?,
                "hello" => Self::write_vowel_consonant_pattern(file, start_sample, end_sample, sample_rate, 300.0, 1500.0)?,
                "world" => Self::write_consonant_vowel_pattern(file, start_sample, end_sample, sample_rate, 280.0, 1700.0)?,
                "the" => Self::write_short_word_pattern(file, start_sample, end_sample, sample_rate, 320.0)?,
                "quick" => Self::write_consonant_vowel_pattern(file, start_sample, end_sample, sample_rate, 380.0, 2000.0)?,
                "brown" => Self::write_vowel_consonant_pattern(file, start_sample, end_sample, sample_rate, 290.0, 1600.0)?,
                "fox" => Self::write_consonant_vowel_pattern(file, start_sample, end_sample, sample_rate, 350.0, 1900.0)?,
                _ => Self::write_generic_word_pattern(file, start_sample, end_sample, sample_rate, 300.0)?,
            }
            
            // Add brief pause between words
            if word_idx < words.len() - 1 {
                let pause_samples = (sample_rate as f32 * 0.1) as u32; // 100ms pause
                for _ in 0..pause_samples.min(end_sample - start_sample) {
                    file.write_all(&0i16.to_le_bytes())?;
                }
            }
        }
        
        Ok(())
    }
    
    /// Generate vowel-consonant pattern (like "mike", "hello")
    fn write_vowel_consonant_pattern(
        file: &mut BufWriter<File>,
        start: u32,
        end: u32,
        sample_rate: u32,
        f0: f32,      // Fundamental frequency
        f1: f32,      // First formant
    ) -> Result<()> {
        let duration = end - start;
        for i in 0..duration {
            let t = i as f32 / sample_rate as f32;
            
            // Vowel part (first 60%)
            let sample = if i < (duration as f32 * 0.6) as u32 {
                // Strong fundamental + formant for vowel sound
                let fundamental = (2.0 * std::f32::consts::PI * f0 * t).sin() * 0.4;
                let formant1 = (2.0 * std::f32::consts::PI * f1 * t).sin() * 0.2;
                let formant2 = (2.0 * std::f32::consts::PI * (f1 * 1.5) * t).sin() * 0.1;
                fundamental + formant1 + formant2
            } else {
                // Consonant part (fricative-like noise)
                let noise = (i as f32 * 0.01).sin() * 0.2;
                let high_freq = (2.0 * std::f32::consts::PI * (f0 * 4.0) * t).sin() * 0.1;
                noise + high_freq
            };
            
            let sample_i16 = (sample * 16000.0) as i16;
            file.write_all(&sample_i16.to_le_bytes())?;
        }
        Ok(())
    }
    
    /// Generate consonant-vowel pattern (like "testing", "world")
    fn write_consonant_vowel_pattern(
        file: &mut BufWriter<File>,
        start: u32,
        end: u32,
        sample_rate: u32,
        f0: f32,
        f1: f32,
    ) -> Result<()> {
        let duration = end - start;
        for i in 0..duration {
            let t = i as f32 / sample_rate as f32;
            
            // Consonant start (first 30%), then vowel
            let sample = if i < (duration as f32 * 0.3) as u32 {
                // Plosive/fricative consonant
                let noise = (i as f32 * 0.02).sin() * 0.3;
                let burst = (2.0 * std::f32::consts::PI * (f0 * 6.0) * t).sin() * 0.15;
                noise + burst
            } else {
                // Vowel sound
                let fundamental = (2.0 * std::f32::consts::PI * f0 * t).sin() * 0.35;
                let formant1 = (2.0 * std::f32::consts::PI * f1 * t).sin() * 0.2;
                fundamental + formant1
            };
            
            let sample_i16 = (sample * 16000.0) as i16;
            file.write_all(&sample_i16.to_le_bytes())?;
        }
        Ok(())
    }
    
    /// Generate number pattern (like "123")
    fn write_number_pattern(
        file: &mut BufWriter<File>,
        start: u32,
        end: u32,
        sample_rate: u32,
        f0: f32,
    ) -> Result<()> {
        let duration = end - start;
        let segment_duration = duration / 3; // For "1", "2", "3"
        
        for segment in 0..3 {
            let seg_start = segment * segment_duration;
            let seg_end = if segment == 2 { duration } else { (segment + 1) * segment_duration };
            
            // Each number has different pitch
            let pitch = f0 + (segment as f32 * 50.0);
            
            for i in seg_start..seg_end {
                let t = i as f32 / sample_rate as f32;
                let fundamental = (2.0 * std::f32::consts::PI * pitch * t).sin() * 0.4;
                let harmonic = (2.0 * std::f32::consts::PI * (pitch * 2.0) * t).sin() * 0.15;
                
                let sample = fundamental + harmonic;
                let sample_i16 = (sample * 16000.0) as i16;
                file.write_all(&sample_i16.to_le_bytes())?;
            }
            
            // Brief pause between numbers
            if segment < 2 {
                let pause_samples = (sample_rate as f32 * 0.05) as u32; // 50ms
                for _ in 0..pause_samples.min(seg_end - seg_start) {
                    file.write_all(&0i16.to_le_bytes())?;
                }
            }
        }
        Ok(())
    }
    
    /// Generate short word pattern (like "the")
    fn write_short_word_pattern(
        file: &mut BufWriter<File>,
        start: u32,
        end: u32,
        sample_rate: u32,
        f0: f32,
    ) -> Result<()> {
        let duration = end - start;
        for i in 0..duration {
            let t = i as f32 / sample_rate as f32;
            
            // Short, sharp vowel sound
            let fundamental = (2.0 * std::f32::consts::PI * f0 * t).sin() * 0.3;
            let sample = fundamental * (1.0 - (i as f32 / duration as f32)).powf(2.0); // Decay
            
            let sample_i16 = (sample * 16000.0) as i16;
            file.write_all(&sample_i16.to_le_bytes())?;
        }
        Ok(())
    }
    
    /// Generate generic word pattern
    fn write_generic_word_pattern(
        file: &mut BufWriter<File>,
        start: u32,
        end: u32,
        sample_rate: u32,
        f0: f32,
    ) -> Result<()> {
        let duration = end - start;
        for i in 0..duration {
            let t = i as f32 / sample_rate as f32;
            
            // Generic speech-like pattern
            let fundamental = (2.0 * std::f32::consts::PI * f0 * t).sin() * 0.3;
            let modulation = (2.0 * std::f32::consts::PI * 5.0 * t).sin() * 0.1 + 1.0;
            let sample = fundamental * modulation;
            
            let sample_i16 = (sample * 16000.0) as i16;
            file.write_all(&sample_i16.to_le_bytes())?;
        }
        Ok(())
    }
    
    /// Load a WAV file and return the audio data as f32 samples
    pub fn load_wav_file(file_path: &str) -> Result<Vec<f32>> {
        println!("🔄 Loading WAV file: {}", file_path);
        
        if !Path::new(file_path).exists() {
            return Err(anyhow!("WAV file not found: {}", file_path));
        }
        
        // Use hound library for proper WAV parsing
        let mut reader = WavReader::open(file_path)
            .map_err(|e| anyhow!("Failed to open WAV file: {}", e))?;
        
        let spec = reader.spec();
        println!("📊 WAV spec: {} channels, {} Hz, {} bits", 
                spec.channels, spec.sample_rate, spec.bits_per_sample);
        
        let mut samples = Vec::new();
        
        // Handle different bit depths
        match spec.bits_per_sample {
            16 => {
                // 16-bit samples
                for sample_result in reader.samples::<i16>() {
                    let sample = sample_result.map_err(|e| anyhow!("Error reading sample: {}", e))?;
                    let sample_f32 = sample as f32 / 32768.0; // Convert to [-1.0, 1.0] range
                    samples.push(sample_f32);
                }
            }
            24 => {
                // 24-bit samples (read as i32)
                for sample_result in reader.samples::<i32>() {
                    let sample = sample_result.map_err(|e| anyhow!("Error reading sample: {}", e))?;
                    let sample_f32 = sample as f32 / 8388608.0; // Convert to [-1.0, 1.0] range
                    samples.push(sample_f32);
                }
            }
            32 => {
                // 32-bit samples (could be int or float)
                if spec.sample_format == hound::SampleFormat::Float {
                    // 32-bit float samples
                    for sample_result in reader.samples::<f32>() {
                        let sample = sample_result.map_err(|e| anyhow!("Error reading sample: {}", e))?;
                        samples.push(sample);
                    }
                } else {
                    // 32-bit int samples
                    for sample_result in reader.samples::<i32>() {
                        let sample = sample_result.map_err(|e| anyhow!("Error reading sample: {}", e))?;
                        let sample_f32 = sample as f32 / 2147483648.0; // Convert to [-1.0, 1.0] range
                        samples.push(sample_f32);
                    }
                }
            }
            _ => {
                return Err(anyhow!("Unsupported bit depth: {} bits", spec.bits_per_sample));
            }
        }
        
        // Convert stereo to mono if needed (using whisper-rs function)
        let final_samples = if spec.channels == 2 {
            println!("🔄 Converting stereo to mono using whisper-rs...");
            whisper_rs::convert_stereo_to_mono_audio(&samples)
                .map_err(|e| anyhow!("Failed to convert stereo to mono: {:?}", e))?
        } else {
            samples
        };
        
        // Resample to 16kHz if needed (simple resampling)
        let final_samples = if spec.sample_rate != 16000 {
            println!("🔄 Resampling from {} Hz to 16000 Hz...", spec.sample_rate);
            resample_audio(&final_samples, spec.sample_rate, 16000)
        } else {
            final_samples
        };
        
        println!("✅ WAV file loaded: {} samples at 16kHz mono", final_samples.len());
        Ok(final_samples)
    }
}

/// Simple linear resampling function
fn resample_audio(input: &[f32], input_rate: u32, output_rate: u32) -> Vec<f32> {
    if input_rate == output_rate {
        return input.to_vec();
    }
    
    let ratio = input_rate as f32 / output_rate as f32;
    let output_len = (input.len() as f32 / ratio) as usize;
    let mut output = Vec::with_capacity(output_len);
    
    for i in 0..output_len {
        let src_index = (i as f32 * ratio) as usize;
        if src_index < input.len() {
            output.push(input[src_index]);
        } else {
            output.push(0.0);
        }
    }
    
    output
}

#[tauri::command]
pub async fn create_test_audio_file(text: String, filename: String) -> Result<String, String> {
    println!("🎵 Creating test audio file...");
    
    // Ensure the test-audio directory exists
    let test_dir = "test-audio";
    if !Path::new(test_dir).exists() {
        std::fs::create_dir_all(test_dir).map_err(|e| {
            format!("Failed to create test-audio directory: {}", e)
        })?;
        println!("📁 Created test-audio directory");
    }
    
    let output_path = format!("test-audio/{}", filename);
    
    match AudioTestGenerator::generate_test_wav(&output_path, &text) {
        Ok(_) => {
            let message = format!("✅ Test audio file created: {}\n📝 Content: '{}'", output_path, text);
            println!("{}", message);
            Ok(message)
        }
        Err(e) => {
            let error_msg = format!("Failed to create test audio file: {}", e);
            println!("❌ {}", error_msg);
            Err(error_msg)
        }
    }
}

#[tauri::command] 
pub async fn list_test_audio_files() -> Result<Vec<String>, String> {
    println!("📁 Listing test audio files...");
    
    let test_dir = "test-audio";
    if !Path::new(test_dir).exists() {
        println!("📁 test-audio directory doesn't exist yet");
        return Ok(vec![]);
    }
    
    match std::fs::read_dir(test_dir) {
        Ok(entries) => {
            let mut files = Vec::new();
            for entry in entries {
                if let Ok(entry) = entry {
                    if let Some(filename) = entry.file_name().to_str() {
                        if filename.ends_with(".wav") {
                            files.push(filename.to_string());
                        }
                    }
                }
            }
            println!("📁 Found {} test audio files", files.len());
            Ok(files)
        }
        Err(e) => {
            let error_msg = format!("Failed to list test audio files: {}", e);
            println!("❌ {}", error_msg);
            Err(error_msg)
        }
    }
}

# Test Audio Files

This directory contains sample audio files for testing Whisper transcription.

## File Structure:
- `test-audio/` - Generated test files
- `samples/` - Pre-recorded sample files (if any)

## Test Files:

### 1. mike-testing-123.wav
**Expected transcription**: "mike testing 123"
**Purpose**: Test basic speech recognition with simple phrase

### 2. hello-world.wav  
**Expected transcription**: "hello world"
**Purpose**: Test common phrase recognition

### 3. the-quick-brown-fox.wav
**Expected transcription**: "the quick brown fox jumps over the lazy dog"
**Purpose**: Test complex sentence with all letters

## Usage:

1. Generate test files using the frontend interface
2. Use the Whisper test page to load and transcribe files
3. Compare actual vs expected transcriptions
4. Identify accuracy issues before real-time streaming

## File Placement:

```
authorstudio_Initial_TipTap_integration/
├── test-audio/
│   ├── README.md (this file)
│   ├── mike-testing-123.wav
│   ├── hello-world.wav
│   └── the-quick-brown-fox.wav
├── src-tauri/
│   └── models/
│       └── ggml-base.en.bin
└── src/
    └── pages/
        └── WhisperTestPage.tsx
```

# macOS Setup Guide for AuthorStudio

## System Requirements
- macOS 10.15+ (Catalina or later)
- Xcode Command Line Tools installed (`xcode-select --install`)
- **CMake installed** (`brew install cmake`) - **Required for whisper-rs compilation**
- Rust 1.77.2+ installed
- Node.js and npm

## Installation Steps

### 1. Install Dependencies
```bash
# Install Rust (if not already installed)
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh

# Install Xcode Command Line Tools (required for compilation)
xcode-select --install

# Install CMake (REQUIRED - whisper-rs needs cmake to build the C++ library)
brew install cmake

# Verify cmake is installed
cmake --version

# Install Node.js and npm (if not already installed)
brew install node

# Install project dependencies
npm install
```

**⚠️ CMake is Essential:** The cmake installation is not optional. whisper-rs uses cmake to build the underlying whisper.cpp C++ library. Without cmake, you'll get build errors.

### 2. Download Whisper Model
```bash
# Create models directory
mkdir -p src-tauri/models

# Download the English base model (~ 142MB)
curl -L https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-base.en.bin \
  -o src-tauri/models/ggml-base.en.bin
```

### 3. Grant Microphone Permissions
1. Build and run the app: `npm run tauri dev`
2. macOS will prompt for microphone access - **Click "Allow"**
3. If you missed the prompt, go to **System Preferences > Security & Privacy > Privacy > Microphone** and enable it for AuthorStudio

### 4. Verify Installation
```bash
# Test the setup
npm run tauri dev

# Click the "Test Microphone" button in the app
# You should see: "✅ Whisper Model: Found at [path]"
```

## macOS-Specific Features

### Apple Silicon Optimization
The app automatically uses Apple's Accelerate framework for better performance on M1/M2 Macs.

### Model Storage Locations
The app looks for the Whisper model in these locations (in order):
1. `[App Bundle]/models/ggml-base.en.bin` (production)
2. `src-tauri/models/ggml-base.en.bin` (development)  
3. `models/ggml-base.en.bin` (fallback)

### Troubleshooting

## Troubleshooting

### **"cmake is not installed" Error** 
⚠️ **Most Common macOS Build Error**

**Root Cause:** whisper-rs requires cmake to build the underlying whisper.cpp C++ library.

**Solution:**
```bash
# Install cmake using Homebrew (recommended)
brew install cmake

# Verify installation
cmake --version
# Should show: cmake version 3.x.x

# If homebrew is not installed first:
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
```

**Alternative cmake installation:**
- **Direct download:** https://cmake.org/download/ (add to PATH manually)
- **MacPorts:** `sudo port install cmake`

#### "Microphone not available" Error
- Check System Preferences > Security & Privacy > Privacy > Microphone
- Ensure AuthorStudio is checked
- Restart the app after granting permissions

#### "Whisper model not found" Error
- Verify the model file exists: `ls -la src-tauri/models/ggml-base.en.bin`
- Re-download if corrupted: `rm src-tauri/models/ggml-base.en.bin && curl -L [url] -o [path]`

#### Build Issues
- Install Xcode Command Line Tools: `xcode-select --install`
- Update Rust: `rustup update`
- Clear build cache: `cargo clean && npm run tauri build`

## Performance Tips

### For Apple Silicon Macs (M1/M2)
- The app automatically uses optimized frameworks
- Whisper inference should be very fast (< 1 second for 30s audio)

### For Intel Macs  
- Performance is still good but slightly slower
- Consider using a smaller model for faster inference:
  - `ggml-tiny.en.bin` (39MB) - faster, less accurate
  - `ggml-small.en.bin` (244MB) - good balance

## Building for Distribution

```bash
# Build optimized release
npm run tauri build

# The .dmg will be in src-tauri/target/release/bundle/dmg/
# The .app will be in src-tauri/target/release/bundle/macos/
```

## Security Notes

- The app requests microphone permissions as required by macOS
- Audio is processed locally - nothing is sent to external servers
- Temporary audio files are stored in `dictation_sessions/` and cleaned up automatically

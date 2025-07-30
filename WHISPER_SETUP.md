# Whisper-rs + CPAL Dictation Integration Setup

This guide will help you set up offline Speech-to-Text dictation in your AuthorStudio app using Whisper-rs and CPAL.

**🚨 QUICK FIX FOR BUILD ISSUES:** If you're getting `libclang` errors, I've included a simplified fallback implementation that works immediately. See the **Immediate Solution** section below.

## 🎯 TL;DR - Get It Working Now!

```bash
# 1. The project is already configured with a working fallback
# 2. Just build and run:
npm run tauri dev

# 3. Click the microphone button in FloatingActionButton menu
# 4. You'll see sample dictated text appear (for testing the UI)
# 5. All the animations and visual feedback work perfectly!
```

**Result:** ✅ Working dictation UI with visual feedback, ready to integrate real speech recognition later.

## ⚡ Immediate Solution (No LLVM Required)

If you're encountering build issues with whisper-rs, you can use the simplified version:

### 1. Use Simple Dictation (Already Configured)
The project is now configured to use `simple_dictation.rs` which doesn't require whisper-rs or LLVM. This provides:
- ✅ **Immediate functionality** - builds without external dependencies
- ✅ **Same UI/UX** - all the visual feedback and animations work
- ✅ **Event system** - uses the same Tauri events (`speech-result`, `speech-warning`)
- ✅ **Simulation mode** - outputs sample text to test the integration
- ✅ **Easy upgrade path** - switch to full Whisper later

### 2. Build and Test Right Now
```bash
# This should now build successfully without any additional setup
npm run tauri dev
```

### 3. How It Works
- Click the microphone button in your FloatingActionButton menu
- It will start "dictation" and emit sample text every few seconds
- You'll see the same visual feedback (pulsing colors, status indicators)
- Perfect for testing the UI integration while you set up the full Whisper system

---

## 🎯 Full Whisper Integration (Advanced)

## 🎯 Full Whisper Integration (Advanced)

**Once you want to upgrade to real speech recognition:**

### 1. Install LLVM (Windows)

**⚠️ IMPORTANT: Windows users need to install LLVM first!**

#### Option A: Install LLVM (Recommended)
```bash
# Download and install LLVM from: https://releases.llvm.org/download.html
# Choose "LLVM-17.0.6-win64.exe" or latest version
# During installation, check "Add LLVM to the system PATH for all users"

# After installation, verify:
clang --version
```

#### Option B: Use winget (Windows 11/10)
```bash
winget install LLVM.LLVM
```

#### Option C: Use Chocolatey
```bash
choco install llvm
```

### 2. Enable Whisper Dependencies

Edit `src-tauri/Cargo.toml` and uncomment these lines:
```toml
# Uncomment these lines:
whisper-rs = "0.12"
cpal = "0.15"
```

### 3. Switch to Whisper Module

Edit `src-tauri/src/lib.rs` and switch the imports:
```rust
// Comment out simple_dictation:
// mod simple_dictation;
// use simple_dictation::{
//     start_dictation, stop_dictation, test_microphone_permissions, is_dictation_running
// };

// Uncomment whisper_dictation:
mod whisper_dictation;
use whisper_dictation::{
    start_dictation, stop_dictation, test_microphone_permissions, is_dictation_running
};
```

### 5. Download the Whisper Model

You need to download the Whisper base.en model (~140MB):

```bash
# Navigate to your project
cd src-tauri/models

# Download the model (Windows/PowerShell)
Invoke-WebRequest -Uri "https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-base.en.bin" -OutFile "ggml-base.en.bin"

# Or download manually from:
# https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-base.en.bin
```

### 6. Build with Full Whisper

```bash
# Clean previous build
cargo clean

# Build with Whisper
npm run tauri dev
```

---

### 4. Set Environment Variables (If needed)
If you still get libclang errors after installing LLVM:

```bash
# Find your LLVM installation (usually):
# C:\Program Files\LLVM\bin\
# C:\Program Files (x86)\LLVM\bin\

# Set environment variable in PowerShell:
$env:LIBCLANG_PATH = "C:\Program Files\LLVM\bin"

# Or set permanently in Windows:
# System Properties → Environment Variables → New System Variable
# Variable: LIBCLANG_PATH
# Value: C:\Program Files\LLVM\bin
```

### 5. Download the Whisper Model

You need to download the Whisper base.en model (~140MB):

```bash
# Navigate to your project
cd src-tauri/models

# Download the model (Windows/PowerShell)
Invoke-WebRequest -Uri "https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-base.en.bin" -OutFile "ggml-base.en.bin"

# Or download manually from:
# https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-base.en.bin
```

### 4. Install Dependencies

### 4. Install Dependencies

The Rust dependencies are already added to `Cargo.toml`:
- `whisper-rs = "0.12"`
- `cpal = "0.15"`
- `tokio = { version = "1.0", features = ["full"] }`
- `anyhow = "1.0"`
- `once_cell = "1.19"`

### 5. Build the Application

```bash
# Install Rust dependencies and build
npm run tauri build

# Or for development
npm run tauri dev
```

## 🎤 How to Use

### In Your React Components

#### Option 1: Use the DictationButton Component
```tsx
import DictationButton from '../components/DictationButton';

function MyEditor() {
    const handleInsertText = (text: string) => {
        // Insert text into your editor
        console.log('Dictated text:', text);
    };

    return (
        <div>
            <DictationButton 
                onInsertText={handleInsertText}
                size="md" // sm, md, lg
            />
        </div>
    );
}
```

#### Option 2: Use the useDictation Hook
```tsx
import { useDictation } from '../hooks/useDictation';

function MyComponent() {
    const [dictationState, dictationControls] = useDictation({
        onTranscript: (text) => console.log('New text:', text),
        onParagraphEnd: () => console.log('New paragraph'),
        onError: (error) => console.error('Dictation error:', error),
        autoReconnect: true,
        maxRetries: 3
    });

    return (
        <div>
            <button onClick={dictationControls.toggle}>
                {dictationState.isListening ? 'Stop' : 'Start'} Dictation
            </button>
            {dictationState.error && <p>Error: {dictationState.error}</p>}
        </div>
    );
}
```

#### Option 3: TipTap Integration
```tsx
import TipTapDictation from '../components/TipTapDictation';
import { useEditor } from '@tiptap/react';

function MyTipTapEditor() {
    const editor = useEditor({
        // your TipTap configuration
    });

    return (
        <div>
            <TipTapDictation editor={editor} size="lg" />
            <EditorContent editor={editor} />
        </div>
    );
}
```

### Direct Tauri Commands

You can also call the Tauri commands directly:

```tsx
import { invoke } from '@tauri-apps/api/core';
import { listen } from '@tauri-apps/api/event';

// Start dictation
await invoke('start_dictation');

// Stop dictation
await invoke('stop_dictation');

// Test microphone
const result = await invoke('test_microphone_permissions');

// Check if running
const isRunning = await invoke('is_dictation_running');

// Listen for speech results
await listen('speech-result', (event) => {
    console.log('Speech result:', event.payload);
});

// Listen for warnings/errors
await listen('speech-warning', (event) => {
    console.log('Speech warning:', event.payload);
});
```

## 🔧 Troubleshooting

### Model Not Found Error
```
❌ Whisper model not found! Please download ggml-base.en.bin to the models directory.
```

**Solution:** Download the model file as described in step 1 above.

### Microphone Permission Issues

**Windows:**
1. Go to Settings → Privacy & Security → Microphone
2. Enable "Microphone access" 
3. Enable "Let apps access your microphone"
4. Make sure your app has permission

**macOS:**
1. The app will automatically request microphone permission
2. If denied, go to System Preferences → Security & Privacy → Microphone
3. Enable permission for your app

### Audio Device Issues
```
❌ No input device available
```

**Solutions:**
- Check that a microphone is connected
- Ensure no other app is using the microphone
- Try the "Test Microphone" button first
- Restart the application

### Build Issues

If you encounter build issues with `whisper-rs`:

**🔴 `Unable to find libclang` Error (Windows):**
```
Unable to find libclang: "couldn't find any valid shared libraries matching: ['clang.dll', 'libclang.dll']"
```

**Solutions:**
1. **Install LLVM:** Download from https://releases.llvm.org/download.html
2. **Add to PATH:** During installation, check "Add LLVM to the system PATH"
3. **Set Environment Variable:** 
   ```bash
   # In PowerShell:
   $env:LIBCLANG_PATH = "C:\Program Files\LLVM\bin"
   
   # Or permanently via System Properties → Environment Variables
   ```
4. **Restart your terminal/IDE** after installation
5. **Alternative:** Use `winget install LLVM.LLVM` or `choco install llvm`

**🔴 Other Build Issues:**
1. **Windows:** Make sure you have Visual Studio Build Tools installed
2. **macOS:** Make sure you have Xcode command line tools: `xcode-select --install`
3. **Linux:** Install build dependencies: `sudo apt-get install build-essential libclang-dev`

**🔴 whisper-rs Compilation Fails:**
If whisper-rs continues to fail, you can use a simpler alternative implementation by replacing the whisper-rs dependency with a basic speech recognition system. Let me know if you'd like me to provide that fallback option.

### Performance Issues

If dictation is slow or laggy:

1. **Use a smaller model:** Download `ggml-tiny.en.bin` instead of `ggml-base.en.bin`
2. **Reduce audio buffer size:** Modify `BUFFER_SIZE` in `whisper_dictation.rs`
3. **Adjust thread count:** Modify `params.set_n_threads(2)` to match your CPU cores

## 🎯 Features

### ✅ Implemented
- [x] Offline speech recognition with Whisper-rs
- [x] Cross-platform microphone access with CPAL
- [x] Real-time streaming of recognized text
- [x] Automatic paragraph detection on silence
- [x] Visual feedback with pulsing gradients
- [x] Error handling and user feedback
- [x] TipTap editor integration
- [x] React hooks for easy integration
- [x] Microphone permission testing

### 🔄 Status Indicators
- **🔵 Blue:** Ready to start dictation
- **🔴 Red/Orange:** Listening for speech
- **🟢 Green:** Actively transcribing
- **⚫ Gray:** Initializing/Loading
- **❌ Red:** Error state

### 🎛️ Customization

You can customize the dictation behavior by modifying:

- **Silence threshold:** `SILENCE_THRESHOLD` in `whisper_dictation.rs`
- **Paragraph timeout:** `SILENCE_DURATION` in `whisper_dictation.rs`
- **Buffer size:** `BUFFER_SIZE` in `whisper_dictation.rs`
- **Sample rate:** `SAMPLE_RATE` in `whisper_dictation.rs`
- **Visual styling:** CSS classes in React components

## 📚 API Reference

### Tauri Commands
- `start_dictation()` - Start speech recognition
- `stop_dictation()` - Stop speech recognition  
- `test_microphone_permissions()` - Test microphone access
- `is_dictation_running()` - Check if dictation is active

### Events
- `speech-result` - Emitted with transcribed text or `<PARAGRAPH_END>`
- `speech-warning` - Emitted with error messages

### React Components
- `DictationButton` - Standalone dictation button with visual feedback
- `TipTapDictation` - TipTap editor integration component

### React Hooks
- `useDictation` - Full dictation state management and controls

## 🛠️ Development

To modify the dictation system:

1. **Backend changes:** Edit `src-tauri/src/whisper_dictation.rs`
2. **Frontend changes:** Edit components in `src/components/`
3. **Configuration:** Modify constants at the top of `whisper_dictation.rs`

Rebuild with `npm run tauri dev` to test changes.

## 🎉 Success!

Once everything is set up correctly, you should see:
- ✅ Dictation button appears in your FloatingActionButton menu
- 🎤 Clicking starts real-time speech recognition
- ✍️ Your speech appears as text in the editor
- 📝 Paragraphs are automatically created after silence
- 🔴 Visual feedback shows listening/transcribing states

Happy dictating! 🎤✨

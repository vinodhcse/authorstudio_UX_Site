# Tauri-Only Authentication System

A comprehensive authentication system designed specifically for Tauri applications with encrypted local storage and offline functionality.

## Features

- 🔐 **AES-GCM Encryption**: All sensitive data encrypted with PBKDF2-derived keys
- 💾 **Local Encrypted Storage**: Encrypted session persistence via the Tauri Rust layer
- 🔌 **Offline Support**: Works offline with encrypted local session storage
- ⏱️ **Idle Timeout**: Automatic session clearing after inactivity
- 🎯 **Device Management**: Unique device ID with keypair generation
- 🔄 **Token Management**: JWT with automatic refresh handling
- 🎨 **UI Components**: Ready-to-use React components with Tailwind CSS

## Architecture

### Core Components

1. **useAuthStore.ts** - Zustand store managing authentication state
2. **AuthGate.tsx** - Route protection wrapper component
3. **UnlockOffline.tsx** - Passphrase entry for session unlock
4. **apiClient.ts** - HTTP client for authentication APIs
5. **sqlite.ts** - Local storage operations via Tauri commands with encryption
6. **crypto.ts** - Cryptographic utilities (PBKDF2 + AES-GCM)
7. **deviceId.ts** - Device identification management
8. **idleTimer.ts** - Automatic session timeout handling

### Data Flow

```
1. User Login/Signup → API → JWT Tokens
2. Passphrase + Device ID → PBKDF2 → App Key
3. App Key + Session Data → AES-GCM → Encrypted local store
4. Idle Timer → Clear Memory → Show Unlock Screen
5. Unlock → Decrypt Session → Restore State
```

## Installation

### Prerequisites

Ensure you have the required Tauri plugins in your `Cargo.toml`:

```toml
[dependencies]
tauri-plugin-fs = "2.0"
tauri-plugin-http = "2.0"
```

And in your `package.json`:

```json
{
  "dependencies": {
    "@tauri-apps/plugin-fs": "^2.0.0", 
    "@tauri-apps/plugin-http": "^2.0.0",
    "zustand": "^4.0.0",
    "framer-motion": "^10.0.0",
    "@heroicons/react": "^2.0.0"
  }
}
```

### Environment Variables

Add to your `.env` file:

```env
VITE_API_BASE_URL=https://your-api-server.com
```

## Quick Start

### 1. Wrap Your App

```tsx
import { AuthGate } from './auth';

function App() {
  return (
    <AuthGate>
      <YourAppContent />
    </AuthGate>
  );
}
```

### 2. Use Auth State

```tsx
import { useAuthStore } from './auth';

function UserProfile() {
  const { user, isAuthenticated, logout } = useAuthStore();
  
  if (!isAuthenticated) return null;
  
  return (
    <div>
      <h1>Welcome, {user?.name}!</h1>
      <button onClick={logout}>Logout</button>
    </div>
  );
}
```

### 3. Handle Authentication

```tsx
import { useAuthStore } from './auth';

function LoginForm() {
  const { login, isLoading } = useAuthStore();
  
  const handleSubmit = async (email: string, password: string) => {
    try {
      await login(email, password);
    } catch (error) {
      console.error('Login failed:', error);
    }
  };
  
  return (
    <form onSubmit={...}>
      {/* Your login form */}
    </form>
  );
}
```

## Configuration

### Idle Timer

Customize the idle timeout settings:

```tsx
import { AuthGate, useIdleTimer } from './auth';

const CUSTOM_IDLE_CONFIG = {
  idleTimeout: 45 * 60 * 1000, // 45 minutes
  warningTime: 10 * 60 * 1000,  // 10 minutes warning
};

// Use in a custom wrapper component
function CustomAuthGate({ children }) {
  const { showWarning, remainingTime, extendSession, dismissWarning } = 
    useIdleTimer(CUSTOM_IDLE_CONFIG);
    
  return (
    <AuthGate>
      {children}
      <IdleWarningModal
        isOpen={showWarning}
        remainingTime={remainingTime}
        onExtend={extendSession}
        onDismiss={dismissWarning}
      />
    </AuthGate>
  );
}
```

### Encryption Settings

Modify crypto parameters in `crypto.ts`:

```typescript
const PBKDF2_ITERATIONS = 200000; // Increase for more security
const AES_KEY_LENGTH = 256;       // AES-256
```

## API Reference

### useAuthStore

The main authentication store providing state and actions.

#### State Properties

- `user: User | null` - Current authenticated user
- `isAuthenticated: boolean` - Authentication status
- `isLoading: boolean` - Loading state
- `isOnline: boolean` - Network connectivity status
- `appKey: CryptoKey | null` - Encryption key for session data
- `accessToken: string | null` - JWT access token
- `accessTokenExp: number | null` - Token expiration timestamp

#### Actions

- `signup(name, email, password)` - Create new account
- `verifyEmail(email, code)` - Verify email with code
- `login(email, password)` - Authenticate user
- `unlock(passphrase)` - Unlock encrypted session
- `logout()` - Clear session and logout
- `clearInMemoryData()` - Clear sensitive data (idle timeout)

### AuthGate

Route protection wrapper component.

```tsx
<AuthGate fallback={<CustomLoginPage />}>
  <ProtectedContent />
</AuthGate>
```

Props:
- `children: ReactNode` - Protected content
- `fallback?: ReactNode` - Custom unauthenticated state

### UnlockOffline

Passphrase entry component for session unlock.

```tsx
<UnlockOffline onUnlock={() => setShowUnlock(false)} />
```

### IdleWarningModal

Session timeout warning modal.

```tsx
<IdleWarningModal
  isOpen={showWarning}
  remainingTime={timeInMs}
  onExtend={() => extendSession()}
  onDismiss={() => dismissWarning()}
/>
```

## Security Features

### Encryption

- **PBKDF2**: 200,000+ iterations for key derivation
- **AES-GCM**: Authenticated encryption for all sensitive data
- **Device Keypairs**: Unique per-device encryption keys
- **Salt Management**: Cryptographically secure random salts

### Storage

- **Encrypted at Rest**: All session data encrypted at rest
- **Memory Protection**: Sensitive keys cleared after idle timeout
- **Device Isolation**: Sessions tied to specific device IDs

### Network

- **JWT Tokens**: Standard bearer token authentication
- **Auto-refresh**: Transparent token renewal
- **Offline Mode**: Full functionality without network

## Local Storage

Session, device, and key-value storage are persisted locally via the Tauri Rust layer.

## Migration Guide

### From Existing Auth System

1. **Remove old auth components**:
   ```bash
   rm src/contexts/AuthContext.tsx
   rm src/components/ProtectedRoute.tsx
   ```

2. **Update imports**:
   ```tsx
   // Old
   import { useAuth } from './contexts/AuthContext';
   
   // New
   import { useAuthStore } from './auth';
   ```

3. **Replace auth usage**:
   ```tsx
   // Old
   const { user, login, logout } = useAuth();
   
   // New
   const { user, login, logout } = useAuthStore();
   ```

4. **Update route protection**:
   ```tsx
   // Old
   <ProtectedRoute>
     <Component />
   </ProtectedRoute>
   
   // New
   <AuthGate>
     <Component />
   </AuthGate>
   ```

## Troubleshooting

### Common Issues

1. Missing plugins
  - Ensure FS and HTTP plugins are installed and configured

2. **Encryption/Decryption Errors**
   - Check PBKDF2 parameters match between encryption/decryption
   - Verify passphrase is correctly entered
   - Clear device data if corrupted: `clearDeviceId()`

3. **Session Not Persisting**
  - Ensure local database is writable
   - Check Tauri app permissions
   - Verify encryption key derivation

4. **Network Errors**
   - Check `VITE_API_BASE_URL` environment variable
   - Verify API server is accessible
   - Enable offline mode for testing

### Debug Mode

Enable debug logging by setting:

```typescript
localStorage.setItem('auth-debug', 'true');
```

## Contributing

When contributing to this authentication system:

1. **Security First**: All changes must maintain encryption standards
2. **Test Coverage**: Include tests for crypto operations
3. **Documentation**: Update this README for API changes
4. **Backward Compatibility**: Maintain session format compatibility

## License

This authentication system is part of the Author Studio project and follows the same license terms.

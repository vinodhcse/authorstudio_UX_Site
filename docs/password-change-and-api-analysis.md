# Password Change Impact & Backend API Requirements

## 1. Password Change Impact Analysis

### Current Architecture Key Dependencies
```
Passphrase → PBKDF2 → AppKey → AES-GCM → UDEK (encrypted storage)
                              ↓
UDEK → HKDF → BSK (Book Share Keys) per book
     ↓
UDEK → AES-GCM → Content Encryption
```

### What Happens When User Changes Password?

#### **CRITICAL ISSUE: Data Becomes Inaccessible**
When a user changes their password, the following happens:

1. **AppKey Changes**: New password → New PBKDF2 salt/iterations → Different AppKey
2. **UDEK Becomes Inaccessible**: Old AppKey can't decrypt stored UDEK
3. **All Content Lost**: Without UDEK, all book content becomes permanently inaccessible
4. **BSK Derivation Fails**: All shared book keys become invalid
5. **Collaboration Breaks**: Other users lose access to shared content

#### **Required Password Change Process**

```typescript
async function changePassword(currentPassword: string, newPassword: string): Promise<void> {
  // Step 1: Verify current password and decrypt UDEK
  const currentAppKey = await deriveAppKey(currentPassword, existingUser.kdf_salt, existingUser.kdf_iters);
  const udek = await unwrapUDEKWithAppKey(existingUser.udek_wrap_appkey, currentAppKey);
  
  // Step 2: Generate new AppKey from new password
  const newSalt = generateSalt();
  const newIterations = 100000;
  const newAppKey = await deriveAppKey(newPassword, newSalt, newIterations);
  
  // Step 3: Re-encrypt UDEK with new AppKey
  const { wrapped: newWrappedUDEK, iv: newIv } = await wrapUDEKWithAppKey(udek, newAppKey);
  
  // Step 4: Update stored user keys
  await setUserKeys({
    user_id: userId,
    udek_wrap_appkey: combineIvAndWrapped(newIv, newWrappedUDEK),
    kdf_salt: newSalt,
    kdf_iters: newIterations,
    updated_at: Date.now()
  });
  
  // Step 5: Update session AppKey bundle
  await updateSessionAppKeyBundle(newAppKey, newSalt, newIterations);
  
  // Step 6: Sync to server for multi-device support
  await syncPasswordChangeToServer(userId, newWrappedUDEK, newSalt, newIterations);
}
```

#### **Multi-Device Implications**
- **Other Devices Locked Out**: Existing devices with old password can't access data
- **Requires Re-authentication**: All devices must login again with new password
- **UDEK Sync Required**: Server must distribute new encrypted UDEK to all user devices
- **Session Invalidation**: All existing sessions must be invalidated

## 2. Backend API Requirements

### Authentication APIs

#### **POST /auth/signup**
```json
// Request
{
  "name": "John Doe",
  "email": "john@example.com", 
  "password": "securePassword123",
  "deviceId": "device_abcd1234",
  "devicePublicKey": "-----BEGIN PUBLIC KEY-----..."
}

// Response 
{
  "token": "jwt_access_token",
  "refreshToken": "jwt_refresh_token", 
  "userId": "user_uuid",
  "globalRole": "FREE_USER",
  "name": "John Doe",
  "email": "john@example.com",
  "requiresEmailVerification": false
}
```

#### **POST /auth/login**
```json
// Request
{
  "email": "john@example.com",
  "password": "securePassword123", 
  "deviceId": "device_abcd1234"
}

// Response
{
  "token": "jwt_access_token",
  "refreshToken": "jwt_refresh_token",
  "userId": "user_uuid", 
  "globalRole": "FREE_USER",
  "name": "John Doe",
  "email": "john@example.com"
}
```

#### **POST /auth/refresh-token**
```json
// Request
{
  "refreshToken": "jwt_refresh_token"
}

// Response
{
  "token": "new_jwt_access_token",
  "userId": "user_uuid"
}
```

#### **POST /auth/change-password**
```json
// Request
{
  "currentPassword": "oldPassword123",
  "newPassword": "newPassword456",
  "newUdekWrapAppkey": "base64_encrypted_udek",
  "newKdfSalt": "base64_salt",
  "newKdfIters": 100000,
  "deviceId": "device_abcd1234"
}

// Response
{
  "success": true,
  "message": "Password changed successfully",
  "requiresReauth": true
}
```

### User & Device APIs

#### **POST /users/devices/register**
```json
// Request
{
  "deviceId": "device_abcd1234",
  "devicePublicKey": "-----BEGIN PUBLIC KEY-----...",
  "platform": "tauri",
  "appVersion": "1.0.0"
}

// Response
{
  "deviceId": "device_abcd1234", 
  "registered": true,
  "registeredAt": "2025-01-15T10:30:00Z"
}
```

#### **GET /users/me**
```json
// Response
{
  "id": "user_uuid",
  "email": "john@example.com",
  "name": "John Doe", 
  "globalRole": "FREE_USER",
  "createdAt": "2025-01-01T00:00:00Z",
  "devices": [
    {
      "deviceId": "device_abcd1234",
      "platform": "tauri",
      "lastSeen": "2025-01-15T10:30:00Z"
    }
  ]
}
```

#### **PUT /users/me/keys**
```json
// Request - For multi-device UDEK sync
{
  "udekWrapAppkey": "base64_encrypted_udek",
  "kdfSalt": "base64_salt", 
  "kdfIters": 100000,
  "deviceId": "device_abcd1234"
}

// Response
{
  "updated": true,
  "syncedToDevices": ["device_1234", "device_5678"]
}
```

#### **GET /users/me/keys**
```json
// Response - For new device setup
{
  "udekWrapAppkey": "base64_encrypted_udek",
  "kdfSalt": "base64_salt",
  "kdfIters": 100000,
  "updatedAt": "2025-01-15T10:30:00Z"
}
```

### Book Management APIs

#### **GET /books/userbooks**
```json
// Response
{
  "books": [
    {
      "id": "book_uuid",
      "title": "My Novel",
      "ownerId": "user_uuid", 
      "shared": false,
      "permissions": ["read", "write", "admin"],
      "createdAt": "2025-01-01T00:00:00Z",
      "updatedAt": "2025-01-15T10:30:00Z"
    }
  ]
}
```

#### **POST /books**
```json
// Request
{
  "id": "book_uuid", // Client-generated
  "title": "My New Novel",
  "description": "A thrilling adventure", 
  "genre": "Fantasy",
  "shared": false
}

// Response
{
  "id": "book_uuid",
  "title": "My New Novel",
  "ownerId": "user_uuid",
  "shared": false,
  "createdAt": "2025-01-15T10:30:00Z"
}
```

#### **PUT /books/{bookId}** 
```json
// Request
{
  "title": "Updated Novel Title",
  "description": "Updated description",
  "shared": true
}

// Response
{
  "id": "book_uuid",
  "title": "Updated Novel Title", 
  "ownerId": "user_uuid",
  "shared": true,
  "updatedAt": "2025-01-15T10:30:00Z"
}
```

### Grant/Collaboration APIs

#### **POST /books/{bookId}/grants**
```json
// Request
{
  "id": "grant_uuid", // Client-generated
  "collaboratorUserId": "collaborator_uuid",
  "permissions": "read,write",
  "bskWrapForCollab": "base64_encrypted_bsk_for_collaborator"
}

// Response  
{
  "id": "grant_uuid",
  "bookId": "book_uuid",
  "collaboratorUserId": "collaborator_uuid", 
  "permissions": "read,write",
  "createdAt": "2025-01-15T10:30:00Z",
  "status": "active"
}
```

#### **GET /grants**
```json
// Response - Books granted to current user
{
  "grants": [
    {
      "id": "grant_uuid",
      "bookId": "book_uuid", 
      "bookTitle": "Shared Novel",
      "ownerUserId": "owner_uuid",
      "ownerName": "Jane Smith",
      "permissions": "read,write",
      "bskWrapForMe": "base64_encrypted_bsk",
      "createdAt": "2025-01-10T00:00:00Z",
      "status": "active"
    }
  ]
}
```

#### **DELETE /books/{bookId}/grants/{grantId}**
```json
// Response
{
  "revoked": true,
  "grantId": "grant_uuid",
  "revokedAt": "2025-01-15T10:30:00Z"
}
```

### Chapter Content APIs

#### **PUT /books/{bookId}/versions/{versionId}/chapters/{chapterId}**
```json
// Request
{
  "id": "chapter_uuid",
  "title": "Chapter 1: The Beginning",
  "contentEnc": "base64_encrypted_content", 
  "contentIv": "base64_initialization_vector",
  "encScheme": "aes-gcm-256",
  "isMinor": false,
  "message": "Added opening scene"
}

// Response
{
  "id": "chapter_uuid",
  "title": "Chapter 1: The Beginning",
  "updatedAt": "2025-01-15T10:30:00Z",
  "revisionId": "revision_uuid"
}
```

#### **GET /books/{bookId}/versions/{versionId}/chapters/{chapterId}/revisions**
```json
// Response  
{
  "revisions": [
    {
      "id": "revision_uuid",
      "chapterId": "chapter_uuid",
      "contentEnc": "base64_encrypted_content",
      "contentIv": "base64_initialization_vector", 
      "encScheme": "aes-gcm-256",
      "isMinor": false,
      "message": "Added opening scene",
      "createdAt": "2025-01-15T10:30:00Z",
      "authorId": "user_uuid"
    }
  ]
}
```

### Subscription APIs

#### **GET /users/me/subscription**
```json
// Response
{
  "status": "active", // "active" | "grace" | "expired"
  "expiresAt": 1735689600000, // Unix timestamp
  "lastCheckedAt": 1735602000000,
  "plan": "pro",
  "features": ["unlimited_books", "collaboration", "advanced_export"]
}
```

## 3. Missing Implementation Gaps

### Critical Missing Features

1. **Password Change Flow**: No current implementation for password changes
2. **Multi-Device UDEK Sync**: Server-side key distribution missing
3. **Device Registration**: Partial implementation, needs server support
4. **Grant Synchronization**: Local grants not synced to server
5. **Content Sync Conflict Resolution**: No merge/conflict handling
6. **Recovery Key System**: No account recovery mechanism

### Required Server-Side Components

1. **User Key Store**: Encrypted UDEK storage per user
2. **Device Registry**: Track user devices and public keys  
3. **Grant Management**: Centralized collaboration permissions
4. **Content Versioning**: Chapter revision tracking and sync
5. **Session Management**: Multi-device session coordination
6. **Subscription Validation**: Feature access control

### Security Considerations

1. **Zero-Knowledge**: Server never sees plaintext content or UDEK
2. **Forward Secrecy**: BSK rotation on collaboration changes
3. **Device Isolation**: Compromise of one device doesn't affect others
4. **Audit Trail**: Track all grant and access changes
5. **Key Escrow**: Optional recovery keys for enterprise scenarios

This architecture provides enterprise-grade security while maintaining usability for multi-device and collaborative scenarios.

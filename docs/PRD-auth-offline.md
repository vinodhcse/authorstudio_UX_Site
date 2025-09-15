📌 Project Goal
Implement secure authentication for the Authoring Platform (Tauri + React + Vite + TailwindCSS + Framer Motion + TipTap + ReactFlow) that:

Requires online sign-in the first time.

Supports offline unlock for subsequent launches (until subscription TTL+grace expires).

Stores all book data encrypted locally with keys derived from user secrets.

Never stores plaintext content on the backend.

Supports token refresh, subscription checks, and controlled sync.

✅ Task List
Use this list to track implementation progress.
Check off tasks as they are completed.

A. Authentication Core
 A1 – Create apiClient.ts that reads VITE_API_BASE_URL from .env and sends JSON requests with Authorization header.

 A2 – Implement useAuthStore (Zustand) to manage:

Login

Unlock (offline)

Token refresh

Subscription refresh

Logout

 A3 – Add AES-GCM + PBKDF2 utilities for AppKey derivation and encryption/decryption.

 A4 – Add secure storage functions for LocalSession (AES-GCM with AppKey).

B. Device Keys & Session Handling
 B1 – On first login, generate device RSA/ECC keypair.

 B2 – Encrypt private key with AppKey and store locally.

 B3 – Store session metadata: userId, email, deviceId, subscription info, token expiry.

 B4 – Implement subscription TTL + grace logic.

C. UI Integration
 C1 – Create AuthGate wrapper to protect Editor.tsx.

 C2 – Create UnlockOffline screen for offline password/passcode entry.

 C3 – Show “Offline – sync disabled” banner when user is offline.

 C4 – On online mode, auto-refresh token if expiring soon.

D. BookContext Integration
 D1 – In BookContext.tsx, wrap network calls with ensureAccessToken() from useAuthStore.

 D2 – Block syncing when offline or subscription expired.

 D3 – Keep local edits queued until online.

E. Backend Communication
 E1 – Use existing /api/auth/login and /api/auth/refresh-token routes.

 E2 – (Optional) Implement /devices/register and /auth/subscription if backend allows.

 E3 – Handle token expiration gracefully; fallback to offline unlock.

📝 Implementation Reference
Backend Routes
Login
POST /api/auth/login

json
Copy
Edit
{ "email": "rahul@gmail.com", "password": "123456", "deviceId": "DeviceidString" }
Response:

json
Copy
Edit
{
  "token": "jwtstring",
  "userId": "WDtYLEFEEu8cO3eIp4qO",
  "globalRole": "FREE_USER",
  "name": "KL Rahul",
  "email": "rahul@gmail.com"
}
Refresh Token
POST /api/auth/refresh-token

json
Copy
Edit
{ "refreshToken": "token_from_local" }
Response:

json
Copy
Edit
{ "token": "new_jwtstring" }
(Optional): /devices/register, /auth/subscription

LocalSession Structure
ts
Copy
Edit
type LocalSession = {
  userId: string;
  email: string;
  name: string;
  deviceId: string;
  accessToken?: string;
  accessExp?: number;
  refreshTokenEnc?: string;  // AES-GCM with AppKey
  subscription: { status: 'active'|'grace'|'expired'; expiresAt: number; lastCheckedAt: number };
  appKeyBundle: { appKeyEnc: string; salt: string; iterations: number };
  deviceKeypair: { publicKey: string; privateKeyEnc: string };
  sessionVersion: number;
  updatedAt: number;
};
First-Time Online Login Flow
User submits email/password.

FE calls /auth/login with { deviceId }.

On success:

Derive AppKey (PBKDF2 from password + salt).

Generate device keypair; encrypt private key with AppKey.

Save LocalSession encrypted with AppKey.

Store subscription info from backend.

Subsequent Launch – Offline
Show unlock screen.

Derive AppKey from password; decrypt LocalSession.

If subscription still valid (expiresAt + grace > now), unlock editor.

No sync until online.

Subsequent Launch – Online
Unlock with password; decrypt LocalSession.

If access token expired:

Refresh using /auth/refresh-token and decrypted refresh token.

Fetch /auth/subscription and update session.

Enable sync.

Logout
Wipe all local encrypted files, keys, tokens.

Optionally tell backend to revoke device.

Security
AppKey derived with PBKDF2 (≥200k iterations) or Argon2 if available.

Access token stored in memory; refresh token encrypted locally.

All local book data encrypted with per-scene keys.

Backend never sees plaintext book content.
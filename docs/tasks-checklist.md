# Tasks Checklist (Auth & Offline Sign‑In)

Copy this list into an issue or PR description and check off as you go.

- [ ] A1 – `apiClient.ts` with env base URL and JWT header
- [ ] A2 – `useAuthStore` (login/unlock/refresh/subscription/logout)
- [ ] A3 – Crypto utils (PBKDF2/HKDF, AES‑GCM)
- [ ] A4 – Encrypted LocalSession persistence
- [ ] B1 – Generate device keypair on first login
- [ ] B2 – Encrypt private key with AppKey
- [ ] B3 – Store session metadata
- [ ] B4 – Subscription TTL + grace logic
- [ ] C1 – `AuthGate` wrapper for `Editor.tsx`
- [ ] C2 – `UnlockOffline` screen
- [ ] C3 – Offline banner
- [ ] C4 – Token auto‑refresh
- [ ] D1 – Gate BookContext network ops via `ensureAccessToken()`
- [ ] D2 – Block sync when offline/expired; queue edits
- [ ] D3 – Expose `isOnline`, `isUnlocked`, `subscription`
- [ ] E1 – Wire to `/auth/login` and `/auth/refresh-token`
- [ ] E2 – Optional `/devices/register`, `/auth/subscription`
- [ ] E3 – Graceful expiry → offline fallback

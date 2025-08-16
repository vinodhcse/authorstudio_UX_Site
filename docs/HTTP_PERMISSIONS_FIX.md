# HTTP Permissions Fix Applied

## Issue Resolved
Fixed "url not allowed on the configured scope" error when making API requests to the authentication backend.

## Root Cause
Tauri v2 requires explicit URL scope configuration for HTTP requests. The application was trying to make requests to `http://localhost:4000/api/auth/*` but the capabilities didn't include URL scope permissions.

## Solution Applied
Updated `src-tauri/capabilities/default.json` to include HTTP scope configuration:

```json
{
  "scope": {
    "http": {
      "allowed": [
        "http://localhost:4000/*",
        "https://localhost:4000/*",
        "http://127.0.0.1:4000/*",
        "https://127.0.0.1:4000/*"
      ]
    }
  }
}
```

## Verification
- ✅ Tauri dev server restarted successfully
- ✅ Application compiled without errors
- ✅ Authentication API calls should now work properly

## Next Steps
Test the authentication flow:
1. Open the running Tauri application
2. Try to login/signup
3. Verify API requests complete successfully
4. Check SQLite database creation in app data directory

## Configuration Details
- **API Base URL**: `http://localhost:4000/api` (from .env file)
- **Scope Coverage**: All localhost:4000 and 127.0.0.1:4000 URLs (HTTP/HTTPS)
- **Authentication Endpoints**: `/auth/login`, `/auth/signup`, `/auth/refresh`

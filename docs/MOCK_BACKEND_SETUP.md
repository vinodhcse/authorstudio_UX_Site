# Mock Authentication Server for Testing

## Purpose
This is a simple mock server to test the Tauri authentication system while the real backend is being set up.

## Quick Start
```bash
npx json-server --watch mock-auth-db.json --port 4000 --routes routes.json
```

## Files Needed

### mock-auth-db.json
```json
{
  "users": [
    {
      "id": 1,
      "email": "rahul@gmail.com",
      "password": "123456",
      "name": "Rahul"
    }
  ]
}
```

### routes.json
```json
{
  "/api/*": "/$1"
}
```

## Installation
```bash
npm install -g json-server
```

This will create a REST API that responds to:
- POST /api/auth/login
- POST /api/auth/signup  
- GET /health

## Note
This is for testing only. Replace with your actual backend server when ready.

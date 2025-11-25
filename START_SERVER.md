# How to Start the Server Properly

## The Port/Environment Issue

The login redirect problem is caused by a mismatch between:
- The PORT the server runs on
- The NEXTAUTH_URL in the .env file

## Solution: Always Start Fresh

Run this command to start properly:

```bash
cd C:\Users\BOSS\Documents\golden-services

# Kill any running servers
npx kill-port 3000 3001 3002 3003

# Start the development server
npm run dev
```

The server will tell you which port it's using. For example:
```
- Local:        http://localhost:3000
```

## If Login Still Redirects

The .env file is already set to port 3000. If the server starts on a different port, you need to:

1. Note which port the server is using
2. Stop the server (Ctrl+C)
3. Update .env NEXTAUTH_URL to match that port
4. Restart the server

## Current Configuration

```env
NEXTAUTH_URL="http://localhost:3000"
```

## Login Credentials

```
Email:    admin@goldenservices.test
Password: Admin123!
```

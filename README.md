# FOSS: ASSEMBLE (Escape Room Web App)

"The code is broken. The team must assemble."

A team-based, superhero-themed escape room web app where players are recruited as the "Code Avengers" to recover 5 encrypted modules and restore the FOSS Core.

## Features
- **Player Interface**: Immersive, glitch-themed superhero UI to solve missions. 
- **Admin Dashboard**: Real-time team tracking, puzzle editing (without redeploying), and score resetting.
- **Secure Auth**: Uses secure, HTTP-only, cookie-based sessions (`express-session`) for the admin panel.
- **Local HTTPS**: Pre-configured for local TLS using `mkcert`.

## Startup Instructions

### 1. Generate Local Certificates
Ensure `mkcert` is installed on your system. Generate certificates in the `certs` folder located at the root of the project:
```bash
cd foss_escape_room
mkdir certs
cd certs
mkcert -install
mkcert localhost
# Ensure the generated files are named `localhost.pem` and `localhost-key.pem`
```

### 2. Start the Backend (Node/Express)
The backend uses SQLite to store teams and puzzle content.
```bash
cd server
npm install
npm start
```
*Note: The admin password defaults to `secret123`. You can change this by setting `ADMIN_PASSWORD` in `server/.env`.*

### 3. Start the Frontend (React/Vite)
The frontend uses Vite and proxies `/api` requests to the backend securely.
```bash
cd client
npm install
npm run dev
```

### 4. Access the App
- **Player Terminal**: `https://localhost:6000`
- **Admin Dashboard**: `https://localhost:6000/admin`

# FOSS Escape Room

A team-based web application for an escape room event.

## Local HTTPS (Dev) Setup

This project requires HTTPS even for local development so that secure cookies (for the admin dashboard authentication) work correctly.

1. **Install mkcert**:
   - Follow instructions on [mkcert GitHub](https://github.com/FiloSottile/mkcert) for your OS.
   - On Windows, you can download the latest release or use chocolatey (`choco install mkcert`).
2. **Generate Certificates**:
   ```bash
   mkcert -install
   mkdir certs
   cd certs
   mkcert localhost
   ```
3. Ensure `certs/localhost.pem` and `certs/localhost-key.pem` are created in the `certs` folder at the root of the project.

## Running the App

1. Backend:
   ```bash
   cd server
   npm install
   node index.js
   ```
   (Runs on https://localhost:3001)

2. Frontend:
   ```bash
   cd client
   npm install
   npm run dev
   ```
   (Runs on https://localhost:5173)

## Admin Login
- The admin dashboard is at `/admin`.
- Default password is in `server/.env`.
- API uses JWT inside a Secure, HttpOnly cookie.

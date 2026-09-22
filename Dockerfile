# Stage 1: Build the React frontend
FROM node:22-alpine AS builder

WORKDIR /app/client
COPY client/package*.json ./
RUN npm install
COPY client/ ./
# We pass an environment variable if needed, but relative /api works fine without it
RUN npm run build

# Stage 2: Setup the Express backend
FROM node:22-alpine

WORKDIR /app

# Install build dependencies required by node-gyp to compile better-sqlite3 from source
RUN apk add --no-cache python3 make g++

COPY server/package*.json ./server/
WORKDIR /app/server
RUN npm install --production

# Copy the server source code
COPY server/ ./
# We don't copy the certs/ directory because production deployment 
# usually happens behind a reverse proxy (Nginx/Traefik/Cloudflare) or uses a PaaS.
# However, if local certs exist mounted in a volume, it will fall back correctly.

# Copy the built frontend static files from Stage 1
COPY --from=builder /app/client/dist /app/client/dist

# Expose the backend port
EXPOSE 6001

# Run the backend server
CMD ["node", "index.js"]

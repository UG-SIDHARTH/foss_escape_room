# Stage 1: Build the React frontend
FROM node:22-slim AS builder

# Set memory limit for Node.js to prevent crashes on low-RAM machines (like 4GB RAM)
ENV NODE_OPTIONS="--max-old-space-size=2048"

# Install build dependencies for native modules
RUN apt-get update && apt-get install -y python3 make g++ && rm -rf /var/lib/apt/lists/*

WORKDIR /app/client
COPY client/package*.json ./
# Use npm ci for a faster, reproducible install if package-lock is present, else npm install
RUN npm install && npm cache clean --force

COPY client/ ./
# We pass an environment variable if needed, but relative /api works fine without it
RUN npm run build

# Stage 2: Setup the Express backend
FROM node:22-slim

# Set Node to production mode to optimize performance
ENV NODE_ENV=production

WORKDIR /app

COPY server/package*.json ./server/
WORKDIR /app/server
# Install build dependencies, build native modules, then clean up to keep image slim
RUN apt-get update && apt-get install -y python3 make g++ \
    && npm install --production \
    && apt-get purge -y --auto-remove python3 make g++ \
    && rm -rf /var/lib/apt/lists/* \
    && npm cache clean --force

# Copy the server source code
COPY server/ ./

# Copy the built frontend static files from Stage 1
COPY --from=builder /app/client/dist /app/client/dist

# Expose the backend port
EXPOSE 6001

# Run the backend server
CMD ["node", "index.js"]

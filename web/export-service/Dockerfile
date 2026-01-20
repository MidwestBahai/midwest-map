# Use official Puppeteer image which has Chrome pre-installed
FROM ghcr.io/puppeteer/puppeteer:24.6.1

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies (as root, then switch user)
USER root
RUN npm ci --only=production
RUN npm install typescript tsx

# Copy source code
COPY . .

# Build TypeScript
RUN npm run build

# Switch back to non-root user for security
USER pptruser

# Expose port
EXPOSE 3001

# Set environment variables
ENV PORT=3001
ENV NODE_ENV=production

# Start the server
CMD ["node", "dist/server.js"]

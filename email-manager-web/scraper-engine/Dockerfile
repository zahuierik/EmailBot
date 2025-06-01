FROM node:18-alpine

# Install necessary packages for Puppeteer in one layer
RUN apk add --no-cache \
    chromium \
    nss \
    freetype \
    freetype-dev \
    harfbuzz \
    ca-certificates \
    ttf-freefont \
    && rm -rf /var/cache/apk/* /tmp/* /var/tmp/*

# Tell Puppeteer to skip installing Chromium. We'll be using the installed package.
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true \
    PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser \
    NODE_ENV=production \
    HOST=0.0.0.0

# Create app directory and set permissions
WORKDIR /usr/src/app

# Copy package files first for better layer caching
COPY package*.json ./

# Clear npm cache and install dependencies with optimizations for Render.com
RUN npm cache clean --force \
    && npm install --omit=dev --no-audit --no-fund --prefer-offline --no-optional \
    && npm cache clean --force \
    && rm -rf /tmp/* ~/.npm

# Copy application code
COPY . .

# Create logs directory with proper permissions
RUN mkdir -p logs && chmod 755 logs

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S scraper -u 1001 -G nodejs && \
    chown -R scraper:nodejs /usr/src/app

# Switch to non-root user
USER scraper

# Expose port 10000 (Render.com default port)
EXPOSE 10000

# Health check using PORT environment variable (defaults to 10000)
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD node -e "const http = require('http'); const port = process.env.PORT || 10000; http.get('http://localhost:' + port + '/health', (res) => { process.exit(res.statusCode === 200 ? 0 : 1); }).on('error', () => process.exit(1));"

# Start the application
CMD ["npm", "start"] 
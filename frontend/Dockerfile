# Stage 1: Build with Vite
FROM node:18 AS builder
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

# Stage 2: Serve with nginx
FROM nginx:alpine

# Copy frontend files to nginx
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Ensure all files have proper permissions
RUN chmod -R 755 /usr/share/nginx/html && \
    chown -R nginx:nginx /usr/share/nginx/html

# Verify critical PWA files exist
RUN ls -la /usr/share/nginx/html/ && \
    test -f /usr/share/nginx/html/manifest.json && \
    test -f /usr/share/nginx/html/sw.js && \
    echo "✅ PWA files verified"

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]

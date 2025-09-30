FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies: prefer npm ci when package-lock.json exists, otherwise fall back to npm install
RUN if [ -f package-lock.json ]; then \
			npm ci --only=production; \
		else \
			npm install --only=production; \
		fi

# Copy source code
COPY . .

# Create data directory
RUN mkdir -p /app/data

EXPOSE 5000

CMD ["npm", "start"]
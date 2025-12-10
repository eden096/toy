# Use lightweight Node.js runtime
FROM node:20-alpine

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm ci --omit=dev

# Copy source
COPY . .

# Expose server port
EXPOSE 3001

# Env defaults (override in deployment)
ENV PORT=3001

CMD [ "node", "index.js" ]

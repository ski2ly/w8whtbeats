# Multi-stage build for optimal image size
FROM node:20-alpine AS builder

WORKDIR /app
COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build

# Production runtime stage
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000

# Copy built frontend assets and lightweight server
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/public ./public
COPY server.js ./

# Mountable volume for dropping your beats directly into container
VOLUME ["/app/public/beats"]

EXPOSE 3000

CMD ["node", "server.js"]

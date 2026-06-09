FROM node:22-alpine AS builder

# Create app directory
WORKDIR /app

# A wildcard is used to ensure both package.json AND package-lock.json are copied
COPY package*.json ./
COPY prisma ./prisma/

# Install OpenSSL for Prisma engine compatibility
RUN apk add --no-cache openssl

# Install app dependencies
RUN npm install

# Bundle app source
COPY . .

# Generate prisma client
RUN npx prisma generate

# Build the app
RUN npm run build

FROM node:22-alpine
RUN apk add --no-cache openssl
WORKDIR /app

# Copy from builder
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma


# Cloud Run sets the PORT variable to 8080 by default
EXPOSE 8080

CMD ["npm", "run", "start:prod"]

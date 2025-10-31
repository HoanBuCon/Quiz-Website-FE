FROM node:18-bookworm-slim

WORKDIR /app

# Install openssl for Prisma
RUN apt-get update -y && apt-get install -y openssl

# Install dependencies first
COPY quiz-backend/package*.json ./
RUN npm ci

# Copy source
COPY quiz-backend/. ./

# Dummy DATABASE_URL for prisma generate
ENV DATABASE_URL="postgresql://dummy:dummy@localhost:5432/dummy?schema=public"

# Generate Prisma Client into node_modules/@prisma/client
RUN npx prisma generate --schema=./prisma/schema.prisma

ENV NODE_ENV=production
EXPOSE 4000

# Run migrations and start the server
CMD ["sh", "-c", "npm run prisma:deploy && node index.js"]

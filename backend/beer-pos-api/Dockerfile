FROM node:22-slim
WORKDIR /app
COPY package*.json ./
RUN npm config set fetch-retries 5 &&     npm config set fetch-retry-mintimeout 20000 &&     npm config set fetch-retry-maxtimeout 120000 &&     npm ci
COPY . .
RUN mkdir -p /app/data && npx prisma generate
EXPOSE 8080
CMD ["sh", "-c", "npx prisma db push && node prisma/seed.js && node src/server.js"]

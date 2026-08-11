# syntax=docker/dockerfile:1

# ---- build stage ----
FROM node:22-alpine AS build
WORKDIR /app

COPY package.json package-lock.json ./
COPY server/package.json ./server/package.json
RUN npm ci

COPY . .
RUN npm run build \
  && npm run build:server \
  && npm prune --omit=dev

# ---- runtime stage ----
FROM node:22-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production

COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY --from=build /app/server/dist ./server/dist
COPY --from=build /app/server/src/database/migrations ./server/src/database/migrations
COPY server/.env.example ./server/.env.example

RUN mkdir -p /app/server/uploads && chown node:node /app/server/uploads

EXPOSE 5000
USER node
CMD ["node", "server/dist/server.js"]

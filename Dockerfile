FROM node:22-bookworm-slim AS build
WORKDIR /app
# Build tools in case npm decides to compile native modules (better-sqlite3,
# argon2) from source. Only in the build stage; the final image stays slim.
RUN apt-get update \
 && apt-get install -y --no-install-recommends python3 make g++ \
 && rm -rf /var/lib/apt/lists/*
COPY package.json package-lock.json ./
RUN npm ci
ARG SITE_HOSTNAME=wishlist.willjackson.uk
ENV SITE_HOSTNAME=$SITE_HOSTNAME
COPY . .
RUN npm run build && npm prune --omit=dev

FROM node:22-bookworm-slim
WORKDIR /app
ENV NODE_ENV=production \
    HOST=0.0.0.0 \
    PORT=4321 \
    DATABASE_PATH=/data/wishlist.db
COPY --from=build /app/package.json ./
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY --from=build /app/drizzle ./drizzle
COPY --from=build /app/scripts ./scripts
VOLUME /data
EXPOSE 4321
CMD ["node", "dist/server/entry.mjs"]

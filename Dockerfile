FROM node:24-bookworm-slim AS build
WORKDIR /app
ENV DATABASE_URL=postgresql://build:build@127.0.0.1:5432/build?schema=public
RUN apt-get update \
    && apt-get install -y --no-install-recommends ca-certificates openssl python3 make g++ \
    && rm -rf /var/lib/apt/lists/*

COPY package.json package-lock.json ./
COPY apps/api/package.json apps/api/package.json
COPY apps/api/prisma/schema.prisma apps/api/prisma/schema.prisma
COPY apps/web/package.json apps/web/package.json
COPY packages/types/package.json packages/types/package.json
COPY packages/types/index.js packages/types/index.d.ts packages/types/index.ts packages/types/
RUN npm ci --no-audit --no-fund

COPY apps/api apps/api
COPY apps/web apps/web
COPY packages/types packages/types
RUN npm run build --workspace=apps/api \
    && npm run build --workspace=apps/web

FROM build AS migration
ENV NODE_ENV=production
WORKDIR /app/apps/api
USER node
CMD ["./node_modules/.bin/prisma", "migrate", "deploy", "--schema", "prisma/schema.prisma"]

FROM build AS production-dependencies
RUN npm prune --omit=dev --no-audit --no-fund --ignore-scripts

FROM node:24-bookworm-slim AS api-runtime
WORKDIR /app
ENV NODE_ENV=production PORT=4000
RUN apt-get update \
    && apt-get install -y --no-install-recommends ca-certificates openssl \
    && rm -rf /var/lib/apt/lists/*
COPY --from=production-dependencies --chown=node:node /app/node_modules ./node_modules
COPY --from=production-dependencies --chown=node:node /app/apps/api/node_modules ./apps/api/node_modules
COPY --from=production-dependencies --chown=node:node /app/apps/api/package.json ./apps/api/package.json
COPY --from=build --chown=node:node /app/apps/api/dist ./apps/api/dist
COPY --from=build --chown=node:node /app/packages/types ./packages/types
USER node
EXPOSE 4000
CMD ["node", "apps/api/dist/server.js"]

FROM nginxinc/nginx-unprivileged:1.30-alpine3.24 AS web-runtime
COPY deploy/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/apps/web/dist /usr/share/nginx/html
EXPOSE 8443

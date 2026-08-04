# multilevel.wisar.uz web (Next.js) — build from repo root:
#   docker build -f apps/web/Dockerfile -t multilevel-web .
# Mirrors apps/api/Dockerfile (pnpm workspace install, then build the web app).
FROM node:22-alpine

RUN corepack enable

WORKDIR /app
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY apps/web/package.json apps/web/
RUN pnpm install --frozen-lockfile

COPY apps/web apps/web

# API_ORIGIN is baked into next.config rewrites (/api, /uploads → API). Behind
# the reverse proxy /api is routed straight to the API, so this is a fallback;
# still point it at the API container on the shared network for correctness.
ARG API_ORIGIN=http://multilevel-api:3001
ARG NEXT_PUBLIC_TELEGRAM_BOT_USERNAME=
ARG NEXT_PUBLIC_GOOGLE_CLIENT_ID=
ENV API_ORIGIN=$API_ORIGIN \
    NEXT_PUBLIC_TELEGRAM_BOT_USERNAME=$NEXT_PUBLIC_TELEGRAM_BOT_USERNAME \
    NEXT_PUBLIC_GOOGLE_CLIENT_ID=$NEXT_PUBLIC_GOOGLE_CLIENT_ID \
    NODE_ENV=production

WORKDIR /app/apps/web
RUN pnpm build

EXPOSE 3000
CMD ["pnpm", "start"]

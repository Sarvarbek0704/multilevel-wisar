# multilevel.wisar.uz API — build from repo root:
#   docker compose --profile prod up -d --build
FROM node:22-alpine

RUN apk add --no-cache openssl && corepack enable

WORKDIR /app
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY apps/api/package.json apps/api/
RUN pnpm install --frozen-lockfile

COPY apps/api apps/api
COPY content content

WORKDIR /app/apps/api
RUN pnpm prisma:generate && pnpm build

ENV NODE_ENV=production
EXPOSE 3001

# Apply migrations, then start
CMD ["sh", "-c", "pnpm prisma:deploy && node dist/main.js"]

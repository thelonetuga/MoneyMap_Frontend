# 1. Base image
FROM node:20-alpine AS base

# 2. Dependencies
FROM base AS deps
WORKDIR /app
COPY package.json package-lock.json* ./
# CORREÇÃO: --legacy-peer-deps para React 19
RUN npm ci --legacy-peer-deps

# 3. Builder
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# NOTA: Removemos os ARG/ENV de build para forçar o uso do Runtime Env (entrypoint.sh)
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

# 4. Runner
FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Copiar ficheiros (como root, sem chown)
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

# Copiar o script de entrypoint
COPY entrypoint.sh ./entrypoint.sh
RUN chmod +x ./entrypoint.sh

EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Usar o entrypoint para gerar o env-config.js antes de iniciar
ENTRYPOINT ["./entrypoint.sh"]
CMD ["node", "server.js"]
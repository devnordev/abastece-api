# ============================
# Build stage
# ============================
FROM node:20-alpine AS builder

WORKDIR /app

# Dependências de sistema necessárias para Prisma (OpenSSL, libc)
RUN apk add --no-cache openssl libc6-compat

# Copia package.json e package-lock.json primeiro para aproveitar cache
COPY package*.json ./

# Instala todas as dependências (prod + dev) para buildar
RUN npm ci

# Copia arquivos de projeto
COPY tsconfig.json nest-cli.json ./
COPY src ./src
COPY prisma ./prisma

# Gera Prisma Client
# PRISMA_ENGINES_CHECKSUM_IGNORE_MISSING ignora erro de checksum quando servidor Prisma está indisponível
ENV PRISMA_ENGINES_CHECKSUM_IGNORE_MISSING=1
RUN npm run prisma:generate

# Builda a aplicação (gera dist/)
RUN npm run build && ls -la dist

# Remove dependências de dev, mantendo apenas prod e o Prisma Client gerado
RUN npm prune --omit=dev && npm cache clean --force && ls -la node_modules/@prisma/client || true


# ============================
# Runtime stage (produção)
# ============================
FROM node:20-alpine AS production

WORKDIR /app

# Apenas dependências necessárias em produção
COPY package*.json ./

# Copia artefatos e dependências do builder (já sem devDependencies)
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma

# Dependências de sistema necessárias para Prisma Runtime + Timezone
RUN apk add --no-cache openssl libc6-compat tzdata \
&& cp /usr/share/zoneinfo/America/Fortaleza /etc/localtime \
&& echo "America/Fortaleza" > /etc/timezone

# Instala Prisma CLI para poder executar migrations em produção (sem salvar no package.json)
RUN npm install prisma@^6.18.0 --no-save

# Variáveis de ambiente padrão (podem ser sobrescritas em runtime)
ENV NODE_ENV=production \
    PORT=3000 \
    TZ=America/Fortaleza       

EXPOSE 3000

# Comando de inicialização
# Opção 1: Apenas iniciar a aplicação (migrations devem ser aplicadas manualmente antes)
CMD ["node", "dist/src/main.js"]

# Opção 2: Aplicar migrations automaticamente antes de iniciar (descomente se preferir)
# CMD ["sh", "-c", "npx prisma migrate deploy && node dist/src/main.js"]
# 🚀 Guia de Deploy com Migrations

## 📋 Resumo do Processo

Quando você commita código com migrations, elas **vão junto automaticamente** porque:
- A pasta `prisma/migrations` é copiada no Dockerfile
- As migrations são parte do repositório Git

## ✅ Processo Recomendado para Produção

### **Opção 1: Deploy Automático com Migrations (Recomendado)**

Se você quer que as migrations sejam aplicadas automaticamente ao iniciar o container:

1. **Ative a linha comentada no `docker-compose.yml`** (linha 22):
   ```yaml
   command: sh -c "npx prisma migrate deploy && node dist/src/main.js"
   ```

2. **Ou atualize o Dockerfile** para aplicar migrations automaticamente:
   ```dockerfile
   CMD ["sh", "-c", "npx prisma migrate deploy && node dist/src/main.js"]
   ```

**Vantagens:**
- ✅ Automático, sem intervenção manual
- ✅ Migrations sempre aplicadas antes da aplicação iniciar
- ✅ Ideal para CI/CD

**Desvantagens:**
- ⚠️ Se a migration falhar, a aplicação não inicia
- ⚠️ Menos controle sobre quando aplicar

### **Opção 2: Deploy Manual (Mais Seguro)**

Aplicar migrations manualmente antes do deploy:

#### Passo 1: Commit e Push
```bash
git add .
git commit -m "feat: adiciona campos created_date e modified_date ao motorista"
git push origin main
```

#### Passo 2: No Servidor de Produção

**Se usar Docker:**
```bash
# 1. Fazer pull do código atualizado
git pull origin main

# 2. Aplicar migrations ANTES de fazer rebuild
docker exec -it abastece-api sh -c "npx prisma migrate deploy"

# 3. Regenerar Prisma Client (se necessário)
docker exec -it abastece-api sh -c "npx prisma generate"

# 4. Fazer rebuild e restart
docker-compose build
docker-compose up -d
```

**Se usar deploy automático (CI/CD):**
1. O CI/CD faz pull do código
2. **ANTES** de fazer build/restart, execute:
   ```bash
   npx prisma migrate deploy
   npx prisma generate
   ```
3. Depois faça o build e restart

**Vantagens:**
- ✅ Mais controle sobre o processo
- ✅ Pode verificar se a migration funcionou antes de subir a aplicação
- ✅ Pode fazer rollback se necessário

**Desvantagens:**
- ⚠️ Requer intervenção manual
- ⚠️ Pode esquecer de aplicar

## 📝 Checklist de Deploy

- [ ] ✅ Testar migration localmente primeiro
- [ ] ✅ Fazer backup do banco de dados de produção
- [ ] ✅ Commitar código + migrations juntos
- [ ] ✅ Fazer push para o repositório
- [ ] ✅ Aplicar migrations em produção (antes ou durante deploy)
- [ ] ✅ Verificar se migrations foram aplicadas: `npx prisma migrate status`
- [ ] ✅ Fazer deploy da aplicação
- [ ] ✅ Testar se tudo está funcionando

## 🔍 Verificar Status das Migrations

```bash
# Ver quais migrations foram aplicadas
npx prisma migrate status

# Ver histórico de migrations
npx prisma migrate history
```

## ⚠️ Importante

1. **SEMPRE commite migrations junto com o código** - elas fazem parte da aplicação
2. **NUNCA aplique migrations em produção sem testar antes** em desenvolvimento/staging
3. **SEMPRE faça backup** antes de aplicar migrations em produção
4. **Aplique migrations ANTES** de subir a nova versão da aplicação (ou configure para ser automático)

## 🐛 Troubleshooting

### Erro: "Migration already applied"
```bash
# Marcar como aplicada manualmente
npx prisma migrate resolve --applied NOME_DA_MIGRATION
```

### Erro: "Can't reach database server"
- Verifique `DATABASE_URL` nas variáveis de ambiente
- Verifique se o banco está acessível

### Aplicação não inicia após migration
- Verifique os logs: `docker logs abastece-api`
- Verifique se o Prisma Client foi regenerado
- Verifique se todas as migrations foram aplicadas


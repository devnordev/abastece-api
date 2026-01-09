# 🔧 Solução: Erro `comentario_prefeitura` não existe no banco de dados

## 📋 Problema

Após subir atualizações da API para a VPS, apareceram os seguintes erros:

```
The column `abastecimento.comentario_prefeitura` does not exist in the current database.
The column `solicitacoes_abastecimento.comentario_prefeitura` does not exist in the current database.
```

## 🔍 Causa

A migração `20260108130457_add_comentario_prefeitura` que adiciona essas colunas **não foi aplicada** no banco de dados da VPS. O código está tentando usar essas colunas, mas elas não existem no banco.

## ✅ Solução

### **Opção 1: Aplicar Migrations via Prisma (Recomendado)**

Se você estiver usando Docker na VPS:

```bash
# 1. Conecte-se ao container da API
docker exec -it abastece-api sh

# 2. Aplique as migrations pendentes
npx prisma migrate deploy

# 3. Regenere o Prisma Client (se necessário)
npx prisma generate

# 4. Saia do container
exit

# 5. Reinicie o container
docker restart abastece-api
```

Ou execute tudo em um comando:

```bash
docker exec -it abastece-api sh -c "npx prisma migrate deploy && npx prisma generate"
docker restart abastece-api
```

### **Opção 2: Aplicar SQL Manualmente**

Se preferir aplicar o SQL diretamente no banco, você pode usar o script pronto:

**Via Docker:**
```bash
# Copie o arquivo para o container ou execute diretamente
docker exec -i pg-dev psql -U postgres -d abastece < scripts/fix-comentario-prefeitura.sql
```

**Ou execute os comandos SQL diretamente:**
```sql
-- Conecte-se ao banco de dados PostgreSQL
-- psql -h localhost -U postgres -d abastece

-- Adicionar coluna comentario_prefeitura na tabela solicitacoes_abastecimento
ALTER TABLE "solicitacoes_abastecimento" ADD COLUMN IF NOT EXISTS "comentario_prefeitura" TEXT;

-- Adicionar coluna comentario_prefeitura na tabela abastecimento
ALTER TABLE "abastecimento" ADD COLUMN IF NOT EXISTS "comentario_prefeitura" TEXT;
```

Depois de aplicar o SQL manualmente, marque a migration como aplicada:

```bash
docker exec -it abastece-api sh -c "npx prisma migrate resolve --applied 20260108130457_add_comentario_prefeitura"
```

### **Opção 3: Usar Script de Aplicação**

Se você tiver acesso SSH na VPS:

```bash
# Navegue até o diretório da aplicação
cd /caminho/para/abastece-api

# Execute o script (Linux/Mac)
./scripts/apply-migration-prod.sh

# Ou no Windows (PowerShell)
.\scripts\apply-migration-prod.ps1
```

## 🔍 Verificar se Funcionou

Após aplicar a correção, verifique se as colunas foram criadas:

```bash
# Verificar status das migrations
docker exec -it abastece-api sh -c "npx prisma migrate status"

# Ou verificar diretamente no banco
docker exec -it pg-dev psql -U postgres -d abastece -c "\d abastecimento" | grep comentario_prefeitura
docker exec -it pg-dev psql -U postgres -d abastece -c "\d solicitacoes_abastecimento" | grep comentario_prefeitura
```

## ⚠️ Importante

1. **Faça backup do banco** antes de aplicar migrations em produção
2. **Teste em ambiente de desenvolvimento** primeiro
3. **Aplique migrations ANTES** de subir a nova versão da aplicação (ou configure para ser automático)

## 🚀 Prevenir no Futuro

Para evitar esse problema no futuro, você pode configurar o Docker para aplicar migrations automaticamente ao iniciar:

**No `docker-compose.yml`**, descomente a linha 22:

```yaml
command: sh -c "npx prisma migrate deploy && node dist/src/main.js"
```

Ou no `Dockerfile`, descomente a linha 69:

```dockerfile
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/src/main.js"]
```

Isso garantirá que as migrations sejam aplicadas automaticamente sempre que o container iniciar.


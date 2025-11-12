# 📋 Instruções para Aplicar Migration em Produção

## 🚀 Método 1: Usando Prisma Migrate Deploy (Recomendado)

Este é o método recomendado para aplicar migrations em produção.

### Passos:

1. **Conecte-se ao servidor de produção**
   ```bash
   ssh usuario@servidor-producao
   ```

2. **Navegue até o diretório da aplicação**
   ```bash
   cd /caminho/para/aplicacao
   ```

3. **Aplique as migrations**
   ```bash
   npx prisma migrate deploy
   ```

4. **Regenere o Prisma Client (se necessário)**
   ```bash
   npx prisma generate
   ```

5. **Reinicie a aplicação**
   ```bash
   # Docker
   docker-compose restart api
   
   # Ou PM2
   pm2 restart api
   
   # Ou systemd
   sudo systemctl restart api
   ```

## 🐳 Método 2: Usando Docker

Se você estiver usando Docker, pode executar os comandos dentro do container:

```bash
# Entrar no container
docker exec -it abastece-api sh

# Aplicar migrations
npx prisma migrate deploy

# Regenerar Prisma Client
npx prisma generate

# Sair do container
exit

# Reiniciar o container
docker restart abastece-api
```

## 📝 Método 3: Aplicar SQL Manualmente

Se preferir aplicar o SQL manualmente:

1. **Conecte-se ao banco de dados**
   ```bash
   psql -h localhost -U postgres -d abastece
   ```

2. **Execute o SQL da migration**
   ```sql
   -- Copie e execute o conteúdo de:
   -- prisma/migrations/20251112184251_add_solicitacoes_qrcode_veiculo/migration.sql
   ```

3. **Registre a migration no Prisma**
   ```bash
   npx prisma migrate resolve --applied 20251112184251_add_solicitacoes_qrcode_veiculo
   ```

## 🔍 Verificar se a Migration foi Aplicada

Para verificar se a migration foi aplicada com sucesso:

```bash
# Verificar status das migrations
npx prisma migrate status

# Verificar se a tabela foi criada
npx prisma studio
# Ou
psql -h localhost -U postgres -d abastece -c "\dt solicitacoes_qrcode_veiculo"
```

## ⚠️ Importante

- **Backup**: Sempre faça backup do banco de dados antes de aplicar migrations em produção
- **Teste**: Teste as migrations em um ambiente de staging primeiro
- **Horário**: Aplique migrations em horários de baixo tráfego
- **Monitoramento**: Monitore a aplicação após aplicar as migrations

## 🐛 Troubleshooting

### Erro: "Migration already applied"
```bash
# Marcar migration como aplicada
npx prisma migrate resolve --applied 20251112184251_add_solicitacoes_qrcode_veiculo
```

### Erro: "Can't reach database server"
- Verifique se o banco de dados está rodando
- Verifique as variáveis de ambiente (DATABASE_URL)
- Verifique as credenciais de acesso

### Erro: "Table already exists"
- A tabela já pode existir no banco
- Verifique se a migration já foi aplicada
- Use `npx prisma migrate status` para verificar


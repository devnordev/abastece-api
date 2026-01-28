# 🚀 Guia para Aplicar Funcionalidade de Telemetria

Este guia explica como aplicar as mudanças necessárias para que a funcionalidade de telemetria funcione corretamente.

## 📋 Pré-requisitos

- Banco de dados PostgreSQL rodando
- Node.js e npm instalados
- Acesso ao banco de dados de produção/staging

## 🔧 Passos para Aplicar

### 1. Fazer Backup do Banco de Dados (RECOMENDADO)

```bash
# No PostgreSQL, faça backup da tabela prefeitura
pg_dump -h localhost -U seu_usuario -d abastece -t prefeitura > backup_prefeitura_$(date +%Y%m%d_%H%M%S).sql
```

### 2. Executar a Migration

```bash
cd abastece-api

# Executar a migration para adicionar os campos de telemetria
npx prisma migrate deploy
```

**OU** se estiver em desenvolvimento:

```bash
npx prisma migrate dev
```

### 3. Gerar o Prisma Client

```bash
# Gerar o Prisma Client com os novos campos
npx prisma generate
```

### 4. Reiniciar o Servidor Backend

```bash
# Parar o servidor atual (Ctrl+C)
# Depois iniciar novamente
npm run start:dev
```

### 5. Verificar se Funcionou

#### 5.1. Verificar no Banco de Dados

```sql
-- Conectar ao PostgreSQL
psql -h localhost -U seu_usuario -d abastece

-- Verificar se as colunas foram adicionadas
\d prefeitura

-- Deve mostrar as novas colunas:
-- telemetria_organizacao_id | text
-- telemetria_api_key        | text
-- telemetria_api_key_id      | text
```

#### 5.2. Testar a API

1. **Criar uma organização de telemetria:**
   - Acesse `/superadmin/telemetria` no frontend
   - Clique em "Configurar Organização" para uma prefeitura
   - Clique em "Criar Organização"
   - Verifique se a API key foi salva

2. **Verificar no banco:**
   ```sql
   SELECT id, nome, telemetria_organizacao_id, telemetria_api_key 
   FROM prefeitura 
   WHERE telemetria_organizacao_id IS NOT NULL;
   ```

3. **Configurar um dispositivo:**
   - Na mesma página, clique em "Configurar Telemetria" em um veículo
   - Preencha IMEI e Label
   - Clique em "Salvar"
   - Verifique se o dispositivo foi criado no tracker-api

## ✅ Checklist de Verificação

- [ ] Migration executada com sucesso
- [ ] Prisma Client gerado
- [ ] Servidor backend reiniciado
- [ ] Colunas verificadas no banco de dados
- [ ] Criação de organização funcionando
- [ ] API key sendo salva na prefeitura
- [ ] Configuração de dispositivo funcionando

## 🐛 Troubleshooting

### Erro: "Migration failed"

Se a migration falhar, verifique:
1. Se o banco de dados está acessível
2. Se as colunas já existem (pode ter sido aplicada antes)
3. Logs do Prisma para mais detalhes

### Erro: "Column already exists"

Se as colunas já existem, você pode:
1. Marcar a migration como aplicada: `npx prisma migrate resolve --applied 20260129000000_add_telemetria_fields_to_prefeitura`
2. Ou simplesmente continuar (não há problema se já existirem)

### Erro: "Cannot find module '@prisma/client'"

Execute:
```bash
npm install
npx prisma generate
```

## 📝 Notas Importantes

- **A migration é segura**: Adiciona apenas colunas opcionais (NULLABLE)
- **Não quebra funcionalidades existentes**: As colunas são opcionais
- **Pode ser executada em produção**: Não há risco de perda de dados

## 🔄 Próximos Passos (Opcional)

Se precisar também vincular dispositivos aos veículos, será necessário:
1. Adicionar campos `dispositivo_id` e `imei` na tabela `veiculo`
2. Criar rotas `/telemetria/veiculo/:veiculoId` no backend

Mas isso pode ser feito depois, pois não é necessário para a funcionalidade básica funcionar.

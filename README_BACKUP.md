# 💾 Módulo de Backup e Restauração

Este módulo permite gerar e restaurar backups do banco de dados com controle de permissões baseado no perfil do usuário.

## 📋 Índice

1. [Visão Geral](#visão-geral)
2. [Funcionalidades](#funcionalidades)
3. [Perfis de Usuário e Permissões](#perfis-de-usuário-e-permissões)
4. [Como Usar](#como-usar)
5. [Endpoints da API](#endpoints-da-api)
6. [Script de Linha de Comando](#script-de-linha-de-comando)
7. [Restauração de Backup](#restauração-de-backup)
8. [Estrutura de Arquivos](#estrutura-de-arquivos)

## 🎯 Visão Geral

O módulo de backup permite:

- ✅ Gerar backups completos do banco de dados (apenas SUPER_ADMIN)
- ✅ Gerar backups filtrados por prefeitura (ADMIN_PREFEITURA e COLABORADOR_PREFEITURA)
- ✅ Gerar backups filtrados por empresa (ADMIN_EMPRESA e COLABORADOR_EMPRESA)
- ✅ Listar backups disponíveis
- ✅ Restaurar backups com validação de permissões
- ✅ Excluir backups (apenas SUPER_ADMIN)

## 🔐 Perfis de Usuário e Permissões

### SUPER_ADMIN
- ✅ Pode gerar backup completo do banco de dados
- ✅ Pode gerar backup filtrado por prefeitura ou empresa
- ✅ Pode restaurar qualquer backup
- ✅ Pode excluir qualquer backup
- ✅ Pode listar todos os backups

### ADMIN_PREFEITURA / COLABORADOR_PREFEITURA
- ✅ Pode gerar backup apenas dos dados da sua prefeitura
- ✅ Pode restaurar apenas backups da sua prefeitura
- ✅ Pode listar backups (mas só pode restaurar os seus)

### ADMIN_EMPRESA / COLABORADOR_EMPRESA
- ✅ Pode gerar backup apenas dos dados da sua empresa
- ✅ Pode restaurar apenas backups da sua empresa
- ✅ Pode listar backups (mas só pode restaurar os seus)

## 🚀 Como Usar

### Via API (Recomendado)

#### 1. Gerar Backup

**Backup Completo (apenas SUPER_ADMIN):**
```bash
POST /backup/generate/full
Authorization: Bearer <token>
```

**Backup por Perfil:**
```bash
POST /backup/generate
Authorization: Bearer <token>
```

**Resposta:**
```json
{
  "message": "Backup gerado com sucesso",
  "filename": "backup_06-11-2025-143022.sql",
  "downloadUrl": "/backup/download/backup_06-11-2025-143022.sql"
}
```

#### 2. Listar Backups

```bash
GET /backup/list
Authorization: Bearer <token>
```

**Resposta:**
```json
{
  "message": "Backups listados com sucesso",
  "backups": [
    {
      "filename": "backup_06-11-2025-143022.sql",
      "size": 524288,
      "created": "2025-11-06T14:30:22.000Z",
      "modified": "2025-11-06T14:30:22.000Z"
    }
  ]
}
```

#### 3. Restaurar Backup

```bash
POST /backup/restore/backup_06-11-2025-143022.sql
Authorization: Bearer <token>
```

**Resposta:**
```json
{
  "message": "Backup restaurado com sucesso"
}
```

#### 4. Excluir Backup (apenas SUPER_ADMIN)

```bash
DELETE /backup/backup_06-11-2025-143022.sql
Authorization: Bearer <token>
```

### Via Script de Linha de Comando

#### 1. Backup Completo

```bash
npm run seed:backup -- --full
```

ou

```bash
ts-node prisma/seed-backup.ts --full
```

#### 2. Backup por Prefeitura

```bash
npm run seed:backup -- --prefeitura-id=1
```

ou

```bash
ts-node prisma/seed-backup.ts --prefeitura-id=1
```

#### 3. Backup por Empresa

```bash
npm run seed:backup -- --empresa-id=1
```

ou

```bash
ts-node prisma/seed-backup.ts --empresa-id=1
```

## 📁 Estrutura de Arquivos

Os backups são salvos no diretório `backups/` na raiz do projeto:

```
abastece-api/
├── backups/
│   ├── backup_06-11-2025-143022.sql
│   ├── backup_06-11-2025-150145.sql
│   └── ...
├── prisma/
│   └── seed-backup.ts
└── src/
    └── modules/
        └── backup/
            ├── backup.module.ts
            ├── backup.service.ts
            └── backup.controller.ts
```

## 📝 Formato do Arquivo de Backup

Os arquivos de backup seguem o formato:

- **Nome:** `backup_DD-MM-YYYY-HHMMSS.sql`
- **Exemplo:** `backup_06-11-2025-143022.sql`

O conteúdo do arquivo inclui:

1. **Cabeçalho com informações:**
   - Data/Hora do backup
   - Timestamp
   - Tipo de backup (Completo, Prefeitura ou Empresa)
   - ID da prefeitura/empresa (se aplicável)

2. **Comandos SQL INSERT:**
   - Todos os registros das tabelas relacionadas
   - Preserva relacionamentos e integridade referencial

## 🔄 Restauração de Backup

### Como Restaurar

#### 1. Via API

```bash
POST /backup/restore/backup_06-11-2025-143022.sql
Authorization: Bearer <token>
```

O sistema valida automaticamente se o usuário tem permissão para restaurar o backup.

#### 2. Via PostgreSQL (Manual)

Se você tiver acesso direto ao banco de dados:

```bash
psql -h localhost -U postgres -d abastece -f backups/backup_06-11-2025-143022.sql
```

### Importante ⚠️

- ⚠️ A restauração **sobrescreve** os dados existentes
- ⚠️ Faça um backup antes de restaurar
- ⚠️ Verifique se você tem permissão para restaurar o backup
- ⚠️ Backups completos devem ser restaurados apenas por SUPER_ADMIN

## 📊 Exemplos Práticos

### Exemplo 1: ADMIN_PREFEITURA gerando backup

```bash
# 1. Fazer login
POST /auth/login
{
  "email": "admin@prefeitura.com",
  "senha": "senha123"
}

# 2. Gerar backup
POST /backup/generate
Authorization: Bearer <token>

# Resposta: backup apenas dos dados da prefeitura
```

### Exemplo 2: SUPER_ADMIN gerando backup completo

```bash
# 1. Fazer login
POST /auth/login
{
  "email": "superadmin@nordev.com",
  "senha": "senha123"
}

# 2. Gerar backup completo
POST /backup/generate/full
Authorization: Bearer <token>

# Resposta: backup completo de todo o banco
```

### Exemplo 3: Restaurar backup

```bash
# 1. Listar backups disponíveis
GET /backup/list
Authorization: Bearer <token>

# 2. Restaurar backup específico
POST /backup/restore/backup_06-11-2025-143022.sql
Authorization: Bearer <token>
```

## 🛠️ Troubleshooting

### Erro: "DATABASE_URL não configurada"

Verifique se a variável de ambiente `DATABASE_URL` está configurada no arquivo `.env`.

### Erro: "Usuário não está vinculado a uma prefeitura/empresa"

Verifique se o usuário tem `prefeituraId` ou `empresaId` configurado no banco de dados.

### Erro: "Você não tem permissão para restaurar este backup"

- Verifique se o backup pertence ao seu perfil
- SUPER_ADMIN pode restaurar qualquer backup
- Outros perfis só podem restaurar backups da sua prefeitura/empresa

### Backup não está sendo gerado

- Verifique se o diretório `backups/` existe e tem permissões de escrita
- Verifique os logs do servidor para mais detalhes

## 📚 Endpoints da API

### POST `/backup/generate`
Gera backup baseado no perfil do usuário autenticado.

**Permissões:** Todos os usuários autenticados

### POST `/backup/generate/full`
Gera backup completo do banco de dados.

**Permissões:** Apenas SUPER_ADMIN

### GET `/backup/list`
Lista todos os backups disponíveis.

**Permissões:** Todos os usuários autenticados

### POST `/backup/restore/:filename`
Restaura um backup específico.

**Permissões:** 
- SUPER_ADMIN: qualquer backup
- Outros: apenas backups da sua prefeitura/empresa

### DELETE `/backup/:filename`
Exclui um backup.

**Permissões:** Apenas SUPER_ADMIN

## 🎯 Boas Práticas

1. ✅ **Faça backups regularmente** - Configure backups automáticos se possível
2. ✅ **Armazene backups externamente** - Não dependa apenas do servidor
3. ✅ **Teste restaurações** - Verifique se os backups funcionam antes de precisar
4. ✅ **Mantenha histórico** - Não exclua backups antigos imediatamente
5. ✅ **Documente** - Mantenha registro de quando e por que os backups foram feitos

## 📞 Suporte

Para mais informações ou problemas, consulte:
- Documentação do Prisma: https://www.prisma.io/docs
- Documentação do PostgreSQL: https://www.postgresql.org/docs/

---

**Desenvolvido para o sistema Abastece API** 🚀


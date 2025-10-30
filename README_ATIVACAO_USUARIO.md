# 🔐 Guia de Ativação de Usuários

Este guia explica como ativar um usuário cadastrado no sistema de abastecimento.

## 📋 Visão Geral

Quando um usuário é cadastrado no sistema, ele é criado com os seguintes status:
- **`statusAcess`**: `Acesso_solicitado` (padrão)
- **`ativo`**: `true` (padrão)

Para que o usuário possa fazer login e acessar o sistema, é necessário alterar o `statusAcess` para `Ativado`.

## 🚀 Como Ativar um Usuário

### Método 1: Via API (Recomendado)

#### 1. **Fazer Login como Administrador**
```bash
POST /auth/login
Content-Type: application/json

{
  "email": "superadmin@nordev.com",
  "senha": "123456"
}
```

**Resposta:**
```json
{
  "message": "Login realizado com sucesso",
  "usuario": {
    "id": 1,
    "email": "superadmin@nordev.com",
    "nome": "Super Administrador",
    "tipo_usuario": "SUPER_ADMIN",
    "statusAcess": "Ativado"
  },
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "abc123...",
  "expiresIn": "15m"
}
```

#### 2. **Buscar o Usuário a Ser Ativado**
```bash
GET /usuarios?email=usuario@exemplo.com
Authorization: Bearer <seu-access-token>
```

**Resposta:**
```json
{
  "message": "Usuários encontrados com sucesso",
  "usuarios": [
    {
      "id": 2,
      "email": "usuario@exemplo.com",
      "nome": "João Silva",
      "cpf": "12345678901",
      "tipo_usuario": "ADMIN_PREFEITURA",
      "statusAcess": "Acesso_solicitado",
      "ativo": true,
      "data_cadastro": "2024-01-15T10:30:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 1,
    "totalPages": 1
  }
}
```

#### 3. **Ativar o Usuário**
```bash
PATCH /usuarios/2
Authorization: Bearer <seu-access-token>
Content-Type: application/json

{
  "statusAcess": "Ativado"
}
```

**Resposta:**
```json
{
  "message": "Usuário atualizado com sucesso",
  "usuario": {
    "id": 2,
    "email": "usuario@exemplo.com",
    "nome": "João Silva",
    "cpf": "12345678901",
    "tipo_usuario": "ADMIN_PREFEITURA",
    "statusAcess": "Ativado",
    "ativo": true,
    "data_cadastro": "2024-01-15T10:30:00.000Z"
  }
}
```

### Método 2: Via Banco de Dados (Avançado)

Se você tem acesso direto ao banco de dados PostgreSQL:

```sql
-- Conectar ao banco de dados
psql -h localhost -U username -d abastecimento_db

-- Ativar usuário específico por email
UPDATE usuario 
SET "statusAcess" = 'Ativado' 
WHERE email = 'usuario@exemplo.com';

-- Ativar usuário específico por ID
UPDATE usuario 
SET "statusAcess" = 'Ativado' 
WHERE id = 2;

-- Verificar se a ativação foi bem-sucedida
SELECT id, email, nome, "statusAcess", ativo 
FROM usuario 
WHERE email = 'usuario@exemplo.com';
```

## 📊 Status de Acesso Disponíveis

| Status | Descrição | Ação Necessária |
|--------|-----------|-----------------|
| `Acesso_solicitado` | Usuário cadastrado, aguardando ativação | Ativar manualmente |
| `Em_validacao` | Usuário em processo de validação | Aguardar ou ativar |
| `Ativado` | Usuário ativo, pode fazer login | ✅ Pronto para uso |
| `Desativado` | Usuário desativado | Reativar se necessário |

## 👥 Perfis de Usuário e Permissões

### 🔐 Quem Pode Gerenciar Usuários

| Perfil | Pode Ativar | Pode Desativar | Pode Alterar Status | Escopo |
|--------|-------------|----------------|-------------------|---------|
| `SUPER_ADMIN` | ✅ Todos | ✅ Todos | ✅ Todos | Sistema completo |
| `ADMIN_PREFEITURA` | ✅ Usuários da prefeitura | ✅ Usuários da prefeitura | ✅ Usuários da prefeitura | Apenas prefeitura |
| `ADMIN_EMPRESA` | ✅ Usuários da empresa | ✅ Usuários da empresa | ✅ Usuários da empresa | Apenas empresa |
| `COLABORADOR_PREFEITURA` | ❌ Não | ❌ Não | ❌ Não | Apenas visualização |
| `COLABORADOR_EMPRESA` | ❌ Não | ❌ Não | ❌ Não | Apenas visualização |

## 🚫 Como Desativar um Usuário

### Via API

#### 1. **Fazer Login como Administrador**
```bash
POST /auth/login
Content-Type: application/json

{
  "email": "superadmin@nordev.com",
  "senha": "123456"
}
```

#### 2. **Desativar Usuário (Status: Desativado)**
```bash
PATCH /usuarios/2
Authorization: Bearer <seu-access-token>
Content-Type: application/json

{
  "statusAcess": "Desativado"
}
```

#### 3. **Desativar Usuário (Campo ativo: false)**
```bash
PATCH /usuarios/2
Authorization: Bearer <seu-access-token>
Content-Type: application/json

{
  "ativo": false
}
```

**Resposta:**
```json
{
  "message": "Usuário atualizado com sucesso",
  "usuario": {
    "id": 2,
    "email": "usuario@exemplo.com",
    "nome": "João Silva",
    "statusAcess": "Desativado",
    "ativo": false
  }
}
```

### Via Banco de Dados

```sql
-- Desativar por status
UPDATE usuario 
SET "statusAcess" = 'Desativado' 
WHERE email = 'usuario@exemplo.com';

-- Desativar por campo ativo
UPDATE usuario 
SET ativo = false 
WHERE email = 'usuario@exemplo.com';

-- Desativar completamente (ambos)
UPDATE usuario 
SET "statusAcess" = 'Desativado', ativo = false 
WHERE email = 'usuario@exemplo.com';
```

## 🔄 Alterar Status de Validação

### Colocar Usuário em Validação

```bash
PATCH /usuarios/2
Authorization: Bearer <seu-access-token>
Content-Type: application/json

{
  "statusAcess": "Em_validacao"
}
```

### Retornar para Acesso Solicitado

```bash
PATCH /usuarios/2
Authorization: Bearer <seu-access-token>
Content-Type: application/json

{
  "statusAcess": "Acesso_solicitado"
}
```

## 🔄 Fluxo de Trabalho Recomendado

### 1. **Novo Usuário Cadastrado**
```
Usuário se cadastra → statusAcess: "Acesso_solicitado", ativo: true
```

### 2. **Processo de Validação (Opcional)**
```
Administrador coloca em validação → statusAcess: "Em_validacao"
```

### 3. **Ativação do Usuário**
```
Administrador ativa → statusAcess: "Ativado"
Usuário pode fazer login e usar o sistema
```

### 4. **Desativação Temporária**
```
Administrador desativa → statusAcess: "Desativado"
Usuário não consegue fazer login
```

### 5. **Desativação Permanente**
```
Administrador desabilita → ativo: false
Usuário completamente bloqueado
```

### 6. **Reativação**
```
Administrador reativa → statusAcess: "Ativado", ativo: true
Usuário volta a ter acesso completo
```

## 🔍 Verificar Status de Usuários

### Listar Todos os Usuários Pendentes de Ativação
```bash
GET /usuarios?statusAcess=Acesso_solicitado
Authorization: Bearer <seu-access-token>
```

### Listar Usuários em Validação
```bash
GET /usuarios?statusAcess=Em_validacao
Authorization: Bearer <seu-access-token>
```

### Listar Usuários Ativos
```bash
GET /usuarios?statusAcess=Ativado
Authorization: Bearer <seu-access-token>
```

### Listar Usuários Desativados
```bash
GET /usuarios?statusAcess=Desativado
Authorization: Bearer <seu-access-token>
```

### Listar Usuários Inativos (campo ativo = false)
```bash
GET /usuarios?ativo=false
Authorization: Bearer <seu-access-token>
```

## ⚠️ Importante

### 🔐 Permissões de Acesso
1. **Apenas usuários com perfil de administrador** podem gerenciar outros usuários:
   - `SUPER_ADMIN`: Acesso total ao sistema
   - `ADMIN_PREFEITURA`: Apenas usuários da mesma prefeitura
   - `ADMIN_EMPRESA`: Apenas usuários da mesma empresa
2. **Colaboradores** (`COLABORADOR_PREFEITURA` e `COLABORADOR_EMPRESA`) **não podem** alterar status de usuários

### 🔑 Campos de Controle de Acesso
3. **O campo `ativo`** deve estar como `true` para que o usuário possa fazer login
4. **O campo `statusAcess`** deve estar como `Ativado` para permitir acesso completo
5. **Usuários com `statusAcess` diferente de `Ativado`** não conseguem fazer login, mesmo com credenciais corretas

### 📋 Diferenças entre Campos
6. **`statusAcess`**: Controla o nível de acesso do usuário no sistema
   - `Acesso_solicitado`: Aguardando aprovação
   - `Em_validacao`: Em processo de validação
   - `Ativado`: Acesso liberado
   - `Desativado`: Acesso negado/revogado
7. **`ativo`**: Controla se o usuário pode fazer login (true/false)
8. **Para login completo**: Ambos `ativo: true` E `statusAcess: "Ativado"`

## 🧪 Testando a Ativação

Após ativar um usuário, teste fazendo login com as credenciais dele:

```bash
POST /auth/login
Content-Type: application/json

{
  "email": "usuario@exemplo.com",
  "senha": "senha123"
}
```

Se a ativação foi bem-sucedida, você receberá um token de acesso e poderá usar a API normalmente.

## 🚨 Solução de Problemas

### Erro: "Usuário inativo"
- **Causa**: Campo `ativo` está como `false`
- **Solução**: Atualizar o campo `ativo` para `true`

### Erro: "Credenciais inválidas" (mesmo com senha correta)
- **Causa**: `statusAcess` não está como `Ativado`
- **Solução**: Ativar o usuário conforme este guia

### Erro: "Não autorizado" ao tentar alterar usuário
- **Causa**: Usuário logado não tem permissão de administrador
- **Solução**: Fazer login com perfil `SUPER_ADMIN`, `ADMIN_PREFEITURA` ou `ADMIN_EMPRESA`

### Erro: "Não é possível alterar usuário de outra prefeitura/empresa"
- **Causa**: Tentativa de alterar usuário fora do escopo de permissão
- **Solução**: Apenas `SUPER_ADMIN` pode alterar usuários de qualquer escopo

### Usuário não aparece na listagem
- **Causa**: Filtros de busca ou permissões
- **Solução**: Verificar parâmetros de busca e permissões do usuário logado

### Usuário consegue fazer login mas tem acesso limitado
- **Causa**: `statusAcess` pode estar como `Em_validacao` ou `Acesso_solicitado`
- **Solução**: Alterar `statusAcess` para `Ativado`

### Diferença entre "Desativado" e "ativo: false"
- **`statusAcess: "Desativado"`**: Usuário foi desativado por um administrador
- **`ativo: false`**: Usuário foi desabilitado (mais restritivo)
- **Ambos**: Usuário completamente bloqueado do sistema

## 📞 Suporte

Se encontrar problemas durante a ativação de usuários, verifique:
1. Se você tem permissões de administrador
2. Se o token de autenticação está válido
3. Se o usuário existe no sistema
4. Se os dados estão sendo enviados corretamente

Para mais informações, consulte a documentação da API em `/api/docs` quando a aplicação estiver rodando.

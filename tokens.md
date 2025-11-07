# 🔐 Guia Completo de Autenticação e Tokens

## 📋 Índice

- [Visão Geral](#visão-geral)
- [Tipos de Tokens](#tipos-de-tokens)
- [Rotas Públicas vs Protegidas](#rotas-públicas-vs-protegidas)
- [Guia por Perfil de Usuário](#guia-por-perfil-de-usuário)
  - [SUPER_ADMIN](#1-super_admin)
  - [ADMIN_PREFEITURA](#2-admin_prefeitura)
  - [COLABORADOR_PREFEITURA](#3-colaborador_prefeitura)
  - [ADMIN_EMPRESA](#4-admin_empresa)
  - [COLABORADOR_EMPRESA](#5-colaborador_empresa)
- [Fluxo Completo de Autenticação](#fluxo-completo-de-autenticação)
- [Renovação de Tokens](#renovação-de-tokens)
- [Exemplos Práticos](#exemplos-práticos)
- [Solução de Problemas](#solução-de-problemas)

---

## 🎯 Visão Geral

Este sistema utiliza autenticação baseada em **JWT (JSON Web Tokens)** com dois tipos de tokens:

1. **Access Token**: Token de curta duração (15 minutos) usado para acessar rotas protegidas
2. **Refresh Token**: Token de longa duração (7 dias) usado para renovar o Access Token

---

## 🔑 Tipos de Tokens

### Access Token (JWT)
- **Duração**: 15 minutos (configurável via `JWT_EXPIRES_IN`)
- **Formato**: JWT assinado
- **Uso**: Enviado no header `Authorization` de todas as requisições protegidas
- **Formato no Header**: `Authorization: Bearer {accessToken}`
- **Expiração**: Após 15 minutos, o token expira e precisa ser renovado

### Refresh Token
- **Duração**: 7 dias
- **Formato**: String aleatória hexadecimal (64 caracteres)
- **Uso**: Enviado no body da requisição para renovar o Access Token
- **Armazenamento**: Salvo no banco de dados e pode ser revogado
- **Renovação**: A cada renovação, um novo Refresh Token é gerado e o antigo é revogado

---

## 🚪 Rotas Públicas vs Protegidas

### ✅ Rotas Públicas (NÃO precisam de token)

Estas rotas **NÃO** requerem o header `Authorization`:

1. **`POST /auth/register`** - Registrar novo usuário
   - Não precisa de autenticação
   - Qualquer pessoa pode se registrar
   - Status inicial: `Acesso_solicitado`

2. **`POST /auth/login`** - Fazer login
   - Não precisa de autenticação
   - Retorna `accessToken` e `refreshToken`

3. **`POST /auth/refresh`** - Renovar tokens
   - Não precisa de Access Token
   - Precisa apenas do `refreshToken` no body

### 🔒 Rotas Protegidas (PRECISAM de token)

**TODAS as outras rotas** requerem o header `Authorization` com o Access Token válido:

```
Authorization: Bearer {accessToken}
```

Exemplos de rotas protegidas:
- `GET /auth/profile` - Ver perfil do usuário
- `POST /auth/logout` - Fazer logout
- `GET /usuarios` - Listar usuários
- `POST /veiculos` - Criar veículo
- `GET /abastecimentos` - Listar abastecimentos
- E todas as outras rotas da API...

---

## 👥 Guia por Perfil de Usuário

### 1. SUPER_ADMIN

#### 📝 Passo a Passo Completo

##### **Passo 1: Registrar ou Fazer Login**

**Opção A - Se você já tem conta:**
```http
POST /auth/login
Content-Type: application/json

{
  "email": "admin@exemplo.com",
  "senha": "sua_senha"
}
```

**Resposta:**
```json
{
  "message": "Login realizado com sucesso",
  "usuario": {
    "id": 1,
    "email": "admin@exemplo.com",
    "nome": "Administrador",
    "tipo_usuario": "SUPER_ADMIN",
    "statusAcess": "Ativado"
  },
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6",
  "expiresIn": "15m"
}
```

**Opção B - Se você precisa se registrar:**
```http
POST /auth/register
Content-Type: application/json

{
  "email": "admin@exemplo.com",
  "senha": "sua_senha",
  "nome": "Administrador",
  "cpf": "12345678901",
  "tipo_usuario": "SUPER_ADMIN"
}
```

**⚠️ IMPORTANTE**: Após o registro, você precisará que um SUPER_ADMIN ative sua conta (mudar `statusAcess` de `Acesso_solicitado` para `Ativado`).

##### **Passo 2: Usar o Access Token nas Requisições**

**✅ TODAS as requisições protegidas precisam do header Authorization:**

```http
GET /auth/profile
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Exemplo: Listar Usuários**
```http
GET /usuarios
Authorization: Bearer {seu_accessToken}
```

**Exemplo: Criar Combustível**
```http
POST /combustiveis
Authorization: Bearer {seu_accessToken}
Content-Type: application/json

{
  "nome": "Gasolina Comum",
  "sigla": "GAS",
  "descricao": "Gasolina comum sem aditivos"
}
```

##### **Passo 3: Quando o Token Expirar (após 15 minutos)**

**Sintoma**: Você receberá erro `401 Unauthorized` nas requisições.

**Solução**: Renovar o token usando o Refresh Token:

```http
POST /auth/refresh
Content-Type: application/json

{
  "refreshToken": "a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6"
}
```

**Resposta:**
```json
{
  "message": "Tokens renovados com sucesso",
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "novo_refresh_token_aqui",
  "expiresIn": "15m"
}
```

**⚠️ IMPORTANTE**: 
- O Refresh Token antigo é **automaticamente revogado**
- Use o **novo refreshToken** retornado para próximas renovações
- O novo Access Token tem validade de mais 15 minutos

##### **Passo 4: Fazer Logout**

```http
POST /auth/logout
Authorization: Bearer {seu_accessToken}
```

**Resposta:**
```json
{
  "message": "Logout realizado com sucesso"
}
```

**⚠️ IMPORTANTE**: Após o logout, **TODOS** os Refresh Tokens do usuário são revogados. Você precisará fazer login novamente.

#### 🎯 Rotas Disponíveis para SUPER_ADMIN

**✅ Pode acessar (com header Authorization):**
- `/usuarios` - CRUD completo de usuários
- `/combustiveis` - CRUD completo de combustíveis
- `/empresas` - CRUD completo de empresas
- `/prefeituras` - CRUD completo de prefeituras
- `/processos` - CRUD completo de processos
- `/contratos` - CRUD completo de contratos
- `/categorias` - CRUD completo de categorias
- `/anp-semana` - Gerenciamento de semanas ANP
- `/anp-precos-uf` - Gerenciamento de preços ANP
- `/parametros-teto` - Gerenciamento de parâmetros de teto

**❌ NÃO pode acessar:**
- `/veiculos` - Retorna erro 403
- `/motoristas` - Retorna erro 403
- `/orgaos` - Retorna erro 403
- `/abastecimentos` - Retorna erro 403

---

### 2. ADMIN_PREFEITURA

#### 📝 Passo a Passo Completo

##### **Passo 1: Fazer Login**

```http
POST /auth/login
Content-Type: application/json

{
  "email": "admin.prefeitura@exemplo.com",
  "senha": "sua_senha"
}
```

**Resposta:**
```json
{
  "message": "Login realizado com sucesso",
  "usuario": {
    "id": 2,
    "email": "admin.prefeitura@exemplo.com",
    "nome": "Admin Prefeitura",
    "tipo_usuario": "ADMIN_PREFEITURA",
    "statusAcess": "Ativado",
    "prefeitura": {
      "id": 1,
      "nome": "Prefeitura de São Paulo",
      "cnpj": "12.345.678/0001-90"
    }
  },
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6",
  "expiresIn": "15m"
}
```

##### **Passo 2: Usar o Access Token nas Requisições**

**✅ TODAS as requisições protegidas precisam do header Authorization:**

**Exemplo: Criar Veículo**
```http
POST /veiculos
Authorization: Bearer {seu_accessToken}
Content-Type: application/json

{
  "nome": "Ambulância 01",
  "placa": "ABC1234",
  "modelo": "Mercedes Sprinter",
  "ano": 2023,
  "capacidade_tanque": 80.00,
  "tipo_veiculo": "Ambulancia",
  "situacao_veiculo": "Proprio",
  "tipo_abastecimento": "COTA",
  "periodicidade": "Mensal",
  "quantidade": 200.0,
  "orgaoId": 1,
  "combustiveis": [1, 2]
}
```

**Exemplo: Listar Veículos (filtrado automaticamente pela prefeitura)**
```http
GET /veiculos
Authorization: Bearer {seu_accessToken}
```

**⚠️ IMPORTANTE**: O sistema **automaticamente filtra** os dados pela prefeitura do usuário. Você só verá veículos, motoristas, órgãos e abastecimentos da sua prefeitura.

##### **Passo 3: Quando o Token Expirar**

Mesmo processo do SUPER_ADMIN:

```http
POST /auth/refresh
Content-Type: application/json

{
  "refreshToken": "seu_refresh_token_aqui"
}
```

##### **Passo 4: Fazer Logout**

```http
POST /auth/logout
Authorization: Bearer {seu_accessToken}
```

#### 🎯 Rotas Disponíveis para ADMIN_PREFEITURA

**✅ Pode acessar (com header Authorization):**
- `/usuarios` - CRUD (apenas COLABORADOR_PREFEITURA da mesma prefeitura)
- `/orgaos` - CRUD completo (apenas da própria prefeitura)
- `/veiculos` - CRUD completo (apenas da própria prefeitura)
- `/motoristas` - CRUD completo (apenas da própria prefeitura)
- `/abastecimentos` - CRUD completo (apenas da própria prefeitura)
- `/cota-orgao` - Gerenciamento de cotas (apenas da própria prefeitura)
- `/conta-faturamento-orgao` - Gerenciamento de contas (apenas da própria prefeitura)

**❌ NÃO pode acessar:**
- `/combustiveis` - Retorna erro 403
- `/empresas` - Retorna erro 403
- `/prefeituras` - Retorna erro 403
- `/processos` - Retorna erro 403
- `/contratos` - Retorna erro 403
- Dados de outras prefeituras - Filtrado automaticamente

---

### 3. COLABORADOR_PREFEITURA

#### 📝 Passo a Passo Completo

##### **Passo 1: Fazer Login**

```http
POST /auth/login
Content-Type: application/json

{
  "email": "colaborador@exemplo.com",
  "senha": "sua_senha"
}
```

**Resposta:**
```json
{
  "message": "Login realizado com sucesso",
  "usuario": {
    "id": 3,
    "email": "colaborador@exemplo.com",
    "nome": "Colaborador",
    "tipo_usuario": "COLABORADOR_PREFEITURA",
    "statusAcess": "Ativado",
    "prefeitura": {
      "id": 1,
      "nome": "Prefeitura de São Paulo",
      "cnpj": "12.345.678/0001-90"
    }
  },
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6",
  "expiresIn": "15m"
}
```

##### **Passo 2: Usar o Access Token nas Requisições**

**✅ TODAS as requisições protegidas precisam do header Authorization:**

**⚠️ IMPORTANTE**: COLABORADOR_PREFEITURA tem **apenas permissão de LEITURA**.

**Exemplo: Listar Veículos (apenas visualização)**
```http
GET /veiculos
Authorization: Bearer {seu_accessToken}
```

**Exemplo: Ver Detalhes de um Veículo**
```http
GET /veiculos/1
Authorization: Bearer {seu_accessToken}
```

**❌ Tentar Criar Veículo (será bloqueado)**
```http
POST /veiculos
Authorization: Bearer {seu_accessToken}
Content-Type: application/json

{
  "nome": "Novo Veículo",
  ...
}
```

**Resposta (Erro 403):**
```json
{
  "statusCode": 403,
  "message": "Colaboradores não têm permissão para criar recursos",
  "error": "Forbidden"
}
```

##### **Passo 3: Quando o Token Expirar**

Mesmo processo:

```http
POST /auth/refresh
Content-Type: application/json

{
  "refreshToken": "seu_refresh_token_aqui"
}
```

##### **Passo 4: Fazer Logout**

```http
POST /auth/logout
Authorization: Bearer {seu_accessToken}
```

#### 🎯 Rotas Disponíveis para COLABORADOR_PREFEITURA

**✅ Pode acessar (apenas LEITURA, com header Authorization):**
- `GET /usuarios` - Listar usuários (apenas da própria prefeitura)
- `GET /usuarios/:id` - Ver detalhes de usuário (apenas da própria prefeitura)
- `GET /orgaos` - Listar órgãos (apenas da própria prefeitura)
- `GET /orgaos/:id` - Ver detalhes de órgão (apenas da própria prefeitura)
- `GET /veiculos` - Listar veículos (apenas da própria prefeitura)
- `GET /veiculos/:id` - Ver detalhes de veículo (apenas da própria prefeitura)
- `GET /motoristas` - Listar motoristas (apenas da própria prefeitura)
- `GET /motoristas/:id` - Ver detalhes de motorista (apenas da própria prefeitura)
- `GET /abastecimentos` - Listar abastecimentos (apenas da própria prefeitura)
- `GET /abastecimentos/:id` - Ver detalhes de abastecimento (apenas da própria prefeitura)

**❌ NÃO pode acessar (retorna erro 403):**
- `POST /usuarios` - Criar usuário
- `POST /orgaos` - Criar órgão
- `POST /veiculos` - Criar veículo
- `POST /motoristas` - Criar motorista
- `POST /abastecimentos` - Criar abastecimento
- `PATCH /usuarios/:id` - Atualizar usuário
- `DELETE /usuarios/:id` - Deletar usuário
- E todas as outras operações de escrita

---

### 4. ADMIN_EMPRESA

#### 📝 Passo a Passo Completo

##### **Passo 1: Fazer Login**

```http
POST /auth/login
Content-Type: application/json

{
  "email": "admin.empresa@exemplo.com",
  "senha": "sua_senha"
}
```

**Resposta:**
```json
{
  "message": "Login realizado com sucesso",
  "usuario": {
    "id": 4,
    "email": "admin.empresa@exemplo.com",
    "nome": "Admin Empresa",
    "tipo_usuario": "ADMIN_EMPRESA",
    "statusAcess": "Ativado",
    "empresa": {
      "id": 1,
      "nome": "Posto Exemplo",
      "cnpj": "98.765.432/0001-10"
    }
  },
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6",
  "expiresIn": "15m"
}
```

##### **Passo 2: Usar o Access Token nas Requisições**

**✅ TODAS as requisições protegidas precisam do header Authorization:**

**Exemplo: Criar Colaborador da Empresa**
```http
POST /usuarios
Authorization: Bearer {seu_accessToken}
Content-Type: application/json

{
  "email": "colaborador.empresa@exemplo.com",
  "senha": "senha123",
  "nome": "Colaborador Empresa",
  "cpf": "98765432100",
  "tipo_usuario": "COLABORADOR_EMPRESA"
}
```

**Exemplo: Listar Contratos (apenas da própria empresa)**
```http
GET /contratos
Authorization: Bearer {seu_accessToken}
```

**Exemplo: Listar Combustíveis**
```http
GET /combustiveis
Authorization: Bearer {seu_accessToken}
```

**⚠️ IMPORTANTE**: 
- O sistema **automaticamente filtra** os dados pela empresa do usuário.
- ADMIN_EMPRESA pode **apenas visualizar** combustíveis (GET), mas **não pode criar, atualizar ou excluir** (apenas SUPER_ADMIN pode fazer essas operações).

##### **Passo 3: Quando o Token Expirar**

Mesmo processo:

```http
POST /auth/refresh
Content-Type: application/json

{
  "refreshToken": "seu_refresh_token_aqui"
}
```

##### **Passo 4: Fazer Logout**

```http
POST /auth/logout
Authorization: Bearer {seu_accessToken}
```

#### 🎯 Rotas Disponíveis para ADMIN_EMPRESA

**✅ Pode acessar (com header Authorization):**
- `/usuarios` - CRUD (apenas COLABORADOR_EMPRESA da mesma empresa)
- `/contratos` - Visualizar contratos (apenas da própria empresa)
- `/processos` - Visualizar processos (apenas da própria empresa)
- `/combustiveis` - **Listar e visualizar combustíveis** (apenas GET - leitura)
  - `GET /combustiveis` - Listar todos os combustíveis
  - `GET /combustiveis/:id` - Ver detalhes de um combustível

**❌ NÃO pode acessar:**
- `/veiculos` - Retorna erro 403
- `/motoristas` - Retorna erro 403
- `/orgaos` - Retorna erro 403
- `/abastecimentos` - Retorna erro 403
- `POST /combustiveis` - Criar combustível (apenas SUPER_ADMIN)
- `PATCH /combustiveis/:id` - Atualizar combustível (apenas SUPER_ADMIN)
- `DELETE /combustiveis/:id` - Excluir combustível (apenas SUPER_ADMIN)
- `/prefeituras` - Retorna erro 403
- Dados de outras empresas - Filtrado automaticamente

---

### 5. COLABORADOR_EMPRESA

#### 📝 Passo a Passo Completo

##### **Passo 1: Fazer Login**

```http
POST /auth/login
Content-Type: application/json

{
  "email": "colaborador.empresa@exemplo.com",
  "senha": "sua_senha"
}
```

**Resposta:**
```json
{
  "message": "Login realizado com sucesso",
  "usuario": {
    "id": 5,
    "email": "colaborador.empresa@exemplo.com",
    "nome": "Colaborador Empresa",
    "tipo_usuario": "COLABORADOR_EMPRESA",
    "statusAcess": "Ativado",
    "empresa": {
      "id": 1,
      "nome": "Posto Exemplo",
      "cnpj": "98.765.432/0001-10"
    }
  },
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6",
  "expiresIn": "15m"
}
```

##### **Passo 2: Usar o Access Token nas Requisições**

**✅ TODAS as requisições protegidas precisam do header Authorization:**

**⚠️ IMPORTANTE**: COLABORADOR_EMPRESA tem **apenas permissão de LEITURA**.

**Exemplo: Listar Contratos (apenas visualização)**
```http
GET /contratos
Authorization: Bearer {seu_accessToken}
```

**Exemplo: Ver Detalhes de um Contrato**
```http
GET /contratos/1
Authorization: Bearer {seu_accessToken}
```

##### **Passo 3: Quando o Token Expirar**

Mesmo processo:

```http
POST /auth/refresh
Content-Type: application/json

{
  "refreshToken": "seu_refresh_token_aqui"
}
```

##### **Passo 4: Fazer Logout**

```http
POST /auth/logout
Authorization: Bearer {seu_accessToken}
```

#### 🎯 Rotas Disponíveis para COLABORADOR_EMPRESA

**✅ Pode acessar (apenas LEITURA, com header Authorization):**
- `GET /usuarios` - Listar usuários (apenas da própria empresa)
- `GET /usuarios/:id` - Ver detalhes de usuário (apenas da própria empresa)
- `GET /contratos` - Listar contratos (apenas da própria empresa)
- `GET /contratos/:id` - Ver detalhes de contrato (apenas da própria empresa)
- `GET /processos` - Listar processos (apenas da própria empresa)
- `GET /processos/:id` - Ver detalhes de processo (apenas da própria empresa)

**❌ NÃO pode acessar (retorna erro 403):**
- Todas as operações de escrita (POST, PATCH, DELETE)
- Dados de outras empresas
- Dados de prefeituras

---

## 🔄 Fluxo Completo de Autenticação

### Diagrama do Fluxo

```
┌─────────────────────────────────────────────────────────────┐
│                   1. LOGIN (Rota Pública)                    │
│  POST /auth/login                                            │
│  Body: { email, senha }                                     │
│  ❌ NÃO precisa de Authorization header                      │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│                    Resposta com Tokens                       │
│  {                                                           │
│    accessToken: "eyJhbGci...",                              │
│    refreshToken: "a1b2c3d4...",                             │
│    expiresIn: "15m"                                         │
│  }                                                           │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│          2. ACESSAR ROTAS PROTEGIDAS                         │
│  GET /veiculos                                               │
│  POST /abastecimentos                                        │
│  ✅ PRECISA de Authorization: Bearer {accessToken}          │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│          3. TOKEN EXPIROU (após 15 minutos)                 │
│  Resposta: 401 Unauthorized                                 │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│          4. RENOVAR TOKEN (Rota Pública)                     │
│  POST /auth/refresh                                          │
│  Body: { refreshToken: "a1b2c3d4..." }                       │
│  ❌ NÃO precisa de Authorization header                      │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│                    Novos Tokens                              │
│  {                                                           │
│    accessToken: "novo_token...",                            │
│    refreshToken: "novo_refresh...",                          │
│    expiresIn: "15m"                                         │
│  }                                                           │
│  ⚠️ Refresh Token antigo foi revogado                        │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│          5. CONTINUAR USANDO NOVO TOKEN                      │
│  GET /veiculos                                               │
│  Authorization: Bearer {novo_accessToken}                  │
└─────────────────────────────────────────────────────────────┘
```

---

## 🔄 Renovação de Tokens

### Quando Renovar o Token?

O Access Token expira após **15 minutos**. Você saberá que precisa renovar quando:

1. **Receber erro 401 Unauthorized** em qualquer requisição protegida
2. **O token está prestes a expirar** (você pode verificar a data de expiração decodificando o JWT)

### Como Renovar?

**Passo 1**: Fazer requisição para `/auth/refresh`:

```http
POST /auth/refresh
Content-Type: application/json

{
  "refreshToken": "seu_refresh_token_atual"
}
```

**⚠️ IMPORTANTE**: 
- Esta rota **NÃO precisa** do header `Authorization`
- Use o Refresh Token que você salvou após o login
- O Refresh Token antigo será **automaticamente revogado**

**Passo 2**: Receber novos tokens:

```json
{
  "message": "Tokens renovados com sucesso",
  "accessToken": "novo_access_token_aqui",
  "refreshToken": "novo_refresh_token_aqui",
  "expiresIn": "15m"
}
```

**Passo 3**: Salvar o novo Refresh Token e usar o novo Access Token:

```http
GET /veiculos
Authorization: Bearer novo_access_token_aqui
```

### O que acontece com o Refresh Token antigo?

- O Refresh Token antigo é **marcado como revogado** no banco de dados
- Ele **não pode mais ser usado** para renovar tokens
- Você **deve usar o novo Refresh Token** retornado na resposta

### Refresh Token Expirado

Se o Refresh Token expirou (após 7 dias), você receberá:

```json
{
  "statusCode": 401,
  "message": "Refresh token expirado",
  "error": "Unauthorized"
}
```

**Solução**: Você precisa fazer **login novamente**:

```http
POST /auth/login
Content-Type: application/json

{
  "email": "seu_email@exemplo.com",
  "senha": "sua_senha"
}
```

---

## 💡 Exemplos Práticos

### Exemplo 1: Fluxo Completo - Criar um Veículo (ADMIN_PREFEITURA)

```bash
# 1. Fazer login
POST /auth/login
{
  "email": "admin@prefeitura.com",
  "senha": "senha123"
}

# Resposta:
{
  "accessToken": "eyJhbGci...",
  "refreshToken": "abc123..."
}

# 2. Criar veículo (usar accessToken)
POST /veiculos
Authorization: Bearer eyJhbGci...
{
  "nome": "Ambulância 01",
  "placa": "ABC1234",
  ...
}

# 3. Após 15 minutos, token expira
# Tentar criar outro veículo:
POST /veiculos
Authorization: Bearer eyJhbGci... (token expirado)

# Resposta: 401 Unauthorized

# 4. Renovar token
POST /auth/refresh
{
  "refreshToken": "abc123..."
}

# Resposta:
{
  "accessToken": "novo_token...",
  "refreshToken": "novo_refresh..."
}

# 5. Usar novo token
POST /veiculos
Authorization: Bearer novo_token...
{
  "nome": "Ambulância 02",
  ...
}
```

### Exemplo 2: Usando cURL

```bash
# Login
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@exemplo.com",
    "senha": "senha123"
  }'

# Salvar tokens (copiar da resposta)
ACCESS_TOKEN="eyJhbGci..."
REFRESH_TOKEN="abc123..."

# Fazer requisição protegida
curl -X GET http://localhost:3000/veiculos \
  -H "Authorization: Bearer $ACCESS_TOKEN"

# Renovar token quando expirar
curl -X POST http://localhost:3000/auth/refresh \
  -H "Content-Type: application/json" \
  -d "{
    \"refreshToken\": \"$REFRESH_TOKEN\"
  }"
```

### Exemplo 3: Usando JavaScript (Fetch API)

```javascript
// 1. Login
const loginResponse = await fetch('http://localhost:3000/auth/login', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    email: 'admin@exemplo.com',
    senha: 'senha123',
  }),
});

const loginData = await loginResponse.json();
const { accessToken, refreshToken } = loginData;

// Salvar tokens (localStorage, sessionStorage, etc.)
localStorage.setItem('accessToken', accessToken);
localStorage.setItem('refreshToken', refreshToken);

// 2. Fazer requisição protegida
const veiculosResponse = await fetch('http://localhost:3000/veiculos', {
  headers: {
    'Authorization': `Bearer ${accessToken}`,
  },
});

// 3. Se token expirou (401), renovar
if (veiculosResponse.status === 401) {
  const refreshResponse = await fetch('http://localhost:3000/auth/refresh', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      refreshToken: localStorage.getItem('refreshToken'),
    }),
  });

  const refreshData = await refreshResponse.json();
  const { accessToken: newAccessToken, refreshToken: newRefreshToken } = refreshData;

  // Atualizar tokens salvos
  localStorage.setItem('accessToken', newAccessToken);
  localStorage.setItem('refreshToken', newRefreshToken);

  // Tentar novamente com novo token
  const veiculosResponse2 = await fetch('http://localhost:3000/veiculos', {
    headers: {
      'Authorization': `Bearer ${newAccessToken}`,
    },
  });
}
```

---

## 🔧 Solução de Problemas

### Erro: "401 Unauthorized"

**Causas possíveis:**
1. Access Token expirado (após 15 minutos)
2. Access Token inválido ou malformado
3. Header Authorization ausente ou incorreto

**Soluções:**
1. Verificar se o header está correto: `Authorization: Bearer {token}`
2. Se o token expirou, renovar usando `/auth/refresh`
3. Se o refresh token também expirou, fazer login novamente

### Erro: "Refresh token inválido"

**Causas possíveis:**
1. Refresh Token não existe no banco de dados
2. Refresh Token foi revogado (logout realizado)
3. Refresh Token malformado

**Solução:**
- Fazer login novamente para obter novos tokens

### Erro: "Refresh token expirado"

**Causa:**
- Refresh Token passou de 7 dias

**Solução:**
- Fazer login novamente

### Erro: "Refresh token revogado"

**Causas possíveis:**
1. Você fez logout
2. O token foi revogado por segurança
3. Você já usou esse refresh token para renovar (ele foi revogado automaticamente)

**Solução:**
- Fazer login novamente

### Erro: "Usuário inativo"

**Causa:**
- Sua conta foi desativada no sistema

**Solução:**
- Contatar o administrador para reativar sua conta

### Erro: "403 Forbidden"

**Causa:**
- Você não tem permissão para acessar esse recurso com seu perfil de usuário

**Solução:**
- Verificar a tabela de permissões por perfil
- Usar uma conta com o perfil adequado

### Header Authorization não está sendo enviado

**Verificar:**
1. O header está no formato correto: `Authorization: Bearer {token}`
2. Não há espaços extras
3. O token está completo (não foi cortado)
4. A requisição está sendo feita para uma rota protegida (todas exceto `/auth/login`, `/auth/register`, `/auth/refresh`)

---

## 📝 Resumo Rápido

### Rotas Públicas (NÃO precisam de token)
- `POST /auth/register` - Registrar usuário
- `POST /auth/login` - Fazer login
- `POST /auth/refresh` - Renovar tokens

### Rotas Protegidas (PRECISAM de token)
- **TODAS as outras rotas** precisam do header: `Authorization: Bearer {accessToken}`

### Quando o Token Expira
1. Receber erro 401
2. Fazer `POST /auth/refresh` com o `refreshToken`
3. Receber novos tokens
4. Usar o novo `accessToken`

### Logout
- `POST /auth/logout` com header `Authorization: Bearer {accessToken}`
- Revoga todos os refresh tokens
- Necessário fazer login novamente

---

## ⚠️ Boas Práticas

1. **Sempre salve o Refresh Token** após o login
2. **Renove o token antes de expirar** quando possível (verifique a data de expiração no JWT)
3. **Use HTTPS** em produção para proteger os tokens
4. **Não compartilhe tokens** entre diferentes aplicações ou usuários
5. **Faça logout** quando terminar de usar a aplicação
6. **Trate erros 401** automaticamente renovando o token
7. **Não armazene tokens** em locais inseguros (cookies não-httpOnly, localStorage em aplicações vulneráveis a XSS)

---

**Última atualização**: 07/11/2025


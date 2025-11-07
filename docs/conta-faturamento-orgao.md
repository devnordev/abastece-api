# 📚 Guia Completo - Teste de CRUDs e Vínculos

Este guia apresenta o passo a passo completo para testar todos os CRUDs relacionados a Prefeitura, Órgão, Veículo, Motorista e Conta de Faturamento de Órgão, incluindo os vínculos entre as entidades.

---

## 📋 Índice

1. [Pré-requisitos](#pré-requisitos)
2. [Autenticação e Obtenção de Token](#autenticação-e-obtenção-de-token)
3. [CRUD de Prefeitura](#1-crud-de-prefeitura)
4. [CRUD de Órgão](#2-crud-de-órgão)
5. [CRUD de Motorista](#3-crud-de-motorista)
6. [CRUD de Veículo](#4-crud-de-veículo)
7. [Vínculos entre Entidades](#5-vínculos-entre-entidades)
8. [CRUD de Conta de Faturamento - Órgão](#6-crud-de-conta-de-faturamento---órgão)
9. [Troubleshooting](#troubleshooting)

---

## 🔧 Pré-requisitos

### 1. **API em Execução**
```bash
# Certifique-se de que a API está rodando
npm run start:dev
```

### 2. **Banco de Dados Configurado**
```bash
# Execute as migrations se necessário
npx prisma migrate dev

# Execute o seed para criar dados iniciais (opcional)
npm run prisma:seed
```

### 3. **Ferramentas Recomendadas**
- **Postman** ou **Insomnia** para testar as requisições
- **Swagger** disponível em: `http://localhost:3000/api/docs`

---

## 🔐 Autenticação e Obtenção de Token

### Perfis de Usuário Disponíveis

Para testar os CRUDs, você precisará de um usuário com perfil **ADMIN_PREFEITURA**. Segue as credenciais:

#### 👑 **ADMIN_PREFEITURA** (Recomendado para este guia)
- **Email**: `admin@prefeitura.sp.gov.br`
- **Senha**: `123456`
- **Tipo**: `ADMIN_PREFEITURA`
- **Permissões**: 
  - ✅ Criar/Editar/Excluir Prefeituras (da própria prefeitura)
  - ✅ Criar/Editar/Excluir Órgãos
  - ✅ Criar/Editar/Excluir Veículos
  - ✅ Criar/Editar/Excluir Motoristas
  - ✅ Criar/Editar/Excluir Contas de Faturamento
  - ❌ Não pode acessar dados de outras prefeituras

#### 🔄 **Alternativa: SUPER_ADMIN**
- **Email**: `superadmin@nordev.com`
- **Senha**: `123456`
- **Tipo**: `SUPER_ADMIN`
- **Permissões**: Acesso total ao sistema

### Passo 1: Fazer Login

**Endpoint**: `POST /auth/login`

**Requisição**:
```bash
POST http://localhost:3000/auth/login
Content-Type: application/json

{
  "email": "admin@prefeitura.sp.gov.br",
  "senha": "123456"
}
```

**Resposta de Sucesso** (200 OK):
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 2,
    "email": "admin@prefeitura.sp.gov.br",
    "nome": "Admin Prefeitura",
    "tipo_usuario": "ADMIN_PREFEITURA",
    "prefeituraId": 1
  }
}
```

### Passo 2: Armazenar o Token

Copie o valor de `access_token` da resposta. Você precisará usar este token em todas as requisições subsequentes.

**Header obrigatório para todas as requisições**:
```
Authorization: Bearer <seu-access-token>
```

**Exemplo**:
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

---

## 1. CRUD de Prefeitura

### 1.1 Criar Prefeitura

**Perfil Necessário**: `SUPER_ADMIN` ou `ADMIN_PREFEITURA` (apenas sua própria)

**Endpoint**: `POST /prefeituras`

**Requisição**:
```bash
POST http://localhost:3000/prefeituras
Authorization: Bearer <seu-token>
Content-Type: application/json

{
  "nome": "Prefeitura Municipal de São Paulo",
  "cnpj": "12345678000195",
  "email_administrativo": "admin@prefeitura.sp.gov.br",
  "ativo": true,
  "requer_cupom_fiscal": true
}
```

**Resposta de Sucesso** (201 Created):
```json
{
  "message": "Prefeitura criada com sucesso",
  "prefeitura": {
    "id": 1,
    "nome": "Prefeitura Municipal de São Paulo",
    "cnpj": "12345678000195",
    "email_administrativo": "admin@prefeitura.sp.gov.br",
    "ativo": true,
    "requer_cupom_fiscal": true
  }
}
```

**⚠️ Importante**: Guarde o `id` da prefeitura criada. Você precisará dele para os próximos passos.

### 1.2 Listar Prefeituras

**Endpoint**: `GET /prefeituras`

**Requisição**:
```bash
GET http://localhost:3000/prefeituras
Authorization: Bearer <seu-token>
```

**Resposta de Sucesso** (200 OK):
```json
{
  "message": "Prefeituras encontradas com sucesso",
  "prefeituras": [
    {
      "id": 1,
      "nome": "Prefeitura Municipal de São Paulo",
      "cnpj": "12345678000195",
      "ativo": true
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

### 1.3 Buscar Prefeitura por ID

**Endpoint**: `GET /prefeituras/:id`

**Requisição**:
```bash
GET http://localhost:3000/prefeituras/1
Authorization: Bearer <seu-token>
```

### 1.4 Atualizar Prefeitura

**Endpoint**: `PATCH /prefeituras/:id`

**Requisição**:
```bash
PATCH http://localhost:3000/prefeituras/1
Authorization: Bearer <seu-token>
Content-Type: application/json

{
  "nome": "Prefeitura Municipal de São Paulo - Atualizada"
}
```

### 1.5 Excluir Prefeitura

**Endpoint**: `DELETE /prefeituras/:id`

**Requisição**:
```bash
DELETE http://localhost:3000/prefeituras/1
Authorization: Bearer <seu-token>
```

---

## 2. CRUD de Órgão

### 2.1 Criar Órgão

**Perfil Necessário**: `ADMIN_PREFEITURA` (apenas para sua prefeitura)

**Endpoint**: `POST /orgaos`

**Requisição**:
```bash
POST http://localhost:3000/orgaos
Authorization: Bearer <seu-token>
Content-Type: application/json

{
  "prefeituraId": 1,
  "nome": "Secretaria Municipal de Saúde",
  "sigla": "SMS",
  "ativo": true
}
```

**Resposta de Sucesso** (201 Created):
```json
{
  "message": "Órgão criado com sucesso",
  "orgao": {
    "id": 1,
    "prefeituraId": 1,
    "nome": "Secretaria Municipal de Saúde",
    "sigla": "SMS",
    "ativo": true,
    "prefeitura": {
      "id": 1,
      "nome": "Prefeitura Municipal de São Paulo"
    }
  }
}
```

**⚠️ Importante**: Guarde o `id` do órgão criado. Você precisará dele para os próximos passos.

### 2.2 Listar Órgãos

**Endpoint**: `GET /orgaos`

**Requisição com filtro por prefeitura**:
```bash
GET http://localhost:3000/orgaos?prefeituraId=1
Authorization: Bearer <seu-token>
```

**Resposta de Sucesso** (200 OK):
```json
{
  "message": "Órgãos encontrados com sucesso",
  "orgaos": [
    {
      "id": 1,
      "nome": "Secretaria Municipal de Saúde",
      "sigla": "SMS",
      "ativo": true
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

### 2.3 Buscar Órgão por ID

**Endpoint**: `GET /orgaos/:id`

**Requisição**:
```bash
GET http://localhost:3000/orgaos/1
Authorization: Bearer <seu-token>
```

### 2.4 Atualizar Órgão

**Endpoint**: `PATCH /orgaos/:id`

**Requisição**:
```bash
PATCH http://localhost:3000/orgaos/1
Authorization: Bearer <seu-token>
Content-Type: application/json

{
  "nome": "Secretaria Municipal de Saúde - Atualizada",
  "sigla": "SMS"
}
```

### 2.5 Excluir Órgão

**Endpoint**: `DELETE /orgaos/:id`

**Requisição**:
```bash
DELETE http://localhost:3000/orgaos/1
Authorization: Bearer <seu-token>
```

---

## 3. CRUD de Motorista

### 3.1 Criar Motorista

**Perfil Necessário**: `ADMIN_PREFEITURA` (apenas para sua prefeitura)

**Endpoint**: `POST /motoristas`

**Requisição**:
```bash
POST http://localhost:3000/motoristas
Authorization: Bearer <seu-token>
Content-Type: application/json

{
  "prefeituraId": 1,
  "nome": "João Silva",
  "cpf": "55555555555",
  "cnh": "12345678901",
  "categoria_cnh": "B",
  "data_vencimento_cnh": "2025-12-31T00:00:00.000Z",
  "telefone": "11988888888",
  "email": "joao.silva@prefeitura.sp.gov.br",
  "ativo": true
}
```

**Resposta de Sucesso** (201 Created):
```json
{
  "message": "Motorista criado com sucesso",
  "motorista": {
    "id": 1,
    "prefeituraId": 1,
    "nome": "João Silva",
    "cpf": "55555555555",
    "cnh": "12345678901",
    "categoria_cnh": "B",
    "ativo": true
  }
}
```

**⚠️ Importante**: Guarde o `id` do motorista criado. Você precisará dele para vincular ao veículo.

### 3.2 Listar Motoristas

**Endpoint**: `GET /motoristas`

**Requisição com filtro por prefeitura**:
```bash
GET http://localhost:3000/motoristas?prefeituraId=1
Authorization: Bearer <seu-token>
```

### 3.3 Buscar Motorista por ID

**Endpoint**: `GET /motoristas/:id`

**Requisição**:
```bash
GET http://localhost:3000/motoristas/1
Authorization: Bearer <seu-token>
```

### 3.4 Atualizar Motorista

**Endpoint**: `PATCH /motoristas/:id`

**Requisição**:
```bash
PATCH http://localhost:3000/motoristas/1
Authorization: Bearer <seu-token>
Content-Type: application/json

{
  "nome": "João Silva Santos",
  "telefone": "11977777777"
}
```

### 3.5 Excluir Motorista

**Endpoint**: `DELETE /motoristas/:id`

**Requisição**:
```bash
DELETE http://localhost:3000/motoristas/1
Authorization: Bearer <seu-token>
```

---

## 4. CRUD de Veículo

### 4.1 Criar Veículo

**Perfil Necessário**: `ADMIN_PREFEITURA` (apenas para sua prefeitura)

**⚠️ Pré-requisitos**: 
- Prefeitura criada (prefeituraId)
- Órgão criado (orgaoId)
- Pelo menos 1 combustível cadastrado (combustivelIds)

**Endpoint**: `POST /veiculos`

**Requisição**:
```bash
POST http://localhost:3000/veiculos
Authorization: Bearer <seu-token>
Content-Type: application/json

{
  "prefeituraId": 1,
  "orgaoId": 1,
  "nome": "Ambulância 01",
  "placa": "ABC-1234",
  "modelo": "Ford Transit",
  "ano": 2020,
  "capacidade_tanque": 80.0,
  "tipo_abastecimento": "COTA",
  "periodicidade": "Semanal",
  "quantidade": 100.0,
  "combustivelIds": [1]
}
```

**Resposta de Sucesso** (201 Created):
```json
{
  "message": "Veículo criado com sucesso",
  "veiculo": {
    "id": 1,
    "prefeituraId": 1,
    "orgaoId": 1,
    "nome": "Ambulância 01",
    "placa": "ABC-1234",
    "modelo": "Ford Transit",
    "ano": 2020,
    "capacidade_tanque": 80.0,
    "tipo_abastecimento": "COTA",
    "ativo": true
  }
}
```

**⚠️ Importante**: Guarde o `id` do veículo criado. Você precisará dele para os vínculos.

### 4.2 Listar Veículos

**Endpoint**: `GET /veiculos`

**Requisição com filtro por prefeitura**:
```bash
GET http://localhost:3000/veiculos?prefeituraId=1
Authorization: Bearer <seu-token>
```

### 4.3 Buscar Veículo por ID

**Endpoint**: `GET /veiculos/:id`

**Requisição**:
```bash
GET http://localhost:3000/veiculos/1
Authorization: Bearer <seu-token>
```

### 4.4 Atualizar Veículo

**Endpoint**: `PATCH /veiculos/:id`

**Requisição**:
```bash
PATCH http://localhost:3000/veiculos/1
Authorization: Bearer <seu-token>
Content-Type: application/json

{
  "nome": "Ambulância 01 - Atualizada",
  "observacoes": "Veículo em manutenção"
}
```

### 4.5 Excluir Veículo

**Endpoint**: `DELETE /veiculos/:id`

**Requisição**:
```bash
DELETE http://localhost:3000/veiculos/1
Authorization: Bearer <seu-token>
```

---

## 5. Vínculos entre Entidades

### 5.1 Vincular Motorista a Veículo

**Perfil Necessário**: `ADMIN_PREFEITURA`

Você pode vincular um motorista a um veículo de duas formas:

#### Opção 1: Durante a criação do veículo

**Endpoint**: `POST /veiculos`

**Requisição**:
```bash
POST http://localhost:3000/veiculos
Authorization: Bearer <seu-token>
Content-Type: application/json

{
  "prefeituraId": 1,
  "orgaoId": 1,
  "nome": "Veículo com Motorista",
  "placa": "XYZ-9999",
  "ano": 2021,
  "capacidade_tanque": 60.0,
  "tipo_abastecimento": "COTA",
  "periodicidade": "Semanal",
  "quantidade": 80.0,
  "combustivelIds": [1],
  "motoristaIds": [1]
}
```

#### Opção 2: Atualizando um veículo existente

**Endpoint**: `PATCH /veiculos/:id`

**Requisição**:
```bash
PATCH http://localhost:3000/veiculos/1
Authorization: Bearer <seu-token>
Content-Type: application/json

{
  "motoristaIds": [1]
}
```

**✅ Verificar Vínculo**: Buscar o veículo por ID para verificar os motoristas vinculados:
```bash
GET http://localhost:3000/veiculos/1
Authorization: Bearer <seu-token>
```

### 5.2 Vincular Veículo a Órgão

**Perfil Necessário**: `ADMIN_PREFEITURA`

#### Opção 1: Durante a criação do veículo

**Endpoint**: `POST /veiculos`

**Requisição**:
```bash
POST http://localhost:3000/veiculos
Authorization: Bearer <seu-token>
Content-Type: application/json

{
  "prefeituraId": 1,
  "orgaoId": 1,
  "nome": "Veículo do Órgão",
  "placa": "DEF-5678",
  "ano": 2022,
  "capacidade_tanque": 70.0,
  "tipo_abastecimento": "COTA",
  "periodicidade": "Semanal",
  "quantidade": 90.0,
  "combustivelIds": [1]
}
```

#### Opção 2: Atualizando um veículo existente

**Endpoint**: `PATCH /veiculos/:id`

**Requisição**:
```bash
PATCH http://localhost:3000/veiculos/1
Authorization: Bearer <seu-token>
Content-Type: application/json

{
  "orgaoId": 1
}
```

**✅ Verificar Vínculo**: Buscar o órgão e listar seus veículos:
```bash
GET http://localhost:3000/orgaos/1/veiculos
Authorization: Bearer <seu-token>
```

### 5.3 Ver Veículos de um Motorista

**Endpoint**: `GET /motoristas/:id`

**Requisição**:
```bash
GET http://localhost:3000/motoristas/1
Authorization: Bearer <seu-token>
```

**Resposta**:
```json
{
  "message": "Motorista encontrado com sucesso",
  "motorista": {
    "id": 1,
    "nome": "João Silva",
    "veiculos": [
      {
        "id": 1,
        "nome": "Ambulância 01",
        "placa": "ABC-1234"
      }
    ]
  }
}
```

### 5.4 Ver Veículos de um Órgão

**Endpoint**: `GET /orgaos/:id/veiculos`

**Requisição**:
```bash
GET http://localhost:3000/orgaos/1/veiculos?page=1&limit=10
Authorization: Bearer <seu-token>
```

**Resposta**:
```json
{
  "message": "Veículos encontrados com sucesso",
  "orgao": {
    "id": 1,
    "nome": "Secretaria Municipal de Saúde",
    "sigla": "SMS"
  },
  "veiculos": [
    {
      "id": 1,
      "nome": "Ambulância 01",
      "placa": "ABC-1234"
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

---

## 6. CRUD de Conta de Faturamento - Órgão

### ⚠️ IMPORTANTE: Acesso Restrito

**Perfil Necessário**: `ADMIN_PREFEITURA` (exclusivo)

Apenas usuários com perfil `ADMIN_PREFEITURA` podem criar, editar, visualizar e excluir contas de faturamento. Outros perfis receberão erro 403 (Forbidden).

### 6.1 Criar Conta de Faturamento

**Perfil Necessário**: `ADMIN_PREFEITURA`

**⚠️ Pré-requisitos**: 
- Prefeitura criada (prefeituraId)
- Órgão criado (orgaoId) - deve pertencer à prefeitura informada

**Endpoint**: `POST /contas-faturamento-orgao`

**Requisição**:
```bash
POST http://localhost:3000/contas-faturamento-orgao
Authorization: Bearer <seu-token>
Content-Type: application/json

{
  "prefeituraId": 1,
  "orgaoId": 1,
  "nome": "Conta Faturamento Saúde",
  "descricao": "Conta para controle de gastos com combustível da Secretaria de Saúde"
}
```

**Resposta de Sucesso** (201 Created):
```json
{
  "message": "Conta de faturamento criada com sucesso",
  "conta": {
    "id": 1,
    "prefeituraId": 1,
    "orgaoId": 1,
    "nome": "Conta Faturamento Saúde",
    "descricao": "Conta para controle de gastos com combustível da Secretaria de Saúde",
    "prefeitura": {
      "id": 1,
      "nome": "Prefeitura Municipal de São Paulo"
    },
    "orgao": {
      "id": 1,
      "nome": "Secretaria Municipal de Saúde",
      "sigla": "SMS"
    }
  }
}
```

**⚠️ Importante**: Guarde o `id` da conta de faturamento criada.

**❌ Erros Possíveis**:
- `403 Forbidden`: Usuário não tem permissão (não é ADMIN_PREFEITURA)
- `404 Not Found`: Prefeitura ou órgão não encontrado
- `409 Conflict`: Já existe uma conta com o mesmo nome para este órgão
- `409 Conflict`: Órgão não pertence à prefeitura informada

### 6.2 Listar Contas de Faturamento

**Endpoint**: `GET /contas-faturamento-orgao`

**Requisição com filtros**:
```bash
GET http://localhost:3000/contas-faturamento-orgao?page=1&limit=10&prefeituraId=1
Authorization: Bearer <seu-token>
```

**Parâmetros de Query**:
- `page` (opcional): Número da página (padrão: 1)
- `limit` (opcional): Itens por página (padrão: 10)
- `prefeituraId` (opcional): Filtrar por prefeitura
- `orgaoId` (opcional): Filtrar por órgão

**Resposta de Sucesso** (200 OK):
```json
{
  "message": "Contas de faturamento encontradas com sucesso",
  "contas": [
    {
      "id": 1,
      "prefeituraId": 1,
      "orgaoId": 1,
      "nome": "Conta Faturamento Saúde",
      "descricao": "Conta para controle de gastos com combustível da Secretaria de Saúde",
      "prefeitura": {
        "id": 1,
        "nome": "Prefeitura Municipal de São Paulo"
      },
      "orgao": {
        "id": 1,
        "nome": "Secretaria Municipal de Saúde",
        "sigla": "SMS"
      },
      "_count": {
        "veiculos": 0,
        "abastecimentos": 0
      }
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

### 6.3 Listar Contas de Faturamento por Órgão

**Endpoint**: `GET /contas-faturamento-orgao?orgaoId=:orgaoId`

**Requisição**:
```bash
GET http://localhost:3000/contas-faturamento-orgao?orgaoId=1
Authorization: Bearer <seu-token>
```

### 6.4 Buscar Conta de Faturamento por ID

**Endpoint**: `GET /contas-faturamento-orgao/:id`

**Requisição**:
```bash
GET http://localhost:3000/contas-faturamento-orgao/1
Authorization: Bearer <seu-token>
```

**Resposta de Sucesso** (200 OK):
```json
{
  "message": "Conta de faturamento encontrada com sucesso",
  "conta": {
    "id": 1,
    "prefeituraId": 1,
    "orgaoId": 1,
    "nome": "Conta Faturamento Saúde",
    "descricao": "Conta para controle de gastos com combustível da Secretaria de Saúde",
    "prefeitura": {
      "id": 1,
      "nome": "Prefeitura Municipal de São Paulo"
    },
    "orgao": {
      "id": 1,
      "nome": "Secretaria Municipal de Saúde",
      "sigla": "SMS"
    },
    "_count": {
      "veiculos": 0,
      "abastecimentos": 0
    }
  }
}
```

### 6.5 Atualizar Conta de Faturamento

**Endpoint**: `PATCH /contas-faturamento-orgao/:id`

**⚠️ Importante**: Não é possível alterar `prefeituraId` e `orgaoId` após a criação.

**Requisição**:
```bash
PATCH http://localhost:3000/contas-faturamento-orgao/1
Authorization: Bearer <seu-token>
Content-Type: application/json

{
  "nome": "Conta Faturamento Saúde - Atualizada",
  "descricao": "Descrição atualizada da conta de faturamento"
}
```

**Resposta de Sucesso** (200 OK):
```json
{
  "message": "Conta de faturamento atualizada com sucesso",
  "conta": {
    "id": 1,
    "nome": "Conta Faturamento Saúde - Atualizada",
    "descricao": "Descrição atualizada da conta de faturamento"
  }
}
```

**❌ Erros Possíveis**:
- `409 Conflict`: Já existe uma conta com o mesmo nome para este órgão

### 6.6 Excluir Conta de Faturamento

**Endpoint**: `DELETE /contas-faturamento-orgao/:id`

**⚠️ Importante**: Não é possível excluir uma conta de faturamento se houver veículos ou abastecimentos vinculados a ela.

**Requisição**:
```bash
DELETE http://localhost:3000/contas-faturamento-orgao/1
Authorization: Bearer <seu-token>
```

**Resposta de Sucesso** (200 OK):
```json
{
  "message": "Conta de faturamento excluída com sucesso"
}
```

**❌ Erros Possíveis**:
- `409 Conflict`: Não é possível excluir a conta pois há veículos ou abastecimentos vinculados

---

## 🔄 Fluxo Completo de Teste

Seguindo a ordem correta de criação:

### Passo 1: Autenticação
1. Fazer login com `admin@prefeitura.sp.gov.br` / `123456`
2. Copiar o `access_token`

### Passo 2: Criar Prefeitura
1. `POST /prefeituras` → Obter `prefeituraId` (ex: 1)

### Passo 3: Criar Órgão
1. `POST /orgaos` com `prefeituraId: 1` → Obter `orgaoId` (ex: 1)

### Passo 4: Criar Motorista
1. `POST /motoristas` com `prefeituraId: 1` → Obter `motoristaId` (ex: 1)

### Passo 5: Criar Veículo
1. `POST /veiculos` com:
   - `prefeituraId: 1`
   - `orgaoId: 1`
   - `motoristaIds: [1]` (opcional, para vincular)
   - → Obter `veiculoId` (ex: 1)

### Passo 6: Criar Conta de Faturamento
1. `POST /contas-faturamento-orgao` com:
   - `prefeituraId: 1`
   - `orgaoId: 1`
   - → Obter `contaFaturamentoOrgaoId` (ex: 1)

### Passo 7: Verificar Vínculos
1. `GET /orgaos/1/veiculos` - Ver veículos do órgão
2. `GET /motoristas/1` - Ver veículos do motorista
3. `GET /contas-faturamento-orgao/1` - Ver detalhes da conta

---

## 🔍 Troubleshooting

### Problema: Erro 401 Unauthorized

**Causa**: Token inválido ou expirado

**Solução**:
1. Faça login novamente
2. Copie o novo `access_token`
3. Use o novo token nas requisições

### Problema: Erro 403 Forbidden

**Causa**: Usuário não tem permissão para acessar o recurso

**Solução**:
- Para contas de faturamento: Use um usuário com perfil `ADMIN_PREFEITURA`
- Verifique se o usuário pertence à prefeitura correta

### Problema: Erro 404 Not Found

**Causa**: Recurso não encontrado (ID inválido)

**Solução**:
1. Liste os recursos primeiro para obter os IDs corretos
2. Verifique se o ID existe no banco de dados

### Problema: Erro 409 Conflict

**Causas Comuns**:
- **Prefeitura/Órgão**: Nome ou sigla duplicado
- **Conta de Faturamento**: Nome duplicado para o mesmo órgão
- **Exclusão**: Há vínculos impedindo a exclusão

**Solução**:
- Use nomes únicos
- Remova os vínculos antes de excluir

### Problema: Erro 400 Bad Request

**Causa**: Dados inválidos na requisição

**Solução**:
- Verifique se todos os campos obrigatórios estão preenchidos
- Verifique os tipos de dados (números, strings, datas)
- Consulte a documentação Swagger em `http://localhost:3000/api/docs`

---

## 📝 Resumo das Credenciais

| Perfil | Email | Senha | Permissões |
|--------|-------|-------|------------|
| **ADMIN_PREFEITURA** | `admin@prefeitura.sp.gov.br` | `123456` | ✅ CRUD completo de Prefeitura, Órgão, Veículo, Motorista, Conta de Faturamento |
| **SUPER_ADMIN** | `superadmin@nordev.com` | `123456` | ✅ Acesso total ao sistema |
| **COLABORADOR_PREFEITURA** | `colaborador@prefeitura.sp.gov.br` | `123456` | 👁️ Apenas visualização |

---

## 📚 Recursos Adicionais

- **Swagger UI**: `http://localhost:3000/api/docs`
- **Collection Postman**: `postman/collection_04_11_2025.json`
- **Documentação de Usuários**: `SEED_USERS.md`
- **Regras de Perfis**: `REGRAS_PERFIS.md`

---

## ✅ Checklist de Teste

- [ ] Login realizado com sucesso
- [ ] Token obtido e armazenado
- [ ] Prefeitura criada
- [ ] Órgão criado e vinculado à prefeitura
- [ ] Motorista criado
- [ ] Veículo criado e vinculado ao órgão
- [ ] Motorista vinculado ao veículo
- [ ] Conta de faturamento criada
- [ ] Vínculos verificados
- [ ] Atualizações testadas
- [ ] Exclusões testadas (quando aplicável)

---

**🎉 Parabéns!** Você completou todos os testes de CRUD e vínculos do sistema.


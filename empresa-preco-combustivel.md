# 📚 Guia Completo - Módulo Empresa Preço Combustível

Este guia apresenta o passo a passo completo para usar o módulo de **Preços de Combustível por Empresa**, incluindo todas as operações CRUD e a funcionalidade especial de atualização automática de preços com dados da ANP.

---

## 📋 Índice

1. [Pré-requisitos](#pré-requisitos)
2. [Visão Geral do Módulo](#visão-geral-do-módulo)
3. [Autenticação e Permissões](#autenticação-e-permissões)
4. [Estrutura de Dados](#estrutura-de-dados)
5. [Operações CRUD](#operações-crud)
   - [Criar Preço](#1-criar-preço)
   - [Listar Preços](#2-listar-preços)
   - [Buscar Preço por ID](#3-buscar-preço-por-id)
   - [Atualizar Preço](#4-atualizar-preço)
   - [Excluir Preço](#5-excluir-preço)
6. [Atualização Automática de Preço com Dados ANP](#atualização-automática-de-preço-com-dados-anp)
7. [Exemplos Práticos Completos](#exemplos-práticos-completos)
8. [Troubleshooting](#troubleshooting)

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
```

### 3. **Dados Necessários no Banco**
Para usar este módulo, você precisa ter:
- ✅ Uma **Empresa** cadastrada
- ✅ Um **Usuário** com perfil `ADMIN_EMPRESA` vinculado à empresa
- ✅ **Combustíveis** cadastrados no sistema
- ✅ **Semana ANP ativa** com preços importados (para a funcionalidade automática)
- ✅ **Preços ANP por UF** cadastrados (para a funcionalidade automática)

### 4. **Ferramentas Recomendadas**
- **Postman** ou **Insomnia** para testar as requisições
- **Swagger** disponível em: `http://localhost:3000/api/docs`

---

## 🎯 Visão Geral do Módulo

O módulo **Empresa Preço Combustível** permite que empresas gerenciem os preços dos combustíveis que comercializam. Este módulo:

- ✅ **Isola dados por empresa**: Cada empresa só vê e gerencia seus próprios preços
- ✅ **Integra com dados ANP**: Consulta automaticamente preços de referência da ANP
- ✅ **Calcula tetos vigentes**: Usa dados da ANP para calcular limites de preço
- ✅ **Rastreia atualizações**: Registra quem e quando atualizou cada preço
- ✅ **Controla status**: Permite ativar/desativar preços automaticamente ou manualmente

### 🔐 Acesso Restrito

**Apenas usuários com perfil `ADMIN_EMPRESA`** podem acessar este módulo. O sistema automaticamente:
- Filtra todos os dados pela empresa do usuário logado
- Impede acesso a preços de outras empresas
- Valida que o usuário está vinculado a uma empresa

---

## 🔐 Autenticação e Permissões

### Perfil Necessário

Para usar este módulo, você precisa estar autenticado com um usuário que tenha:

- **Perfil**: `ADMIN_EMPRESA`
- **Vinculado a uma Empresa**: O usuário deve ter `empresa_id` preenchido

### Passo 1: Fazer Login

```http
POST http://localhost:3000/auth/login
Content-Type: application/json

{
  "email": "admin@empresa.com",
  "senha": "sua_senha"
}
```

**Resposta:**
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6..."
}
```

### Passo 2: Usar o Access Token

Todas as requisições para este módulo devem incluir o header:

```http
Authorization: Bearer {accessToken}
```

**⚠️ IMPORTANTE:**
- O token expira em **15 minutos**
- Se o token expirar, use o `refreshToken` para obter um novo (veja [tokens.md](./tokens.md))

---

## 📊 Estrutura de Dados

### Modelo EmpresaPrecoCombustivel

```typescript
{
  id: number;                    // ID único do registro
  empresa_id: number;            // ID da empresa (automático do usuário logado)
  combustivel_id: number;        // ID do combustível
  preco_atual: number;           // Preço atual do combustível (Decimal 10,2)
  teto_vigente: number;          // Teto máximo permitido (Decimal 10,2)
  anp_base: "MINIMO" | "MEDIO" | "MAXIMO";  // Base ANP utilizada
  anp_base_valor: number;        // Valor da base ANP (Decimal 10,2)
  margem_app_pct: number;        // Margem percentual aplicada (Decimal 5,2)
  uf_referencia: string;         // UF de referência (2 caracteres, ex: "SP")
  status: "ACTIVE" | "INACTIVE_AUTO" | "INACTIVE_MANUAL";  // Status do preço
  updated_at: Date;              // Data/hora da última atualização
  updated_by: string;            // Usuário que atualizou (opcional)
}
```

### Enums

**AnpBase:**
- `MINIMO` - Preço mínimo da ANP
- `MEDIO` - Preço médio da ANP
- `MAXIMO` - Preço máximo da ANP

**StatusPreco:**
- `ACTIVE` - Preço ativo
- `INACTIVE_AUTO` - Preço desativado automaticamente pelo sistema
- `INACTIVE_MANUAL` - Preço desativado manualmente

---

## 🔄 Operações CRUD

### 1. Criar Preço

Cria um novo registro de preço de combustível para a empresa do usuário logado.

**Endpoint:**
```http
POST /empresa-preco-combustivel
```

**Headers:**
```http
Authorization: Bearer {accessToken}
Content-Type: application/json
```

**Body:**
```json
{
  "combustivel_id": 4,
  "preco_atual": 6.38,
  "teto_vigente": 5.84,
  "anp_base": "MEDIO",
  "anp_base_valor": 5.84,
  "margem_app_pct": 0.00,
  "uf_referencia": "AL",
  "status": "ACTIVE",
  "updated_by": "admin@postoshell.com"
}
```

**Campos Obrigatórios:**
- `combustivel_id` (number): ID do combustível
- `preco_atual` (number): Preço atual (mínimo 0, máximo 2 casas decimais)
- `teto_vigente` (number): Teto vigente (mínimo 0, máximo 2 casas decimais)
- `anp_base` (enum): `MINIMO`, `MEDIO` ou `MAXIMO`
- `anp_base_valor` (number): Valor da base ANP (mínimo 0, máximo 2 casas decimais)
- `margem_app_pct` (number): Margem percentual (0 a 100, máximo 2 casas decimais)
- `uf_referencia` (string): UF de referência (exatamente 2 caracteres)

**Campos Opcionais:**
- `status` (enum): `ACTIVE`, `INACTIVE_AUTO` ou `INACTIVE_MANUAL` (padrão: `ACTIVE`)
- `updated_by` (string): Nome ou email do usuário que atualizou

**⚠️ Validações:**
- Não pode existir outro preço **ATIVO** para a mesma empresa e combustível
- A empresa e o combustível devem existir no banco
- O `empresa_id` é automaticamente obtido do usuário logado
- **O `preco_atual` NÃO pode ser superior ao `teto_vigente`**
- O `teto_vigente` é **automaticamente consultado da ANP** com base na:
  - Semana ANP ativa (mais recente)
  - UF da empresa do usuário logado
  - Tipo de combustível (mapeado do `combustivel_id`)
- O valor de `teto_vigente` enviado no body será **ignorado** e substituído pelo valor da ANP

**Resposta de Sucesso (201):**
```json
{
  "id": 1,
  "empresa_id": 5,
  "combustivel_id": 1,
  "preco_atual": "5.89",
  "teto_vigente": "6.50",
  "anp_base": "MEDIO",
  "anp_base_valor": "5.50",
  "margem_app_pct": "7.08",
  "uf_referencia": "SP",
  "status": "ACTIVE",
  "updated_at": "2024-01-15T10:30:00.000Z",
  "updated_by": "admin@empresa.com"
}
```

**Erros Possíveis:**
- `400 Bad Request`: Dados inválidos ou usuário não vinculado a empresa
- `403 Forbidden`: Usuário não tem permissão (não é ADMIN_EMPRESA)
- `404 Not Found`: Empresa ou combustível não encontrado
- `409 Conflict`: Já existe um preço ativo para esta empresa e combustível

---

### 2. Listar Preços

Lista todos os preços de combustível da empresa do usuário logado, com opções de filtro.

**Endpoint:**
```http
GET /empresa-preco-combustivel
```

**Headers:**
```http
Authorization: Bearer {accessToken}
```

**Query Parameters (Opcionais):**
```
?combustivel_id=1          # Filtrar por ID do combustível
?status=ACTIVE            # Filtrar por status
?uf_referencia=SP         # Filtrar por UF de referência
?anp_base=MEDIO           # Filtrar por base ANP
```

**Exemplo:**
```http
GET /empresa-preco-combustivel?status=ACTIVE&uf_referencia=SP
Authorization: Bearer {accessToken}
```

**Resposta de Sucesso (200):**
```json
[
  {
    "id": 1,
    "empresa_id": 5,
    "combustivel_id": 1,
    "preco_atual": "5.89",
    "teto_vigente": "6.50",
    "anp_base": "MEDIO",
    "anp_base_valor": "5.50",
    "margem_app_pct": "7.08",
    "uf_referencia": "SP",
    "status": "ACTIVE",
    "updated_at": "2024-01-15T10:30:00.000Z",
    "updated_by": "admin@empresa.com",
    "combustivel": {
      "id": 1,
      "nome": "Gasolina Comum",
      "sigla": "G"
    }
  },
  {
    "id": 2,
    "empresa_id": 5,
    "combustivel_id": 2,
    "preco_atual": "4.50",
    "teto_vigente": "5.00",
    "anp_base": "MINIMO",
    "anp_base_valor": "4.20",
    "margem_app_pct": "7.14",
    "uf_referencia": "SP",
    "status": "ACTIVE",
    "updated_at": "2024-01-15T11:00:00.000Z",
    "updated_by": "admin@empresa.com",
    "combustivel": {
      "id": 2,
      "nome": "Etanol Comum",
      "sigla": "E"
    }
  }
]
```

**⚠️ Importante:**
- Apenas preços da empresa do usuário logado são retornados
- Se não houver preços, retorna um array vazio `[]`

**Erros Possíveis:**
- `400 Bad Request`: Usuário não vinculado a empresa
- `403 Forbidden`: Usuário não tem permissão (não é ADMIN_EMPRESA)

---

### 3. Buscar Preço por ID

Busca um preço específico por ID, validando que ele pertence à empresa do usuário logado.

**Endpoint:**
```http
GET /empresa-preco-combustivel/:id
```

**Headers:**
```http
Authorization: Bearer {accessToken}
```

**Exemplo:**
```http
GET /empresa-preco-combustivel/1
Authorization: Bearer {accessToken}
```

**Resposta de Sucesso (200):**
```json
{
  "id": 1,
  "empresa_id": 5,
  "combustivel_id": 1,
  "preco_atual": "5.89",
  "teto_vigente": "6.50",
  "anp_base": "MEDIO",
  "anp_base_valor": "5.50",
  "margem_app_pct": "7.08",
  "uf_referencia": "SP",
  "status": "ACTIVE",
  "updated_at": "2024-01-15T10:30:00.000Z",
  "updated_by": "admin@empresa.com",
  "combustivel": {
    "id": 1,
    "nome": "Gasolina Comum",
    "sigla": "G"
  },
  "empresa": {
    "id": 5,
    "nome": "Posto Exemplo",
    "cnpj": "12.345.678/0001-90"
  }
}
```

**Erros Possíveis:**
- `400 Bad Request`: Usuário não vinculado a empresa
- `403 Forbidden`: Usuário não tem permissão (não é ADMIN_EMPRESA)
- `404 Not Found`: Preço não encontrado ou não pertence à empresa do usuário

---

### 4. Atualizar Preço

Atualiza um preço existente. Todos os campos são opcionais (apenas os enviados serão atualizados).

**Endpoint:**
```http
PATCH /empresa-preco-combustivel/:id
```

**Headers:**
```http
Authorization: Bearer {accessToken}
Content-Type: application/json
```

**Body (todos os campos são opcionais):**
```json
{
  "preco_atual": 5.99,
  "teto_vigente": 6.60,
  "anp_base": "MAXIMO",
  "anp_base_valor": 5.60,
  "margem_app_pct": 7.50,
  "uf_referencia": "RJ",
  "status": "INACTIVE_MANUAL",
  "updated_by": "admin@empresa.com"
}
```

**Exemplo:**
```http
PATCH /empresa-preco-combustivel/1
Authorization: Bearer {accessToken}
Content-Type: application/json

{
  "preco_atual": 5.99,
  "status": "INACTIVE_MANUAL"
}
```

**⚠️ Validações:**
- O preço deve existir e pertencer à empresa do usuário logado
- Se `combustivel_id` for alterado, não pode existir outro preço ativo para a nova combinação empresa+combustível
- Todos os campos numéricos seguem as mesmas regras de validação do CREATE
- **O `preco_atual` NÃO pode ser superior ao `teto_vigente`**
- O `teto_vigente` é **automaticamente atualizado da ANP** quando:
  - O `preco_atual` for alterado
  - O `combustivel_id` for alterado
  - O `teto_vigente` for explicitamente alterado (mas será substituído pelo valor da ANP)
- O valor de `teto_vigente` enviado no body será **ignorado** e substituído pelo valor da ANP

**Resposta de Sucesso (200):**
```json
{
  "id": 1,
  "empresa_id": 5,
  "combustivel_id": 1,
  "preco_atual": "5.99",
  "teto_vigente": "6.50",
  "anp_base": "MEDIO",
  "anp_base_valor": "5.50",
  "margem_app_pct": "7.08",
  "uf_referencia": "SP",
  "status": "INACTIVE_MANUAL",
  "updated_at": "2024-01-15T12:00:00.000Z",
  "updated_by": "admin@empresa.com"
}
```

**Erros Possíveis:**
- `400 Bad Request`: Dados inválidos ou usuário não vinculado a empresa
- `403 Forbidden`: Usuário não tem permissão (não é ADMIN_EMPRESA)
- `404 Not Found`: Preço não encontrado ou não pertence à empresa do usuário
- `409 Conflict`: Já existe um preço ativo para a nova combinação empresa+combustível

---

### 5. Excluir Preço

Exclui um preço de combustível, validando que ele pertence à empresa do usuário logado.

**Endpoint:**
```http
DELETE /empresa-preco-combustivel/:id
```

**Headers:**
```http
Authorization: Bearer {accessToken}
```

**Exemplo:**
```http
DELETE /empresa-preco-combustivel/1
Authorization: Bearer {accessToken}
```

**Resposta de Sucesso (200):**
```json
{
  "message": "Preço de combustível excluído com sucesso",
  "id": 1
}
```

**Erros Possíveis:**
- `400 Bad Request`: Usuário não vinculado a empresa
- `403 Forbidden`: Usuário não tem permissão (não é ADMIN_EMPRESA)
- `404 Not Found`: Preço não encontrado ou não pertence à empresa do usuário

---

## 🚀 Atualização Automática de Preço com Dados ANP

Esta é a funcionalidade especial do módulo que permite atualizar o `preco_atual` e **automaticamente** consultar e preencher todos os dados relacionados à ANP.

### Como Funciona

Quando você atualiza o `preco_atual` usando esta rota, o sistema:

1. ✅ **Captura automaticamente** o `empresa_id` do usuário logado
2. ✅ **Busca a UF** da empresa do usuário logado
3. ✅ **Consulta a semana ANP ativa** mais recente
4. ✅ **Mapeia o combustível** para o tipo ANP correspondente
5. ✅ **Busca os preços ANP** para a UF e tipo de combustível
6. ✅ **Valida o preço atual**:
   - Verifica se `preco_atual` não ultrapassa o `teto_vigente` da ANP
   - Se ultrapassar, retorna erro 400 com mensagem explicativa
7. ✅ **Calcula automaticamente**:
   - `teto_vigente`: Usa o `teto_calculado` da ANP
   - `anp_base`: Usa o `base_utilizada` da ANP
   - `anp_base_valor`: Calcula baseado na `base_utilizada` (MINIMO, MEDIO ou MAXIMO)
   - `margem_app_pct`: Usa o `margem_aplicada` da ANP
   - `uf_referencia`: Usa a UF da empresa
   - `status`: Define como `ACTIVE`
   - `updated_at`: Data/hora atual
   - `updated_by`: Nome ou email do usuário logado

### Endpoint

```http
PATCH /empresa-preco-combustivel/preco-atual
```

**⚠️ IMPORTANTE:** Esta rota deve ser chamada **ANTES** da rota `PATCH /empresa-preco-combustivel/:id` para evitar conflitos de roteamento.

### Headers

```http
Authorization: Bearer {accessToken}
Content-Type: application/json
```

### Body

```json
{
  "combustivel_id": 1,
  "preco_atual": 5.89
}
```

**Campos Obrigatórios:**
- `combustivel_id` (number): ID do combustível
- `preco_atual` (number): Novo preço atual (mínimo 0, máximo 2 casas decimais)

### Exemplo Completo

```http
PATCH /empresa-preco-combustivel/preco-atual
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json

{
  "combustivel_id": 1,
  "preco_atual": 5.89
}
```

### Resposta de Sucesso

**Se o preço já existia (200):**
```json
{
  "id": 1,
  "empresa_id": 5,
  "combustivel_id": 1,
  "preco_atual": "5.89",
  "teto_vigente": "6.50",
  "anp_base": "MEDIO",
  "anp_base_valor": "5.50",
  "margem_app_pct": "7.08",
  "uf_referencia": "SP",
  "status": "ACTIVE",
  "updated_at": "2024-01-15T14:30:00.000Z",
  "updated_by": "admin@empresa.com"
}
```

**Se o preço não existia e foi criado (201):**
```json
{
  "id": 2,
  "empresa_id": 5,
  "combustivel_id": 2,
  "preco_atual": "4.50",
  "teto_vigente": "5.00",
  "anp_base": "MINIMO",
  "anp_base_valor": "4.20",
  "margem_app_pct": "7.14",
  "uf_referencia": "SP",
  "status": "ACTIVE",
  "updated_at": "2024-01-15T14:30:00.000Z",
  "updated_by": "admin@empresa.com"
}
```

### Mapeamento de Combustíveis para ANP

O sistema mapeia automaticamente os combustíveis internos para os tipos ANP:

| Combustível Interno | Tipo ANP |
|---------------------|----------|
| Gasolina Comum (G) | `GASOLINA_COMUM` |
| Gasolina Aditivada (GA) | `GASOLINA_ADITIVADA` |
| Etanol Comum (E) | `ETANOL_COMUM` |
| Etanol Aditivado (EA) | `ETANOL_ADITIVADO` |
| Diesel S10 (D10) | `DIESEL_S10` |
| Diesel S500 (D500) | `DIESEL_S500` |
| GNV | `GNV` |
| GLP | `GLP` |

### Pré-requisitos para Funcionar

Para que esta funcionalidade funcione corretamente, você precisa ter:

1. ✅ **Semana ANP ativa** cadastrada no sistema
2. ✅ **Preços ANP por UF** importados para a UF da empresa
3. ✅ **Combustível** cadastrado com nome/sigla que possa ser mapeado para ANP
4. ✅ **Empresa** com `uf` preenchida

### Erros Possíveis

- `400 Bad Request`: 
  - Dados inválidos
  - Usuário não vinculado a empresa
  - Preço ANP incompleto (faltando `teto_calculado`, `base_utilizada` ou `margem_aplicada`)
  - **Preço atual superior ao teto vigente da ANP**
  
- `403 Forbidden`: Usuário não tem permissão (não é ADMIN_EMPRESA)

- `404 Not Found`: 
  - Empresa não encontrada
  - Combustível não encontrado
  - Semana ANP ativa não encontrada
  - Preço ANP não encontrado para a UF e tipo de combustível

---

## 📝 Exemplos Práticos Completos

### Exemplo 1: Fluxo Completo - Criar e Atualizar Preço

#### Passo 1: Fazer Login

```bash
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@empresa.com",
    "senha": "123456"
  }'
```

**Resposta:**
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6..."
}
```

#### Passo 2: Listar Combustíveis Disponíveis

```bash
curl -X GET http://localhost:3000/combustiveis \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

#### Passo 3: Atualizar Preço com Dados ANP Automáticos

```bash
curl -X PATCH http://localhost:3000/empresa-preco-combustivel/preco-atual \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -H "Content-Type: application/json" \
  -d '{
    "combustivel_id": 1,
    "preco_atual": 5.89
  }'
```

**Resposta:**
```json
{
  "id": 1,
  "empresa_id": 5,
  "combustivel_id": 1,
  "preco_atual": "5.89",
  "teto_vigente": "6.50",
  "anp_base": "MEDIO",
  "anp_base_valor": "5.50",
  "margem_app_pct": "7.08",
  "uf_referencia": "SP",
  "status": "ACTIVE",
  "updated_at": "2024-01-15T14:30:00.000Z",
  "updated_by": "admin@empresa.com"
}
```

#### Passo 4: Listar Todos os Preços da Empresa

```bash
curl -X GET http://localhost:3000/empresa-preco-combustivel \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

#### Passo 5: Buscar Preço Específico

```bash
curl -X GET http://localhost:3000/empresa-preco-combustivel/1 \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

#### Passo 6: Atualizar Preço Manualmente

```bash
curl -X PATCH http://localhost:3000/empresa-preco-combustivel/1 \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -H "Content-Type: application/json" \
  -d '{
    "preco_atual": 5.99,
    "status": "ACTIVE"
  }'
```

---

### Exemplo 2: Criar Preço Manualmente (sem dados ANP automáticos)

```bash
curl -X POST http://localhost:3000/empresa-preco-combustivel \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -H "Content-Type: application/json" \
  -d '{
    "combustivel_id": 1,
    "preco_atual": 5.89,
    "teto_vigente": 6.50,
    "anp_base": "MEDIO",
    "anp_base_valor": 5.50,
    "margem_app_pct": 7.08,
    "uf_referencia": "SP",
    "status": "ACTIVE",
    "updated_by": "admin@empresa.com"
  }'
```

---

### Exemplo 3: Filtrar Preços por Status

```bash
curl -X GET "http://localhost:3000/empresa-preco-combustivel?status=ACTIVE" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

---

### Exemplo 4: Filtrar Preços por Combustível e UF

```bash
curl -X GET "http://localhost:3000/empresa-preco-combustivel?combustivel_id=1&uf_referencia=SP" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

---

### Exemplo 5: Desativar Preço Manualmente

```bash
curl -X PATCH http://localhost:3000/empresa-preco-combustivel/1 \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -H "Content-Type: application/json" \
  -d '{
    "status": "INACTIVE_MANUAL"
  }'
```

---

## ✅ Testes Práticos (Passam e Falham)

Os cenários abaixo podem ser reproduzidos via Postman, Insomnia ou `curl`. Cada exemplo assume:

- Usuário autenticado com perfil `ADMIN_EMPRESA`
- Tokens válidos no header `Authorization: Bearer {token}`
- Base de dados com empresa, combustíveis e preços ANP configurados conforme pré-requisitos

### 🔵 Casos de Sucesso

| ID | Objetivo | Pré-condições | Requisição | Resultado Esperado |
|----|----------|---------------|------------|--------------------|
| TS-001 | Criar preço inédito com dados válidos | Não existe registro ativo para o par `empresa_id=5` + `combustivel_id=1` | `POST /empresa-preco-combustivel` com body:<br>`{ "combustivel_id": 1, "preco_atual": 5.79, "teto_vigente": 6.40, "anp_base": "MEDIO", "anp_base_valor": 6.10, "margem_app_pct": 5.00, "uf_referencia": "SP" }` | `201 Created` + corpo contendo o preço persistido com status `ACTIVE` |
| TS-002 | Listar preços filtrando status | Registro ativo existente para empresa do usuário | `GET /empresa-preco-combustivel?status=ACTIVE` | `200 OK` + array com registros ativos; nenhum registro de outras empresas aparece |
| TS-003 | Atualizar preço existente reduzindo valor | Preço ID 10 pertence à empresa do usuário | `PATCH /empresa-preco-combustivel/10` body `{ "preco_atual": 5.49 }` | `200 OK` + `preco_atual` atualizado e dados ANP recalculados automaticamente |
| TS-004 | Atualizar preço via ANP (rota automática) | Semana ANP ativa válida | `PATCH /empresa-preco-combustivel/preco-atual` body `{ "combustivel_id": 2, "preco_atual": 4.39 }` | `200 OK` (ou `201 Created` se não existir) + campos ANP preenchidos a partir da semana ativa |
| TS-005 | Excluir preço da própria empresa | Preço ID 12 pertence à empresa do usuário | `DELETE /empresa-preco-combustivel/12` | `200 OK` + mensagem “Preço de combustível excluído com sucesso” |

### 🔴 Casos que Devem Falhar

| ID | Objetivo | Pré-condições | Requisição | Erro Esperado |
|----|----------|---------------|------------|---------------|
| TF-001 | Bloquear criação duplicada | Já existe preço `ACTIVE` para `combustivel_id=1` | `POST /empresa-preco-combustivel` corpo semelhante ao TS-001 | `409 Conflict` + código `EMPRESA_PRECO_COMBUSTIVEL_ACTIVE_ALREADY_EXISTS` |
| TF-002 | Rejeitar usuário sem empresa vinculada | Usuário autenticado sem `empresa_id` | `GET /empresa-preco-combustivel` | `400 Bad Request` + código `EMPRESA_PRECO_COMBUSTIVEL_USER_WITHOUT_EMPRESA` |
| TF-003 | Impedir acesso de outra empresa | Preço ID 10 pertence a empresa diferente | `GET /empresa-preco-combustivel/10` | `403 Forbidden` + código `EMPRESA_PRECO_COMBUSTIVEL_FORBIDDEN` |
| TF-004 | Validar preço acima do teto | Teto ANP vigente é 6.40 | `PATCH /empresa-preco-combustivel/preco-atual` body `{ "combustivel_id": 1, "preco_atual": 6.90 }` | `400 Bad Request` + código `EMPRESA_PRECO_COMBUSTIVEL_PRICE_ABOVE_TETO` e mensagem explicando teto |
| TF-005 | Validar preço abaixo do mínimo | Preço mínimo ANP é 4.00 | `PATCH /empresa-preco-combustivel/preco-atual` body `{ "combustivel_id": 2, "preco_atual": 3.20 }` | `400 Bad Request` + código `EMPRESA_PRECO_COMBUSTIVEL_PRICE_BELOW_MIN` |
| TF-006 | Detectar combustível inválido | `combustivel_id` não existe | `POST /empresa-preco-combustivel` com `combustivel_id`: 999 | `404 Not Found` + código `EMPRESA_PRECO_COMBUSTIVEL_COMBUSTIVEL_NOT_FOUND` |
| TF-007 | Mapear combustível não reconhecido | Combustível cadastrado sem nome/sigla compatíveis com ANP | `PATCH /empresa-preco-combustivel/preco-atual` | `400 Bad Request` + código `EMPRESA_PRECO_COMBUSTIVEL_UNMAPPED_ANP_TYPE` com nomes no `additionalInfo` |
| TF-008 | Semana ANP ausente | Não existe semana ativa | `PATCH /empresa-preco-combustivel/preco-atual` | `404 Not Found` + código `EMPRESA_PRECO_COMBUSTIVEL_ANP_WEEK_NOT_FOUND` |
| TF-009 | Falta de dados ANP (teto/calculado/base) | Registro ANP encontrado mas incompleto | `PATCH /empresa-preco-combustivel/preco-atual` | `400 Bad Request` com códigos `EMPRESA_PRECO_COMBUSTIVEL_ANP_PRICE_WITHOUT_TETO`, `..._WITHOU_MIN` ou `..._WITHOUT_BASE` conforme o campo ausente |
| TF-010 | Status inválido na criação | Valor `status`: `"ATIVO"` | `POST /empresa-preco-combustivel` com `status` inválido | `400 Bad Request` + código `EMPRESA_PRECO_COMBUSTIVEL_INVALID_STATUS` |

### 📌 Dicas para Automatização

- Armazene os headers comuns (Authorization, Content-Type) em variáveis do Postman/Insomnia.
- Utilize scripts de pré-teste para gerar tokens automaticamente, se necessário.
- Para cenários de erro, valide tanto o `statusCode` quanto o `errorCode` retornado.
- Documente massa de dados utilizada (IDs de empresa, combustíveis, semanas ANP) para reproduzir os testes em diferentes ambientes (dev, staging).

---

## 🔧 Troubleshooting

### Erro 403 Forbidden

**Erro**: `Apenas usuários com perfil ADMIN_EMPRESA têm acesso a este recurso`

**Soluções:**
1. Verifique se você está logado com um usuário que tem perfil `ADMIN_EMPRESA`
2. Verifique se o token está sendo enviado corretamente no header `Authorization: Bearer {token}`
3. Se o token expirou, renove-o usando o `refreshToken` (veja [tokens.md](./tokens.md))

---

### Erro 400 Bad Request - Usuário não vinculado a empresa

**Erro**: `Usuário não está vinculado a uma empresa`

**Soluções:**
1. Verifique se o usuário tem `empresa_id` preenchido no banco de dados
2. Entre em contato com um `SUPER_ADMIN` para vincular o usuário a uma empresa
3. Verifique se o token está correto e pertence a um usuário válido

---

### Erro 404 Not Found - Preço não encontrado

**Erro**: `Preço de combustível não encontrado`

**Soluções:**
1. Verifique se o ID do preço existe
2. Verifique se o preço pertence à empresa do usuário logado (você só pode ver preços da sua empresa)
3. Use `GET /empresa-preco-combustivel` para listar todos os preços disponíveis

---

### Erro 409 Conflict - Preço ativo já existe

**Erro**: `Já existe um preço ativo para esta empresa e combustível`

**Soluções:**
1. Desative o preço ativo existente antes de criar um novo:
   ```http
   PATCH /empresa-preco-combustivel/{id_existente}
   {
     "status": "INACTIVE_MANUAL"
   }
   ```
2. Ou atualize o preço existente em vez de criar um novo:
   ```http
   PATCH /empresa-preco-combustivel/{id_existente}
   {
     "preco_atual": 5.99
   }
   ```

---

### Erro 404 - Semana ANP ativa não encontrada

**Erro**: `Semana ANP ativa não encontrada`

**Soluções:**
1. Verifique se existe uma semana ANP cadastrada no sistema
2. Verifique se a semana ANP está marcada como `ativo: true`
3. Entre em contato com um `SUPER_ADMIN` para cadastrar/ativar uma semana ANP
4. Use `GET /anp-semana` para listar todas as semanas ANP (requer permissão SUPER_ADMIN)

---

### Erro 404 - Preço ANP não encontrado

**Erro**: `Preço ANP não encontrado para a UF {UF} e tipo de combustível {TIPO}`

**Soluções:**
1. Verifique se os preços ANP foram importados para a UF da empresa
2. Verifique se o combustível pode ser mapeado para um tipo ANP válido
3. Entre em contato com um `SUPER_ADMIN` para importar os preços ANP
4. Verifique se a semana ANP ativa tem preços importados

---

### Erro 400 - Preço ANP incompleto

**Erro**: `Preço ANP incompleto: faltando teto_calculado, base_utilizada ou margem_aplicada`

**Soluções:**
1. Verifique se os preços ANP foram importados corretamente
2. Verifique se o arquivo CSV de importação continha todos os campos necessários
3. Entre em contato com um `SUPER_ADMIN` para reimportar os preços ANP

---

### Erro 400 - Preço atual superior ao teto vigente

**Erro**: `O preço atual (R$ X.XX) não pode ser superior ao teto vigente (R$ Y.YY). O teto vigente é definido pela ANP com base na semana ativa, UF da empresa e tipo de combustível.`

**Soluções:**
1. Verifique o teto vigente atual consultando a semana ANP ativa
2. Reduza o `preco_atual` para um valor igual ou inferior ao teto vigente
3. O teto vigente é calculado automaticamente pela ANP e não pode ser alterado manualmente
4. Se o teto vigente estiver incorreto, verifique se:
   - A semana ANP ativa está correta
   - Os preços ANP foram importados corretamente para a UF da empresa
   - O tipo de combustível está mapeado corretamente

**Exemplo de erro:**
```json
{
  "statusCode": 400,
  "message": "O preço atual (R$ 7.00) não pode ser superior ao teto vigente (R$ 6.50). O teto vigente é definido pela ANP com base na semana ativa, UF da empresa e tipo de combustível.",
  "error": "Bad Request"
}
```

---

### Token Expirado

**Erro**: `Unauthorized` ou `Token expirado`

**Soluções:**
1. Use o `refreshToken` para obter um novo `accessToken`:
   ```http
   POST /auth/refresh
   Content-Type: application/json
   
   {
     "refreshToken": "seu_refresh_token_aqui"
   }
   ```
2. Veja mais detalhes em [tokens.md](./tokens.md)

---

## 📚 Referências

- [Guia de Autenticação e Tokens](./tokens.md)
- [Documentação da API (Swagger)](http://localhost:3000/api/docs)
- [Schema do Banco de Dados](./prisma/schema.prisma)

---

## ✅ Checklist de Uso

Antes de usar este módulo, certifique-se de que:

- [ ] Você tem um usuário com perfil `ADMIN_EMPRESA`
- [ ] O usuário está vinculado a uma empresa (`empresa_id` preenchido)
- [ ] A empresa tem `uf` preenchida (para funcionalidade automática)
- [ ] Você fez login e obteve um `accessToken` válido
- [ ] Existem combustíveis cadastrados no sistema
- [ ] (Opcional) Existe uma semana ANP ativa com preços importados (para funcionalidade automática)

---

**Última atualização**: Janeiro 2024


# Guia de Testes - Módulo de Abastecimento e Solicitação de Abastecimento

## 📋 Índice

1. [Visão Geral](#visão-geral)
2. [Pré-requisitos](#pré-requisitos)
3. [Autenticação](#autenticação)
4. [Fluxo Completo](#fluxo-completo)
5. [CRUD de Solicitação de Abastecimento](#crud-de-solicitação-de-abastecimento)
6. [CRUD de Abastecimento](#crud-de-abastecimento)
7. [Criar Abastecimento a partir de Solicitação](#criar-abastecimento-a-partir-de-solicitação)
8. [Testes de Erros](#testes-de-erros)
9. [Validações Importantes](#validações-importantes)
10. [Exemplos Práticos](#exemplos-práticos)

---

## 🎯 Visão Geral

O módulo de abastecimento trabalha em conjunto com o módulo de solicitação de abastecimento:

1. **Solicitação de Abastecimento**: Criada por `ADMIN_PREFEITURA` para solicitar abastecimento de um veículo
2. **Abastecimento**: Criado por `ADMIN_EMPRESA` ou `COLABORADOR_EMPRESA` para atender a solicitação

### Fluxo Principal:
```
ADMIN_PREFEITURA → Cria Solicitação (PENDENTE)
                  ↓
ADMIN_EMPRESA → Atende Solicitação → Cria Abastecimento
                  ↓
Solicitação: PENDENTE → APROVADA → EFETIVADA
```

---

## 🔧 Pré-requisitos

### 1. Dados Necessários no Banco

- **Prefeitura** cadastrada e ativa
- **Órgão** cadastrado vinculado à prefeitura
- **Veículo** cadastrado, ativo, vinculado ao órgão
- **Combustível** cadastrado, ativo, vinculado ao veículo
- **Empresa** cadastrada e ativa
- **EmpresaPrecoCombustivel** com status `ACTIVE` para a empresa e combustível
- **Motorista** (opcional) cadastrado, vinculado à prefeitura
- **CotaOrgao** (se tipo de abastecimento for `COM_COTA`) ativa
- **Processo** cadastrado para a prefeitura (para empresas credenciadas)

### 2. Usuários Necessários

- **ADMIN_PREFEITURA**: Para criar solicitações
- **ADMIN_EMPRESA** ou **COLABORADOR_EMPRESA**: Para criar abastecimentos

---

## 🔐 Autenticação

Todas as rotas requerem autenticação JWT. Use o token no header:

```http
Authorization: Bearer <seu_token_jwt>
```

### Obter Token

```bash
POST /auth/login
Content-Type: application/json

{
  "email": "admin@prefeitura.com",
  "password": "senha123"
}
```

**Resposta:**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "nome": "Admin Prefeitura",
    "email": "admin@prefeitura.com",
    "tipo_usuario": "ADMIN_PREFEITURA",
    "prefeitura": {
      "id": 1,
      "nome": "Prefeitura de São Paulo"
    }
  }
}
```

---

## 🔄 Fluxo Completo

### Passo 1: Criar Solicitação de Abastecimento (ADMIN_PREFEITURA)

```bash
POST /solicitacoes
Authorization: Bearer <token_admin_prefeitura>
Content-Type: application/json

{
  "prefeituraId": 1,
  "veiculoId": 10,
  "motoristaId": 5,
  "combustivelId": 2,
  "empresaId": 3,
  "quantidade": 50.5,
  "data_solicitacao": "2025-01-15T10:00:00Z",
  "data_expiracao": "2025-01-20T10:00:00Z",
  "tipo_abastecimento": "COM_COTA"
}
```

**Resposta (201):**
```json
{
  "message": "Solicitação criada com sucesso",
  "solicitacao": {
    "id": 1,
    "status": "PENDENTE",
    "veiculoId": 10,
    "combustivelId": 2,
    "empresaId": 3,
    "quantidade": 50.5,
    "data_solicitacao": "2025-01-15T10:00:00.000Z",
    "data_expiracao": "2025-01-20T10:00:00.000Z",
    "tipo_abastecimento": "COM_COTA",
    "ativo": true
  }
}
```

### Passo 2: Criar Abastecimento a partir da Solicitação (ADMIN_EMPRESA)

```bash
POST /abastecimentos/from-solicitacao
Authorization: Bearer <token_admin_empresa>
Content-Type: application/json

{
  "solicitacaoId": 1,
  "data_abastecimento": "2025-01-16T14:30:00Z",
  "odometro": 50000,
  "orimetro": 1000,
  "preco_anp": 5.50,
  "nfe_chave_acesso": "12345678901234567890123456789012345678901234",
  "nfe_link": "https://nfe.exemplo.com/123456",
  "abastecido_por": "João Silva"
}
```

**Resposta (201):**
```json
{
  "message": "Solicitação aprovada e abastecimento criado com sucesso",
  "abastecimento": {
    "id": 1,
    "veiculoId": 10,
    "combustivelId": 2,
    "empresaId": 3,
    "quantidade": 50.5,
    "valor_total": 275.25,
    "status": "Aprovado",
    "data_abastecimento": "2025-01-16T14:30:00.000Z",
    "tipo_abastecimento": "COM_COTA"
  },
  "solicitacao": {
    "id": 1,
    "status": "EFETIVADA",
    "abastecimento_id": 1
  },
  "aprovada_automaticamente": true
}
```

**O que aconteceu:**
1. ✅ Status da solicitação mudou de `PENDENTE` → `APROVADA`
2. ✅ Abastecimento foi criado
3. ✅ Status da solicitação mudou de `APROVADA` → `EFETIVADA`
4. ✅ Solicitação foi vinculada ao abastecimento (`abastecimento_id: 1`)

---

## 📝 CRUD de Solicitação de Abastecimento

### 1. Criar Solicitação

**Rota:** `POST /solicitacoes`  
**Permissão:** `ADMIN_PREFEITURA`

**Campos Obrigatórios:**
- `prefeituraId`: ID da prefeitura
- `veiculoId`: ID do veículo
- `combustivelId`: ID do combustível
- `empresaId`: ID da empresa
- `quantidade`: Quantidade em litros (número positivo)
- `data_solicitacao`: Data da solicitação (ISO 8601)
- `data_expiracao`: Data de expiração (ISO 8601)
- `tipo_abastecimento`: `COM_COTA`, `LIVRE`, ou `COM_AUTORIZACAO`

**Campos Opcionais:**
- `motoristaId`: ID do motorista
- `status`: Status inicial (padrão: `PENDENTE`)
- `nfe_chave_acesso`: Chave de acesso da NFE (44 caracteres)
- `nfe_img_url`: URL da imagem da NFE
- `conta_faturamento_orgao_id`: ID da conta de faturamento
- `observacoes`: Observações adicionais

### 2. Listar Solicitações

**Rota:** `GET /solicitacoes`  
**Permissão:** `ADMIN_PREFEITURA` ou `ADMIN_EMPRESA`

**Query Parameters:**
- `page`: Número da página (padrão: 1)
- `limit`: Itens por página (padrão: 10)
- `status`: Filtrar por status
- `veiculoId`: Filtrar por veículo
- `empresaId`: Filtrar por empresa
- `combustivelId`: Filtrar por combustível
- `ativo`: Filtrar por ativo/inativo

**Exemplo:**
```bash
GET /solicitacoes?page=1&limit=10&status=PENDENTE
Authorization: Bearer <token>
```

### 3. Buscar Solicitação por ID

**Rota:** `GET /solicitacoes/:id`  
**Permissão:** `ADMIN_PREFEITURA` ou `ADMIN_EMPRESA`

**Exemplo:**
```bash
GET /solicitacoes/1
Authorization: Bearer <token>
```

### 4. Atualizar Solicitação

**Rota:** `PATCH /solicitacoes/:id`  
**Permissão:** `ADMIN_PREFEITURA`

**Exemplo:**
```bash
PATCH /solicitacoes/1
Authorization: Bearer <token>
Content-Type: application/json

{
  "quantidade": 60.0,
  "observacoes": "Quantidade atualizada"
}
```

### 5. Excluir Solicitação

**Rota:** `DELETE /solicitacoes/:id`  
**Permissão:** `ADMIN_PREFEITURA`

**Exemplo:**
```bash
DELETE /solicitacoes/1
Authorization: Bearer <token>
```

### 6. Rotas Auxiliares

#### Listar Veículos da Prefeitura
```bash
GET /solicitacoes/veiculo/orgao/prefeitura
Authorization: Bearer <token_admin_prefeitura>
```

#### Obter Tipo de Abastecimento do Veículo
```bash
GET /solicitacoes/veiculo/:id/tipo-abastecimento
Authorization: Bearer <token_admin_prefeitura>
```

**Resposta:**
```json
{
  "veiculoId": 10,
  "tipo_abastecimento": "COM_COTA",
  "periodicidade": "Semanal",
  "quantidade": 100.0,
  "consumo_periodo": {
    "quantidade_consumida": 45.5,
    "quantidade_limite": 100.0,
    "limite_excedido": false,
    "quantidade_disponivel": 54.5
  }
}
```

#### Listar Empresas Credenciadas
```bash
GET /solicitacoes/empresas/credenciadas
Authorization: Bearer <token_admin_prefeitura>
```

#### Listar Combustíveis da Empresa
```bash
GET /solicitacoes/empresas/:empresaId/combustiveis
Authorization: Bearer <token_admin_prefeitura>
```

#### Listar Cotas do Órgão
```bash
GET /solicitacoes/orgao/:orgaoId/cotas
Authorization: Bearer <token_admin_prefeitura>
```

---

## ⛽ CRUD de Abastecimento

### 1. Criar Abastecimento

**Rota:** `POST /abastecimentos`  
**Permissão:** `ADMIN_EMPRESA` ou `COLABORADOR_EMPRESA`

**Campos Obrigatórios:**
- `veiculoId`: ID do veículo
- `combustivelId`: ID do combustível
- `empresaId`: ID da empresa (deve ser a empresa do usuário logado)
- `tipo_abastecimento`: `COM_COTA`, `LIVRE`, ou `COM_AUTORIZACAO`
- `quantidade`: Quantidade em litros (número positivo)
- `valor_total`: Valor total do abastecimento

**Campos Opcionais:**
- `motoristaId`: ID do motorista
- `solicitanteId`: ID do solicitante
- `validadorId`: ID do validador
- `abastecedorId`: ID do abastecedor
- `preco_anp`: Preço ANP
- `preco_empresa`: Preço da empresa
- `desconto`: Desconto aplicado
- `data_abastecimento`: Data do abastecimento (padrão: data atual)
- `odometro`: Odômetro do veículo
- `orimetro`: Horímetro do veículo
- `status`: Status do abastecimento (padrão: `Aguardando`)
- `nfe_chave_acesso`: Chave de acesso da NFE (44 caracteres)
- `nfe_img_url`: URL da imagem da NFE
- `nfe_link`: Link da NFE
- `abastecido_por`: Nome de quem abasteceu
- `conta_faturamento_orgao_id`: ID da conta de faturamento
- `cota_id`: ID da cota (para tipo `COM_COTA`)
- `ativo`: Se o abastecimento está ativo (padrão: `true`)

**Exemplo:**
```bash
POST /abastecimentos
Authorization: Bearer <token_admin_empresa>
Content-Type: application/json

{
  "veiculoId": 10,
  "combustivelId": 2,
  "empresaId": 3,
  "tipo_abastecimento": "COM_COTA",
  "quantidade": 50.5,
  "valor_total": 275.25,
  "preco_empresa": 5.45,
  "preco_anp": 5.50,
  "data_abastecimento": "2025-01-16T14:30:00Z",
  "odometro": 50000,
  "nfe_chave_acesso": "12345678901234567890123456789012345678901234",
  "nfe_link": "https://nfe.exemplo.com/123456"
}
```

### 2. Listar Abastecimentos

**Rota:** `GET /abastecimentos`  
**Permissão:** Qualquer usuário autenticado

**Query Parameters:**
- `page`: Número da página (padrão: 1)
- `limit`: Itens por página (padrão: 10)
- `veiculoId`: Filtrar por veículo
- `motoristaId`: Filtrar por motorista
- `combustivelId`: Filtrar por combustível
- `empresaId`: Filtrar por empresa
- `tipo_abastecimento`: Filtrar por tipo
- `status`: Filtrar por status
- `ativo`: Filtrar por ativo/inativo
- `data_inicial`: Data inicial (ISO 8601)
- `data_final`: Data final (ISO 8601)

**Exemplo:**
```bash
GET /abastecimentos?page=1&limit=10&status=Aprovado&empresaId=3
Authorization: Bearer <token>
```

### 3. Buscar Abastecimento por ID

**Rota:** `GET /abastecimentos/:id`  
**Permissão:** Qualquer usuário autenticado

**Exemplo:**
```bash
GET /abastecimentos/1
Authorization: Bearer <token>
```

### 4. Atualizar Abastecimento

**Rota:** `PATCH /abastecimentos/:id`  
**Permissão:** Qualquer usuário autenticado

**Exemplo:**
```bash
PATCH /abastecimentos/1
Authorization: Bearer <token>
Content-Type: application/json

{
  "odometro": 50100,
  "nfe_link": "https://nfe.exemplo.com/123456/atualizado"
}
```

### 5. Excluir Abastecimento

**Rota:** `DELETE /abastecimentos/:id`  
**Permissão:** Qualquer usuário autenticado

**Exemplo:**
```bash
DELETE /abastecimentos/1
Authorization: Bearer <token>
```

### 6. Aprovar Abastecimento

**Rota:** `PATCH /abastecimentos/:id/approve`  
**Permissão:** Qualquer usuário autenticado

**Exemplo:**
```bash
PATCH /abastecimentos/1/approve
Authorization: Bearer <token>
```

### 7. Rejeitar Abastecimento

**Rota:** `PATCH /abastecimentos/:id/reject`  
**Permissão:** Qualquer usuário autenticado

**Exemplo:**
```bash
PATCH /abastecimentos/1/reject
Authorization: Bearer <token>
Content-Type: application/json

{
  "motivo": "Documentação insuficiente"
}
```

---

## 🔄 Criar Abastecimento a partir de Solicitação

### Rota Principal

**Rota:** `POST /abastecimentos/from-solicitacao`  
**Permissão:** `ADMIN_EMPRESA` ou `COLABORADOR_EMPRESA`

### Fluxo Automático

1. **Se solicitação estiver `PENDENTE`:**
   - Status muda para `APROVADA`
   - Campos de aprovação são preenchidos automaticamente

2. **Abastecimento é criado:**
   - Dados da solicitação são copiados
   - Validador é o usuário logado (se não informado)
   - Status padrão: `Aprovado`

3. **Solicitação é marcada como `EFETIVADA`:**
   - Status muda para `EFETIVADA`
   - `abastecimento_id` é vinculado

### Campos do Request

**Obrigatório:**
- `solicitacaoId`: ID da solicitação

**Opcionais:**
- `data_abastecimento`: Data do abastecimento (padrão: data atual)
- `status`: Status do abastecimento (padrão: `Aprovado`)
- `odometro`: Odômetro do veículo
- `orimetro`: Horímetro do veículo
- `validadorId`: ID do validador (padrão: usuário logado)
- `abastecedorId`: ID do abastecedor
- `desconto`: Desconto aplicado
- `preco_anp`: Preço ANP
- `abastecido_por`: Nome de quem abasteceu
- `nfe_link`: Link da NFE
- `ativo`: Se o abastecimento está ativo (padrão: `true`)

### Exemplo Completo

```bash
POST /abastecimentos/from-solicitacao
Authorization: Bearer <token_admin_empresa>
Content-Type: application/json

{
  "solicitacaoId": 1,
  "data_abastecimento": "2025-01-16T14:30:00Z",
  "status": "Aprovado",
  "odometro": 50000,
  "orimetro": 1000,
  "preco_anp": 5.50,
  "desconto": 0.0,
  "nfe_link": "https://nfe.exemplo.com/123456",
  "abastecido_por": "João Silva",
  "ativo": true
}
```

**Resposta (201):**
```json
{
  "message": "Solicitação aprovada e abastecimento criado com sucesso",
  "abastecimento": {
    "id": 1,
    "veiculoId": 10,
    "combustivelId": 2,
    "empresaId": 3,
    "quantidade": 50.5,
    "valor_total": 275.25,
    "status": "Aprovado",
    "data_abastecimento": "2025-01-16T14:30:00.000Z",
    "tipo_abastecimento": "COM_COTA",
    "odometro": 50000,
    "orimetro": 1000,
    "preco_anp": 5.50,
    "nfe_link": "https://nfe.exemplo.com/123456",
    "abastecido_por": "João Silva"
  },
  "solicitacao": {
    "id": 1,
    "status": "EFETIVADA",
    "abastecimento_id": 1,
    "data_aprovacao": "2025-01-16T14:30:00.000Z",
    "aprovado_por": "Admin Empresa",
    "aprovado_por_email": "admin@empresa.com"
  },
  "aprovada_automaticamente": true
}
```

---

## ❌ Testes de Erros

### Erros Comuns de Solicitação

#### 1. Veículo Não Encontrado
```bash
POST /solicitacoes
{
  "veiculoId": 9999,  # Veículo não existe
  ...
}
```
**Erro (404):** `Veículo com ID 9999 não foi encontrado`

#### 2. Combustível Não Vinculado ao Veículo
```bash
POST /solicitacoes
{
  "veiculoId": 10,
  "combustivelId": 99,  # Combustível não vinculado ao veículo
  ...
}
```
**Erro (400):** `Combustível com ID 99 não está vinculado ao veículo com ID 10`

#### 3. Quantidade Excede Limite da Cota
```bash
POST /solicitacoes
{
  "tipo_abastecimento": "COM_COTA",
  "quantidade": 1000.0,  # Excede a cota disponível
  ...
}
```
**Erro (400):** `Quantidade solicitada (1000.0 litros) excede a cota disponível`

#### 4. Empresa Não Credenciada
```bash
POST /solicitacoes
{
  "empresaId": 99,  # Empresa não credenciada
  ...
}
```
**Erro (400):** `Empresa com ID 99 não está credenciada para a prefeitura`

#### 5. Data de Expiração Anterior à Data de Solicitação
```bash
POST /solicitacoes
{
  "data_solicitacao": "2025-01-20T10:00:00Z",
  "data_expiracao": "2025-01-15T10:00:00Z",  # Data anterior
  ...
}
```
**Erro (400):** `Data de expiração deve ser posterior à data de solicitação`

### Erros Comuns de Abastecimento

#### 1. Usuário Sem Empresa
```bash
POST /abastecimentos
Authorization: Bearer <token_sem_empresa>
{
  ...
}
```
**Erro (400):** `Usuário não está vinculado a uma empresa. Apenas usuários de empresa podem criar abastecimentos`

#### 2. Empresa Diferente da do Usuário
```bash
POST /abastecimentos
Authorization: Bearer <token_empresa_3>
{
  "empresaId": 5,  # Empresa diferente da do usuário
  ...
}
```
**Erro (400):** `Você não pode criar abastecimento para uma empresa diferente da sua`

#### 3. Veículo Inativo
```bash
POST /abastecimentos
{
  "veiculoId": 10,  # Veículo inativo
  ...
}
```
**Erro (400):** `Veículo com ID 10 está inativo`

#### 4. Quantidade Maior que Capacidade do Tanque
```bash
POST /abastecimentos
{
  "veiculoId": 10,  # Capacidade: 80 litros
  "quantidade": 100.0,  # Excede capacidade
  ...
}
```
**Erro (400):** `Quantidade de combustível solicitada (100.0 litros) excede a capacidade do tanque do veículo (80 litros)`

#### 5. Chave de Acesso NFE Inválida
```bash
POST /abastecimentos
{
  "nfe_chave_acesso": "12345",  # Deve ter 44 caracteres
  ...
}
```
**Erro (400):** `Chave de acesso da NFE inválida: 12345. A chave de acesso deve ter 44 caracteres numéricos`

#### 6. Data de Abastecimento Futura
```bash
POST /abastecimentos
{
  "data_abastecimento": "2026-01-01T10:00:00Z",  # Data futura
  ...
}
```
**Erro (400):** `Data de abastecimento não pode ser futura`

#### 7. Valor Total Inconsistente
```bash
POST /abastecimentos
{
  "quantidade": 50.0,
  "preco_empresa": 5.45,
  "desconto": 0.0,
  "valor_total": 300.0,  # Deveria ser 272.50
  ...
}
```
**Erro (400):** `Valor total informado (300.0) é inconsistente com os valores calculados`

#### 8. Desconto Maior que Valor Total
```bash
POST /abastecimentos
{
  "valor_total": 100.0,
  "desconto": 150.0,  # Desconto maior que valor total
  ...
}
```
**Erro (400):** `Desconto informado (R$ 150.0) é maior que o valor total (R$ 100.0)`

### Erros ao Criar Abastecimento a partir de Solicitação

#### 1. Solicitação Não Encontrada
```bash
POST /abastecimentos/from-solicitacao
{
  "solicitacaoId": 9999,  # Solicitação não existe
  ...
}
```
**Erro (404):** `Solicitação de abastecimento com ID 9999 não foi encontrada`

#### 2. Solicitação Já Efetivada
```bash
POST /abastecimentos/from-solicitacao
{
  "solicitacaoId": 1,  # Solicitação já efetivada
  ...
}
```
**Erro (400):** `Esta solicitação (ID: 1) já foi efetivada e possui um abastecimento vinculado`

#### 3. Solicitação Expirada
```bash
POST /abastecimentos/from-solicitacao
{
  "solicitacaoId": 1,  # Solicitação expirada
  ...
}
```
**Erro (400):** `Não é possível criar abastecimento para uma solicitação expirada`

#### 4. Solicitação Rejeitada
```bash
POST /abastecimentos/from-solicitacao
{
  "solicitacaoId": 1,  # Solicitação rejeitada
  ...
}
```
**Erro (400):** `Não é possível criar abastecimento para uma solicitação rejeitada`

#### 5. Empresa da Solicitação Diferente
```bash
POST /abastecimentos/from-solicitacao
Authorization: Bearer <token_empresa_5>
{
  "solicitacaoId": 1,  # Solicitação da empresa 3, usuário da empresa 5
  ...
}
```
**Erro (400):** `Você não pode criar abastecimento para uma solicitação de outra empresa`

#### 6. Solicitação Já Possui Abastecimento
```bash
POST /abastecimentos/from-solicitacao
{
  "solicitacaoId": 1,  # Solicitação já tem abastecimento_id
  ...
}
```
**Erro (409):** `A solicitação 1 já possui um abastecimento vinculado (ID: 2)`

### Erros de Aprovação/Rejeição

#### 1. Abastecimento Já Aprovado
```bash
PATCH /abastecimentos/1/approve
```
**Erro (400):** `Abastecimento com ID 1 já está aprovado. O status atual é Aprovado`

#### 2. Abastecimento Não Está Aguardando Aprovação
```bash
PATCH /abastecimentos/1/approve
# Status atual: Rejeitado
```
**Erro (400):** `Abastecimento com ID 1 não está aguardando aprovação. O status atual é Rejeitado`

#### 3. Motivo de Rejeição Obrigatório
```bash
PATCH /abastecimentos/1/reject
{
  "motivo": ""  # Motivo vazio
}
```
**Erro (400):** `Motivo da rejeição é obrigatório ao rejeitar um abastecimento`

---

## ✅ Validações Importantes

### Validações de Solicitação

1. **Veículo deve estar ativo e vinculado ao órgão da prefeitura**
2. **Combustível deve estar ativo e vinculado ao veículo**
3. **Empresa deve estar credenciada para a prefeitura**
4. **Data de expiração deve ser posterior à data de solicitação**
5. **Quantidade deve ser positiva e não exceder limites (se COM_COTA)**
6. **Tipo de abastecimento deve corresponder ao tipo do veículo**

### Validações de Abastecimento

1. **Usuário deve pertencer à empresa informada**
2. **Veículo deve estar ativo**
3. **Combustível deve estar ativo e vinculado ao veículo**
4. **Empresa deve estar ativa**
5. **Quantidade não pode exceder capacidade do tanque**
6. **Data de abastecimento não pode ser futura**
7. **Chave de acesso NFE deve ter 44 caracteres numéricos**
8. **URLs NFE devem ser válidas (http:// ou https://)**
9. **Valor total deve ser consistente com quantidade × preço - desconto**
10. **Desconto não pode ser maior que valor total**
11. **Motorista deve pertencer à mesma prefeitura do veículo (se informado)**
12. **Cota deve estar ativa (se tipo COM_COTA)**

### Validações ao Criar Abastecimento a partir de Solicitação

1. **Solicitação deve existir e estar ativa**
2. **Solicitação deve ter status PENDENTE ou APROVADA**
3. **Solicitação não pode estar expirada ou rejeitada**
4. **Solicitação não pode já ter abastecimento vinculado**
5. **Empresa da solicitação deve corresponder à empresa do usuário**
6. **Empresa deve estar ativa**

---

## 🧪 Exemplos Práticos

### Cenário 1: Fluxo Completo com Cota

#### 1. Verificar Tipo de Abastecimento do Veículo
```bash
GET /solicitacoes/veiculo/10/tipo-abastecimento
Authorization: Bearer <token_admin_prefeitura>
```

#### 2. Verificar Cotas Disponíveis
```bash
GET /solicitacoes/orgao/5/cotas
Authorization: Bearer <token_admin_prefeitura>
```

#### 3. Criar Solicitação
```bash
POST /solicitacoes
Authorization: Bearer <token_admin_prefeitura>
Content-Type: application/json

{
  "prefeituraId": 1,
  "veiculoId": 10,
  "combustivelId": 2,
  "empresaId": 3,
  "quantidade": 50.5,
  "data_solicitacao": "2025-01-15T10:00:00Z",
  "data_expiracao": "2025-01-20T10:00:00Z",
  "tipo_abastecimento": "COM_COTA",
  "observacoes": "Abastecimento semanal"
}
```

#### 4. Criar Abastecimento
```bash
POST /abastecimentos/from-solicitacao
Authorization: Bearer <token_admin_empresa>
Content-Type: application/json

{
  "solicitacaoId": 1,
  "data_abastecimento": "2025-01-16T14:30:00Z",
  "odometro": 50000,
  "preco_anp": 5.50,
  "nfe_chave_acesso": "12345678901234567890123456789012345678901234",
  "nfe_link": "https://nfe.exemplo.com/123456"
}
```

### Cenário 2: Abastecimento Livre (sem Cota)

#### 1. Criar Solicitação
```bash
POST /solicitacoes
Authorization: Bearer <token_admin_prefeitura>
Content-Type: application/json

{
  "prefeituraId": 1,
  "veiculoId": 10,
  "combustivelId": 2,
  "empresaId": 3,
  "quantidade": 30.0,
  "data_solicitacao": "2025-01-15T10:00:00Z",
  "data_expiracao": "2025-01-20T10:00:00Z",
  "tipo_abastecimento": "LIVRE"
}
```

#### 2. Criar Abastecimento
```bash
POST /abastecimentos/from-solicitacao
Authorization: Bearer <token_admin_empresa>
Content-Type: application/json

{
  "solicitacaoId": 2,
  "data_abastecimento": "2025-01-16T14:30:00Z",
  "odometro": 50100,
  "preco_anp": 5.50,
  "desconto": 2.50,
  "nfe_link": "https://nfe.exemplo.com/123457"
}
```

### Cenário 3: Abastecimento Direto (sem Solicitação)

```bash
POST /abastecimentos
Authorization: Bearer <token_admin_empresa>
Content-Type: application/json

{
  "veiculoId": 10,
  "combustivelId": 2,
  "empresaId": 3,
  "tipo_abastecimento": "LIVRE",
  "quantidade": 40.0,
  "valor_total": 218.0,
  "preco_empresa": 5.45,
  "preco_anp": 5.50,
  "data_abastecimento": "2025-01-16T14:30:00Z",
  "odometro": 50200,
  "nfe_chave_acesso": "12345678901234567890123456789012345678901234",
  "nfe_link": "https://nfe.exemplo.com/123458",
  "abastecido_por": "João Silva"
}
```

---

## 📊 Checklist de Testes

### Solicitação de Abastecimento

- [ ] Criar solicitação com dados válidos
- [ ] Criar solicitação com veículo inexistente (erro 404)
- [ ] Criar solicitação com combustível não vinculado (erro 400)
- [ ] Criar solicitação com empresa não credenciada (erro 400)
- [ ] Criar solicitação com quantidade excedendo cota (erro 400)
- [ ] Criar solicitação com data de expiração inválida (erro 400)
- [ ] Listar solicitações com filtros
- [ ] Buscar solicitação por ID
- [ ] Atualizar solicitação
- [ ] Excluir solicitação
- [ ] Listar veículos da prefeitura
- [ ] Obter tipo de abastecimento do veículo
- [ ] Listar empresas credenciadas
- [ ] Listar combustíveis da empresa
- [ ] Listar cotas do órgão

### Abastecimento

- [ ] Criar abastecimento com dados válidos
- [ ] Criar abastecimento com usuário sem empresa (erro 400)
- [ ] Criar abastecimento com empresa diferente (erro 400)
- [ ] Criar abastecimento com veículo inativo (erro 400)
- [ ] Criar abastecimento com quantidade excedendo capacidade (erro 400)
- [ ] Criar abastecimento com data futura (erro 400)
- [ ] Criar abastecimento com chave NFE inválida (erro 400)
- [ ] Criar abastecimento com valor total inconsistente (erro 400)
- [ ] Listar abastecimentos com filtros
- [ ] Buscar abastecimento por ID
- [ ] Atualizar abastecimento
- [ ] Excluir abastecimento
- [ ] Aprovar abastecimento
- [ ] Rejeitar abastecimento com motivo
- [ ] Tentar aprovar abastecimento já aprovado (erro 400)

### Criar Abastecimento a partir de Solicitação

- [ ] Criar abastecimento com solicitação PENDENTE (deve aprovar automaticamente)
- [ ] Criar abastecimento com solicitação APROVADA
- [ ] Criar abastecimento com solicitação inexistente (erro 404)
- [ ] Criar abastecimento com solicitação expirada (erro 400)
- [ ] Criar abastecimento com solicitação rejeitada (erro 400)
- [ ] Criar abastecimento com solicitação já efetivada (erro 400)
- [ ] Criar abastecimento com empresa diferente (erro 400)
- [ ] Verificar que solicitação foi marcada como EFETIVADA
- [ ] Verificar que abastecimento_id foi vinculado à solicitação

---

## 🔍 Dicas de Debug

### 1. Verificar Status da Solicitação
```bash
GET /solicitacoes/1
Authorization: Bearer <token>
```

### 2. Verificar Abastecimento Criado
```bash
GET /abastecimentos/1
Authorization: Bearer <token>
```

### 3. Verificar Logs de Erro
Os erros retornam informações detalhadas no campo `details`:
```json
{
  "message": "Erro descritivo",
  "error": "CÓDIGO_ERRO",
  "statusCode": 400,
  "details": {
    "module": "Abastecimentos",
    "action": "CREATE",
    "route": "/abastecimentos",
    "method": "POST",
    "expected": "Informar dados completos e válidos",
    "performed": "Tentativa de cadastrar abastecimento",
    "user": {
      "id": 1,
      "tipo": "ADMIN_EMPRESA",
      "email": "admin@empresa.com"
    },
    "additionalInfo": {
      "suggestion": "Verifique se o veículo está ativo"
    }
  }
}
```

### 4. Verificar Dados no Banco

**Verificar veículo:**
```sql
SELECT * FROM veiculo WHERE id = 10;
```

**Verificar combustível vinculado:**
```sql
SELECT * FROM veiculo_combustivel WHERE veiculoId = 10 AND combustivelId = 2;
```

**Verificar empresa credenciada:**
```sql
SELECT * FROM empresa_preco_combustivel 
WHERE empresaId = 3 AND combustivelId = 2 AND status = 'ACTIVE';
```

**Verificar cota:**
```sql
SELECT * FROM cota_orgao 
WHERE orgaoId = 5 AND combustivelId = 2 AND ativa = true;
```

---

## 📚 Referências

- **Status de Solicitação:** `PENDENTE`, `APROVADA`, `REJEITADA`, `EXPIRADA`, `EFETIVADA`
- **Status de Abastecimento:** `Aguardando`, `Aprovado`, `Rejeitado`, `Cancelado`
- **Tipo de Abastecimento:** `COM_COTA`, `LIVRE`, `COM_AUTORIZACAO`
- **Perfis de Usuário:** `ADMIN_PREFEITURA`, `ADMIN_EMPRESA`, `COLABORADOR_EMPRESA`

---

## 🆘 Suporte

Em caso de dúvidas ou problemas, verifique:
1. Logs do servidor
2. Mensagens de erro detalhadas nas respostas
3. Validações dos DTOs
4. Status dos registros no banco de dados
5. Permissões do usuário logado

---

**Última atualização:** Janeiro 2025


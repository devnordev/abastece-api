# Documentação - Solicitações QR Code Veículo

## Visão Geral

O módulo de **Solicitações QR Code Veículo** permite gerenciar solicitações de QR codes para veículos da frota municipal. Este módulo oferece funcionalidades para listar, buscar e atualizar o status das solicitações de QR code.

### Status Disponíveis

As solicitações podem ter os seguintes status:

- `Solicitado` - Solicitação inicial criada
- `Aprovado` - Solicitação aprovada (gera código QR code automaticamente)
- `Em_Producao` - QR code em produção
- `Integracao` - QR code em integração
- `Concluida` - Solicitação concluída
- `Inativo` - Status momentâneo (temporário)
- `Cancelado` - Solicitação cancelada (requer motivo)

### Autenticação e Autorização

Todas as rotas requerem:
- **Autenticação**: Token JWT no header `Authorization: Bearer <token>`
- **Autorização**: Apenas usuários com perfil `SUPER_ADMIN`, `ADMIN_EMPRESA` ou `COLABORADOR_EMPRESA` podem acessar as rotas

---

## Rotas Disponíveis

### 1. Listar Solicitações Agrupadas por Prefeitura

Retorna todas as solicitações de QR code agrupadas por prefeitura, com suporte a filtros e paginação.

#### Método HTTP
```
GET
```

#### URL
```
/solicitacoes-qrcode-veiculo
```

#### Query Parameters (Opcionais)

| Parâmetro | Tipo | Descrição | Exemplo |
|-----------|------|-----------|---------|
| `prefeituraId` | number | ID da prefeitura para filtrar | `1` |
| `status` | string | Status da solicitação para filtrar | `Aprovado` |
| `page` | number | Número da página (padrão: 1) | `1` |
| `limit` | number | Limite de itens por página (padrão: 10) | `10` |

**Valores possíveis para `status`:**
- `Solicitado`
- `Aprovado`
- `Em_Producao`
- `Integracao`
- `Concluida`
- `Inativo`
- `Cancelado`

#### Body
Não requer body.

#### Exemplo de Requisição
```http
GET /solicitacoes-qrcode-veiculo?prefeituraId=1&status=Aprovado&page=1&limit=10
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

#### Resposta de Sucesso (200 OK)
```json
{
  "message": "Solicitações encontradas com sucesso",
  "grupos": [
    {
      "prefeitura": {
        "id": 1,
        "nome": "Prefeitura Municipal de São Paulo",
        "cnpj": "12.345.678/0001-90"
      },
      "solicitacoes": [
        {
          "id": 1,
          "idVeiculo": 5,
          "data_cadastro": "2024-01-15T10:30:00.000Z",
          "status": "Aprovado",
          "data_cancelamento": null,
          "motivo_cancelamento": null,
          "cancelamento_solicitado_por": null,
          "cancelamento_efetuado_por": null,
          "prefeitura_id": 1,
          "foto": null,
          "codigo_qrcode": "3NGBWONY",
          "veiculo": {
            "id": 5,
            "nome": "Ambulância 01",
            "placa": "ABC-1234",
            "modelo": "Mercedes Sprinter",
            "tipo_veiculo": "AMBULANCIA",
            "orgao": {
              "id": 2,
              "nome": "Secretaria de Saúde",
              "sigla": "SMS"
            }
          },
          "prefeitura": {
            "id": 1,
            "nome": "Prefeitura Municipal de São Paulo",
            "cnpj": "12.345.678/0001-90"
          }
        }
      ]
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 25,
    "totalPages": 3
  }
}
```

#### Possíveis Erros

- **401 Unauthorized**: Token JWT ausente ou inválido
```json
{
  "statusCode": 401,
  "message": "Unauthorized"
}
```

- **403 Forbidden**: Usuário não possui permissão
```json
{
  "statusCode": 403,
  "message": "Apenas usuários com perfil SUPER_ADMIN, ADMIN_EMPRESA ou COLABORADOR_EMPRESA têm acesso a este recurso"
}
```

---

### 2. Buscar Solicitação por ID ou Código QR Code

Busca uma solicitação específica por ID numérico ou código QR code (string de 8 caracteres).

#### Método HTTP
```
GET
```

#### URL
```
/solicitacoes-qrcode-veiculo/:idOrCode
```

#### Parâmetros de Rota

| Parâmetro | Tipo | Descrição | Exemplo |
|-----------|------|-----------|---------|
| `idOrCode` | string/number | ID numérico da solicitação (ex: `1`) ou código QR code (ex: `3NGBWONY`) | `3NGBWONY` |

**Nota**: O sistema detecta automaticamente se o parâmetro é um ID numérico (apenas dígitos) ou um código QR code (contém letras e/ou números).

#### Body
Não requer body.

#### Exemplo de Requisição (por ID)
```http
GET /solicitacoes-qrcode-veiculo/1
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

#### Exemplo de Requisição (por Código QR Code)
```http
GET /solicitacoes-qrcode-veiculo/3NGBWONY
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

#### Resposta de Sucesso (200 OK)
```json
{
  "message": "Solicitação encontrada com sucesso",
  "solicitacao": {
    "id": 1,
    "idVeiculo": 5,
    "data_cadastro": "2024-01-15T10:30:00.000Z",
    "status": "Aprovado",
    "data_cancelamento": null,
    "motivo_cancelamento": null,
    "cancelamento_solicitado_por": null,
    "cancelamento_efetuado_por": null,
    "prefeitura_id": 1,
    "foto": null,
    "codigo_qrcode": "3NGBWONY",
    "veiculo": {
      "id": 5,
      "nome": "Ambulância 01",
      "placa": "ABC-1234",
      "modelo": "Mercedes Sprinter",
      "tipo_veiculo": "AMBULANCIA",
      "orgao": {
        "id": 2,
        "nome": "Secretaria de Saúde",
        "sigla": "SMS"
      }
    },
    "prefeitura": {
      "id": 1,
      "nome": "Prefeitura Municipal de São Paulo",
      "cnpj": "12.345.678/0001-90"
    }
  }
}
```

#### Possíveis Erros

- **404 Not Found**: Solicitação não encontrada
```json
{
  "statusCode": 404,
  "message": "Solicitação com código QR code 3NGBWONY não encontrada"
}
```

- **401 Unauthorized**: Token JWT ausente ou inválido
- **403 Forbidden**: Usuário não possui permissão

---

### 3. Atualizar Status para Aprovado

Atualiza o status da solicitação para `Aprovado`. Quando o status é atualizado para `Aprovado` e a solicitação ainda não possui código QR code, o sistema gera automaticamente um código único de 8 caracteres.

#### Método HTTP
```
PATCH
```

#### URL
```
/solicitacoes-qrcode-veiculo/:id/status/aprovado
```

#### Parâmetros de Rota

| Parâmetro | Tipo | Descrição | Exemplo |
|-----------|------|-----------|---------|
| `id` | number | ID numérico da solicitação | `1` |

#### Body
Não requer body.

#### Exemplo de Requisição
```http
PATCH /solicitacoes-qrcode-veiculo/1/status/aprovado
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

#### Resposta de Sucesso (200 OK)
```json
{
  "message": "Status atualizado para Aprovado com sucesso",
  "solicitacao": {
    "id": 1,
    "idVeiculo": 5,
    "data_cadastro": "2024-01-15T10:30:00.000Z",
    "status": "Aprovado",
    "codigo_qrcode": "3NGBWONY",
    "prefeitura_id": 1,
    "veiculo": {
      "id": 5,
      "nome": "Ambulância 01",
      "placa": "ABC-1234"
    },
    "prefeitura": {
      "id": 1,
      "nome": "Prefeitura Municipal de São Paulo"
    }
  }
}
```

#### Possíveis Erros

- **400 Bad Request**: Transição de status inválida
```json
{
  "statusCode": 400,
  "message": "Transição de status inválida: não é possível mudar de Concluida para Aprovado"
}
```

- **404 Not Found**: Solicitação não encontrada
```json
{
  "statusCode": 404,
  "message": "Solicitação com ID 1 não encontrada"
}
```

#### Fluxo de Transição de Status Válido

Para atualizar para `Aprovado`, a solicitação deve estar em um dos seguintes status:
- `Solicitado` → `Aprovado`
- `Inativo` → `Aprovado`

---

### 4. Atualizar Status para Em Produção

Atualiza o status da solicitação para `Em_Producao`.

#### Método HTTP
```
PATCH
```

#### URL
```
/solicitacoes-qrcode-veiculo/:id/status/em-producao
```

#### Parâmetros de Rota

| Parâmetro | Tipo | Descrição | Exemplo |
|-----------|------|-----------|---------|
| `id` | number | ID numérico da solicitação | `1` |

#### Body
Não requer body.

#### Exemplo de Requisição
```http
PATCH /solicitacoes-qrcode-veiculo/1/status/em-producao
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

#### Resposta de Sucesso (200 OK)
```json
{
  "message": "Status atualizado para Em Produção com sucesso",
  "solicitacao": {
    "id": 1,
    "idVeiculo": 5,
    "data_cadastro": "2024-01-15T10:30:00.000Z",
    "status": "Em_Producao",
    "codigo_qrcode": "3NGBWONY",
    "prefeitura_id": 1,
    "veiculo": {
      "id": 5,
      "nome": "Ambulância 01",
      "placa": "ABC-1234"
    },
    "prefeitura": {
      "id": 1,
      "nome": "Prefeitura Municipal de São Paulo"
    }
  }
}
```

#### Fluxo de Transição de Status Válido

Para atualizar para `Em_Producao`, a solicitação deve estar em um dos seguintes status:
- `Aprovado` → `Em_Producao`
- `Inativo` → `Em_Producao`

---

### 5. Atualizar Status para Integração

Atualiza o status da solicitação para `Integracao`.

#### Método HTTP
```
PATCH
```

#### URL
```
/solicitacoes-qrcode-veiculo/:id/status/integracao
```

#### Parâmetros de Rota

| Parâmetro | Tipo | Descrição | Exemplo |
|-----------|------|-----------|---------|
| `id` | number | ID numérico da solicitação | `1` |

#### Body
Não requer body.

#### Exemplo de Requisição
```http
PATCH /solicitacoes-qrcode-veiculo/1/status/integracao
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

#### Resposta de Sucesso (200 OK)
```json
{
  "message": "Status atualizado para Integração com sucesso",
  "solicitacao": {
    "id": 1,
    "idVeiculo": 5,
    "data_cadastro": "2024-01-15T10:30:00.000Z",
    "status": "Integracao",
    "codigo_qrcode": "3NGBWONY",
    "prefeitura_id": 1,
    "veiculo": {
      "id": 5,
      "nome": "Ambulância 01",
      "placa": "ABC-1234"
    },
    "prefeitura": {
      "id": 1,
      "nome": "Prefeitura Municipal de São Paulo"
    }
  }
}
```

#### Fluxo de Transição de Status Válido

Para atualizar para `Integracao`, a solicitação deve estar em um dos seguintes status:
- `Em_Producao` → `Integracao`
- `Inativo` → `Integracao`

---

### 6. Atualizar Status para Concluída

Atualiza o status da solicitação para `Concluida`.

#### Método HTTP
```
PATCH
```

#### URL
```
/solicitacoes-qrcode-veiculo/:id/status/concluida
```

#### Parâmetros de Rota

| Parâmetro | Tipo | Descrição | Exemplo |
|-----------|------|-----------|---------|
| `id` | number | ID numérico da solicitação | `1` |

#### Body
Não requer body.

#### Exemplo de Requisição
```http
PATCH /solicitacoes-qrcode-veiculo/1/status/concluida
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

#### Resposta de Sucesso (200 OK)
```json
{
  "message": "Status atualizado para Concluída com sucesso",
  "solicitacao": {
    "id": 1,
    "idVeiculo": 5,
    "data_cadastro": "2024-01-15T10:30:00.000Z",
    "status": "Concluida",
    "codigo_qrcode": "3NGBWONY",
    "prefeitura_id": 1,
    "veiculo": {
      "id": 5,
      "nome": "Ambulância 01",
      "placa": "ABC-1234"
    },
    "prefeitura": {
      "id": 1,
      "nome": "Prefeitura Municipal de São Paulo"
    }
  }
}
```

#### Fluxo de Transição de Status Válido

Para atualizar para `Concluida`, a solicitação deve estar em um dos seguintes status:
- `Integracao` → `Concluida`
- `Inativo` → `Concluida`

---

### 7. Atualizar Status para Cancelado

Atualiza o status da solicitação para `Cancelado`. **É obrigatório informar o motivo do cancelamento no body da requisição.**

#### Método HTTP
```
PATCH
```

#### URL
```
/solicitacoes-qrcode-veiculo/:id/status/cancelado
```

#### Parâmetros de Rota

| Parâmetro | Tipo | Descrição | Exemplo |
|-----------|------|-----------|---------|
| `id` | number | ID numérico da solicitação | `1` |

#### Body (Obrigatório)

```json
{
  "status": "Cancelado",
  "motivoCancelamento": "Solicitação cancelada pelo usuário"
}
```

**Campos:**
- `status` (string, obrigatório): Deve ser exatamente `"Cancelado"`
- `motivoCancelamento` (string, obrigatório): Motivo do cancelamento

#### Exemplo de Requisição
```http
PATCH /solicitacoes-qrcode-veiculo/1/status/cancelado
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json

{
  "status": "Cancelado",
  "motivoCancelamento": "Veículo foi desativado da frota"
}
```

#### Resposta de Sucesso (200 OK)
```json
{
  "message": "Status atualizado para Cancelado com sucesso",
  "solicitacao": {
    "id": 1,
    "idVeiculo": 5,
    "data_cadastro": "2024-01-15T10:30:00.000Z",
    "status": "Cancelado",
    "data_cancelamento": "2024-01-20T14:30:00.000Z",
    "motivo_cancelamento": "Veículo foi desativado da frota",
    "cancelamento_efetuado_por": "João Silva",
    "codigo_qrcode": "3NGBWONY",
    "prefeitura_id": 1,
    "veiculo": {
      "id": 5,
      "nome": "Ambulância 01",
      "placa": "ABC-1234"
    },
    "prefeitura": {
      "id": 1,
      "nome": "Prefeitura Municipal de São Paulo"
    }
  }
}
```

#### Possíveis Erros

- **400 Bad Request**: Motivo do cancelamento não informado
```json
{
  "statusCode": 400,
  "message": "Motivo do cancelamento é obrigatório quando o status é Cancelado"
}
```

- **400 Bad Request**: Status incorreto no body
```json
{
  "statusCode": 400,
  "message": "Esta rota é apenas para cancelar solicitações. Use status: Cancelado"
}
```

#### Fluxo de Transição de Status Válido

Para atualizar para `Cancelado`, a solicitação pode estar em qualquer status, exceto:
- `Cancelado` (já cancelada)

**Nota**: Quando uma solicitação é cancelada, o sistema registra:
- `data_cancelamento`: Data e hora do cancelamento
- `motivo_cancelamento`: Motivo informado
- `cancelamento_efetuado_por`: Nome do usuário que efetuou o cancelamento

---

### 8. Atualizar Status para Inativo

Atualiza o status da solicitação para `Inativo` (status momentâneo/temporário).

#### Método HTTP
```
PATCH
```

#### URL
```
/solicitacoes-qrcode-veiculo/:id/status/inativo
```

#### Parâmetros de Rota

| Parâmetro | Tipo | Descrição | Exemplo |
|-----------|------|-----------|---------|
| `id` | number | ID numérico da solicitação | `1` |

#### Body
Não requer body.

#### Exemplo de Requisição
```http
PATCH /solicitacoes-qrcode-veiculo/1/status/inativo
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

#### Resposta de Sucesso (200 OK)
```json
{
  "message": "Status atualizado para Inativo com sucesso",
  "solicitacao": {
    "id": 1,
    "idVeiculo": 5,
    "data_cadastro": "2024-01-15T10:30:00.000Z",
    "status": "Inativo",
    "codigo_qrcode": "3NGBWONY",
    "prefeitura_id": 1,
    "veiculo": {
      "id": 5,
      "nome": "Ambulância 01",
      "placa": "ABC-1234"
    },
    "prefeitura": {
      "id": 1,
      "nome": "Prefeitura Municipal de São Paulo"
    }
  }
}
```

#### Fluxo de Transição de Status Válido

O status `Inativo` pode ser definido a partir de qualquer status (exceto `Cancelado`). A partir de `Inativo`, é possível transicionar para:
- `Inativo` → `Aprovado`
- `Inativo` → `Em_Producao`
- `Inativo` → `Integracao`
- `Inativo` → `Concluida`

---

## Diagrama de Fluxo de Status

```
Solicitado
    ↓
Aprovado (gera código QR code automaticamente)
    ↓
Em_Producao
    ↓
Integracao
    ↓
Concluida

Qualquer status (exceto Cancelado) → Inativo → Pode voltar para qualquer status válido
Qualquer status → Cancelado (com motivo obrigatório)
```

---

## Regras de Negócio

### 1. Geração Automática de Código QR Code
- Quando uma solicitação é aprovada (`Aprovado`) e ainda não possui código QR code, o sistema gera automaticamente um código único de 8 caracteres.
- O código é verificado para garantir unicidade nas tabelas `solicitacoes_qrcode_veiculo` e `qr_code_motorista`.

### 2. Transições de Status
- As transições de status são validadas pelo sistema.
- Apenas transições válidas são permitidas (consulte o diagrama acima).
- Tentativas de transições inválidas retornam erro `400 Bad Request`.

### 3. Cancelamento
- O cancelamento requer obrigatoriamente um motivo.
- A data de cancelamento é registrada automaticamente.
- O usuário que efetuou o cancelamento é registrado.

### 4. Busca por ID ou Código QR Code
- A rota `GET /solicitacoes-qrcode-veiculo/:idOrCode` aceita tanto ID numérico quanto código QR code.
- O sistema detecta automaticamente o tipo do parâmetro:
  - Se contiver apenas dígitos → busca por ID
  - Caso contrário → busca por código QR code

---

## Exemplos de Uso Completos

### Exemplo 1: Listar todas as solicitações aprovadas da prefeitura 1
```http
GET /solicitacoes-qrcode-veiculo?prefeituraId=1&status=Aprovado&page=1&limit=10
Authorization: Bearer <seu_token>
```

### Exemplo 2: Buscar uma solicitação pelo código QR code
```http
GET /solicitacoes-qrcode-veiculo/3NGBWONY
Authorization: Bearer <seu_token>
```

### Exemplo 3: Aprovar uma solicitação
```http
PATCH /solicitacoes-qrcode-veiculo/1/status/aprovado
Authorization: Bearer <seu_token>
```

### Exemplo 4: Cancelar uma solicitação
```http
PATCH /solicitacoes-qrcode-veiculo/1/status/cancelado
Authorization: Bearer <seu_token>
Content-Type: application/json

{
  "status": "Cancelado",
  "motivoCancelamento": "Veículo desativado da frota municipal"
}
```

---

## Notas Importantes

1. **Autenticação Obrigatória**: Todas as rotas requerem token JWT válido no header `Authorization`.

2. **Autorização**: Apenas usuários com perfil `SUPER_ADMIN`, `ADMIN_EMPRESA` ou `COLABORADOR_EMPRESA` podem acessar as rotas.

3. **Código QR Code**: O código QR code é gerado automaticamente quando a solicitação é aprovada pela primeira vez.

4. **Status Cancelado**: Uma vez cancelada, a solicitação não pode ser modificada para outro status.

5. **Status Inativo**: Status temporário que permite pausar uma solicitação e depois retomá-la em qualquer estágio válido.

---

## Suporte

Para dúvidas ou problemas, entre em contato com a equipe de desenvolvimento.


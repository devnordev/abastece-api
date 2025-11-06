# 📅 Guia - Semana ANP: Cadastro e Ativação

## 📋 Índice
- [Visão Geral](#visão-geral)
- [Requisitos de Acesso](#requisitos-de-acesso)
- [Cadastro de Nova Semana ANP](#cadastro-de-nova-semana-anp)
- [Ativação de Semana ANP](#ativação-de-semana-anp)
- [Exemplos de Requisições](#exemplos-de-requisições)
- [Respostas da API](#respostas-da-api)
- [Comportamento do Sistema](#comportamento-do-sistema)

---

## 🔍 Visão Geral

O sistema de Semana ANP permite gerenciar semanas de referência para preços de combustíveis. Todas as semanas são cadastradas como **inativas** por padrão, e apenas uma semana pode estar **ativa** por vez.

### Características Principais:
- ✅ Novas semanas são sempre criadas com `ativo = false`
- ✅ Apenas uma semana pode estar ativa por vez
- ✅ Ao ativar uma semana, todas as outras são automaticamente desativadas
- ✅ Apenas usuários com perfil **SUPER_ADMIN** podem gerenciar semanas

---

## 🔐 Requisitos de Acesso

### Perfil Necessário
- **Tipo de Usuário**: `SUPER_ADMIN`
- **Autenticação**: JWT Bearer Token obrigatório

### Headers Obrigatórios
```http
Authorization: Bearer {seu_access_token}
Content-Type: application/json
```

---

## 📝 Cadastro de Nova Semana ANP

### Rota
```http
POST /anp-semana
```

### Descrição
Cria uma nova semana ANP. **Importante**: A semana será sempre criada com `ativo = false`, independentemente do valor enviado no JSON.

### Parâmetros do Body (JSON)

| Campo | Tipo | Obrigatório | Descrição | Exemplo |
|-------|------|-------------|-----------|---------|
| `semana_ref` | string (date) | ✅ Sim | Data de referência da semana (formato: YYYY-MM-DD) | `"2024-01-15"` |
| `publicada_em` | string (date) | ❌ Não | Data de publicação (formato: YYYY-MM-DD ou ISO 8601) | `"2024-01-15T10:00:00.000Z"` |
| `observacoes` | string | ❌ Não | Observações adicionais sobre a semana | `"Semana de referência para janeiro"` |
| `importado_em` | string (date) | ❌ Não | Data de importação (formato: YYYY-MM-DD ou ISO 8601) | `"2024-01-15T10:00:00.000Z"` |
| `ativo` | boolean | ❌ Não | **Ignorado** - sempre será `false` no cadastro | `true` ou `false` |

### Exemplo de Requisição

```http
POST http://localhost:3000/anp-semana
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json

{
  "semana_ref": "2024-01-15",
  "publicada_em": "2024-01-15T10:00:00.000Z",
  "observacoes": "Semana de referência para janeiro de 2024",
  "importado_em": "2024-01-15T10:00:00.000Z"
}
```

### Exemplo Mínimo (apenas campos obrigatórios)

```http
POST http://localhost:3000/anp-semana
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json

{
  "semana_ref": "2024-01-15"
}
```

### Resposta de Sucesso (201 Created)

```json
{
  "message": "Semana ANP criada com sucesso",
  "anpSemana": {
    "id": 1,
    "semana_ref": "2024-01-15T00:00:00.000Z",
    "publicada_em": "2024-01-15T10:00:00.000Z",
    "ativo": false,
    "observacoes": "Semana de referência para janeiro de 2024",
    "importado_em": "2024-01-15T10:00:00.000Z",
    "_count": {
      "precos": 0
    }
  }
}
```

**⚠️ Observação**: Mesmo que você envie `"ativo": true` no JSON, a semana será criada com `"ativo": false`.

---

## ✅ Ativação de Semana ANP

### Rota
```http
PATCH /anp-semana/:id/activate
```

### Descrição
Ativa uma semana ANP específica. Ao ativar uma semana:
- A semana informada é definida como `ativo = true`
- **Todas as outras semanas** são automaticamente definidas como `ativo = false`
- Garante que apenas uma semana esteja ativa por vez

### Parâmetros da URL

| Parâmetro | Tipo | Obrigatório | Descrição |
|-----------|------|-------------|-----------|
| `id` | number | ✅ Sim | ID da semana ANP a ser ativada |

### Exemplo de Requisição

```http
PATCH http://localhost:3000/anp-semana/1/activate
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Nota**: Esta rota não requer body JSON, apenas o ID na URL.

### Resposta de Sucesso (200 OK)

```json
{
  "message": "Semana ANP ativada com sucesso. As outras semanas foram desativadas.",
  "anpSemana": {
    "id": 1,
    "semana_ref": "2024-01-15T00:00:00.000Z",
    "publicada_em": "2024-01-15T10:00:00.000Z",
    "ativo": true,
    "observacoes": "Semana de referência para janeiro de 2024",
    "importado_em": "2024-01-15T10:00:00.000Z",
    "_count": {
      "precos": 0
    }
  }
}
```

### Resposta de Erro (404 Not Found)

```json
{
  "statusCode": 404,
  "message": "Semana ANP não encontrada. Verifique se o ID informado está correto.",
  "error": "Not Found"
}
```

---

## 📡 Exemplos de Requisições

### Exemplo 1: Fluxo Completo - Cadastrar e Ativar

#### Passo 1: Cadastrar Nova Semana
```http
POST http://localhost:3000/anp-semana
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json

{
  "semana_ref": "2024-02-05",
  "publicada_em": "2024-02-05T08:00:00.000Z",
  "observacoes": "Segunda semana de fevereiro"
}
```

**Resposta:**
```json
{
  "message": "Semana ANP criada com sucesso",
  "anpSemana": {
    "id": 2,
    "semana_ref": "2024-02-05T00:00:00.000Z",
    "publicada_em": "2024-02-05T08:00:00.000Z",
    "ativo": false,
    "observacoes": "Segunda semana de fevereiro",
    "importado_em": null,
    "_count": {
      "precos": 0
    }
  }
}
```

#### Passo 2: Ativar a Semana
```http
PATCH http://localhost:3000/anp-semana/2/activate
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Resposta:**
```json
{
  "message": "Semana ANP ativada com sucesso. As outras semanas foram desativadas.",
  "anpSemana": {
    "id": 2,
    "semana_ref": "2024-02-05T00:00:00.000Z",
    "publicada_em": "2024-02-05T08:00:00.000Z",
    "ativo": true,
    "observacoes": "Segunda semana de fevereiro",
    "importado_em": null,
    "_count": {
      "precos": 0
    }
  }
}
```

### Exemplo 2: Usando cURL

#### Cadastrar Semana
```bash
curl -X POST http://localhost:3000/anp-semana \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -H "Content-Type: application/json" \
  -d '{
    "semana_ref": "2024-03-10",
    "publicada_em": "2024-03-10T09:00:00.000Z",
    "observacoes": "Semana de março"
  }'
```

#### Ativar Semana
```bash
curl -X PATCH http://localhost:3000/anp-semana/3/activate \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

### Exemplo 3: Usando JavaScript (Fetch API)

```javascript
// Cadastrar nova semana
async function criarSemana() {
  const response = await fetch('http://localhost:3000/anp-semana', {
    method: 'POST',
    headers: {
      'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      semana_ref: '2024-04-15',
      publicada_em: '2024-04-15T10:00:00.000Z',
      observacoes: 'Semana de abril'
    })
  });
  
  const data = await response.json();
  console.log('Semana criada:', data);
  return data.anpSemana.id;
}

// Ativar semana
async function ativarSemana(id) {
  const response = await fetch(`http://localhost:3000/anp-semana/${id}/activate`, {
    method: 'PATCH',
    headers: {
      'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
    }
  });
  
  const data = await response.json();
  console.log('Semana ativada:', data);
}

// Uso
const semanaId = await criarSemana();
await ativarSemana(semanaId);
```

---

## 📤 Respostas da API

### Códigos de Status HTTP

| Código | Significado | Quando Ocorre |
|--------|-------------|---------------|
| `201` | Created | Semana criada com sucesso |
| `200` | OK | Semana ativada ou atualizada com sucesso |
| `400` | Bad Request | Dados inválidos (ex: data inválida) |
| `401` | Unauthorized | Token JWT ausente ou inválido |
| `403` | Forbidden | Usuário não tem perfil SUPER_ADMIN |
| `404` | Not Found | Semana não encontrada |

### Exemplos de Erros

#### Erro 400 - Data Inválida
```json
{
  "statusCode": 400,
  "message": "A data de referência da semana informada é inválida. Use o formato YYYY-MM-DD.",
  "error": "Bad Request"
}
```

#### Erro 401 - Não Autorizado
```json
{
  "statusCode": 401,
  "message": "Unauthorized"
}
```

#### Erro 403 - Acesso Negado
```json
{
  "statusCode": 403,
  "message": "Acesso negado - apenas SUPER_ADMIN"
}
```

#### Erro 404 - Semana Não Encontrada
```json
{
  "statusCode": 404,
  "message": "Semana ANP não encontrada. Verifique se o ID informado está correto.",
  "error": "Not Found"
}
```

---

## ⚙️ Comportamento do Sistema

### Regras de Negócio

1. **Cadastro Sempre Inativo**
   - Todas as semanas são criadas com `ativo = false`
   - O valor do campo `ativo` no JSON de cadastro é **ignorado**

2. **Apenas Uma Semana Ativa**
   - Quando uma semana é ativada, todas as outras são automaticamente desativadas
   - Não é possível ter múltiplas semanas ativas simultaneamente

3. **Validações**
   - Data de referência (`semana_ref`) é obrigatória e deve estar no formato `YYYY-MM-DD`
   - Datas opcionais (`publicada_em`, `importado_em`) devem estar no formato `YYYY-MM-DD` ou ISO 8601

### Fluxo Recomendado

```
1. Cadastrar Nova Semana
   └─> Semana criada com ativo = false

2. Verificar/Importar Preços (se necessário)
   └─> Associar preços à semana

3. Ativar Semana
   └─> Semana definida como ativa
   └─> Outras semanas desativadas automaticamente
```

---

## 🔗 Rotas Relacionadas

### Listar Todas as Semanas
```http
GET /anp-semana
```

### Buscar Semana por ID
```http
GET /anp-semana/:id
```

### Atualizar Semana
```http
PATCH /anp-semana/:id
```

### Excluir Semana
```http
DELETE /anp-semana/:id
```

---

## 📝 Notas Importantes

1. **Autenticação**: Todas as rotas requerem autenticação JWT válida
2. **Permissões**: Apenas usuários com perfil `SUPER_ADMIN` podem acessar essas rotas
3. **Formato de Data**: Use sempre o formato `YYYY-MM-DD` para `semana_ref`
4. **Status Ativo**: O campo `ativo` no cadastro é ignorado - sempre será `false`
5. **Ativação Automática**: Ao ativar uma semana, as outras são desativadas automaticamente

---

## 🆘 Solução de Problemas

### Problema: "Semana ANP não encontrada"
- **Causa**: ID informado não existe no banco de dados
- **Solução**: Verifique se o ID está correto usando `GET /anp-semana/:id`

### Problema: "Acesso negado - apenas SUPER_ADMIN"
- **Causa**: Usuário não tem perfil SUPER_ADMIN
- **Solução**: Use uma conta com perfil SUPER_ADMIN ou solicite acesso ao administrador

### Problema: "Data inválida"
- **Causa**: Formato de data incorreto
- **Solução**: Use o formato `YYYY-MM-DD` (ex: `2024-01-15`)

### Problema: Token expirado
- **Causa**: Access token JWT expirou (válido por 15 minutos)
- **Solução**: Renove o token usando `POST /auth/refresh` com o refresh token

---

**Última atualização**: Janeiro 2025


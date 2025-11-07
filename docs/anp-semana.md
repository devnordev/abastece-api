# Documentação - Cadastro de Semana ANP

## 📋 Visão Geral

Este documento explica como gerenciar semanas ANP através da API. A semana ANP representa um período de referência para os preços de combustíveis publicados pela ANP (Agência Nacional do Petróleo, Gás Natural e Biocombustíveis).

## 🔐 Autenticação e Autorização

**⚠️ IMPORTANTE**: Todos os endpoints deste módulo requerem:
- **Autenticação**: Token JWT válido
- **Autorização**: Apenas usuários com perfil **SUPER_ADMIN** têm acesso

Usuários com outros perfis (ADMIN_PREFEITURA, COLABORADOR_PREFEITURA, ADMIN_EMPRESA, COLABORADOR_EMPRESA) receberão erro **403 Forbidden**.

---

## 📤 Endpoints Disponíveis

### 1. Criar Semana ANP
**URL**: `POST /anp-semana`

### 2. Listar Semanas ANP
**URL**: `GET /anp-semana`

### 3. Buscar Semana ANP por ID
**URL**: `GET /anp-semana/:id`

### 4. Atualizar Semana ANP
**URL**: `PATCH /anp-semana/:id`

### 5. Excluir Semana ANP
**URL**: `DELETE /anp-semana/:id`

---

## 🚀 Como Cadastrar uma Semana ANP no Postman

### Passo 1: Obter Token de Autenticação

**⚠️ IMPORTANTE**: Você precisa fazer login com uma conta de **SUPER_ADMIN**.

1. Faça login na API com credenciais de SUPER_ADMIN
2. Copie o token JWT retornado na resposta

### Passo 2: Configurar a Requisição no Postman

1. **Método**: Selecione `POST`
2. **URL**: `http://localhost:3000/anp-semana`
   - (Ajuste a porta se necessário)

### Passo 3: Configurar Autenticação

1. Vá para a aba **Authorization**
2. Selecione **Type: Bearer Token**
3. Cole o token JWT no campo **Token**

### Passo 4: Configurar Headers

1. Vá para a aba **Headers**
2. Adicione:
   - **Key**: `Content-Type`
   - **Value**: `application/json`

### Passo 5: Configurar Body

1. Vá para a aba **Body**
2. Selecione **raw**
3. Selecione **JSON** no dropdown
4. Cole o seguinte JSON (ajuste os valores conforme necessário):

```json
{
  "semana_ref": "2025-08-24",
  "publicada_em": "2025-08-30T10:00:00.000Z",
  "ativo": false,
  "observacoes": "Semana de referência 24/08/2025 a 30/08/2025",
  "importado_em": "2025-08-30T15:30:00.000Z"
}
```

### Passo 6: Enviar a Requisição

1. Clique em **Send**
2. Aguarde a resposta

---

## 📝 Campos do JSON

### Campos Obrigatórios:
- `semana_ref` (string, formato: `YYYY-MM-DD`) - **OBRIGATÓRIO**
  - Data de referência da semana (normalmente a data inicial da semana)
  - Exemplo: `"2025-08-24"`

### Campos Opcionais:
- `publicada_em` (string, formato: `YYYY-MM-DD` ou ISO 8601)
  - Data de publicação da semana pela ANP
  - Se não informado, será usado a data/hora atual
  - Exemplo: `"2025-08-30T10:00:00.000Z"` ou `"2025-08-30"`

- `ativo` (boolean)
  - Indica se a semana está ativa
  - Padrão: `false`
  - Exemplo: `true` ou `false`

- `observacoes` (string)
  - Observações adicionais sobre a semana
  - Exemplo: `"Semana de referência 24/08/2025 a 30/08/2025"`

- `importado_em` (string, formato: `YYYY-MM-DD` ou ISO 8601)
  - Data/hora em que os dados foram importados no sistema
  - Exemplo: `"2025-08-30T15:30:00.000Z"`

---

## ✅ Resposta de Sucesso (201 Created)

```json
{
  "message": "Semana ANP criada com sucesso",
  "anpSemana": {
    "id": 1,
    "semana_ref": "2025-08-24T00:00:00.000Z",
    "publicada_em": "2025-08-30T10:00:00.000Z",
    "ativo": false,
    "observacoes": "Semana de referência 24/08/2025 a 30/08/2025",
    "importado_em": "2025-08-30T15:30:00.000Z",
    "_count": {
      "precos": 0
    }
  }
}
```

---

## 📋 Listar Semanas ANP

### Endpoint: `GET /anp-semana`

**Resposta de Sucesso (200 OK):**

```json
{
  "message": "Semanas ANP encontradas com sucesso",
  "anpSemanas": [
    {
      "id": 1,
      "semana_ref": "2025-08-24T00:00:00.000Z",
      "publicada_em": "2025-08-30T10:00:00.000Z",
      "ativo": false,
      "observacoes": "Semana de referência 24/08/2025 a 30/08/2025",
      "importado_em": "2025-08-30T15:30:00.000Z",
      "_count": {
        "precos": 187
      }
    },
    {
      "id": 2,
      "semana_ref": "2025-08-17T00:00:00.000Z",
      "publicada_em": "2025-08-23T10:00:00.000Z",
      "ativo": true,
      "observacoes": null,
      "importado_em": null,
      "_count": {
        "precos": 150
      }
    }
  ],
  "total": 2
}
```

**Nota**: As semanas são listadas ordenadas por `semana_ref` em ordem decrescente (mais recente primeiro).

---

## 🔍 Buscar Semana ANP por ID

### Endpoint: `GET /anp-semana/:id`

**Exemplo**: `GET /anp-semana/1`

**Resposta de Sucesso (200 OK):**

```json
{
  "message": "Semana ANP encontrada com sucesso",
  "anpSemana": {
    "id": 1,
    "semana_ref": "2025-08-24T00:00:00.000Z",
    "publicada_em": "2025-08-30T10:00:00.000Z",
    "ativo": false,
    "observacoes": "Semana de referência 24/08/2025 a 30/08/2025",
    "importado_em": "2025-08-30T15:30:00.000Z",
    "precos": [
      {
        "id": 1,
        "anp_semana_id": 1,
        "uf": "SP",
        "combustivel": "GASOLINA_COMUM",
        "preco_minimo": 5.09,
        "preco_medio": 6.04,
        "preco_maximo": 8.99,
        "teto_calculado": 6.1004,
        "base_utilizada": "MEDIO",
        "margem_aplicada": 1.00
      }
      // ... mais 9 preços (total de 10 mostrados)
    ],
    "_count": {
      "precos": 187
    }
  }
}
```

**Nota**: A resposta inclui os primeiros 10 preços vinculados à semana e o total de preços no campo `_count`.

---

## ✏️ Atualizar Semana ANP

### Endpoint: `PATCH /anp-semana/:id`

**⚠️ IMPORTANTE**: Todos os campos são opcionais. Você pode atualizar apenas os campos que desejar.

**Exemplo de Requisição:**

```json
{
  "ativo": true,
  "observacoes": "Semana ativada e validada"
}
```

**Resposta de Sucesso (200 OK):**

```json
{
  "message": "Semana ANP atualizada com sucesso",
  "anpSemana": {
    "id": 1,
    "semana_ref": "2025-08-24T00:00:00.000Z",
    "publicada_em": "2025-08-30T10:00:00.000Z",
    "ativo": true,
    "observacoes": "Semana ativada e validada",
    "importado_em": "2025-08-30T15:30:00.000Z",
    "_count": {
      "precos": 187
    }
  }
}
```

---

## 🗑️ Excluir Semana ANP

### Endpoint: `DELETE /anp-semana/:id`

**Exemplo**: `DELETE /anp-semana/1`

**Resposta de Sucesso (200 OK):**

```json
{
  "message": "Semana ANP excluída com sucesso"
}
```

**⚠️ IMPORTANTE**: Não é possível excluir uma semana ANP que tenha preços vinculados. Se tentar excluir uma semana com preços, você receberá um erro:

```json
{
  "statusCode": 400,
  "message": "Não é possível excluir semana ANP com preços vinculados",
  "error": "Bad Request"
}
```

---

## ❌ Possíveis Erros

### 400 Bad Request

**Erro**: `Data de referência da semana deve ser uma data válida`
- **Solução**: Verifique se o formato da data está correto (`YYYY-MM-DD`)

**Erro**: `Data de publicação deve ser uma data válida`
- **Solução**: Verifique se o formato da data está correto

**Erro**: `Não é possível excluir semana ANP com preços vinculados`
- **Solução**: Primeiro exclua ou mova os preços vinculados à semana antes de excluí-la

### 401 Unauthorized

**Erro**: Token inválido ou expirado
- **Solução**: Faça login novamente e obtenha um novo token

### 403 Forbidden

**Erro**: `Apenas usuários com perfil SUPER_ADMIN têm acesso a este recurso`
- **Solução**: Você precisa estar logado com uma conta de SUPER_ADMIN. Usuários com outros perfis não têm acesso a este módulo.

### 404 Not Found

**Erro**: `Semana ANP não encontrada`
- **Solução**: Verifique se o ID da semana existe. Use `GET /anp-semana` para listar todas as semanas.

---

## 🔄 Fluxo de Trabalho Recomendado

### Passo a Passo para Importar Preços ANP:

1. **Cadastrar a Semana ANP**
   - Use `POST /anp-semana` para criar uma nova semana
   - Anote o `id` retornado (você precisará dele no próximo passo)

2. **Importar Preços via CSV**
   - Use `POST /anp-precos-uf/importar-csv`
   - Envie o arquivo CSV e informe o `anp_semana_id` obtido no passo anterior

3. **Verificar os Dados Importados**
   - Use `GET /anp-semana/:id` para ver os preços importados
   - Ou use `GET /anp-precos-uf/semana/:anpSemanaId` para ver todos os preços da semana

4. **Ativar a Semana (Opcional)**
   - Use `PATCH /anp-semana/:id` para definir `ativo: true`
   - Isso pode ser útil para indicar qual semana está em uso

---

## 📊 Exemplo Completo de Requisição (cURL)

### Criar Semana ANP:

```bash
curl -X POST \
  http://localhost:3000/anp-semana \
  -H 'Authorization: Bearer SEU_TOKEN_AQUI' \
  -H 'Content-Type: application/json' \
  -d '{
    "semana_ref": "2025-08-24",
    "publicada_em": "2025-08-30T10:00:00.000Z",
    "ativo": false,
    "observacoes": "Semana de referência 24/08/2025 a 30/08/2025"
  }'
```

### Listar Semanas:

```bash
curl -X GET \
  http://localhost:3000/anp-semana \
  -H 'Authorization: Bearer SEU_TOKEN_AQUI'
```

### Buscar Semana por ID:

```bash
curl -X GET \
  http://localhost:3000/anp-semana/1 \
  -H 'Authorization: Bearer SEU_TOKEN_AQUI'
```

### Atualizar Semana:

```bash
curl -X PATCH \
  http://localhost:3000/anp-semana/1 \
  -H 'Authorization: Bearer SEU_TOKEN_AQUI' \
  -H 'Content-Type: application/json' \
  -d '{
    "ativo": true,
    "observacoes": "Semana ativada"
  }'
```

### Excluir Semana:

```bash
curl -X DELETE \
  http://localhost:3000/anp-semana/1 \
  -H 'Authorization: Bearer SEU_TOKEN_AQUI'
```

---

## 📝 Checklist Antes de Cadastrar

- [ ] **Está logado como SUPER_ADMIN** (não apenas autenticado)
- [ ] Tem um token JWT válido de um usuário SUPER_ADMIN
- [ ] A data `semana_ref` está no formato correto (`YYYY-MM-DD`)
- [ ] Você tem o arquivo CSV pronto para importar após criar a semana
- [ ] Você anotou o `id` da semana criada para usar na importação

---

## 💡 Dicas

1. **Use a data inicial da semana como `semana_ref`**
   - Exemplo: Se a semana é de 24/08 a 30/08, use `2025-08-24`

2. **Mantenha apenas uma semana ativa por vez**
   - Use o campo `ativo` para indicar qual semana está em uso

3. **Use observações para documentar**
   - O campo `observacoes` é útil para anotar informações relevantes sobre a semana

4. **Verifique antes de excluir**
   - Use `GET /anp-semana/:id` para ver quantos preços estão vinculados antes de excluir

5. **Ordem de operação recomendada**
   - Primeiro crie a semana ANP
   - Depois importe os preços via CSV
   - Por último, ative a semana se necessário

---

## 🔗 Endpoints Relacionados

- `POST /anp-precos-uf/importar-csv` - Importar preços para uma semana ANP
- `GET /anp-precos-uf/semana/:anpSemanaId` - Ver preços de uma semana específica
- `GET /parametros-teto` - Listar parâmetros de teto (necessário para calcular tetos)

---

## 📞 Suporte

Em caso de dúvidas ou problemas, verifique:
1. Os logs da aplicação
2. A documentação Swagger em `http://localhost:3000/api/docs`
3. Os status codes HTTP retornados nas respostas


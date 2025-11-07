# 📤 Guia de Importação - Arquivo CSV ANP

## 📁 Arquivo CSV para Importação

**Arquivo**: `resumo_semanal_lpc_2025-08-24_2025-08-30(ESTADOS) (1) (1).csv`

Este arquivo contém dados oficiais da ANP para a semana de 24/08/2025 a 30/08/2025.

---

## 🚀 Passo a Passo para Importação

### 1. Pré-requisitos

- ✅ API rodando em `http://localhost:3000`
- ✅ Token JWT de um usuário **SUPER_ADMIN**
- ✅ Semana ANP cadastrada (obter o `anp_semana_id`)
- ✅ Parâmetro de teto ativo cadastrado

### 2. Obter Token de Autenticação

**Endpoint**: `POST /auth/login`

**Requisição**:
```json
{
  "email": "superadmin@nordev.com",
  "senha": "123456"
}
```

**Resposta**:
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refresh_token": "...",
  "user": {
    "id": 1,
    "email": "superadmin@nordev.com",
    "tipo_usuario": "SUPER_ADMIN"
  }
}
```

**⚠️ IMPORTANTE**: Copie o `access_token` da resposta.

### 3. Cadastrar Semana ANP (se necessário)

**Endpoint**: `POST /anp-semana`

**Requisição**:
```json
{
  "semana_ref": "2025-08-24",
  "publicada_em": "2025-08-30T00:00:00.000Z",
  "ativo": true,
  "observacoes": "Semana de 24/08/2025 a 30/08/2025"
}
```

**Resposta**:
```json
{
  "message": "Semana ANP criada com sucesso",
  "semana": {
    "id": 1,
    "semana_ref": "2025-08-24",
    "publicada_em": "2025-08-30T00:00:00.000Z",
    "ativo": true
  }
}
```

**⚠️ IMPORTANTE**: Guarde o `id` da semana criada (ex: `1`).

### 4. Verificar Parâmetro de Teto Ativo

**Endpoint**: `GET /parametros-teto?ativo=true`

Certifique-se de que existe um parâmetro de teto ativo. Se não existir, crie um:

**Endpoint**: `POST /parametros-teto`

**Requisição**:
```json
{
  "anp_base": "MEDIO",
  "margem_pct": 1.0,
  "ativo": true,
  "observacoes": "Parâmetro padrão"
}
```

### 5. Importar o Arquivo CSV

**Endpoint**: `POST /anp-precos-uf/importar-csv`

**Configuração no Postman**:

#### Aba "Authorization"
- **Type**: Bearer Token
- **Token**: Cole o `access_token` obtido no passo 2

#### Aba "Body"
- Selecione **form-data**

**Campo 1:**
- **Key**: `file`
- **Type**: Selecione **File** (dropdown à direita)
- **Value**: Clique em **Select Files** e escolha o arquivo:
  `resumo_semanal_lpc_2025-08-24_2025-08-30(ESTADOS) (1) (1).csv`

**Campo 2:**
- **Key**: `anp_semana_id`
- **Type**: Mantenha como **Text**
- **Value**: Digite o ID da semana ANP (ex: `1`)

#### Aba "Headers"
- **NÃO** adicione o header `Content-Type` manualmente
- O Postman adicionará automaticamente `multipart/form-data`

### 6. Enviar a Requisição

Clique em **Send** e aguarde a resposta.

---

## ✅ Resposta de Sucesso Esperada

```json
{
  "message": "187 preços importados com sucesso",
  "total": 187,
  "erros": null
}
```

O sistema processará automaticamente:
- ✅ Todas as linhas de dados válidas do CSV
- ✅ Conversão de estados (ex: "SAO PAULO" → "SP")
- ✅ Conversão de produtos (ex: "ETANOL HIDRATADO" → "ETANOL_COMUM")
- ✅ Conversão de vírgula para ponto nos valores decimais
- ✅ Cálculo automático do teto baseado no parâmetro ativo

---

## 📊 Dados que Serão Importados

O arquivo CSV contém aproximadamente **187 registros** com os seguintes combustíveis:

- **ETANOL HIDRATADO** (27 estados)
- **GASOLINA ADITIVADA** (27 estados)
- **GASOLINA COMUM** (27 estados)
- **GLP** (26 estados)
- **GNV** (14 estados)
- **OLEO DIESEL** (27 estados) → mapeado para DIESEL_S500
- **OLEO DIESEL S10** (27 estados) → mapeado para DIESEL_S10

**Total**: ~187 preços por UF e combustível

---

## 🔍 Verificar Dados Importados

Após a importação, você pode verificar os dados:

### Listar todos os preços:
```
GET /anp-precos-uf
Authorization: Bearer <token>
```

### Buscar preços por semana:
```
GET /anp-precos-uf/semana/1
Authorization: Bearer <token>
```

### Buscar preço específico:
```
GET /anp-precos-uf/:id
Authorization: Bearer <token>
```

---

## ❌ Possíveis Erros

### 400 Bad Request
- **"Nenhum arquivo CSV foi enviado"**
  - Solução: Certifique-se de que o campo `file` está como **File** e não **Text**

- **"O ID da semana ANP (anp_semana_id) deve ser um número inteiro positivo"**
  - Solução: Verifique se o valor de `anp_semana_id` é um número válido

### 401 Unauthorized
- **Token inválido ou expirado**
  - Solução: Faça login novamente e obtenha um novo token

### 403 Forbidden
- **"Apenas usuários com perfil SUPER_ADMIN têm acesso a este recurso"**
  - Solução: Use credenciais de SUPER_ADMIN

### 404 Not Found
- **"Semana ANP com ID X não encontrada"**
  - Solução: Cadastre a semana ANP primeiro (passo 3)

- **"Nenhum parâmetro de teto ativo encontrado"**
  - Solução: Cadastre um parâmetro de teto ativo (passo 4)

---

## 📝 Exemplo Completo (cURL)

Se preferir testar via terminal:

```bash
curl -X POST \
  http://localhost:3000/anp-precos-uf/importar-csv \
  -H 'Authorization: Bearer SEU_TOKEN_AQUI' \
  -F 'file=@resumo_semanal_lpc_2025-08-24_2025-08-30(ESTADOS) (1) (1).csv' \
  -F 'anp_semana_id=1'
```

---

## ✅ Checklist Antes de Importar

- [ ] Está logado como **SUPER_ADMIN**
- [ ] Tem um token JWT válido
- [ ] A semana ANP foi cadastrada e você tem o `anp_semana_id`
- [ ] Existe um parâmetro de teto ativo cadastrado
- [ ] O arquivo CSV está no mesmo diretório ou você sabe o caminho completo
- [ ] O arquivo CSV está no formato correto (separador `;`)

---

## 🎯 Resultado Esperado

Após a importação bem-sucedida, você terá:

- ✅ 187 registros de preços ANP cadastrados
- ✅ Preços organizados por UF e tipo de combustível
- ✅ Teto calculado automaticamente para cada registro
- ✅ Dados prontos para uso no sistema

---

## 📚 Documentação Relacionada

- **Guia Completo**: `anp-precos-uf.md`
- **Exemplos JSON**: `anp-precos-uf.json`
- **Swagger**: `http://localhost:3000/api/docs`


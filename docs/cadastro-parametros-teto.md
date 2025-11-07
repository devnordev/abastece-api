# 📚 Guia Completo - CRUD de Parâmetros de Teto

Este guia apresenta o passo a passo completo para o SUPER_ADMIN realizar o CRUD (Create, Read, Update, Delete) de Parâmetros de Teto.

---

## 📋 Índice

1. [Pré-requisitos](#pré-requisitos)
2. [Autenticação e Obtenção de Token](#autenticação-e-obtenção-de-token)
3. [CRUD de Parâmetros de Teto](#crud-de-parâmetros-de-teto)
   - [3.1 Criar Parâmetro de Teto](#31-criar-parâmetro-de-teto)
   - [3.2 Listar Parâmetros de Teto](#32-listar-parâmetros-de-teto)
   - [3.3 Buscar Parâmetro de Teto por ID](#33-buscar-parâmetro-de-teto-por-id)
   - [3.4 Atualizar Parâmetro de Teto](#34-atualizar-parâmetro-de-teto)
   - [3.5 Excluir Parâmetro de Teto](#35-excluir-parâmetro-de-teto)
4. [Campos do Modelo](#campos-do-modelo)
5. [Troubleshooting](#troubleshooting)

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

### ⚠️ IMPORTANTE: Acesso Restrito

**Perfil Necessário**: `SUPER_ADMIN` (exclusivo)

Apenas usuários com perfil `SUPER_ADMIN` podem criar, editar, visualizar e excluir parâmetros de teto. Outros perfis receberão erro 403 (Forbidden).

### Credenciais do SUPER_ADMIN

#### 👑 **SUPER_ADMIN**
- **Email**: `superadmin@nordev.com`
- **Senha**: `123456`
- **Tipo**: `SUPER_ADMIN`
- **Permissões**: 
  - ✅ Criar/Editar/Excluir Parâmetros de Teto
  - ✅ Acesso total ao sistema

### Passo 1: Fazer Login

**Endpoint**: `POST /auth/login`

**Requisição**:
```bash
POST http://localhost:3000/auth/login
Content-Type: application/json

{
  "email": "superadmin@nordev.com",
  "senha": "123456"
}
```

**Resposta de Sucesso** (200 OK):
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "email": "superadmin@nordev.com",
    "nome": "Super Administrador",
    "tipo_usuario": "SUPER_ADMIN"
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

## CRUD de Parâmetros de Teto

### 3.1 Criar Parâmetro de Teto

**Perfil Necessário**: `SUPER_ADMIN`

**Endpoint**: `POST /parametros-teto`

**Requisição**:
```bash
POST http://localhost:3000/parametros-teto
Authorization: Bearer <seu-token>
Content-Type: application/json

{
  "anp_base": "MEDIO",
  "margem_pct": 5.5,
  "excecoes_combustivel": "Gasolina comum sem margem aplicada",
  "ativo": true,
  "observacoes": "Parâmetro padrão para cálculo de teto de preços"
}
```

**Campos Disponíveis**:
- `anp_base` (opcional): Base ANP utilizada para cálculo do teto
  - Valores possíveis: `MINIMO`, `MEDIO`, `MAXIMO`
  - Padrão: `MEDIO`
- `margem_pct` (opcional): Margem percentual aplicada (0 a 100)
  - Exemplo: `5.5` = 5.5%
  - Máximo 2 casas decimais
- `excecoes_combustivel` (opcional): Exceções de combustível (texto livre)
- `ativo` (opcional): Status ativo do parâmetro
  - Padrão: `true`
- `observacoes` (opcional): Observações adicionais

**Resposta de Sucesso** (201 Created):
```json
{
  "message": "Parâmetro de teto criado com sucesso",
  "parametroTeto": {
    "id": 1,
    "anp_base": "MEDIO",
    "margem_pct": 5.5,
    "excecoes_combustivel": "Gasolina comum sem margem aplicada",
    "ativo": true,
    "observacoes": "Parâmetro padrão para cálculo de teto de preços"
  }
}
```

**⚠️ Importante**: Guarde o `id` do parâmetro criado. Você precisará dele para atualizar ou excluir.

**Exemplo com todos os campos**:
```bash
POST http://localhost:3000/parametros-teto
Authorization: Bearer <seu-token>
Content-Type: application/json

{
  "anp_base": "MAXIMO",
  "margem_pct": 6.75,
  "excecoes_combustivel": "Diesel S10 com margem reduzida de 3%",
  "ativo": true,
  "observacoes": "Parâmetro ajustado para nova política de preços da ANP"
}
```

**Exemplo mínimo** (apenas campos obrigatórios - nenhum é obrigatório):
```bash
POST http://localhost:3000/parametros-teto
Authorization: Bearer <seu-token>
Content-Type: application/json

{
  "anp_base": "MEDIO"
}
```

**❌ Erros Possíveis**:
- `401 Unauthorized`: Token inválido ou expirado
- `403 Forbidden`: Usuário não é SUPER_ADMIN
- `400 Bad Request`: Dados inválidos (ex: margem_pct > 100)

---

### 3.2 Listar Parâmetros de Teto

**Perfil Necessário**: `SUPER_ADMIN`

**Endpoint**: `GET /parametros-teto`

**Requisição**:
```bash
GET http://localhost:3000/parametros-teto
Authorization: Bearer <seu-token>
```

**Resposta de Sucesso** (200 OK):
```json
{
  "message": "Parâmetros de teto encontrados com sucesso",
  "parametrosTeto": [
    {
      "id": 1,
      "anp_base": "MEDIO",
      "margem_pct": 5.5,
      "excecoes_combustivel": "Gasolina comum sem margem aplicada",
      "ativo": true,
      "observacoes": "Parâmetro padrão para cálculo de teto de preços"
    },
    {
      "id": 2,
      "anp_base": "MAXIMO",
      "margem_pct": 6.75,
      "excecoes_combustivel": "Diesel S10 com margem reduzida de 3%",
      "ativo": true,
      "observacoes": "Parâmetro ajustado para nova política de preços da ANP"
    }
  ],
  "total": 2
}
```

**❌ Erros Possíveis**:
- `401 Unauthorized`: Token inválido ou expirado
- `403 Forbidden`: Usuário não é SUPER_ADMIN

---

### 3.3 Buscar Parâmetro de Teto por ID

**Perfil Necessário**: `SUPER_ADMIN`

**Endpoint**: `GET /parametros-teto/:id`

**Requisição**:
```bash
GET http://localhost:3000/parametros-teto/1
Authorization: Bearer <seu-token>
```

**Resposta de Sucesso** (200 OK):
```json
{
  "message": "Parâmetro de teto encontrado com sucesso",
  "parametroTeto": {
    "id": 1,
    "anp_base": "MEDIO",
    "margem_pct": 5.5,
    "excecoes_combustivel": "Gasolina comum sem margem aplicada",
    "ativo": true,
    "observacoes": "Parâmetro padrão para cálculo de teto de preços"
  }
}
```

**❌ Erros Possíveis**:
- `401 Unauthorized`: Token inválido ou expirado
- `403 Forbidden`: Usuário não é SUPER_ADMIN
- `404 Not Found`: Parâmetro de teto não encontrado

---

### 3.4 Atualizar Parâmetro de Teto

**Perfil Necessário**: `SUPER_ADMIN`

**Endpoint**: `PATCH /parametros-teto/:id`

**⚠️ Importante**: Todos os campos são opcionais. Você pode atualizar apenas os campos que desejar.

**Requisição**:
```bash
PATCH http://localhost:3000/parametros-teto/1
Authorization: Bearer <seu-token>
Content-Type: application/json

{
  "margem_pct": 6.0,
  "anp_base": "MAXIMO",
  "observacoes": "Parâmetro atualizado para nova política de preços"
}
```

**Exemplo - Atualizar apenas margem**:
```bash
PATCH http://localhost:3000/parametros-teto/1
Authorization: Bearer <seu-token>
Content-Type: application/json

{
  "margem_pct": 7.25
}
```

**Exemplo - Desativar parâmetro**:
```bash
PATCH http://localhost:3000/parametros-teto/1
Authorization: Bearer <seu-token>
Content-Type: application/json

{
  "ativo": false
}
```

**Resposta de Sucesso** (200 OK):
```json
{
  "message": "Parâmetro de teto atualizado com sucesso",
  "parametroTeto": {
    "id": 1,
    "anp_base": "MAXIMO",
    "margem_pct": 6.0,
    "excecoes_combustivel": "Gasolina comum sem margem aplicada",
    "ativo": true,
    "observacoes": "Parâmetro atualizado para nova política de preços"
  }
}
```

**❌ Erros Possíveis**:
- `401 Unauthorized`: Token inválido ou expirado
- `403 Forbidden`: Usuário não é SUPER_ADMIN
- `404 Not Found`: Parâmetro de teto não encontrado
- `400 Bad Request`: Dados inválidos (ex: margem_pct > 100)

---

### 3.5 Excluir Parâmetro de Teto

**Perfil Necessário**: `SUPER_ADMIN`

**Endpoint**: `DELETE /parametros-teto/:id`

**Requisição**:
```bash
DELETE http://localhost:3000/parametros-teto/1
Authorization: Bearer <seu-token>
```

**Resposta de Sucesso** (200 OK):
```json
{
  "message": "Parâmetro de teto excluído com sucesso"
}
```

**❌ Erros Possíveis**:
- `401 Unauthorized`: Token inválido ou expirado
- `403 Forbidden`: Usuário não é SUPER_ADMIN
- `404 Not Found`: Parâmetro de teto não encontrado

---

## Campos do Modelo

### Estrutura Completa do Parâmetro de Teto

```typescript
{
  id: number;                    // ID único (gerado automaticamente)
  anp_base: "MINIMO" | "MEDIO" | "MAXIMO";  // Base ANP (padrão: MEDIO)
  margem_pct: number;            // Margem percentual (0-100, 2 casas decimais)
  excecoes_combustivel: string;  // Exceções de combustível (texto livre)
  ativo: boolean;                // Status ativo (padrão: true)
  observacoes: string;          // Observações adicionais (texto livre)
}
```

### Valores Possíveis para `anp_base`

- **MINIMO**: Utiliza o preço mínimo da ANP como base
- **MEDIO**: Utiliza o preço médio da ANP como base (padrão)
- **MAXIMO**: Utiliza o preço máximo da ANP como base

### Regras de Validação

- `margem_pct`: 
  - Deve ser um número entre 0 e 100
  - Máximo de 2 casas decimais
  - Exemplo válido: `5.5`, `10.75`, `0.5`
  - Exemplo inválido: `101`, `-5`, `5.555`

---

## 🔍 Troubleshooting

### Problema: Erro 401 Unauthorized

**Causa**: Token inválido ou expirado

**Solução**:
1. Faça login novamente com as credenciais do SUPER_ADMIN
2. Copie o novo `access_token`
3. Use o novo token nas requisições

```bash
POST http://localhost:3000/auth/login
Content-Type: application/json

{
  "email": "superadmin@nordev.com",
  "senha": "123456"
}
```

### Problema: Erro 403 Forbidden

**Causa**: Usuário não tem perfil SUPER_ADMIN

**Mensagem de Erro**:
```json
{
  "message": "Apenas usuários com perfil SUPER_ADMIN têm acesso a este recurso",
  "error": "Forbidden",
  "statusCode": 403
}
```

**Solução**:
- Use um usuário com perfil `SUPER_ADMIN`
- Credenciais: `superadmin@nordev.com` / `123456`

**Verificar perfil do usuário**:
```bash
GET http://localhost:3000/auth/profile
Authorization: Bearer <seu-token>
```

**Resposta**:
```json
{
  "message": "Perfil obtido com sucesso",
  "usuario": {
    "id": 1,
    "email": "superadmin@nordev.com",
    "nome": "Super Administrador",
    "tipo_usuario": "SUPER_ADMIN"
  }
}
```

### Problema: Erro 404 Not Found

**Causa**: Parâmetro de teto não encontrado (ID inválido)

**Solução**:
1. Liste os parâmetros primeiro para obter os IDs corretos:
   ```bash
   GET http://localhost:3000/parametros-teto
   Authorization: Bearer <seu-token>
   ```
2. Use um ID existente na lista retornada

### Problema: Erro 400 Bad Request

**Causa**: Dados inválidos na requisição

**Exemplos de Erros**:
- `margem_pct` maior que 100
- `margem_pct` com mais de 2 casas decimais
- `anp_base` com valor inválido

**Solução**:
- Verifique se `margem_pct` está entre 0 e 100
- Verifique se `margem_pct` tem no máximo 2 casas decimais
- Verifique se `anp_base` é um dos valores válidos: `MINIMO`, `MEDIO`, `MAXIMO`
- Consulte a documentação Swagger em `http://localhost:3000/api/docs`

**Exemplo de Requisição Inválida**:
```json
{
  "margem_pct": 150,  // ❌ Erro: maior que 100
  "anp_base": "INVALIDO"  // ❌ Erro: valor inválido
}
```

**Exemplo de Requisição Válida**:
```json
{
  "margem_pct": 5.5,  // ✅ Válido
  "anp_base": "MEDIO"  // ✅ Válido
}
```

---

## 🔄 Fluxo Completo de Teste

Seguindo a ordem recomendada:

### Passo 1: Autenticação
1. Fazer login com `superadmin@nordev.com` / `123456`
2. Copiar o `access_token`

### Passo 2: Criar Parâmetro de Teto
1. `POST /parametros-teto` → Obter `id` (ex: 1)

### Passo 3: Listar Parâmetros
1. `GET /parametros-teto` → Ver todos os parâmetros

### Passo 4: Buscar Parâmetro Específico
1. `GET /parametros-teto/1` → Ver detalhes do parâmetro

### Passo 5: Atualizar Parâmetro
1. `PATCH /parametros-teto/1` → Atualizar campos desejados

### Passo 6: Excluir Parâmetro (Opcional)
1. `DELETE /parametros-teto/1` → Excluir parâmetro

---

## 📝 Resumo das Credenciais

| Perfil | Email | Senha | Permissões |
|--------|-------|-------|------------|
| **SUPER_ADMIN** | `superadmin@nordev.com` | `123456` | ✅ CRUD completo de Parâmetros de Teto |

---

## 📚 Recursos Adicionais

- **Swagger UI**: `http://localhost:3000/api/docs`
- **Collection Postman**: `postman/collection_05_11_2025.json`
- **Documentação de Usuários**: `SEED_USERS.md`
- **Regras de Perfis**: `REGRAS_PERFIS.md`

---

## ✅ Checklist de Teste

- [ ] Login realizado com SUPER_ADMIN
- [ ] Token obtido e armazenado
- [ ] Parâmetro de teto criado
- [ ] Parâmetros listados com sucesso
- [ ] Parâmetro encontrado por ID
- [ ] Parâmetro atualizado
- [ ] Parâmetro excluído (quando aplicável)
- [ ] Erro 403 verificado com outro perfil

---

## 🎯 Exemplos Práticos

### Exemplo 1: Criar Parâmetro com Base Mínima

```bash
POST http://localhost:3000/parametros-teto
Authorization: Bearer <seu-token>
Content-Type: application/json

{
  "anp_base": "MINIMO",
  "margem_pct": 3.0,
  "observacoes": "Parâmetro conservador usando preço mínimo"
}
```

### Exemplo 2: Criar Parâmetro com Base Máxima

```bash
POST http://localhost:3000/parametros-teto
Authorization: Bearer <seu-token>
Content-Type: application/json

{
  "anp_base": "MAXIMO",
  "margem_pct": 8.5,
  "excecoes_combustivel": "Aplicar margem reduzida para etanol",
  "ativo": true,
  "observacoes": "Parâmetro para períodos de alta volatilidade"
}
```

### Exemplo 3: Atualizar Apenas a Margem

```bash
PATCH http://localhost:3000/parametros-teto/1
Authorization: Bearer <seu-token>
Content-Type: application/json

{
  "margem_pct": 7.0
}
```

### Exemplo 4: Desativar Parâmetro

```bash
PATCH http://localhost:3000/parametros-teto/1
Authorization: Bearer <seu-token>
Content-Type: application/json

{
  "ativo": false
}
```

---

## 🔒 Segurança

- **Autenticação**: Todas as rotas requerem autenticação via JWT
- **Autorização**: Apenas SUPER_ADMIN pode acessar este módulo
- **Validação**: Todos os dados são validados antes de serem salvos
- **Proteção**: Outros perfis recebem erro 403 ao tentar acessar

---

**🎉 Parabéns!** Você completou o guia de CRUD de Parâmetros de Teto.


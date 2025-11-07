# 🔐 Guia Completo - Refresh Token

## 📋 Índice
- [O que é Refresh Token?](#o-que-é-refresh-token)
- [Fluxo de Autenticação](#fluxo-de-autenticação)
- [Como Funciona na API](#como-funciona-na-api)
- [Uso em Requisições HTTP](#uso-em-requisições-http)
- [Como Usar no Postman](#como-usar-no-postman)
- [Exemplos Práticos](#exemplos-práticos)
- [Solução de Problemas](#solução-de-problemas)

---

## 🔍 O que é Refresh Token?

O **Refresh Token** é um token de longa duração usado para obter novos **Access Tokens** sem que o usuário precise fazer login novamente.

### Diferenças entre Access Token e Refresh Token:

| Característica | Access Token | Refresh Token |
|---|---|---|
| **Duração** | Curta (15 minutos) | Longa (7 dias) |
| **Uso** | Acesso a rotas protegidas | Renovar access token |
| **Armazenamento** | Cabeçalho Authorization | Armazenado no banco de dados |
| **Revogação** | Não revogável (expira) | Revogável no banco |

---

## 🔄 Fluxo de Autenticação

```
1. LOGIN
   ├─> Usuário envia email e senha
   └─> API retorna accessToken + refreshToken

2. ACESSO A ROTAS PROTEGIDAS
   ├─> Cliente envia accessToken no header Authorization
   └─> API valida e permite acesso

3. ACCESS TOKEN EXPIROU
   ├─> Cliente envia refreshToken para /auth/refresh
   └─> API retorna novo accessToken + novo refreshToken

4. LOGOUT
   ├─> Cliente envia accessToken válido
   └─> API revoga todos os refreshTokens do usuário
```

---

## ⚙️ Como Funciona na API

### 1. **Login** - `POST /auth/login`
Quando você faz login, a API:
- Valida suas credenciais
- Gera um **Access Token** (JWT) válido por 15 minutos
- Gera um **Refresh Token** (string aleatória) válido por 7 dias
- Salva o Refresh Token no banco de dados
- Retorna ambos os tokens

### 2. **Refresh** - `POST /auth/refresh`
Quando o Access Token expira:
- Você envia o Refresh Token
- API valida se o token existe e não foi revogado
- Revoga o Refresh Token antigo (segurança)
- Gera novos Access Token e Refresh Token
- Retorna os novos tokens

### 3. **Logout** - `POST /auth/logout`
Quando você faz logout:
- API revoga todos os Refresh Tokens ativos do usuário
- Isso impede renovação de tokens em outros dispositivos

---

## 📡 Uso em Requisições HTTP

### 1️⃣ Fazer Login

```http
POST http://localhost:3000/auth/login
Content-Type: application/json

{
  "email": "admin@admin.com",
  "senha": "admin123"
}
```

**Resposta:**
```json
{
  "message": "Login realizado com sucesso",
  "usuario": {
    "id": 1,
    "email": "admin@admin.com",
    "nome": "Administrador",
    "cpf": "00000000000",
    "tipo_usuario": "administrador",
    "statusAcess": "Acesso_aprovado"
  },
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6...",
  "expiresIn": "15m"
}
```

### 2️⃣ Acessar Rota Protegida

```http
GET http://localhost:3000/auth/profile
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### 3️⃣ Renovar Access Token

```http
POST http://localhost:3000/auth/refresh
Content-Type: application/json

{
  "refreshToken": "a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6..."
}
```

**Resposta:**
```json
{
  "message": "Tokens renovados com sucesso",
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "z9y8x7w6v5u4t3s2r1q0p9o8n7m6l5k4...",
  "expiresIn": "15m"
}
```

### 4️⃣ Fazer Logout

```http
POST http://localhost:3000/auth/logout
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

---

## 🚀 Como Usar no Postman

### Passo 1: Criar Collection e Environment

1. **Criar uma Collection** chamada "API Abastecimento"
2. **Criar um Environment** chamado "Development"
3. **Adicionar variáveis no Environment:**
   - `baseUrl` = `http://localhost:3000`
   - `accessToken` = (deixe vazio, será preenchido automaticamente)
   - `refreshToken` = (deixe vazio, será preenchido automaticamente)

### Passo 2: Configurar Requisição de Login

1. **Criar nova requisição**: `POST Login`
2. **URL**: `{{baseUrl}}/auth/login`
3. **Body** (raw JSON):
   ```json
   {
     "email": "admin@admin.com",
     "senha": "admin123"
   }
   ```

4. **Adicionar script na aba "Tests"** (para salvar tokens automaticamente):
   ```javascript
   // Verifica se o login foi bem-sucedido
   if (pm.response.code === 200 || pm.response.code === 201) {
       const jsonData = pm.response.json();
       
       // Salva os tokens nas variáveis de ambiente
       pm.environment.set("accessToken", jsonData.accessToken);
       pm.environment.set("refreshToken", jsonData.refreshToken);
       
       console.log("✅ Tokens salvos com sucesso!");
       console.log("Access Token:", jsonData.accessToken);
       console.log("Refresh Token:", jsonData.refreshToken);
   }
   ```

5. **Enviar a requisição** e verificar se os tokens foram salvos no Environment

### Passo 3: Configurar Requisição de Refresh Token

1. **Criar nova requisição**: `POST Refresh Token`
2. **URL**: `{{baseUrl}}/auth/refresh`
3. **Body** (raw JSON):
   ```json
   {
     "refreshToken": "{{refreshToken}}"
   }
   ```

4. **Adicionar script na aba "Tests"**:
   ```javascript
   // Verifica se o refresh foi bem-sucedido
   if (pm.response.code === 200 || pm.response.code === 201) {
       const jsonData = pm.response.json();
       
       // Atualiza os tokens nas variáveis de ambiente
       pm.environment.set("accessToken", jsonData.accessToken);
       pm.environment.set("refreshToken", jsonData.refreshToken);
       
       console.log("✅ Tokens renovados com sucesso!");
   }
   ```

### Passo 4: Configurar Autorização para Rotas Protegidas

#### Opção A: Configurar na Collection (recomendado)

1. Clique com botão direito na **Collection** > **Edit**
2. Vá na aba **Authorization**
3. Selecione **Type**: `Bearer Token`
4. No campo **Token**, coloque: `{{accessToken}}`
5. Clique em **Save**

Agora todas as requisições da collection herdarão automaticamente a autenticação!

#### Opção B: Configurar individualmente em cada requisição

1. Na requisição desejada, vá na aba **Authorization**
2. Selecione **Type**: `Bearer Token`
3. No campo **Token**, coloque: `{{accessToken}}`

### Passo 5: Testar uma Rota Protegida

1. **Criar nova requisição**: `GET Profile`
2. **URL**: `{{baseUrl}}/auth/profile`
3. **Authorization**: Já configurada (herda da Collection)
4. **Enviar a requisição**

**Resposta esperada:**
```json
{
  "message": "Perfil obtido com sucesso",
  "usuario": {
    "id": 1,
    "email": "admin@admin.com",
    "nome": "Administrador",
    "cpf": "00000000000",
    "tipo_usuario": "administrador",
    "statusAcess": "Acesso_aprovado"
  }
}
```

### Passo 6: Script Automático para Renovar Token Expirado

Para automatizar a renovação do token quando ele expirar, adicione este script na aba **Pre-request Script** da **Collection**:

```javascript
// Pre-request Script para renovar token automaticamente
const accessToken = pm.environment.get("accessToken");

// Se não tiver access token, pula
if (!accessToken) {
    console.log("⚠️ Nenhum access token encontrado");
    return;
}

// Decodifica o token JWT para verificar expiração
function parseJwt(token) {
    try {
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
            return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
        }).join(''));
        return JSON.parse(jsonPayload);
    } catch (e) {
        return null;
    }
}

const decoded = parseJwt(accessToken);

// Verifica se o token está expirado ou vai expirar em menos de 1 minuto
if (decoded && decoded.exp) {
    const expirationTime = decoded.exp * 1000; // Converte para milissegundos
    const currentTime = Date.now();
    const timeUntilExpiry = expirationTime - currentTime;
    
    // Se token expirou ou vai expirar em menos de 60 segundos
    if (timeUntilExpiry < 60000) {
        console.log("⏰ Token expirado ou prestes a expirar. Renovando...");
        
        const refreshToken = pm.environment.get("refreshToken");
        
        if (!refreshToken) {
            console.log("❌ Nenhum refresh token encontrado");
            return;
        }
        
        // Faz requisição para renovar o token
        pm.sendRequest({
            url: pm.environment.get("baseUrl") + '/auth/refresh',
            method: 'POST',
            header: {
                'Content-Type': 'application/json',
            },
            body: {
                mode: 'raw',
                raw: JSON.stringify({
                    refreshToken: refreshToken
                })
            }
        }, function (err, response) {
            if (err) {
                console.log("❌ Erro ao renovar token:", err);
                return;
            }
            
            const jsonData = response.json();
            
            if (jsonData.accessToken && jsonData.refreshToken) {
                pm.environment.set("accessToken", jsonData.accessToken);
                pm.environment.set("refreshToken", jsonData.refreshToken);
                console.log("✅ Token renovado automaticamente!");
            }
        });
    } else {
        console.log("✅ Token ainda válido");
    }
}
```

---

## 💡 Exemplos Práticos

### Cenário 1: Primeiro Acesso

```bash
# 1. Fazer login
POST /auth/login
Body: { "email": "admin@admin.com", "senha": "admin123" }

# Resposta: accessToken + refreshToken

# 2. Acessar rotas protegidas
GET /auth/profile
Authorization: Bearer {accessToken}

# 3. Criar abastecimento
POST /abastecimento
Authorization: Bearer {accessToken}
Body: { ... dados do abastecimento ... }
```

### Cenário 2: Token Expirado (após 15 minutos)

```bash
# 1. Tentar acessar rota protegida
GET /auth/profile
Authorization: Bearer {accessToken_expirado}

# Resposta: 401 Unauthorized

# 2. Renovar token usando refresh token
POST /auth/refresh
Body: { "refreshToken": "{seu_refresh_token}" }

# Resposta: novo accessToken + novo refreshToken

# 3. Usar novo access token
GET /auth/profile
Authorization: Bearer {novo_accessToken}

# Resposta: 200 OK
```

### Cenário 3: Logout e Segurança

```bash
# 1. Fazer logout
POST /auth/logout
Authorization: Bearer {accessToken}

# Todos os refresh tokens são revogados

# 2. Tentar renovar token
POST /auth/refresh
Body: { "refreshToken": "{refresh_token_antigo}" }

# Resposta: 401 - Refresh token revogado

# 3. Necessário fazer login novamente
POST /auth/login
Body: { "email": "admin@admin.com", "senha": "admin123" }
```

---

## 🔧 Solução de Problemas

### Erro: "Refresh token inválido"
**Causa:** Token não existe no banco de dados  
**Solução:** Faça login novamente

### Erro: "Refresh token expirado"
**Causa:** Token passou de 7 dias  
**Solução:** Faça login novamente

### Erro: "Refresh token revogado"
**Causa:** Você fez logout ou o token foi revogado por segurança  
**Solução:** Faça login novamente

### Erro: "Usuário inativo"
**Causa:** Sua conta foi desativada  
**Solução:** Contate o administrador

### Erro: 401 em rota protegida
**Causa:** Access token expirado ou inválido  
**Solução:** Renove o token usando o refresh token

---

## ⚠️ Nota Importante sobre JWT_REFRESH_SECRET

Você notou que há uma variável `JWT_REFRESH_SECRET` no arquivo `.env`, porém **ela não é utilizada** no código atual da API.

O sistema usa um **refresh token opaco** (string aleatória) ao invés de um JWT assinado para o refresh token. Isso é uma prática de segurança recomendada porque:

1. ✅ **Revogação facilitada**: Tokens são armazenados no banco e podem ser revogados
2. ✅ **Maior segurança**: Não há informações codificadas que possam ser decodificadas
3. ✅ **Controle total**: Banco de dados mantém registro completo de tokens ativos

Se no futuro você quiser usar JWT para refresh tokens também, a variável `JWT_REFRESH_SECRET` já está pronta no `.env`.

---

## 📚 Recursos Adicionais

- [Documentação NestJS Authentication](https://docs.nestjs.com/security/authentication)
- [JWT.io - Decodificador de Tokens](https://jwt.io/)
- [Postman Learning Center](https://learning.postman.com/)

---

## 🎯 Checklist de Boas Práticas

- ✅ Sempre armazene o refreshToken de forma segura (nunca no localStorage do browser)
- ✅ Use HTTPS em produção
- ✅ Implemente rate limiting no endpoint de refresh
- ✅ Faça logout ao detectar atividade suspeita
- ✅ Nunca compartilhe seus tokens
- ✅ Renove tokens antes de expirarem (implementar no frontend)
- ✅ Implemente refresh token rotation (já implementado na API)

---

**Última atualização:** Outubro 2025  
**Versão da API:** 1.0  
**Autor:** Sistema de Gerenciamento de Abastecimento


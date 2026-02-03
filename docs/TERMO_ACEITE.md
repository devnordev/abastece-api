# 📋 Sistema de Aceite de Termos

## Visão Geral

Sistema completo de aceite de termos de uso e política de privacidade (LGPD) para usuários do sistema Abastece. Implementado tanto no **web** quanto no **app mobile**.

## 🗄️ Estrutura do Banco de Dados

### Modelo `TermoAceite`

```prisma
model TermoAceite {
  id                Int       @id @default(autoincrement())
  usuarioId         Int
  versao            String    @default("1.0")
  aceito            Boolean   @default(false)
  ip_address        String?
  user_agent        String?
  plataforma        String?   // "web" ou "app"
  data_aceite       DateTime?
  created_date      DateTime  @default(now())
  modified_date     DateTime  @updatedAt

  usuario           Usuario   @relation(fields: [usuarioId], references: [id], onDelete: Cascade)

  @@unique([usuarioId, versao])
  @@index([usuarioId])
  @@index([versao])
  @@map("termo_aceite")
}
```

## 🚀 Como Aplicar a Migration

```bash
cd abastece-api
npm run prisma:migrate
```

Isso criará a tabela `termo_aceite` no banco de dados.

## 📡 Endpoints da API

### 1. Verificar Aceite
```
GET /termo-aceite/verificar
Authorization: Bearer {token}
```

**Resposta:**
```json
{
  "aceito": false,
  "versao": "1.0",
  "data_aceite": null,
  "termoAceite": null
}
```

### 2. Aceitar Termo
```
POST /termo-aceite/aceitar
Authorization: Bearer {token}
Content-Type: application/json

{
  "aceito": true,
  "versao": "1.0",
  "plataforma": "web"
}
```

**Resposta:**
```json
{
  "id": 1,
  "usuarioId": 123,
  "versao": "1.0",
  "aceito": true,
  "data_aceite": "2025-01-29T10:00:00Z",
  "plataforma": "web",
  "created_date": "2025-01-29T10:00:00Z",
  "modified_date": "2025-01-29T10:00:00Z"
}
```

### 3. Histórico de Aceites
```
GET /termo-aceite/historico
Authorization: Bearer {token}
```

## 🌐 Integração no Web

### Componente Principal
- **Arquivo:** `abastece-web-novo/src/components/termo-aceite-modal.tsx`
- **Provider:** `abastece-web-novo/src/components/termo-aceite-provider.tsx`
- **API Client:** `abastece-web-novo/src/lib/api/termo-aceite.ts`

### Como Usar

1. Adicione o `TermoAceiteProvider` no layout principal:

```tsx
// app/layout.tsx ou app/(prefeitura)/prefeitura/layout.tsx
import { TermoAceiteProvider } from "@/components/termo-aceite-provider";

export default function Layout({ children }) {
  return (
    <TermoAceiteProvider>
      {children}
    </TermoAceiteProvider>
  );
}
```

2. O provider automaticamente:
   - Verifica se o usuário já aceitou o termo após o login
   - Exibe o modal se o termo não foi aceito
   - Bloqueia o acesso até que o termo seja aceito

## 📱 Integração no App Mobile

### Componente Principal
- **Arquivo:** `abastece-app/components/TermoAceiteModal.tsx`
- **API Client:** `abastece-app/lib/termo-aceite.ts`

### Como Usar

1. No `AuthProvider` ou após o login, verifique o aceite:

```tsx
import { verificarAceiteTermo, aceitarTermo } from "../lib/termo-aceite";
import TermoAceiteModal from "../components/TermoAceiteModal";

// Após login bem-sucedido
const resultado = await verificarAceiteTermo();
if (!resultado.aceito) {
  setShowTermoModal(true);
}

// No componente
<TermoAceiteModal
  visible={showTermoModal}
  onAceitar={async () => {
    await aceitarTermo({
      aceito: true,
      plataforma: "app",
    });
    setShowTermoModal(false);
  }}
/>
```

## 🔄 Fluxo de Funcionamento

1. **Primeiro Login:**
   - Usuário faz login
   - Sistema verifica se há aceite do termo
   - Se não houver, exibe modal obrigatório
   - Usuário deve aceitar para continuar

2. **Logins Subsequentes:**
   - Sistema verifica se o termo foi aceito
   - Se aceito, permite acesso normal
   - Se não aceito, exibe modal novamente

3. **Atualização de Versão:**
   - Quando o termo for atualizado (nova versão)
   - Sistema detecta que o usuário aceitou versão antiga
   - Solicita novo aceite da versão atual

## 📝 Personalização do Termo

Para alterar o conteúdo do termo, edite:

- **Web:** `abastece-web-novo/src/components/termo-aceite-modal.tsx` (constante `TERMO_CONTEUDO`)
- **App:** `abastece-app/components/TermoAceiteModal.tsx` (constante `TERMO_CONTEUDO`)

Para alterar a versão do termo, edite:

- **API:** `abastece-api/src/modules/termo-aceite/termo-aceite.service.ts` (constante `TERMO_VERSAO`)

## ✅ Checklist de Implementação

- [x] Modelo Prisma criado
- [x] Migration criada (precisa executar)
- [x] Módulo/Serviço/Controller na API
- [x] Endpoints funcionais
- [x] Componente modal no web
- [x] Provider de verificação no web
- [x] Componente modal no app
- [x] API client no app
- [ ] Integração no fluxo de login (web e app)
- [ ] Testes end-to-end

## 🧪 Testando

1. **Criar migration:**
```bash
cd abastece-api
npm run prisma:migrate
```

2. **Testar endpoint:**
```bash
# Fazer login primeiro para obter token
curl -X GET http://localhost:3001/termo-aceite/verificar \
  -H "Authorization: Bearer {token}"
```

3. **Aceitar termo:**
```bash
curl -X POST http://localhost:3001/termo-aceite/aceitar \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{"aceito": true, "plataforma": "web"}'
```

## 📌 Notas Importantes

- O termo é **obrigatório** - usuários não podem usar o sistema sem aceitar
- Cada versão do termo requer novo aceite
- O histórico de aceites é mantido para auditoria
- IP e User Agent são registrados para segurança
- A plataforma (web/app) é registrada para análise

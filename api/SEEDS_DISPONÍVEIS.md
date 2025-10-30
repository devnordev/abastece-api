# 🌱 Seeds Disponíveis no Sistema

Este arquivo lista todos os seeds disponíveis no projeto, suas finalidades e como executá-los.

## 📋 Lista de Seeds

### 👑 **1. SUPER_ADMIN - Sistema Completo**
- **Arquivo**: `prisma/seed_superadmin.ts`
- **Usuário**: SUPER_ADMIN com acesso total
- **Finalidade**: Demonstrar TODOS os módulos do sistema
- **Dados**: 15 módulos completos com relacionamentos

**Como executar:**
```bash
npm run seed:superadmin
# ou
npx ts-node prisma/seed_superadmin.ts
```

**Credenciais:**
- 📧 **Email**: `superadmin@nordev.com`
- 🔑 **Senha**: `123456`
- 👑 **Tipo**: SUPER_ADMIN

---

### 🏛️ **2. ADMIN_PREFEITURA - Gestão Municipal**
- **Arquivo**: `prisma/seed_admin_pref.ts`
- **Usuário**: ADMIN_PREFEITURA (Prefeitura de Campinas)
- **Finalidade**: Gestão completa de uma prefeitura específica
- **Dados**: 12 módulos municipais com frota e equipe

**Como executar:**
```bash
npm run seed:admin-pref
# ou
npx ts-node prisma/seed_admin_pref.ts
```

**Credenciais:**
- 📧 **Email**: `admin@campinas.sp.gov.br`
- 🔑 **Senha**: `123456`
- 👑 **Tipo**: ADMIN_PREFEITURA
- 🏛️ **Prefeitura**: Campinas

---

### 👤 **3. COLABORADOR_PREFEITURA - Operações Municipais**
- **Arquivo**: `prisma/seed_colaborador_pref.ts`
- **Usuário**: COLABORADOR_PREFEITURA (Prefeitura de Ribeirão Preto)
- **Finalidade**: Operações do dia a dia de um colaborador municipal
- **Dados**: 9 módulos operacionais com cadastros e solicitações

**Como executar:**
```bash
npm run seed:colaborador-pref
# ou
npx ts-node prisma/seed_colaborador_pref.ts
```

**Credenciais:**
- 📧 **Email**: `fernanda.santos@ribeiraopreto.sp.gov.br`
- 🔑 **Senha**: `123456`
- 👤 **Tipo**: COLABORADOR_PREFEITURA
- 🏛️ **Prefeitura**: Ribeirão Preto
- 🏢 **Órgãos**: SMS + SME

---

### 🌱 **4. SEED Básico - Dados Essenciais**
- **Arquivo**: `prisma/seed.ts`
- **Usuário**: Múltiplos usuários básicos
- **Finalidade**: Dados mínimos para funcionamento
- **Dados**: Estrutura básica do sistema

**Como executar:**
```bash
npm run prisma:seed
# ou
npx ts-node prisma/seed.ts
```

---

### 🏛️ **5. SEED Completo - Palmeira dos Índios**
- **Arquivo**: `prisma/seed-completo.ts`
- **Usuário**: Cenário completo da cidade
- **Finalidade**: Dados realistas de uma cidade específica
- **Dados**: Cenário completo com dados da cidade de Palmeira dos Índios, AL

**Como executar:**
```bash
npm run prisma:seed:completo
# ou
npx ts-node prisma/seed-completo.ts
```

## 🎯 Comparação dos Seeds

| Seed | Usuário Principal | Foco | Módulos | Dados |
|------|-------------------|------|---------|-------|
| **SUPER_ADMIN** | Super Admin | Sistema Completo | 15 | Todos os tipos |
| **ADMIN_PREFEITURA** | Admin Municipal | Gestão Municipal | 12 | Foco em prefeitura |
| **COLABORADOR_PREFEITURA** | Colaborador Municipal | Operações Diárias | 9 | Operacional |
| **Básico** | Múltiplos | Funcionalidades | 8 | Estrutura mínima |
| **Completo** | Múltiplos | Cenário Real | 10 | Cidade específica |

## 🚀 Comandos NPM Disponíveis

### Seeds Especializados
```bash
# Super Admin - Sistema completo
npm run seed:superadmin

# Admin Prefeitura - Gestão municipal
npm run seed:admin-pref
```

### Seeds Tradicionais
```bash
# Seed básico
npm run prisma:seed

# Seed completo (Palmeira dos Índios)
npm run prisma:seed:completo
```

### Aliases Prisma
```bash
# Super Admin
npm run prisma:seed:superadmin

# Admin Prefeitura  
npm run prisma:seed:admin-pref

# Colaborador Prefeitura
npm run prisma:seed:colaborador-pref
```

## 🛠️ Scripts de Setup Automático

### Windows (Batch)
```bash
# Super Admin
scripts/setup-superadmin.bat

# Admin Prefeitura
scripts/setup-admin-pref.bat

# Colaborador Prefeitura
scripts/setup-colaborador-pref.bat
```

### Linux/Mac (Shell)
```bash
# Super Admin
chmod +x scripts/setup-superadmin.sh
./scripts/setup-superadmin.sh

# Admin Prefeitura
chmod +x scripts/setup-admin-pref.sh
./scripts/setup-admin-pref.sh

# Colaborador Prefeitura
chmod +x scripts/setup-colaborador-pref.sh
./scripts/setup-colaborador-pref.sh
```

## 📊 Módulos por Seed

### 👑 **SUPER_ADMIN (15 módulos)**
1. ✅ Super Admin
2. ✅ Prefeituras (2)
3. ✅ Órgãos (3)
4. ✅ Empresas (2)
5. ✅ Usuários (5 tipos)
6. ✅ Combustíveis (4)
7. ✅ Categorias (3)
8. ✅ Motoristas (3)
9. ✅ Veículos (3)
10. ✅ Processos (2)
11. ✅ Contratos (2)
12. ✅ Cotas (3)
13. ✅ Abastecimentos (2)
14. ✅ Vinculações (múltiplas)
15. ✅ Faturamento (2)

### 🏛️ **ADMIN_PREFEITURA (12 módulos)**
1. ✅ Prefeitura (1 - Campinas)
2. ✅ Admin Prefeitura (1)
3. ✅ Órgãos (5)
4. ✅ Colaboradores (4)
5. ✅ Categorias (6)
6. ✅ Motoristas (4)
7. ✅ Veículos (6)
8. ✅ Vinculações (9)
9. ✅ Faturamento (5)
10. ✅ Processo Municipal (1)
11. ✅ Cotas por Órgão (7)
12. ✅ Abastecimentos (3)

### 👤 **COLABORADOR_PREFEITURA (9 módulos)**
1. ✅ Prefeitura (1 - Ribeirão Preto)
2. ✅ Colaborador Principal (1)
3. ✅ Órgãos vinculados (2)
4. ✅ Categorias criadas (6)
5. ✅ Motoristas cadastrados (5)
6. ✅ Veículos cadastrados (5)
7. ✅ Solicitações Abastecimento (4)
8. ✅ Abastecimentos aprovados (2)
9. ✅ Vinculações operacionais (7)

## 🎯 Cenários de Uso

### **Para Desenvolvimento Completo:**
```bash
npm run seed:superadmin
```
- Use quando precisar testar TODOS os módulos
- Ideal para desenvolvimento de novas features
- Demonstra todas as funcionalidades

### **Para Testes de Prefeitura (Admin):**
```bash
npm run seed:admin-pref
```
- Use para testar gestão municipal completa
- Foco em um admin de prefeitura específica
- Cenário de administração municipal

### **Para Testes Operacionais (Colaborador):**
```bash
npm run seed:colaborador-pref
```
- Use para testar operações do dia a dia
- Foco em colaborador municipal específico
- Cenário operacional realista

### **Para Testes Básicos:**
```bash
npm run prisma:seed
```
- Use para testes rápidos
- Dados mínimos necessários
- Desenvolvimento de features específicas

### **Para Demonstração:**
```bash
npm run prisma:seed:completo
```
- Use para apresentações
- Dados realistas de cidade
- Cenário completo e coerente

## ⚠️ Pré-requisitos

Antes de executar qualquer seed:

1. **PostgreSQL** rodando em `localhost:5432`
2. **Banco de dados** criado (conforme `.env`)
3. **Dependências** instaladas: `npm install`
4. **Prisma Client** gerado: `npx prisma generate`
5. **Migrações** aplicadas: `npx prisma migrate deploy`

## 🔄 Reset do Banco

Se precisar limpar completamente:

```bash
# Reset completo
npx prisma migrate reset --force

# Gerar client
npx prisma generate

# Executar seed desejado
npm run seed:superadmin
```

## 🎉 Após Executar

1. **Inicie a aplicação**: `npm run start:dev`
2. **Acesse**: http://localhost:3000
3. **Documentação**: http://localhost:3000/api/docs
4. **Prisma Studio**: `npx prisma studio`
5. **Faça login** com as credenciais do seed escolhido

---

**💡 Dica**: Comece com o seed que melhor atende ao seu caso de uso específico!

**🚀 Para desenvolvimento completo, use o `seed:superadmin`**
**🏛️ Para testes administrativos, use o `seed:admin-pref`**
**👤 Para testes operacionais, use o `seed:colaborador-pref`**

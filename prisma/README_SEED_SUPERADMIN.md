# 👑 Seed Super Admin - Sistema Completo

Este arquivo contém um seed especializado que demonstra **todos os módulos e funcionalidades** que um usuário do tipo **SUPER_ADMIN** pode gerenciar no sistema.

## 🎯 Objetivo

Criar um ambiente completo de testes que inclui:
- ✅ Todos os tipos de usuários
- ✅ Todas as entidades do sistema
- ✅ Relacionamentos complexos
- ✅ Dados realistas para testes
- ✅ Demonstração de todas as funcionalidades

## 🚀 Como Executar

### Método 1: Comando NPM
```bash
npm run seed:superadmin
```

### Método 2: Execução Direta
```bash
npx ts-node prisma/seed_superadmin.ts
```

### Método 3: Com Prisma
```bash
npx prisma db seed --schema prisma/schema.prisma
```

## 📊 Dados Criados

### 👥 **1. USUÁRIOS (5 perfis diferentes)**
| Tipo | Email | Senha | Descrição |
|------|-------|-------|-----------|
| **SUPER_ADMIN** | `superadmin@nordev.com` | `123456` | Acesso total ao sistema |
| **ADMIN_PREFEITURA** | `admin@prefeitura.sp.gov.br` | `123456` | Gerencia prefeitura SP |
| **COLABORADOR_PREFEITURA** | `colaborador@prefeitura.sp.gov.br` | `123456` | Acesso limitado prefeitura |
| **ADMIN_EMPRESA** | `admin@postoshell.com` | `123456` | Gerencia Posto Shell |
| **COLABORADOR_EMPRESA** | `colaborador@postoshell.com` | `123456` | Acesso limitado empresa |

### 🏛️ **2. PREFEITURAS (2 municípios)**
- **Prefeitura Municipal de São Paulo**
  - CNPJ: `12345678000195`
  - Email: `admin@prefeitura.sp.gov.br`
- **Prefeitura Municipal de Santos**
  - CNPJ: `12345678000196`
  - Email: `admin@prefeitura.santos.sp.gov.br`

### 🏢 **3. ÓRGÃOS (3 secretarias)**
- **Secretaria Municipal de Saúde (SMS)** - São Paulo
- **Secretaria Municipal de Educação (SME)** - São Paulo
- **Secretaria Municipal de Transportes (SMT)** - Santos

### ⛽ **4. EMPRESAS/POSTOS (2 fornecedores)**
- **Posto Shell - Centro**
  - CNPJ: `98765432000123`
  - Bandeira: Shell
  - Avaliação: 4.5⭐
- **Posto Ipiranga - Centro**
  - CNPJ: `98765432000124`
  - Bandeira: Ipiranga
  - Avaliação: 4.2⭐

### 🔥 **5. COMBUSTÍVEIS (4 tipos)**
- **Gasolina Comum** (`GAS_COMUM`)
- **Gasolina Aditivada** (`GAS_ADITIVADA`)
- **Etanol** (`ETANOL`)
- **Diesel S10** (`DIESEL_S10`)

### 📂 **6. CATEGORIAS (3 classificações)**
- **Ambulâncias** (VEICULO)
- **Veículos Administrativos** (VEICULO)
- **Motoristas de Emergência** (MOTORISTA)

### 🚗 **7. MOTORISTAS (3 condutores)**
- **João Silva Santos** - CPF: `55555555555` - CNH: `12345678901`
- **Maria das Graças Oliveira** - CPF: `66666666666` - CNH: `98765432109`
- **Pedro Santos** - CPF: `77777777777` - CNH: `34567890123`

### 🚑 **8. VEÍCULOS (3 da frota)**
- **Ambulância 01** - Placa: `ABC1234` - Ford Transit 2020
- **Carro Administrativo 01** - Placa: `XYZ9999` - Chevrolet Onix 2023
- **Van Social 01** - Placa: `DEF5678` - Mercedes Sprinter 2021

### 📋 **9. PROCESSOS (2 tipos)**
- **Processo OBJETIVO** - `PROC-2024-001`
  - Prefeitura: São Paulo
  - Valor: R$ 200.000,00
  - Litros: 25.000L
- **Processo CONSORCIADO** - `CONS-2024-001`
  - Consórcio intermunicipal
  - Status: ATIVO

### 📄 **10. CONTRATOS (2 acordos)**
- **Contrato Shell** - Vigência: 2024
- **Contrato Ipiranga** - Vigência: 2024

### 📊 **11. COTAS DE ÓRGÃO (3 cotas)**
- **Saúde**: 5.000L Gasolina + 3.000L Etanol
- **Educação**: 2.500L Gasolina

### ⛽ **12. ABASTECIMENTOS (2 históricos)**
- **Ambulância**: 50.5L Gasolina - R$ 275,25
- **Carro Admin**: 30L Etanol - R$ 124,50

### 💰 **13. CONTAS DE FATURAMENTO (2 contas)**
- **Conta Faturamento Saúde**
- **Conta Faturamento Educação**

## 🔐 Acesso ao Sistema

### Credenciais do Super Admin
```
📧 Email: superadmin@nordev.com
🔑 Senha: 123456
👑 Tipo: SUPER_ADMIN
```

### URLs do Sistema
```
🚀 API: http://localhost:3000
📚 Swagger: http://localhost:3000/api/docs
```

## 🎯 Módulos Acessíveis ao SUPER_ADMIN

O usuário **SUPER_ADMIN** tem acesso completo a:

### 📊 **Gestão de Usuários**
- ✅ Criar/editar usuários de todos os tipos
- ✅ Ativar/desativar usuários
- ✅ Gerenciar permissões
- ✅ Vincular usuários a órgãos

### 🏛️ **Gestão de Prefeituras**
- ✅ Cadastrar prefeituras
- ✅ Gerenciar dados administrativos
- ✅ Configurar cupom fiscal
- ✅ Ativar/desativar prefeituras

### 🏢 **Gestão de Órgãos**
- ✅ Criar órgãos para prefeituras
- ✅ Definir hierarquia administrativa
- ✅ Gerenciar contas de faturamento

### ⛽ **Gestão de Empresas**
- ✅ Cadastrar postos de gasolina
- ✅ Gerenciar dados comerciais
- ✅ Definir localização e serviços
- ✅ Avaliar performance

### 🔥 **Gestão de Combustíveis**
- ✅ Cadastrar tipos de combustível
- ✅ Definir preços e margens
- ✅ Gerenciar disponibilidade

### 📂 **Gestão de Categorias**
- ✅ Criar categorias para veículos
- ✅ Classificar motoristas
- ✅ Organizar recursos

### 🚗 **Gestão de Motoristas**
- ✅ Cadastrar condutores
- ✅ Gerenciar CNH e documentos
- ✅ Controlar habilitações

### 🚑 **Gestão de Veículos**
- ✅ Cadastrar frota municipal
- ✅ Definir tipos de abastecimento
- ✅ Associar combustíveis permitidos
- ✅ Vincular motoristas

### 📋 **Gestão de Processos**
- ✅ Criar processos licitatórios
- ✅ Gerenciar contratos OBJETIVO
- ✅ Coordenar CONSÓRCIOS
- ✅ Controlar prazos e valores

### 📄 **Gestão de Contratos**
- ✅ Formalizar acordos comerciais
- ✅ Definir vigência e valores
- ✅ Gerenciar documentos
- ✅ Associar combustíveis

### 📊 **Gestão de Cotas**
- ✅ Definir cotas por órgão
- ✅ Controlar consumo
- ✅ Monitorar saldos
- ✅ Gerar relatórios

### ⛽ **Gestão de Abastecimentos**
- ✅ Aprovar/rejeitar abastecimentos
- ✅ Controlar NFe
- ✅ Validar preços
- ✅ Auditar consumo

### 🔗 **Gestão de Relacionamentos**
- ✅ Vincular usuários a órgãos
- ✅ Associar veículos a motoristas
- ✅ Conectar combustíveis a contratos
- ✅ Relacionar processos a prefeituras

## 📈 Cenários de Teste

### ✅ **Cenário 1: Gestão Completa de Prefeitura**
1. Login como SUPER_ADMIN
2. Visualizar prefeituras cadastradas
3. Gerenciar órgãos e usuários
4. Controlar veículos e motoristas

### ✅ **Cenário 2: Aprovação de Abastecimentos**
1. Visualizar solicitações pendentes
2. Validar documentos (NFe)
3. Aprovar/rejeitar abastecimentos
4. Monitorar consumo por órgão

### ✅ **Cenário 3: Gestão de Processos Licitatórios**
1. Criar novo processo OBJETIVO
2. Definir cotas por órgão
3. Associar combustíveis
4. Controlar prazos e valores

### ✅ **Cenário 4: Análise de Relatórios**
1. Relatórios de consumo por órgão
2. Análise de custos por combustível
3. Performance de fornecedores
4. Controle de frota

## 🚨 Importantes

### ⚠️ **Pré-requisitos**
- **PostgreSQL rodando** em `localhost:5432`
- **Banco de dados criado** (conforme `.env`)
- **Prisma Client gerado** (`npx prisma generate`)
- **Dependências instaladas** (`npm install`)
- **Migrações aplicadas** (`npx prisma migrate deploy`)

### 🔄 **Setup Completo do Zero**
```bash
# 1. Configurar variáveis de ambiente
cp .env.example .env
# Editar DATABASE_URL no arquivo .env

# 2. Instalar dependências
npm install

# 3. Configurar banco de dados
npx prisma generate
npx prisma migrate reset --force

# 4. Executar seed do SUPER_ADMIN
npm run seed:superadmin
```

### 🛠️ **Setup Rápido (se banco já existe)**
```bash
npx prisma generate
npm run seed:superadmin
```

### 🧪 **Para Desenvolvimento**
```bash
# Limpar e popular banco
npm run db:reset
npm run seed:superadmin

# Iniciar aplicação
npm run start:dev
```

## 🎉 Resultado Esperado

Após executar o seed, você terá:
- ✅ Sistema totalmente populado
- ✅ Todos os módulos funcionais
- ✅ Dados realistas para testes
- ✅ Relacionamentos complexos
- ✅ Cenários de uso completos

**Agora você pode testar todas as funcionalidades do sistema como SUPER_ADMIN!** 🚀

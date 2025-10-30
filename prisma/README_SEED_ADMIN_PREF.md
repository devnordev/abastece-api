# 🏛️ Seed Admin Prefeitura - Gestão Municipal Completa

Este arquivo contém um seed especializado que demonstra **todos os módulos e funcionalidades** que um usuário do tipo **ADMIN_PREFEITURA** pode gerenciar no sistema.

## 🎯 Objetivo

Criar um ambiente completo de testes focado na **gestão municipal**, incluindo:
- ✅ Administração da própria prefeitura
- ✅ Gestão completa de órgãos municipais
- ✅ Controle total da frota municipal
- ✅ Gerenciamento de usuários municipais
- ✅ Processos licitatórios municipais
- ✅ Controle de cotas e abastecimentos

## 🚀 Como Executar

### Método 1: Comando NPM (Recomendado)
```bash
npm run seed:admin-pref
```

### Método 2: Execução Direta
```bash
npx ts-node prisma/seed_admin_pref.ts
```

### Método 3: Script de Setup
```bash
# Windows
scripts/setup-admin-pref.bat

# Linux/Mac
chmod +x scripts/setup-admin-pref.sh
./scripts/setup-admin-pref.sh
```

## 📊 Cenário Implementado

### 🏛️ **Prefeitura Municipal de Campinas**
- **CNPJ**: `15555666000190`
- **Email**: `admin@campinas.sp.gov.br`
- **Localização**: Campinas, SP
- **Status**: Ativa, com cupom fiscal obrigatório

### 👑 **Admin Principal**
- **Nome**: Carlos Eduardo Silva
- **Email**: `admin@campinas.sp.gov.br`
- **CPF**: `12345678901`
- **Telefone**: `19987654321`
- **Acesso**: Todos os órgãos da prefeitura

## 📋 Dados Criados Detalhadamente

### 🏢 **1. ÓRGÃOS MUNICIPAIS (5 secretarias)**

| Órgão | Sigla | Responsabilidade |
|-------|-------|------------------|
| **Secretaria Municipal de Saúde** | SMS | Ambulâncias e emergências médicas |
| **Secretaria Municipal de Educação** | SME | Transporte escolar |
| **Secretaria Municipal de Obras** | SMO | Máquinas pesadas e obras |
| **Secretaria de Assistência Social** | SAS | Atendimento social domiciliar |
| **Gabinete do Prefeito** | GAB | Veículos executivos |

### 👥 **2. USUÁRIOS DA PREFEITURA (5 colaboradores)**

| Nome | Email | Órgão | Função |
|------|--------|-------|--------|
| **Carlos Eduardo Silva** | `admin@campinas.sp.gov.br` | Todos | Admin Principal |
| **Ana Paula Santos** | `colaborador.saude@campinas.sp.gov.br` | SMS | Colaborador Saúde |
| **José Roberto Lima** | `colaborador.educacao@campinas.sp.gov.br` | SME | Colaborador Educação |
| **Miguel Fernandes** | `colaborador.obras@campinas.sp.gov.br` | SMO | Colaborador Obras |
| **Maria Aparecida Costa** | `colaborador.assistencia@campinas.sp.gov.br` | SAS | Colaborador Assistência |

### 📂 **3. CATEGORIAS MUNICIPAIS (6 classificações)**

#### **Categorias de Veículos:**
- **Ambulâncias** - Veículos de emergência médica
- **Transporte Escolar** - Veículos para estudantes
- **Veículos de Obras** - Caminhões e máquinas pesadas
- **Administrativos** - Carros para uso administrativo

#### **Categorias de Motoristas:**
- **Motoristas de Emergência** - Condutores habilitados para emergências
- **Motoristas Escolares** - Especializados em transporte escolar

### 🚗 **4. MOTORISTAS ESPECIALIZADOS (4 condutores)**

| Nome | CPF | CNH | Categoria | Especialidade |
|------|-----|-----|-----------|---------------|
| **João Carlos da Silva** | `11122233344` | `12345678901` | D | Ambulâncias (20 anos exp.) |
| **Maria José Santos** | `22233344455` | `23456789012` | D | Transporte Escolar |
| **Pedro Henrique Costa** | `33344455566` | `34567890123` | E | Máquinas Pesadas (15 anos) |
| **Carlos Alberto Ferreira** | `44455566677` | `45678901234` | B | Veículos Administrativos |

### 🚑 **5. FROTA MUNICIPAL (6 veículos)**

#### **🚑 Secretaria de Saúde (2 ambulâncias)**
- **Ambulância UTI 01** - `CAM1234` - Mercedes Sprinter 415/2021
  - Equipada com UTI móvel completa
  - Capacidade: 100L, Tipo: COTA, Periodicidade: Semanal (200L)
- **Ambulância Básica 01** - `CAM5678` - Fiat Ducato/2020
  - Para transporte de pacientes estáveis
  - Capacidade: 90L, Tipo: COTA, Periodicidade: Semanal (150L)

#### **🚌 Secretaria de Educação (1 micro-ônibus)**
- **Micro-ônibus Escolar 01** - `CAM9012` - Iveco Daily/2022
  - 25 passageiros com cintos de segurança
  - Capacidade: 120L, Tipo: COTA, Periodicidade: Semanal (300L)

#### **🚛 Secretaria de Obras (1 caminhão)**
- **Caminhão Basculante 01** - `CAM3456` - VW Constellation/2019
  - Para obras e limpeza urbana
  - Capacidade: 200L, Tipo: COTA, Periodicidade: Semanal (400L)

#### **🚐 Secretaria de Assistência (1 van)**
- **Van Assistência Social 01** - `CAM7890` - Renault Master/2021
  - 14 passageiros para atendimento domiciliar
  - Capacidade: 80L, Tipo: LIVRE

#### **🚗 Gabinete do Prefeito (1 carro)**
- **Carro Administrativo 01** - `CAM2468` - Honda Civic/2023
  - Veículo executivo
  - Capacidade: 50L, Tipo: COM_AUTORIZACAO

### 📋 **6. PROCESSO LICITATÓRIO MUNICIPAL**

**Processo Principal:**
- **Número**: `PROC-CAMP-2024-001`
- **Documento**: `LICIT-CAMP-2024-001`
- **Tipo**: LICITACAO (Pregão Eletrônico)
- **Valor Estimado**: R$ 400.000,00
- **Litros Estimados**: 50.000L anuais
- **Vigência**: 12 meses (2024)

**Combustíveis do Processo:**
- **Gasolina Comum**: 15.000L - R$ 5,80/L - R$ 87.000,00
- **Etanol**: 10.000L - R$ 4,50/L - R$ 45.000,00
- **Diesel S10**: 25.000L - R$ 6,20/L - R$ 155.000,00

### 📊 **7. COTAS POR ÓRGÃO (7 cotas distribuídas)**

| Órgão | Combustível | Cota Total | Utilizado | Restante | Saldo (R$) |
|-------|-------------|------------|-----------|----------|------------|
| **SMS** | Diesel S10 | 10.000L | 2.500L | 7.500L | R$ 46.500 |
| **SME** | Diesel S10 | 8.000L | 1.800L | 6.200L | R$ 38.440 |
| **SMO** | Diesel S10 | 7.000L | 3.200L | 3.800L | R$ 23.560 |
| **SAS** | Gasolina | 3.000L | 800L | 2.200L | R$ 12.760 |
| **SAS** | Etanol | 2.000L | 400L | 1.600L | R$ 7.200 |
| **GAB** | Gasolina | 1.500L | 300L | 1.200L | R$ 6.960 |
| **GAB** | Etanol | 1.000L | 150L | 850L | R$ 3.825 |

### ⛽ **8. HISTÓRICO DE ABASTECIMENTOS (3 aprovados)**

| Veículo | Motorista | Combustível | Quantidade | Valor | Status |
|---------|-----------|-------------|------------|-------|--------|
| **Ambulância UTI** | João Carlos | Diesel S10 | 80L | R$ 492,00 | Aprovado |
| **Micro-ônibus Escolar** | Maria José | Diesel S10 | 100L | R$ 615,00 | Aprovado |
| **Van Assistência** | Carlos Alberto | Gasolina | 60L | R$ 345,00 | Aprovado |

### 💰 **9. CONTAS DE FATURAMENTO (5 contas por órgão)**

- **Conta Faturamento Saúde** - Controle SMS
- **Conta Faturamento Educação** - Controle SME
- **Conta Faturamento Obras** - Controle SMO
- **Conta Faturamento Assistência** - Controle SAS
- **Conta Faturamento Gabinete** - Controle GAB

## 🔐 Credenciais de Acesso

### Admin Principal
```
📧 Email: admin@campinas.sp.gov.br
🔑 Senha: 123456
👑 Tipo: ADMIN_PREFEITURA
🏛️ Prefeitura: Campinas
```

### Colaboradores (mesma senha)
```
🔑 Senha: 123456
👥 Emails:
   • colaborador.saude@campinas.sp.gov.br
   • colaborador.educacao@campinas.sp.gov.br
   • colaborador.obras@campinas.sp.gov.br
   • colaborador.assistencia@campinas.sp.gov.br
```

## 🎯 Módulos Acessíveis ao ADMIN_PREFEITURA

### ✅ **Gestão da Própria Prefeitura**
- **Editar dados** da prefeitura
- **Configurar** cupom fiscal
- **Gerenciar** email administrativo
- **Controlar** status ativo/inativo

### ✅ **Gestão Completa de Órgãos**
- **Criar** novos órgãos
- **Editar** nome, sigla e descrição
- **Ativar/desativar** órgãos
- **Organizar** estrutura administrativa

### ✅ **Gestão de Usuários Municipais**
- **Criar** colaboradores da prefeitura
- **Definir** permissões por órgão
- **Vincular** usuários a órgãos específicos
- **Controlar** status de acesso
- **Gerenciar** dados pessoais

### ✅ **Gestão Completa de Frota**
- **Cadastrar** veículos municipais
- **Definir** tipo de abastecimento
- **Configurar** cotas e periodicidade
- **Associar** veículos a órgãos
- **Vincular** combustíveis permitidos
- **Controlar** documentação

### ✅ **Gestão de Motoristas**
- **Cadastrar** condutores municipais
- **Gerenciar** CNH e categoria
- **Controlar** vencimentos
- **Vincular** a veículos específicos
- **Classificar** por especialidade

### ✅ **Gestão de Categorias**
- **Criar** categorias de veículos
- **Classificar** motoristas
- **Organizar** recursos por tipo
- **Facilitar** buscas e relatórios

### ✅ **Gestão de Processos Licitatórios**
- **Criar** processos OBJETIVO
- **Definir** quantidades e valores
- **Gerenciar** documentação
- **Controlar** prazos e vigência
- **Associar** combustíveis ao processo

### ✅ **Gestão de Cotas por Órgão**
- **Distribuir** cotas entre órgãos
- **Controlar** consumo por secretaria
- **Monitorar** saldos disponíveis
- **Realocar** cotas quando necessário

### ✅ **Gestão de Abastecimentos**
- **Aprovar/rejeitar** solicitações
- **Validar** preços e quantidades
- **Controlar** documentos fiscais
- **Monitorar** consumo da frota
- **Gerar** relatórios de gastos

### ✅ **Gestão Financeira**
- **Criar** contas de faturamento
- **Controlar** gastos por órgão
- **Monitorar** orçamento
- **Gerar** relatórios financeiros

## 🚫 Limitações do ADMIN_PREFEITURA

### ❌ **NÃO Pode Gerenciar:**
- **Outras prefeituras** (só a sua)
- **Empresas/Postos** (só visualiza)
- **Combustíveis** (só usa os cadastrados)
- **Usuários SUPER_ADMIN**
- **Configurações globais** do sistema

### 👁️ **Apenas Visualiza:**
- **Postos disponíveis** para contratos
- **Preços de combustíveis** do mercado
- **Empresas parceiras** do sistema

## 📈 Cenários de Teste

### ✅ **Cenário 1: Gestão Diária da Prefeitura**
1. Login como Admin Prefeitura
2. Visualizar dashboard municipal
3. Aprovar abastecimentos pendentes
4. Monitorar cotas por órgão
5. Gerenciar usuários e veículos

### ✅ **Cenário 2: Criação de Novo Órgão**
1. Criar nova secretaria
2. Cadastrar colaboradores
3. Vincular usuários ao órgão
4. Definir conta de faturamento
5. Cadastrar veículos do órgão

### ✅ **Cenário 3: Processo Licitatório**
1. Criar novo processo municipal
2. Definir quantidades por combustível
3. Distribuir cotas entre órgãos
4. Monitorar consumo e saldos
5. Aprovar abastecimentos

### ✅ **Cenário 4: Gestão de Frota**
1. Cadastrar novo veículo
2. Associar motoristas habilitados
3. Definir combustíveis permitidos
4. Configurar tipo de abastecimento
5. Monitorar consumo e manutenção

## 🚨 Pré-requisitos

### ⚠️ **Antes de Executar:**
- **PostgreSQL rodando** em `localhost:5432`
- **Banco de dados criado** (conforme `.env`)
- **Prisma Client gerado** (`npx prisma generate`)
- **Dependências instaladas** (`npm install`)
- **Migrações aplicadas** (`npx prisma migrate deploy`)

### 🔄 **Setup Completo:**
```bash
# 1. Configurar ambiente
cp .env.example .env
# Editar DATABASE_URL

# 2. Instalar dependências
npm install

# 3. Configurar banco
npx prisma generate
npx prisma migrate reset --force

# 4. Executar seed
npm run seed:admin-pref
```

## 🎉 Resultado Esperado

Após executar o seed, você terá:
- ✅ **Prefeitura completa** com 5 órgãos
- ✅ **Equipe municipal** com 5 usuários
- ✅ **Frota diversificada** com 6 veículos
- ✅ **Motoristas especializados** por área
- ✅ **Processo licitatório** ativo
- ✅ **Cotas distribuídas** por órgão
- ✅ **Histórico de abastecimentos**
- ✅ **Controle financeiro** por secretaria

**Agora você pode testar todas as funcionalidades de gestão municipal como ADMIN_PREFEITURA!** 🏛️🚀

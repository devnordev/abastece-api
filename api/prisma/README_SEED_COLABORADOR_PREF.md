# 👤 Seed Colaborador Prefeitura - Operações Municipais

Este arquivo contém um seed especializado que demonstra **todos os módulos e funcionalidades** que um usuário do tipo **COLABORADOR_PREFEITURA** pode gerenciar no sistema.

## 🎯 Objetivo

Criar um ambiente completo de testes focado nas **operações municipais do dia a dia**, incluindo:
- ✅ Cadastro de motoristas municipais
- ✅ Cadastro de veículos dos órgãos
- ✅ Criação de categorias organizacionais
- ✅ Solicitações de abastecimento
- ✅ Visualização de dados dos seus órgãos
- ✅ Acompanhamento de cotas e consumo

## 🚀 Como Executar

### Método 1: Comando NPM (Recomendado)
```bash
npm run seed:colaborador-pref
```

### Método 2: Execução Direta
```bash
npx ts-node prisma/seed_colaborador_pref.ts
```

### Método 3: Script de Setup
```bash
# Windows
scripts/setup-colaborador-pref.bat

# Linux/Mac
chmod +x scripts/setup-colaborador-pref.sh
./scripts/setup-colaborador-pref.sh
```

## 📊 Cenário Implementado

### 🏛️ **Prefeitura Municipal de Ribeirão Preto**
- **CNPJ**: `22333444000177`
- **Email**: `admin@ribeiraopreto.sp.gov.br`
- **Localização**: Ribeirão Preto, SP
- **Status**: Ativa, com cupom fiscal obrigatório

### 👤 **Colaboradora Principal - Fernanda Santos**
- **Nome**: Fernanda Santos Silva
- **Email**: `fernanda.santos@ribeiraopreto.sp.gov.br`
- **CPF**: `11223344556`
- **Telefone**: `16988776655`
- **Órgãos**: SMS (principal) + SME (apoio)
- **Função**: Responsável por cadastros operacionais

## 📋 Dados Criados Detalhadamente

### 🏢 **1. ÓRGÃOS MUNICIPAIS (3 secretarias - contexto)**

| Órgão | Sigla | Responsabilidade |
|-------|-------|------------------|
| **Secretaria Municipal de Saúde** | SMS | Ambulâncias e fiscalização sanitária |
| **Secretaria Municipal de Educação** | SME | Transporte educacional |
| **Secretaria Municipal de Transportes** | SMT | Transporte público |

### 👥 **2. EQUIPE MUNICIPAL (4 usuários)**

| Nome | Email | Tipo | Órgão(s) |
|------|--------|------|----------|
| **Fernanda Santos Silva** | `fernanda.santos@ribeiraopreto.sp.gov.br` | **COLABORADOR** | SMS + SME |
| **Marcos Lima Costa** | `marcos.lima@ribeiraopreto.sp.gov.br` | COLABORADOR | SME |
| **Patrícia Alves Mendes** | `patricia.alves@ribeiraopreto.sp.gov.br` | COLABORADOR | SMT |
| **Sandra Regina Oliveira** | `admin@ribeiraopreto.sp.gov.br` | ADMIN | Todos |

### 📂 **3. CATEGORIAS CRIADAS (6 organizacionais)**

#### **Categorias de Veículos (4):**
- **Emergência Médica** - Ambulâncias UTI e emergência
- **Transporte de Pacientes** - Ambulâncias básicas e transporte médico
- **Transporte Educacional** - Veículos para atividades educacionais
- **Veículos de Inspeção** - Carros para fiscalização sanitária

#### **Categorias de Motoristas (2):**
- **Motoristas de Emergência** - Condutores especializados em emergência
- **Motoristas de Transporte** - Condutores para transporte geral

### 🚗 **4. MOTORISTAS CADASTRADOS (5 condutores)**

| Nome | CPF | CNH | Cat. | Especialidade |
|------|-----|-----|------|---------------|
| **Roberto Carlos Mendes** | `12312312300` | `11223344556` | D | UTI e Emergências |
| **Cláudio Ferreira Silva** | `23423423411` | `22334455667` | D | Ambulância Básica |
| **Luciana Pereira Santos** | `34534534522` | `33445566778` | B | Transporte Educacional |
| **Anderson Luis Rodrigues** | `45645645633` | `44556677889` | B | Fiscalização Sanitária |
| **Regina Aparecida Costa** | `56756756744` | `55667788990` | D | Transporte Escolar |

### 🚑 **5. FROTA CADASTRADA (5 veículos)**

#### **🚑 Secretaria de Saúde (3 veículos)**
- **Ambulância UTI 02** - `RIB1234` - Mercedes Sprinter 319/2022
  - UTI móvel com equipamentos avançados
  - Capacidade: 90L, Tipo: COTA, Periodicidade: Semanal (180L)
- **Ambulância Básica 03** - `RIB5678` - Fiat Ducato 2.8/2021
  - Transporte inter-hospitalar e remoções
  - Capacidade: 85L, Tipo: COTA, Periodicidade: Semanal (140L)
- **Carro Inspeção Sanitária 01** - `RIB3456` - Chevrolet Onix Plus/2023
  - Vigilância sanitária e fiscalização
  - Capacidade: 44L, Tipo: COM_AUTORIZACAO

#### **🚌 Secretaria de Educação (2 veículos)**
- **Van Educacional 01** - `RIB9012` - Ford Transit 350L/2023
  - 15 passageiros para atividades educacionais
  - Capacidade: 80L, Tipo: LIVRE
- **Carro Administrativo Educação** - `RIB7890` - Volkswagen Virtus/2022
  - Veículo administrativo da SME
  - Capacidade: 50L, Tipo: COM_AUTORIZACAO

### 📋 **6. PROCESSO LICITATÓRIO (contexto)**

**Processo Principal:**
- **Número**: `PROC-RIB-2024-001`
- **Documento**: `LICIT-RIB-2024-001`
- **Valor Estimado**: R$ 280.000,00
- **Litros Estimados**: 35.000L anuais
- **Status**: ATIVO

**Combustíveis Contemplados:**
- **Gasolina Comum**: 12.000L - R$ 5,90/L
- **Etanol**: 8.000L - R$ 4,60/L  
- **Diesel S10**: 15.000L - R$ 6,30/L

### 📊 **7. COTAS POR ÓRGÃO (5 cotas - contexto)**

| Órgão | Combustível | Cota Total | Utilizado | Restante | Saldo (R$) |
|-------|-------------|------------|-----------|----------|------------|
| **SMS** | Diesel S10 | 8.000L | 1.200L | 6.800L | R$ 42.840 |
| **SMS** | Gasolina | 2.000L | 300L | 1.700L | R$ 10.030 |
| **SME** | Diesel S10 | 4.000L | 800L | 3.200L | R$ 20.160 |
| **SME** | Gasolina | 1.500L | 250L | 1.250L | R$ 7.375 |
| **SME** | Etanol | 1.000L | 150L | 850L | R$ 3.910 |

### ⚠️ **8. SOLICITAÇÕES DE ABASTECIMENTO (4 solicitações)**

| Veículo | Motorista | Combustível | Quantidade | Status | Valor |
|---------|-----------|-------------|------------|--------|-------|
| **Ambulância UTI** | Roberto | Diesel S10 | 85L | PENDENTE | R$ 535,50 |
| **Ambulância Básica** | Cláudio | Diesel S10 | 75L | APROVADA | R$ 472,50 |
| **Carro Inspeção** | Anderson | Gasolina | 40L | APROVADA | R$ 236,00 |
| **Van Educacional** | Luciana | Diesel S10 | 70L | PENDENTE | R$ 441,00 |

### ⛽ **9. ABASTECIMENTOS REALIZADOS (2 aprovados)**

| Veículo | Motorista | Combustível | Quantidade | Valor | Data |
|---------|-----------|-------------|------------|-------|------|
| **Ambulância Básica** | Cláudio | Diesel S10 | 75L | R$ 468,75 | 20/03 17:30 |
| **Carro Inspeção** | Anderson | Gasolina | 40L | R$ 234,00 | 21/03 11:15 |

## 🔐 Credenciais de Acesso

### Colaboradora Principal
```
📧 Email: fernanda.santos@ribeiraopreto.sp.gov.br
🔑 Senha: 123456
👤 Tipo: COLABORADOR_PREFEITURA
🏛️ Prefeitura: Ribeirão Preto
🏢 Órgãos: SMS (Saúde) + SME (Educação)
```

### Outros Colaboradores (mesma senha)
```
🔑 Senha: 123456
👥 Usuários:
   • marcos.lima@ribeiraopreto.sp.gov.br (SME)
   • patricia.alves@ribeiraopreto.sp.gov.br (SMT)
   • admin@ribeiraopreto.sp.gov.br (ADMIN - contexto)
```

## 🎯 Módulos Acessíveis ao COLABORADOR_PREFEITURA

### ✅ **Gestão de Categorias**
- **Criar** categorias para organização
- **Classificar** veículos por tipo
- **Organizar** motoristas por especialidade
- **Facilitar** buscas e relatórios
- **Personalizar** classificações da prefeitura

### ✅ **Gestão de Motoristas**
- **Cadastrar** condutores municipais
- **Gerenciar** CNH e documentos
- **Controlar** vencimentos
- **Atualizar** dados pessoais
- **Associar** a veículos específicos
- **Classificar** por especialidade

### ✅ **Gestão de Veículos (dos seus órgãos)**
- **Cadastrar** veículos dos órgãos vinculados
- **Definir** tipo de abastecimento
- **Configurar** cotas (se COTA)
- **Associar** combustíveis permitidos
- **Vincular** motoristas habilitados
- **Gerenciar** documentação
- **Atualizar** dados técnicos

### ✅ **Solicitações de Abastecimento**
- **Criar** solicitações para veículos
- **Definir** quantidade necessária
- **Escolher** posto/empresa
- **Acompanhar** status da solicitação
- **Visualizar** histórico de solicitações
- **Cancelar** solicitações pendentes

### ✅ **Visualização e Relatórios**
- **Ver** dados da sua prefeitura
- **Consultar** órgãos vinculados
- **Acompanhar** cotas dos seus órgãos
- **Visualizar** histórico de abastecimentos
- **Monitorar** consumo da frota
- **Gerar** relatórios operacionais

### ✅ **Gestão do Próprio Perfil**
- **Atualizar** dados pessoais
- **Alterar** senha
- **Gerenciar** contatos
- **Visualizar** histórico de ações

## 🚫 Limitações do COLABORADOR_PREFEITURA

### ❌ **NÃO Pode Gerenciar:**
- **Outras prefeituras** (só a sua)
- **Criar usuários** (só admin pode)
- **Criar órgãos** (só admin pode)
- **Definir cotas** (só admin pode)
- **Aprovar abastecimentos** (só admin pode)
- **Criar processos licitatórios** (só admin pode)
- **Gerenciar empresas/postos** (só visualiza)
- **Alterar combustíveis** (só usa existentes)
- **Acessar órgãos não vinculados**

### ⚠️ **Limitações Específicas:**
- **Veículos**: Só dos órgãos que está vinculado
- **Solicitações**: Só pode criar, não aprovar
- **Relatórios**: Apenas dos seus órgãos
- **Cotas**: Só visualiza, não define
- **Usuários**: Não pode criar nem editar outros

### 👁️ **Apenas Visualiza:**
- **Postos disponíveis** para abastecimento
- **Preços de combustíveis** atuais
- **Cotas definidas** pelo admin
- **Processos licitatórios** da prefeitura
- **Dados de outros órgãos** (limitado)

## 📈 Cenários de Teste

### ✅ **Cenário 1: Rotina Diária do Colaborador**
1. Login como Fernanda Santos
2. Visualizar dashboard dos seus órgãos
3. Cadastrar novo motorista para ambulância
4. Solicitar abastecimento para veículo
5. Acompanhar status das solicitações

### ✅ **Cenário 2: Cadastro de Nova Frota**
1. Criar categoria específica
2. Cadastrar novos motoristas
3. Cadastrar veículos para SMS
4. Associar motoristas aos veículos
5. Configurar combustíveis permitidos

### ✅ **Cenário 3: Gestão de Abastecimentos**
1. Verificar cotas disponíveis
2. Criar solicitação de abastecimento
3. Definir quantidade e posto
4. Acompanhar aprovação pelo admin
5. Visualizar histórico após efetivação

### ✅ **Cenário 4: Organização e Relatórios**
1. Criar categorias organizacionais
2. Classificar veículos e motoristas
3. Gerar relatórios por categoria
4. Monitorar consumo dos órgãos
5. Acompanhar performance da frota

## 🔄 Comparação com Outros Perfis

| Funcionalidade | SUPER_ADMIN | ADMIN_PREFEITURA | **COLABORADOR_PREFEITURA** |
|----------------|-------------|------------------|---------------------------|
| **Criar Prefeituras** | ✅ | ❌ | ❌ |
| **Criar Órgãos** | ✅ | ✅ | ❌ |
| **Criar Usuários** | ✅ | ✅ | ❌ |
| **Criar Categorias** | ✅ | ✅ | ✅ |
| **Cadastrar Motoristas** | ✅ | ✅ | ✅ |
| **Cadastrar Veículos** | ✅ | ✅ | ✅ (só seus órgãos) |
| **Criar Processos** | ✅ | ✅ | ❌ |
| **Definir Cotas** | ✅ | ✅ | ❌ |
| **Solicitar Abastecimento** | ✅ | ✅ | ✅ |
| **Aprovar Abastecimento** | ✅ | ✅ | ❌ |
| **Gerenciar Empresas** | ✅ | ❌ | ❌ |
| **Scope de Acesso** | Sistema | Prefeitura | Órgãos Vinculados |

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
npm run seed:colaborador-pref
```

## 🎉 Resultado Esperado

Após executar o seed, você terá:
- ✅ **Prefeitura completa** (Ribeirão Preto)
- ✅ **Colaboradora principal** com acesso a 2 órgãos
- ✅ **5 motoristas** cadastrados operacionalmente
- ✅ **5 veículos** de diferentes tipos
- ✅ **6 categorias** organizacionais
- ✅ **4 solicitações** de abastecimento
- ✅ **Histórico de abastecimentos** aprovados
- ✅ **Cotas e processo** municipal ativo

**Agora você pode testar todas as funcionalidades operacionais que um COLABORADOR_PREFEITURA pode realizar!** 👤🚀

## 💡 Dicas de Uso

### **Para Testes Operacionais:**
- Use Fernanda Santos para operações do dia a dia
- Teste cadastros de motoristas e veículos
- Experimente criar diferentes categorias
- Faça solicitações de abastecimento

### **Para Testes de Limitações:**
- Tente acessar funcionalidades não permitidas
- Verifique limitações por órgão
- Teste aprovações (não deve conseguir)

### **Para Demonstrações:**
- Mostre a diferença entre colaborador e admin
- Demonstre o fluxo operacional típico
- Apresente relatórios por órgão

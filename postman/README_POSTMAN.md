# 📮 Collection Postman - API Sistema de Abastecimento

## 🚀 Como Importar e Usar

### 1. **Importar a Collection**
1. Abra o Postman
2. Clique em **Import**
3. Selecione o arquivo `API_Abastecimento_Collection.json`
4. A collection será importada com todas as rotas organizadas

### 2. **Configurar Variáveis de Ambiente**
A collection já vem com variáveis pré-configuradas:
- `base_url`: `http://localhost:3000`
- `jwt_token`: Será preenchido automaticamente após o login
- `refresh_token`: Será preenchido automaticamente após o login

### 3. **Fazer Login e Obter Token**
1. Execute a requisição **Login** em `🔐 Autenticação`
2. O token JWT será salvo automaticamente na variável `jwt_token`
3. Todas as outras requisições usarão este token automaticamente

## 🔐 **Usuários de Teste Disponíveis**

### 👑 **Super Administrador**
- **Email**: `superadmin@nordev.com`
- **Senha**: `123456`
- **Permissões**: Acesso total ao sistema

### 🏛️ **Usuários da Prefeitura**
- **Admin**: `admin@prefeitura.sp.gov.br` (senha: `123456`)
- **Colaborador**: `colaborador@prefeitura.sp.gov.br` (senha: `123456`)

### 🏢 **Usuários da Empresa**
- **Admin**: `admin@postoshell.com` (senha: `123456`)
- **Colaborador**: `colaborador@postoshell.com` (senha: `123456`)

## 📋 **Estrutura da Collection**

### 🔐 **Autenticação**
- **Registrar Usuário**: Cria novos usuários
- **Login**: Autentica e obtém tokens
- **Renovar Token**: Renova access token
- **Logout**: Invalida refresh token
- **Perfil do Usuário**: Retorna dados do usuário logado

### 👥 **Usuários**
- **Listar**: Lista usuários com filtros e paginação
- **Buscar por ID**: Busca usuário específico
- **Criar**: Cria novo usuário
- **Atualizar**: Atualiza dados do usuário
- **Excluir**: Remove usuário

### 🏛️ **Prefeituras**
- **Listar**: Lista prefeituras com filtros
- **Buscar por ID**: Busca prefeitura específica
- **Criar**: Cria nova prefeitura
- **Atualizar**: Atualiza dados da prefeitura
- **Excluir**: Remove prefeitura

### 🏢 **Empresas**
- **Listar**: Lista empresas com filtros
- **Buscar Próximas**: Busca empresas por coordenadas geográficas
- **Buscar por ID**: Busca empresa específica
- **Criar**: Cria nova empresa
- **Atualizar**: Atualiza dados da empresa
- **Excluir**: Remove empresa

### 🚗 **Veículos**
- **Listar**: Lista veículos com filtros
- **Buscar por ID**: Busca veículo específico
- **Criar**: Cria novo veículo
- **Atualizar**: Atualiza dados do veículo
- **Excluir**: Remove veículo

### 👨‍💼 **Motoristas**
- **Listar**: Lista motoristas com filtros
- **Buscar por ID**: Busca motorista específico
- **Criar**: Cria novo motorista
- **Atualizar**: Atualiza dados do motorista
- **Excluir**: Remove motorista

### ⛽ **Abastecimentos**
- **Listar**: Lista abastecimentos com filtros
- **Buscar por ID**: Busca abastecimento específico
- **Criar**: Cria novo abastecimento
- **Atualizar**: Atualiza dados do abastecimento
- **Aprovar**: Aprova abastecimento pendente
- **Rejeitar**: Rejeita abastecimento pendente
- **Excluir**: Remove abastecimento

### ⛽ **Combustíveis**
- **Listar**: Lista tipos de combustível
- **Buscar por ID**: Busca combustível específico
- **Criar**: Cria novo tipo de combustível
- **Atualizar**: Atualiza dados do combustível
- **Excluir**: Remove combustível

### 🏛️ **Órgãos**
- **Listar**: Lista órgãos da prefeitura
- **Buscar por ID**: Busca órgão específico
- **Criar**: Cria novo órgão
- **Atualizar**: Atualiza dados do órgão
- **Excluir**: Remove órgão

### 📂 **Categorias**
- **Listar**: Lista categorias de veículos/motoristas
- **Buscar por ID**: Busca categoria específica
- **Criar**: Cria nova categoria
- **Atualizar**: Atualiza dados da categoria
- **Excluir**: Remove categoria

### 📋 **Processos**
- **Listar**: Lista processos licitatórios
- **Buscar por ID**: Busca processo específico
- **Criar**: Cria novo processo
- **Atualizar**: Atualiza dados do processo
- **Excluir**: Remove processo

### 📄 **Contratos**
- **Listar**: Lista contratos
- **Buscar por ID**: Busca contrato específico
- **Criar**: Cria novo contrato
- **Atualizar**: Atualiza dados do contrato
- **Excluir**: Remove contrato

## 🔧 **Recursos Avançados**

### **Autenticação Automática**
- O token JWT é salvo automaticamente após o login
- Todas as requisições usam o token automaticamente
- O refresh token é gerenciado automaticamente

### **Filtros e Paginação**
- Todas as listagens suportam filtros
- Paginação configurável (page, limit)
- Filtros específicos por entidade

### **Validação de Dados**
- DTOs com validação completa
- Mensagens de erro detalhadas
- Tipos de dados específicos

### **Relacionamentos**
- Busca por coordenadas geográficas (empresas próximas)
- Filtros por relacionamentos (prefeituraId, empresaId, etc.)
- Inclusão de dados relacionados

## 📊 **Exemplos de Uso**

### **1. Fluxo Completo de Abastecimento**
1. **Login** com usuário da prefeitura
2. **Listar Veículos** para escolher o veículo
3. **Listar Motoristas** para escolher o motorista
4. **Listar Empresas Próximas** para escolher o posto
5. **Criar Abastecimento** com os dados
6. **Aprovar Abastecimento** (se necessário)

### **2. Gestão de Usuários**
1. **Login** como Super Admin
2. **Criar Prefeitura** (se necessário)
3. **Criar Usuário** da prefeitura
4. **Atualizar Status** do usuário
5. **Listar Usuários** para verificar

### **3. Gestão de Empresas**
1. **Login** como Super Admin
2. **Criar Empresa** (posto de gasolina)
3. **Criar Usuário** da empresa
4. **Atualizar Dados** da empresa
5. **Buscar Empresas Próximas** por coordenadas

## ⚠️ **Observações Importantes**

### **Permissões**
- **SUPER_ADMIN**: Acesso total
- **ADMIN_PREFEITURA**: Gerencia dados da prefeitura
- **COLABORADOR_PREFEITURA**: Acesso limitado
- **ADMIN_EMPRESA**: Gerencia dados da empresa
- **COLABORADOR_EMPRESA**: Acesso limitado

### **Validações**
- CPF deve ser válido
- CNPJ deve ser válido
- Emails devem ser únicos
- Datas devem estar no formato ISO
- Coordenadas geográficas devem ser válidas

### **Relacionamentos**
- Usuários devem ter prefeituraId ou empresaId
- Veículos devem ter prefeituraId e orgaoId
- Abastecimentos devem ter veiculoId, motoristaId, combustivelId e empresaId
- Categorias devem ter prefeituraId

## 🚀 **Próximos Passos**

1. **Importe a collection** no Postman
2. **Faça login** com um dos usuários de teste
3. **Explore as rotas** começando pela autenticação
4. **Teste os fluxos** completos de abastecimento
5. **Crie seus próprios dados** de teste

## 📚 **Documentação Adicional**

- **Swagger**: http://localhost:3000/api/docs
- **README Principal**: README.md
- **Usuários de Teste**: SEED_USERS.md
- **Schema Prisma**: prisma/schema.prisma

---

**🎉 Aproveite testando a API com esta collection completa!**

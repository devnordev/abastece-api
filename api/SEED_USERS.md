# 👥 Usuários Criados pelo Seed

## 🔐 Credenciais de Acesso

### 👑 Super Administrador
- **Email**: `superadmin@nordev.com`
- **Senha**: `123456`
- **Tipo**: `SUPER_ADMIN`
- **Permissões**: Acesso total ao sistema, pode gerenciar todos os usuários e dados

### 🏛️ Administrador da Prefeitura
- **Email**: `admin@prefeitura.sp.gov.br`
- **Senha**: `123456`
- **Tipo**: `ADMIN_PREFEITURA`
- **Permissões**: Gerencia usuários e dados da prefeitura

### 👨‍💻 Colaborador da Prefeitura
- **Email**: `colaborador@prefeitura.sp.gov.br`
- **Senha**: `123456`
- **Tipo**: `COLABORADOR_PREFEITURA`
- **Permissões**: Acesso limitado aos dados da prefeitura

### 🏢 Administrador da Empresa
- **Email**: `admin@postoshell.com`
- **Senha**: `123456`
- **Tipo**: `ADMIN_EMPRESA`
- **Permissões**: Gerencia usuários e dados da empresa

### 👨‍💻 Colaborador da Empresa
- **Email**: `colaborador@postoshell.com`
- **Senha**: `123456`
- **Tipo**: `COLABORADOR_EMPRESA`
- **Permissões**: Acesso limitado aos dados da empresa

## 📊 Dados de Exemplo Criados

### 🏛️ Prefeitura
- **Nome**: Prefeitura Municipal de São Paulo
- **CNPJ**: 12345678000195
- **Email**: admin@prefeitura.sp.gov.br

### 🏢 Empresa
- **Nome**: Posto Shell - Centro
- **CNPJ**: 98765432000123
- **Tipo**: POSTO_GASOLINA
- **Bandeira**: Shell
- **Endereço**: Rua das Flores, 123, Centro, São Paulo - SP

### 🏛️ Órgão
- **Nome**: Secretaria Municipal de Saúde
- **Sigla**: SMS
- **Prefeitura**: Prefeitura Municipal de São Paulo

### ⛽ Combustíveis
- Gasolina Comum (GAS_COMUM)
- Gasolina Aditivada (GAS_ADITIVADA)
- Etanol (ETANOL)
- Diesel S10 (DIESEL_S10)

### 📂 Categorias
- Ambulâncias (VEICULO)
- Veículos Administrativos (VEICULO)
- Motoristas de Emergência (MOTORISTA)

### 🚗 Motorista
- **Nome**: João Silva
- **CPF**: 55555555555
- **CNH**: 12345678901
- **Categoria**: B

### 🚑 Veículo
- **Nome**: Ambulância 01
- **Placa**: ABC-1234
- **Modelo**: Ford Transit
- **Ano**: 2020
- **Tipo**: Ambulância

## 🚀 Como Testar

### 1. Fazer Login
```bash
POST /auth/login
{
  "email": "superadmin@nordev.com",
  "senha": "123456"
}
```

### 2. Usar o Token
```bash
Authorization: Bearer <seu-jwt-token>
```

### 3. Testar Endpoints
- **Usuários**: `/usuarios`
- **Prefeituras**: `/prefeituras`
- **Empresas**: `/empresas`
- **Veículos**: `/veiculos`
- **Motoristas**: `/motoristas`
- **Abastecimentos**: `/abastecimentos`

## 📚 Documentação
Acesse a documentação Swagger em: http://localhost:3000/api/docs

## 🔄 Reexecutar o Seed
Para limpar e recriar todos os dados:
```bash
npm run prisma:seed
```

## ⚠️ Importante
- Todas as senhas são: `123456`
- Os dados são criados com `upsert`, então podem ser reexecutados sem duplicação
- O Super Admin tem acesso total ao sistema
- Os outros usuários têm permissões limitadas conforme seu tipo

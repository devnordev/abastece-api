# 🌱 Seed Completo - Palmeira dos Índios, AL

Este arquivo contém um seed completo que cadastra toda a estrutura da aplicação com dados realistas da cidade de Palmeira dos Índios, Alagoas.

## 📍 Cenário Implementado

### 🏛️ **Prefeitura Municipal de Palmeira dos Índios**
- **CNPJ**: 12345678000195
- **Email**: admin@palmeiradosindios.al.gov.br
- **Localização**: Palmeira dos Índios, AL

### 🏢 **Órgãos da Prefeitura**
1. **Secretaria Municipal de Saúde (SMS)**
   - Responsável por ambulâncias e veículos de emergência
   - 2 ambulâncias (UTI e Básica)
   - 1 carro administrativo

2. **Secretaria Municipal de Assistência Social (SMAS)**
   - Responsável por atendimento social
   - 1 van para atendimento social

### 🚑 **Veículos Cadastrados**
1. **Ambulância UTI 01** (AL-1234)
   - Modelo: Ford Transit
   - Ano: 2020
   - Capacidade: 8 passageiros
   - Órgão: Secretaria de Saúde

2. **Ambulância Básica 02** (AL-5678)
   - Modelo: Mercedes Sprinter
   - Ano: 2019
   - Capacidade: 6 passageiros
   - Órgão: Secretaria de Saúde

3. **Van Assistência Social** (AL-9012)
   - Modelo: Volkswagen Kombi
   - Ano: 2021
   - Capacidade: 12 passageiros
   - Órgão: Secretaria de Assistência Social

4. **Carro Administrativo Saúde** (AL-3456)
   - Modelo: Chevrolet Onix
   - Ano: 2022
   - Capacidade: 5 passageiros
   - Órgão: Secretaria de Saúde

### 🚗 **Motoristas Cadastrados**
1. **José da Silva Santos**
   - CPF: 44444444444
   - CNH: 12345678901
   - Categoria: B
   - Experiência: 15 anos

2. **Maria das Graças Oliveira**
   - CPF: 55555555555
   - CNH: 23456789012
   - Categoria: B
   - Especializada em emergência

3. **Antônio Carlos Ferreira**
   - CPF: 66666666666
   - CNH: 34567890123
   - Categoria: B
   - Motorista administrativo

### 🏢 **Empresas (Postos de Gasolina)**

#### **Posto Dois Irmãos**
- **CNPJ**: 12345678000123
- **Localização**: BR-316, Km 15
- **Bandeira**: Dois Irmãos
- **Horário**: 06:00 às 22:00
- **Avaliação**: 4.2/5.0

#### **Posto Ipiranga Vila Maria**
- **CNPJ**: 98765432000123
- **Localização**: Rua Vila Maria, 456, Centro
- **Bandeira**: Ipiranga
- **Horário**: 24h
- **Avaliação**: 4.5/5.0

### ⛽ **Combustíveis Disponíveis**
1. **Gasolina Comum** (GAS_COMUM)
2. **Gasolina Aditivada** (GAS_ADITIVADA)
3. **Etanol** (ETANOL)
4. **Diesel S10** (DIESEL_S10)

### 📄 **Contratos Ativos**
- **Contrato Posto Dois Irmãos**: 01/01/2024 a 31/12/2024
- **Contrato Posto Ipiranga**: 01/01/2024 a 31/12/2024

### 📊 **Processo de Abastecimento**
- **Número**: 2024.001
- **Valor Total**: R$ 500.000,00
- **Período**: 01/01/2024 a 31/12/2024
- **Status**: Ativo

### ⛽ **Solicitações de Exemplo**
1. **Abastecimento Ambulância UTI 01**
   - Quantidade: 50L
   - Valor: R$ 275,00
   - Status: Aprovado
   - Posto: Dois Irmãos

2. **Abastecimento Ambulância Básica 02**
   - Quantidade: 40L
   - Valor: R$ 218,00
   - Status: Aprovado
   - Posto: Ipiranga

3. **Abastecimento Van Assistência Social**
   - Quantidade: 30L
   - Valor: R$ 165,00
   - Status: Aguardando
   - Posto: Dois Irmãos

## 👥 Usuários Criados

### 👑 **Super Administrador**
- **Email**: superadmin@nordev.com
- **Senha**: 123456
- **Tipo**: SUPER_ADMIN
- **Permissões**: Acesso total ao sistema

### 🏛️ **Administrador da Prefeitura**
- **Email**: admin@palmeiradosindios.al.gov.br
- **Senha**: 123456
- **Nome**: Maria José Silva Santos
- **Tipo**: ADMIN_PREFEITURA
- **Permissões**: Gerencia usuários e dados da prefeitura

### 👨‍💻 **Secretário de Saúde**
- **Email**: saude@palmeiradosindios.al.gov.br
- **Senha**: 123456
- **Nome**: Dr. João Carlos Oliveira
- **Tipo**: COLABORADOR_PREFEITURA
- **Permissões**: Acesso aos dados da saúde

### 👨‍💻 **Secretário de Assistência Social**
- **Email**: assistencia@palmeiradosindios.al.gov.br
- **Senha**: 123456
- **Nome**: Ana Maria Ferreira
- **Tipo**: COLABORADOR_PREFEITURA
- **Permissões**: Acesso aos dados da assistência social

### 🏢 **Administrador Posto Dois Irmãos**
- **Email**: admin@postodoisirmaos.com.br
- **Senha**: 123456
- **Nome**: João dos Santos
- **Tipo**: ADMIN_EMPRESA
- **Permissões**: Gerencia dados do posto

### 🏢 **Administrador Posto Ipiranga**
- **Email**: admin@postoipiranga.com.br
- **Senha**: 123456
- **Nome**: Maria dos Santos
- **Tipo**: ADMIN_EMPRESA
- **Permissões**: Gerencia dados do posto

## 🚀 Como Executar

### 1. **Executar o Seed Completo**
```bash
# Executar o seed completo
npx ts-node prisma/seed-completo.ts

# Ou se preferir usar o comando do package.json
npm run seed:completo
```

### 2. **Verificar os Dados**
```bash
# Acessar a aplicação
npm run start:dev

# Acessar a documentação
http://localhost:3000/api/docs
```

### 3. **Testar as Funcionalidades**
1. **Fazer login** com qualquer usuário criado
2. **Navegar pelos módulos** para ver os dados
3. **Testar solicitações** de abastecimento
4. **Verificar relatórios** e dashboards

## 📊 Dados de Teste Incluídos

### ✅ **Estrutura Completa**
- ✅ 1 Prefeitura (Palmeira dos Índios, AL)
- ✅ 2 Órgãos (Saúde e Assistência Social)
- ✅ 6 Usuários (1 Super Admin + 5 usuários específicos)
- ✅ 3 Motoristas habilitados
- ✅ 4 Veículos (2 ambulâncias + 1 van + 1 carro)
- ✅ 2 Empresas (Postos de gasolina)
- ✅ 4 Tipos de combustível
- ✅ 2 Contratos ativos
- ✅ 1 Processo com teto de R$ 500.000,00
- ✅ 3 Solicitações de exemplo

### 🎯 **Cenários de Teste**
- **Abastecimento de emergência** (ambulâncias)
- **Abastecimento administrativo** (carros)
- **Abastecimento social** (van)
- **Controle de teto** de combustível
- **Gestão de contratos** com postos
- **Relatórios** de consumo

## 🔧 Personalização

Para adaptar o seed para sua cidade:

1. **Altere os dados da prefeitura** (nome, CNPJ, email)
2. **Modifique os órgãos** conforme sua estrutura
3. **Ajuste os veículos** e motoristas
4. **Configure os postos** locais
5. **Defina o teto** de combustível
6. **Ajuste os preços** dos combustíveis

## 📝 Notas Importantes

- **Todos os usuários** têm a senha padrão: `123456`
- **Todos os dados** são realistas para Palmeira dos Índios, AL
- **As coordenadas** são aproximadas da cidade
- **Os CNPJs** são fictícios mas válidos
- **Os telefones** seguem o padrão de Alagoas (82)
- **As placas** seguem o padrão de Alagoas (AL-XXXX)

## 🎉 Benefícios do Seed Completo

1. **Dados Realistas**: Cenário completo e funcional
2. **Testes Completos**: Todos os módulos testados
3. **Relacionamentos**: Estrutura completa de dados
4. **Cenários Reais**: Situações do dia a dia
5. **Documentação**: Dados bem documentados
6. **Facilidade**: Pronto para uso imediato

Este seed completo permite testar todas as funcionalidades da aplicação com dados realistas e bem estruturados! 🚀

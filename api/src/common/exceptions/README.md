# 🚨 Sistema de Exceções Personalizadas

Este módulo fornece um sistema completo de exceções personalizadas para todos os módulos da aplicação, seguindo o padrão de código existente e fornecendo mensagens amigáveis e detalhadas.

## 📁 Estrutura

```
src/common/exceptions/
├── base.exception.ts              # Classe base para todas as exceções
├── business.exception.ts          # Exceções de negócio genéricas
├── index.ts                      # Exportações centralizadas
├── usuario/
│   └── usuario.exceptions.ts     # Exceções específicas do módulo usuário
├── empresa/
│   └── empresa.exceptions.ts     # Exceções específicas do módulo empresa
├── contrato/
│   └── contrato.exceptions.ts    # Exceções específicas do módulo contrato
├── abastecimento/
│   └── abastecimento.exceptions.ts # Exceções específicas do módulo abastecimento
├── prefeitura/
│   └── prefeitura.exceptions.ts  # Exceções específicas do módulo prefeitura
├── veiculo/
│   └── veiculo.exceptions.ts     # Exceções específicas do módulo veículo
├── motorista/
│   └── motorista.exceptions.ts   # Exceções específicas do módulo motorista
├── combustivel/
│   └── combustivel.exceptions.ts # Exceções específicas do módulo combustível
├── orgao/
│   └── orgao.exceptions.ts       # Exceções específicas do módulo órgão
└── README.md                     # Esta documentação
```

## 🎯 Características

### ✅ **Mensagens Amigáveis**
- Mensagens em português brasileiro
- Contexto específico para cada situação
- Detalhes adicionais quando necessário

### ✅ **Informações Detalhadas**
- Timestamp automático
- IDs e dados relevantes
- Códigos de erro específicos
- Status HTTP apropriados

### ✅ **Padrão Consistente**
- Herança da classe base `BaseException`
- Estrutura uniforme em todos os módulos
- Integração com NestJS

## 🚀 Como Usar

### 1. **Importar as Exceções**

```typescript
import {
  UsuarioNotFoundException,
  UsuarioAlreadyExistsException,
  UsuarioInactiveException,
} from '../../common/exceptions';
```

### 2. **Usar em Serviços**

```typescript
async findOne(id: number) {
  const usuario = await this.prisma.usuario.findUnique({
    where: { id },
  });

  if (!usuario) {
    throw new UsuarioNotFoundException(id);
  }

  return usuario;
}
```

### 3. **Exceções com Detalhes**

```typescript
async create(createUsuarioDto: CreateUsuarioDto) {
  const { email, cpf } = createUsuarioDto;

  const existingUser = await this.prisma.usuario.findFirst({
    where: { OR: [{ email }, { cpf }] },
  });

  if (existingUser) {
    throw new UsuarioAlreadyExistsException(email, cpf);
  }

  // ... resto do código
}
```

## 📋 Tipos de Exceções por Módulo

### 👤 **Usuário**
- `UsuarioNotFoundException` - Usuário não encontrado
- `UsuarioAlreadyExistsException` - Usuário já existe
- `UsuarioInactiveException` - Usuário inativo
- `UsuarioAccessDeniedException` - Acesso negado
- `UsuarioInvalidCredentialsException` - Credenciais inválidas
- `UsuarioPermissionDeniedException` - Permissão negada
- `UsuarioCannotDeleteWithRelationsException` - Não pode excluir com relacionamentos
- `UsuarioInvalidStatusTransitionException` - Transição de status inválida

### 🏢 **Empresa**
- `EmpresaNotFoundException` - Empresa não encontrada
- `EmpresaAlreadyExistsException` - Empresa já existe
- `EmpresaInactiveException` - Empresa inativa
- `EmpresaCannotDeleteWithRelationsException` - Não pode excluir com relacionamentos
- `EmpresaInvalidCoordinatesException` - Coordenadas inválidas
- `EmpresaNotFoundNearbyException` - Nenhuma empresa próxima encontrada
- `EmpresaInvalidCnpjException` - CNPJ inválido
- `EmpresaInvalidUfException` - UF inválida
- `EmpresaInvalidTipoException` - Tipo de empresa inválido

### 📄 **Contrato**
- `ContratoNotFoundException` - Contrato não encontrado
- `ContratoAlreadyExistsException` - Contrato já existe
- `ContratoInactiveException` - Contrato inativo
- `ContratoCannotDeleteWithRelationsException` - Não pode excluir com relacionamentos
- `ContratoInvalidVigenciaException` - Vigência inválida
- `ContratoExpiredException` - Contrato expirado
- `ContratoNotStartedException` - Contrato não iniciado
- `ContratoInvalidCnpjException` - CNPJ inválido
- `ContratoMissingEmpresaException` - Empresa não encontrada
- `ContratoInvalidFileException` - Arquivo inválido

### ⛽ **Abastecimento**
- `AbastecimentoNotFoundException` - Abastecimento não encontrado
- `AbastecimentoAlreadyExistsException` - Abastecimento já existe
- `AbastecimentoInvalidStatusException` - Status inválido
- `AbastecimentoCannotDeleteWithRelationsException` - Não pode excluir com relacionamentos
- `AbastecimentoInvalidQuantityException` - Quantidade inválida
- `AbastecimentoInvalidPriceException` - Preço inválido
- `AbastecimentoInvalidDateException` - Data inválida
- `AbastecimentoMissingVeiculoException` - Veículo não encontrado
- `AbastecimentoMissingCombustivelException` - Combustível não encontrado
- `AbastecimentoMissingEmpresaException` - Empresa não encontrada
- `AbastecimentoUnauthorizedException` - Não autorizado
- `AbastecimentoInvalidStatusForActionException` - Status inválido para ação
- `AbastecimentoExceedsLimitException` - Limite excedido

### 🏛️ **Prefeitura**
- `PrefeituraNotFoundException` - Prefeitura não encontrada
- `PrefeituraAlreadyExistsException` - Prefeitura já existe
- `PrefeituraInactiveException` - Prefeitura inativa
- `PrefeituraCannotDeleteWithRelationsException` - Não pode excluir com relacionamentos
- `PrefeituraInvalidCnpjException` - CNPJ inválido
- `PrefeituraInvalidEmailException` - Email inválido
- `PrefeituraMissingRequiredFieldsException` - Campos obrigatórios ausentes
- `PrefeituraInvalidCupomFiscalException` - Configuração de cupom fiscal inválida
- `PrefeituraUnauthorizedException` - Não autorizado
- `PrefeituraInvalidImageException` - Imagem inválida
- `PrefeituraDuplicateNameException` - Nome duplicado

### 🚗 **Veículo**
- `VeiculoNotFoundException` - Veículo não encontrado
- `VeiculoAlreadyExistsException` - Veículo já existe
- `VeiculoInactiveException` - Veículo inativo
- `VeiculoCannotDeleteWithRelationsException` - Não pode excluir com relacionamentos
- `VeiculoInvalidPlacaException` - Placa inválida
- `VeiculoInvalidTipoException` - Tipo de veículo inválido
- `VeiculoInvalidSituacaoException` - Situação inválida
- `VeiculoMissingPrefeituraException` - Prefeitura não encontrada
- `VeiculoMissingCategoriaException` - Categoria não encontrada
- `VeiculoInvalidAnoException` - Ano inválido
- `VeiculoInvalidQuilometragemException` - Quilometragem inválida
- `VeiculoUnauthorizedException` - Não autorizado
- `VeiculoInvalidImageException` - Imagem inválida
- `VeiculoDuplicatePlacaException` - Placa duplicada

### 👨‍💼 **Motorista**
- `MotoristaNotFoundException` - Motorista não encontrado
- `MotoristaAlreadyExistsException` - Motorista já existe
- `MotoristaInactiveException` - Motorista inativo
- `MotoristaCannotDeleteWithRelationsException` - Não pode excluir com relacionamentos
- `MotoristaInvalidCpfException` - CPF inválido
- `MotoristaInvalidCnhException` - CNH inválida
- `MotoristaInvalidCategoriaCnhException` - Categoria de CNH inválida
- `MotoristaInvalidDataNascimentoException` - Data de nascimento inválida
- `MotoristaMissingPrefeituraException` - Prefeitura não encontrada
- `MotoristaMissingCategoriaException` - Categoria não encontrada
- `MotoristaInvalidTelefoneException` - Telefone inválido
- `MotoristaUnauthorizedException` - Não autorizado
- `MotoristaInvalidImageException` - Imagem inválida
- `MotoristaDuplicateCpfException` - CPF duplicado
- `MotoristaDuplicateCnhException` - CNH duplicada

### ⛽ **Combustível**
- `CombustivelNotFoundException` - Combustível não encontrado
- `CombustivelAlreadyExistsException` - Combustível já existe
- `CombustivelInactiveException` - Combustível inativo
- `CombustivelCannotDeleteWithRelationsException` - Não pode excluir com relacionamentos
- `CombustivelInvalidNomeException` - Nome inválido
- `CombustivelInvalidSiglaException` - Sigla inválida
- `CombustivelInvalidTipoException` - Tipo inválido
- `CombustivelInvalidPrecoException` - Preço inválido
- `CombustivelInvalidAnpException` - Código ANP inválido
- `CombustivelMissingEmpresaException` - Empresa não encontrada
- `CombustivelUnauthorizedException` - Não autorizado
- `CombustivelDuplicateNomeException` - Nome duplicado
- `CombustivelDuplicateSiglaException` - Sigla duplicada
- `CombustivelInvalidStatusException` - Status inválido
- `CombustivelPriceUpdateException` - Erro ao atualizar preço

### 🏢 **Órgão**
- `OrgaoNotFoundException` - Órgão não encontrado
- `OrgaoAlreadyExistsException` - Órgão já existe
- `OrgaoInactiveException` - Órgão inativo
- `OrgaoCannotDeleteWithRelationsException` - Não pode excluir com relacionamentos
- `OrgaoInvalidNomeException` - Nome inválido
- `OrgaoInvalidSiglaException` - Sigla inválida
- `OrgaoMissingPrefeituraException` - Prefeitura não encontrada
- `OrgaoUnauthorizedException` - Não autorizado
- `OrgaoDuplicateNomeException` - Nome duplicado
- `OrgaoDuplicateSiglaException` - Sigla duplicada
- `OrgaoInvalidStatusException` - Status inválido
- `OrgaoMissingRequiredFieldsException` - Campos obrigatórios ausentes
- `OrgaoInvalidImageException` - Imagem inválida

## 🔧 Exceções Genéricas

### **Business Exceptions**
- `BusinessException` - Erro de negócio genérico
- `ValidationException` - Erro de validação
- `ConflictException` - Conflito de dados
- `NotFoundException` - Recurso não encontrado
- `UnauthorizedException` - Não autorizado
- `ForbiddenException` - Acesso negado

## 📊 Estrutura da Resposta

Todas as exceções retornam uma resposta padronizada:

```json
{
  "message": "Mensagem amigável em português",
  "error": "Tipo do erro",
  "statusCode": 400,
  "details": {
    "id": 123,
    "email": "usuario@exemplo.com",
    "timestamp": "2024-01-15T10:30:00.000Z"
  }
}
```

## 🎯 Benefícios

1. **Mensagens Claras**: Usuários recebem mensagens em português
2. **Debugging Fácil**: Desenvolvedores têm informações detalhadas
3. **Consistência**: Padrão uniforme em toda a aplicação
4. **Manutenibilidade**: Fácil de adicionar novas exceções
5. **Integração**: Funciona perfeitamente com NestJS e Swagger

## 📝 Exemplo Completo

Veja o arquivo `src/modules/usuario/usuario.service.example.ts` para um exemplo completo de como usar as exceções personalizadas em um serviço.

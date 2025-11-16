# Cadastro e Edição de Veículos

Este documento explica como cadastrar e editar veículos no sistema, incluindo campos obrigatórios, opcionais, validações e exemplos de requisições.

## Visão Geral

- **Model principal**: `Veiculo`
- **Relações importantes**:
  - `Veiculo.prefeituraId` → `Prefeitura.id` (obrigatório)
  - `Veiculo.orgaoId` → `Orgao.id` (obrigatório)
  - `Veiculo.contaFaturamentoOrgaoId` → `ContaFaturamentoOrgao.id` (opcional)
  - `Veiculo.combustivelIds` → `Combustivel.id[]` (obrigatório, array)
  - `Veiculo.categoriaIds` → `Categoria.id[]` (opcional, array)
  - `Veiculo.motoristaIds` → `Motorista.id[]` (opcional, array)
- **Regra de autorização**:
  - Apenas usuários com perfil **`ADMIN_PREFEITURA`** ou **`SUPER_ADMIN`** podem cadastrar veículos.
  - `ADMIN_PREFEITURA` só pode cadastrar veículos da sua própria prefeitura.

## Endpoints

### 1. Cadastrar Veículo

- **Rota**: `POST /veiculos`
- **Método**: `POST`
- **Content-Type**: `multipart/form-data` ou `application/json`
- **Guards**:
  - `JwtAuthGuard`
  - `RoleBlockGuard(['SUPER_ADMIN'])` (bloqueia apenas `SUPER_ADMIN` de criar diretamente, mas permite `ADMIN_PREFEITURA`)

#### Campos Obrigatórios

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `prefeituraId` | `number` | ID da prefeitura |
| `orgaoId` | `number` | ID do órgão responsável |
| `nome` | `string` | Nome do veículo (mínimo 3 caracteres) |
| `placa` | `string` | Placa do veículo (única no sistema) |
| `tipo_abastecimento` | `enum` | Tipo: `COTA`, `LIVRE`, `COM_AUTORIZACAO` |
| `capacidade_tanque` | `number` | Capacidade do tanque em litros |
| `combustivelIds` | `number[]` | Array de IDs dos combustíveis permitidos |

#### Campos Condicionalmente Obrigatórios

Quando `tipo_abastecimento` é `COTA`:
- `periodicidade` (enum: `Diario`, `Semanal`, `Mensal`)
- `quantidade` (número em litros)

#### Campos Opcionais

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `contaFaturamentoOrgaoId` | `number` | ID da conta de faturamento |
| `modelo` | `string` | Modelo do veículo |
| `ano` | `number` | Ano do veículo |
| `ano_fabricacao` | `number` | Ano de fabricação |
| `ativo` | `boolean` | Se o veículo está ativo (padrão: `true`) |
| `tipo_veiculo` | `enum` | Tipo: `Ambulancia`, `Caminhao`, `Caminhonete`, `Carro`, `Maquina_Pesada`, `Microonibus`, `Moto`, `Onibus`, `Outro` |
| `situacao_veiculo` | `enum` | Situação: `Locado`, `Particular_a_servico`, `Proprio` |
| `observacoes` | `string` | Observações sobre o veículo |
| `periodicidade` | `enum` | Periodicidade: `Diario`, `Semanal`, `Mensal` |
| `quantidade` | `number` | Quantidade em litros (obrigatório se tipo_abastecimento = COTA) |
| `apelido` | `string` | Apelido do veículo |
| `chassi` | `string` | Chassi do veículo |
| `renavam` | `string` | RENAVAM do veículo |
| `crlv` | `string` | CRLV do veículo |
| `crlv_vencimento` | `string` (ISO date) | Data de vencimento do CRLV |
| `tacografo` | `string` | Tacógrafo do veículo |
| `cor` | `string` | Cor do veículo |
| `capacidade_passageiros` | `number` | Capacidade de passageiros |
| `categoriaIds` | `number[]` | Array de IDs das categorias |
| `motoristaIds` | `number[]` | Array de IDs dos motoristas |
| `foto_veiculo` | `File` | Arquivo de imagem (JPEG, PNG, WEBP, máx. 5MB) |
| `foto_crlv` | `string` | URL da foto do CRLV |

#### Exemplo de Requisição - Cadastro Completo (JSON)

```json
{
  "prefeituraId": 1,
  "orgaoId": 5,
  "contaFaturamentoOrgaoId": 2,
  "nome": "Ambulância 01 - SAMU",
  "placa": "ABC-1234",
  "modelo": "Ford Transit",
  "ano": 2020,
  "ano_fabricacao": 2019,
  "tipo_abastecimento": "COTA",
  "ativo": true,
  "capacidade_tanque": 80.5,
  "tipo_veiculo": "Ambulancia",
  "situacao_veiculo": "Proprio",
  "observacoes": "Veículo em bom estado, revisão completa realizada em 2024",
  "periodicidade": "Semanal",
  "quantidade": 100.0,
  "apelido": "Ambulância da Saúde",
  "chassi": "9BWZZZZZZZZZZZZZZ",
  "renavam": "12345678901",
  "crlv": "CRLV123456",
  "crlv_vencimento": "2025-12-31T00:00:00.000Z",
  "tacografo": "TACO123456",
  "cor": "Branco",
  "capacidade_passageiros": 8,
  "categoriaIds": [1, 3],
  "combustivelIds": [1, 3],
  "motoristaIds": [5, 7]
}
```

#### Exemplo de Requisição - Cadastro Mínimo (JSON)

```json
{
  "prefeituraId": 1,
  "orgaoId": 5,
  "nome": "Veículo 01",
  "placa": "XYZ-5678",
  "tipo_abastecimento": "LIVRE",
  "capacidade_tanque": 50.0,
  "combustivelIds": [1]
}
```

#### Exemplo de Requisição - Cadastro com Tipo COTA (JSON)

```json
{
  "prefeituraId": 1,
  "orgaoId": 5,
  "nome": "Caminhão Coleta",
  "placa": "DEF-9012",
  "tipo_abastecimento": "COTA",
  "capacidade_tanque": 120.0,
  "periodicidade": "Mensal",
  "quantidade": 500.0,
  "combustivelIds": [4]
}
```

#### Exemplo de Requisição - Multipart/Form-Data (com upload de imagem)

```
POST /veiculos
Content-Type: multipart/form-data

prefeituraId: 1
orgaoId: 5
nome: Ambulância 01
placa: ABC-1234
tipo_abastecimento: COTA
capacidade_tanque: 80.5
periodicidade: Semanal
quantidade: 100.0
combustivelIds: 1,3
categoriaIds: 1,2
motoristaIds: 5,7
foto_veiculo: [arquivo de imagem]
```

**Nota**: Quando usando `multipart/form-data`, arrays podem ser enviados como strings separadas por vírgula (ex: `combustivelIds: "1,3"`).

#### Exemplo de Resposta - Sucesso (201)

```json
{
  "message": "Veículo criado com sucesso",
  "veiculo": {
    "id": 1,
    "prefeituraId": 1,
    "orgaoId": 5,
    "contaFaturamentoOrgaoId": 2,
    "nome": "Ambulância 01 - SAMU",
    "placa": "ABC-1234",
    "modelo": "Ford Transit",
    "ano": 2020,
    "tipo_abastecimento": "COTA",
    "ativo": true,
    "capacidade_tanque": 80.5,
    "tipo_veiculo": "Ambulancia",
    "situacao_veiculo": "Proprio",
    "observacoes": "Veículo em bom estado, revisão completa realizada em 2024",
    "periodicidade": "Semanal",
    "quantidade": 100.0,
    "apelido": "Ambulância da Saúde",
    "chassi": "9BWZZZZZZZZZZZZZZ",
    "renavam": "12345678901",
    "crlv": "CRLV123456",
    "crlv_vencimento": "2025-12-31T00:00:00.000Z",
    "tacografo": "TACO123456",
    "foto_veiculo": "https://exemplo.com/uploads/veiculos/veiculo-1234567890.jpg",
    "cor": "Branco",
    "capacidade_passageiros": 8,
    "prefeitura": {
      "id": 1,
      "nome": "Prefeitura Municipal de Estrela",
      "cnpj": "12.345.678/0001-90"
    },
    "orgao": {
      "id": 5,
      "nome": "Secretaria de Saúde",
      "sigla": "SMS"
    },
    "contaFaturamento": {
      "id": 2,
      "nome": "Conta Saúde",
      "descricao": "Conta de faturamento da Secretaria de Saúde"
    },
    "categorias": [
      {
        "categoria": {
          "id": 1,
          "nome": "Emergência",
          "descricao": "Veículos de emergência"
        }
      },
      {
        "categoria": {
          "id": 3,
          "nome": "Saúde",
          "descricao": "Veículos da área de saúde"
        }
      }
    ],
    "combustiveis": [
      {
        "combustivel": {
          "id": 1,
          "nome": "GASOLINA COMUM",
          "descricao": "Gasolina comum"
        }
      },
      {
        "combustivel": {
          "id": 3,
          "nome": "ETANOL HIDRATADO",
          "descricao": "Etanol hidratado"
        }
      }
    ],
    "motoristas": [
      {
        "motorista": {
          "id": 5,
          "nome": "João Silva",
          "cpf": "123.456.789-00"
        }
      },
      {
        "motorista": {
          "id": 7,
          "nome": "Maria Santos",
          "cpf": "987.654.321-00"
        }
      }
    ]
  }
}
```

### 2. Editar Veículo

- **Rota**: `PATCH /veiculos/:id`
- **Método**: `PATCH`
- **Content-Type**: `multipart/form-data` ou `application/json`
- **Guards**:
  - `JwtAuthGuard`
  - `RoleBlockGuard(['SUPER_ADMIN'])`

#### Campos Editáveis

Todos os campos do cadastro são editáveis, **exceto**:
- `prefeituraId` (não pode ser alterado após criação)

#### Exemplo de Requisição - Edição de Campos Isolados (JSON)

**Atualizar apenas o nome:**
```json
{
  "nome": "Ambulância 01 - SAMU Atualizada"
}
```

**Atualizar apenas a placa:**
```json
{
  "placa": "ABC-9999"
}
```

**Atualizar apenas o status ativo:**
```json
{
  "ativo": false
}
```

**Atualizar apenas combustíveis:**
```json
{
  "combustivelIds": [1, 3, 5]
}
```

**Atualizar apenas motoristas:**
```json
{
  "motoristaIds": [5, 7, 9]
}
```

**Atualizar apenas tipo de abastecimento e campos relacionados:**
```json
{
  "tipo_abastecimento": "COTA",
  "periodicidade": "Mensal",
  "quantidade": 200.0
}
```

#### Exemplo de Requisição - Edição Completa (JSON)

```json
{
  "orgaoId": 6,
  "contaFaturamentoOrgaoId": 3,
  "nome": "Ambulância 01 - SAMU Atualizada",
  "placa": "ABC-9999",
  "modelo": "Ford Transit 2021",
  "ano": 2021,
  "ano_fabricacao": 2020,
  "tipo_abastecimento": "COTA",
  "ativo": true,
  "capacidade_tanque": 90.0,
  "tipo_veiculo": "Ambulancia",
  "situacao_veiculo": "Proprio",
  "observacoes": "Veículo atualizado, nova revisão em 2025",
  "periodicidade": "Mensal",
  "quantidade": 150.0,
  "apelido": "Ambulância da Saúde Atualizada",
  "chassi": "9BWZZZZZZZZZZZZZZ",
  "renavam": "12345678901",
  "crlv": "CRLV123456",
  "crlv_vencimento": "2026-12-31T00:00:00.000Z",
  "tacografo": "TACO123456",
  "cor": "Branco",
  "capacidade_passageiros": 8,
  "categoriaIds": [1, 3, 4],
  "combustivelIds": [1, 3, 5],
  "motoristaIds": [5, 7, 9]
}
```

#### Exemplo de Requisição - Edição com Upload de Imagem (Multipart/Form-Data)

```
PATCH /veiculos/1
Content-Type: multipart/form-data

nome: Ambulância 01 Atualizada
placa: ABC-9999
ativo: true
combustivelIds: 1,3,5
foto_veiculo: [novo arquivo de imagem]
```

#### Exemplo de Resposta - Sucesso (200)

```json
{
  "message": "Veículo atualizado com sucesso",
  "veiculo": {
    "id": 1,
    "prefeituraId": 1,
    "orgaoId": 6,
    "contaFaturamentoOrgaoId": 3,
    "nome": "Ambulância 01 - SAMU Atualizada",
    "placa": "ABC-9999",
    "modelo": "Ford Transit 2021",
    "ano": 2021,
    "tipo_abastecimento": "COTA",
    "ativo": true,
    "capacidade_tanque": 90.0,
    "tipo_veiculo": "Ambulancia",
    "situacao_veiculo": "Proprio",
    "observacoes": "Veículo atualizado, nova revisão em 2025",
    "periodicidade": "Mensal",
    "quantidade": 150.0,
    "apelido": "Ambulância da Saúde Atualizada",
    "chassi": "9BWZZZZZZZZZZZZZZ",
    "renavam": "12345678901",
    "crlv": "CRLV123456",
    "crlv_vencimento": "2026-12-31T00:00:00.000Z",
    "tacografo": "TACO123456",
    "foto_veiculo": "https://exemplo.com/uploads/veiculos/veiculo-1.jpg",
    "cor": "Branco",
    "capacidade_passageiros": 8,
    "prefeitura": {
      "id": 1,
      "nome": "Prefeitura Municipal de Estrela",
      "cnpj": "12.345.678/0001-90"
    },
    "orgao": {
      "id": 6,
      "nome": "Secretaria de Transportes",
      "sigla": "SETRANS"
    },
    "contaFaturamento": {
      "id": 3,
      "nome": "Conta Transportes",
      "descricao": "Conta de faturamento da Secretaria de Transportes"
    }
  }
}
```

## Validações e Regras de Negócio

### Validações de Cadastro

1. **Placa única**: A placa deve ser única em todo o sistema. Se já existir um veículo com a mesma placa:
   - Na mesma prefeitura: erro `409 Conflict` - "Veículo já existe com esta placa nesta prefeitura"
   - Em outra prefeitura: erro `409 Conflict` - "Veículo já existe com esta placa em outra prefeitura"
   - Se o veículo existente estiver em outro órgão da mesma prefeitura: erro `409 Conflict` - "Este veículo já está cadastrado no órgão [nome] nesta prefeitura. Um veículo não pode pertencer a múltiplos órgãos."

2. **Prefeitura existe**: O `prefeituraId` deve existir no banco de dados.

3. **Órgão pertence à prefeitura**: O `orgaoId` deve existir e pertencer à mesma prefeitura informada.

4. **Tipo COTA requer periodicidade e quantidade**:
   - Se `tipo_abastecimento` é `COTA`, `periodicidade` e `quantidade` são obrigatórios.
   - Erro `400 Bad Request` se faltar algum desses campos.

5. **Combustíveis existem**: Todos os IDs em `combustivelIds` devem existir no banco de dados.

6. **Categorias existem**: Se `categoriaIds` for fornecido, todos os IDs devem existir.

7. **Motoristas existem e pertencem à prefeitura**: Se `motoristaIds` for fornecido, todos os IDs devem existir e pertencer à mesma prefeitura do veículo.

8. **Upload de imagem**: 
   - Formato: JPEG, PNG, WEBP
   - Tamanho máximo: 5MB
   - Se o upload falhar, o veículo ainda será criado (sem imagem)

### Validações de Edição

1. **Veículo existe**: O veículo com o ID informado deve existir.

2. **Placa única (se alterada)**: Se a placa for alterada, deve ser única (mesmas regras do cadastro).

3. **PrefeituraId não pode ser alterado**: O campo `prefeituraId` não é editável após a criação.

4. **Upload de nova imagem**: 
   - Se uma nova imagem for enviada, a imagem antiga será removida automaticamente.
   - Mesmas regras de formato e tamanho do cadastro.

## Status Codes

| Status | Descrição |
|--------|-----------|
| `201 Created` | Veículo criado com sucesso |
| `200 OK` | Veículo atualizado com sucesso |
| `400 Bad Request` | Dados inválidos ou validações falharam |
| `401 Unauthorized` | Não autenticado |
| `403 Forbidden` | Sem permissão para cadastrar/editar veículo |
| `404 Not Found` | Veículo, prefeitura, órgão, combustível, categoria ou motorista não encontrado |
| `409 Conflict` | Placa já está em uso ou veículo já existe |

## Mensagens de Erro Comuns

### Erro 400 - Dados Inválidos

```json
{
  "message": [
    "Nome deve ter pelo menos 3 caracteres",
    "Capacidade do tanque deve ser um número",
    "Tipo de abastecimento inválido",
    "Periodicidade é obrigatória para tipo de abastecimento COTA"
  ],
  "error": "Bad Request",
  "statusCode": 400
}
```

### Erro 404 - Não Encontrado

```json
{
  "message": "Prefeitura não encontrada",
  "error": "Not Found",
  "statusCode": 404
}
```

```json
{
  "message": "Órgão não encontrado ou não pertence a esta prefeitura",
  "error": "Not Found",
  "statusCode": 404
}
```

```json
{
  "message": "Um ou mais combustíveis não foram encontrados",
  "error": "Not Found",
  "statusCode": 404
}
```

### Erro 409 - Conflito

```json
{
  "message": "Veículo já existe com esta placa nesta prefeitura",
  "error": "Conflict",
  "statusCode": 409
}
```

```json
{
  "message": "Placa já está em uso por outro veículo",
  "error": "Conflict",
  "statusCode": 409
}
```

### Erro 403 - Sem Permissão

```json
{
  "message": "Apenas ADMIN_PREFEITURA pode cadastrar veículos",
  "error": "Forbidden",
  "statusCode": 403
}
```

```json
{
  "message": "Você só pode cadastrar veículos da sua própria prefeitura",
  "error": "Forbidden",
  "statusCode": 403
}
```

## Enums Disponíveis

### TipoAbastecimentoVeiculo

- `COTA` - Abastecimento por cota (requer `periodicidade` e `quantidade`)
- `LIVRE` - Abastecimento livre
- `COM_AUTORIZACAO` - Abastecimento com autorização

### TipoVeiculo

- `Ambulancia` - Ambulância
- `Caminhao` - Caminhão
- `Caminhonete` - Caminhonete
- `Carro` - Carro
- `Maquina_Pesada` - Máquina Pesada
- `Microonibus` - Microônibus
- `Moto` - Moto
- `Onibus` - Ônibus
- `Outro` - Outro

### SituacaoVeiculo

- `Locado` - Locado
- `Particular_a_servico` - Particular à serviço
- `Proprio` - Próprio

### Periodicidade

- `Diario` - Diário
- `Semanal` - Semanal
- `Mensal` - Mensal

## Observações Importantes

1. **Arrays em Multipart/Form-Data**: Quando usando `multipart/form-data`, arrays podem ser enviados como strings separadas por vírgula (ex: `combustivelIds: "1,3,5"`).

2. **Upload de Imagem**: O campo `foto_veiculo` pode ser enviado como arquivo binário em `multipart/form-data` ou como URL string em `application/json`.

3. **Relacionamentos**: Ao editar `combustivelIds`, `categoriaIds` ou `motoristaIds`, os relacionamentos antigos são mantidos. Para atualizar completamente, envie o array completo com os novos IDs.

4. **Tipo COTA**: Quando `tipo_abastecimento` é `COTA`, os campos `periodicidade` e `quantidade` são obrigatórios tanto no cadastro quanto na edição.

5. **PrefeituraId**: O campo `prefeituraId` não pode ser alterado após a criação do veículo. Se necessário, crie um novo veículo.

6. **Placa**: A placa é única em todo o sistema e não pode ser duplicada, mesmo em prefeituras diferentes.


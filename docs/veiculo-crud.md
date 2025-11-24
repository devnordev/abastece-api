# 📋 Guia de Cadastro de Veículo

Este documento descreve como cadastrar um veículo no sistema de abastecimento.

## 🔗 Endpoint

```
POST /veiculos
```

## 🔐 Autenticação

Este endpoint requer autenticação via JWT. Inclua o token no header:

```
Authorization: Bearer {seu_token_jwt}
```

**⚠️ Permissão necessária:** Apenas usuários com perfil `SUPER_ADMIN` podem cadastrar veículos.

## 📝 Campos Obrigatórios

| Campo | Tipo | Descrição | Exemplo |
|-------|------|-----------|---------|
| `prefeituraId` | number | ID da prefeitura | `1` |
| `orgaoId` | number | ID do órgão responsável | `1` |
| `nome` | string | Nome do veículo (mínimo 3 caracteres) | `"Ambulância 01"` |
| `placa` | string | Placa do veículo (deve ser única) | `"ABC-1234"` |
| `capacidade_tanque` | number | Capacidade do tanque em litros | `80.5` |
| `tipo_abastecimento` | string | Tipo de abastecimento (ver enums abaixo) | `"COTA"` |
| `combustivelIds` | number[] | Array com IDs dos combustíveis permitidos (mínimo 1) | `[1, 2]` |

## 📝 Campos Condicionalmente Obrigatórios

Quando `tipo_abastecimento` for `"COTA"`, os seguintes campos são obrigatórios:

| Campo | Tipo | Descrição | Exemplo |
|-------|------|-----------|---------|
| `periodicidade` | string | Periodicidade de abastecimento | `"Semanal"` |
| `quantidade` | number | Quantidade em litros permitida | `120.0` |

## 📝 Campos Opcionais

| Campo | Tipo | Descrição | Exemplo |
|-------|------|-----------|---------|
| `contaFaturamentoOrgaoId` | number | ID da conta de faturamento do órgão | `1` |
| `modelo` | string | Modelo do veículo | `"Ford Transit"` |
| `ano` | number | Ano do veículo | `2020` |
| `ativo` | boolean | Se o veículo está ativo (padrão: `true`) | `true` |
| `tipo_veiculo` | string | Tipo do veículo (ver enums abaixo) | `"Ambulancia"` |
| `situacao_veiculo` | string | Situação do veículo (ver enums abaixo) | `"Proprio"` |
| `observacoes` | string | Observações sobre o veículo | `"Veículo em bom estado"` |
| `apelido` | string | Apelido do veículo | `"Ambulância da Emergência"` |
| `ano_fabricacao` | number | Ano de fabricação | `2019` |
| `chassi` | string | Chassi do veículo | `"9BWZZZZZZZZZZZZZZ"` |
| `renavam` | string | RENAVAM do veículo | `"12345678901"` |
| `crlv` | string | Número do CRLV | `"CRLV123456"` |
| `crlv_vencimento` | string | Data de vencimento do CRLV (formato ISO) | `"2024-12-31T00:00:00.000Z"` |
| `tacografo` | string | Número do tacógrafo | `"TACO123456"` |
| `cor` | string | Cor do veículo | `"Branco"` |
| `capacidade_passageiros` | number | Capacidade de passageiros | `8` |
| `foto_veiculo` | file/string | Foto do veículo (multipart/form-data) ou URL | - |
| `foto_crlv` | string | URL da foto do CRLV | `"https://exemplo.com/crlv.jpg"` |
| `categoriaIds` | number[] | IDs das categorias do veículo | `[1, 2]` |
| `motoristaIds` | number[] | IDs dos motoristas que podem dirigir o veículo | `[1, 2]` |
| `cotasPeriodo` | array | Array de cotas de período (ver estrutura abaixo) | - |

## 📌 Enums e Valores Permitidos

### Tipo de Abastecimento (`tipo_abastecimento`)

- `"COTA"` - Abastecimento com cota
- `"LIVRE"` - Abastecimento livre
- `"COM_AUTORIZACAO"` - Abastecimento com autorização

### Tipo de Veículo (`tipo_veiculo`)

- `"Ambulancia"` - Ambulância
- `"Caminhao"` - Caminhão
- `"Caminhonete"` - Caminhonete
- `"Carro"` - Carro
- `"Maquina_Pesada"` - Máquina Pesada
- `"Microonibus"` - Microônibus
- `"Moto"` - Moto
- `"Onibus"` - Ônibus
- `"Outro"` - Outro

### Situação do Veículo (`situacao_veiculo`)

- `"Locado"` - Locado
- `"Particular_a_servico"` - Particular à serviço
- `"Proprio"` - Próprio

### Periodicidade (`periodicidade`)

- `"Diario"` - Diário
- `"Semanal"` - Semanal
- `"Mensal"` - Mensal

## 📤 Estrutura de Cotas de Período

O campo `cotasPeriodo` é um array opcional com a seguinte estrutura:

```json
[
  {
    "data_inicio_periodo": "2024-01-01T00:00:00.000Z",
    "data_fim_periodo": "2024-12-31T23:59:59.000Z",
    "quantidade_permitida": 1000.0,
    "periodicidade": "Semanal"
  }
]
```

## 💡 Exemplos de Requisições

### Exemplo 1: Veículo Tipo COTA (Mínimo)

```json
{
  "prefeituraId": 1,
  "orgaoId": 1,
  "nome": "Ambulância 01",
  "placa": "ABC-1234",
  "capacidade_tanque": 80.0,
  "tipo_abastecimento": "COTA",
  "periodicidade": "Semanal",
  "quantidade": 100.0,
  "combustivelIds": [1]
}
```

**Nota:** O campo `ano` é opcional e foi omitido neste exemplo.

### Exemplo 2: Veículo Tipo COTA (Completo)

```json
{
  "prefeituraId": 1,
  "orgaoId": 1,
  "contaFaturamentoOrgaoId": 1,
  "nome": "Ambulância 02",
  "placa": "DEF-5678",
  "modelo": "Mercedes Sprinter",
  "ano": 2021,
  "tipo_abastecimento": "COTA",
  "ativo": true,
  "capacidade_tanque": 100.0,
  "tipo_veiculo": "Ambulancia",
  "situacao_veiculo": "Proprio",
  "periodicidade": "Semanal",
  "quantidade": 120.0,
  "apelido": "Ambulância da Emergência",
  "ano_fabricacao": 2020,
  "chassi": "9BWZZZZZZZZZZZZZZ",
  "renavam": "98765432109",
  "crlv": "CRLV123456",
  "crlv_vencimento": "2024-12-31T00:00:00.000Z",
  "tacografo": "TACO123456",
  "cor": "Branco",
  "capacidade_passageiros": 6,
  "observacoes": "Veículo novo em excelente estado",
  "categoriaIds": [1, 2],
  "combustivelIds": [1, 2],
  "motoristaIds": [1, 2]
}
```

### Exemplo 3: Veículo Tipo LIVRE

```json
{
  "prefeituraId": 1,
  "orgaoId": 1,
  "nome": "Carro Administrativo",
  "placa": "XYZ-9876",
  "ano": 2019,
  "capacidade_tanque": 50.0,
  "tipo_abastecimento": "LIVRE",
  "modelo": "Chevrolet Onix",
  "tipo_veiculo": "Carro",
  "situacao_veiculo": "Proprio",
  "combustivelIds": [1]
}
```

### Exemplo 4: Veículo Tipo COM_AUTORIZACAO

```json
{
  "prefeituraId": 1,
  "orgaoId": 1,
  "nome": "Caminhão de Obras",
  "placa": "MNO-5432",
  "ano": 2018,
  "capacidade_tanque": 200.0,
  "tipo_abastecimento": "COM_AUTORIZACAO",
  "modelo": "Volkswagen Delivery",
  "tipo_veiculo": "Caminhao",
  "situacao_veiculo": "Locado",
  "combustivelIds": [2]
}
```

## 📨 Formato de Requisição

### JSON (application/json)

Para requisições JSON simples, use o header:

```
Content-Type: application/json
```

### Multipart/Form-Data

Para incluir arquivos (foto do veículo), use:

```
Content-Type: multipart/form-data
```

Neste caso, o campo `foto_veiculo` deve ser enviado como arquivo, e os demais campos podem ser enviados como strings (arrays separados por vírgula).

**Exemplo com multipart/form-data:**

```
prefeituraId: 1
orgaoId: 1
nome: Ambulância 01
placa: ABC-1234
ano: 2020
capacidade_tanque: 80.0
tipo_abastecimento: COTA
periodicidade: Semanal
quantidade: 100.0
combustivelIds: 1,2
categoriaIds: 1,2
motoristaIds: 1
foto_veiculo: [arquivo]
```

## ✅ Respostas da API

### Sucesso (201 Created)

```json
{
  "id": 1,
  "prefeituraId": 1,
  "orgaoId": 1,
  "nome": "Ambulância 01",
  "placa": "ABC-1234",
  "modelo": "Ford Transit",
  "ano": 2020,
  "tipo_abastecimento": "COTA",
  "ativo": true,
  "capacidade_tanque": 80.0,
  "tipo_veiculo": "Ambulancia",
  "situacao_veiculo": "Proprio",
  "prefeitura": {
    "id": 1,
    "nome": "Prefeitura Municipal",
    "cnpj": "12.345.678/0001-90"
  },
  "orgao": {
    "id": 1,
    "nome": "Secretaria de Saúde",
    "sigla": "SMS"
  },
  "categorias": [
    {
      "id": 1,
      "categoria": {
        "id": 1,
        "nome": "Emergência",
        "descricao": "Veículos de emergência"
      }
    }
  ],
  "combustiveis": [
    {
      "id": 1,
      "combustivel": {
        "id": 1,
        "nome": "Gasolina",
        "sigla": "GAS"
      }
    }
  ],
  "motoristas": []
}
```

### Erro - Veículo já existe (409 Conflict)

```json
{
  "statusCode": 409,
  "message": "Veículo com esta placa já existe",
  "error": "Conflict"
}
```

### Erro - Dados inválidos (400 Bad Request)

```json
{
  "statusCode": 400,
  "message": [
    "Nome deve ter pelo menos 3 caracteres",
    "Órgão responsável é obrigatório",
    "Pelo menos um combustível deve ser especificado"
  ],
  "error": "Bad Request"
}
```

### Erro - Não autorizado (401 Unauthorized)

```json
{
  "statusCode": 401,
  "message": "Unauthorized"
}
```

### Erro - Sem permissão (403 Forbidden)

```json
{
  "statusCode": 403,
  "message": "Sem permissão para cadastrar veículo"
}
```

## ⚠️ Regras e Validações

1. **Placa única**: A placa do veículo deve ser única no sistema.

2. **Órgão obrigatório**: Todo veículo deve estar vinculado a um órgão.

3. **Combustíveis obrigatórios**: Pelo menos um combustível deve ser especificado.

4. **Tipo COTA**: Quando o tipo de abastecimento for `COTA`, os campos `periodicidade` e `quantidade` são obrigatórios.

5. **Motoristas**: Os motoristas devem pertencer à mesma prefeitura do veículo.

6. **Categorias**: As categorias são opcionais, mas devem existir no sistema.

7. **Conta de faturamento**: Se fornecida, deve pertencer ao órgão especificado.

8. **IDs válidos**: Todos os IDs fornecidos (prefeituraId, orgaoId, combustivelIds, etc.) devem existir no sistema.

## 📚 Requisição cURL

### Exemplo com JSON

```bash
curl -X POST http://localhost:3000/veiculos \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer {seu_token_jwt}" \
  -d '{
    "prefeituraId": 1,
    "orgaoId": 1,
    "nome": "Ambulância 01",
    "placa": "ABC-1234",
    "ano": 2020,
    "capacidade_tanque": 80.0,
    "tipo_abastecimento": "COTA",
    "periodicidade": "Semanal",
    "quantidade": 100.0,
    "combustivelIds": [1]
  }'
```

### Exemplo com Multipart/Form-Data (com foto)

```bash
curl -X POST http://localhost:3000/veiculos \
  -H "Authorization: Bearer {seu_token_jwt}" \
  -F "prefeituraId=1" \
  -F "orgaoId=1" \
  -F "nome=Ambulância 01" \
  -F "placa=ABC-1234" \
  -F "ano=2020" \
  -F "capacidade_tanque=80.0" \
  -F "tipo_abastecimento=COTA" \
  -F "periodicidade=Semanal" \
  -F "quantidade=100.0" \
  -F "combustivelIds=1,2" \
  -F "foto_veiculo=@/caminho/para/foto.jpg"
```

## 🔍 Dicas Importantes

1. **Verifique os IDs**: Antes de cadastrar, certifique-se de que os IDs fornecidos (prefeituraId, orgaoId, combustivelIds, etc.) existem no sistema.

2. **Placa única**: Verifique se a placa já não está cadastrada. Você pode listar os veículos existentes antes de cadastrar.

3. **Tipo COTA**: Se escolher o tipo `COTA`, não esqueça de incluir `periodicidade` e `quantidade`.

4. **Upload de fotos**: Para fazer upload de fotos, use o formato `multipart/form-data` e envie o arquivo no campo `foto_veiculo`.

5. **Arrays separados por vírgula**: No formato `multipart/form-data`, arrays podem ser enviados como strings separadas por vírgula (ex: `"1,2,3"`).

## 📖 Documentação Relacionada

- Para listar veículos, consulte: `GET /veiculos`
- Para atualizar veículos, consulte: `PUT /veiculos/:id`
- Para deletar veículos, consulte: `DELETE /veiculos/:id`
- Para visualizar detalhes de um veículo, consulte: `GET /veiculos/:id`

---

**Última atualização:** Dezembro 2024


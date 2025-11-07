# 🚗 Cadastros de Veículos - Exemplos para Postman

Este arquivo contém exemplos completos de JSONs para cadastro de veículos via API usando Postman.

## 📋 Informações Importantes

### Campos Obrigatórios
- `prefeituraId`: ID da prefeitura
- `orgaoId`: ID do órgão responsável
- `nome`: Nome do veículo
- `placa`: Placa do veículo (única no sistema)
- `ano`: Ano do veículo
- `capacidade_tanque`: Capacidade do tanque em litros (número decimal)
- `tipo_abastecimento`: Tipo de abastecimento (`COTA`, `LIVRE`, `COM_AUTORIZACAO`)
- `combustivelIds`: Array com IDs dos combustíveis permitidos (obrigatório, pelo menos 1)

### Campos Condicionalmente Obrigatórios
- **Para `tipo_abastecimento: "COTA"`:**
  - `periodicidade`: Periodicidade de abastecimento (`Diario`, `Semanal`, `Mensal`)
  - `quantidade`: Quantidade em litros permitida por período (número decimal)

### Campos Opcionais
- `modelo`: Modelo do veículo
- `tipo_veiculo`: Tipo (`Ambulancia`, `Caminhao`, `Caminhonete`, `Carro`, `Maquina_Pesada`, `Microonibus`, `Moto`, `Onibus`, `Outro`)
- `situacao_veiculo`: Situação (`Proprio`, `Locado`, `Particular_a_servico`)
- `apelido`: Apelido do veículo
- `ano_fabricacao`: Ano de fabricação
- `chassi`: Número do chassi
- `renavam`: Número do RENAVAM
- `crlv`: Número do CRLV
- `crlv_vencimento`: Data de vencimento do CRLV (formato ISO)
- `tacografo`: Número do tacógrafo
- `cor`: Cor do veículo
- `capacidade_passageiros`: Número de passageiros
- `observacoes`: Observações sobre o veículo
- `ativo`: Status ativo/inativo (padrão: `true`)
- `categoriaIds`: Array com IDs das categorias do veículo
- `motoristaIds`: Array com IDs dos motoristas habilitados
- `cotasPeriodo`: Array com cotas de período (objeto com `data_inicio_periodo`, `data_fim_periodo`, `quantidade_permitida`, `periodicidade`)
- `contaFaturamentoOrgaoId`: ID da conta de faturamento do órgão
- `foto_veiculo`: URL da foto do veículo

---

## 📝 Exemplos de Cadastro

### 1. 🚑 Ambulância UTI - Tipo COTA (Completo)

```json
{
  "prefeituraId": 1,
  "orgaoId": 1,
  "nome": "Ambulância UTI 01",
  "placa": "ABC-1234",
  "modelo": "Ford Transit",
  "ano": 2020,
  "ano_fabricacao": 2019,
  "capacidade_tanque": 80.0,
  "tipo_abastecimento": "COTA",
  "periodicidade": "Semanal",
  "quantidade": 150.0,
  "tipo_veiculo": "Ambulancia",
  "situacao_veiculo": "Proprio",
  "apelido": "Ambulância da Saúde",
  "chassi": "9BWZZZZZZZZZZZZZZ",
  "renavam": "12345678901",
  "cor": "Branco",
  "capacidade_passageiros": 8,
  "observacoes": "Veículo de emergência médica - UTI. Em excelente estado de conservação.",
  "ativo": true,
  "combustivelIds": [1],
  "categoriaIds": [1],
  "motoristaIds": [1]
}
```

### 2. 🚑 Ambulância Básica - Tipo COTA (Mínimo)

```json
{
  "prefeituraId": 1,
  "orgaoId": 1,
  "nome": "Ambulância Básica 02",
  "placa": "ABC-5678",
  "ano": 2019,
  "capacidade_tanque": 75.0,
  "tipo_abastecimento": "COTA",
  "periodicidade": "Semanal",
  "quantidade": 120.0,
  "combustivelIds": [1]
}
```

### 3. 🚗 Carro Administrativo - Tipo COTA (Completo)

```json
{
  "prefeituraId": 1,
  "orgaoId": 2,
  "nome": "Carro Administrativo Saúde",
  "placa": "ABC-9012",
  "modelo": "Chevrolet Onix",
  "ano": 2022,
  "ano_fabricacao": 2021,
  "capacidade_tanque": 54.0,
  "tipo_abastecimento": "COTA",
  "periodicidade": "Mensal",
  "quantidade": 200.0,
  "tipo_veiculo": "Carro",
  "situacao_veiculo": "Proprio",
  "apelido": "Onix SMS",
  "chassi": "9BWZZZZZZZZZZZZZX",
  "renavam": "12345678903",
  "cor": "Prata",
  "capacidade_passageiros": 5,
  "observacoes": "Veículo para uso administrativo da Secretaria de Saúde",
  "ativo": true,
  "combustivelIds": [1, 2],
  "categoriaIds": [2],
  "motoristaIds": [3]
}
```

### 4. 🚌 Van Transporte Escolar - Tipo COTA (Completo)

```json
{
  "prefeituraId": 1,
  "orgaoId": 2,
  "nome": "Van Transporte Escolar 01",
  "placa": "ABC-3456",
  "modelo": "Volkswagen Kombi",
  "ano": 2021,
  "ano_fabricacao": 2020,
  "capacidade_tanque": 60.0,
  "tipo_abastecimento": "COTA",
  "periodicidade": "Semanal",
  "quantidade": 80.0,
  "tipo_veiculo": "Microonibus",
  "situacao_veiculo": "Proprio",
  "apelido": "Van Escolar",
  "chassi": "9BWZZZZZZZZZZZZZW",
  "renavam": "12345678904",
  "cor": "Amarelo",
  "capacidade_passageiros": 12,
  "observacoes": "Veículo para transporte de estudantes. Pintura amarela conforme legislação.",
  "ativo": true,
  "combustivelIds": [1],
  "categoriaIds": [4],
  "motoristaIds": [1]
}
```

### 5. 🚛 Caminhão - Tipo COTA (Completo)

```json
{
  "prefeituraId": 1,
  "orgaoId": 3,
  "nome": "Caminhão Caçamba 01",
  "placa": "ABC-2468",
  "modelo": "Volvo FH 460",
  "ano": 2019,
  "ano_fabricacao": 2018,
  "capacidade_tanque": 150.0,
  "tipo_abastecimento": "COTA",
  "periodicidade": "Semanal",
  "quantidade": 250.0,
  "tipo_veiculo": "Caminhao",
  "situacao_veiculo": "Proprio",
  "apelido": "Caçamba",
  "chassi": "9BWZZZZZZZZZZZZZU",
  "renavam": "12345678906",
  "cor": "Branco",
  "observacoes": "Caminhão para transporte de materiais e resíduos",
  "ativo": true,
  "combustivelIds": [1],
  "categoriaIds": [3],
  "motoristaIds": [2],
  "tacografo": "TAC123456"
}
```

### 6. 🚜 Máquina Pesada - Tipo COTA (Completo)

```json
{
  "prefeituraId": 1,
  "orgaoId": 3,
  "nome": "Retroescavadeira 01",
  "placa": "ABC-7890",
  "modelo": "Caterpillar 416E",
  "ano": 2020,
  "ano_fabricacao": 2019,
  "capacidade_tanque": 120.0,
  "tipo_abastecimento": "COTA",
  "periodicidade": "Mensal",
  "quantidade": 300.0,
  "tipo_veiculo": "Maquina_Pesada",
  "situacao_veiculo": "Proprio",
  "apelido": "Retroescavadeira",
  "chassi": "9BWZZZZZZZZZZZZZV",
  "renavam": "12345678905",
  "cor": "Amarelo",
  "observacoes": "Máquina pesada para obras e terraplanagem",
  "ativo": true,
  "combustivelIds": [1],
  "categoriaIds": [3],
  "motoristaIds": [3]
}
```

### 7. 🏍️ Moto - Tipo LIVRE (Completo)

```json
{
  "prefeituraId": 1,
  "orgaoId": 2,
  "nome": "Moto Administrativa",
  "placa": "ABC-1357",
  "modelo": "Honda CG 160",
  "ano": 2023,
  "ano_fabricacao": 2022,
  "capacidade_tanque": 15.0,
  "tipo_abastecimento": "LIVRE",
  "tipo_veiculo": "Moto",
  "situacao_veiculo": "Proprio",
  "apelido": "Moto SME",
  "chassi": "9BWZZZZZZZZZZZZZT",
  "renavam": "12345678907",
  "cor": "Preto",
  "observacoes": "Moto para inspeções e serviços rápidos da Secretaria de Educação",
  "ativo": true,
  "combustivelIds": [1, 2],
  "categoriaIds": [2]
}
```

### 8. 🚙 Caminhonete - Tipo COM_AUTORIZACAO (Completo)

```json
{
  "prefeituraId": 1,
  "orgaoId": 1,
  "nome": "Caminhonete SMS",
  "placa": "ABC-9753",
  "modelo": "Toyota Hilux",
  "ano": 2021,
  "ano_fabricacao": 2020,
  "capacidade_tanque": 75.0,
  "tipo_abastecimento": "COM_AUTORIZACAO",
  "tipo_veiculo": "Caminhonete",
  "situacao_veiculo": "Proprio",
  "apelido": "Hilux Saúde",
  "chassi": "9BWZZZZZZZZZZZZZS",
  "renavam": "12345678908",
  "cor": "Branco",
  "capacidade_passageiros": 5,
  "observacoes": "Caminhonete para serviços externos - requer autorização prévia para abastecimento",
  "ativo": true,
  "combustivelIds": [1, 2],
  "categoriaIds": [2],
  "motoristaIds": [1, 3]
}
```

### 9. 🚐 Microônibus - Tipo COTA com Cotas de Período

```json
{
  "prefeituraId": 1,
  "orgaoId": 2,
  "nome": "Microônibus Transporte Escolar",
  "placa": "ABC-2469",
  "modelo": "Mercedes-Benz Sprinter",
  "ano": 2022,
  "ano_fabricacao": 2021,
  "capacidade_tanque": 70.0,
  "tipo_abastecimento": "COTA",
  "periodicidade": "Semanal",
  "quantidade": 90.0,
  "tipo_veiculo": "Microonibus",
  "situacao_veiculo": "Proprio",
  "apelido": "Sprinter Escolar",
  "chassi": "9BWZZZZZZZZZZZZZR",
  "renavam": "12345678909",
  "cor": "Amarelo",
  "capacidade_passageiros": 15,
  "observacoes": "Microônibus para transporte de estudantes com capacidade para 15 passageiros",
  "ativo": true,
  "combustivelIds": [1],
  "categoriaIds": [4],
  "motoristaIds": [1, 2],
  "cotasPeriodo": [
    {
      "data_inicio_periodo": "2024-01-01T00:00:00.000Z",
      "data_fim_periodo": "2024-06-30T23:59:59.000Z",
      "quantidade_permitida": 2340.0,
      "periodicidade": "Semanal"
    },
    {
      "data_inicio_periodo": "2024-07-01T00:00:00.000Z",
      "data_fim_periodo": "2024-12-31T23:59:59.000Z",
      "quantidade_permitida": 2340.0,
      "periodicidade": "Semanal"
    }
  ]
}
```

### 10. 🚗 Carro - Tipo COTA com Conta de Faturamento

```json
{
  "prefeituraId": 1,
  "orgaoId": 1,
  "contaFaturamentoOrgaoId": 1,
  "nome": "Carro Executivo",
  "placa": "ABC-1111",
  "modelo": "Toyota Corolla",
  "ano": 2023,
  "ano_fabricacao": 2022,
  "capacidade_tanque": 55.0,
  "tipo_abastecimento": "COTA",
  "periodicidade": "Mensal",
  "quantidade": 180.0,
  "tipo_veiculo": "Carro",
  "situacao_veiculo": "Proprio",
  "apelido": "Corolla Executivo",
  "chassi": "9BWZZZZZZZZZZZZZQ",
  "renavam": "12345678910",
  "crlv": "CRLV123456",
  "crlv_vencimento": "2025-12-31T23:59:59.000Z",
  "cor": "Preto",
  "capacidade_passageiros": 5,
  "observacoes": "Veículo executivo da Secretaria de Saúde",
  "ativo": true,
  "combustivelIds": [1, 2],
  "categoriaIds": [2],
  "motoristaIds": [3]
}
```

### 11. 🚌 Ônibus - Tipo COTA (Mínimo)

```json
{
  "prefeituraId": 1,
  "orgaoId": 2,
  "nome": "Ônibus Escolar 01",
  "placa": "ABC-8888",
  "ano": 2020,
  "capacidade_tanque": 200.0,
  "tipo_abastecimento": "COTA",
  "periodicidade": "Semanal",
  "quantidade": 150.0,
  "combustivelIds": [1]
}
```

### 12. 🚗 Veículo Locado - Tipo LIVRE

```json
{
  "prefeituraId": 1,
  "orgaoId": 1,
  "nome": "Veículo Locado Temporário",
  "placa": "ABC-7777",
  "modelo": "Fiat Uno",
  "ano": 2020,
  "capacidade_tanque": 48.0,
  "tipo_abastecimento": "LIVRE",
  "tipo_veiculo": "Carro",
  "situacao_veiculo": "Locado",
  "observacoes": "Veículo locado para uso temporário",
  "ativo": true,
  "combustivelIds": [1, 2]
}
```

---

## 📌 Notas Importantes

### Valores dos Enums

**Tipo de Abastecimento:**
- `COTA` - Abastecimento com cota limitada
- `LIVRE` - Abastecimento livre
- `COM_AUTORIZACAO` - Abastecimento requer autorização

**Tipo de Veículo:**
- `Ambulancia`
- `Caminhao`
- `Caminhonete`
- `Carro`
- `Maquina_Pesada`
- `Microonibus`
- `Moto`
- `Onibus`
- `Outro`

**Situação do Veículo:**
- `Proprio` - Veículo próprio
- `Locado` - Veículo locado
- `Particular_a_servico` - Veículo particular à serviço

**Periodicidade:**
- `Diario` - Diário
- `Semanal` - Semanal
- `Mensal` - Mensal

### Endpoint da API

```
POST /veiculos
```

### Headers Necessários

```json
{
  "Authorization": "Bearer {seu_token_jwt}",
  "Content-Type": "application/json"
}
```

### Exemplo de Requisição no Postman

1. Método: `POST`
2. URL: `{{base_url}}/veiculos`
3. Headers:
   - `Authorization`: `Bearer {{jwt_token}}`
   - `Content-Type`: `application/json`
4. Body (raw - JSON): Use um dos exemplos acima

---

## ⚠️ Regras e Validações

1. **Placa única**: A placa deve ser única no sistema. Se tentar cadastrar uma placa que já existe, receberá erro 409 (Conflict).

2. **Órgão obrigatório**: Todo veículo deve estar vinculado a um órgão (`orgaoId`).

3. **Combustível obrigatório**: Pelo menos um combustível deve ser especificado no array `combustivelIds`.

4. **Cota obrigatória para tipo COTA**: Se o tipo de abastecimento for `COTA`, os campos `periodicidade` e `quantidade` são obrigatórios.

5. **Motoristas**: Os motoristas devem pertencer à mesma prefeitura do veículo.

6. **Categorias**: As categorias devem existir no sistema e ser do tipo `VEICULO`.

7. **Prefeitura e Órgão**: O órgão deve pertencer à prefeitura especificada.

---

## 🔄 Exemplo de Resposta de Sucesso

```json
{
  "message": "Veículo criado com sucesso",
  "veiculo": {
    "id": 1,
    "prefeituraId": 1,
    "orgaoId": 1,
    "nome": "Ambulância UTI 01",
    "placa": "ABC-1234",
    "modelo": "Ford Transit",
    "ano": 2020,
    "tipo_abastecimento": "COTA",
    "ativo": true,
    "capacidade_tanque": "80.00",
    "tipo_veiculo": "Ambulancia",
    "situacao_veiculo": "Proprio",
    "periodicidade": "Semanal",
    "quantidade": "150.00",
    "prefeitura": {
      "id": 1,
      "nome": "Prefeitura Municipal de São Paulo",
      "cnpj": "12345678000195"
    },
    "orgao": {
      "id": 1,
      "nome": "Secretaria Municipal de Saúde",
      "sigla": "SMS"
    },
    "combustiveis": [...],
    "categorias": [...],
    "motoristas": [...]
  }
}
```

---

## ❌ Exemplo de Resposta de Erro

```json
{
  "statusCode": 409,
  "message": "Veículo já existe com esta placa nesta prefeitura",
  "error": "Conflict"
}
```

---

**📅 Última atualização:** 2024


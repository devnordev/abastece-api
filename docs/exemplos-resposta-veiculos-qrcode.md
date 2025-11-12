# Exemplos de Resposta da Rota GET /veiculos com Informações de QR Code

A rota GET `/veiculos` agora retorna informações sobre solicitações de QR Code para cada veículo na resposta.

## Estrutura do Campo `solicitacaoQRCode`

Cada veículo na resposta inclui um objeto `solicitacaoQRCode` com as seguintes propriedades:

- `temSolicitacao`: boolean - Indica se o veículo possui alguma solicitação de QR Code
- `possuiSolicitacaoSolicitada`: boolean - Indica se o veículo possui uma solicitação com status "Solicitado"
- `possuiSolicitacaoAprovada`: boolean - Indica se o veículo possui uma solicitação com status "Aprovado"
- `status`: string | null - Status da solicitação mais relevante (Solicitado > Aprovado > Mais recente)
- `mensagem`: string - Mensagem descritiva sobre o status da solicitação
- `id`: number | null - ID da solicitação mais relevante

---

## 📋 Caso 1: Veículo com Solicitação Status "Solicitado"

### JSON de Resposta:

```json
{
  "message": "Veículos encontrados com sucesso",
  "veiculos": [
    {
      "id": 1,
      "prefeituraId": 1,
      "orgaoId": 1,
      "contaFaturamentoOrgaoId": null,
      "nome": "Ambulância UTI 01",
      "placa": "ABC-1234",
      "modelo": "Ford Transit",
      "ano": 2020,
      "tipo_abastecimento": "COTA",
      "ativo": true,
      "capacidade_tanque": "80.00",
      "tipo_veiculo": "Ambulancia",
      "situacao_veiculo": "Proprio",
      "observacoes": null,
      "periodicidade": "Mensal",
      "quantidade": "500.0",
      "apelido": null,
      "ano_fabricacao": 2020,
      "chassi": null,
      "renavam": null,
      "crlv": null,
      "crlv_vencimento": null,
      "tacografo": null,
      "foto_veiculo": null,
      "foto_crlv": null,
      "cor": "Branco",
      "capacidade_passageiros": 2,
      "prefeitura": {
        "id": 1,
        "nome": "Prefeitura Municipal de Campinas",
        "cnpj": "12.345.678/0001-90"
      },
      "orgao": {
        "id": 1,
        "nome": "Secretaria de Saúde",
        "sigla": "SMS"
      },
      "contaFaturamento": null,
      "solicitacaoQRCode": {
        "temSolicitacao": true,
        "possuiSolicitacaoSolicitada": true,
        "possuiSolicitacaoAprovada": false,
        "status": "Solicitado",
        "mensagem": "Este veículo possui uma solicitação de QR Code com status Solicitado",
        "id": 1
      }
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 1,
    "totalPages": 1
  }
}
```

### Campos Importantes:
- ✅ `temSolicitacao`: `true` - O veículo possui solicitação
- ✅ `possuiSolicitacaoSolicitada`: `true` - Possui solicitação com status "Solicitado"
- ❌ `possuiSolicitacaoAprovada`: `false` - Não possui solicitação com status "Aprovado"
- 📝 `status`: `"Solicitado"` - Status da solicitação
- 📝 `mensagem`: `"Este veículo possui uma solicitação de QR Code com status Solicitado"`
- 🔢 `id`: `1` - ID da solicitação

---

## 📋 Caso 2: Veículo sem Solicitação de QR Code

### JSON de Resposta:

```json
{
  "message": "Veículos encontrados com sucesso",
  "veiculos": [
    {
      "id": 2,
      "prefeituraId": 1,
      "orgaoId": 2,
      "contaFaturamentoOrgaoId": null,
      "nome": "Carro de Inspeção 01",
      "placa": "DEF-5678",
      "modelo": "Honda Civic",
      "ano": 2019,
      "tipo_abastecimento": "LIVRE",
      "ativo": true,
      "capacidade_tanque": "50.00",
      "tipo_veiculo": "Carro",
      "situacao_veiculo": "Proprio",
      "observacoes": null,
      "periodicidade": null,
      "quantidade": null,
      "apelido": null,
      "ano_fabricacao": 2019,
      "chassi": null,
      "renavam": null,
      "crlv": null,
      "crlv_vencimento": null,
      "tacografo": null,
      "foto_veiculo": null,
      "foto_crlv": null,
      "cor": "Prata",
      "capacidade_passageiros": 5,
      "prefeitura": {
        "id": 1,
        "nome": "Prefeitura Municipal de Campinas",
        "cnpj": "12.345.678/0001-90"
      },
      "orgao": {
        "id": 2,
        "nome": "Secretaria de Obras",
        "sigla": "SMO"
      },
      "contaFaturamento": null,
      "solicitacaoQRCode": {
        "temSolicitacao": false,
        "possuiSolicitacaoSolicitada": false,
        "possuiSolicitacaoAprovada": false,
        "status": null,
        "mensagem": "Não há solicitação de QR Code para este veículo",
        "id": null
      }
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 1,
    "totalPages": 1
  }
}
```

### Campos Importantes:
- ❌ `temSolicitacao`: `false` - O veículo não possui solicitação
- ❌ `possuiSolicitacaoSolicitada`: `false` - Não possui solicitação com status "Solicitado"
- ❌ `possuiSolicitacaoAprovada`: `false` - Não possui solicitação com status "Aprovado"
- 📝 `status`: `null` - Sem status (não há solicitação)
- 📝 `mensagem`: `"Não há solicitação de QR Code para este veículo"`
- 🔢 `id`: `null` - Sem ID (não há solicitação)

---

## 📋 Caso 3: Veículo com Solicitação Status "Aprovado"

### JSON de Resposta:

```json
{
  "message": "Veículos encontrados com sucesso",
  "veiculos": [
    {
      "id": 3,
      "prefeituraId": 1,
      "orgaoId": 3,
      "contaFaturamentoOrgaoId": null,
      "nome": "Caminhão de Coleta 01",
      "placa": "GHI-9012",
      "modelo": "Mercedes-Benz",
      "ano": 2021,
      "tipo_abastecimento": "COTA",
      "ativo": true,
      "capacidade_tanque": "200.00",
      "tipo_veiculo": "Caminhao",
      "situacao_veiculo": "Proprio",
      "observacoes": null,
      "periodicidade": "Semanal",
      "quantidade": "1000.0",
      "apelido": null,
      "ano_fabricacao": 2021,
      "chassi": null,
      "renavam": null,
      "crlv": null,
      "crlv_vencimento": null,
      "tacografo": null,
      "foto_veiculo": null,
      "foto_crlv": null,
      "cor": "Verde",
      "capacidade_passageiros": 3,
      "prefeitura": {
        "id": 1,
        "nome": "Prefeitura Municipal de Campinas",
        "cnpj": "12.345.678/0001-90"
      },
      "orgao": {
        "id": 3,
        "nome": "Secretaria de Meio Ambiente",
        "sigla": "SMA"
      },
      "contaFaturamento": null,
      "solicitacaoQRCode": {
        "temSolicitacao": true,
        "possuiSolicitacaoSolicitada": false,
        "possuiSolicitacaoAprovada": true,
        "status": "Aprovado",
        "mensagem": "Este veículo possui uma solicitação de QR Code com status Aprovado",
        "id": 2
      }
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 1,
    "totalPages": 1
  }
}
```

### Campos Importantes:
- ✅ `temSolicitacao`: `true` - O veículo possui solicitação
- ❌ `possuiSolicitacaoSolicitada`: `false` - Não possui solicitação com status "Solicitado"
- ✅ `possuiSolicitacaoAprovada`: `true` - Possui solicitação com status "Aprovado"
- 📝 `status`: `"Aprovado"` - Status da solicitação
- 📝 `mensagem`: `"Este veículo possui uma solicitação de QR Code com status Aprovado"`
- 🔢 `id`: `2` - ID da solicitação

---

## 🔄 Lógica de Prioridade

A lógica de prioridade para determinar qual solicitação mostrar é:

1. **Solicitado** - Prioridade mais alta (mostrado primeiro)
2. **Aprovado** - Segunda prioridade (mostrado se não houver "Solicitado")
3. **Mais recente** - Se não houver solicitação com status "Solicitado" ou "Aprovado", mostra a mais recente

Isso significa que se um veículo tiver múltiplas solicitações, o sistema sempre mostrará primeiro uma solicitação com status "Solicitado", depois "Aprovado", e por último a mais recente.

---

## 📝 Observações Importantes

- O campo `temSolicitacao` é `true` quando existe **qualquer** solicitação de QR Code para o veículo
- O campo `possuiSolicitacaoSolicitada` é `true` quando existe uma solicitação com status **"Solicitado"**
- O campo `possuiSolicitacaoAprovada` é `true` quando existe uma solicitação com status **"Aprovado"**
- O campo `status` pode ser: `"Solicitado"`, `"Aprovado"`, `"Em_Producao"`, `"Integracao"`, `"Concluida"` ou `null`
- O campo `id` contém o ID da solicitação mais relevante ou `null` se não houver solicitação
- A mensagem é descritiva e informa claramente o status da solicitação

---

## 🚀 Como Usar

Após aplicar a migration em produção, a rota GET `/veiculos` automaticamente incluirá essas informações para cada veículo retornado na resposta.

### Exemplo de Requisição:

```bash
GET /veiculos?page=1&limit=10
Authorization: Bearer <seu-token-jwt>
```

### Exemplo de Resposta:

A resposta incluirá o objeto `solicitacaoQRCode` para cada veículo, conforme os exemplos acima.

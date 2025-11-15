# Processo Estrela – Cadastro Completo (OBJETIVO)

Guia prático para simular via HTTP o cadastro de um processo do tipo **OBJETIVO** utilizando todos os campos disponíveis no modelo `Processo`.

## Contexto
- **Perfil necessário:** `ADMIN_PREFEITURA` autenticado (token JWT válido).
- **Rota:** `POST /processos`
- **Descrição:** Cria o processo principal vinculado à prefeitura do usuário. Pela regra atual, cada prefeitura só pode ter um processo ativo.

## Requisitos
1. O usuário autenticado deve possuir perfil `ADMIN_PREFEITURA`.
2. A prefeitura (`prefeituraId`) já precisa existir.
3. O número do processo não pode estar em uso pela mesma prefeitura.
4. `data_encerramento` deve ser posterior à `data_abertura`.

## Requisição
- **Método:** `POST`
- **URL:** `/processos`
- **Headers obrigatórios:**
  - `Authorization: Bearer <token_admin_prefeitura>`
  - `Content-Type: application/json`

### JSON de envio (todos os campos do modelo)
```json
{
  "tipo_contrato": "OBJETIVO",
  "prefeituraId": 42,
  "litros_desejados": "400000.00",
  "valor_utilizado": "0.00",
  "valor_disponivel": "3500000.00",
  "numero_processo": "0592025",
  "numero_documento": "59595959",
  "tipo_documento": "ARP",
  "tipo_itens": "QUANTIDADE_LITROS",
  "objeto": "400.000 litros de combustivel.",
  "data_abertura": "2025-01-10T12:00:00.000Z",
  "data_encerramento": "2026-01-10T12:00:00.000Z",
  "status": "ATIVO",
  "ativo": true,
  "observacoes": "O município não possui estimativa anterior de combusteveis consumidos por periodo.",
  "arquivo_contrato": "https://files.prefeitura.gov.br/contratos/processo-estrela.pdf",
  "combustiveis": [
    {
      "combustivelId": 101,
      "nome": "ETANOL HIDRATADO",
      "quantidade_litros": "80000.00"
    },
    {
      "combustivelId": 102,
      "nome": "GASOLINA COMUM",
      "quantidade_litros": "120000.00"
    },
    {
      "combustivelId": 103,
      "nome": "ÓLEO DIESEL",
      "quantidade_litros": "100000.00"
    },
    {
      "combustivelId": 104,
      "nome": "ÓLEO DIESEL S10",
      "quantidade_litros": "100000.00"
    }
  ]
}
```

> **Observação:** Campos `litros_desejados`, `valor_utilizado` e `valor_disponivel` são `Decimal` no Prisma. Envie como string para evitar perda de precisão.

## Resposta (201 – sucesso)
```json
{
  "message": "Processo criado com sucesso",
  "processo": {
    "id": 123,
    "tipo_contrato": "OBJETIVO",
    "prefeituraId": 42,
    "litros_desejados": "400000.00",
    "valor_utilizado": "0.00",
    "valor_disponivel": "3500000.00",
    "numero_processo": "0592025",
    "numero_documento": "59595959",
    "tipo_documento": "ARP",
    "tipo_itens": "QUANTIDADE_LITROS",
    "objeto": "400.000 litros de combustivel.",
    "data_abertura": "2025-01-10T12:00:00.000Z",
    "data_encerramento": "2026-01-10T12:00:00.000Z",
    "status": "ATIVO",
    "ativo": true,
    "observacoes": "O município não possui estimativa anterior de combusteveis consumidos por periodo.",
    "arquivo_contrato": "https://files.prefeitura.gov.br/contratos/processo-estrela.pdf",
    "prefeitura": {
      "id": 42,
      "nome": "Prefeitura Estelar",
      "cnpj": "12.345.678/0001-99"
    },
    "combustiveis": [
      {
        "combustivelId": 101,
        "nome": "ETANOL HIDRATADO",
        "quantidade_litros": "80000.00"
      },
      {
        "combustivelId": 102,
        "nome": "GASOLINA COMUM",
        "quantidade_litros": "120000.00"
      },
      {
        "combustivelId": 103,
        "nome": "ÓLEO DIESEL",
        "quantidade_litros": "100000.00"
      },
      {
        "combustivelId": 104,
        "nome": "ÓLEO DIESEL S10",
        "quantidade_litros": "100000.00"
      }
    ]
  }
}
```

### Combustíveis contratados (Processo Estrela)

| Combustível        | Quantidade contratada (L) |
|--------------------|---------------------------|
| ETANOL HIDRATADO   | 80.000                    |
| GASOLINA COMUM     | 120.000                   |
| ÓLEO DIESEL        | 100.000                   |
| ÓLEO DIESEL S10    | 100.000                   |

- **Total previsto:** 400.000 litros (`litros_desejados`).
- Para cadastrar diretamente, inclua o array `combustiveis` no corpo da requisição conforme o exemplo acima (adequando os IDs reais de cada combustível). Caso o backend trate o vínculo por endpoint próprio, utilize esta mesma estrutura no passo seguinte para garantir que a soma das quantidades coincida com o total desejado.

## Erros comuns
| Status | Motivo | Ação sugerida |
|--------|--------|---------------|
| 400 | Campos obrigatórios ausentes ou datas inválidas | Confira se todos os campos do JSON de exemplo foram preenchidos. |
| 404 | Prefeitura não encontrada | Verifique se `prefeituraId` existe na base. |
| 409 | Já existe processo para a prefeitura | Cada prefeitura só pode ter um processo ativo. Atualize o existente ou use outra prefeitura. |

Com esse fluxo você tem o “Processo Estrela” cadastrado com todos os campos disponíveis, pronto para vincular combustíveis, cotas ou demais entidades dependentes.


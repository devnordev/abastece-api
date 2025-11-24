# API - Painel de Faturamento Admin Empresa

## Endpoint

```
GET /relatorios/painel-faturamento/admin-empresa
```

## Autenticação

Requer autenticação JWT e permissão de `ADMIN_EMPRESA` ou `COLABORADOR_EMPRESA`.

## Parâmetros de Query (Filtros)

Todos os parâmetros são opcionais:

- `dataInicio` (string, ISO 8601): Data inicial do período
  - Exemplo: `2024-01-01T00:00:00.000Z`
  - Se não informado, usa os últimos 7 dias

- `dataFim` (string, ISO 8601): Data final do período
  - Exemplo: `2024-01-07T23:59:59.999Z`
  - Se não informado, usa os últimos 7 dias

- `orgaoId` (number): Filtrar por órgão específico
  - Exemplo: `1`

- `combustivelId` (number): Filtrar por combustível específico
  - Exemplo: `2`

- `veiculoId` (number): Filtrar por veículo específico
  - Exemplo: `5`

## Estrutura JSON de Resposta

```json
{
  "periodo": {
    "data_inicio": "2024-01-01T00:00:00.000Z",
    "data_fim": "2024-01-07T23:59:59.999Z",
    "dias": 7
  },
  "overview": {
    "total_faturado": 15000.50,
    "total_litros": 1250.75,
    "total_abastecimentos": 45,
    "ticket_medio": 333.34
  },
  "faturamento_por_periodo": [
    {
      "dia": "Dom",
      "data": "2024-01-01",
      "faturamento_real": 2000.00,
      "meta_diaria": 2142.93
    },
    {
      "dia": "Seg",
      "data": "2024-01-02",
      "faturamento_real": 2500.50,
      "meta_diaria": 2142.93
    },
    {
      "dia": "Ter",
      "data": "2024-01-03",
      "faturamento_real": 1800.25,
      "meta_diaria": 2142.93
    },
    {
      "dia": "Qua",
      "data": "2024-01-04",
      "faturamento_real": 2200.75,
      "meta_diaria": 2142.93
    },
    {
      "dia": "Qui",
      "data": "2024-01-05",
      "faturamento_real": 2400.00,
      "meta_diaria": 2142.93
    },
    {
      "dia": "Sex",
      "data": "2024-01-06",
      "faturamento_real": 2100.50,
      "meta_diaria": 2142.93
    },
    {
      "dia": "Sáb",
      "data": "2024-01-07",
      "faturamento_real": 1998.50,
      "meta_diaria": 2142.93
    }
  ],
  "vendas_por_combustivel": [
    {
      "combustivel_id": 1,
      "combustivel_nome": "Gasolina Comum",
      "combustivel_sigla": "GAS",
      "litros": 500.25,
      "valor": 7500.00,
      "percentual": 50.00
    },
    {
      "combustivel_id": 2,
      "combustivel_nome": "Etanol",
      "combustivel_sigla": "ETN",
      "litros": 400.50,
      "valor": 4500.00,
      "percentual": 30.00
    },
    {
      "combustivel_id": 3,
      "combustivel_nome": "Diesel S10",
      "combustivel_sigla": "DIE",
      "litros": 350.00,
      "valor": 3000.50,
      "percentual": 20.00
    }
  ],
  "top_clientes": [
    {
      "orgao_id": 1,
      "orgao_nome": "Secretaria de Saúde",
      "orgao_sigla": "SMS",
      "valor": 8000.00,
      "litros": 650.25,
      "abastecimentos": 25,
      "percentual": 53.33
    },
    {
      "orgao_id": 2,
      "orgao_nome": "Secretaria de Educação",
      "orgao_sigla": "SME",
      "valor": 5000.00,
      "litros": 400.50,
      "abastecimentos": 15,
      "percentual": 33.33
    },
    {
      "orgao_id": 3,
      "orgao_nome": "Secretaria de Transporte",
      "orgao_sigla": "SMT",
      "valor": 2000.50,
      "litros": 200.00,
      "abastecimentos": 5,
      "percentual": 13.34
    }
  ],
  "indicadores_performance": {
    "crescimento": 15.5,
    "meta_atingida": 105.2,
    "melhor_dia": "Seg",
    "melhor_combustivel": "Gasolina Comum"
  },
  "vendas_por_dia_semana": [
    {
      "dia": "Dom",
      "valor": 2000.00
    },
    {
      "dia": "Seg",
      "valor": 2500.50
    },
    {
      "dia": "Ter",
      "valor": 1800.25
    },
    {
      "dia": "Qua",
      "valor": 2200.75
    },
    {
      "dia": "Qui",
      "valor": 2400.00
    },
    {
      "dia": "Sex",
      "valor": 2100.50
    },
    {
      "dia": "Sáb",
      "valor": 1998.50
    }
  ]
}
```

## Descrição dos Campos

### `periodo`
Informações sobre o período analisado:
- `data_inicio`: Data inicial do período (ISO 8601)
- `data_fim`: Data final do período (ISO 8601)
- `dias`: Número de dias no período

### `overview`
Cards principais do painel:
- `total_faturado`: Valor total faturado no período (R$)
- `total_litros`: Total de litros abastecidos (L)
- `total_abastecimentos`: Quantidade total de abastecimentos
- `ticket_medio`: Valor médio por abastecimento (R$)

### `faturamento_por_periodo`
Array com faturamento diário para o gráfico "Faturamento por Período (Últimos 7 dias)":
- `dia`: Nome do dia da semana (Dom, Seg, Ter, Qua, Qui, Sex, Sáb)
- `data`: Data no formato YYYY-MM-DD
- `faturamento_real`: Valor faturado no dia (R$)
- `meta_diaria`: Meta diária calculada (média do período) (R$)

### `vendas_por_combustivel`
Array com vendas agrupadas por tipo de combustível:
- `combustivel_id`: ID do combustível
- `combustivel_nome`: Nome do combustível
- `combustivel_sigla`: Sigla do combustível
- `litros`: Total de litros vendidos
- `valor`: Valor total faturado (R$)
- `percentual`: Percentual do valor em relação ao total faturado

### `top_clientes`
Array com os top 10 clientes (órgãos) ordenados por valor faturado:
- `orgao_id`: ID do órgão
- `orgao_nome`: Nome do órgão
- `orgao_sigla`: Sigla do órgão
- `valor`: Valor total faturado (R$)
- `litros`: Total de litros abastecidos
- `abastecimentos`: Quantidade de abastecimentos
- `percentual`: Percentual do valor em relação ao total faturado

### `indicadores_performance`
Indicadores de performance:
- `crescimento`: Percentual de crescimento em relação ao período anterior (%)
- `meta_atingida`: Percentual da meta atingida (%)
- `melhor_dia`: Dia da semana com maior faturamento
- `melhor_combustivel`: Combustível com maior faturamento

### `vendas_por_dia_semana`
Array com vendas agrupadas por dia da semana para o gráfico "Vendas por Dia da Semana":
- `dia`: Nome do dia da semana (Dom, Seg, Ter, Qua, Qui, Sex, Sáb)
- `valor`: Valor faturado no dia (R$)

## Exemplo de Uso

### Requisição sem filtros (últimos 7 dias)
```bash
GET /relatorios/painel-faturamento/admin-empresa
Authorization: Bearer {token}
```

### Requisição com filtros
```bash
GET /relatorios/painel-faturamento/admin-empresa?dataInicio=2024-01-01T00:00:00.000Z&dataFim=2024-01-31T23:59:59.999Z&combustivelId=1
Authorization: Bearer {token}
```

## Observações

1. **Período padrão**: Se não for informado `dataInicio` e `dataFim`, o sistema usa automaticamente os últimos 7 dias.

2. **Filtros**: Todos os filtros são opcionais e podem ser combinados.

3. **Abastecimentos**: Apenas abastecimentos com status `Aprovado` e `ativo: true` são considerados.

4. **Cálculo de crescimento**: Compara o período atual com o período anterior de mesma duração.

5. **Meta diária**: Calculada como a média do faturamento total dividido pelo número de dias do período.

6. **Top clientes**: Limitado aos 10 primeiros ordenados por valor faturado.

7. **Valores arredondados**: Todos os valores monetários são arredondados para 2 casas decimais, e litros para 2 casas decimais.


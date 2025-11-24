# API - Dashboard Admin Empresa

## Endpoint

```
GET /dashboards/admin-empresa
```

## Autenticação

Requer autenticação JWT e permissão de `ADMIN_EMPRESA` ou `COLABORADOR_EMPRESA`.

## Parâmetros de Query

- `abastecimentosLimit` (number, opcional): Limite de abastecimentos recentes a retornar
  - Padrão: `10`
  - Mínimo: `1`
  - Exemplo: `?abastecimentosLimit=20`

## Estrutura JSON de Resposta Completa

```json
{
  "empresaId": 1,
  "usuario": {
    "id": 5,
    "nome": "João Silva",
    "email": "joao@empresa.com"
  },
  "cards": {
    "totalAbastecimentos": 1250,
    "abastecimentosAprovados": 1180,
    "abastecimentosAguardando": 50,
    "abastecimentosRejeitados": 20,
    "veiculosAbastecidos": 85,
    "motoristasAtendidos": 120,
    "prefeiturasAtendidas": 12,
    "contratosVinculados": 3,
    "contratosAtivos": 2,
    "totalQuantidadeAbastecida": 12500.75,
    "totalValorAbastecido": 87500.50,
    "ticketMedio": 70.00
  },
  "periodo": {
    "mesAtual": {
      "quantidade": 3500.25,
      "valor": 24500.75,
      "ticketMedio": 70.00
    },
    "mesAnterior": {
      "quantidade": 3200.50,
      "valor": 22400.00
    },
    "ultimos30Dias": {
      "quantidade": 3800.00,
      "valor": 26600.00
    },
    "crescimento": {
      "quantidade": 9.38,
      "valor": 9.38
    }
  },
  "abastecimentos": {
    "totalRegistros": 10,
    "limiteAplicado": 10,
    "dados": [
      {
        "id": 1001,
        "data_abastecimento": "2024-01-21T14:30:00.000Z",
        "posto": "Posto Admin Empresa Centro",
        "veiculo": {
          "id": 15,
          "nome": "Ambulância 01",
          "placa": "ABC-1234"
        },
        "prefeitura": {
          "id": 1,
          "nome": "Prefeitura de São Paulo"
        },
        "orgao": {
          "id": 2,
          "nome": "Secretaria de Saúde",
          "sigla": "SMS"
        },
        "motorista": "Carlos Santos",
        "combustivel": {
          "id": 1,
          "nome": "Gasolina Comum",
          "sigla": "GAS"
        },
        "quantidade": 50.5,
        "valor_total": 350.00,
        "preco_empresa": 6.93,
        "status": "Aprovado"
      }
    ]
  },
  "estatisticasPorStatus": [
    {
      "status": "Aprovado",
      "quantidade": 1180,
      "quantidadeLitros": 11800.50,
      "valorTotal": 82600.00
    },
    {
      "status": "Aguardando",
      "quantidade": 50,
      "quantidadeLitros": 500.25,
      "valorTotal": 3500.00
    },
    {
      "status": "Rejeitado",
      "quantidade": 20,
      "quantidadeLitros": 200.00,
      "valorTotal": 1400.50
    }
  ],
  "topVeiculos": [
    {
      "veiculoId": 15,
      "nome": "Ambulância 01",
      "placa": "ABC-1234",
      "quantidadeTotal": 850.50,
      "valorTotal": 5950.00,
      "orgao": "Secretaria de Saúde",
      "prefeitura": "Prefeitura de São Paulo"
    },
    {
      "veiculoId": 22,
      "nome": "Carro Administrativo",
      "placa": "XYZ-5678",
      "quantidadeTotal": 650.25,
      "valorTotal": 4550.00,
      "orgao": "Secretaria de Educação",
      "prefeitura": "Prefeitura de São Paulo"
    }
  ],
  "topCombustiveis": [
    {
      "combustivelId": 1,
      "nome": "Gasolina Comum",
      "sigla": "GAS",
      "quantidadeTotal": 7500.50,
      "valorTotal": 52500.00,
      "percentualQuantidade": 60.00,
      "percentualValor": 60.00
    },
    {
      "combustivelId": 2,
      "nome": "Etanol",
      "sigla": "ETN",
      "quantidadeTotal": 3500.25,
      "valorTotal": 24500.00,
      "percentualQuantidade": 28.00,
      "percentualValor": 28.00
    },
    {
      "combustivelId": 3,
      "nome": "Diesel S10",
      "sigla": "DIE",
      "quantidadeTotal": 1500.00,
      "valorTotal": 10500.50,
      "percentualQuantidade": 12.00,
      "percentualValor": 12.00
    }
  ],
  "consumoPorOrgao": [
    {
      "orgaoId": 2,
      "orgaoNome": "Secretaria de Saúde",
      "orgaoSigla": "SMS",
      "quantidadeTotal": 4500.75,
      "valorTotal": 31500.00
    },
    {
      "orgaoId": 3,
      "orgaoNome": "Secretaria de Educação",
      "orgaoSigla": "SME",
      "quantidadeTotal": 3500.50,
      "valorTotal": 24500.00
    },
    {
      "orgaoId": 4,
      "orgaoNome": "Secretaria de Transporte",
      "orgaoSigla": "SMT",
      "quantidadeTotal": 2500.25,
      "valorTotal": 17500.00
    }
  ],
  "consumoPorPrefeitura": [
    {
      "prefeituraId": 1,
      "prefeituraNome": "Prefeitura de São Paulo",
      "quantidadeTotal": 8500.50,
      "valorTotal": 59500.00,
      "veiculosCount": 45
    },
    {
      "prefeituraId": 2,
      "prefeituraNome": "Prefeitura de Santos",
      "quantidadeTotal": 2500.25,
      "valorTotal": 17500.00,
      "veiculosCount": 15
    },
    {
      "prefeituraId": 3,
      "prefeituraNome": "Prefeitura de Campinas",
      "quantidadeTotal": 1500.00,
      "valorTotal": 10500.50,
      "veiculosCount": 10
    }
  ]
}
```

## Descrição dos Campos

### `empresaId`
ID da empresa do usuário logado.

### `usuario`
Informações do usuário logado:
- `id`: ID do usuário
- `nome`: Nome do usuário
- `email`: Email do usuário

### `cards`
Cards principais do dashboard com métricas gerais:
- `totalAbastecimentos`: Total de abastecimentos (todos os status)
- `abastecimentosAprovados`: Quantidade de abastecimentos aprovados
- `abastecimentosAguardando`: Quantidade de abastecimentos aguardando aprovação
- `abastecimentosRejeitados`: Quantidade de abastecimentos rejeitados
- `veiculosAbastecidos`: Quantidade de veículos únicos abastecidos
- `motoristasAtendidos`: Quantidade de motoristas únicos atendidos
- `prefeiturasAtendidas`: Quantidade de prefeituras únicas atendidas
- `contratosVinculados`: Total de contratos vinculados à empresa
- `contratosAtivos`: Quantidade de contratos ativos
- `totalQuantidadeAbastecida`: Total de litros abastecidos (todos os tempos)
- `totalValorAbastecido`: Valor total faturado (todos os tempos)
- `ticketMedio`: Valor médio por abastecimento

### `periodo`
Estatísticas por período:
- `mesAtual`: Dados do mês atual
  - `quantidade`: Litros abastecidos no mês
  - `valor`: Valor faturado no mês
  - `ticketMedio`: Ticket médio do mês
- `mesAnterior`: Dados do mês anterior (para comparação)
  - `quantidade`: Litros abastecidos no mês anterior
  - `valor`: Valor faturado no mês anterior
- `ultimos30Dias`: Dados dos últimos 30 dias
  - `quantidade`: Litros abastecidos nos últimos 30 dias
  - `valor`: Valor faturado nos últimos 30 dias
- `crescimento`: Percentual de crescimento em relação ao mês anterior
  - `quantidade`: Crescimento em quantidade (%)
  - `valor`: Crescimento em valor (%)

### `abastecimentos`
Lista dos abastecimentos mais recentes:
- `totalRegistros`: Quantidade de registros retornados
- `limiteAplicado`: Limite aplicado na query
- `dados`: Array com os abastecimentos detalhados

Cada abastecimento contém:
- `id`: ID do abastecimento
- `data_abastecimento`: Data e hora do abastecimento
- `posto`: Nome da empresa/posto
- `veiculo`: Dados do veículo (id, nome, placa)
- `prefeitura`: Dados da prefeitura (id, nome)
- `orgao`: Dados do órgão (id, nome, sigla)
- `motorista`: Nome do motorista
- `combustivel`: Dados do combustível (id, nome, sigla)
- `quantidade`: Quantidade em litros
- `valor_total`: Valor total do abastecimento
- `preco_empresa`: Preço praticado pela empresa
- `status`: Status do abastecimento

### `estatisticasPorStatus`
Estatísticas agrupadas por status de abastecimento:
- `status`: Status do abastecimento (Aprovado, Aguardando, Rejeitado, Cancelado)
- `quantidade`: Quantidade de abastecimentos com esse status
- `quantidadeLitros`: Total de litros abastecidos com esse status
- `valorTotal`: Valor total faturado com esse status

### `topVeiculos`
Top 10 veículos que mais abasteceram:
- `veiculoId`: ID do veículo
- `nome`: Nome do veículo
- `placa`: Placa do veículo
- `quantidadeTotal`: Total de litros abastecidos
- `valorTotal`: Valor total faturado
- `orgao`: Nome do órgão
- `prefeitura`: Nome da prefeitura

### `topCombustiveis`
Combustíveis ordenados por valor faturado:
- `combustivelId`: ID do combustível
- `nome`: Nome do combustível
- `sigla`: Sigla do combustível
- `quantidadeTotal`: Total de litros vendidos
- `valorTotal`: Valor total faturado
- `percentualQuantidade`: Percentual em relação ao total de litros
- `percentualValor`: Percentual em relação ao valor total faturado

### `consumoPorOrgao`
Top 10 órgãos por consumo:
- `orgaoId`: ID do órgão
- `orgaoNome`: Nome do órgão
- `orgaoSigla`: Sigla do órgão
- `quantidadeTotal`: Total de litros consumidos
- `valorTotal`: Valor total faturado

### `consumoPorPrefeitura`
Top 10 prefeituras por consumo:
- `prefeituraId`: ID da prefeitura
- `prefeituraNome`: Nome da prefeitura
- `quantidadeTotal`: Total de litros consumidos
- `valorTotal`: Valor total faturado
- `veiculosCount`: Quantidade de veículos únicos atendidos

## Exemplo de Uso

### Requisição básica
```bash
GET /dashboards/admin-empresa
Authorization: Bearer {token}
```

### Requisição com limite customizado
```bash
GET /dashboards/admin-empresa?abastecimentosLimit=20
Authorization: Bearer {token}
```

## Observações

1. **Filtro automático**: Todos os dados são automaticamente filtrados pela empresa do usuário logado.

2. **Apenas abastecimentos ativos**: Apenas abastecimentos com `ativo: true` são considerados.

3. **Cálculo de crescimento**: O crescimento é calculado comparando o mês atual com o mês anterior.

4. **Top rankings**: Os rankings (veículos, combustíveis, órgãos, prefeituras) são limitados aos top 10.

5. **Valores arredondados**: Todos os valores monetários são arredondados para 2 casas decimais.

6. **Percentuais**: Os percentuais são calculados em relação ao total geral.

7. **Dados vazios**: Se não houver dados, os arrays retornarão vazios `[]` e os valores numéricos serão `0`.


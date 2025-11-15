# Dashboards API

Este documento descreve como consumir as rotas do módulo `dashboards`. Todas as rotas requerem autenticação via **Bearer token** e respeitam os perfis autorizados em cada endpoint.

## Autenticação
- Header `Authorization: Bearer <token_jwt>`
- O token deve ser obtido via login (`/auth/login`) e precisa estar ativo.

## Perfis disponíveis
| Perfil               | Descrição                                               | Status |
|----------------------|---------------------------------------------------------|--------|
| `ADMIN_PREFEITURA`   | Dashboard completo da prefeitura vinculada ao usuário   | ✅ ativo |
| `COLABORADOR_PREFEITURA` | Dashboard da prefeitura (mesmos dados do Admin)       | ✅ ativo |
| `ADMIN_EMPRESA`      | Dashboard com métricas da empresa vinculada             | ✅ ativo |
| `COLABORADOR_EMPRESA` | Dashboard com métricas da empresa (mesmos dados do Admin) | ✅ ativo |
| `SUPER_ADMIN`        | Acesso global planejado para versões futuras            | 🔜 em planejamento |

## Dashboard `ADMIN_PREFEITURA`

### Endpoint
- **`GET /dashboards/admin-prefeitura`**
- **Guards**: `JwtAuthGuard` + `AdminPrefeituraGuard`
- Apenas usuários autenticados com perfil `ADMIN_PREFEITURA` conseguem acessar.

### Query Params
| Parâmetro                | Tipo | Obrigatório | Default | Descrição |
|-------------------------|------|-------------|---------|-----------|
| `abastecimentosLimit`   | int  | Não         | 10      | Quantidade máxima de registros detalhados retornados em `abastecimentos.dados`. Deve ser ≥ 1. |

### Exemplo de requisição
```http
GET /dashboards/admin-prefeitura?abastecimentosLimit=5
Authorization: Bearer <token>
```

### Body de resposta
```json
{
  "prefeituraId": 123,
  "usuario": {
    "id": 45,
    "nome": "Maria Oliveira",
    "email": "maria@prefeitura.gov.br"
  },
  "cards": {
    "totalVeiculos": 87,
    "totalMotoristas": 32,
    "totalProcessos": 5,
    "totalQuantidadeAbastecida": 12345.67,
    "totalValorAbastecido": 456789.9
  },
  "abastecimentos": {
    "totalRegistros": 5,
    "limiteAplicado": 5,
    "dados": [
      {
        "id": 1,
        "data_abastecimento": "2025-11-13T12:34:56.000Z",
        "empresa": "Posto Central",
        "veiculo": {
          "id": 10,
          "nome": "Caminhão 01",
          "placa": "ABC-1234"
        },
        "orgao": "Secretaria de Obras",
        "motorista": "João Silva",
        "combustivel": "Diesel S10",
        "quantidade": 150.5,
        "valor_total": 9876.54,
        "preco_empresa": 6.56,
        "status": "Aprovado"
      }
    ]
  },
  "cotasPorOrgao": [
    {
      "orgaoId": 7,
      "orgaoNome": "Secretaria de Educação",
      "quantidadeUtilizada": 2345.8
    }
  ],
  "veiculosComAbastecimentosAprovados": [
    {
      "veiculoId": 10,
      "nome": "Caminhão 01",
      "placa": "ABC-1234",
      "combustiveis": ["Diesel S10"],
      "quantidadeTotal": 500.75,
      "valorTotal": 32145.67
    }
  ]
}
```

### Campos principais
- `cards`: métricas agregadas da prefeitura.
- `usuario`: dados básicos do usuário autenticado que requisitou o dashboard.
- `abastecimentos.dados`: lista limitada aos últimos abastecimentos, com dados de empresa, veículo, motorista, órgão, combustível, quantidade e valores.
- `cotasPorOrgao`: soma da `quantidade_utilizada` por órgão (com nome e id do órgão).
- `veiculosComAbastecimentosAprovados`: veiculos da prefeitura que possuam abastecimentos aprovados, exibindo soma da quantidade e valor total, além dos combustíveis associados ativos.

### Códigos de status
| Status | Quando ocorre |
|--------|---------------|
| `200 OK` | Dashboard retornado com sucesso. |
| `401 Unauthorized` | Falha na autenticação (token ausente/expirado/inválido). |
| `403 Forbidden` | Usuário não possui perfil `ADMIN_PREFEITURA`. |
| `500 Internal Server Error` | Falha inesperada durante o processamento (ver logs da aplicação). |

## Dashboard `ADMIN_EMPRESA`

### Endpoint
- **`GET /dashboards/admin-empresa`**
- **Guards**: `JwtAuthGuard` + `AdminEmpresaGuard`
- Apenas usuários autenticados com perfil `ADMIN_EMPRESA` conseguem acessar.

### Query Params
| Parâmetro                | Tipo | Obrigatório | Default | Descrição |
|-------------------------|------|-------------|---------|-----------|
| `abastecimentosLimit`   | int  | Não         | 10      | Quantidade máxima de registros detalhados retornados em `abastecimentos.dados`. Deve ser ≥ 1. |

### Exemplo de requisição
```http
GET /dashboards/admin-empresa?abastecimentosLimit=10
Authorization: Bearer <token>
```

### Body de resposta
```json
{
  "empresaId": 88,
  "usuario": {
    "id": 77,
    "nome": "Carlos Souza",
    "email": "carlos@fornecedor.com"
  },
  "cards": {
    "totalAbastecimentos": 120,
    "veiculosAbastecidos": 45,
    "motoristasAtendidos": 30,
    "contratosVinculados": 4,
    "totalQuantidadeAbastecida": 9876.54,
    "totalValorAbastecido": 543210.99
  },
  "abastecimentos": {
    "totalRegistros": 10,
    "limiteAplicado": 10,
    "dados": [
      {
        "id": 1,
        "data_abastecimento": "2025-11-13T12:34:56.000Z",
        "posto": "Posto Central",
        "veiculo": {
          "id": 10,
          "nome": "Caminhão 01",
          "placa": "ABC-1234"
        },
        "orgao": "Secretaria de Obras",
        "motorista": "João Silva",
        "combustivel": "Diesel S10",
        "quantidade": 150.5,
        "valor_total": 9876.54,
        "preco_empresa": 6.56,
        "status": "Aprovado"
      }
    ]
  },
  "topVeiculos": [
    {
      "veiculoId": 10,
      "nome": "Caminhão 01",
      "placa": "ABC-1234",
      "quantidadeTotal": 450.7,
      "valorTotal": 29876.5
    }
  ],
  "consumoPorOrgao": [
    {
      "orgaoId": 7,
      "orgaoNome": "Secretaria de Educação",
      "quantidadeTotal": 2345.8
    }
  ]
}
```

### Campos principais
- `usuario`: dados básicos do usuário autenticado que requisitou o dashboard.
- `cards`: métricas agregadas da empresa.
- `abastecimentos.dados`: últimos abastecimentos executados pela empresa, com posto, veículo, motorista, órgão, combustível e valores.
- `topVeiculos`: cinco veículos com maior soma de quantidades abastecidas pela empresa (inclui a soma de `valor_total`).
- `consumoPorOrgao`: soma da coluna `quantidade` de todos os abastecimentos realizados pela empresa agrupados por órgão.

### Códigos de status
| Status | Quando ocorre |
|--------|---------------|
| `200 OK` | Dashboard retornado com sucesso. |
| `401 Unauthorized` | Falha na autenticação (token ausente/expirado/inválido). |
| `403 Forbidden` | Usuário não possui perfil `ADMIN_EMPRESA`. |
| `500 Internal Server Error` | Falha inesperada durante o processamento. |

## Dashboard `COLABORADOR_EMPRESA`

Rota idêntica à de `ADMIN_EMPRESA`, mudando apenas o guard e endpoint:

- **`GET /dashboards/colaborador-empresa`**
- Guardas: `JwtAuthGuard` + `ColaboradorEmpresaGuard`
- Mesmo formato de query params, body e códigos de status. Os dados retornados são apenas da empresa vinculada ao colaborador autenticado.

## Dashboard `COLABORADOR_PREFEITURA`

Segue exatamente o mesmo comportamento do dashboard `ADMIN_PREFEITURA`, mudando apenas o guard e a rota:

- **`GET /dashboards/colaborador-prefeitura`**
- Guardas: `JwtAuthGuard` + `ColaboradorPrefeituraGuard`
- Aceita `abastecimentosLimit` e retorna o mesmo payload descrito na seção de `ADMIN_PREFEITURA`, sempre filtrando pela prefeitura do colaborador autenticado.

## Boas práticas
- Ajuste `abastecimentosLimit` conforme a necessidade da UI para evitar payloads grandes.
- Garanta que o usuário esteja vinculado a uma prefeitura; caso contrário, o guard retornará `403`.
- Antes de integrar novos perfis, alinhe quais dados podem ser expostos em cada visão.

## Evoluções futuras
- Dashboards específicos para colaboradores de prefeitura/empresa.
- Possibilidade de filtrar por datas, órgãos e combustíveis.
- Exportação de dados agregados e detalhados.


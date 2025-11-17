# Solicitações de Abastecimento

Este documento explica como utilizar as rotas do módulo de solicitações de abastecimento, incluindo criação, listagem, atualização, alteração de status e exclusão.

## Visão Geral

- **Model principal**: `SolicitacaoAbastecimento`
- **Relações importantes**:
  - `SolicitacaoAbastecimento.prefeituraId` → `Prefeitura.id`
  - `SolicitacaoAbastecimento.veiculoId` → `Veiculo.id`
  - `SolicitacaoAbastecimento.combustivelId` → `Combustivel.id`
  - `SolicitacaoAbastecimento.empresaId` → `Empresa.id`
  - `SolicitacaoAbastecimento.abastecimento_id` → `Abastecimento.id` (quando a solicitação é efetivada)
- **Status disponíveis**: `PENDENTE`, `APROVADA`, `REJEITADA`, `EXPIRADA`, `EFETIVADA`

## Endpoints Disponíveis

### 1. Criar Solicitação de Abastecimento

- **Rota**: `POST /solicitacoes-abastecimento` ou `POST /solicitacoes`
- **Método**: `POST`
- **Guards**: `AdminPrefeituraEmpresaGuard` (apenas `ADMIN_PREFEITURA` e `ADMIN_EMPRESA`)

#### Exemplo de Requisição

```json
{
  "prefeituraId": 1,
  "veiculoId": 57,
  "motoristaId": 5,
  "combustivelId": 1,
  "empresaId": 3,
  "quantidade": 50.5,
  "data_solicitacao": "2025-01-15T12:00:00Z",
  "data_expiracao": "2025-01-20T12:00:00Z",
  "tipo_abastecimento": "COM_COTA",
  "status": "PENDENTE",
  "conta_faturamento_orgao_id": 5
}
```

### 2. Listar Solicitações de Abastecimento

- **Rota**: `GET /solicitacoes-abastecimento` ou `GET /solicitacoes`
- **Método**: `GET`
- **Guards**: `AdminPrefeituraEmpresaColaboradorGuard` (apenas `ADMIN_PREFEITURA`, `ADMIN_EMPRESA` ou `COLABORADOR_EMPRESA`)

#### Query Parameters

- `page`: Número da página (padrão: 1)
- `limit`: Itens por página (padrão: 10)
- `status`: Filtrar por status (`PENDENTE`, `APROVADA`, `REJEITADA`, `EXPIRADA`, `EFETIVADA`)
- `ativo`: Filtrar por ativo (true/false)
- `empresaId`: Filtrar por empresa (opcional, deve corresponder à empresa do usuário)

#### Exemplo de Requisição

```bash
GET /solicitacoes-abastecimento?status=PENDENTE&page=1&limit=10
```

### 3. Buscar Solicitação por ID

- **Rota**: `GET /solicitacoes-abastecimento/:id` ou `GET /solicitacoes/:id`
- **Método**: `GET`
- **Guards**: `AdminPrefeituraEmpresaColaboradorGuard`

#### Exemplo de Requisição

```bash
GET /solicitacoes-abastecimento/123
```

### 4. Atualizar Solicitação de Abastecimento

- **Rota**: `PATCH /solicitacoes-abastecimento/:id` ou `PATCH /solicitacoes/:id`
- **Método**: `PATCH`
- **Guards**: `AdminPrefeituraEmpresaGuard`

#### Exemplo de Requisição

```json
{
  "quantidade": 60.0,
  "data_expiracao": "2025-01-25T12:00:00Z",
  "observacoes": "Atualização da quantidade solicitada"
}
```

### 5. Alterar Status da Solicitação de Abastecimento

- **Rota**: `PATCH /solicitacoes-abastecimento/:id/status` ou `PATCH /solicitacoes/:id/status`
- **Método**: `PATCH`
- **Guards**: `AdminPrefeituraEmpresaGuard` (apenas `ADMIN_PREFEITURA` e `ADMIN_EMPRESA`)

#### Descrição

Esta rota permite alterar especificamente o status de uma solicitação de abastecimento. Dependendo do status informado, o sistema preenche automaticamente campos relacionados (data de aprovação, quem aprovou/rejeitou, motivo de rejeição, etc.).

#### Body da Requisição (JSON)

```json
{
  "status": "APROVADA",
  "aprovado_por": "João Silva",
  "aprovado_por_email": "joao.silva@prefeitura.gov.br",
  "aprovado_por_empresa": "Prefeitura Municipal"
}
```

**Campos obrigatórios:**
- `status`: Novo status da solicitação (enum: `PENDENTE`, `APROVADA`, `REJEITADA`, `EXPIRADA`, `EFETIVADA`)

**Campos opcionais:**
- `motivo_rejeicao`: Motivo da rejeição (obrigatório quando status for `REJEITADA`)
- `aprovado_por`: Nome de quem está aprovando (quando status for `APROVADA`)
- `aprovado_por_email`: Email de quem está aprovando (quando status for `APROVADA`)
- `aprovado_por_empresa`: Empresa de quem está aprovando (quando status for `APROVADA`)
- `rejeitado_por`: Nome de quem está rejeitando (quando status for `REJEITADA`)
- `rejeitado_por_email`: Email de quem está rejeitando (quando status for `REJEITADA`)
- `rejeitado_por_empresa`: Empresa de quem está rejeitando (quando status for `REJEITADA`)

**Nota**: Se os campos opcionais não forem fornecidos, o sistema tentará preencher automaticamente com os dados do usuário logado (`user.nome`, `user.email`, `user.empresa.nome`).

#### Comportamento por Status

##### Status: `APROVADA`

Quando o status é alterado para `APROVADA`:
- Preenche automaticamente `data_aprovacao` com a data/hora atual
- Preenche `aprovado_por`, `aprovado_por_email`, `aprovado_por_empresa` (do body ou do usuário logado)
- Limpa campos de rejeição (`data_rejeicao`, `rejeitado_por`, `rejeitado_por_email`, `rejeitado_por_empresa`, `motivo_rejeicao`)

**Exemplo de Requisição - Aprovar Solicitação:**

```json
{
  "status": "APROVADA",
  "aprovado_por": "João Silva",
  "aprovado_por_email": "joao.silva@prefeitura.gov.br",
  "aprovado_por_empresa": "Prefeitura Municipal de Estrela"
}
```

**Exemplo de Requisição - Aprovar usando dados do usuário logado:**

```json
{
  "status": "APROVADA"
}
```

##### Status: `REJEITADA`

Quando o status é alterado para `REJEITADA`:
- Preenche automaticamente `data_rejeicao` com a data/hora atual
- Preenche `rejeitado_por`, `rejeitado_por_email`, `rejeitado_por_empresa` (do body ou do usuário logado)
- Preenche `motivo_rejeicao` (recomendado fornecer no body)
- Limpa campos de aprovação (`data_aprovacao`, `aprovado_por`, `aprovado_por_email`, `aprovado_por_empresa`)

**Exemplo de Requisição - Rejeitar Solicitação:**

```json
{
  "status": "REJEITADA",
  "motivo_rejeicao": "Quantidade excede o limite disponível na cota do órgão",
  "rejeitado_por": "Maria Santos",
  "rejeitado_por_email": "maria.santos@prefeitura.gov.br",
  "rejeitado_por_empresa": "Prefeitura Municipal de Estrela"
}
```

##### Status: `EXPIRADA`

Quando o status é alterado para `EXPIRADA`:
- Apenas atualiza o campo `status`
- Não altera outros campos

**Exemplo de Requisição - Marcar como Expirada:**

```json
{
  "status": "EXPIRADA"
}
```

##### Status: `EFETIVADA`

Quando o status é alterado para `EFETIVADA`:
- Apenas atualiza o campo `status`
- Não altera outros campos

**Exemplo de Requisição - Marcar como Efetivada:**

```json
{
  "status": "EFETIVADA"
}
```

##### Status: `PENDENTE`

Quando o status é alterado para `PENDENTE`:
- Limpa todos os campos de aprovação e rejeição
- Reseta `data_aprovacao`, `data_rejeicao`, `aprovado_por`, `rejeitado_por`, etc.

**Exemplo de Requisição - Voltar para Pendente:**

```json
{
  "status": "PENDENTE"
}
```

#### Exemplo de Resposta - Sucesso (200)

```json
{
  "message": "Status da solicitação alterado para APROVADA",
  "solicitacao": {
    "id": 123,
    "prefeituraId": 1,
    "veiculoId": 57,
    "combustivelId": 1,
    "empresaId": 3,
    "quantidade": 50.5,
    "status": "APROVADA",
    "data_aprovacao": "2025-01-15T14:30:00.000Z",
    "aprovado_por": "João Silva",
    "aprovado_por_email": "joao.silva@prefeitura.gov.br",
    "aprovado_por_empresa": "Prefeitura Municipal de Estrela",
    "data_solicitacao": "2025-01-15T12:00:00.000Z",
    "data_expiracao": "2025-01-20T12:00:00.000Z",
    "veiculo": {
      "id": 57,
      "placa": "MUU5047",
      "nome": "Abrahão Lustosa"
    },
    "combustivel": {
      "id": 1,
      "nome": "GASOLINA COMUM",
      "sigla": "GAS_COMUM"
    },
    "empresa": {
      "id": 3,
      "nome": "Posto ABC",
      "cnpj": "12.345.678/0001-90"
    }
  }
}
```

#### Status Codes

| Status | Descrição |
|--------|-----------|
| `200 OK` | Status alterado com sucesso |
| `400 Bad Request` | Dados inválidos (status inválido, etc.) |
| `401 Unauthorized` | Não autenticado |
| `403 Forbidden` | Sem permissão (não é ADMIN_PREFEITURA ou ADMIN_EMPRESA) |
| `404 Not Found` | Solicitação não encontrada |

#### Mensagens de Erro Comuns

**Erro 400 - Status inválido:**

```json
{
  "message": ["status inválido"],
  "error": "Bad Request",
  "statusCode": 400
}
```

**Erro 404 - Solicitação não encontrada:**

```json
{
  "message": "Solicitação de abastecimento com ID 123 não encontrada",
  "error": "Not Found",
  "statusCode": 404
}
```

**Erro 403 - Sem permissão:**

```json
{
  "message": "Apenas ADMIN_PREFEITURA e ADMIN_EMPRESA podem alterar o status",
  "error": "Forbidden",
  "statusCode": 403
}
```

### 6. Excluir Solicitação de Abastecimento

- **Rota**: `DELETE /solicitacoes-abastecimento/:id` ou `DELETE /solicitacoes/:id`
- **Método**: `DELETE`
- **Guards**: `AdminPrefeituraEmpresaGuard`

#### Exemplo de Requisição

```bash
DELETE /solicitacoes-abastecimento/123
```

#### Exemplo de Resposta - Sucesso (200)

```json
{
  "message": "Solicitação de abastecimento removida com sucesso"
}
```

**⚠️ Atenção**: Ao excluir uma solicitação, as quantidades alteradas em outras tabelas (como `CotaOrgao`) **NÃO são revertidas automaticamente**. Se a solicitação já gerou um abastecimento (`abastecimento_id` não é null), as alterações na cota permanecem no banco de dados.

## Rotas Auxiliares

### Obter Preço do Combustível

- **Rota**: `GET /solicitacoes-abastecimento/preco-combustivel?combustivelId=1&empresaId=3`
- **Método**: `GET`
- **Descrição**: Retorna o preço atual do combustível para uma empresa

### Validar Capacidade do Tanque

- **Rota**: `POST /solicitacoes-abastecimento/validar-capacidade-tanque`
- **Método**: `POST`
- **Body**: `{ "veiculoId": 57, "quantidade": 50.5 }`
- **Descrição**: Valida se a quantidade é menor ou igual à capacidade do tanque do veículo

### Listar Veículos da Prefeitura

- **Rota**: `GET /solicitacoes-abastecimento/veiculo/orgao/prefeitura`
- **Método**: `GET`
- **Guards**: `AdminPrefeituraGuard`
- **Descrição**: Lista veículos vinculados aos órgãos da prefeitura do usuário

### Listar Empresas Credenciadas

- **Rota**: `GET /solicitacoes-abastecimento/empresas/credenciadas`
- **Método**: `GET`
- **Guards**: `AdminPrefeituraGuard`
- **Descrição**: Lista empresas credenciadas da prefeitura do usuário

### Listar Cotas do Órgão

- **Rota**: `GET /solicitacoes-abastecimento/orgao/:orgaoId/cotas`
- **Método**: `GET`
- **Guards**: `AdminPrefeituraGuard`
- **Descrição**: Lista cotas de combustível do órgão dentro da prefeitura do usuário

### Listar Combustíveis Credenciados da Empresa

- **Rota**: `GET /solicitacoes-abastecimento/empresas/:empresaId/combustiveis`
- **Método**: `GET`
- **Descrição**: Lista combustíveis credenciados de uma empresa

## Status Disponíveis

| Status | Descrição |
|--------|-----------|
| `PENDENTE` | Solicitação pendente de aprovação (padrão) |
| `APROVADA` | Solicitação aprovada e pronta para abastecimento |
| `REJEITADA` | Solicitação rejeitada |
| `EXPIRADA` | Solicitação expirada (data de expiração ultrapassada) |
| `EFETIVADA` | Solicitação efetivada (abastecimento já foi realizado) |

## Observações Importantes

1. **Alteração de Status**: Use a rota específica `PATCH /solicitacoes-abastecimento/:id/status` para alterar apenas o status, pois ela preenche automaticamente os campos relacionados (data de aprovação/rejeição, quem aprovou/rejeitou, etc.).

2. **Exclusão de Solicitação**: Ao excluir uma solicitação que já gerou um abastecimento, as alterações na `CotaOrgao` (quantidade_utilizada, valor_utilizado, etc.) **NÃO são revertidas**. O abastecimento vinculado permanece no banco de dados.

3. **Validações na Criação**: Ao criar uma solicitação do tipo `COTA`, o sistema valida se a quantidade solicitada não excede o limite do período configurado no veículo.

4. **Permissões**: 
   - `ADMIN_PREFEITURA` e `ADMIN_EMPRESA` podem criar, atualizar, alterar status e excluir solicitações
   - `COLABORADOR_EMPRESA` pode apenas listar e visualizar solicitações da sua empresa

5. **Dados do Usuário**: Quando você não fornece os campos `aprovado_por`, `aprovado_por_email`, etc., o sistema tenta preencher automaticamente com os dados do usuário logado (`user.nome`, `user.email`, `user.empresa.nome`).


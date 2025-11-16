# Cadastro de Cota por Órgão (`CotaOrgao`)

Este documento explica como cadastrar cotas de combustível por órgão, vinculadas a um processo do tipo **OBJETIVO**, e quais validações de negócio são aplicadas no backend.

## Visão geral

- **Model principal**: `CotaOrgao`
- **Relações importantes**:
  - `CotaOrgao.processoId` → `Processo.id` (processo OBJETIVO da prefeitura).
  - `CotaOrgao.orgaoId` → `Orgao.id` (órgão da mesma prefeitura).
  - `CotaOrgao.combustivelId` → `Combustivel.id` e `ProcessoCombustivel.combustivelId`.
- **Regra de autorização**:
  - Apenas usuários com perfil **`ADMIN_PREFEITURA`** podem criar cotas.
  - O órgão e o processo devem pertencer à **mesma prefeitura** do usuário logado.

## Endpoint

- **Rota**: `POST /orgaos/:id/cotas`
  - `:id` é o `orgaoId`.
- **Guards**:
  - `JwtAuthGuard`
  - `AdminPrefeituraGuard`

### Corpo da requisição (JSON)

```json
{
  "processoId": 1,
  "combustivelId": 3,
  "quantidade": 10000.0
}
```

- **`processoId`**: ID do processo OBJETIVO ativo da prefeitura do usuário.
- **`combustivelId`**: ID do combustível vinculado ao processo (tabela `ProcessoCombustivel`).
- **`quantidade`**: quantidade de litros da cota para **este órgão** e **este combustível**.

## Lógica de negócio aplicada

### 1. Validação de permissão e vínculos

1. O usuário precisa estar autenticado e ter tipo `ADMIN_PREFEITURA`.
2. A prefeitura considerada é `req.user.prefeitura.id` ou `req.user.prefeituraId`.
3. O órgão `:id` deve existir e ter `orgao.prefeituraId === prefeituraId`.
4. O processo deve atender:
   - Pertencer à mesma prefeitura (`processo.prefeituraId === prefeituraId`).
   - `tipo_contrato === OBJETIVO`.
   - `status === ATIVO` e `ativo === true`.
5. O processo deve ter `litros_desejados` configurado.
6. O combustível informado (`combustivelId`) precisa existir em `ProcessoCombustivel` para este processo.

Se qualquer condição acima falhar, o backend retorna **400/403/404** com mensagem descritiva (processo/órgão não encontrado, processo não pertence à prefeitura, combustível não vinculado ao processo etc.).

### 2. Limite 1 – Soma das cotas x `litros_desejados` do processo

Para o `processoId` informado:

- Calcula-se a soma de todas as cotas existentes:

```text
totalCotasProcesso = SUM(CotaOrgao.quantidade WHERE processoId = :processoId)
novaSomaProcesso = totalCotasProcesso + quantidade (nova cota)
```

- Essa soma **não pode ultrapassar** `Processo.litros_desejados`.
- Se `novaSomaProcesso > litros_desejados`, retorna **400 Bad Request** com mensagem explicando:
  - total atual de cotas,
  - litros desejados do processo,
  - recomendação de reduzir a quantidade ou ajustar o processo.

### 3. Limite 2 – Soma das cotas por combustível x `quantidade_litros` de `ProcessoCombustivel`

Para o par (`processoId`, `combustivelId`):

- Calcula-se:

```text
totalCotasCombustivel = SUM(CotaOrgao.quantidade WHERE processoId = :processoId AND combustivelId = :combustivelId)
novaSomaCombustivel = totalCotasCombustivel + quantidade (nova cota)
```

- Essa soma **não pode ultrapassar** `ProcessoCombustivel.quantidade_litros` para o combustível no processo.
- Se `novaSomaCombustivel > quantidade_litros` deste combustível, retorna **400 Bad Request** com mensagem indicando:
  - total atual das cotas deste combustível,
  - `quantidade_litros` configurada no processo.

### 4. Criação da cota (`CotaOrgao`)

Se todas as validações forem aprovadas, é criado um registro em `CotaOrgao` com:

- `processoId`: ID do processo validado.
- `orgaoId`: ID do órgão passado na rota (`/orgaos/:id/cotas`).
- `combustivelId`: combustível informado.
- `quantidade`: valor informado no JSON.
- `quantidade_utilizada`: `0`.
- `valor_utilizado`: `0`.
- `restante`: igual à `quantidade`.
- `saldo_disponivel_cota`: igual à `quantidade`.
- `ativa`: `true`.

## Exemplo de resposta (201 – sucesso)

```json
{
  "message": "Cota do órgão criada com sucesso",
  "cota": {
    "id": 10,
    "processoId": 1,
    "orgaoId": 5,
    "combustivelId": 3,
    "quantidade": "10000.000",
    "quantidade_utilizada": "0.0",
    "valor_utilizado": "0.00",
    "restante": "10000.0",
    "saldo_disponivel_cota": "10000.00",
    "ativa": true,
    "orgao": {
      "id": 5,
      "nome": "Secretaria de Transportes",
      "sigla": "SETTRANS"
    },
    "combustivel": {
      "id": 3,
      "nome": "Diesel S10",
      "sigla": "D S10"
    },
    "processo": {
      "id": 1,
      "numero_processo": "PROC-2025-001",
      "litros_desejados": "400000.00"
    }
  },
  "limites": {
    "litros_desejados_processo": 400000,
    "total_cotas_processo": 10000,
    "quantidade_processocombustivel": 150000,
    "total_cotas_combustivel": 10000
  }
}
```

## Principais erros e mensagens

- **400 Bad Request**:
  - Processo não pertence à prefeitura do usuário ou não está ativo/OBJETIVO.
  - Processo sem `litros_desejados`.
  - Combustível não vinculado ao processo.
  - Soma das cotas ultrapassa `litros_desejados` do processo.
  - Soma das cotas do combustível ultrapassa `quantidade_litros` de `ProcessoCombustivel`.

- **403 Forbidden**:
  - Usuário não é `ADMIN_PREFEITURA`.
  - Órgão não pertence à mesma prefeitura do usuário.

- **404 Not Found**:
  - Órgão não encontrado.
  - Processo não encontrado para a prefeitura do usuário.

## Fluxo recomendado

1. Certificar-se de que:
   - existe um **Processo OBJETIVO** ativo para a prefeitura do usuário, com `litros_desejados` configurado;
   - os combustíveis desejados estão cadastrados em `ProcessoCombustivel` com suas `quantidade_litros`.
2. Selecionar o **órgão** e o **combustível** no front-end.
3. Chamar `POST /orgaos/:orgaoId/cotas` com o JSON contendo `processoId`, `combustivelId` e `quantidade`.
4. Tratar as mensagens de erro retornadas para orientar o usuário quando ultrapassar os limites do processo ou do combustível.


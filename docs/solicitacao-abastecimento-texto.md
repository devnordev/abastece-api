# Documentação: Solicitação de Abastecimento - Regras e Validações

## Índice
1. [Visão Geral do Model](#visão-geral-do-model)
2. [Vínculos e Relacionamentos](#vínculos-e-relacionamentos)
3. [Validações Comuns a Todos os Tipos](#validações-comuns-a-todos-os-tipos)
4. [Tipo LIVRE](#tipo-livre)
5. [Tipo COM_COTA](#tipo-com_cota)
6. [Tipo COM_AUTORIZACAO](#tipo-com_autorizacao)
7. [Fluxo Completo de Validação](#fluxo-completo-de-validação)

---

## Visão Geral do Model

O model `SolicitacaoAbastecimento` representa uma solicitação de abastecimento de combustível para um veículo. Cada solicitação contém informações sobre o veículo, motorista (opcional), combustível, empresa fornecedora, quantidade solicitada e tipo de abastecimento.

### Campos Principais

```prisma
model SolicitacaoAbastecimento {
  id                          Int       @id @default(autoincrement())
  prefeituraId                Int
  veiculoId                   Int
  motoristaId                 Int?      // Opcional
  combustivelId               Int
  empresaId                   Int
  quantidade                  Decimal   @db.Decimal(10, 2)
  data_solicitacao            DateTime
  data_expiracao              DateTime
  tipo_abastecimento          TipoAbastecimentoSolicitacao
  status                      StatusSolicitacao @default(PENDENTE)
  // ... outros campos
}
```

### Enums Relacionados

- **TipoAbastecimentoSolicitacao**: `LIVRE`, `COM_COTA`, `COM_AUTORIZACAO`
- **TipoAbastecimentoVeiculo**: `LIVRE`, `COTA`, `COM_AUTORIZACAO`
- **Periodicidade**: `Diário`, `Semanal`, `Mensal`
- **StatusSolicitacao**: `PENDENTE`, `APROVADA`, `REJEITADA`, `EXPIRADA`

---

## Vínculos e Relacionamentos

### 1. Prefeitura
- **Campo**: `prefeituraId`
- **Relacionamento**: `Prefeitura`
- **Regra**: O `prefeituraId` deve ser o mesmo do usuário logado. Todas as validações são feitas dentro do contexto desta prefeitura.

### 2. Veículo
- **Campo**: `veiculoId`
- **Relacionamento**: `Veiculo`
- **Regras**:
  - O veículo deve pertencer à mesma prefeitura do usuário logado
  - O veículo deve estar ativo
  - O veículo possui um `tipo_abastecimento` que determina as regras de validação
  - O veículo pode ter uma `periodicidade` (Diário, Semanal, Mensal) - **apenas para tipo COM_COTA**
  - O veículo possui `capacidade_tanque` que limita a quantidade máxima
  - O veículo deve estar vinculado a um órgão para validação de cotas

### 3. Motorista (Opcional)
- **Campo**: `motoristaId` (pode ser `null`)
- **Relacionamento**: `Motorista`
- **Regras**:
  - Se informado, o motorista deve estar vinculado ao veículo através de `VeiculoMotorista`
  - O vínculo deve estar ativo (`ativo = true`)
  - O motorista deve pertencer à mesma prefeitura

### 4. Combustível
- **Campo**: `combustivelId`
- **Relacionamento**: `Combustivel`
- **Regras**:
  - O combustível deve estar vinculado ao veículo através de `VeiculoCombustivel`
  - O vínculo deve estar ativo (`ativo = true`)
  - O combustível deve ter preço definido para a empresa através de `EmpresaPrecoCombustivel`
  - O preço deve estar com status `ACTIVE`

### 5. Empresa
- **Campo**: `empresaId`
- **Relacionamento**: `Empresa`
- **Regras**:
  - A empresa deve estar autorizada pela prefeitura
  - A empresa deve ter preço cadastrado para o combustível solicitado

### 6. Órgão (Indireto)
- **Relacionamento**: `Veiculo -> Orgao`
- **Regras**:
  - O veículo deve estar vinculado a um órgão (`veiculo.orgaoId`)
  - O órgão é necessário para validação de `CotaOrgao`
  - O órgão deve pertencer à mesma prefeitura

### 7. Processo (Indireto)
- **Relacionamento**: `Prefeitura -> Processo`
- **Regras**:
  - Deve existir um processo ativo do tipo `OBJETIVO` para a prefeitura
  - O processo deve ter status `ATIVO` e campo `ativo = true`
  - O processo é necessário para buscar `CotaOrgao`

### 8. CotaOrgao (Indireto)
- **Relacionamento**: `Processo -> CotaOrgao`
- **Regras**:
  - Deve existir uma cota ativa (`ativa = true`) para:
    - O órgão do veículo
    - O combustível solicitado
    - O processo ativo da prefeitura
  - A cota possui `restante` que indica a quantidade disponível

### 9. VeiculoCotaPeriodo (Indireto - apenas para COM_COTA)
- **Relacionamento**: `Veiculo -> VeiculoCotaPeriodo`
- **Regras**:
  - Apenas para veículos com `tipo_abastecimento = COM_COTA`
  - Deve existir uma cota de período ativa (`ativo = true`) que contenha a data da solicitação
  - A cota possui:
    - `quantidade_permitida`: quantidade máxima permitida no período
    - `quantidade_utilizada`: quantidade já utilizada no período
    - `quantidade_disponivel`: quantidade ainda disponível (permitida - utilizada)

---

## Validações Comuns a Todos os Tipos

Antes de aplicar as regras específicas de cada tipo de abastecimento, o sistema realiza as seguintes validações comuns:

### 1. Validação de Prefeitura
- **Passo 1**: Verificar se o `prefeituraId` foi informado
- **Passo 2**: O `prefeituraId` deve corresponder ao do usuário logado
- **Erro**: `SolicitacaoAbastecimentoPrefeituraNaoInformadaException`

### 2. Validação de Veículo
- **Passo 1**: Buscar o veículo pelo `veiculoId`
- **Passo 2**: Verificar se o veículo existe
- **Passo 3**: Verificar se o veículo pertence à prefeitura do usuário (`veiculo.prefeituraId === prefeituraId`)
- **Erro**: `SolicitacaoAbastecimentoVeiculoNaoPertencePrefeituraException`

### 3. Validação de Motorista (se informado)
- **Passo 1**: Se `motoristaId` foi informado, buscar o vínculo em `VeiculoMotorista`
- **Passo 2**: Verificar se existe vínculo ativo entre o motorista e o veículo
- **Passo 3**: Verificar se o vínculo está ativo (`ativo = true`)
- **Erro**: `SolicitacaoAbastecimentoMotoristaNaoVinculadoVeiculoException`

### 4. Validação de Combustível
- **Passo 1**: Verificar se o combustível está vinculado ao veículo através de `VeiculoCombustivel`
- **Passo 2**: Verificar se o vínculo está ativo (`ativo = true`)
- **Erro**: `SolicitacaoAbastecimentoCombustivelNaoRelacionadoException`

### 5. Validação de Capacidade do Tanque
- **Passo 1**: Verificar se o veículo possui `capacidade_tanque` definida
- **Passo 2**: Verificar se `quantidade <= capacidade_tanque`
- **Erro**: `SolicitacaoAbastecimentoQuantidadeExcedeCapacidadeTanqueException`

### 6. Validação de Preço do Combustível na Empresa
- **Passo 1**: Buscar preço em `EmpresaPrecoCombustivel` para a empresa e combustível
- **Passo 2**: Verificar se o preço existe e está com status `ACTIVE`
- **Erro**: `SolicitacaoAbastecimentoCombustivelPrecoNaoDefinidoException`

---

## Tipo LIVRE

### Características
- **Tipo do Veículo**: `tipo_abastecimento = LIVRE`
- **Periodicidade**: Não utiliza periodicidade do veículo
- **Validações Específicas**: Apenas `CotaOrgao`

### Fluxo de Validação

#### Passo 1: Verificar Vínculo com Órgão
```
Se veiculo.orgaoId é null:
  → Erro: SolicitacaoAbastecimentoVeiculoSemOrgaoException
```

#### Passo 2: Buscar Processo Ativo
```
Buscar Processo onde:
  - prefeituraId = prefeituraId do usuário
  - tipo_contrato = OBJETIVO
  - status = ATIVO
  - ativo = true

Se não encontrado:
  → Erro: SolicitacaoAbastecimentoProcessoAtivoNaoEncontradoException
```

#### Passo 3: Buscar CotaOrgao
```
Buscar CotaOrgao onde:
  - processoId = processo.id (do passo anterior)
  - orgaoId = veiculo.orgaoId
  - combustivelId = combustivelId da solicitação
  - ativa = true

Se não encontrado:
  → Erro: SolicitacaoAbastecimentoCotaOrgaoNaoEncontradaException
```

#### Passo 4: Validar Quantidade Disponível
```
Se quantidade_solicitada > cotaOrgao.restante:
  → Erro: SolicitacaoAbastecimentoCotaOrgaoInsuficienteLivreException
```

### Resumo das Validações para LIVRE
1. ✅ Veículo pertence à prefeitura
2. ✅ Motorista vinculado ao veículo (se informado)
3. ✅ Combustível vinculado ao veículo
4. ✅ Quantidade ≤ capacidade_tanque
5. ✅ Preço do combustível definido na empresa
6. ✅ Veículo possui órgão vinculado
7. ✅ Processo ativo existe para a prefeitura
8. ✅ CotaOrgao existe e está ativa
9. ✅ Quantidade ≤ restante da CotaOrgao

### Exemplo Prático

**Cenário:**
- Veículo: ID 10, tipo_abastecimento = LIVRE, capacidade_tanque = 50L
- Órgão: ID 5
- Combustível: Gasolina (ID 1)
- Quantidade solicitada: 30L
- CotaOrgao.restante: 100L

**Validação:**
1. ✅ Veículo existe e pertence à prefeitura
2. ✅ Combustível está vinculado ao veículo
3. ✅ 30L ≤ 50L (capacidade_tanque) ✅
4. ✅ Processo ativo encontrado
5. ✅ CotaOrgao encontrada
6. ✅ 30L ≤ 100L (restante) ✅
7. ✅ **Solicitação permitida**

---

## Tipo COM_COTA

### Características
- **Tipo do Veículo**: `tipo_abastecimento = COTA`
- **Periodicidade**: Pode ser `Diário`, `Semanal` ou `Mensal`
- **Validações Específicas**: 
  - `VeiculoCotaPeriodo` (se houver periodicidade)
  - `CotaOrgao`

### Fluxo de Validação

#### Passo 1: Verificar Vínculo com Órgão
```
Se veiculo.orgaoId é null:
  → Erro: SolicitacaoAbastecimentoVeiculoSemOrgaoException
```

#### Passo 2: Validar VeiculoCotaPeriodo (se houver periodicidade)
```
Se veiculo.periodicidade não é null:
  
  Passo 2.1: Buscar VeiculoCotaPeriodo
  Buscar VeiculoCotaPeriodo onde:
    - veiculoId = veiculo.id
    - periodicidade = veiculo.periodicidade
    - data_inicio_periodo <= data_solicitacao
    - data_fim_periodo >= data_solicitacao
    - ativo = true
  
  Se não encontrado:
    → Erro: SolicitacaoAbastecimentoVeiculoCotaPeriodoNaoEncontradaException
  
  Passo 2.2: Verificar se a cota está esgotada
  Se quantidade_disponivel <= 0:
    → Erro: SolicitacaoAbastecimentoVeiculoCotaPeriodoEsgotadaException
  
  Passo 2.3: Validar quantidade disponível
  Se quantidade_solicitada > quantidade_disponivel:
    → Erro: SolicitacaoAbastecimentoVeiculoCotaPeriodoQuantidadeInsuficienteException
```

#### Passo 3: Buscar Processo Ativo
```
Buscar Processo onde:
  - prefeituraId = prefeituraId do usuário
  - tipo_contrato = OBJETIVO
  - status = ATIVO
  - ativo = true

Se não encontrado:
  → Erro: SolicitacaoAbastecimentoProcessoAtivoNaoEncontradoException
```

#### Passo 4: Buscar CotaOrgao
```
Buscar CotaOrgao onde:
  - processoId = processo.id
  - orgaoId = veiculo.orgaoId
  - combustivelId = combustivelId da solicitação
  - ativa = true

Se não encontrado:
  → Erro: SolicitacaoAbastecimentoCotaOrgaoNaoEncontradaException
```

#### Passo 5: Validar Quantidade Disponível na CotaOrgao
```
Se quantidade_solicitada > cotaOrgao.restante:
  → Erro: SolicitacaoAbastecimentoCotaOrgaoInsuficienteComCotaException
```

### Periodicidade e VeiculoCotaPeriodo

#### Periodicidade Diário
- **Descrição**: A cota é gerenciada por dia
- **VeiculoCotaPeriodo**: Deve existir um registro com `data_inicio_periodo` e `data_fim_periodo` que contenha a data da solicitação
- **Exemplo**: 
  - Data solicitação: 15/01/2025
  - Cota período: data_inicio = 15/01/2025 00:00, data_fim = 15/01/2025 23:59
  - quantidade_permitida: 50L
  - quantidade_utilizada: 20L
  - quantidade_disponivel: 30L
  - Se solicitar 35L → ❌ Erro (excede disponível)

#### Periodicidade Semanal
- **Descrição**: A cota é gerenciada por semana
- **VeiculoCotaPeriodo**: Deve existir um registro que contenha a data da solicitação dentro do período semanal
- **Exemplo**:
  - Data solicitação: 15/01/2025 (quarta-feira)
  - Cota período: data_inicio = 13/01/2025 (segunda), data_fim = 19/01/2025 (domingo)
  - quantidade_permitida: 200L
  - quantidade_utilizada: 150L
  - quantidade_disponivel: 50L
  - Se solicitar 60L → ❌ Erro (excede disponível)

#### Periodicidade Mensal
- **Descrição**: A cota é gerenciada por mês
- **VeiculoCotaPeriodo**: Deve existir um registro que contenha a data da solicitação dentro do período mensal
- **Exemplo**:
  - Data solicitação: 15/01/2025
  - Cota período: data_inicio = 01/01/2025, data_fim = 31/01/2025
  - quantidade_permitida: 800L
  - quantidade_utilizada: 600L
  - quantidade_disponivel: 200L
  - Se solicitar 250L → ❌ Erro (excede disponível)

### Resumo das Validações para COM_COTA
1. ✅ Veículo pertence à prefeitura
2. ✅ Motorista vinculado ao veículo (se informado)
3. ✅ Combustível vinculado ao veículo
4. ✅ Quantidade ≤ capacidade_tanque
5. ✅ Preço do combustível definido na empresa
6. ✅ Veículo possui órgão vinculado
7. ✅ **Se houver periodicidade**: VeiculoCotaPeriodo existe e quantidade ≤ disponível
8. ✅ Processo ativo existe para a prefeitura
9. ✅ CotaOrgao existe e está ativa
10. ✅ Quantidade ≤ restante da CotaOrgao

### Exemplo Prático - COM_COTA com Periodicidade Diária

**Cenário:**
- Veículo: ID 20, tipo_abastecimento = COTA, periodicidade = Diário, capacidade_tanque = 60L
- Órgão: ID 5
- Combustível: Gasolina (ID 1)
- Quantidade solicitada: 25L
- Data solicitação: 15/01/2025
- VeiculoCotaPeriodo:
  - quantidade_permitida: 50L
  - quantidade_utilizada: 20L
  - quantidade_disponivel: 30L
  - data_inicio_periodo: 15/01/2025 00:00
  - data_fim_periodo: 15/01/2025 23:59
- CotaOrgao.restante: 200L

**Validação:**
1. ✅ Veículo existe e pertence à prefeitura
2. ✅ Combustível está vinculado ao veículo
3. ✅ 25L ≤ 60L (capacidade_tanque) ✅
4. ✅ VeiculoCotaPeriodo encontrado para o dia
5. ✅ quantidade_disponivel = 30L > 0 ✅
6. ✅ 25L ≤ 30L (quantidade_disponivel) ✅
7. ✅ Processo ativo encontrado
8. ✅ CotaOrgao encontrada
9. ✅ 25L ≤ 200L (restante) ✅
10. ✅ **Solicitação permitida**

**Após a solicitação ser aprovada e abastecida:**
- VeiculoCotaPeriodo.quantidade_utilizada: 20L + 25L = 45L
- VeiculoCotaPeriodo.quantidade_disponivel: 50L - 45L = 5L
- CotaOrgao.restante: 200L - 25L = 175L

---

## Tipo COM_AUTORIZACAO

### Características
- **Tipo do Veículo**: `tipo_abastecimento = COM_AUTORIZACAO`
- **Periodicidade**: Não utiliza periodicidade do veículo
- **Validações Específicas**: Apenas `CotaOrgao`

### Fluxo de Validação

#### Passo 1: Verificar Vínculo com Órgão
```
Se veiculo.orgaoId é null:
  → Erro: SolicitacaoAbastecimentoVeiculoSemOrgaoException
```

#### Passo 2: Buscar Processo Ativo
```
Buscar Processo onde:
  - prefeituraId = prefeituraId do usuário
  - tipo_contrato = OBJETIVO
  - status = ATIVO
  - ativo = true

Se não encontrado:
  → Erro: SolicitacaoAbastecimentoProcessoAtivoNaoEncontradoException
```

#### Passo 3: Buscar CotaOrgao
```
Buscar CotaOrgao onde:
  - processoId = processo.id
  - orgaoId = veiculo.orgaoId
  - combustivelId = combustivelId da solicitação
  - ativa = true

Se não encontrado:
  → Erro: SolicitacaoAbastecimentoCotaOrgaoNaoEncontradaException
```

#### Passo 4: Validar Quantidade Disponível
```
Se quantidade_solicitada > cotaOrgao.restante:
  → Erro: SolicitacaoAbastecimentoCotaOrgaoInsuficienteComAutorizacaoException
```

### Resumo das Validações para COM_AUTORIZACAO
1. ✅ Veículo pertence à prefeitura
2. ✅ Motorista vinculado ao veículo (se informado)
3. ✅ Combustível vinculado ao veículo
4. ✅ Quantidade ≤ capacidade_tanque
5. ✅ Preço do combustível definido na empresa
6. ✅ Veículo possui órgão vinculado
7. ✅ Processo ativo existe para a prefeitura
8. ✅ CotaOrgao existe e está ativa
9. ✅ Quantidade ≤ restante da CotaOrgao

### Exemplo Prático

**Cenário:**
- Veículo: ID 30, tipo_abastecimento = COM_AUTORIZACAO, capacidade_tanque = 80L
- Órgão: ID 5
- Combustível: Diesel (ID 2)
- Quantidade solicitada: 50L
- CotaOrgao.restante: 300L

**Validação:**
1. ✅ Veículo existe e pertence à prefeitura
2. ✅ Combustível está vinculado ao veículo
3. ✅ 50L ≤ 80L (capacidade_tanque) ✅
4. ✅ Processo ativo encontrado
5. ✅ CotaOrgao encontrada
6. ✅ 50L ≤ 300L (restante) ✅
7. ✅ **Solicitação permitida**

---

## Fluxo Completo de Validação

### Diagrama de Fluxo

```
┌─────────────────────────────────────────────────────────────┐
│           INÍCIO: Criar Solicitação de Abastecimento        │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│  VALIDAÇÕES COMUNS                                          │
│  1. Prefeitura do usuário                                   │
│  2. Veículo existe e pertence à prefeitura                 │
│  3. Motorista vinculado (se informado)                      │
│  4. Combustível vinculado ao veículo                       │
│  5. Quantidade ≤ capacidade_tanque                         │
│  6. Preço do combustível na empresa                        │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
                    ┌───────────────┐
                    │ Tipo do       │
                    │ Veículo?      │
                    └───────────────┘
                   /       │        \
                  /        │         \
                 /         │          \
        ┌───────┘          │           └────────┐
        │                  │                    │
        ▼                  ▼                    ▼
┌──────────────┐  ┌──────────────┐  ┌──────────────────┐
│   LIVRE      │  │   COM_COTA   │  │ COM_AUTORIZACAO  │
└──────────────┘  └──────────────┘  └──────────────────┘
        │                  │                    │
        │                  │                    │
        ▼                  ▼                    ▼
┌──────────────┐  ┌──────────────────────┐  ┌──────────────┐
│ Validar      │  │ 1. Validar           │  │ Validar      │
│ CotaOrgao    │  │    VeiculoCotaPeriodo│  │ CotaOrgao    │
│              │  │    (se houver        │  │              │
│              │  │     periodicidade)   │  │              │
│              │  │ 2. Validar CotaOrgao │  │              │
└──────────────┘  └──────────────────────┘  └──────────────┘
        │                  │                    │
        └──────────────────┴────────────────────┘
                            │
                            ▼
                    ┌───────────────┐
                    │ Todas as      │
                    │ validações    │
                    │ passaram?     │
                    └───────────────┘
                   /                \
                  /                  \
            ┌─────┘                    └─────┐
            │                                │
            ▼                                ▼
    ┌──────────────┐              ┌──────────────┐
    │   SUCESSO    │              │    ERRO     │
    │ Criar        │              │ Lançar       │
    │ Solicitação  │              │ Exceção     │
    └──────────────┘              └──────────────┘
```

### Sequência de Validações Detalhada

#### Fase 1: Validações Iniciais
1. **Prefeitura**: Verificar se `prefeituraId` foi informado e corresponde ao usuário
2. **Veículo**: Buscar veículo e verificar se pertence à prefeitura
3. **Motorista**: Se informado, verificar vínculo com veículo
4. **Combustível**: Verificar se está vinculado ao veículo
5. **Capacidade**: Verificar se quantidade ≤ capacidade_tanque
6. **Preço**: Verificar se combustível tem preço na empresa

#### Fase 2: Validações Específicas por Tipo

**Para LIVRE:**
1. Verificar se veículo tem órgão
2. Buscar processo ativo
3. Buscar CotaOrgao
4. Validar quantidade ≤ restante

**Para COM_COTA:**
1. Verificar se veículo tem órgão
2. **Se houver periodicidade:**
   - Buscar VeiculoCotaPeriodo
   - Verificar se não está esgotada
   - Validar quantidade ≤ disponível
3. Buscar processo ativo
4. Buscar CotaOrgao
5. Validar quantidade ≤ restante

**Para COM_AUTORIZACAO:**
1. Verificar se veículo tem órgão
2. Buscar processo ativo
3. Buscar CotaOrgao
4. Validar quantidade ≤ restante

#### Fase 3: Criação da Solicitação
Se todas as validações passarem:
- Criar registro em `SolicitacaoAbastecimento`
- Status inicial: `PENDENTE`
- Retornar solicitação criada

---

## Tabela Comparativa dos Tipos

| Aspecto | LIVRE | COM_COTA | COM_AUTORIZACAO |
|--------|-------|----------|-----------------|
| **Periodicidade do Veículo** | Não usa | Usa (Diário/Semanal/Mensal) | Não usa |
| **Valida VeiculoCotaPeriodo** | ❌ Não | ✅ Sim (se houver periodicidade) | ❌ Não |
| **Valida CotaOrgao** | ✅ Sim | ✅ Sim | ✅ Sim |
| **Valida Capacidade Tanque** | ✅ Sim | ✅ Sim | ✅ Sim |
| **Valida Preço Empresa** | ✅ Sim | ✅ Sim | ✅ Sim |
| **Requer Órgão** | ✅ Sim | ✅ Sim | ✅ Sim |
| **Requer Processo Ativo** | ✅ Sim | ✅ Sim | ✅ Sim |

---

## Exceções e Mensagens de Erro

Todas as exceções lançadas durante a validação contêm:
- **Mensagem descritiva**: Explica o problema de forma clara
- **Código de erro único**: Identifica o tipo de erro
- **Contexto detalhado**: Informações sobre o que foi esperado e o que foi encontrado
- **Sugestões**: Orientações sobre como corrigir o problema

### Principais Exceções

1. `SolicitacaoAbastecimentoVeiculoNaoPertencePrefeituraException`
2. `SolicitacaoAbastecimentoMotoristaNaoVinculadoVeiculoException`
3. `SolicitacaoAbastecimentoCombustivelNaoRelacionadoException`
4. `SolicitacaoAbastecimentoQuantidadeExcedeCapacidadeTanqueException`
5. `SolicitacaoAbastecimentoCombustivelPrecoNaoDefinidoException`
6. `SolicitacaoAbastecimentoVeiculoSemOrgaoException`
7. `SolicitacaoAbastecimentoProcessoAtivoNaoEncontradoException`
8. `SolicitacaoAbastecimentoCotaOrgaoNaoEncontradaException`
9. `SolicitacaoAbastecimentoCotaOrgaoInsuficienteLivreException`
10. `SolicitacaoAbastecimentoCotaOrgaoInsuficienteComCotaException`
11. `SolicitacaoAbastecimentoCotaOrgaoInsuficienteComAutorizacaoException`
12. `SolicitacaoAbastecimentoVeiculoCotaPeriodoNaoEncontradaException`
13. `SolicitacaoAbastecimentoVeiculoCotaPeriodoEsgotadaException`
14. `SolicitacaoAbastecimentoVeiculoCotaPeriodoQuantidadeInsuficienteException`

---

## Observações Importantes

### 1. Periodicidade e VeiculoCotaPeriodo
- A periodicidade (Diário, Semanal, Mensal) **apenas se aplica** a veículos com `tipo_abastecimento = COM_COTA`
- Para veículos LIVRE e COM_AUTORIZACAO, a periodicidade do veículo é ignorada
- O `VeiculoCotaPeriodo` gerencia a cota do veículo para o período específico
- A `quantidade_disponivel` é calculada automaticamente: `quantidade_permitida - quantidade_utilizada`

### 2. CotaOrgao
- A `CotaOrgao` é sempre validada para todos os tipos (LIVRE, COM_COTA, COM_AUTORIZACAO)
- O campo `restante` indica a quantidade disponível na cota do órgão
- A cota deve estar ativa (`ativa = true`)

### 3. Processo
- O processo deve ser do tipo `OBJETIVO` e ter status `ATIVO`
- O processo é necessário para buscar a `CotaOrgao` correta

### 4. Capacidade do Tanque
- A validação de capacidade do tanque é sempre realizada, independente do tipo
- A quantidade solicitada nunca pode exceder a capacidade física do tanque

### 5. Preço do Combustível
- O preço deve estar cadastrado e ativo na empresa
- O status do preço deve ser `ACTIVE`

---

## Conclusão

O sistema de solicitação de abastecimento implementa validações rigorosas para garantir que:
1. Apenas solicitações válidas sejam criadas
2. As cotas sejam respeitadas (do veículo e do órgão)
3. Os vínculos entre entidades sejam verificados
4. As capacidades físicas sejam respeitadas
5. Os preços estejam definidos

Cada tipo de abastecimento tem suas regras específicas, mas todos compartilham as validações comuns de vínculos e capacidades básicas.


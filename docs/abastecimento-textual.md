# Documentação: Abastecimento - Funcionamento Completo

## Índice
1. [Visão Geral do Model](#visão-geral-do-model)
2. [Campos e Estrutura](#campos-e-estrutura)
3. [Relacionamentos](#relacionamentos)
4. [Fluxo de Criação de Abastecimento](#fluxo-de-criação-de-abastecimento)
5. [Validações Realizadas](#validações-realizadas)
6. [Atualizações Automáticas em Outras Tabelas](#atualizações-automáticas-em-outras-tabelas)
7. [Exemplos Práticos](#exemplos-práticos)
8. [Fluxo Completo Detalhado](#fluxo-completo-detalhado)

---

## Visão Geral do Model

O model `Abastecimento` representa um registro efetivo de abastecimento de combustível realizado para um veículo. Cada abastecimento registra informações sobre o veículo abastecido, o combustível utilizado, a empresa fornecedora, a quantidade abastecida, o valor total pago, e todas as atualizações relacionadas em outras tabelas do sistema (CotaOrgao e Processo).

### Características Principais

- **Registro Efetivo**: Representa um abastecimento já realizado (não é apenas uma solicitação)
- **Rastreabilidade**: Mantém histórico completo de todos os abastecimentos realizados
- **Integração Automática**: Atualiza automaticamente as cotas do órgão e processos relacionados
- **Flexibilidade**: Pode ser criado diretamente ou a partir de uma Solicitação de Abastecimento
- **Validação Rigorosa**: Realiza múltiplas validações antes de permitir o registro

---

## Campos e Estrutura

### Campos Obrigatórios

```prisma
model Abastecimento {
  id                Int                 @id @default(autoincrement())
  veiculoId         Int                 // ID do veículo abastecido
  combustivelId     Int                 // ID do combustível utilizado
  empresaId         Int                 // ID da empresa fornecedora
  tipo_abastecimento TipoAbastecimento  // Tipo: COM_COTA, LIVRE, COM_AUTORIZACAO
  quantidade        Decimal             @db.Decimal(10, 3)  // Quantidade em litros
  valor_total       Decimal             @db.Decimal(10, 2)  // Valor total pago
  status            StatusAbastecimento @default(Aguardando)  // Status do abastecimento
  ativo             Boolean             @default(true)       // Se está ativo
}
```

### Campos Opcionais

```prisma
  motoristaId                   Int?      // ID do motorista (se informado)
  solicitanteId                 Int?      // ID do usuário solicitante
  abastecedorId                 Int?      // ID da empresa abastecedora
  validadorId                   Int?      // ID do usuário validador
  preco_anp                     Decimal?  // Preço conforme tabela ANP
  preco_empresa                 Decimal?  // Preço praticado pela empresa
  desconto                      Decimal?  // Valor do desconto aplicado
  data_abastecimento            DateTime? // Data e hora do abastecimento
  odometro                      Int?      // Quilometragem do odômetro
  orimetro                      Int?      // Quilometragem do orímetro
  motivo_rejeicao               String?   // Motivo da rejeição (se rejeitado)
  abastecido_por                String?   // Nome de quem realizou o abastecimento
  nfe_chave_acesso              String?   // Chave de acesso da NFE (44 dígitos)
  nfe_img_url                   String?   // URL da imagem da NFE
  nfe_link                      String?   // Link para visualização da NFE
  conta_faturamento_orgao_id    Int?      // ID da conta de faturamento do órgão
  cota_id                       Int?      // ID da cota do órgão utilizada
  data_aprovacao                DateTime? // Data da aprovação
  data_rejeicao                 DateTime? // Data da rejeição
  aprovado_por                  String?   // Nome de quem aprovou
  aprovado_por_email            String?   // Email de quem aprovou
  rejeitado_por                 String?   // Nome de quem rejeitou
  rejeitado_por_email           String?   // Email de quem rejeitou
```

### Enums Relacionados

#### StatusAbastecimento
- **Aguardando**: Abastecimento criado e aguardando aprovação
- **Aprovado**: Abastecimento aprovado e efetivado
- **Rejeitado**: Abastecimento rejeitado (com motivo)
- **Cancelado**: Abastecimento cancelado

#### TipoAbastecimento
- **COM_COTA**: Abastecimento com controle de cota
- **LIVRE**: Abastecimento livre (sem controle de cota periódica)
- **COM_AUTORIZACAO**: Abastecimento que requer autorização

---

## Relacionamentos

### Relacionamentos Diretos

1. **Veiculo** (Obrigatório)
   - `veiculoId` → `Veiculo.id`
   - Relacionamento: Um abastecimento pertence a um veículo
   - Um veículo pode ter muitos abastecimentos

2. **Combustivel** (Obrigatório)
   - `combustivelId` → `Combustivel.id`
   - Relacionamento: Um abastecimento utiliza um combustível
   - Um combustível pode estar em muitos abastecimentos

3. **Empresa** (Obrigatório)
   - `empresaId` → `Empresa.id`
   - Relacionamento: Um abastecimento é fornecido por uma empresa
   - Uma empresa pode fornecer muitos abastecimentos

4. **Motorista** (Opcional)
   - `motoristaId` → `Motorista.id`
   - Relacionamento: Um abastecimento pode estar associado a um motorista
   - Um motorista pode ter muitos abastecimentos

5. **Solicitante** (Opcional - Usuario)
   - `solicitanteId` → `Usuario.id`
   - Relacionamento: Usuário que solicitou o abastecimento

6. **Abastecedor** (Opcional - Empresa)
   - `abastecedorId` → `Empresa.id`
   - Relacionamento: Empresa que realizou o abastecimento físico

7. **Validador** (Opcional - Usuario)
   - `validadorId` → `Usuario.id`
   - Relacionamento: Usuário que validou/aprovou o abastecimento

8. **ContaFaturamentoOrgao** (Opcional)
   - `conta_faturamento_orgao_id` → `ContaFaturamentoOrgao.id`
   - Relacionamento: Conta de faturamento do órgão para este abastecimento

9. **CotaOrgao** (Opcional - Vinculado Automaticamente)
   - `cota_id` → `CotaOrgao.id`
   - Relacionamento: Cota do órgão utilizada neste abastecimento
   - **Importante**: Este relacionamento é buscado e vinculado automaticamente se não informado

10. **SolicitacaoAbastecimento** (Opcional - Relacionamento Inverso)
    - Relacionamento: Uma solicitação de abastecimento pode gerar um abastecimento
    - O abastecimento pode ter sido criado a partir de uma solicitação

### Relacionamentos Indiretos (Através de Outras Tabelas)

- **Orgão**: Através de `Veiculo` → `Orgao`
- **Prefeitura**: Através de `Veiculo` → `Prefeitura`
- **Processo**: Através de `Prefeitura` → `Processo` (busca automática)

---

## Fluxo de Criação de Abastecimento

### Opção 1: Criação Direta (Método `create`)

O abastecimento pode ser criado diretamente fornecendo todos os dados necessários.

#### Passo 1: Validações Iniciais

1. **Validação de Usuário e Empresa**
   - Verifica se o usuário pertence à empresa informada
   - Obrigatório para `ADMIN_EMPRESA` e `COLABORADOR_EMPRESA`
   - A empresa do usuário deve corresponder à `empresaId` informada

2. **Validação de Veículo**
   - Verifica se o veículo existe
   - Verifica se o veículo está ativo
   - Obtém a `prefeituraId` do veículo

3. **Validação de Combustível**
   - Verifica se o combustível existe
   - Verifica se o combustível está ativo
   - Verifica se o combustível está vinculado ao veículo (`VeiculoCombustivel`)

4. **Validação de Empresa**
   - Verifica se a empresa existe
   - Verifica se a empresa está ativa

5. **Validação de Motorista** (se informado)
   - Verifica se o motorista existe
   - Verifica se o motorista pertence à mesma prefeitura do veículo

6. **Validação de Validador** (se informado)
   - Verifica se o validador existe

7. **Validação de Abastecedor** (se informado)
   - Verifica se o abastecedor existe

8. **Validação de Conta de Faturamento** (se informada)
   - Verifica se a conta de faturamento existe

9. **Validação de Cota** (se informada)
   - Verifica se a cota existe
   - Verifica se a cota está ativa

#### Passo 2: Validações de Campos

1. **Validação de Quantidade**
   - Deve ser maior que zero
   - Não pode exceder a capacidade do tanque do veículo

2. **Validação de Valor Total**
   - Deve ser maior ou igual a zero
   - Se `preco_empresa` e `quantidade` estiverem informados, deve ser consistente:
     - `valor_total ≈ (quantidade × preco_empresa) - desconto`
     - Permite pequena diferença (0.01) devido a arredondamentos

3. **Validação de Data de Abastecimento**
   - Não pode ser uma data futura
   - Se não informada, usa a data/hora atual

4. **Validação de Chave de Acesso NFE**
   - Se informada, deve ter exatamente 44 caracteres
   - Deve conter apenas números

5. **Validação de URLs NFE**
   - `nfe_img_url` e `nfe_link` devem ser URLs válidas (http:// ou https://)

6. **Validação de Desconto**
   - Não pode ser maior que o valor total

#### Passo 3: Processamento em Transação

Todas as operações abaixo ocorrem dentro de uma **transação Prisma** para garantir consistência:

1. **Busca Automática de CotaOrgao**
   - Se `cota_id` não foi informado, busca automaticamente:
     - Obtém `orgaoId` do veículo
     - Busca processo ativo do tipo `OBJETIVO` da prefeitura
     - Busca `CotaOrgao` ativa para: `orgaoId`, `combustivelId`, `processoId`
   - Se encontrada, usa para vinculação

2. **Criação do Abastecimento**
   - Cria o registro na tabela `abastecimento`
   - Vincula a `CotaOrgao` encontrada (se existir)
   - Define data de abastecimento (data atual se não informada)

3. **Atualização de CotaOrgao** (se encontrada)
   - Incrementa `quantidade_utilizada` com a quantidade do abastecimento
   - Incrementa `valor_utilizado` com o valor total do abastecimento
   - Recalcula `restante = quantidade - quantidade_utilizada`

4. **Atualização de Processo** (sempre tenta)
   - Busca processo ativo do tipo `OBJETIVO` da prefeitura
   - Se encontrado:
     - Incrementa `valor_utilizado` com o valor total do abastecimento
     - Recalcula `valor_disponivel = litros_desejados - valor_utilizado`
   - Se não encontrado, não lança erro (pode não existir)

#### Passo 4: Retorno

- Retorna o abastecimento criado com todos os relacionamentos
- Inclui a `CotaOrgao` atualizada (se vinculada)

### Opção 2: Criação a partir de Solicitação (Método `createFromSolicitacao`)

O abastecimento pode ser criado a partir de uma Solicitação de Abastecimento existente.

#### Passo 1: Validações da Solicitação

1. **Validação de Usuário e Empresa**
   - Verifica se o usuário pertence à empresa da solicitação
   - A empresa da solicitação deve corresponder à empresa do usuário

2. **Validação de Solicitação**
   - Verifica se a solicitação existe
   - Verifica se a solicitação está ativa
   - Verifica se a solicitação não está expirada (`EXPIRADA`)
   - Verifica se a solicitação não está rejeitada (`REJEITADA`)
   - Verifica se a solicitação já não possui abastecimento vinculado

3. **Validação de Status**
   - Se a solicitação estiver `PENDENTE`, será aprovada automaticamente antes de criar o abastecimento

#### Passo 2: Processamento em Transação

1. **Aprovação Automática** (se necessário)
   - Se a solicitação estiver `PENDENTE`:
     - Atualiza status para `APROVADA`
     - Define `data_aprovacao`
     - Define `aprovado_por`, `aprovado_por_email`, `aprovado_por_empresa`

2. **Criação do Abastecimento**
   - Cria registro usando dados da solicitação
   - Copia: `veiculoId`, `motoristaId`, `combustivelId`, `empresaId`, `quantidade`, `tipo_abastecimento`
   - Calcula `valor_total` se não informado: `preco_empresa × quantidade`
   - Define status como `Aprovado` (padrão)

3. **Vinculação da Solicitação**
   - Atualiza a solicitação vinculando o abastecimento criado
   - Define `abastecimento_id` na solicitação
   - Mantém status `APROVADA`

4. **Busca Automática de CotaOrgao**
   - Se não foi encontrada anteriormente, busca automaticamente
   - Mesma lógica do método `create`

5. **Atualização de CotaOrgao** (se encontrada)
   - Mesma lógica do método `create`
   - Se não estava vinculada, atualiza `cota_id` no abastecimento

6. **Atualização de Processo** (sempre tenta)
   - Mesma lógica do método `create`

#### Passo 3: Retorno

- Retorna o abastecimento criado
- Retorna a solicitação atualizada
- Indica se a solicitação foi aprovada automaticamente

---

## Validações Realizadas

### Validações Obrigatórias (Sempre Executadas)

1. ✅ **Usuário pertence à empresa informada**
2. ✅ **Veículo existe e está ativo**
3. ✅ **Combustível existe, está ativo e vinculado ao veículo**
4. ✅ **Empresa existe e está ativa**
5. ✅ **Quantidade > 0 e ≤ capacidade_tanque**
6. ✅ **Valor total ≥ 0**
7. ✅ **Data de abastecimento não é futura**
8. ✅ **Valor total consistente com quantidade × preço - desconto**

### Validações Condicionais (Se Campos Informados)

1. ✅ **Motorista existe e pertence à prefeitura do veículo** (se `motoristaId` informado)
2. ✅ **Validador existe** (se `validadorId` informado)
3. ✅ **Abastecedor existe** (se `abastecedorId` informado)
4. ✅ **Conta de faturamento existe** (se `conta_faturamento_orgao_id` informado)
5. ✅ **Cota existe e está ativa** (se `cota_id` informado)
6. ✅ **Chave de acesso NFE tem 44 dígitos** (se `nfe_chave_acesso` informado)
7. ✅ **URLs NFE são válidas** (se `nfe_img_url` ou `nfe_link` informados)
8. ✅ **Desconto ≤ valor total** (se `desconto` informado)

---

## Atualizações Automáticas em Outras Tabelas

### 1. Atualização de CotaOrgao

Quando um abastecimento é criado, o sistema **automaticamente** busca e atualiza a `CotaOrgao` correspondente, se existir.

#### Como a CotaOrgao é Encontrada

1. **Passo 1**: Obtém `orgaoId` do veículo
   - Se o veículo não tiver órgão vinculado, não busca cota

2. **Passo 2**: Busca processo ativo
   - Busca `Processo` onde:
     - `prefeituraId` = prefeitura do veículo
     - `tipo_contrato` = `OBJETIVO`
     - `status` = `ATIVO`
     - `ativo` = `true`

3. **Passo 3**: Busca CotaOrgao
   - Busca `CotaOrgao` onde:
     - `processoId` = ID do processo encontrado
     - `orgaoId` = ID do órgão do veículo
     - `combustivelId` = ID do combustível do abastecimento
     - `ativa` = `true`

#### Cálculos Realizados na CotaOrgao

Quando a `CotaOrgao` é encontrada, os seguintes cálculos são realizados:

```typescript
// Valores atuais (antes do abastecimento)
quantidade_utilizada_atual = CotaOrgao.quantidade_utilizada
valor_utilizado_atual = CotaOrgao.valor_utilizado
quantidade_total = CotaOrgao.quantidade

// Valores do abastecimento
quantidade_abastecimento = Abastecimento.quantidade
valor_total_abastecimento = Abastecimento.valor_total

// Novos valores calculados
nova_quantidade_utilizada = quantidade_utilizada_atual + quantidade_abastecimento
novo_valor_utilizado = valor_utilizado_atual + valor_total_abastecimento
restante = quantidade_total - nova_quantidade_utilizada

// Atualização na CotaOrgao
CotaOrgao.quantidade_utilizada = nova_quantidade_utilizada
CotaOrgao.valor_utilizado = novo_valor_utilizado
CotaOrgao.restante = max(0, restante)  // Garante que não seja negativo
```

#### Exemplo Prático de Atualização de CotaOrgao

**Cenário Inicial:**
- CotaOrgao:
  - `quantidade`: 1000 L
  - `quantidade_utilizada`: 300 L
  - `valor_utilizado`: R$ 1.500,00
  - `restante`: 700 L

**Abastecimento Criado:**
- `quantidade`: 50 L
- `valor_total`: R$ 250,00

**Após Atualização:**
- CotaOrgao:
  - `quantidade`: 1000 L (inalterado)
  - `quantidade_utilizada`: 350 L (300 + 50)
  - `valor_utilizado`: R$ 1.750,00 (1500 + 250)
  - `restante`: 650 L (1000 - 350)

#### Vinculação no Abastecimento

- Se a `CotaOrgao` for encontrada e não estiver vinculada ao abastecimento (`cota_id` não informado), o sistema automaticamente:
  - Vincula a cota ao abastecimento (`cota_id` = ID da cota encontrada)
  - Atualiza os valores da cota

### 2. Atualização de Processo

Quando um abastecimento é criado, o sistema **sempre tenta** atualizar o `Processo` ativo da prefeitura, se existir.

#### Como o Processo é Encontrado

1. **Passo 1**: Busca processo ativo
   - Busca `Processo` onde:
     - `prefeituraId` = prefeitura do veículo
     - `tipo_contrato` = `OBJETIVO`
     - `status` = `ATIVO`
     - `ativo` = `true`

2. **Observação**: Se não encontrar processo ativo, **não lança erro** (pode não existir)

#### Cálculos Realizados no Processo

Quando o `Processo` é encontrado, os seguintes cálculos são realizados:

```typescript
// Valores atuais (antes do abastecimento)
valor_utilizado_atual = Processo.valor_utilizado || 0
litros_desejados = Processo.litros_desejados || 0

// Valor do abastecimento
valor_total_abastecimento = Abastecimento.valor_total

// Novos valores calculados
novo_valor_utilizado = valor_utilizado_atual + valor_total_abastecimento
valor_disponivel = litros_desejados - novo_valor_utilizado

// Atualização no Processo
Processo.valor_utilizado = novo_valor_utilizado
Processo.valor_disponivel = max(0, valor_disponivel)  // Garante que não seja negativo
```

**Nota Importante**: O cálculo de `valor_disponivel` usa `litros_desejados` (que é em litros) menos `valor_utilizado` (que é em reais). Isso parece ser um comportamento específico do sistema, onde `litros_desejados` representa um limite de valor, não de quantidade.

#### Exemplo Prático de Atualização de Processo

**Cenário Inicial:**
- Processo:
  - `litros_desejados`: 5000 L (ou R$ 5.000,00 dependendo da interpretação)
  - `valor_utilizado`: R$ 2.000,00
  - `valor_disponivel`: R$ 3.000,00

**Abastecimento Criado:**
- `valor_total`: R$ 250,00

**Após Atualização:**
- Processo:
  - `litros_desejados`: 5000 L (inalterado)
  - `valor_utilizado`: R$ 2.250,00 (2000 + 250)
  - `valor_disponivel`: R$ 2.750,00 (5000 - 2250)

---

## Exemplos Práticos

### Exemplo 1: Abastecimento Direto com Cota

**Dados de Entrada:**
```json
{
  "veiculoId": 10,
  "combustivelId": 1,
  "empresaId": 5,
  "quantidade": 50.5,
  "valor_total": 275.75,
  "tipo_abastecimento": "COM_COTA",
  "data_abastecimento": "2025-01-15T10:30:00Z"
}
```

**Processamento:**

1. **Validações Iniciais**:
   - ✅ Usuário pertence à empresa 5
   - ✅ Veículo 10 existe e está ativo (prefeituraId: 2, orgaoId: 3)
   - ✅ Combustível 1 existe, está ativo e vinculado ao veículo
   - ✅ Empresa 5 existe e está ativa
   - ✅ 50.5 L ≤ capacidade_tanque do veículo

2. **Transação Iniciada**:

   a. **Busca Automática de CotaOrgao**:
      - Veículo tem orgaoId: 3
      - Busca processo ativo da prefeitura 2 → Encontrado (ID: 5)
      - Busca CotaOrgao para processo 5, órgão 3, combustível 1 → Encontrada (ID: 12)
   
   b. **Criação do Abastecimento**:
      - Criado registro com ID: 100
      - `cota_id`: 12 (vinculado automaticamente)

   c. **Atualização de CotaOrgao (ID: 12)**:
      - Antes:
        - `quantidade_utilizada`: 200 L
        - `valor_utilizado`: R$ 1.100,00
        - `restante`: 800 L
      - Depois:
        - `quantidade_utilizada`: 250.5 L (200 + 50.5)
        - `valor_utilizado`: R$ 1.375,75 (1100 + 275.75)
        - `restante`: 749.5 L (1000 - 250.5)

   d. **Atualização de Processo (ID: 5)**:
      - Antes:
        - `valor_utilizado`: R$ 5.000,00
        - `valor_disponivel`: R$ 3.000,00
      - Depois:
        - `valor_utilizado`: R$ 5.275,75 (5000 + 275.75)
        - `valor_disponivel`: R$ 2.724,25 (8000 - 5275.75)

3. **Transação Confirmada**

**Resultado:**
- Abastecimento criado com sucesso (ID: 100)
- CotaOrgao atualizada (ID: 12)
- Processo atualizado (ID: 5)

### Exemplo 2: Abastecimento a partir de Solicitação

**Dados de Entrada:**
```json
{
  "solicitacaoId": 25
}
```

**Estado Inicial da Solicitação:**
- Status: `PENDENTE`
- Veículo: ID 10 (orgaoId: 3)
- Combustível: ID 1
- Quantidade: 30 L
- Prefeitura: ID 2

**Processamento:**

1. **Validações**:
   - ✅ Solicitação existe
   - ✅ Solicitação está ativa
   - ✅ Solicitação não está expirada/rejeitada
   - ✅ Usuário pertence à empresa da solicitação

2. **Transação Iniciada**:

   a. **Aprovação Automática da Solicitação**:
      - Status atualizado para `APROVADA`
      - `data_aprovacao`: data/hora atual
      - `aprovado_por`: nome do usuário

   b. **Criação do Abastecimento**:
      - Criado registro com dados da solicitação
      - ID: 101
      - `quantidade`: 30 L
      - `valor_total`: R$ 165,00 (calculado)

   c. **Vinculação da Solicitação**:
      - `abastecimento_id`: 101

   d. **Busca e Atualização de CotaOrgao**:
      - Mesmo processo do Exemplo 1
      - CotaOrgao atualizada

   e. **Atualização de Processo**:
      - Processo atualizado

3. **Transação Confirmada**

**Resultado:**
- Abastecimento criado (ID: 101)
- Solicitação aprovada automaticamente e vinculada ao abastecimento
- CotaOrgao atualizada
- Processo atualizado

---

## Fluxo Completo Detalhado

### Diagrama de Fluxo de Criação Direta

```
┌─────────────────────────────────────────────────────────────┐
│           INÍCIO: Criar Abastecimento Direto                │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│  VALIDAÇÕES INICIAIS                                         │
│  1. Usuário pertence à empresa                               │
│  2. Veículo existe e está ativo                              │
│  3. Combustível existe, está ativo e vinculado ao veículo   │
│  4. Empresa existe e está ativa                              │
│  5. Motorista válido (se informado)                          │
│  6. Outros relacionamentos válidos                           │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│  VALIDAÇÕES DE CAMPOS                                        │
│  1. Quantidade > 0 e ≤ capacidade_tanque                     │
│  2. Valor total ≥ 0                                          │
│  3. Data não é futura                                         │
│  4. Valor total consistente                                  │
│  5. Validações de NFE (se informado)                         │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
                    ┌───────────────┐
                    │  INICIAR      │
                    │  TRANSAÇÃO    │
                    └───────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│  PASSO 1: Buscar CotaOrgao Automaticamente                   │
│  - Obter orgaoId do veículo                                  │
│  - Buscar processo ativo da prefeitura                       │
│  - Buscar CotaOrgao ativa                                    │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│  PASSO 2: Criar Abastecimento                                │
│  - Criar registro na tabela abastecimento                    │
│  - Vincular CotaOrgao (se encontrada)                        │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
                    ┌───────────────┐
                    │ CotaOrgao     │
                    │ encontrada?   │
                    └───────────────┘
                   /              \
                  /                \
            ┌────┘                  └────┐
            │                            │
            ▼                            ▼
┌─────────────────────┐    ┌─────────────────────┐
│ SIM                 │    │ NÃO                 │
│                     │    │                     │
│ Atualizar CotaOrgao │    │ Pular atualização   │
│ - Incrementar       │    │                     │
│   quantidade_       │    │                     │
│   utilizada         │    │                     │
│ - Incrementar       │    │                     │
│   valor_utilizado   │    │                     │
│ - Recalcular        │    │                     │
│   restante          │    │                     │
└─────────────────────┘    └─────────────────────┘
            │                            │
            └────────────┬───────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│  PASSO 3: Atualizar Processo                                 │
│  - Buscar processo ativo da prefeitura                       │
│  - Se encontrado:                                            │
│    • Incrementar valor_utilizado                             │
│    • Recalcular valor_disponivel                             │
│  - Se não encontrado: Pular (sem erro)                       │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
                    ┌───────────────┐
                    │  CONFIRMAR    │
                    │  TRANSAÇÃO    │
                    └───────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│  RETORNAR RESULTADO                                          │
│  - Abastecimento criado                                      │
│  - CotaOrgao atualizada (se vinculada)                       │
│  - Relacionamentos incluídos                                 │
└─────────────────────────────────────────────────────────────┘
```

### Diagrama de Fluxo de Criação a partir de Solicitação

```
┌─────────────────────────────────────────────────────────────┐
│   INÍCIO: Criar Abastecimento de Solicitação                │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│  VALIDAÇÕES DA SOLICITAÇÃO                                   │
│  1. Solicitação existe e está ativa                          │
│  2. Não está expirada/rejeitada                              │
│  3. Não possui abastecimento vinculado                       │
│  4. Usuário pertence à empresa da solicitação                │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
                    ┌───────────────┐
                    │  INICIAR      │
                    │  TRANSAÇÃO    │
                    └───────────────┘
                            │
                            ▼
                    ┌───────────────┐
                    │ Status =      │
                    │ PENDENTE?     │
                    └───────────────┘
                   /              \
                  /                \
            ┌────┘                  └────┐
            │                            │
            ▼                            ▼
┌─────────────────────┐    ┌─────────────────────┐
│ SIM                 │    │ NÃO                 │
│                     │    │                     │
│ Aprovar Solicitação │    │ Continuar           │
│ - Status: APROVADA  │    │                     │
│ - Definir dados de  │    │                     │
│   aprovação         │    │                     │
└─────────────────────┘    └─────────────────────┘
            │                            │
            └────────────┬───────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│  Criar Abastecimento                                         │
│  - Usar dados da solicitação                                 │
│  - Status: Aprovado                                          │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│  Vincular Solicitação ao Abastecimento                       │
│  - atualizar abastecimento_id na solicitação                 │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│  Buscar e Atualizar CotaOrgao (mesma lógica do método create)│
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│  Atualizar Processo (mesma lógica do método create)          │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
                    ┌───────────────┐
                    │  CONFIRMAR    │
                    │  TRANSAÇÃO    │
                    └───────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│  RETORNAR RESULTADO                                          │
│  - Abastecimento criado                                      │
│  - Solicitação atualizada                                    │
│  - CotaOrgao atualizada (se vinculada)                       │
│  - Processo atualizado (se encontrado)                       │
└─────────────────────────────────────────────────────────────┘
```

---

## Observações Importantes

### 1. Transações e Consistência

- **Todas as operações** (criação de abastecimento, atualização de CotaOrgao, atualização de Processo) ocorrem dentro de uma **transação única** do Prisma
- Isso garante que **ou tudo é executado com sucesso, ou nada é alterado** (atomicidade)
- Se houver erro em qualquer etapa, todas as alterações são revertidas automaticamente

### 2. Busca Automática de CotaOrgao

- A busca de `CotaOrgao` é feita **automaticamente** se não for informado `cota_id`
- A busca usa a seguinte lógica:
  1. Obtém o órgão do veículo
  2. Busca o processo ativo do tipo OBJETIVO da prefeitura
  3. Busca a cota ativa para o órgão, combustível e processo
- Se encontrar, **automaticamente vincula** ao abastecimento
- Se não encontrar, o abastecimento é criado normalmente (sem cota vinculada)

### 3. Atualização Condicional de CotaOrgao

- A `CotaOrgao` é atualizada **apenas se for encontrada**
- Se não encontrar, o abastecimento é criado normalmente (sem erro)
- Isso permite abastecimentos que não estão vinculados a cotas

### 4. Atualização Sempre Tentada do Processo

- O sistema **sempre tenta** atualizar o `Processo`, mesmo se não encontrar
- Se não encontrar processo ativo, **não lança erro** (retorna silenciosamente)
- Isso permite abastecimentos em prefeituras sem processo ativo

### 5. Cálculos e Precisão

- Todos os cálculos são feitos com precisão decimal
- Os valores são sempre **garantidos como não negativos** (usando `Math.max(0, ...)`)
- Isso evita valores negativos em `restante` ou `valor_disponivel`

### 6. Status do Abastecimento

- **Aguardando**: Status inicial quando criado diretamente
- **Aprovado**: Quando criado a partir de solicitação ou aprovado manualmente
- **Rejeitado**: Quando rejeitado por um validador
- **Cancelado**: Quando cancelado

### 7. Relacionamento com Solicitação

- Um abastecimento pode ser criado **a partir de** uma solicitação
- A solicitação é **automaticamente aprovada** se estiver pendente
- A solicitação é **vinculada ao abastecimento** através do campo `abastecimento_id`
- Uma solicitação **pode ter apenas um abastecimento** vinculado

---

## Conclusão

O sistema de abastecimento implementa uma solução completa e robusta para gerenciar abastecimentos de combustível, com:

1. **Validações rigorosas** que garantem a integridade dos dados
2. **Atualizações automáticas** em CotaOrgao e Processo
3. **Transações atômicas** que garantem consistência
4. **Flexibilidade** para criação direta ou a partir de solicitações
5. **Rastreabilidade completa** de todos os abastecimentos realizados

Cada abastecimento criado automaticamente:
- Atualiza a cota do órgão (quantidade utilizada e valor utilizado)
- Atualiza o processo da prefeitura (valor utilizado e valor disponível)
- Mantém histórico completo e auditável de todas as operações


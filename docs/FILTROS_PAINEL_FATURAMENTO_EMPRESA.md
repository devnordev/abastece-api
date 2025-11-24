# Filtros Disponíveis - Painel de Faturamento Admin Empresa

## Endpoint
```
GET /relatorios/painel-faturamento/admin-empresa
```

## Todos os Filtros Disponíveis

Todos os filtros são **opcionais** e podem ser **combinados** entre si.

### 1. **dataInicio** (string, ISO 8601)
- **Descrição**: Data inicial do período de análise
- **Tipo**: String (formato ISO 8601)
- **Exemplo**: `2024-01-01T00:00:00.000Z`
- **Padrão**: Se não informado, usa 7 dias atrás a partir de hoje
- **Uso**: Define o início do período para análise de faturamento

**Exemplo de uso:**
```
?dataInicio=2024-01-01T00:00:00.000Z
```

---

### 2. **dataFim** (string, ISO 8601)
- **Descrição**: Data final do período de análise
- **Tipo**: String (formato ISO 8601)
- **Exemplo**: `2024-01-31T23:59:59.999Z`
- **Padrão**: Se não informado, usa hoje (23:59:59)
- **Uso**: Define o fim do período para análise de faturamento

**Exemplo de uso:**
```
?dataFim=2024-01-31T23:59:59.999Z
```

**Nota**: Se `dataInicio` e `dataFim` não forem informados, o sistema usa automaticamente os **últimos 7 dias**.

---

### 3. **prefeituraId** (number)
- **Descrição**: Filtrar abastecimentos por prefeitura específica
- **Tipo**: Número inteiro
- **Exemplo**: `1`
- **Uso**: Permite visualizar faturamento apenas de uma prefeitura específica
- **Relacionamento**: Filtra pelos veículos que pertencem à prefeitura informada

**Exemplo de uso:**
```
?prefeituraId=1
```

---

### 4. **orgaoId** (number)
- **Descrição**: Filtrar abastecimentos por órgão específico
- **Tipo**: Número inteiro
- **Exemplo**: `2`
- **Uso**: Permite visualizar faturamento apenas de um órgão específico
- **Relacionamento**: Filtra pelos veículos que pertencem ao órgão informado

**Exemplo de uso:**
```
?orgaoId=2
```

**Nota**: O `orgaoId` deve pertencer à prefeitura filtrada (se `prefeituraId` também for informado).

---

### 5. **combustivelId** (number)
- **Descrição**: Filtrar abastecimentos por tipo de combustível específico
- **Tipo**: Número inteiro
- **Exemplo**: `3`
- **Uso**: Permite visualizar faturamento apenas de um combustível específico
- **Relacionamento**: Filtra diretamente pelo ID do combustível na tabela de abastecimentos

**Exemplo de uso:**
```
?combustivelId=3
```

---

### 6. **veiculoId** (number)
- **Descrição**: Filtrar abastecimentos por veículo específico
- **Tipo**: Número inteiro
- **Exemplo**: `5`
- **Uso**: Permite visualizar faturamento apenas de um veículo específico
- **Relacionamento**: Filtra diretamente pelo ID do veículo na tabela de abastecimentos

**Exemplo de uso:**
```
?veiculoId=5
```

---

### 7. **empresaId** (number)
- **Descrição**: Filtrar por empresa específica
- **Tipo**: Número inteiro
- **Exemplo**: `10`
- **Uso**: Normalmente não necessário para admin empresa (já filtra automaticamente pela empresa do usuário logado)
- **Nota**: Para admin empresa, o `empresaId` é automaticamente definido pela empresa do usuário logado

**Exemplo de uso:**
```
?empresaId=10
```

---

### 8. **meses** (number)
- **Descrição**: Número de meses para análise (usado em outros relatórios)
- **Tipo**: Número inteiro
- **Exemplo**: `12`
- **Padrão**: `12`
- **Uso**: Este filtro não é utilizado no painel de faturamento, mas está disponível no DTO para outros relatórios

---

## Exemplos de Combinação de Filtros

### Exemplo 1: Período específico + Prefeitura
```
GET /relatorios/painel-faturamento/admin-empresa?dataInicio=2024-01-01T00:00:00.000Z&dataFim=2024-01-31T23:59:59.999Z&prefeituraId=1
```
**Resultado**: Faturamento da prefeitura ID 1 no mês de janeiro de 2024

---

### Exemplo 2: Prefeitura + Órgão + Combustível
```
GET /relatorios/painel-faturamento/admin-empresa?prefeituraId=1&orgaoId=2&combustivelId=3
```
**Resultado**: Faturamento da prefeitura ID 1, órgão ID 2, apenas com combustível ID 3 (últimos 7 dias)

---

### Exemplo 3: Período + Prefeitura + Órgão
```
GET /relatorios/painel-faturamento/admin-empresa?dataInicio=2024-01-15T00:00:00.000Z&dataFim=2024-01-21T23:59:59.999Z&prefeituraId=1&orgaoId=2
```
**Resultado**: Faturamento da prefeitura ID 1, órgão ID 2, no período de 15 a 21 de janeiro de 2024

---

### Exemplo 4: Apenas período customizado
```
GET /relatorios/painel-faturamento/admin-empresa?dataInicio=2024-01-01T00:00:00.000Z&dataFim=2024-01-31T23:59:59.999Z
```
**Resultado**: Faturamento de todas as prefeituras no mês de janeiro de 2024

---

### Exemplo 5: Sem filtros (padrão)
```
GET /relatorios/painel-faturamento/admin-empresa
```
**Resultado**: Faturamento de todas as prefeituras nos últimos 7 dias

---

## Ordem de Aplicação dos Filtros

Os filtros são aplicados na seguinte ordem:

1. **Período** (`dataInicio` e `dataFim`) - Define o intervalo de datas
2. **Empresa** - Automaticamente filtrado pela empresa do usuário logado
3. **Prefeitura** (`prefeituraId`) - Filtra veículos por prefeitura
4. **Órgão** (`orgaoId`) - Filtra veículos por órgão (dentro da prefeitura)
5. **Combustível** (`combustivelId`) - Filtra abastecimentos por combustível
6. **Veículo** (`veiculoId`) - Filtra abastecimentos por veículo específico

---

## Validações

- Todos os IDs devem ser números inteiros positivos
- As datas devem estar no formato ISO 8601 válido
- `dataFim` deve ser posterior a `dataInicio`
- `orgaoId` deve pertencer à `prefeituraId` (se ambos forem informados)
- `veiculoId` deve pertencer à `prefeituraId` e `orgaoId` (se informados)

---

## Observações Importantes

1. **Filtro automático de empresa**: O sistema automaticamente filtra pela empresa do usuário logado, mesmo que `empresaId` não seja informado.

2. **Período padrão**: Se não informar `dataInicio` e `dataFim`, o sistema usa os últimos 7 dias.

3. **Filtros combinados**: Todos os filtros podem ser combinados. O sistema aplica a interseção de todos os filtros informados.

4. **Performance**: Quanto mais filtros aplicados, mais específica será a busca e mais rápida a resposta.

5. **Dados vazios**: Se não houver abastecimentos que atendam aos filtros, o sistema retornará arrays vazios e valores zerados, mas a estrutura JSON será mantida.


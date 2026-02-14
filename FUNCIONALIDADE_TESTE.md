# 🧪 Funcionalidade de Teste - Prefeituras e Empresas

## 📋 Resumo

Implementada funcionalidade para isolar prefeituras e empresas de teste. Agora:
- **Prefeituras teste** só veem **empresas teste**
- **Empresas teste** só veem **prefeituras teste**
- **Prefeituras não-teste** não veem **empresas teste**
- **Empresas não-teste** não veem **prefeituras teste**

## ✅ Alterações Realizadas

### 1. Schema Prisma (`prisma/schema.prisma`)

Adicionada coluna `isTeste` (mapeada como `is_teste` no banco) em:
- `Prefeitura` model
- `Empresa` model

```prisma
isTeste  Boolean  @default(false) @map("is_teste")
```

### 2. Migration

Criada migration `20260213000000_add_is_teste`:
- Adiciona coluna `is_teste` na tabela `prefeitura`
- Adiciona coluna `is_teste` na tabela `empresa`
- Valor padrão: `false`

### 3. DTOs Atualizados

#### Prefeitura
- `CreatePrefeituraDto`: Adicionado campo `isTeste?` (opcional)
- `UpdatePrefeituraDto`: Herda de `CreatePrefeituraDto` (já inclui `isTeste`)
- `FindPrefeituraDto`: Adicionado campo `isTeste?` para filtro

#### Empresa
- `CreateEmpresaDto`: Adicionado campo `isTeste?` (opcional)
- `UpdateEmpresaDto`: Herda de `CreateEmpresaDto` (já inclui `isTeste`)
- `FindEmpresaDto`: Adicionado campo `isTeste?` para filtro

### 4. Services Atualizados

#### `PrefeituraService.findAll()`
- Agora recebe `currentUser` como parâmetro opcional
- Se usuário é de uma **empresa**:
  - Busca se a empresa é teste
  - Aplica filtro: empresa teste só vê prefeituras teste
  - Empresa não-teste não vê prefeituras teste
- Se `isTeste` for explicitamente passado na query, usa esse valor

#### `EmpresaService.findAll()`
- Agora recebe `currentUser` como parâmetro opcional
- Se usuário é de uma **prefeitura**:
  - Busca se a prefeitura é teste
  - Aplica filtro: prefeitura teste só vê empresas teste
  - Prefeitura não-teste não vê empresas teste
- Se `isTeste` for explicitamente passado na query, usa esse valor

### 5. Controllers Atualizados

#### `PrefeituraController.findAll()`
- Adicionado parâmetro `@Request() req`
- Passa `req.user` para o service
- Adicionado `@ApiQuery` para `isTeste`

#### `EmpresaController.findAll()`
- Adicionado parâmetro `@Request() req`
- Passa `req.user` para o service
- Adicionado `@ApiQuery` para `isTeste`

## 🔧 Como Usar

### Criar Prefeitura/Empresa de Teste

Ao criar uma prefeitura ou empresa, inclua `isTeste: true`:

```typescript
// POST /prefeituras
{
  "nome": "Prefeitura Teste",
  "cnpj": "12345678000195",
  "email_administrativo": "teste@prefeitura.gov.br",
  "isTeste": true
}

// POST /empresas
{
  "nome": "Posto Teste",
  "cnpj": "98765432000111",
  "uf": "SP",
  "isTeste": true
}
```

### Atualizar para Teste

```typescript
// PATCH /prefeituras/:id
{
  "isTeste": true
}

// PATCH /empresas/:id
{
  "isTeste": true
}
```

### Filtrar Explicitamente

Você pode filtrar explicitamente por teste na query:

```typescript
// GET /prefeituras?isTeste=true
// GET /empresas?isTeste=false
```

## 🎯 Comportamento

### Cenário 1: Prefeitura Teste
- Usuário logado é de uma **prefeitura teste**
- Ao listar empresas (`GET /empresas`):
  - ✅ Vê apenas empresas com `isTeste = true`
  - ❌ Não vê empresas com `isTeste = false`

### Cenário 2: Prefeitura Não-Teste
- Usuário logado é de uma **prefeitura não-teste**
- Ao listar empresas (`GET /empresas`):
  - ✅ Vê apenas empresas com `isTeste = false`
  - ❌ Não vê empresas com `isTeste = true`

### Cenário 3: Empresa Teste
- Usuário logado é de uma **empresa teste**
- Ao listar prefeituras (`GET /prefeituras`):
  - ✅ Vê apenas prefeituras com `isTeste = true`
  - ❌ Não vê prefeituras com `isTeste = false`

### Cenário 4: Empresa Não-Teste
- Usuário logado é de uma **empresa não-teste**
- Ao listar prefeituras (`GET /prefeituras`):
  - ✅ Vê apenas prefeituras com `isTeste = false`
  - ❌ Não vê prefeituras com `isTeste = true`

## 📝 Notas Importantes

1. **Valor Padrão**: Por padrão, `isTeste = false` para todas as prefeituras e empresas existentes e novas.

2. **Filtro Automático**: O filtro é aplicado automaticamente baseado no usuário logado. Não é necessário passar `isTeste` na query (mas pode ser passado para sobrescrever).

3. **Isolamento**: Prefeituras e empresas de teste ficam completamente isoladas das não-teste.

4. **Dados Existentes**: Prefeituras e empresas existentes terão `isTeste = false` por padrão após a migration.

## 🚀 Próximos Passos

1. **Executar Migration**:
   ```bash
   cd abastece-api
   npm run prisma:migrate:deploy
   ```

2. **Gerar Prisma Client**:
   ```bash
   npm run prisma:generate
   ```

3. **Testar**:
   - Criar uma prefeitura teste
   - Criar uma empresa teste
   - Verificar que prefeitura teste só vê empresa teste
   - Verificar que empresa teste só vê prefeitura teste

## 📚 Arquivos Modificados

- `prisma/schema.prisma`
- `prisma/migrations/20260213000000_add_is_teste/migration.sql`
- `src/modules/prefeitura/dto/create-prefeitura.dto.ts`
- `src/modules/prefeitura/dto/find-prefeitura.dto.ts`
- `src/modules/prefeitura/prefeitura.service.ts`
- `src/modules/prefeitura/prefeitura.controller.ts`
- `src/modules/empresa/dto/create-empresa.dto.ts`
- `src/modules/empresa/dto/find-empresa.dto.ts`
- `src/modules/empresa/empresa.service.ts`
- `src/modules/empresa/empresa.controller.ts`


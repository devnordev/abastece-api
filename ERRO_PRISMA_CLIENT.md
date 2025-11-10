# Erro: Prisma Client não gerado

## 📋 Descrição do Erro

Após instalar as dependências do projeto, você está enfrentando diversos erros TypeScript relacionados ao Prisma Client, como:

```
error TS2305: Module '"@prisma/client"' has no exported member 'TipoVeiculo'.
error TS2305: Module '"@prisma/client"' has no exported member 'SituacaoVeiculo'.
error TS2305: Module '"@prisma/client"' has no exported member 'TipoAbastecimentoVeiculo'.
error TS2305: Module '"@prisma/client"' has no exported member 'Periodicidade'.
error TS2339: Property 'Decimal' does not exist on type 'typeof Prisma'.
error TS2694: Namespace 'Prisma' has no exported member 'Decimal'.
```

E muitos outros erros similares relacionados a enums e tipos que estão definidos no `schema.prisma`, mas não estão disponíveis no `@prisma/client`.

## 🔍 Por que isso acontece?

### Causa Principal

O **Prisma Client não é gerado automaticamente** quando você instala as dependências com `npm install` ou `npm ci`. 

O Prisma Client é um cliente TypeScript gerado automaticamente baseado no seu arquivo `schema.prisma`. Ele contém:

- Tipos TypeScript para todos os seus modelos
- Enums definidos no schema (como `TipoVeiculo`, `StatusAcesso`, `UF`, etc.)
- Tipos utilitários (como `Prisma.Decimal`, `Prisma.UserWhereInput`, etc.)
- Métodos de query type-safe

**Sem gerar o Prisma Client, o TypeScript não consegue encontrar esses tipos**, resultando em erros de compilação.

### Quando isso acontece?

1. **Após clonar o repositório pela primeira vez** - Quando você faz `git clone` e `npm install`, o Prisma Client ainda não foi gerado
2. **Após instalar dependências em um novo ambiente** - Em uma nova máquina ou após limpar `node_modules`
3. **Após alterar o `schema.prisma`** - Sempre que você modifica o schema, precisa regenerar o cliente
4. **Após atualizar a versão do Prisma** - Versões diferentes do Prisma podem ter diferenças no cliente gerado

## ✅ Como Resolver

### Solução Rápida

Execute o comando para gerar o Prisma Client:

```bash
npx prisma generate
```

Ou usando o script do `package.json`:

```bash
npm run prisma:generate
```

### Processo Completo (Recomendado)

Siga estes passos na ordem:

1. **Instalar as dependências** (se ainda não fez):
   ```bash
   npm install
   ```

2. **Gerar o Prisma Client**:
   ```bash
   npx prisma generate
   ```

3. **Sincronizar o banco de dados** (se necessário):
   ```bash
   # Para desenvolvimento - cria/atualiza o banco baseado no schema
   npx prisma db push
   
   # OU para usar migrations (recomendado em produção)
   npx prisma migrate dev
   ```

4. **Executar seeds** (opcional, para popular o banco com dados iniciais):
   ```bash
   npm run prisma:seed
   ```

### Comandos Disponíveis no Projeto

O projeto já possui scripts configurados no `package.json`:

- `npm run prisma:generate` - Gera o Prisma Client
- `npm run prisma:migrate` - Executa migrations do banco de dados
- `npm run prisma:studio` - Abre o Prisma Studio (interface gráfica)
- `npm run prisma:seed` - Executa os seeds do banco de dados

## 🔄 Fluxo de Trabalho Recomendado

### Primeira vez no projeto:

```bash
# 1. Clone o repositório
git clone <repo-url>
cd abastece-api

# 2. Instale as dependências
npm install

# 3. Configure as variáveis de ambiente
# Copie o arquivo .env.example para .env e configure as variáveis

# 4. Gere o Prisma Client
npm run prisma:generate

# 5. Sincronize o banco de dados
npx prisma db push
# OU
npx prisma migrate dev

# 6. Execute os seeds (opcional)
npm run prisma:seed

# 7. Inicie a aplicação
npm run start:dev
```

### Quando alterar o schema.prisma:

```bash
# 1. Edite o arquivo prisma/schema.prisma

# 2. Gere o Prisma Client novamente
npm run prisma:generate

# 3. Sincronize o banco de dados
npx prisma db push
# OU crie uma migration
npx prisma migrate dev --name nome_da_migration
```

### Após clonar em um novo ambiente:

```bash
# 1. Instale as dependências
npm install

# 2. Gere o Prisma Client (IMPORTANTE!)
npm run prisma:generate

# 3. Configure o banco de dados
npx prisma migrate dev
```

## 🎯 Comando Único (Solução Rápida)

Se você já instalou as dependências e só precisa gerar o Prisma Client:

```bash
npx prisma generate
```

Esse comando:
- ✅ Lê o arquivo `prisma/schema.prisma`
- ✅ Gera o Prisma Client em `node_modules/.prisma/client`
- ✅ Cria os tipos TypeScript necessários
- ✅ Torna todos os enums e tipos disponíveis para importação

**Tempo estimado**: 5-30 segundos (dependendo do tamanho do schema)

## 🐛 Verificação

Após executar `npx prisma generate`, verifique se:

1. **Não há mais erros TypeScript** relacionados ao Prisma
2. **O diretório foi criado**: `node_modules/.prisma/client`
3. **Os tipos estão disponíveis**: Você pode importar enums como `TipoVeiculo`, `StatusAcesso`, etc. do `@prisma/client`

## 📝 Notas Importantes

### Por que o Prisma Client não é gerado automaticamente?

1. **Performance**: Gerar o cliente pode demorar alguns segundos. Não queremos fazer isso em todo `npm install`
2. **Controle**: O desenvolvedor deve ter controle sobre quando gerar o cliente (especialmente após mudanças no schema)
3. **CI/CD**: Em pipelines de CI/CD, você pode querer gerar o cliente em um passo separado

### Boas Práticas

1. **Sempre gere o Prisma Client após instalar dependências** em um novo ambiente
2. **Regenere após alterar o schema.prisma** antes de compilar
3. **Adicione `prisma generate` ao seu script de build** (já está no Dockerfile do projeto)
4. **Considere usar postinstall script** no `package.json` para gerar automaticamente (opcional)

### Adicionando geração automática (Opcional)

Se quiser que o Prisma Client seja gerado automaticamente após `npm install`, adicione ao `package.json`:

```json
{
  "scripts": {
    "postinstall": "prisma generate"
  }
}
```

⚠️ **Atenção**: Isso pode aumentar o tempo de `npm install`, mas garante que o cliente sempre esteja sincronizado.

## 🔗 Referências

- [Documentação oficial do Prisma - Generate](https://www.prisma.io/docs/concepts/components/prisma-client/working-with-prismaclient/generating-prisma-client)
- [Documentação oficial do Prisma - Getting Started](https://www.prisma.io/docs/getting-started)

## ✅ Resumo

**Problema**: Prisma Client não foi gerado após instalar dependências.

**Solução**: Execute `npx prisma generate` ou `npm run prisma:generate`.

**Comando completo para primeira vez**:
```bash
npm install
npx prisma generate
npx prisma db push  # ou npx prisma migrate dev
npm run start:dev
```

**Comando rápido (apenas gerar cliente)**:
```bash
npx prisma generate
```

---

*Documento criado para resolver erros de Prisma Client não gerado*


# 📋 Tutorial: Sistema de Logs de Alterações

Este tutorial explica como usar o sistema de logs da aplicação para rastrear, auditar e reverter alterações feitas no banco de dados.

## 📖 Índice

1. [Visão Geral](#visão-geral)
2. [Pré-requisitos](#pré-requisitos)
3. [Estrutura dos Logs](#estrutura-dos-logs)
4. [Endpoints Disponíveis](#endpoints-disponíveis)
5. [Exemplos de Uso](#exemplos-de-uso)
6. [Casos de Uso](#casos-de-uso)
7. [Como Reverter uma Alteração](#como-reverter-uma-alteração)

---

## 🎯 Visão Geral

O sistema de logs registra todas as operações de **INSERT**, **UPDATE** e **DELETE** realizadas no banco de dados, armazenando:

- **Tabela** afetada
- **Registro** modificado (ID)
- **Ação** realizada (INSERT/UPDATE/DELETE)
- **Campo** alterado (apenas para UPDATE)
- **Valor antes** da alteração
- **Valor depois** da alteração
- **Usuário** que executou
- **Data e hora** da operação
- **IP** do usuário
- **Contexto** adicional (opcional)

---

## 🔐 Pré-requisitos

### 1. Autenticação
Você precisa estar autenticado como **SUPER_ADMIN** para acessar os logs:

```bash
# Fazer login primeiro
POST /auth/login
{
  "email": "seu-email@exemplo.com",
  "senha": "sua-senha"
}
```

### 2. Token de Acesso
Use o token JWT retornado no header de todas as requisições:

```bash
Authorization: Bearer seu-jwt-token-aqui
```

---

## 📊 Estrutura dos Logs

Cada log contém as seguintes informações:

```typescript
{
  id: number;                    // ID único do log
  tabela: string;                // Nome da tabela (ex: "veiculo", "usuario")
  registro_id: number;          // ID do registro alterado
  acao: "INSERT" | "UPDATE" | "DELETE";
  campo_alterado?: string;      // Campo modificado (só para UPDATE)
  valor_antes?: string;         // Valor anterior
  valor_depois?: string;        // Valor novo
  executado_por?: number;       // ID do usuário
  executado_em: Date;           // Data/hora da operação
  contexto?: string;            // Contexto adicional
  ip_address?: string;          // IP do usuário
  user_agent?: string;          // Navegador/dispositivo
  usuario?: {                   // Dados do usuário (se houver)
    id: number;
    nome: string;
    email: string;
  }
}
```

---

## 🔌 Endpoints Disponíveis

### 1. **Listar Todos os Logs**
```http
GET /logs
```

**Query Parameters:**
- `page` (opcional): Página (padrão: 1)
- `limit` (opcional): Itens por página (padrão: 10)
- `tabela` (opcional): Filtrar por tabela
- `acao` (opcional): Filtrar por ação (`INSERT`, `UPDATE`, `DELETE`)
- `executadoPor` (opcional): Filtrar por ID do usuário
- `dataInicial` (opcional): Data inicial (formato ISO: `2024-01-01T00:00:00Z`)
- `dataFinal` (opcional): Data final (formato ISO: `2024-12-31T23:59:59Z`)

**Resposta:**
```json
{
  "message": "Logs encontrados com sucesso",
  "logs": [
    {
      "id": 1,
      "tabela": "veiculo",
      "registro_id": 5,
      "acao": "UPDATE",
      "campo_alterado": "nome",
      "valor_antes": "Ambulância 01",
      "valor_depois": "Ambulância 02",
      "executado_por": 3,
      "executado_em": "2024-11-01T10:30:00.000Z",
      "usuario": {
        "id": 3,
        "nome": "João Silva",
        "email": "joao@prefeitura.com"
      }
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 150,
    "totalPages": 15
  }
}
```

---

### 2. **Buscar Log Específico**
```http
GET /logs/:id
```

**Exemplo:**
```bash
GET /logs/42
```

**Resposta:**
```json
{
  "message": "Log encontrado com sucesso",
  "log": {
    "id": 42,
    "tabela": "usuario",
    "registro_id": 10,
    "acao": "DELETE",
    "valor_antes": "{\"nome\":\"Maria\",\"email\":\"maria@exemplo.com\"}",
    "executado_por": 1,
    "executado_em": "2024-11-01T14:20:00.000Z"
  }
}
```

---

### 3. **Listar Logs de um Registro Específico**
```http
GET /logs/tabela/:tabela/registro/:id
```

**Query Parameters:**
- `page` (opcional): Página
- `limit` (opcional): Itens por página

**Exemplo:**
```bash
GET /logs/tabela/veiculo/registro/5?page=1&limit=20
```

**Resposta:**
```json
{
  "message": "Logs encontrados com sucesso",
  "logs": [
    {
      "id": 10,
      "acao": "UPDATE",
      "campo_alterado": "placa",
      "valor_antes": "ABC-1234",
      "valor_depois": "ABC-5678",
      "executado_em": "2024-11-01T10:30:00.000Z"
    },
    {
      "id": 5,
      "acao": "INSERT",
      "executado_em": "2024-10-15T08:00:00.000Z"
    }
  ],
  "pagination": { ... }
}
```

---

### 4. **Obter Estatísticas**
```http
GET /logs/estatisticas
```

**Resposta:**
```json
{
  "message": "Estatísticas de logs encontradas",
  "estatisticas": {
    "total": 1250,
    "porAcao": [
      {
        "acao": "UPDATE",
        "quantidade": 800
      },
      {
        "acao": "INSERT",
        "quantidade": 350
      },
      {
        "acao": "DELETE",
        "quantidade": 100
      }
    ],
    "topTabelas": [
      {
        "tabela": "abastecimento",
        "quantidade": 450
      },
      {
        "tabela": "veiculo",
        "quantidade": 200
      },
      {
        "tabela": "usuario",
        "quantidade": 180
      }
    ]
  }
}
```

---

### 5. **Listar Tabelas com Logs**
```http
GET /logs/tabelas
```

**Resposta:**
```json
{
  "message": "Tabelas disponíveis encontradas",
  "tabelas": [
    "abastecimento",
    "categoria",
    "empresa",
    "motorista",
    "orgao",
    "prefeitura",
    "usuario",
    "veiculo"
  ]
}
```

---

## 💡 Exemplos de Uso

### Exemplo 1: Ver Todas as Alterações de Hoje
```bash
GET /logs?dataInicial=2024-11-01T00:00:00Z&page=1&limit=50
```

### Exemplo 2: Ver Todas as Exclusões
```bash
GET /logs?acao=DELETE&page=1&limit=20
```

### Exemplo 3: Ver Alterações de um Usuário Específico
```bash
GET /logs?executadoPor=3&page=1&limit=30
```

### Exemplo 4: Ver Alterações em uma Tabela Específica
```bash
GET /logs?tabela=veiculo&page=1&limit=50
```

### Exemplo 5: Ver Histórico Completo de um Veículo
```bash
GET /logs/tabela/veiculo/registro/5?page=1&limit=100
```

### Exemplo 6: Ver Alterações em um Período
```bash
GET /logs?dataInicial=2024-10-01T00:00:00Z&dataFinal=2024-10-31T23:59:59Z
```

### Exemplo 7: Filtrar por Múltiplos Critérios
```bash
GET /logs?tabela=usuario&acao=UPDATE&executadoPor=1&page=1&limit=20
```

---

## 🎯 Casos de Uso

### Caso 1: "Quem alterou o nome deste veículo?"
```bash
# 1. Ver histórico completo do veículo
GET /logs/tabela/veiculo/registro/5

# 2. Procurar pelo campo "nome"
# No resultado, você verá quem alterou e quando
```

### Caso 2: "Alguém deletou um registro por engano"
```bash
# 1. Ver todas as exclusões recentes
GET /logs?acao=DELETE&page=1&limit=50

# 2. Encontrar o log do registro deletado
# 3. Anotar o valor_antes para recuperar os dados
```

### Caso 3: "Verificar atividade suspeita de um usuário"
```bash
# 1. Ver todas as ações de um usuário
GET /logs?executadoPor=10&page=1&limit=100

# 2. Verificar padrões anormais de atividade
```

### Caso 4: "Auditoria de alterações em uma prefeitura"
```bash
# 1. Ver estatísticas gerais
GET /logs/estatisticas

# 2. Ver principais tabelas alteradas
GET /logs?tabela=prefeitura&page=1&limit=50
```

### Caso 5: "Relatório mensal de alterações"
```bash
# Ver todas as alterações do mês
GET /logs?dataInicial=2024-11-01T00:00:00Z&dataFinal=2024-11-30T23:59:59Z&page=1&limit=1000
```

---

## 🔄 Como Reverter uma Alteração

### Passo 1: Identificar o Log
```bash
# Ver histórico completo do registro
GET /logs/tabela/veiculo/registro/5
```

### Passo 2: Analisar o Log
Localize o log do erro e observe:
- Qual campo foi alterado
- Valor antes (correto)
- Valor depois (incorreto)
- Quem fez a alteração
- Quando aconteceu

### Passo 3: Fazer a Correção Manual
**⚠️ IMPORTANTE:** A API não possui uma rota de "reverter" automática. Você deve:

1. **Para UPDATE:**
   ```bash
   # Usar o endpoint de atualização da tabela correspondente
   PATCH /veiculos/5
   {
     "nome": "Ambulância 01"  // Valor correto do campo
   }
   ```

2. **Para DELETE:**
   ```bash
   # Recriar o registro com os dados de valor_antes
   POST /veiculos
   {
     // Dados salvos em valor_antes do log
   }
   ```

### Exemplo Prático: Reverter Alteração de Placa

**Situação:** Um veículo teve a placa alterada incorretamente de `ABC-1234` para `XYZ-9999`.

**Solução:**
```bash
# 1. Ver logs do veículo
GET /logs/tabela/veiculo/registro/5

# 2. Encontrar o log que mostra:
# {
#   "campo_alterado": "placa",
#   "valor_antes": "ABC-1234",
#   "valor_depois": "XYZ-9999"
# }

# 3. Corrigir manualmente
PATCH /veiculos/5
{
  "placa": "ABC-1234"  // Valor correto
}
```

---

## 📝 Notas Importantes

### ⚠️ Limitações Atuais

1. **Não há gravação automática de logs**: A tabela `LogsAlteracoes` existe, mas ainda **não está sendo populada automaticamente**. Os services precisam ser atualizados para registrar logs nas operações de INSERT/UPDATE/DELETE.

2. **Sem função de reversão automática**: Não existe endpoint para reverter uma alteração automaticamente. É necessário fazer a correção manual usando os endpoints regulares da API.

3. **Permissões**: Apenas usuários com perfil **SUPER_ADMIN** podem visualizar os logs.

### 🔮 Melhorias Futuras Sugeridas

- [ ] Implementar gravação automática de logs em todos os services
- [ ] Criar endpoint de reversão automática de alterações
- [ ] Adicionar exportação de logs em CSV/PDF
- [ ] Implementar alertas por email para alterações críticas
- [ ] Adicionar filtros avançados (busca por texto, exportação)
- [ ] Criar dashboard visual de logs

---

## 🛠️ Como Implementar Gravação de Logs

Para começar a gravar logs automaticamente, você precisaria adicionar código similar em cada service:

```typescript
// Exemplo no veiculo.service.ts
async update(id: number, updateVeiculoDto: UpdateVeiculoDto, currentUserId?: number) {
  const existingVeiculo = await this.prisma.veiculo.findUnique({
    where: { id },
  });

  if (!existingVeiculo) {
    throw new NotFoundException('Veículo não encontrado');
  }

  // Gravar logs antes da alteração
  for (const campo in updateVeiculoDto) {
    if (updateVeiculoDto[campo] !== existingVeiculo[campo]) {
      await this.prisma.logsAlteracoes.create({
        data: {
          tabela: 'veiculo',
          registro_id: id,
          acao: 'UPDATE',
          campo_alterado: campo,
          valor_antes: String(existingVeiculo[campo]),
          valor_depois: String(updateVeiculoDto[campo]),
          executado_por: currentUserId,
          executado_em: new Date(),
          contexto: 'Atualização via API',
        },
      });
    }
  }

  // Fazer a atualização
  const veiculo = await this.prisma.veiculo.update({
    where: { id },
    data: updateVeiculoDto,
  });

  return { message: 'Veículo atualizado com sucesso', veiculo };
}
```

---

## 📚 Documentação Adicional

- **Swagger UI**: http://localhost:3000/api/docs
- **Seção Logs**: Encontre todos os endpoints de logs documentados na interface Swagger

---

## 🆘 Suporte

Em caso de dúvidas ou problemas:
1. Verifique se você está autenticado como SUPER_ADMIN
2. Verifique se o token JWT está válido
3. Consulte a documentação Swagger em `/api/docs`
4. Verifique os logs do servidor para erros

---

**🎉 Pronto!** Agora você sabe como usar o sistema de logs da aplicação para auditar e rastrear todas as alterações no banco de dados.

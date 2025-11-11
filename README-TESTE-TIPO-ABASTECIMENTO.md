# Guia de Testes - Rota GET /solicitacoes/veiculo/{id}/tipo-abastecimento

## 📋 Índice
- [Descrição da Rota](#descrição-da-rota)
- [Pré-requisitos](#pré-requisitos)
- [Autenticação](#autenticação)
- [Cenários de Teste](#cenários-de-teste)
- [Exemplos de Requisições](#exemplos-de-requisições)
- [Exemplos de Respostas](#exemplos-de-respostas)
- [Preparação dos Dados de Teste](#preparação-dos-dados-de-teste)
- [Validação dos Resultados](#validação-dos-resultados)

## 📝 Descrição da Rota

**Endpoint:** `GET /solicitacoes/veiculo/{id}/tipo-abastecimento`

**Descrição:** Retorna informações sobre o tipo de abastecimento de um veículo, incluindo análise de consumo por período (quando aplicável).

**Permissões:** Apenas usuários com perfil `ADMIN_PREFEITURA` podem acessar esta rota.

**Parâmetros:**
- `id` (path parameter): ID do veículo a ser consultado

## 🔐 Pré-requisitos

1. **Banco de dados configurado** com dados de teste
2. **Usuário autenticado** com perfil `ADMIN_PREFEITURA`
3. **Token JWT válido** para autenticação
4. **Veículos cadastrados** com diferentes configurações:
   - Tipo de abastecimento: `COTA`, `LIVRE`, `COM_AUTORIZACAO`
   - Periodicidade: `Diario`, `Semanal`, `Mensal` (quando tipo for COTA ou COM_AUTORIZACAO)
   - Quantidade definida (quando tipo for COTA ou COM_AUTORIZACAO)

## 🔑 Autenticação

A rota requer autenticação via Bearer Token. Inclua o token no header da requisição:

```
Authorization: Bearer {seu_token_jwt}
```

## 🧪 Cenários de Teste

### Cenário 1: Veículo com Tipo COTA e Periodicidade Diária

**Objetivo:** Verificar se a rota retorna corretamente a análise de consumo diário para veículos com cota.

**Configuração do Veículo:**
- `tipo_abastecimento`: `COTA`
- `periodicidade`: `Diario`
- `quantidade`: `100.0` (litros por dia)

**Dados de Teste Necessários:**
- Veículo cadastrado com as configurações acima
- Abastecimentos registrados no mesmo dia (data atual)
- Abastecimentos registrados em dias anteriores (para verificar filtro)

**Passos:**
1. Criar um veículo com tipo COTA, periodicidade Diário e quantidade 100L
2. Criar abastecimentos para este veículo na data atual (ex: 30L, 50L)
3. Fazer requisição GET para a rota
4. Validar que:
   - Retorna `periodicidade: "Diario"`
   - Retorna `quantidade: 100.0`
   - Retorna `total_utilizado` somando apenas abastecimentos do dia atual
   - Retorna `dentro_do_limite: true` se total < 100L
   - Retorna `ultrapassou_limite: true` se total > 100L

### Cenário 2: Veículo com Tipo COTA e Periodicidade Semanal

**Objetivo:** Verificar se a rota retorna corretamente a análise de consumo semanal.

**Configuração do Veículo:**
- `tipo_abastecimento`: `COTA`
- `periodicidade`: `Semanal`
- `quantidade`: `500.0` (litros por semana)

**Dados de Teste Necessários:**
- Veículo cadastrado com as configurações acima
- Abastecimentos registrados na semana atual (segunda a domingo)
- Abastecimentos registrados em semanas anteriores

**Passos:**
1. Criar um veículo com tipo COTA, periodicidade Semanal e quantidade 500L
2. Criar abastecimentos para este veículo na semana atual
3. Fazer requisição GET para a rota
4. Validar que:
   - Retorna `periodicidade: "Semanal"`
   - Retorna `quantidade: 500.0`
   - Retorna `total_utilizado` somando abastecimentos da semana (segunda a domingo)
   - Retorna período correto (início: segunda-feira, fim: domingo)

### Cenário 3: Veículo com Tipo COTA e Periodicidade Mensal

**Objetivo:** Verificar se a rota retorna corretamente a análise de consumo mensal.

**Configuração do Veículo:**
- `tipo_abastecimento`: `COTA`
- `periodicidade`: `Mensal`
- `quantidade`: `2000.0` (litros por mês)

**Dados de Teste Necessários:**
- Veículo cadastrado com as configurações acima
- Abastecimentos registrados no mês atual
- Abastecimentos registrados em meses anteriores

**Passos:**
1. Criar um veículo com tipo COTA, periodicidade Mensal e quantidade 2000L
2. Criar abastecimentos para este veículo no mês atual
3. Fazer requisição GET para a rota
4. Validar que:
   - Retorna `periodicidade: "Mensal"`
   - Retorna `quantidade: 2000.0`
   - Retorna `total_utilizado` somando abastecimentos do mês atual (dia 1 ao último dia do mês)
   - Retorna período correto (início: dia 1, fim: último dia do mês)

### Cenário 4: Veículo com Tipo COM_AUTORIZACAO

**Objetivo:** Verificar se a rota retorna periodicidade e quantidade para veículos COM_AUTORIZACAO.

**Configuração do Veículo:**
- `tipo_abastecimento`: `COM_AUTORIZACAO`
- `periodicidade`: `Diario` (ou Semanal/Mensal)
- `quantidade`: `150.0`

**Passos:**
1. Criar um veículo com tipo COM_AUTORIZACAO
2. Fazer requisição GET para a rota
3. Validar que:
   - Retorna `periodicidade` e `quantidade`
   - Retorna análise de período (se houver abastecimentos)

### Cenário 5: Veículo com Tipo LIVRE

**Objetivo:** Verificar que veículos LIVRE não retornam análise de período.

**Configuração do Veículo:**
- `tipo_abastecimento`: `LIVRE`
- `periodicidade`: `null` (ou não definida)
- `quantidade`: `null` (ou não definida)

**Passos:**
1. Criar um veículo com tipo LIVRE
2. Fazer requisição GET para a rota
3. Validar que:
   - Retorna apenas informações básicas do veículo
   - **NÃO** retorna `periodicidade` e `quantidade`
   - **NÃO** retorna `analise_periodo`

### Cenário 6: Veículo sem Abastecimentos

**Objetivo:** Verificar comportamento quando não há abastecimentos registrados.

**Configuração do Veículo:**
- `tipo_abastecimento`: `COTA`
- `periodicidade`: `Diario`
- `quantidade`: `100.0`
- **Sem abastecimentos registrados**

**Passos:**
1. Criar um veículo com tipo COTA
2. **Não criar nenhum abastecimento**
3. Fazer requisição GET para a rota
4. Validar que:
   - Retorna `total_utilizado: 0`
   - Retorna `dentro_do_limite: true`
   - Retorna `quantidade_disponivel` igual ao limite

### Cenário 7: Veículo Ultrapassando o Limite

**Objetivo:** Verificar comportamento quando o veículo ultrapassou o limite do período.

**Configuração do Veículo:**
- `tipo_abastecimento`: `COTA`
- `periodicidade`: `Diario`
- `quantidade`: `100.0` (limite diário)

**Dados de Teste:**
- Abastecimentos no dia atual totalizando 120L (ultrapassando o limite)

**Passos:**
1. Criar um veículo com tipo COTA, limite 100L/dia
2. Criar abastecimentos no dia atual totalizando 120L
3. Fazer requisição GET para a rota
4. Validar que:
   - Retorna `total_utilizado: 120.0`
   - Retorna `dentro_do_limite: false`
   - Retorna `ultrapassou_limite: true`
   - Retorna `quantidade_disponivel: 0`

### Cenário 8: Veículo dentro do Limite

**Objetivo:** Verificar comportamento quando o veículo está dentro do limite.

**Configuração do Veículo:**
- `tipo_abastecimento`: `COTA`
- `periodicidade`: `Diario`
- `quantidade`: `100.0` (limite diário)

**Dados de Teste:**
- Abastecimentos no dia atual totalizando 70L (dentro do limite)

**Passos:**
1. Criar um veículo com tipo COTA, limite 100L/dia
2. Criar abastecimentos no dia atual totalizando 70L
3. Fazer requisição GET para a rota
4. Validar que:
   - Retorna `total_utilizado: 70.0`
   - Retorna `dentro_do_limite: true`
   - Retorna `ultrapassou_limite: false`
   - Retorna `quantidade_disponivel: 30.0`

## 📡 Exemplos de Requisições

### Requisição Básica

```bash
curl -X GET \
  'http://localhost:3000/solicitacoes/veiculo/1/tipo-abastecimento' \
  -H 'Authorization: Bearer seu_token_jwt_aqui' \
  -H 'Content-Type: application/json'
```

### Usando Postman

1. Método: `GET`
2. URL: `http://localhost:3000/solicitacoes/veiculo/{id}/tipo-abastecimento`
3. Headers:
   - `Authorization: Bearer {token}`
   - `Content-Type: application/json`
4. Substitua `{id}` pelo ID do veículo desejado

### Usando Insomnia

1. Método: `GET`
2. URL: `http://localhost:3000/solicitacoes/veiculo/1/tipo-abastecimento`
3. Headers:
   - `Authorization: Bearer {token}`
4. Substitua `1` pelo ID do veículo desejado

## 📥 Exemplos de Respostas

### Resposta para Veículo COTA com Periodicidade Diária (dentro do limite)

```json
{
  "message": "Tipo de abastecimento recuperado com sucesso",
  "veiculoId": 1,
  "veiculo": {
    "id": 1,
    "nome": "Veículo Teste",
    "placa": "ABC-1234",
    "tipo_abastecimento": "COTA",
    "periodicidade": "Diario",
    "quantidade": 100.0,
    "orgao": {
      "id": 1,
      "nome": "Órgão Teste",
      "sigla": "OT"
    }
  },
  "analise_periodo": {
    "periodicidade": "Diario",
    "limite": 100.0,
    "total_utilizado": 70.0,
    "quantidade_disponivel": 30.0,
    "dentro_do_limite": true,
    "ultrapassou_limite": false,
    "periodo": {
      "inicio": "2025-01-15T00:00:00.000Z",
      "fim": "2025-01-15T23:59:59.999Z"
    },
    "abastecimentos_no_periodo": 2
  }
}
```

### Resposta para Veículo COTA com Periodicidade Semanal (ultrapassando limite)

```json
{
  "message": "Tipo de abastecimento recuperado com sucesso",
  "veiculoId": 2,
  "veiculo": {
    "id": 2,
    "nome": "Veículo Semanal",
    "placa": "DEF-5678",
    "tipo_abastecimento": "COTA",
    "periodicidade": "Semanal",
    "quantidade": 500.0,
    "orgao": {
      "id": 1,
      "nome": "Órgão Teste",
      "sigla": "OT"
    }
  },
  "analise_periodo": {
    "periodicidade": "Semanal",
    "limite": 500.0,
    "total_utilizado": 550.0,
    "quantidade_disponivel": 0,
    "dentro_do_limite": false,
    "ultrapassou_limite": true,
    "periodo": {
      "inicio": "2025-01-13T00:00:00.000Z",
      "fim": "2025-01-19T23:59:59.999Z"
    },
    "abastecimentos_no_periodo": 5
  }
}
```

### Resposta para Veículo LIVRE

```json
{
  "message": "Tipo de abastecimento recuperado com sucesso",
  "veiculoId": 3,
  "veiculo": {
    "id": 3,
    "nome": "Veículo Livre",
    "placa": "GHI-9012",
    "tipo_abastecimento": "LIVRE",
    "orgao": {
      "id": 1,
      "nome": "Órgão Teste",
      "sigla": "OT"
    }
  }
}
```

### Resposta para Veículo sem Abastecimentos

```json
{
  "message": "Tipo de abastecimento recuperado com sucesso",
  "veiculoId": 4,
  "veiculo": {
    "id": 4,
    "nome": "Veículo Novo",
    "placa": "JKL-3456",
    "tipo_abastecimento": "COTA",
    "periodicidade": "Diario",
    "quantidade": 100.0,
    "orgao": {
      "id": 1,
      "nome": "Órgão Teste",
      "sigla": "OT"
    }
  },
  "analise_periodo": {
    "mensagem": "Nenhum abastecimento encontrado para este veículo",
    "periodicidade": "Diario",
    "limite": 100.0,
    "total_utilizado": 0,
    "quantidade_disponivel": 100.0,
    "dentro_do_limite": true,
    "ultrapassou_limite": false
  }
}
```

## 🗄️ Preparação dos Dados de Teste

### 1. Criar Prefeitura (se não existir)

```sql
INSERT INTO prefeitura (nome, cnpj, ativo)
VALUES ('Prefeitura Teste', '12345678000190', true);
```

### 2. Criar Usuário ADMIN_PREFEITURA

```sql
INSERT INTO usuario (email, senha, nome, cpf, tipo_usuario, prefeituraId, statusAcess, ativo)
VALUES ('admin@teste.com', 'senha_hash', 'Admin Teste', '12345678900', 'ADMIN_PREFEITURA', 1, 'Ativado', true);
```

### 3. Criar Órgão

```sql
INSERT INTO orgao (prefeituraId, nome, sigla, ativo)
VALUES (1, 'Órgão Teste', 'OT', true);
```

### 4. Criar Combustível

```sql
INSERT INTO combustivel (nome, sigla, ativo)
VALUES ('Gasolina Comum', 'GAS_COMUM', true);
```

### 5. Criar Veículo COTA Diário

```sql
INSERT INTO veiculo (
  prefeituraId, 
  orgaoId, 
  nome, 
  placa, 
  tipo_abastecimento, 
  periodicidade, 
  quantidade, 
  capacidade_tanque, 
  ativo
)
VALUES (
  1, 
  1, 
  'Veículo COTA Diário', 
  'ABC-1234', 
  'COTA', 
  'Diario', 
  100.0, 
  50.0, 
  true
);
```

### 6. Criar Veículo COTA Semanal

```sql
INSERT INTO veiculo (
  prefeituraId, 
  orgaoId, 
  nome, 
  placa, 
  tipo_abastecimento, 
  periodicidade, 
  quantidade, 
  capacidade_tanque, 
  ativo
)
VALUES (
  1, 
  1, 
  'Veículo COTA Semanal', 
  'DEF-5678', 
  'COTA', 
  'Semanal', 
  500.0, 
  50.0, 
  true
);
```

### 7. Criar Veículo COTA Mensal

```sql
INSERT INTO veiculo (
  prefeituraId, 
  orgaoId, 
  nome, 
  placa, 
  tipo_abastecimento, 
  periodicidade, 
  quantidade, 
  capacidade_tanque, 
  ativo
)
VALUES (
  1, 
  1, 
  'Veículo COTA Mensal', 
  'GHI-9012', 
  'COTA', 
  'Mensal', 
  2000.0, 
  50.0, 
  true
);
```

### 8. Criar Veículo COM_AUTORIZACAO

```sql
INSERT INTO veiculo (
  prefeituraId, 
  orgaoId, 
  nome, 
  placa, 
  tipo_abastecimento, 
  periodicidade, 
  quantidade, 
  capacidade_tanque, 
  ativo
)
VALUES (
  1, 
  1, 
  'Veículo COM_AUTORIZACAO', 
  'JKL-3456', 
  'COM_AUTORIZACAO', 
  'Diario', 
  150.0, 
  50.0, 
  true
);
```

### 9. Criar Veículo LIVRE

```sql
INSERT INTO veiculo (
  prefeituraId, 
  orgaoId, 
  nome, 
  placa, 
  tipo_abastecimento, 
  capacidade_tanque, 
  ativo
)
VALUES (
  1, 
  1, 
  'Veículo LIVRE', 
  'MNO-7890', 
  'LIVRE', 
  50.0, 
  true
);
```

### 10. Criar Abastecimentos para Teste

#### Abastecimento no Dia Atual (para teste diário)

```sql
INSERT INTO abastecimento (
  veiculoId, 
  combustivelId, 
  empresaId, 
  tipo_abastecimento, 
  quantidade, 
  valor_total, 
  data_abastecimento, 
  status, 
  ativo
)
VALUES (
  1, -- ID do veículo COTA Diário
  1, -- ID do combustível
  1, -- ID da empresa
  'COM_COTA', 
  30.0, 
  150.0, 
  NOW(), -- Data atual
  'Aprovado', 
  true
);
```

#### Abastecimento na Semana Atual (para teste semanal)

```sql
INSERT INTO abastecimento (
  veiculoId, 
  combustivelId, 
  empresaId, 
  tipo_abastecimento, 
  quantidade, 
  valor_total, 
  data_abastecimento, 
  status, 
  ativo
)
VALUES (
  2, -- ID do veículo COTA Semanal
  1, 
  1, 
  'COM_COTA', 
  100.0, 
  500.0, 
  DATE_SUB(NOW(), INTERVAL 2 DAY), -- 2 dias atrás (ainda na semana atual)
  'Aprovado', 
  true
);
```

#### Abastecimento no Mês Atual (para teste mensal)

```sql
INSERT INTO abastecimento (
  veiculoId, 
  combustivelId, 
  empresaId, 
  tipo_abastecimento, 
  quantidade, 
  valor_total, 
  data_abastecimento, 
  status, 
  ativo
)
VALUES (
  3, -- ID do veículo COTA Mensal
  1, 
  1, 
  'COM_COTA', 
  500.0, 
  2500.0, 
  DATE_SUB(NOW(), INTERVAL 10 DAY), -- 10 dias atrás (ainda no mês atual)
  'Aprovado', 
  true
);
```

## ✅ Validação dos Resultados

### Checklist de Validação

Para cada cenário de teste, verifique:

#### ✅ Validações Gerais
- [ ] Status code da resposta é `200 OK`
- [ ] Resposta contém `message` com sucesso
- [ ] Resposta contém `veiculoId` correto
- [ ] Resposta contém dados do veículo (id, nome, placa, tipo_abastecimento)
- [ ] Resposta contém dados do órgão

#### ✅ Validações para Tipo COTA/COM_AUTORIZACAO
- [ ] Resposta contém `periodicidade` no objeto `veiculo`
- [ ] Resposta contém `quantidade` no objeto `veiculo`
- [ ] Resposta contém objeto `analise_periodo`
- [ ] `analise_periodo.periodicidade` corresponde à periodicidade do veículo
- [ ] `analise_periodo.limite` corresponde à quantidade do veículo
- [ ] `analise_periodo.total_utilizado` é a soma correta dos abastecimentos do período
- [ ] `analise_periodo.quantidade_disponivel` = `limite - total_utilizado` (ou 0 se negativo)
- [ ] `analise_periodo.dentro_do_limite` é `true` quando `total_utilizado <= limite`
- [ ] `analise_periodo.ultrapassou_limite` é `true` quando `total_utilizado > limite`
- [ ] `analise_periodo.periodo.inicio` e `analise_periodo.periodo.fim` estão corretos para o período
- [ ] `analise_periodo.abastecimentos_no_periodo` corresponde ao número de abastecimentos no período

#### ✅ Validações para Tipo LIVRE
- [ ] Resposta **NÃO** contém `periodicidade` no objeto `veiculo`
- [ ] Resposta **NÃO** contém `quantidade` no objeto `veiculo`
- [ ] Resposta **NÃO** contém objeto `analise_periodo`

#### ✅ Validações de Período Diário
- [ ] Período vai de 00:00:00 até 23:59:59 do dia atual
- [ ] Apenas abastecimentos do dia atual são considerados
- [ ] Abastecimentos de dias anteriores não são considerados

#### ✅ Validações de Período Semanal
- [ ] Período vai da segunda-feira até domingo da semana atual
- [ ] Apenas abastecimentos da semana atual são considerados
- [ ] Abastecimentos de semanas anteriores não são considerados

#### ✅ Validações de Período Mensal
- [ ] Período vai do dia 1 até o último dia do mês atual
- [ ] Apenas abastecimentos do mês atual são considerados
- [ ] Abastecimentos de meses anteriores não são considerados

### Casos de Erro Esperados

#### ❌ Veículo não encontrado
- Status: `404 Not Found`
- Mensagem: "Veículo {id} não foi encontrado entre os órgãos da prefeitura do usuário."

#### ❌ Usuário sem prefeitura
- Status: `401 Unauthorized`
- Mensagem: "Usuário não está vinculado a uma prefeitura ativa."

#### ❌ Token inválido ou ausente
- Status: `401 Unauthorized`
- Mensagem: "Unauthorized"

## 🔍 Dicas de Debugging

### 1. Verificar dados do veículo no banco

```sql
SELECT 
  id, 
  nome, 
  placa, 
  tipo_abastecimento, 
  periodicidade, 
  quantidade, 
  prefeituraId, 
  orgaoId 
FROM veiculo 
WHERE id = {veiculoId};
```

### 2. Verificar abastecimentos do veículo

```sql
SELECT 
  id, 
  quantidade, 
  data_abastecimento, 
  status, 
  ativo 
FROM abastecimento 
WHERE veiculoId = {veiculoId} 
  AND ativo = true 
ORDER BY data_abastecimento DESC;
```

### 3. Verificar abastecimentos no período (exemplo: dia atual)

```sql
SELECT 
  id, 
  quantidade, 
  data_abastecimento 
FROM abastecimento 
WHERE veiculoId = {veiculoId} 
  AND ativo = true 
  AND data_abastecimento >= CURDATE() 
  AND data_abastecimento < DATE_ADD(CURDATE(), INTERVAL 1 DAY);
```

### 4. Verificar soma de quantidades no período

```sql
SELECT 
  SUM(quantidade) as total_utilizado 
FROM abastecimento 
WHERE veiculoId = {veiculoId} 
  AND ativo = true 
  AND data_abastecimento >= {inicio_periodo} 
  AND data_abastecimento <= {fim_periodo};
```

## 📊 Tabela de Testes Rápida

| Tipo | Periodicidade | Quantidade | Abastecimentos | Resultado Esperado |
|------|---------------|------------|----------------|-------------------|
| COTA | Diario | 100L | 70L (dia atual) | Dentro do limite |
| COTA | Diario | 100L | 120L (dia atual) | Ultrapassou limite |
| COTA | Semanal | 500L | 400L (semana atual) | Dentro do limite |
| COTA | Semanal | 500L | 600L (semana atual) | Ultrapassou limite |
| COTA | Mensal | 2000L | 1500L (mês atual) | Dentro do limite |
| COTA | Mensal | 2000L | 2500L (mês atual) | Ultrapassou limite |
| COM_AUTORIZACAO | Diario | 150L | 100L (dia atual) | Dentro do limite |
| LIVRE | - | - | - | Sem análise de período |

## 🚀 Comandos Úteis

### Executar testes automatizados (se houver)

```bash
npm test -- solicitacao-abastecimento.service.spec.ts
```

### Ver logs da aplicação

```bash
npm run start:dev
```

### Verificar conexão com banco

```bash
npx prisma studio
```

## 📝 Notas Importantes

1. **Data de Referência:** A análise de período usa a **data atual do servidor** como referência. Certifique-se de que a data do servidor está correta.

2. **Abastecimentos Inativos:** Apenas abastecimentos com `ativo = true` são considerados na análise.

3. **Data de Abastecimento:** Apenas abastecimentos com `data_abastecimento` não nula são considerados.

4. **Fuso Horário:** Certifique-se de que o fuso horário do servidor está configurado corretamente para cálculos de período precisos.

5. **Semana:** A semana considera de segunda-feira (início) até domingo (fim).

6. **Mês:** O mês considera do dia 1 (início) até o último dia do mês (fim).

## 📞 Suporte

Em caso de dúvidas ou problemas:
1. Verifique os logs da aplicação
2. Verifique os dados no banco de dados
3. Valide a autenticação e permissões do usuário
4. Confirme que o veículo pertence à prefeitura do usuário logado

---

**Última atualização:** Janeiro 2025


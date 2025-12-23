# 📋 Guia de Teste - Upload PDF para Atualização de Cotas de Veículos

Este guia explica passo a passo como testar a rota de upload de PDF para atualização de cotas de veículos usando o Postman.

## 📌 Pré-requisitos

- Postman instalado
- Servidor da API rodando (normalmente em `http://localhost:3000`)
- Credenciais de um usuário válido no sistema
- Arquivo PDF com o formato esperado

## 🔐 Passo 1: Obter Token JWT (Autenticação)

Antes de fazer o upload do PDF, você precisa fazer login para obter o token JWT.

### 1.1. Criar Nova Requisição de Login

1. No Postman, crie uma nova requisição `POST`
2. URL: `http://localhost:3000/auth/login`
3. Vá para a aba **Body**
4. Selecione **raw** e depois **JSON**

### 1.2. Configurar o Body da Requisição

```json
{
  "email": "seu-email@exemplo.com",
  "senha": "sua-senha"
}
```

### 1.3. Enviar Requisição e Copiar o Token

1. Clique em **Send**
2. Você receberá uma resposta similar a:

```json
{
  "message": "Login realizado com sucesso",
  "usuario": {
    "id": 1,
    "email": "seu-email@exemplo.com",
    "nome": "Nome do Usuário",
    "tipo_usuario": "ADMIN_PREFEITURA"
  },
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

3. **Copie o valor de `accessToken`** - você precisará dele na próxima requisição

---

## 📤 Passo 2: Configurar Requisição de Upload do PDF

### 2.1. Criar Nova Requisição

1. Crie uma nova requisição `POST`
2. URL: `http://localhost:3000/atualiza-cota-veiculo/upload-pdf`

### 2.2. Configurar Headers

1. Vá para a aba **Headers**
2. Adicione o header de autenticação:

| Key | Value |
|-----|-------|
| `Authorization` | `Bearer SEU_ACCESS_TOKEN_AQUI` |

⚠️ **Importante**: Substitua `SEU_ACCESS_TOKEN_AQUI` pelo token que você copiou no Passo 1.

### 2.3. Configurar Body para Upload de Arquivo

1. Vá para a aba **Body**
2. Selecione **form-data**
3. Na linha que aparece, configure:

| Key | Type | Value |
|-----|------|-------|
| `file` | **File** (mude o tipo clicando no dropdown à direita) | Selecione seu arquivo PDF |

### 2.4. Selecionar Arquivo PDF

1. Clique em **Select Files** ao lado do campo `file`
2. Navegue até o arquivo PDF que deseja enviar
3. O arquivo deve conter:
   - Nome da prefeitura no início do documento
   - Uma tabela com as colunas: **Órgão**, **Placa**, **Cota Total**, **Cota Utilizada**

### 2.5. Enviar Requisição

1. Clique em **Send**
2. Aguarde a resposta da API

---

## ✅ Passo 3: Verificar Resposta de Sucesso

### 3.1. Resposta de Sucesso (Status 201)

Se tudo ocorrer corretamente, você receberá uma resposta similar a:

```json
{
  "message": "Processamento concluído com sucesso",
  "placas_nao_atualizadas": [
    "ABC1234",
    "XYZ9876"
  ],
  "veiculos_atualizados": [
    {
      "placa": "DEF5678",
      "veiculoId": 10,
      "id": 25,
      "quantidade_permitida": 100.5,
      "quantidade_utilizada": 45.2,
      "quantidade_disponivel": 55.3
    },
    {
      "placa": "GHI9012",
      "veiculoId": 11,
      "id": 26,
      "quantidade_permitida": 200.0,
      "quantidade_utilizada": 150.0,
      "quantidade_disponivel": 50.0
    }
  ],
  "total_processado": 4,
  "total_atualizado": 2,
  "total_nao_atualizado": 2
}
```

### 3.2. Campos da Resposta

- **`message`**: Mensagem de confirmação
- **`placas_nao_atualizadas`**: Array com placas que não foram atualizadas (veículo não encontrado ou sem periodicidade)
- **`veiculos_atualizados`**: Array com detalhes dos veículos que foram atualizados com sucesso
- **`total_processado`**: Total de linhas processadas do PDF
- **`total_atualizado`**: Quantidade de veículos atualizados
- **`total_nao_atualizado`**: Quantidade de veículos não atualizados

---

## ❌ Passo 4: Possíveis Erros e Soluções

### 4.1. Erro 401 - Não Autorizado

**Causa**: Token JWT inválido ou expirado

**Solução**:
- Faça login novamente para obter um novo token
- Verifique se está usando `Bearer ` antes do token no header Authorization

### 4.2. Erro 400 - PDF Inválido

**Exemplo de resposta**:
```json
{
  "message": "O arquivo fornecido não é um PDF válido ou não pode ser processado",
  "error": "Invalid PDF",
  "statusCode": 400
}
```

**Soluções**:
- Verifique se o arquivo é realmente um PDF
- Tente abrir o PDF em um visualizador para confirmar que não está corrompido

### 4.3. Erro 400 - Nome da Prefeitura Não Encontrado

**Exemplo de resposta**:
```json
{
  "message": "Não foi possível identificar o nome da prefeitura no arquivo PDF. Verifique se o documento contém informações sobre a prefeitura nas primeiras linhas.",
  "error": "Prefeitura Name Not Found In PDF",
  "statusCode": 400,
  "details": {
    "timestamp": "2025-01-15T10:30:00.000Z",
    "sugestao": "O nome da prefeitura deve estar presente no início do documento PDF"
  }
}
```

**Soluções**:
- Certifique-se de que o PDF contém o nome da prefeitura nas primeiras linhas
- O nome deve estar próximo a palavras como "Prefeitura" ou "Prefeitura Municipal"

### 4.4. Erro 404 - Prefeitura Não Encontrada no Banco

**Exemplo de resposta**:
```json
{
  "message": "A prefeitura \"Nome da Prefeitura\" encontrada no PDF não foi localizada no banco de dados. Verifique se o nome está correto e se a prefeitura está cadastrada no sistema.",
  "error": "Prefeitura Not Found In Database",
  "statusCode": 404,
  "details": {
    "nomePrefeitura": "Nome da Prefeitura",
    "timestamp": "2025-01-15T10:30:00.000Z"
  }
}
```

**Soluções**:
- Verifique se o nome da prefeitura no PDF corresponde exatamente ao cadastrado no banco
- Certifique-se de que a prefeitura está cadastrada no sistema

### 4.5. Erro 400 - Cabeçalho da Tabela Não Encontrado

**Exemplo de resposta**:
```json
{
  "message": "Não foi possível encontrar o cabeçalho da tabela no PDF. O documento deve conter uma tabela com as colunas: Órgão, Placa, Cota Total e Cota Utilizada.",
  "error": "Table Header Not Found In PDF",
  "statusCode": 400,
  "details": {
    "colunasEsperadas": ["Órgão", "Placa", "Cota Total", "Cota Utilizada"]
  }
}
```

**Soluções**:
- Certifique-se de que o PDF contém uma tabela com essas colunas
- Os cabeçalhos devem estar claramente identificados

### 4.6. Erro 400 - Nenhuma Linha Válida Encontrada

**Exemplo de resposta**:
```json
{
  "message": "Nenhuma linha de dados válida foi encontrada no PDF. Verifique se o documento contém dados de veículos no formato esperado.",
  "error": "No Valid Data Rows Found",
  "statusCode": 400
}
```

**Soluções**:
- Verifique se há dados na tabela do PDF
- Certifique-se de que cada linha contém: órgão, placa, cota total e cota utilizada

---

## 🔍 Passo 5: Verificar Atualização no Banco de Dados

Após receber uma resposta de sucesso, você pode verificar se os dados foram realmente atualizados:

### 5.1. Consultar via API (se houver endpoint)

Você pode usar a rota de consulta de veículos para verificar os dados atualizados:

```
GET http://localhost:3000/veiculos?placa=DEF5678
```

### 5.2. Consultar Diretamente no Banco

Execute uma query SQL para verificar:

```sql
SELECT 
  v.placa,
  vcp.quantidade_permitida,
  vcp.quantidade_utilizada,
  vcp.quantidade_disponivel,
  vcp.periodicidade,
  vcp.data_inicio_periodo,
  vcp.data_fim_periodo
FROM veiculo_cota_periodo vcp
INNER JOIN veiculo v ON v.id = vcp."veiculoId"
WHERE v.placa = 'DEF5678'
  AND vcp.ativo = true
ORDER BY vcp.id DESC;
```

---

## 📝 Formato Esperado do PDF

O PDF deve conter:

1. **Nome da Prefeitura** nas primeiras linhas (ex: "Prefeitura Municipal de Exemplo")
2. **Tabela com cabeçalhos**:
   - Órgão
   - Placa
   - Cota Total
   - Cota Utilizada

3. **Dados das linhas** seguindo o formato:
   ```
   Órgão            | Placa    | Cota Total | Cota Utilizada
   Secretaria Saúde | ABC1234  | 100.5      | 45.2
   Secretaria Obras | DEF5678  | 200.0      | 150.0
   ```

---

## 🎯 Dicas Importantes

1. **Tamanho máximo do arquivo**: 10 MB
2. **Formato aceito**: Apenas PDF
3. **Autenticação**: Sempre necessário (token JWT válido)
4. **Timeout**: Processos grandes podem demorar, seja paciente
5. **Logs**: Em caso de erro, verifique os logs do servidor para mais detalhes

---

## 🔄 Exemplo Completo de Fluxo

```bash
# 1. Login
POST http://localhost:3000/auth/login
Body: { "email": "admin@exemplo.com", "senha": "senha123" }
Response: { "accessToken": "eyJhbGc..." }

# 2. Upload PDF
POST http://localhost:3000/atualiza-cota-veiculo/upload-pdf
Headers: { "Authorization": "Bearer eyJhbGc..." }
Body (form-data): file = [seu-arquivo.pdf]

# 3. Verificar resultado
Response: {
  "message": "Processamento concluído com sucesso",
  "veiculos_atualizados": [...],
  "placas_nao_atualizadas": [...]
}
```

---

## 🆘 Suporte

Em caso de problemas:
1. Verifique os logs do servidor
2. Confirme que o PDF está no formato correto
3. Verifique se todos os dados (prefeitura, órgão, veículos) estão cadastrados
4. Certifique-se de que os veículos têm periodicidade configurada


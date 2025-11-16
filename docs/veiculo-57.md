# Atualização de Combustíveis Permitidos - Veículo ID 57

Este documento explica como atualizar os combustíveis permitidos para o veículo de ID 57, removendo o combustível de ID 2 e mantendo apenas o combustível de ID 1.

## Situação Atual

- **Veículo ID**: 57
- **Combustíveis permitidos atualmente**: 
  - Combustível ID: 1
  - Combustível ID: 2
- **Objetivo**: Remover o combustível ID 2, mantendo apenas o combustível ID 1

## Como Funciona a Atualização de Relacionamentos

Quando você envia o campo `combustivelIds` na requisição de atualização, o sistema:

1. **Valida** se todos os IDs de combustíveis fornecidos existem no banco de dados
2. **Remove** todos os relacionamentos antigos de combustíveis do veículo
3. **Cria** novos relacionamentos apenas com os IDs fornecidos no array

**Importante**: O array `combustivelIds` que você enviar será o estado final. Não é uma operação de "adicionar" ou "remover", mas sim uma **substituição completa** dos relacionamentos.

## Endpoint

- **Rota**: `PATCH /veiculos/57`
- **Método**: `PATCH`
- **Content-Type**: `application/json` ou `multipart/form-data`
- **Guards**:
  - `JwtAuthGuard`
  - `RoleBlockGuard(['SUPER_ADMIN'])`

## Requisição - Remover Combustível ID 2

### Opção 1: Atualizar apenas os combustíveis (JSON)

```json
{
  "combustivelIds": [1]
}
```

**Explicação**: 
- Enviando apenas `[1]` no array `combustivelIds`
- O sistema removerá o relacionamento com o combustível ID 2
- O sistema manterá/criará o relacionamento apenas com o combustível ID 1

### Opção 2: Atualizar combustíveis junto com outros campos (JSON)

```json
{
  "nome": "Nome do Veículo",
  "combustivelIds": [1]
}
```

**Explicação**: 
- Você pode atualizar os combustíveis junto com outros campos do veículo
- Apenas os campos enviados serão atualizados
- Os relacionamentos de combustíveis serão completamente substituídos pelo array fornecido

### Opção 3: Usando Multipart/Form-Data

```
PATCH /veiculos/57
Content-Type: multipart/form-data

combustivelIds: 1
```

**Nota**: Em `multipart/form-data`, arrays podem ser enviados como string separada por vírgula.

## Exemplo de Requisição Completa (cURL)

```bash
curl -X PATCH "https://api.exemplo.com/veiculos/57" \
  -H "Authorization: Bearer SEU_TOKEN_JWT" \
  -H "Content-Type: application/json" \
  -d '{
    "combustivelIds": [1]
  }'
```

## Exemplo de Requisição (JavaScript/Fetch)

```javascript
const response = await fetch('https://api.exemplo.com/veiculos/57', {
  method: 'PATCH',
  headers: {
    'Authorization': 'Bearer SEU_TOKEN_JWT',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    combustivelIds: [1]
  })
});

const data = await response.json();
console.log(data);
```

## Exemplo de Resposta - Sucesso (200)

```json
{
  "message": "Veículo atualizado com sucesso",
  "veiculo": {
    "id": 57,
    "prefeituraId": 1,
    "orgaoId": 5,
    "nome": "Nome do Veículo",
    "placa": "ABC-1234",
    "tipo_abastecimento": "COTA",
    "ativo": true,
    "capacidade_tanque": 80.5,
    "combustiveis": [
      {
        "combustivel": {
          "id": 1,
          "nome": "GASOLINA COMUM",
          "sigla": "GC",
          "descricao": "Gasolina comum"
        }
      }
    ],
    "prefeitura": {
      "id": 1,
      "nome": "Prefeitura Municipal de Estrela",
      "cnpj": "12.345.678/0001-90"
    },
    "orgao": {
      "id": 5,
      "nome": "Secretaria de Saúde",
      "sigla": "SMS"
    }
  }
}
```

**Observação**: Note que no array `combustiveis` agora aparece apenas o combustível de ID 1. O combustível de ID 2 foi removido.

## Validações Aplicadas

1. **Veículo existe**: O veículo com ID 57 deve existir no banco de dados
2. **Combustível existe**: O combustível de ID 1 deve existir no banco de dados
3. **Array não vazio**: Se você enviar um array vazio `[]`, todos os combustíveis serão removidos (não recomendado, pois o veículo precisa de pelo menos um combustível permitido)

## Status Codes

| Status | Descrição |
|--------|-----------|
| `200 OK` | Veículo atualizado com sucesso |
| `400 Bad Request` | Dados inválidos |
| `401 Unauthorized` | Não autenticado |
| `403 Forbidden` | Sem permissão para editar veículo |
| `404 Not Found` | Veículo ou combustível não encontrado |

## Mensagens de Erro Comuns

### Erro 404 - Combustível não encontrado

```json
{
  "message": "Um ou mais combustíveis não foram encontrados",
  "error": "Not Found",
  "statusCode": 404
}
```

**Causa**: O combustível de ID 1 não existe no banco de dados.

**Solução**: Verifique se o ID do combustível está correto antes de fazer a requisição.

### Erro 404 - Veículo não encontrado

```json
{
  "message": "Veículo não encontrado",
  "error": "Not Found",
  "statusCode": 404
}
```

**Causa**: O veículo com ID 57 não existe no banco de dados.

**Solução**: Verifique se o ID do veículo está correto.

## Como Verificar os Combustíveis Atuais

Antes de atualizar, você pode verificar os combustíveis permitidos atualmente fazendo uma requisição `GET`:

```bash
GET /veiculos/57
```

A resposta incluirá o array `combustiveis` com todos os combustíveis permitidos:

```json
{
  "message": "Veículo encontrado com sucesso",
  "veiculo": {
    "id": 57,
    "combustiveis": [
      {
        "combustivel": {
          "id": 1,
          "nome": "GASOLINA COMUM"
        }
      },
      {
        "combustivel": {
          "id": 2,
          "nome": "ETANOL HIDRATADO"
        }
      }
    ],
    "combustivelIds": [1, 2]
  }
}
```

## Observações Importantes

1. **Substituição completa**: O array `combustivelIds` que você enviar substitui completamente os relacionamentos anteriores. Não é uma operação de adicionar/remover incremental.

2. **Array vazio**: Se você enviar `combustivelIds: []`, todos os combustíveis serão removidos. Isso pode causar problemas se o veículo precisar de pelo menos um combustível permitido.

3. **Múltiplos combustíveis**: Se você quiser manter múltiplos combustíveis, inclua todos os IDs no array:
   ```json
   {
     "combustivelIds": [1, 3, 5]
   }
   ```

4. **Outros relacionamentos**: O mesmo comportamento se aplica para `categoriaIds` e `motoristaIds`:
   - `categoriaIds`: Substitui completamente as categorias do veículo
   - `motoristaIds`: Substitui completamente os motoristas vinculados (os antigos são marcados como inativos)

5. **Transação**: A atualização dos relacionamentos é feita de forma atômica. Se houver erro em qualquer etapa, toda a operação é revertida.

## Exemplo Completo: Remover ID 2 e Adicionar ID 3

Se você quiser remover o combustível ID 2 e adicionar o combustível ID 3 (mantendo o ID 1):

```json
{
  "combustivelIds": [1, 3]
}
```

Isso resultará em:
- ✅ Combustível ID 1: Mantido
- ❌ Combustível ID 2: Removido
- ✅ Combustível ID 3: Adicionado

## Resumo do Processo

1. **Estado inicial**: Veículo 57 tem combustíveis [1, 2]
2. **Requisição**: `PATCH /veiculos/57` com `{ "combustivelIds": [1] }`
3. **Processamento**:
   - Sistema valida que combustível ID 1 existe
   - Sistema remove relacionamento com combustível ID 2
   - Sistema mantém/cria relacionamento com combustível ID 1
4. **Estado final**: Veículo 57 tem apenas combustível [1]


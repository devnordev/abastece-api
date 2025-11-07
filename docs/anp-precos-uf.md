# Documentação - Importação de Preços ANP por UF via CSV

## 📋 Visão Geral

Este documento explica como importar preços ANP por UF através de um arquivo CSV usando o endpoint da API.

## 🔐 Autenticação e Autorização

**⚠️ IMPORTANTE**: Todos os endpoints deste módulo requerem:
- **Autenticação**: Token JWT válido
- **Autorização**: Apenas usuários com perfil **SUPER_ADMIN** têm acesso

Usuários com outros perfis (ADMIN_PREFEITURA, COLABORADOR_PREFEITURA, ADMIN_EMPRESA, COLABORADOR_EMPRESA) receberão erro **403 Forbidden**.

---

## 📤 Endpoint de Importação

**URL**: `POST /anp-precos-uf/importar-csv`

**Autenticação**: Bearer Token (JWT)

**Content-Type**: `multipart/form-data`

---

## 📝 Formato do Arquivo CSV

O sistema suporta **dois formatos de CSV**:

### 1. Formato Oficial da ANP (Recomendado)
O formato oficial da ANP pode ser importado diretamente. O sistema:
- Detecta automaticamente o separador (ponto e vírgula `;` ou vírgula `,`)
- Pula automaticamente as linhas de cabeçalho informativas
- Reconhece estados em MAIÚSCULAS (ex: "ACRE", "SÃO PAULO")
- Reconhece produtos no formato ANP (ex: "ETANOL HIDRATADO", "OLEO DIESEL S10")

**Colunas obrigatórias no formato ANP:**
- `ESTADOS` - Nome do estado em MAIÚSCULAS
- `PRODUTO` - Nome do produto no formato ANP
- `PREÇO MÉDIO REVENDA` ou `PREÇO MÉDIO` - Preço médio do combustível

**Colunas opcionais:**
- `PREÇO MÍNIMO REVENDA` ou `PREÇO MÍNIMO` - Preço mínimo do combustível
- `PREÇO MÁXIMO REVENDA` ou `PREÇO MÁXIMO` - Preço máximo do combustível

### 2. Formato Simplificado
Também é possível usar um formato simplificado com os seguintes campos:

**Colunas Obrigatórias:**
- `estados` ou `uf` - Nome do estado ou sigla (ex: "São Paulo", "SP")
- `produto` ou `combustivel` - Nome do combustível (ex: "Gasolina Comum", "Etanol Comum")
- `preço médio` ou `preco medio` - Preço médio do combustível (número decimal)

**Colunas Opcionais:**
- `preço mínimo` ou `preco minimo` - Preço mínimo do combustível
- `preço máximo` ou `preco maximo` - Preço máximo do combustível

### Estados Suportados:
**Formato ANP (MAIÚSCULAS)** - Aceito diretamente:
- ACRE, ALAGOAS, AMAPÁ, AMAZONAS, BAHIA, CEARÁ
- DISTRITO FEDERAL, ESPÍRITO SANTO, GOIÁS, MARANHÃO
- MATO GROSSO, MATO GROSSO DO SUL, MINAS GERAIS
- PARÁ, PARAÍBA, PARANÁ, PERNAMBUCO, PIAUÍ
- RIO DE JANEIRO, RIO GRANDE DO NORTE, RIO GRANDE DO SUL
- RONDÔNIA, RORAIMA, SANTA CATARINA, SÃO PAULO
- SERGIPE, TOCANTINS

**Formato com acentos/minúsculas** - Também aceito:
- Acre, Alagoas, Amapá, Amazonas, Bahia, Ceará, etc.

**Ou pode usar as siglas**: AC, AL, AP, AM, BA, CE, DF, ES, GO, MA, MT, MS, MG, PA, PB, PR, PE, PI, RJ, RN, RS, RO, RR, SC, SP, SE, TO

### Combustíveis Suportados:

**Formato ANP (MAIÚSCULAS)** - Aceito diretamente:
- `ETANOL HIDRATADO` → mapeado para ETANOL_COMUM
- `GASOLINA COMUM` → mapeado para GASOLINA_COMUM
- `GASOLINA ADITIVADA` → mapeado para GASOLINA_ADITIVADA
- `OLEO DIESEL` ou `ÓLEO DIESEL` → mapeado para DIESEL_S500
- `OLEO DIESEL S10` ou `ÓLEO DIESEL S10` → mapeado para DIESEL_S10
- `GNV` → mapeado para GNV
- `GLP` → mapeado para GLP

**Formato simplificado** - Também aceito:
- Gasolina Comum, Gasolina Aditivada
- Etanol Comum, Etanol Aditivado
- Diesel S10, Diesel S500
- GNV, GLP

---

## 📄 Exemplo de Arquivo CSV

### Formato Oficial da ANP (Recomendado)

Você pode usar diretamente o arquivo CSV baixado do site da ANP. O sistema detecta automaticamente e processa corretamente.

**Exemplo de estrutura do arquivo ANP:**
```csv
DATA INICIAL;DATA FINAL;REGIAO;ESTADOS;PRODUTO;NÚMERO DE POSTOS PESQUISADOS;UNIDADE DE MEDIDA;PREÇO MÉDIO REVENDA;DESVIO PADRÃO REVENDA;PREÇO MÍNIMO REVENDA;PREÇO MÁXIMO REVENDA;COEF DE VARIAÇÃO REVENDA
24/08/2025;30/08/2025;SUDESTE;SÃO PAULO;ETANOL HIDRATADO;1128;R$/l;3,98;0,356;3,19;6,29;0,089
24/08/2025;30/08/2025;SUDESTE;SÃO PAULO;GASOLINA COMUM;1137;R$/l;6,04;0,468;5,09;8,99;0,077
24/08/2025;30/08/2025;SUDESTE;RIO DE JANEIRO;OLEO DIESEL S10;190;R$/l;6,09;0,338;5,52;7,39;0,055
```

### Formato Simplificado

Crie um arquivo chamado `precos-anp.csv` com o seguinte conteúdo:

```csv
estados,produto,preço médio,preço mínimo,preço máximo
São Paulo,Gasolina Comum,5.50,5.30,5.70
São Paulo,Gasolina Aditivada,5.65,5.45,5.85
São Paulo,Etanol Comum,3.80,3.60,4.00
Rio de Janeiro,Gasolina Comum,5.45,5.25,5.65
Rio de Janeiro,Etanol Comum,3.75,3.55,3.95
Minas Gerais,Diesel S10,6.20,6.00,6.40
Minas Gerais,Gasolina Comum,5.40,5.20,5.60
```

**Nota**: 
- Os valores numéricos podem usar ponto (.) ou vírgula (,) como separador decimal
- O sistema detecta automaticamente se o separador é ponto e vírgula (`;`) ou vírgula (`,`)
- O sistema pula automaticamente linhas de cabeçalho informativas

---

## 🚀 Como Testar no Postman

### Passo 1: Obter Token de Autenticação

**⚠️ IMPORTANTE**: Você precisa fazer login com uma conta de **SUPER_ADMIN**.

1. Faça login na API com credenciais de SUPER_ADMIN
2. Copie o token JWT retornado na resposta

### Passo 2: Configurar a Requisição no Postman

1. **Método**: Selecione `POST`
2. **URL**: `http://localhost:3000/anp-precos-uf/importar-csv`
   - (Ajuste a porta se necessário)

### Passo 3: Configurar Autenticação

1. Vá para a aba **Authorization**
2. Selecione **Type: Bearer Token**
3. Cole o token JWT no campo **Token**

### Passo 4: Configurar Headers

1. Vá para a aba **Headers**
2. **NÃO** adicione o header `Content-Type` manualmente
   - O Postman adicionará automaticamente `multipart/form-data` quando você selecionar `form-data` no Body

### Passo 5: Configurar Body (Form Data)

1. Vá para a aba **Body**
2. Selecione **form-data**
3. Adicione os seguintes campos:

   **Campo 1:**
   - **Key**: `file`
   - **Type**: Selecione `File` (dropdown à direita do campo Key)
   - **Value**: Clique em **Select Files** e escolha seu arquivo `precos-anp.csv`

   **Campo 2:**
   - **Key**: `anp_semana_id`
   - **Type**: Mantenha como `Text`
   - **Value**: Digite o ID da semana ANP (ex: `1`)

### Passo 6: Enviar a Requisição

1. Clique em **Send**
2. Aguarde a resposta

---

## ✅ Resposta de Sucesso (201 Created)

```json
{
  "message": "27 preços importados com sucesso",
  "total": 27,
  "erros": null
}
```

Se houver erros em algumas linhas (mas outras foram importadas):

```json
{
  "message": "25 preços importados com sucesso",
  "total": 25,
  "erros": [
    "Linha 3: Estado \"XYZ\" não reconhecido",
    "Linha 8: Produto \"Combustível X\" não reconhecido"
  ]
}
```

---

## ❌ Possíveis Erros

### 400 Bad Request

**Erro**: `Nenhum arquivo CSV foi enviado`
- **Solução**: Certifique-se de que o campo `file` está configurado como `File` e não como `Text`

**Erro**: `Apenas arquivos CSV são permitidos`
- **Solução**: Verifique se o arquivo tem extensão `.csv` ou o MIME type `text/csv`

**Erro**: `CSV deve conter as colunas: estados, produto, preço médio`
- **Solução**: Verifique se o cabeçalho do CSV contém essas colunas (pode ter variações de nome)

**Erro**: `Nenhum dado válido encontrado no CSV`
- **Solução**: Verifique se os dados estão no formato correto e se os estados/produtos são reconhecidos

### 401 Unauthorized

**Erro**: Token inválido ou expirado
- **Solução**: Faça login novamente e obtenha um novo token

### 403 Forbidden

**Erro**: `Apenas usuários com perfil SUPER_ADMIN têm acesso a este recurso`
- **Solução**: Você precisa estar logado com uma conta de SUPER_ADMIN. Usuários com outros perfis não têm acesso a este módulo.

### 404 Not Found

**Erro**: `Semana ANP com ID X não encontrada`
- **Solução**: Verifique se o `anp_semana_id` existe. Primeiro cadastre uma semana ANP.

**Erro**: `Nenhum parâmetro de teto ativo encontrado`
- **Solução**: Cadastre um parâmetro de teto com `ativo: true` antes de importar os preços

---

## 🔍 Como Verificar os Dados Importados

Após a importação, você pode verificar os dados usando os seguintes endpoints:

### Listar todos os preços:
```
GET /anp-precos-uf
```

### Buscar preços por semana:
```
GET /anp-precos-uf/semana/:anpSemanaId
```

### Buscar preço específico:
```
GET /anp-precos-uf/:id
```

---

## 📊 Como o Sistema Calcula o Teto

O sistema calcula automaticamente o campo `teto_calculado` baseado no parâmetro de teto ativo:

1. **Busca o parâmetro de teto ativo** (mais recente com `ativo: true`)
2. **Obtém o `anp_base`** (MINIMO, MEDIO ou MAXIMO)
3. **Obtém a `margem_pct`** (ex: 1.0 para 1%)
4. **Seleciona o preço base**:
   - Se `anp_base = MINIMO`: usa `preco_minimo` (ou `preco_medio` se não houver)
   - Se `anp_base = MEDIO`: usa `preco_medio`
   - Se `anp_base = MAXIMO`: usa `preco_maximo` (ou `preco_medio` se não houver)
5. **Calcula**: `teto_calculado = preco_base * (1 + margem_pct/100)`

### Exemplo:
- `anp_base = MEDIO`
- `margem_pct = 1.0` (1%)
- `preco_medio = 5.50`
- **Resultado**: `teto_calculado = 5.50 * 1.01 = 5.555`

---

## 📸 Screenshots de Referência (Postman)

### Configuração do Body (form-data):

```
┌─────────────────────────────────────────────────┐
│ Body (form-data)                                │
├─────────────────────────────────────────────────┤
│ Key          │ Type │ Value                     │
├──────────────┼──────┼──────────────────────────┤
│ file         │ File │ [Select Files] precos... │
│ anp_semana_id│ Text │ 1                         │
└─────────────────────────────────────────────────┘
```

### Configuração da Autorização:

```
┌─────────────────────────────────────────────────┐
│ Authorization                                   │
├─────────────────────────────────────────────────┤
│ Type: Bearer Token                              │
│ Token: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9... │
└─────────────────────────────────────────────────┘
```

---

## 🧪 Exemplo Completo de Requisição (cURL)

Se preferir testar via terminal:

```bash
curl -X POST \
  http://localhost:3000/anp-precos-uf/importar-csv \
  -H 'Authorization: Bearer SEU_TOKEN_AQUI' \
  -F 'file=@/caminho/para/precos-anp.csv' \
  -F 'anp_semana_id=1'
```

---

## 📝 Checklist Antes de Importar

- [ ] **Está logado como SUPER_ADMIN** (não apenas autenticado)
- [ ] Tem um token JWT válido de um usuário SUPER_ADMIN
- [ ] A semana ANP foi cadastrada e você tem o `anp_semana_id`
- [ ] Existe um parâmetro de teto ativo cadastrado
- [ ] O arquivo CSV está no formato correto
- [ ] As colunas do CSV seguem os nomes esperados
- [ ] Os estados e produtos estão nos formatos suportados
- [ ] Os valores numéricos estão corretos

---

## 💡 Dicas

1. **Teste com um arquivo pequeno primeiro** (3-5 linhas) para validar o formato
2. **Verifique os logs do servidor** se houver erros inesperados
3. **Use o endpoint de busca** para verificar se os dados foram salvos corretamente
4. **O sistema ignora linhas vazias** automaticamente
5. **Erros são reportados** mas não impedem a importação dos dados válidos

---

## 🔗 Endpoints Relacionados

- `POST /parametros-teto` - Criar parâmetro de teto
- `GET /parametros-teto` - Listar parâmetros de teto
- `POST /anp-semana` - Criar semana ANP
- `GET /anp-semana` - Listar semanas ANP

---

## 📞 Suporte

Em caso de dúvidas ou problemas, verifique:
1. Os logs da aplicação
2. A documentação Swagger em `http://localhost:3000/api/docs`
3. Os status codes HTTP retornados nas respostas


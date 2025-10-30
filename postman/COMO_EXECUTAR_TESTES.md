# 🧪 Como Executar os Testes Automatizados

## 📋 **Pré-requisitos**

1. **Postman instalado** (versão 8.0 ou superior)
2. **API rodando** em `http://localhost:3000`
3. **Dados de seed** executados (`npm run prisma:seed`)

## 🚀 **Passo a Passo**

### 1. **Importar as Collections**
1. Abra o Postman
2. Clique em **Import**
3. Importe os arquivos:
   - `API_Abastecimento_Collection.json` (Collection principal)
   - `API_Abastecimento_Tests.json` (Collection de testes)
   - `API_Abastecimento_Environment.json` (Ambiente)

### 2. **Configurar o Ambiente**
1. Selecione o ambiente **"API Sistema de Abastecimento - Local"**
2. Verifique se a variável `base_url` está definida como `http://localhost:3000`

### 3. **Executar os Testes**

#### **Opção 1: Executar Collection Completa**
1. Clique na collection **"API Sistema de Abastecimento - Testes Automatizados"**
2. Clique no botão **"Run"** (▶️)
3. Selecione todos os testes
4. Clique em **"Run API Sistema de Abastecimento - Testes Automatizados"**

#### **Opção 2: Executar Testes Individuais**
1. Navegue até a pasta de teste desejada
2. Clique no teste específico
3. Clique em **"Send"**
4. Verifique os resultados na aba **"Test Results"**

### 4. **Verificar Resultados**

#### **Testes de Autenticação**
- ✅ **Login Válido**: Deve retornar status 200 e tokens
- ❌ **Login Inválido**: Deve retornar status 401
- ✅ **Perfil do Usuário**: Deve retornar dados do usuário

#### **Testes de Usuários**
- ✅ **Listar Usuários**: Deve retornar array de usuários
- ✅ **Criar Usuário**: Deve criar usuário com status 201
- ✅ **Buscar por ID**: Deve retornar usuário específico

#### **Testes de Prefeituras**
- ✅ **Listar Prefeituras**: Deve retornar array de prefeituras
- ✅ **Buscar por ID**: Deve retornar prefeitura específica

#### **Testes de Empresas**
- ✅ **Listar Empresas**: Deve retornar array de empresas
- ✅ **Buscar Próximas**: Deve retornar empresas por coordenadas

#### **Testes de Validação**
- ❌ **Dados Inválidos**: Deve retornar status 400 com erros
- ❌ **Sem Token**: Deve retornar status 401

## 📊 **Interpretando os Resultados**

### **Status Codes Esperados**
- **200**: Sucesso
- **201**: Criado com sucesso
- **400**: Dados inválidos
- **401**: Não autorizado
- **404**: Não encontrado
- **500**: Erro interno do servidor

### **Estrutura das Respostas**
```json
{
  "data": [...],           // Array de dados
  "total": 100,           // Total de registros
  "page": 1,              // Página atual
  "limit": 10,            // Limite por página
  "totalPages": 10        // Total de páginas
}
```

### **Estrutura de Erros**
```json
{
  "statusCode": 400,
  "message": [
    "email must be an email",
    "senha must be longer than or equal to 6 characters"
  ],
  "error": "Bad Request"
}
```

## 🔧 **Configurações Avançadas**

### **Variáveis de Ambiente**
- `base_url`: URL base da API
- `jwt_token`: Token JWT (preenchido automaticamente)
- `refresh_token`: Refresh token (preenchido automaticamente)
- `user_id`: ID do usuário logado
- `created_user_id`: ID do usuário criado nos testes

### **Scripts de Teste**
Os testes incluem scripts que:
- Verificam status codes
- Validam estrutura das respostas
- Salvam variáveis para uso posterior
- Testam validações de dados

### **Exemplo de Script de Teste**
```javascript
pm.test('Status code is 200', function () {
    pm.response.to.have.status(200);
});

pm.test('Response has data array', function () {
    const response = pm.response.json();
    pm.expect(response).to.have.property('data');
    pm.expect(response.data).to.be.an('array');
});
```

## 🚨 **Solução de Problemas**

### **Erro: "Could not get any response"**
- Verifique se a API está rodando
- Confirme se a URL está correta
- Verifique se não há firewall bloqueando

### **Erro: "401 Unauthorized"**
- Execute o teste de login primeiro
- Verifique se o token está sendo salvo
- Confirme se o usuário existe no banco

### **Erro: "400 Bad Request"**
- Verifique se os dados estão no formato correto
- Confirme se todos os campos obrigatórios estão preenchidos
- Verifique se as validações estão sendo atendidas

### **Erro: "404 Not Found"**
- Verifique se o endpoint existe
- Confirme se o ID do recurso está correto
- Verifique se o recurso existe no banco

## 📈 **Relatórios de Teste**

### **Newman (CLI)**
Para executar testes via linha de comando:
```bash
# Instalar Newman
npm install -g newman

# Executar testes
newman run API_Abastecimento_Tests.json -e API_Abastecimento_Environment.json

# Gerar relatório HTML
newman run API_Abastecimento_Tests.json -e API_Abastecimento_Environment.json -r html --reporter-html-export report.html
```

### **Integração com CI/CD**
```yaml
# GitHub Actions
- name: Run API Tests
  run: |
    newman run API_Abastecimento_Tests.json -e API_Abastecimento_Environment.json
```

## 🎯 **Próximos Passos**

1. **Execute todos os testes** para verificar se a API está funcionando
2. **Analise os resultados** para identificar possíveis problemas
3. **Crie novos testes** para funcionalidades específicas
4. **Configure integração contínua** para testes automáticos
5. **Monitore a performance** dos endpoints

## 📚 **Recursos Adicionais**

- **Documentação Postman**: https://learning.postman.com/docs/
- **Newman Documentation**: https://github.com/postmanlabs/newman
- **API Documentation**: http://localhost:3000/api/docs
- **Collection Principal**: API_Abastecimento_Collection.json

---

**🎉 Execute os testes e garanta que sua API está funcionando perfeitamente!**

# 📊 Dados de Exemplo para Testes

## 🔐 **Usuários de Teste**

### **Super Administrador**
```json
{
  "email": "superadmin@nordev.com",
  "senha": "123456",
  "nome": "Super Administrador",
  "cpf": "00000000000",
  "tipo_usuario": "SUPER_ADMIN"
}
```

### **Admin da Prefeitura**
```json
{
  "email": "admin@prefeitura.sp.gov.br",
  "senha": "123456",
  "nome": "Administrador da Prefeitura",
  "cpf": "11111111111",
  "tipo_usuario": "ADMIN_PREFEITURA",
  "prefeituraId": 1
}
```

### **Colaborador da Prefeitura - Apenas Campos Obrigatórios**
```json
{
  "email": "colaborador@prefeitura.sp.gov.br",
  "senha": "123456",
  "nome": "Colaborador da Prefeitura",
  "cpf": "22222222222",
  "tipo_usuario": "COLABORADOR_PREFEITURA",
  "prefeituraId": 1
}
```

### **Colaborador da Prefeitura - Com Todos os Dados (Incluindo Opcionais)**
```json
{
  "email": "maria.silva@prefeitura.sp.gov.br",
  "senha": "123456",
  "nome": "Maria Silva",
  "cpf": "33333333333",
  "tipo_usuario": "COLABORADOR_PREFEITURA",
  "prefeituraId": 1,
  "phone": "11988888888",
  "statusAcess": "Acesso_solicitado",
  "ativo": true
}
```

**⚠️ Nota:** A vinculação de órgãos ao colaborador deve ser feita em uma requisição separada após a criação do usuário, através do endpoint de vinculação UsuarioOrgao.

### **Admin da Empresa**
```json
{
  "email": "admin@postoshell.com",
  "senha": "123456",
  "nome": "Administrador da Empresa",
  "cpf": "33333333333",
  "tipo_usuario": "ADMIN_EMPRESA",
  "empresaId": 1
}
```

### **Colaborador da Empresa**
```json
{
  "email": "colaborador@postoshell.com",
  "senha": "123456",
  "nome": "Colaborador da Empresa",
  "cpf": "44444444444",
  "tipo_usuario": "COLABORADOR_EMPRESA",
  "empresaId": 1
}
```

## 🏛️ **Prefeituras**

### **Prefeitura de São Paulo**
```json
{
  "nome": "Prefeitura Municipal de São Paulo",
  "cnpj": "12345678000195",
  "email_administrativo": "admin@prefeitura.sp.gov.br",
  "requer_cupom_fiscal": true,
  "ativo": true
}
```

### **Prefeitura de Santos**
```json
{
  "nome": "Prefeitura Municipal de Santos",
  "cnpj": "12345678000196",
  "email_administrativo": "admin@prefeitura.santos.sp.gov.br",
  "requer_cupom_fiscal": true,
  "ativo": true
}
```

## 🏢 **Empresas**

### **Posto Shell**
```json
{
  "nome": "Posto Shell - Centro",
  "cnpj": "98765432000123",
  "uf": "SP",
  "endereco": "Rua das Flores, 123",
  "endereco_completo": "Rua das Flores, 123, Centro, São Paulo - SP",
  "contato": "João Silva",
  "telefone": "11999999999",
  "email": "contato@postoshell.com",
  "ativo": true,
  "isPublic": true,
  "tipo_empresa": "POSTO_GASOLINA",
  "bandeira": "Shell",
  "latitude": -23.5505,
  "longitude": -46.6333,
  "horario_funcionamento": "24h",
  "servicos_disponiveis": "Abastecimento, Lavagem, Conveniência",
  "formas_pagamento": "Dinheiro, Cartão, PIX",
  "avaliacao": 4.5,
  "total_avaliacoes": 100
}
```

### **Posto Ipiranga**
```json
{
  "nome": "Posto Ipiranga - Centro",
  "cnpj": "98765432000124",
  "uf": "SP",
  "endereco": "Rua das Palmeiras, 456",
  "endereco_completo": "Rua das Palmeiras, 456, Centro, São Paulo - SP",
  "contato": "Maria Silva",
  "telefone": "11977777777",
  "email": "contato@postoipiranga.com",
  "ativo": true,
  "isPublic": true,
  "tipo_empresa": "POSTO_GASOLINA",
  "bandeira": "Ipiranga",
  "latitude": -23.5505,
  "longitude": -46.6333,
  "horario_funcionamento": "24h",
  "servicos_disponiveis": "Abastecimento, Lavagem, Conveniência",
  "formas_pagamento": "Dinheiro, Cartão, PIX",
  "avaliacao": 4.2,
  "total_avaliacoes": 50
}
```

## 🏛️ **Órgãos**

### **Secretaria de Saúde**
```json
{
  "prefeituraId": 1,
  "nome": "Secretaria Municipal de Saúde",
  "sigla": "SMS",
  "ativo": true
}
```

### **Secretaria de Educação**
```json
{
  "prefeituraId": 1,
  "nome": "Secretaria Municipal de Educação",
  "sigla": "SME",
  "ativo": true
}
```

## 🚗 **Veículos**

**📝 Campos Obrigatórios:**
- `prefeituraId`: ID da prefeitura
- `orgaoId`: ID do órgão responsável (obrigatório)
- `nome`: Nome do veículo
- `placa`: Placa do veículo
- `ano`: Ano do veículo
- `capacidade_tanque`: Capacidade do tanque em litros
- `tipo_abastecimento`: Tipo de abastecimento (COTA, LIVRE, COM_AUTORIZACAO)
- `combustivelIds`: IDs dos combustíveis permitidos (array obrigatório)

**📝 Campos Condicionalmente Obrigatórios:**
- **Para tipo COTA:**
  - `periodicidade`: Periodicidade de abastecimento (obrigatório)
  - `quantidade`: Quantidade em litros (obrigatório)
- **Para tipos LIVRE e COM_AUTORIZACAO:**
  - `periodicidade` e `quantidade` são opcionais

**📝 Campos Opcionais:**
- `categoriaIds`: IDs das categorias do veículo
- `motoristaIds`: IDs dos motoristas que podem dirigir o veículo
- `cotasPeriodo`: Array de cotas de período para o veículo (opcional)
- `modelo`, `tipo_veiculo`, `situacao_veiculo`, `apelido`, `ano_fabricacao`, `chassi`, `renavam`, `cor`, `capacidade_passageiros`, `observacoes`, etc.

**⚠️ Regras:**
- Um veículo não pode ser cadastrado em múltiplos órgãos da mesma prefeitura
- Pelo menos um combustível deve ser especificado
- Motoristas devem pertencer à mesma prefeitura do veículo
- Categorias são opcionais mas devem existir no sistema
- Cotas de período são opcionais e devem conter data de início, data de fim, quantidade permitida e periodicidade
- Para tipo de abastecimento COTA, periodicidade e quantidade são obrigatórias

### **Veículo Tipo COTA - Campos Obrigatórios**
```json
{
  "prefeituraId": 1,
  "orgaoId": 1,
  "nome": "Ambulância 01",
  "placa": "ABC-1234",
  "ano": 2020,
  "capacidade_tanque": 80.0,
  "tipo_abastecimento": "COTA",
  "periodicidade": "Semanal",
  "quantidade": 100.0,
  "combustivelIds": [1, 2]
}
```

### **Veículo Tipo LIVRE - Campos Obrigatórios**
```json
{
  "prefeituraId": 1,
  "orgaoId": 1,
  "nome": "Veículo Livre 01",
  "placa": "XYZ-9999",
  "ano": 2023,
  "capacidade_tanque": 60.0,
  "tipo_abastecimento": "LIVRE",
  "combustivelIds": [1, 2]
}
```

### **Veículo Tipo COM_AUTORIZACAO - Campos Obrigatórios**
```json
{
  "prefeituraId": 1,
  "orgaoId": 1,
  "nome": "Veículo com Autorização 01",
  "placa": "ABC-8888",
  "ano": 2022,
  "capacidade_tanque": 70.0,
  "tipo_abastecimento": "COM_AUTORIZACAO",
  "combustivelIds": [1]
}
```

### **Ambulância - Com Todos os Dados (Incluindo Opcionais)**
```json
{
  "prefeituraId": 1,
  "orgaoId": 1,
  "nome": "Ambulância 01",
  "placa": "ABC-1234",
  "modelo": "Ford Transit",
  "ano": 2020,
  "capacidade_tanque": 80.0,
  "tipo_abastecimento": "COTA",
  "periodicidade": "Semanal",
  "quantidade": 100.0,
  "combustivelIds": [1, 2],
  "categoriaIds": [1, 2],
  "motoristaIds": [1, 2],
  "cotasPeriodo": [
    {
      "data_inicio_periodo": "2024-01-01T00:00:00.000Z",
      "data_fim_periodo": "2024-12-31T23:59:59.000Z",
      "quantidade_permitida": 3650.0,
      "periodicidade": "Semanal"
    }
  ],
  "ativo": true,
  "tipo_veiculo": "Ambulancia",
  "situacao_veiculo": "Proprio",
  "apelido": "Ambulância da Saúde",
  "ano_fabricacao": 2019,
  "chassi": "9BWZZZZZZZZZZZZZZ",
  "renavam": "12345678901",
  "cor": "Branco",
  "capacidade_passageiros": 8,
  "observacoes": "Veículo em excelente estado de conservação"
}
```

### **Caminhão de Limpeza - Campos Obrigatórios**
```json
{
  "prefeituraId": 1,
  "orgaoId": 1,
  "nome": "Caminhão de Limpeza 01",
  "placa": "DEF-5678",
  "ano": 2021,
  "capacidade_tanque": 100.0,
  "tipo_abastecimento": "COTA",
  "periodicidade": "Semanal",
  "quantidade": 120.0,
  "combustivelIds": [1]
}
```

### **Caminhão de Limpeza - Com Todos os Dados (Incluindo Opcionais)**
```json
{
  "prefeituraId": 1,
  "orgaoId": 1,
  "nome": "Caminhão de Limpeza 01",
  "placa": "DEF-5678",
  "modelo": "Mercedes Sprinter",
  "ano": 2021,
  "capacidade_tanque": 100.0,
  "tipo_abastecimento": "COTA",
  "periodicidade": "Semanal",
  "quantidade": 120.0,
  "combustivelIds": [1],
  "categoriaIds": [2],
  "motoristaIds": [1],
  "cotasPeriodo": [
    {
      "data_inicio_periodo": "2024-01-01T00:00:00.000Z",
      "data_fim_periodo": "2024-12-31T23:59:59.000Z",
      "quantidade_permitida": 4380.0,
      "periodicidade": "Semanal"
    }
  ],
  "ativo": true,
  "tipo_veiculo": "Caminhao",
  "situacao_veiculo": "Proprio",
  "apelido": "Caminhão da Limpeza",
  "ano_fabricacao": 2020,
  "chassi": "9BWZZZZZZZZZZZZZZ",
  "renavam": "98765432109",
  "cor": "Azul",
  "capacidade_passageiros": 3,
  "observacoes": "Veículo novo em excelente estado"
}
```

## 👨‍💼 **Motoristas**

**📝 Campos Obrigatórios:**
- `prefeituraId`: ID da prefeitura
- `nome`: Nome completo do motorista
- `email`: Email do motorista
- `cpf`: CPF do motorista

**📝 Campos Opcionais:**
- `cnh`, `categoria_cnh`, `data_vencimento_cnh`, `telefone`, `endereco`, `observacoes`, `ativo`

### **Motorista - Campos Obrigatórios**
```json
{
  "prefeituraId": 1,
  "nome": "João Silva",
  "email": "joao.silva@prefeitura.sp.gov.br",
  "cpf": "55555555555"
}
```

### **Motorista - Com Todos os Dados (Incluindo Opcionais)**
```json
{
  "prefeituraId": 1,
  "nome": "João Silva",
  "email": "joao.silva@prefeitura.sp.gov.br",
  "cpf": "55555555555",
  "cnh": "12345678901",
  "categoria_cnh": "B",
  "data_vencimento_cnh": "2025-12-31T00:00:00.000Z",
  "telefone": "11988888888",
  "endereco": "Rua das Palmeiras, 456",
  "ativo": true,
  "observacoes": "Motorista experiente com 10 anos de experiência"
}
```

### **Pedro Santos**
```json
{
  "prefeituraId": 1,
  "nome": "Pedro Santos",
  "email": "pedro.santos@prefeitura.sp.gov.br",
  "cpf": "66666666666",
  "cnh": "98765432109",
  "categoria_cnh": "B",
  "data_vencimento_cnh": "2025-12-31T00:00:00.000Z",
  "telefone": "11955555555",
  "endereco": "Rua das Acácias, 789",
  "ativo": true,
  "observacoes": "Motorista experiente com 5 anos de experiência"
}
```

## ⛽ **Combustíveis**

### **Gasolina Comum**
```json
{
  "nome": "Gasolina Comum",
  "sigla": "GAS_COMUM",
  "descricao": "Gasolina comum para veículos leves",
  "observacoes": "Combustível padrão para veículos de passeio"
}
```

### **Gasolina Aditivada**
```json
{
  "nome": "Gasolina Aditivada",
  "sigla": "GAS_ADITIVADA",
  "descricao": "Gasolina com aditivos para melhor performance",
  "observacoes": "Combustível premium com aditivos especiais"
}
```

### **Etanol**
```json
{
  "nome": "Etanol",
  "sigla": "ETANOL",
  "descricao": "Etanol hidratado para veículos flex",
  "observacoes": "Combustível renovável para veículos flex"
}
```

### **Diesel S10**
```json
{
  "nome": "Diesel S10",
  "sigla": "DIESEL_S10",
  "descricao": "Diesel com baixo teor de enxofre",
  "observacoes": "Diesel limpo para veículos pesados"
}
```

## 📂 **Categorias**

### **Ambulâncias**
```json
{
  "prefeituraId": 1,
  "tipo_categoria": "VEICULO",
  "nome": "Ambulâncias",
  "descricao": "Veículos de emergência médica",
  "ativo": true
}
```

### **Veículos Administrativos**
```json
{
  "prefeituraId": 1,
  "tipo_categoria": "VEICULO",
  "nome": "Veículos Administrativos",
  "descricao": "Veículos para uso administrativo",
  "ativo": true
}
```

### **Motoristas de Emergência**
```json
{
  "prefeituraId": 1,
  "tipo_categoria": "MOTORISTA",
  "nome": "Motoristas de Emergência",
  "descricao": "Motoristas habilitados para veículos de emergência",
  "ativo": true
}
```

## ⛽ **Abastecimentos**

### **Abastecimento com Cota**
```json
{
  "veiculoId": 1,
  "motoristaId": 1,
  "combustivelId": 1,
  "empresaId": 1,
  "solicitanteId": 2,
  "tipo_abastecimento": "COM_COTA",
  "quantidade": 50.5,
  "preco_anp": 5.50,
  "preco_empresa": 5.45,
  "desconto": 0.05,
  "valor_total": 275.25,
  "data_abastecimento": "2024-01-15T10:30:00.000Z",
  "odometro": 50000,
  "orimetro": 1000,
  "status": "Aguardando",
  "abastecido_por": "João Silva",
  "nfe_chave_acesso": "12345678901234567890123456789012345678901234",
  "nfe_img_url": "https://exemplo.com/nfe.jpg",
  "nfe_link": "https://exemplo.com/nfe",
  "ativo": true
}
```

### **Abastecimento Livre**
```json
{
  "veiculoId": 1,
  "motoristaId": 1,
  "combustivelId": 2,
  "empresaId": 1,
  "solicitanteId": 2,
  "tipo_abastecimento": "LIVRE",
  "quantidade": 30.0,
  "preco_anp": 5.60,
  "preco_empresa": 5.55,
  "desconto": 0.05,
  "valor_total": 166.50,
  "data_abastecimento": "2024-01-16T14:20:00.000Z",
  "odometro": 50030,
  "orimetro": 1030,
  "status": "Aprovado",
  "abastecido_por": "João Silva",
  "nfe_chave_acesso": "98765432109876543210987654321098765432109876",
  "nfe_img_url": "https://exemplo.com/nfe2.jpg",
  "nfe_link": "https://exemplo.com/nfe2",
  "ativo": true
}
```

## 📋 **Processos**

**📝 Campos Obrigatórios:**
- `tipo_contrato`: Tipo do contrato (OBJETIVO ou CONSORCIADO) - **SEMPRE OBRIGATÓRIO**

**📝 Campos Condicionalmente Obrigatórios (para tipo OBJETIVO):**
- `prefeituraId`: ID da prefeitura
- `numero_processo`: Número do processo
- `numero_documento`: Número do documento
- `data_abertura`: Data de abertura
- `status`: Status do processo
- `objeto`: Objeto do processo

**📝 Campos Opcionais:**
- `data_encerramento`: Data de encerramento (opcional)
- `observacoes`: Observações sobre o processo (opcional)
- `arquivo_contrato`: Caminho do arquivo do contrato (opcional)
- `litros_desejados`: Quantidade de litros desejados (opcional)
- `valor_utilizado`: Valor já utilizado (opcional)
- `valor_disponivel`: Valor disponível (opcional)
- `tipo_itens`: Tipo dos itens (opcional, padrão: QUANTIDADE_LITROS)
- `ativo`: Se o processo está ativo (opcional, padrão: true)

**⚠️ Regras:**
- `tipo_contrato` é obrigatório em todos os casos
- Para processos do tipo OBJETIVO, os campos listados acima são obrigatórios
- Para processos do tipo CONSORCIADO, apenas `tipo_contrato` é obrigatório
- Cada prefeitura pode ter apenas um processo ativo
- `data_encerramento` é opcional, mas se informada, deve ser posterior à `data_abertura`

### **Processo OBJETIVO - Apenas Campos Obrigatórios**
```json
{
  "tipo_contrato": "OBJETIVO",
  "prefeituraId": 1,
  "numero_processo": "PROC-2024-001",
  "numero_documento": "DOC-2024-001",
  "tipo_documento": "LICITACAO",
  "objeto": "Aquisição de combustíveis para frota municipal",
  "data_abertura": "2024-01-15",
  "data_encerramento": "2024-12-15",
  "status": "ATIVO"
}
```

### **Processo OBJETIVO - Com Todos os Dados (Incluindo Opcionais)**
```json
{
  "tipo_contrato": "OBJETIVO",
  "prefeituraId": 1,
  "litros_desejados": 15000.0,
  "valor_utilizado": 0.0,
  "valor_disponivel": 120000.0,
  "numero_processo": "PROC-2024-002",
  "numero_documento": "DOC-2024-002",
  "tipo_documento": "CONTRATO",
  "tipo_itens": "QUANTIDADE_LITROS",
  "objeto": "Contratação de empresa especializada para fornecimento de combustíveis automotivos para a frota da Prefeitura Municipal",
  "data_abertura": "2024-02-01",
  "data_encerramento": "2025-01-31",
  "status": "EM_ANDAMENTO",
  "ativo": true,
  "observacoes": "Processo licitatório modalidade pregão eletrônico para abastecimento da frota municipal durante o exercício de 2024/2025. Inclui fornecimento de gasolina comum, etanol e diesel S10.",
  "arquivo_contrato": "/uploads/contratos/processo-2024-002-contrato.pdf"
}
```

### **Processo OBJETIVO - Exemplo Completo com Todos os Campos**
```json
{
  "tipo_contrato": "OBJETIVO",
  "prefeituraId": 1,
  "litros_desejados": 25000.0,
  "valor_utilizado": 15000.0,
  "valor_disponivel": 200000.0,
  "numero_processo": "PROC-2024-003",
  "numero_documento": "DOC-2024-003",
  "tipo_documento": "LICITACAO",
  "tipo_itens": "QUANTIDADE_LITROS",
  "objeto": "Aquisição de combustíveis automotivos para abastecimento da frota municipal de veículos leves e pesados, incluindo ambulâncias, caminhões de limpeza urbana, veículos administrativos e equipamentos de manutenção",
  "data_abertura": "2024-03-15",
  "data_encerramento": "2025-03-14",
  "status": "ATIVO",
  "ativo": true,
  "observacoes": "Processo licitatório modalidade pregão eletrônico nº 001/2024. Contratação de empresa para fornecimento de combustíveis durante o período de 12 meses. Inclui: Gasolina Comum, Gasolina Aditivada, Etanol Hidratado, Diesel S10 e Diesel S500. Prazo de entrega: imediato após assinatura do contrato. Valor estimado: R$ 200.000,00.",
  "arquivo_contrato": "/uploads/contratos/licitacao-001-2024.pdf"
}
```

### **Processo OBJETIVO - Sem Data de Encerramento (Campo Opcional)**
```json
{
  "tipo_contrato": "OBJETIVO",
  "prefeituraId": 1,
  "numero_processo": "PROC-2024-004",
  "numero_documento": "DOC-2024-004",
  "tipo_documento": "ARP",
  "objeto": "Processo emergencial para aquisição de combustíveis - prazo a definir",
  "data_abertura": "2024-04-01",
  "status": "EM_ANDAMENTO",
  "observacoes": "Processo em andamento, data de encerramento será definida conforme evolução das negociações."
}
```

### **Processo CONSORCIADO - Apenas Campos Obrigatórios** 
```json
{
  "tipo_contrato": "CONSORCIADO"
}
```

### **📅 Formatos de Data Aceitos**

O sistema aceita os seguintes formatos de data:

#### **✅ Formato Recomendado (Mais Simples):**
```json
{
  "data_abertura": "2024-01-15",
  "data_encerramento": "2024-12-15"
}
```
**💡 Este formato é automaticamente convertido para:**
- `data_abertura`: `2024-01-15T00:00:00.000Z` (início do dia)
- `data_encerramento`: `2024-12-15T23:59:59.999Z` (final do dia)

#### **✅ Formato ISO 8601 Completo:**
```json
{
  "data_abertura": "2024-01-15T00:00:00.000Z",
  "data_encerramento": "2024-12-15T23:59:59.000Z"
}
```

#### **✅ Formato ISO 8601 com Timezone Local:**
```json
{
  "data_abertura": "2024-01-15T08:00:00-03:00",
  "data_encerramento": "2024-12-15T18:00:00-03:00"
}
```

#### **✅ Formato com Horário Específico:**
```json
{
  "data_abertura": "2024-01-15T09:00:00.000Z",
  "data_encerramento": "2024-12-15T17:30:00.000Z"
}
```

**💡 Dicas:**
- Use o formato simples `YYYY-MM-DD` para facilitar o uso
- O sistema automaticamente adiciona horário (00:00:00 para abertura, 23:59:59 para encerramento)
- Para horários específicos, use o formato ISO 8601 completo

## 📄 **Contratos**

### **Contrato de Fornecimento**
```json
{
  "empresaId": 1,
  "empresa_contratante": "Nordev",
  "empresa_contratada": "Posto Shell - Centro",
  "title": "Contrato de Fornecimento de Combustíveis",
  "cnpj_empresa": "98765432000123",
  "vigencia_inicio": "2024-01-01T00:00:00.000Z",
  "vigencia_fim": "2024-12-31T23:59:59.000Z",
  "ativo": true,
  "anexo_contrato": "contrato_2024.pdf",
  "anexo_contrato_assinado": "contrato_2024_assinado.pdf"
}
```

## 🎯 **Dados para Testes de Validação**

### **Usuário com Dados Inválidos**
```json
{
  "email": "email-invalido",
  "senha": "123",
  "nome": "",
  "cpf": "123",
  "tipo_usuario": "TIPO_INEXISTENTE"
}
```

### **Empresa com Dados Inválidos**
```json
{
  "nome": "",
  "cnpj": "123",
  "uf": "XX",
  "email": "email-invalido",
  "latitude": "coordenada-invalida",
  "longitude": "coordenada-invalida"
}
```

### **Veículo com Dados Inválidos**
```json
{
  "nome": "",
  "placa": "123",
  "ano": "ano-invalido",
  "capacidade_tanque": "capacidade-invalida",
  "tipo_veiculo": "TIPO_INEXISTENTE"
}
```

## 📊 **Coordenadas Geográficas para Testes**

### **São Paulo - Centro**
```json
{
  "latitude": -23.5505,
  "longitude": -46.6333,
  "cidade": "São Paulo",
  "bairro": "Centro"
}
```

### **Santos - Centro**
```json
{
  "latitude": -23.9608,
  "longitude": -46.3331,
  "cidade": "Santos",
  "bairro": "Centro"
}
```

### **Campinas - Centro**
```json
{
  "latitude": -22.9056,
  "longitude": -47.0608,
  "cidade": "Campinas",
  "bairro": "Centro"
}
```

## 🔧 **Configurações de Teste**

### **Headers Padrão**
```json
{
  "Content-Type": "application/json",
  "Authorization": "Bearer {{jwt_token}}"
}
```

### **Parâmetros de Paginação**
```json
{
  "page": 1,
  "limit": 10
}
```

### **Filtros Comuns**
```json
{
  "ativo": true,
  "prefeituraId": 1,
  "empresaId": 1,
  "tipo_usuario": "ADMIN_PREFEITURA"
}
```

## 🔗 **Vinculação de Usuários a Órgãos**

### **Exemplo: Vincular Colaborador ao Órgão**

Após criar o colaborador da prefeitura, você pode vinculá-lo a um ou mais órgãos:

```json
{
  "usuarioId": 3,
  "orgaoId": 1,
  "ativo": true
}
```

**Endpoint:** `POST /usuario-orgao` (ou equivalente no seu sistema)

**📝 Campos:**
- `usuarioId` (obrigatório): ID do colaborador da prefeitura
- `orgaoId` (obrigatório): ID do órgão da prefeitura
- `ativo` (opcional): Status da vinculação (padrão: true)

**⚠️ Regras:**
- Apenas colaboradores de prefeitura (`COLABORADOR_PREFEITURA`) podem ser vinculados a órgãos
- O órgão deve pertencer à mesma prefeitura do colaborador
- Um colaborador pode ser vinculado a múltiplos órgãos
- A vinculação deve ser feita por um `ADMIN_PREFEITURA` ou `SUPER_ADMIN`

---

**💡 Use estes dados como referência para criar seus próprios testes e validações!**

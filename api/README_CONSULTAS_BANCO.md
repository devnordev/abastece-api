# 🗄️ Guia de Consultas no Banco de Dados

Este guia ensina como fazer consultas no banco de dados para entender a sequência correta de cadastro dos dados na aplicação, baseado no `seed-completo.ts`.

## 📋 Índice

1. [Pré-requisitos](#pré-requisitos)
2. [Conectando ao Banco](#conectando-ao-banco)
3. [Estrutura do Banco](#estrutura-do-banco)
4. [Sequência de Consultas](#sequência-de-consultas)
5. [Consultas por Módulo](#consultas-por-módulo)
6. [Relacionamentos](#relacionamentos)
7. [Exemplos Práticos](#exemplos-práticos)

## 🔧 Pré-requisitos

### **Ferramentas Necessárias:**
- PostgreSQL instalado e rodando
- Aplicação com banco configurado
- Seed executado (`npm run prisma:seed:completo`)

### **Comandos Úteis:**
```bash
# Conectar ao PostgreSQL
psql -h localhost -U seu_usuario -d abastece

# Ou usar Prisma Studio (interface gráfica)
npx prisma studio
```

## 🗄️ Conectando ao Banco

### **1. Via Terminal (psql)**
```bash
# Conectar ao banco
psql -h localhost -U postgres -d abastece

# Listar tabelas
\dt

# Ver estrutura de uma tabela
\d usuario
```

### **2. Via Prisma Studio (Recomendado)**
```bash
# Abrir interface gráfica
npx prisma studio

# Acessar: http://localhost:5555
```

## 📊 Estrutura do Banco

### **Tabelas Principais:**
- `usuario` - Usuários do sistema
- `prefeitura` - Prefeituras cadastradas
- `orgao` - Órgãos das prefeituras
- `empresa` - Empresas (postos de gasolina)
- `veiculo` - Veículos da prefeitura
- `motorista` - Motoristas habilitados
- `combustivel` - Tipos de combustível
- `contrato` - Contratos com empresas
- `processo` - Processos de abastecimento
- `abastecimento` - Solicitações de abastecimento

## 🔄 Sequência de Consultas

### **1. Verificar Dados Básicos**
```sql
-- Verificar se o seed foi executado
SELECT COUNT(*) as total_usuarios FROM usuario;
SELECT COUNT(*) as total_prefeituras FROM prefeitura;
SELECT COUNT(*) as total_empresas FROM empresa;
```

### **2. Verificar Estrutura Completa**
```sql
-- Ver todos os dados criados pelo seed
SELECT 
  (SELECT COUNT(*) FROM usuario) as usuarios,
  (SELECT COUNT(*) FROM prefeitura) as prefeituras,
  (SELECT COUNT(*) FROM orgao) as orgaos,
  (SELECT COUNT(*) FROM empresa) as empresas,
  (SELECT COUNT(*) FROM veiculo) as veiculos,
  (SELECT COUNT(*) FROM motorista) as motoristas,
  (SELECT COUNT(*) FROM combustivel) as combustiveis,
  (SELECT COUNT(*) FROM contrato) as contratos,
  (SELECT COUNT(*) FROM processo) as processos,
  (SELECT COUNT(*) FROM abastecimento) as abastecimentos;
```

## 📋 Consultas por Módulo

### **👥 Módulo de Usuários**

#### **Verificar Usuários Criados:**
```sql
SELECT 
  id, 
  nome, 
  email, 
  tipo_usuario, 
  statusAcess, 
  ativo,
  prefeituraId,
  empresaId
FROM usuario 
ORDER BY tipo_usuario, nome;
```

#### **Verificar Usuários por Tipo:**
```sql
-- Super Admin
SELECT * FROM usuario WHERE tipo_usuario = 'SUPER_ADMIN';

-- Administradores de Prefeitura
SELECT * FROM usuario WHERE tipo_usuario = 'ADMIN_PREFEITURA';

-- Colaboradores de Prefeitura
SELECT * FROM usuario WHERE tipo_usuario = 'COLABORADOR_PREFEITURA';

-- Administradores de Empresa
SELECT * FROM usuario WHERE tipo_usuario = 'ADMIN_EMPRESA';

-- Colaboradores de Empresa
SELECT * FROM usuario WHERE tipo_usuario = 'COLABORADOR_EMPRESA';
```

### **🏛️ Módulo de Prefeitura**

#### **Verificar Prefeitura:**
```sql
SELECT 
  id, 
  nome, 
  cnpj, 
  email_administrativo, 
  ativo, 
  data_cadastro
FROM prefeitura;
```

#### **Verificar Órgãos da Prefeitura:**
```sql
SELECT 
  o.id, 
  o.nome, 
  o.sigla, 
  o.ativo,
  p.nome as prefeitura
FROM orgao o
JOIN prefeitura p ON o.prefeituraId = p.id
ORDER BY o.nome;
```

### **🏢 Módulo de Empresa**

#### **Verificar Empresas:**
```sql
SELECT 
  id, 
  nome, 
  cnpj, 
  uf, 
  tipo_empresa, 
  bandeira, 
  ativo,
  avaliacao
FROM empresa 
ORDER BY nome;
```

#### **Verificar Usuários das Empresas:**
```sql
SELECT 
  u.nome, 
  u.email, 
  u.tipo_usuario,
  e.nome as empresa
FROM usuario u
JOIN empresa e ON u.empresaId = e.id
ORDER BY e.nome, u.tipo_usuario;
```

### **🚑 Módulo de Veículos**

#### **Verificar Veículos:**
```sql
SELECT 
  v.id, 
  v.nome, 
  v.placa, 
  v.modelo, 
  v.ano,
  v.tipo_veiculo,
  v.situacao_veiculo,
  v.ativo,
  p.nome as prefeitura,
  o.nome as orgao
FROM veiculo v
JOIN prefeitura p ON v.prefeituraId = p.id
LEFT JOIN orgao o ON v.orgaoId = o.id
ORDER BY v.nome;
```

#### **Verificar Veículos por Órgão:**
```sql
SELECT 
  o.nome as orgao,
  COUNT(v.id) as total_veiculos
FROM orgao o
LEFT JOIN veiculo v ON o.id = v.orgaoId
GROUP BY o.id, o.nome
ORDER BY o.nome;
```

### **🚗 Módulo de Motoristas**

#### **Verificar Motoristas:**
```sql
SELECT 
  m.id, 
  m.nome, 
  m.cpf, 
  m.cnh, 
  m.categoria_cnh,
  m.ativo,
  p.nome as prefeitura
FROM motorista m
JOIN prefeitura p ON m.prefeituraId = p.id
ORDER BY m.nome;
```

#### **Verificar Motoristas por Categoria CNH:**
```sql
SELECT 
  categoria_cnh, 
  COUNT(*) as total
FROM motorista 
GROUP BY categoria_cnh
ORDER BY categoria_cnh;
```

### **⛽ Módulo de Combustíveis**

#### **Verificar Combustíveis:**
```sql
SELECT 
  id, 
  nome, 
  sigla, 
  descricao
FROM combustivel 
ORDER BY nome;
```

### **📄 Módulo de Contratos**

#### **Verificar Contratos:**
```sql
SELECT 
  c.id, 
  c.title, 
  c.empresa_contratante,
  c.empresa_contratada,
  c.vigencia_inicio,
  c.vigencia_fim,
  c.ativo,
  e.nome as empresa
FROM contrato c
JOIN empresa e ON c.empresaId = e.id
ORDER BY c.title;
```

### **📊 Módulo de Processos**

#### **Verificar Processos:**
```sql
SELECT 
  p.id, 
  p.numero_processo, 
  p.tipo_documento,
  p.objeto,
  p.data_abertura,
  p.data_encerramento,
  p.status,
  p.valor_disponivel,
  pr.nome as prefeitura
FROM processo p
JOIN prefeitura pr ON p.prefeituraId = pr.id
ORDER BY p.numero_processo;
```

### **⛽ Módulo de Abastecimento**

#### **Verificar Solicitações:**
```sql
SELECT 
  a.id,
  v.nome as veiculo,
  v.placa,
  m.nome as motorista,
  c.nome as combustivel,
  e.nome as empresa,
  a.quantidade,
  a.valor_total,
  a.data_abastecimento,
  a.status
FROM abastecimento a
JOIN veiculo v ON a.veiculoId = v.id
LEFT JOIN motorista m ON a.motoristaId = m.id
JOIN combustivel c ON a.combustivelId = c.id
JOIN empresa e ON a.empresaId = e.id
ORDER BY a.data_abastecimento DESC;
```

## 🔗 Relacionamentos

### **Verificar Relacionamentos Completos:**
```sql
-- Estrutura completa da prefeitura
SELECT 
  p.nome as prefeitura,
  o.nome as orgao,
  COUNT(v.id) as total_veiculos,
  COUNT(m.id) as total_motoristas
FROM prefeitura p
LEFT JOIN orgao o ON p.id = o.prefeituraId
LEFT JOIN veiculo v ON o.id = v.orgaoId
LEFT JOIN motorista m ON p.id = m.prefeituraId
GROUP BY p.id, p.nome, o.id, o.nome
ORDER BY p.nome, o.nome;
```

### **Verificar Relacionamentos Empresa-Contrato:**
```sql
SELECT 
  e.nome as empresa,
  e.bandeira,
  c.title as contrato,
  c.vigencia_inicio,
  c.vigencia_fim,
  c.ativo as contrato_ativo
FROM empresa e
LEFT JOIN contrato c ON e.id = c.empresaId
ORDER BY e.nome;
```

## 🎯 Exemplos Práticos

### **1. Verificar Dados do Seed Completo:**
```sql
-- Resumo completo dos dados
SELECT 
  'Usuários' as tabela, COUNT(*) as total FROM usuario
UNION ALL
SELECT 'Prefeituras', COUNT(*) FROM prefeitura
UNION ALL
SELECT 'Órgãos', COUNT(*) FROM orgao
UNION ALL
SELECT 'Empresas', COUNT(*) FROM empresa
UNION ALL
SELECT 'Veículos', COUNT(*) FROM veiculo
UNION ALL
SELECT 'Motoristas', COUNT(*) FROM motorista
UNION ALL
SELECT 'Combustíveis', COUNT(*) FROM combustivel
UNION ALL
SELECT 'Contratos', COUNT(*) FROM contrato
UNION ALL
SELECT 'Processos', COUNT(*) FROM processo
UNION ALL
SELECT 'Abastecimentos', COUNT(*) FROM abastecimento;
```

### **2. Verificar Usuários por Permissão:**
```sql
SELECT 
  tipo_usuario,
  COUNT(*) as total,
  COUNT(CASE WHEN ativo = true THEN 1 END) as ativos,
  COUNT(CASE WHEN statusAcess = 'Ativado' THEN 1 END) as ativados
FROM usuario 
GROUP BY tipo_usuario
ORDER BY tipo_usuario;
```

### **3. Verificar Veículos por Status:**
```sql
SELECT 
  tipo_veiculo,
  situacao_veiculo,
  COUNT(*) as total,
  COUNT(CASE WHEN ativo = true THEN 1 END) as ativos
FROM veiculo 
GROUP BY tipo_veiculo, situacao_veiculo
ORDER BY tipo_veiculo, situacao_veiculo;
```

### **4. Verificar Abastecimentos por Status:**
```sql
SELECT 
  status,
  COUNT(*) as total,
  SUM(quantidade) as total_litros,
  SUM(valor_total) as valor_total
FROM abastecimento 
GROUP BY status
ORDER BY status;
```

## 📝 Sequência de Cadastro na Aplicação

### **Ordem Correta de Cadastro:**

1. **🏛️ Prefeitura** (base para tudo)
2. **🏢 Órgãos** (vinculados à prefeitura)
3. **👥 Usuários da Prefeitura** (admin e colaboradores)
4. **📂 Categorias** (para veículos e motoristas)
5. **🚗 Motoristas** (vinculados à prefeitura)
6. **🚑 Veículos** (vinculados à prefeitura e órgão)
7. **🏢 Empresas** (postos de gasolina)
8. **👥 Usuários das Empresas** (admin e colaboradores)
9. **⛽ Combustíveis** (tipos disponíveis)
10. **📄 Contratos** (entre prefeitura e empresas)
11. **📊 Processos** (teto de combustível)
12. **⛽ Abastecimentos** (solicitações)

### **Consultas para Verificar Sequência:**
```sql
-- Verificar se a sequência está correta
SELECT 
  CASE 
    WHEN (SELECT COUNT(*) FROM prefeitura) > 0 THEN '✅ Prefeitura OK'
    ELSE '❌ Prefeitura Faltando'
  END as status_prefeitura,
  
  CASE 
    WHEN (SELECT COUNT(*) FROM orgao) > 0 THEN '✅ Órgãos OK'
    ELSE '❌ Órgãos Faltando'
  END as status_orgaos,
  
  CASE 
    WHEN (SELECT COUNT(*) FROM usuario WHERE tipo_usuario = 'ADMIN_PREFEITURA') > 0 THEN '✅ Admin Prefeitura OK'
    ELSE '❌ Admin Prefeitura Faltando'
  END as status_admin_prefeitura,
  
  CASE 
    WHEN (SELECT COUNT(*) FROM veiculo) > 0 THEN '✅ Veículos OK'
    ELSE '❌ Veículos Faltando'
  END as status_veiculos,
  
  CASE 
    WHEN (SELECT COUNT(*) FROM empresa) > 0 THEN '✅ Empresas OK'
    ELSE '❌ Empresas Faltando'
  END as status_empresas;
```

## 🚀 Comandos Úteis

### **Limpar e Recriar Dados:**
```bash
# Resetar banco e executar seed
npx prisma migrate reset --force
npm run prisma:seed:completo
```

### **Verificar Status do Banco:**
```bash
# Verificar conexão
npx prisma db pull

# Gerar cliente
npx prisma generate

# Abrir Prisma Studio
npx prisma studio
```

### **Consultas de Manutenção:**
```sql
-- Verificar integridade dos dados
SELECT 
  'Usuários sem prefeitura/empresa' as problema,
  COUNT(*) as total
FROM usuario 
WHERE prefeituraId IS NULL AND empresaId IS NULL

UNION ALL

SELECT 
  'Veículos sem órgão',
  COUNT(*)
FROM veiculo 
WHERE orgaoId IS NULL

UNION ALL

SELECT 
  'Abastecimentos sem veículo',
  COUNT(*)
FROM abastecimento 
WHERE veiculoId IS NULL;
```

## 📚 Próximos Passos

1. **Execute as consultas** para entender a estrutura
2. **Use o Prisma Studio** para visualização gráfica
3. **Teste a aplicação** com os dados criados
4. **Explore os relacionamentos** entre as tabelas
5. **Crie seus próprios dados** seguindo a sequência

Este guia fornece uma base sólida para entender como os dados se relacionam na aplicação e como cadastrá-los na ordem correta! 🎉

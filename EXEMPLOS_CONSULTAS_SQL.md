# 🔍 Exemplos Práticos de Consultas SQL

Este arquivo contém exemplos práticos de consultas SQL para entender melhor a estrutura de dados da aplicação.

## 📋 Índice

1. [Consultas Básicas](#consultas-básicas)
2. [Consultas de Relacionamento](#consultas-de-relacionamento)
3. [Consultas de Análise](#consultas-de-análise)
4. [Consultas de Relatórios](#consultas-de-relatórios)
5. [Consultas de Manutenção](#consultas-de-manutenção)

## 🔍 Consultas Básicas

### **1. Verificar Estrutura Completa**
```sql
-- Resumo geral dos dados
SELECT 
  'Usuários' as entidade, 
  COUNT(*) as total,
  COUNT(CASE WHEN ativo = true THEN 1 END) as ativos
FROM usuario
UNION ALL
SELECT 'Prefeituras', COUNT(*), COUNT(CASE WHEN ativo = true THEN 1 END) FROM prefeitura
UNION ALL
SELECT 'Órgãos', COUNT(*), COUNT(CASE WHEN ativo = true THEN 1 END) FROM orgao
UNION ALL
SELECT 'Empresas', COUNT(*), COUNT(CASE WHEN ativo = true THEN 1 END) FROM empresa
UNION ALL
SELECT 'Veículos', COUNT(*), COUNT(CASE WHEN ativo = true THEN 1 END) FROM veiculo
UNION ALL
SELECT 'Motoristas', COUNT(*), COUNT(CASE WHEN ativo = true THEN 1 END) FROM motorista
UNION ALL
SELECT 'Combustíveis', COUNT(*), COUNT(*) FROM combustivel
UNION ALL
SELECT 'Contratos', COUNT(*), COUNT(CASE WHEN ativo = true THEN 1 END) FROM contrato
UNION ALL
SELECT 'Processos', COUNT(*), COUNT(CASE WHEN ativo = true THEN 1 END) FROM processo
UNION ALL
SELECT 'Abastecimentos', COUNT(*), COUNT(*) FROM abastecimento;
```

### **2. Verificar Usuários por Tipo**
```sql
-- Distribuição de usuários por tipo
SELECT 
  tipo_usuario,
  COUNT(*) as total,
  COUNT(CASE WHEN ativo = true THEN 1 END) as ativos,
  COUNT(CASE WHEN statusAcess = 'Ativado' THEN 1 END) as ativados,
  COUNT(CASE WHEN prefeituraId IS NOT NULL THEN 1 END) as vinculados_prefeitura,
  COUNT(CASE WHEN empresaId IS NOT NULL THEN 1 END) as vinculados_empresa
FROM usuario 
GROUP BY tipo_usuario
ORDER BY tipo_usuario;
```

### **3. Verificar Estrutura da Prefeitura**
```sql
-- Estrutura completa da prefeitura
SELECT 
  p.nome as prefeitura,
  p.cnpj,
  p.email_administrativo,
  p.ativo as prefeitura_ativa,
  COUNT(DISTINCT o.id) as total_orgaos,
  COUNT(DISTINCT v.id) as total_veiculos,
  COUNT(DISTINCT m.id) as total_motoristas,
  COUNT(DISTINCT u.id) as total_usuarios
FROM prefeitura p
LEFT JOIN orgao o ON p.id = o.prefeituraId
LEFT JOIN veiculo v ON p.id = v.prefeituraId
LEFT JOIN motorista m ON p.id = m.prefeituraId
LEFT JOIN usuario u ON p.id = u.prefeituraId
GROUP BY p.id, p.nome, p.cnpj, p.email_administrativo, p.ativo
ORDER BY p.nome;
```

## 🔗 Consultas de Relacionamento

### **1. Usuários e Suas Vinculações**
```sql
-- Usuários com suas vinculações
SELECT 
  u.nome,
  u.email,
  u.tipo_usuario,
  u.statusAcess,
  u.ativo,
  CASE 
    WHEN u.prefeituraId IS NOT NULL THEN p.nome
    WHEN u.empresaId IS NOT NULL THEN e.nome
    ELSE 'Sem vinculação'
  END as vinculado_a,
  CASE 
    WHEN u.prefeituraId IS NOT NULL THEN 'Prefeitura'
    WHEN u.empresaId IS NOT NULL THEN 'Empresa'
    ELSE 'Sistema'
  END as tipo_vinculacao
FROM usuario u
LEFT JOIN prefeitura p ON u.prefeituraId = p.id
LEFT JOIN empresa e ON u.empresaId = e.id
ORDER BY u.tipo_usuario, u.nome;
```

### **2. Veículos e Suas Vinculações**
```sql
-- Veículos com suas vinculações
SELECT 
  v.nome,
  v.placa,
  v.modelo,
  v.ano,
  v.tipo_veiculo,
  v.situacao_veiculo,
  v.ativo,
  p.nome as prefeitura,
  o.nome as orgao,
  o.sigla as orgao_sigla
FROM veiculo v
JOIN prefeitura p ON v.prefeituraId = p.id
LEFT JOIN orgao o ON v.orgaoId = o.id
ORDER BY p.nome, o.nome, v.nome;
```

### **3. Empresas e Contratos**
```sql
-- Empresas com seus contratos
SELECT 
  e.nome as empresa,
  e.cnpj,
  e.bandeira,
  e.uf,
  e.ativo as empresa_ativa,
  c.title as contrato,
  c.empresa_contratante,
  c.vigencia_inicio,
  c.vigencia_fim,
  c.ativo as contrato_ativo,
  CASE 
    WHEN c.vigencia_fim < CURRENT_DATE THEN 'Expirado'
    WHEN c.vigencia_inicio > CURRENT_DATE THEN 'Não iniciado'
    ELSE 'Vigente'
  END as status_contrato
FROM empresa e
LEFT JOIN contrato c ON e.id = c.empresaId
ORDER BY e.nome, c.vigencia_inicio;
```

## 📊 Consultas de Análise

### **1. Análise de Abastecimentos**
```sql
-- Análise detalhada de abastecimentos
SELECT 
  v.nome as veiculo,
  v.placa,
  m.nome as motorista,
  c.nome as combustivel,
  e.nome as empresa,
  a.quantidade,
  a.valor_total,
  a.data_abastecimento,
  a.status,
  p.nome as prefeitura,
  o.nome as orgao
FROM abastecimento a
JOIN veiculo v ON a.veiculoId = v.id
LEFT JOIN motorista m ON a.motoristaId = m.id
JOIN combustivel c ON a.combustivelId = c.id
JOIN empresa e ON a.empresaId = e.id
JOIN prefeitura p ON v.prefeituraId = p.id
LEFT JOIN orgao o ON v.orgaoId = o.id
ORDER BY a.data_abastecimento DESC;
```

### **2. Resumo Financeiro por Prefeitura**
```sql
-- Resumo financeiro de abastecimentos por prefeitura
SELECT 
  p.nome as prefeitura,
  COUNT(a.id) as total_abastecimentos,
  SUM(a.quantidade) as total_litros,
  SUM(a.valor_total) as valor_total,
  AVG(a.valor_total) as valor_medio,
  COUNT(CASE WHEN a.status = 'Aprovado' THEN 1 END) as aprovados,
  COUNT(CASE WHEN a.status = 'Aguardando' THEN 1 END) as aguardando,
  COUNT(CASE WHEN a.status = 'Rejeitado' THEN 1 END) as rejeitados
FROM prefeitura p
LEFT JOIN veiculo v ON p.id = v.prefeituraId
LEFT JOIN abastecimento a ON v.id = a.veiculoId
GROUP BY p.id, p.nome
ORDER BY valor_total DESC;
```

### **3. Análise por Empresa**
```sql
-- Análise de abastecimentos por empresa
SELECT 
  e.nome as empresa,
  e.bandeira,
  e.uf,
  COUNT(a.id) as total_abastecimentos,
  SUM(a.quantidade) as total_litros,
  SUM(a.valor_total) as valor_total,
  AVG(a.valor_total) as valor_medio,
  COUNT(DISTINCT a.veiculoId) as veiculos_atendidos,
  COUNT(DISTINCT v.prefeituraId) as prefeituras_atendidas
FROM empresa e
LEFT JOIN abastecimento a ON e.id = a.empresaId
LEFT JOIN veiculo v ON a.veiculoId = v.id
GROUP BY e.id, e.nome, e.bandeira, e.uf
ORDER BY valor_total DESC;
```

## 📈 Consultas de Relatórios

### **1. Relatório de Veículos por Órgão**
```sql
-- Relatório de veículos por órgão
SELECT 
  o.nome as orgao,
  o.sigla,
  COUNT(v.id) as total_veiculos,
  COUNT(CASE WHEN v.ativo = true THEN 1 END) as veiculos_ativos,
  COUNT(CASE WHEN v.tipo_veiculo = 'Ambulancia' THEN 1 END) as ambulancias,
  COUNT(CASE WHEN v.tipo_veiculo = 'Carro' THEN 1 END) as carros,
  COUNT(CASE WHEN v.tipo_veiculo = 'Microonibus' THEN 1 END) as vans,
  SUM(v.capacidade_tanque) as capacidade_total_tanque
FROM orgao o
LEFT JOIN veiculo v ON o.id = v.orgaoId
GROUP BY o.id, o.nome, o.sigla
ORDER BY total_veiculos DESC;
```

### **2. Relatório de Motoristas**
```sql
-- Relatório de motoristas
SELECT 
  m.nome,
  m.cpf,
  m.cnh,
  m.categoria_cnh,
  m.data_vencimento_cnh,
  CASE 
    WHEN m.data_vencimento_cnh < CURRENT_DATE THEN 'Vencida'
    WHEN m.data_vencimento_cnh < CURRENT_DATE + INTERVAL '30 days' THEN 'Vencendo em 30 dias'
    ELSE 'Válida'
  END as status_cnh,
  m.ativo,
  p.nome as prefeitura,
  COUNT(a.id) as total_abastecimentos
FROM motorista m
JOIN prefeitura p ON m.prefeituraId = p.id
LEFT JOIN abastecimento a ON m.id = a.motoristaId
GROUP BY m.id, m.nome, m.cpf, m.cnh, m.categoria_cnh, m.data_vencimento_cnh, m.ativo, p.nome
ORDER BY m.nome;
```

### **3. Relatório de Processos**
```sql
-- Relatório de processos
SELECT 
  p.numero_processo,
  p.tipo_documento,
  p.objeto,
  p.data_abertura,
  p.data_encerramento,
  p.status,
  p.valor_disponivel,
  pr.nome as prefeitura,
  COUNT(a.id) as total_abastecimentos,
  SUM(a.valor_total) as valor_utilizado,
  (p.valor_disponivel - COALESCE(SUM(a.valor_total), 0)) as saldo_disponivel
FROM processo p
JOIN prefeitura pr ON p.prefeituraId = pr.id
LEFT JOIN veiculo v ON pr.id = v.prefeituraId
LEFT JOIN abastecimento a ON v.id = a.veiculoId AND a.status = 'Aprovado'
GROUP BY p.id, p.numero_processo, p.tipo_documento, p.objeto, p.data_abertura, p.data_encerramento, p.status, p.valor_disponivel, pr.nome
ORDER BY p.data_abertura DESC;
```

## 🔧 Consultas de Manutenção

### **1. Verificar Integridade dos Dados**
```sql
-- Verificar integridade dos dados
SELECT 
  'Usuários sem vinculação' as problema,
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
WHERE veiculoId IS NULL

UNION ALL

SELECT 
  'Contratos expirados',
  COUNT(*)
FROM contrato 
WHERE vigencia_fim < CURRENT_DATE AND ativo = true

UNION ALL

SELECT 
  'Motoristas com CNH vencida',
  COUNT(*)
FROM motorista 
WHERE data_vencimento_cnh < CURRENT_DATE AND ativo = true;
```

### **2. Verificar Dados Duplicados**
```sql
-- Verificar CPFs duplicados
SELECT 
  cpf, 
  COUNT(*) as total
FROM usuario 
GROUP BY cpf 
HAVING COUNT(*) > 1

UNION ALL

-- Verificar placas duplicadas
SELECT 
  placa, 
  COUNT(*) as total
FROM veiculo 
GROUP BY placa 
HAVING COUNT(*) > 1

UNION ALL

-- Verificar CNHs duplicadas
SELECT 
  cnh, 
  COUNT(*) as total
FROM motorista 
GROUP BY cnh 
HAVING COUNT(*) > 1;
```

### **3. Verificar Status dos Dados**
```sql
-- Verificar status dos dados
SELECT 
  'Usuários inativos' as categoria,
  COUNT(*) as total
FROM usuario 
WHERE ativo = false

UNION ALL

SELECT 
  'Veículos inativos',
  COUNT(*)
FROM veiculo 
WHERE ativo = false

UNION ALL

SELECT 
  'Motoristas inativos',
  COUNT(*)
FROM motorista 
WHERE ativo = false

UNION ALL

SELECT 
  'Empresas inativas',
  COUNT(*)
FROM empresa 
WHERE ativo = false

UNION ALL

SELECT 
  'Contratos inativos',
  COUNT(*)
FROM contrato 
WHERE ativo = false;
```

## 🎯 Consultas Específicas do Seed

### **1. Verificar Dados do Seed Completo**
```sql
-- Verificar se todos os dados do seed foram criados
SELECT 
  CASE 
    WHEN (SELECT COUNT(*) FROM usuario) >= 6 THEN '✅ Usuários OK'
    ELSE '❌ Usuários Faltando'
  END as usuarios,
  
  CASE 
    WHEN (SELECT COUNT(*) FROM prefeitura) >= 1 THEN '✅ Prefeitura OK'
    ELSE '❌ Prefeitura Faltando'
  END as prefeitura,
  
  CASE 
    WHEN (SELECT COUNT(*) FROM orgao) >= 2 THEN '✅ Órgãos OK'
    ELSE '❌ Órgãos Faltando'
  END as orgaos,
  
  CASE 
    WHEN (SELECT COUNT(*) FROM empresa) >= 2 THEN '✅ Empresas OK'
    ELSE '❌ Empresas Faltando'
  END as empresas,
  
  CASE 
    WHEN (SELECT COUNT(*) FROM veiculo) >= 4 THEN '✅ Veículos OK'
    ELSE '❌ Veículos Faltando'
  END as veiculos,
  
  CASE 
    WHEN (SELECT COUNT(*) FROM motorista) >= 3 THEN '✅ Motoristas OK'
    ELSE '❌ Motoristas Faltando'
  END as motoristas,
  
  CASE 
    WHEN (SELECT COUNT(*) FROM combustivel) >= 4 THEN '✅ Combustíveis OK'
    ELSE '❌ Combustíveis Faltando'
  END as combustiveis,
  
  CASE 
    WHEN (SELECT COUNT(*) FROM contrato) >= 2 THEN '✅ Contratos OK'
    ELSE '❌ Contratos Faltando'
  END as contratos,
  
  CASE 
    WHEN (SELECT COUNT(*) FROM processo) >= 1 THEN '✅ Processos OK'
    ELSE '❌ Processos Faltando'
  END as processos,
  
  CASE 
    WHEN (SELECT COUNT(*) FROM abastecimento) >= 3 THEN '✅ Abastecimentos OK'
    ELSE '❌ Abastecimentos Faltando'
  END as abastecimentos;
```

### **2. Verificar Estrutura Completa do Seed**
```sql
-- Estrutura completa dos dados do seed
SELECT 
  'Palmeira dos Índios' as prefeitura,
  'SMS' as orgao_saude,
  'SMAS' as orgao_assistencia,
  'Posto Dois Irmãos' as empresa_1,
  'Posto Ipiranga Vila Maria' as empresa_2,
  '4 veículos' as veiculos,
  '3 motoristas' as motoristas,
  '4 combustíveis' as combustiveis,
  '2 contratos' as contratos,
  '1 processo' as processos,
  '3 abastecimentos' as abastecimentos;
```

## 🚀 Comandos Úteis

### **Executar Consultas:**
```bash
# Via psql
psql -h localhost -U postgres -d abastece -f consulta.sql

# Via Prisma Studio
npx prisma studio
```

### **Exportar Resultados:**
```sql
-- Exportar para CSV
COPY (SELECT * FROM usuario) TO '/tmp/usuarios.csv' WITH CSV HEADER;
```

### **Backup dos Dados:**
```bash
# Backup completo
pg_dump -h localhost -U postgres -d abastece > backup.sql

# Restaurar backup
psql -h localhost -U postgres -d abastece < backup.sql
```

Este arquivo fornece exemplos práticos de consultas SQL para entender melhor a estrutura de dados da aplicação! 🎉

import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Iniciando seed completo para SUPER_ADMIN...');
  console.log('👑 Demonstrando todos os módulos acessíveis ao SUPER_ADMIN');

  // Hash das senhas
  const hashedPassword = await bcrypt.hash('123456', 12);

  // ===============================
  // 1. SUPER ADMIN (Base do Sistema)
  // ===============================
  console.log('👑 1. Criando Super Admin...');
  const superAdmin = await prisma.usuario.upsert({
    where: { email: 'superadmin@nordev.com' },
    update: {},
    create: {
      email: 'superadmin@nordev.com',
      senha: hashedPassword,
      nome: 'Super Administrador',
      cpf: '00000000000',
      tipo_usuario: 'SUPER_ADMIN',
      statusAcess: 'Ativado',
      ativo: true,
      data_cadastro: new Date(),
    },
  });
  console.log('✅ Super Admin criado:', superAdmin.email);

  // ===============================
  // 2. PREFEITURAS (Gestão Municipal)
  // ===============================
  console.log('🏛️ 2. Criando Prefeituras...');
  
  const prefeituraSP = await prisma.prefeitura.upsert({
    where: { cnpj: '12345678000195' },
    update: {},
    create: {
      nome: 'Prefeitura Municipal de São Paulo',
      cnpj: '12345678000195',
      email_administrativo: 'admin@prefeitura.sp.gov.br',
      ativo: true,
      data_cadastro: new Date(),
      requer_cupom_fiscal: true,
    },
  });

  const prefeituraSantos = await prisma.prefeitura.upsert({
    where: { cnpj: '12345678000196' },
    update: {},
    create: {
      nome: 'Prefeitura Municipal de Santos',
      cnpj: '12345678000196',
      email_administrativo: 'admin@prefeitura.santos.sp.gov.br',
      ativo: true,
      data_cadastro: new Date(),
      requer_cupom_fiscal: true,
    },
  });

  console.log('✅ Prefeituras criadas:', prefeituraSP.nome, '|', prefeituraSantos.nome);

  // ===============================
  // 3. ÓRGÃOS (Estrutura Administrativa)
  // ===============================
  console.log('🏢 3. Criando Órgãos...');
  
  const secretariaSaude = await prisma.orgao.create({
    data: {
      prefeituraId: prefeituraSP.id,
      nome: 'Secretaria Municipal de Saúde',
      sigla: 'SMS',
      ativo: true,
    },
  });

  const secretariaEducacao = await prisma.orgao.create({
    data: {
      prefeituraId: prefeituraSP.id,
      nome: 'Secretaria Municipal de Educação',
      sigla: 'SME',
      ativo: true,
    },
  });

  const secretariaTransporte = await prisma.orgao.create({
    data: {
      prefeituraId: prefeituraSantos.id,
      nome: 'Secretaria Municipal de Transportes',
      sigla: 'SMT',
      ativo: true,
    },
  });

  console.log('✅ Órgãos criados: SMS, SME, SMT');

  // ===============================
  // 4. EMPRESAS (Fornecedores/Postos)
  // ===============================
  console.log('⛽ 4. Criando Empresas/Postos...');
  
  const postoShell = await prisma.empresa.create({
    data: {
      nome: 'Posto Shell - Centro',
      cnpj: '98765432000123',
      uf: 'SP',
      endereco: 'Rua das Flores, 123',
      endereco_completo: 'Rua das Flores, 123, Centro, São Paulo - SP',
      contato: 'João Silva',
      telefone: '11999999999',
      email: 'contato@postoshell.com',
      ativo: true,
      isPublic: true,
      tipo_empresa: 'POSTO_GASOLINA',
      bandeira: 'Shell',
      latitude: -23.5505,
      longitude: -46.6333,
      horario_funcionamento: '24h',
      servicos_disponiveis: 'Abastecimento, Lavagem, Conveniência',
      formas_pagamento: 'Dinheiro, Cartão, PIX',
      avaliacao: 4.5,
      total_avaliacoes: 100,
    },
  });

  const postoIpiranga = await prisma.empresa.create({
    data: {
      nome: 'Posto Ipiranga - Centro',
      cnpj: '98765432000124',
      uf: 'SP',
      endereco: 'Rua das Palmeiras, 456',
      endereco_completo: 'Rua das Palmeiras, 456, Centro, São Paulo - SP',
      contato: 'Maria Silva',
      telefone: '11977777777',
      email: 'contato@postoipiranga.com',
      ativo: true,
      isPublic: true,
      tipo_empresa: 'POSTO_GASOLINA',
      bandeira: 'Ipiranga',
      latitude: -23.5505,
      longitude: -46.6333,
      horario_funcionamento: '24h',
      servicos_disponiveis: 'Abastecimento, Lavagem, Conveniência',
      formas_pagamento: 'Dinheiro, Cartão, PIX',
      avaliacao: 4.2,
      total_avaliacoes: 50,
    },
  });

  console.log('✅ Empresas criadas:', postoShell.nome, '|', postoIpiranga.nome);

  // ===============================
  // 5. USUÁRIOS (Diferentes Perfis)
  // ===============================
  console.log('👥 5. Criando Usuários de diferentes perfis...');

  // Admin da Prefeitura SP
  const adminPrefeituraSP = await prisma.usuario.upsert({
    where: { email: 'admin@prefeitura.sp.gov.br' },
    update: {},
    create: {
      email: 'admin@prefeitura.sp.gov.br',
      senha: hashedPassword,
      nome: 'Administrador da Prefeitura SP',
      cpf: '11111111111',
      tipo_usuario: 'ADMIN_PREFEITURA',
      prefeituraId: prefeituraSP.id,
      statusAcess: 'Ativado',
      ativo: true,
      data_cadastro: new Date(),
    },
  });

  // Colaborador da Prefeitura SP
  const colaboradorPrefeitura = await prisma.usuario.upsert({
    where: { email: 'colaborador@prefeitura.sp.gov.br' },
    update: {},
    create: {
      email: 'colaborador@prefeitura.sp.gov.br',
      senha: hashedPassword,
      nome: 'Colaborador da Prefeitura SP',
      cpf: '22222222222',
      tipo_usuario: 'COLABORADOR_PREFEITURA',
      prefeituraId: prefeituraSP.id,
      statusAcess: 'Ativado',
      ativo: true,
      data_cadastro: new Date(),
    },
  });

  // Admin da Empresa Shell
  const adminEmpresaShell = await prisma.usuario.upsert({
    where: { email: 'admin@postoshell.com' },
    update: {},
    create: {
      email: 'admin@postoshell.com',
      senha: hashedPassword,
      nome: 'Administrador Posto Shell',
      cpf: '33333333333',
      tipo_usuario: 'ADMIN_EMPRESA',
      empresaId: postoShell.id,
      statusAcess: 'Ativado',
      ativo: true,
      data_cadastro: new Date(),
    },
  });

  // Colaborador da Empresa Shell
  const colaboradorEmpresa = await prisma.usuario.upsert({
    where: { email: 'colaborador@postoshell.com' },
    update: {},
    create: {
      email: 'colaborador@postoshell.com',
      senha: hashedPassword,
      nome: 'Colaborador Posto Shell',
      cpf: '44444444444',
      tipo_usuario: 'COLABORADOR_EMPRESA',
      empresaId: postoShell.id,
      statusAcess: 'Ativado',
      ativo: true,
      data_cadastro: new Date(),
    },
  });

  console.log('✅ Usuários criados: Admin Prefeitura, Colaborador Prefeitura, Admin Empresa, Colaborador Empresa');

  // ===============================
  // 6. COMBUSTÍVEIS (Produtos)
  // ===============================
  console.log('⛽ 6. Criando Combustíveis...');
  
  const gasolinaComum = await prisma.combustivel.upsert({
    where: { sigla: 'GAS_COMUM' },
    update: {},
    create: {
      nome: 'Gasolina Comum',
      sigla: 'GAS_COMUM',
      descricao: 'Gasolina comum para veículos leves',
      ativo: true,
      observacoes: 'Combustível padrão para veículos de passeio',
    },
  });

  const gasolinaAditivada = await prisma.combustivel.upsert({
    where: { sigla: 'GAS_ADITIVADA' },
    update: {},
    create: {
      nome: 'Gasolina Aditivada',
      sigla: 'GAS_ADITIVADA',
      descricao: 'Gasolina com aditivos para melhor performance',
      ativo: true,
      observacoes: 'Combustível premium com aditivos especiais',
    },
  });

  const etanol = await prisma.combustivel.upsert({
    where: { sigla: 'ETANOL' },
    update: {},
    create: {
      nome: 'Etanol',
      sigla: 'ETANOL',
      descricao: 'Etanol hidratado para veículos flex',
      ativo: true,
      observacoes: 'Combustível renovável para veículos flex',
    },
  });

  const dieselS10 = await prisma.combustivel.upsert({
    where: { sigla: 'DIESEL_S10' },
    update: {},
    create: {
      nome: 'Diesel S10',
      sigla: 'DIESEL_S10',
      descricao: 'Diesel com baixo teor de enxofre',
      ativo: true,
      observacoes: 'Diesel limpo para veículos pesados',
    },
  });

  console.log('✅ Combustíveis criados: Gasolina Comum, Gasolina Aditivada, Etanol, Diesel S10');

  // ===============================
  // 7. CATEGORIAS (Classificações)
  // ===============================
  console.log('📂 7. Criando Categorias...');
  
  const categoriaAmbulancia = await prisma.categoria.create({
    data: {
      prefeituraId: prefeituraSP.id,
      tipo_categoria: 'VEICULO',
      nome: 'Ambulâncias',
      descricao: 'Veículos de emergência médica',
      ativo: true,
    },
  });

  const categoriaAdministrativo = await prisma.categoria.create({
    data: {
      prefeituraId: prefeituraSP.id,
      tipo_categoria: 'VEICULO',
      nome: 'Veículos Administrativos',
      descricao: 'Veículos para uso administrativo',
      ativo: true,
    },
  });

  const categoriaMotoristaEmergencia = await prisma.categoria.create({
    data: {
      prefeituraId: prefeituraSP.id,
      tipo_categoria: 'MOTORISTA',
      nome: 'Motoristas de Emergência',
      descricao: 'Motoristas habilitados para veículos de emergência',
      ativo: true,
    },
  });

  console.log('✅ Categorias criadas: Ambulâncias, Veículos Administrativos, Motoristas de Emergência');

  // ===============================
  // 8. MOTORISTAS (Condutores)
  // ===============================
  console.log('🚗 8. Criando Motoristas...');
  
  const motoristaJoao = await prisma.motorista.create({
    data: {
      prefeituraId: prefeituraSP.id,
      nome: 'João Silva Santos',
      cpf: '55555555555',
      cnh: '12345678901',
      categoria_cnh: 'B',
      data_vencimento_cnh: new Date('2025-12-31'),
      telefone: '11988888888',
      email: 'joao.silva@prefeitura.sp.gov.br',
      endereco: 'Rua das Palmeiras, 456',
      ativo: true,
      observacoes: 'Motorista experiente com 15 anos de experiência',
    },
  });

  const motoristaMaria = await prisma.motorista.create({
    data: {
      prefeituraId: prefeituraSP.id,
      nome: 'Maria das Graças Oliveira',
      cpf: '66666666666',
      cnh: '98765432109',
      categoria_cnh: 'B',
      data_vencimento_cnh: new Date('2025-12-31'),
      telefone: '11955555555',
      email: 'maria.oliveira@prefeitura.sp.gov.br',
      endereco: 'Rua das Acácias, 789',
      ativo: true,
      observacoes: 'Motorista especializada em emergência',
    },
  });

  const motoristaPedro = await prisma.motorista.create({
    data: {
      prefeituraId: prefeituraSP.id,
      nome: 'Pedro Santos',
      cpf: '77777777777',
      cnh: '34567890123',
      categoria_cnh: 'B',
      data_vencimento_cnh: new Date('2025-12-31'),
      telefone: '11944444444',
      email: 'pedro.santos@prefeitura.sp.gov.br',
      endereco: 'Rua das Flores, 123',
      ativo: true,
      observacoes: 'Motorista administrativo',
    },
  });

  console.log('✅ Motoristas criados: João Silva, Maria Oliveira, Pedro Santos');

  // ===============================
  // 9. VEÍCULOS (Frota Municipal)
  // ===============================
  console.log('🚑 9. Criando Veículos...');
  
  // Ambulância 01
  const ambulancia01 = await prisma.veiculo.create({
    data: {
      prefeituraId: prefeituraSP.id,
      orgaoId: secretariaSaude.id,
      nome: 'Ambulância 01',
      placa: 'ABC1234',
      modelo: 'Ford Transit',
      ano: 2020,
      capacidade_tanque: 80.0,
      tipo_abastecimento: 'COTA',
      ativo: true,
      tipo_veiculo: 'Ambulancia',
      situacao_veiculo: 'Proprio',
      apelido: 'Ambulância da Saúde',
      ano_fabricacao: 2019,
      chassi: '9BWZZZZZZZZZZZZZ1',
      renavam: '12345678901',
      cor: 'Branco',
      capacidade_passageiros: 8,
      observacoes: 'Veículo em excelente estado de conservação',
      periodicidade: 'Semanal',
      quantidade: 100.0,
    },
  });

  // Carro Administrativo
  const carroAdmin = await prisma.veiculo.create({
    data: {
      prefeituraId: prefeituraSP.id,
      orgaoId: secretariaEducacao.id,
      nome: 'Carro Administrativo 01',
      placa: 'XYZ9999',
      modelo: 'Chevrolet Onix',
      ano: 2023,
      capacidade_tanque: 60.0,
      tipo_abastecimento: 'LIVRE',
      ativo: true,
      tipo_veiculo: 'Carro',
      situacao_veiculo: 'Proprio',
      apelido: 'Carro da Educação',
      ano_fabricacao: 2022,
      chassi: '9BWZZZZZZZZZZZZZ2',
      renavam: '98765432109',
      cor: 'Prata',
      capacidade_passageiros: 5,
      observacoes: 'Veículo para uso administrativo',
    },
  });

  // Van Social
  const vanSocial = await prisma.veiculo.create({
    data: {
      prefeituraId: prefeituraSantos.id,
      orgaoId: secretariaTransporte.id,
      nome: 'Van Social 01',
      placa: 'DEF5678',
      modelo: 'Mercedes Sprinter',
      ano: 2021,
      capacidade_tanque: 100.0,
      tipo_abastecimento: 'COM_AUTORIZACAO',
      ativo: true,
      tipo_veiculo: 'Microonibus',
      situacao_veiculo: 'Proprio',
      apelido: 'Van do Transporte',
      ano_fabricacao: 2020,
      chassi: '9BWZZZZZZZZZZZZZ3',
      renavam: '11223344556',
      cor: 'Azul',
      capacidade_passageiros: 16,
      observacoes: 'Van para transporte social',
    },
  });

  console.log('✅ Veículos criados: Ambulância 01, Carro Administrativo, Van Social');

  // Associar combustíveis aos veículos
  await prisma.veiculoCombustivel.createMany({
    data: [
      { veiculoId: ambulancia01.id, combustivelId: gasolinaComum.id, ativo: true },
      { veiculoId: ambulancia01.id, combustivelId: etanol.id, ativo: true },
      { veiculoId: carroAdmin.id, combustivelId: gasolinaComum.id, ativo: true },
      { veiculoId: carroAdmin.id, combustivelId: etanol.id, ativo: true },
      { veiculoId: vanSocial.id, combustivelId: dieselS10.id, ativo: true },
    ],
  });

  // Associar categorias aos veículos
  await prisma.veiculoCategoria.createMany({
    data: [
      { veiculoId: ambulancia01.id, categoriaId: categoriaAmbulancia.id, ativo: true },
      { veiculoId: carroAdmin.id, categoriaId: categoriaAdministrativo.id, ativo: true },
    ],
  });

  // Associar motoristas aos veículos
  await prisma.veiculoMotorista.createMany({
    data: [
      {
        veiculoId: ambulancia01.id,
        motoristaId: motoristaJoao.id,
        data_inicio: new Date(),
        ativo: true,
      },
      {
        veiculoId: ambulancia01.id,
        motoristaId: motoristaMaria.id,
        data_inicio: new Date(),
        ativo: true,
      },
      {
        veiculoId: carroAdmin.id,
        motoristaId: motoristaPedro.id,
        data_inicio: new Date(),
        ativo: true,
      },
    ],
  });

  console.log('✅ Associações criadas: Veículos ↔ Combustíveis, Categorias, Motoristas');

  // ===============================
  // 10. PROCESSOS (Licitações/Contratos)
  // ===============================
  console.log('📋 10. Criando Processos...');
  
  // Processo OBJETIVO - Completo
  const processoObjetivo = await prisma.processo.create({
    data: {
      tipo_contrato: 'OBJETIVO',
      prefeituraId: prefeituraSP.id,
      litros_desejados: 25000.0,
      valor_utilizado: 15000.0,
      valor_disponivel: 200000.0,
      numero_processo: 'PROC-2024-001',
      numero_documento: 'DOC-2024-001',
      tipo_documento: 'LICITACAO',
      tipo_itens: 'QUANTIDADE_LITROS',
      objeto: 'Aquisição de combustíveis automotivos para abastecimento da frota municipal de veículos leves e pesados, incluindo ambulâncias, caminhões de limpeza urbana, veículos administrativos e equipamentos de manutenção',
      data_abertura: new Date('2024-03-15'),
      data_encerramento: new Date('2025-03-14'),
      status: 'ATIVO',
      ativo: true,
      observacoes: 'Processo licitatório modalidade pregão eletrônico nº 001/2024. Contratação de empresa para fornecimento de combustíveis durante o período de 12 meses. Inclui: Gasolina Comum, Gasolina Aditivada, Etanol Hidratado, Diesel S10 e Diesel S500. Prazo de entrega: imediato após assinatura do contrato. Valor estimado: R$ 200.000,00.',
      arquivo_contrato: '/uploads/contratos/licitacao-001-2024.pdf',
    },
  });

  // Processo CONSORCIADO
  const processoConsorciado = await prisma.processo.create({
    data: {
      tipo_contrato: 'CONSORCIADO',
      numero_processo: 'CONS-2024-001',
      numero_documento: 'DOC-CONS-2024-001',
      tipo_documento: 'CONTRATO',
      tipo_itens: 'QUANTIDADE_LITROS',
      objeto: 'Consórcio intermunicipal para aquisição de combustíveis',
      data_abertura: new Date('2024-01-01'),
      data_encerramento: new Date('2024-12-31'),
      status: 'ATIVO',
      ativo: true,
      observacoes: 'Processo consorcial entre múltiplas prefeituras',
    },
  });

  console.log('✅ Processos criados: Processo OBJETIVO, Processo CONSORCIADO');

  // Associar combustíveis aos processos
  await prisma.processoCombustivel.createMany({
    data: [
      {
        processoId: processoObjetivo.id,
        combustivelId: gasolinaComum.id,
        quantidade_litros: 10000.0,
        valor_unitario: 5.50,
        saldo_disponivel_processo: 55000.0,
      },
      {
        processoId: processoObjetivo.id,
        combustivelId: etanol.id,
        quantidade_litros: 8000.0,
        valor_unitario: 4.20,
        saldo_disponivel_processo: 33600.0,
      },
      {
        processoId: processoObjetivo.id,
        combustivelId: dieselS10.id,
        quantidade_litros: 7000.0,
        valor_unitario: 6.10,
        saldo_disponivel_processo: 42700.0,
      },
    ],
  });

  // ===============================
  // 11. CONTRATOS (Acordos Comerciais)
  // ===============================
  console.log('📄 11. Criando Contratos...');
  
  const contratoShell = await prisma.contrato.create({
    data: {
      empresaId: postoShell.id,
      empresa_contratante: 'Nordev',
      empresa_contratada: 'Posto Shell - Centro',
      title: 'Contrato de Fornecimento de Combustíveis Shell',
      cnpj_empresa: '98765432000123',
      vigencia_inicio: new Date('2024-01-01'),
      vigencia_fim: new Date('2024-12-31'),
      ativo: true,
      anexo_contrato: 'contrato_shell_2024.pdf',
      anexo_contrato_assinado: 'contrato_shell_2024_assinado.pdf',
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  });

  const contratoIpiranga = await prisma.contrato.create({
    data: {
      empresaId: postoIpiranga.id,
      empresa_contratante: 'Nordev',
      empresa_contratada: 'Posto Ipiranga - Centro',
      title: 'Contrato de Fornecimento de Combustíveis Ipiranga',
      cnpj_empresa: '98765432000124',
      vigencia_inicio: new Date('2024-01-01'),
      vigencia_fim: new Date('2024-12-31'),
      ativo: true,
      anexo_contrato: 'contrato_ipiranga_2024.pdf',
      anexo_contrato_assinado: 'contrato_ipiranga_2024_assinado.pdf',
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  });

  console.log('✅ Contratos criados: Contrato Shell, Contrato Ipiranga');

  // Associar combustíveis aos contratos
  await prisma.contratoCombustivel.createMany({
    data: [
      { contratoId: contratoShell.id, combustivelId: gasolinaComum.id, ativo: true },
      { contratoId: contratoShell.id, combustivelId: gasolinaAditivada.id, ativo: true },
      { contratoId: contratoShell.id, combustivelId: etanol.id, ativo: true },
      { contratoId: contratoIpiranga.id, combustivelId: gasolinaComum.id, ativo: true },
      { contratoId: contratoIpiranga.id, combustivelId: dieselS10.id, ativo: true },
    ],
  });

  // ===============================
  // 12. COTAS DE ÓRGÃO (Controle de Consumo)
  // ===============================
  console.log('📊 12. Criando Cotas de Órgão...');
  
  await prisma.cotaOrgao.createMany({
    data: [
      {
        processoId: processoObjetivo.id,
        orgaoId: secretariaSaude.id,
        combustivelId: gasolinaComum.id,
        quantidade: 5000.0,
        quantidade_utilizada: 1500.0,
        restante: 3500.0,
        saldo_disponivel_cota: 19250.0,
        ativa: true,
      },
      {
        processoId: processoObjetivo.id,
        orgaoId: secretariaSaude.id,
        combustivelId: etanol.id,
        quantidade: 3000.0,
        quantidade_utilizada: 800.0,
        restante: 2200.0,
        saldo_disponivel_cota: 9240.0,
        ativa: true,
      },
      {
        processoId: processoObjetivo.id,
        orgaoId: secretariaEducacao.id,
        combustivelId: gasolinaComum.id,
        quantidade: 2500.0,
        quantidade_utilizada: 600.0,
        restante: 1900.0,
        saldo_disponivel_cota: 10450.0,
        ativa: true,
      },
    ],
  });

  console.log('✅ Cotas de Órgão criadas para Saúde e Educação');

  // ===============================
  // 13. ABASTECIMENTOS (Histórico de Consumo)
  // ===============================
  console.log('⛽ 13. Criando Abastecimentos...');
  
  await prisma.abastecimento.createMany({
    data: [
      {
        veiculoId: ambulancia01.id,
        motoristaId: motoristaJoao.id,
        combustivelId: gasolinaComum.id,
        empresaId: postoShell.id,
        solicitanteId: adminPrefeituraSP.id,
        tipo_abastecimento: 'COM_COTA',
        quantidade: 50.5,
        preco_anp: 5.50,
        preco_empresa: 5.45,
        desconto: 0.05,
        valor_total: 275.25,
        data_abastecimento: new Date('2024-01-15T10:30:00.000Z'),
        odometro: 50000,
        orimetro: 1000,
        status: 'Aprovado',
        abastecido_por: 'João Silva',
        nfe_chave_acesso: '12345678901234567890123456789012345678901234',
        nfe_img_url: 'https://exemplo.com/nfe.jpg',
        nfe_link: 'https://exemplo.com/nfe',
        ativo: true,
        data_aprovacao: new Date('2024-01-15T12:00:00.000Z'),
        aprovado_por: 'Admin Prefeitura',
        aprovado_por_email: 'admin@prefeitura.sp.gov.br',
      },
      {
        veiculoId: carroAdmin.id,
        motoristaId: motoristaPedro.id,
        combustivelId: etanol.id,
        empresaId: postoIpiranga.id,
        solicitanteId: colaboradorPrefeitura.id,
        tipo_abastecimento: 'LIVRE',
        quantidade: 30.0,
        preco_anp: 4.20,
        preco_empresa: 4.15,
        desconto: 0.05,
        valor_total: 124.50,
        data_abastecimento: new Date('2024-01-16T14:20:00.000Z'),
        odometro: 25000,
        orimetro: 500,
        status: 'Aprovado',
        abastecido_por: 'Maria Silva',
        nfe_chave_acesso: '98765432109876543210987654321098765432109876',
        nfe_img_url: 'https://exemplo.com/nfe2.jpg',
        nfe_link: 'https://exemplo.com/nfe2',
        ativo: true,
        data_aprovacao: new Date('2024-01-16T16:00:00.000Z'),
        aprovado_por: 'Admin Prefeitura',
        aprovado_por_email: 'admin@prefeitura.sp.gov.br',
      },
    ],
  });

  console.log('✅ Abastecimentos criados: Ambulância e Carro Administrativo');

  // ===============================
  // 14. VINCULAÇÃO USUÁRIO-ÓRGÃO
  // ===============================
  console.log('🔗 14. Criando vinculações Usuário-Órgão...');
  
  await prisma.usuarioOrgao.createMany({
    data: [
      {
        usuarioId: colaboradorPrefeitura.id,
        orgaoId: secretariaSaude.id,
        ativo: true,
      },
      {
        usuarioId: colaboradorPrefeitura.id,
        orgaoId: secretariaEducacao.id,
        ativo: true,
      },
    ],
  });

  console.log('✅ Vinculações criadas: Colaborador ↔ Saúde e Educação');

  // ===============================
  // 15. CONTAS DE FATURAMENTO
  // ===============================
  console.log('💰 15. Criando Contas de Faturamento...');
  
  const contaFaturamentoSaude = await prisma.contaFaturamentoOrgao.create({
    data: {
      prefeituraId: prefeituraSP.id,
      orgaoId: secretariaSaude.id,
      nome: 'Conta Faturamento Saúde',
      descricao: 'Conta para faturamento dos gastos da Secretaria de Saúde',
    },
  });

  const contaFaturamentoEducacao = await prisma.contaFaturamentoOrgao.create({
    data: {
      prefeituraId: prefeituraSP.id,
      orgaoId: secretariaEducacao.id,
      nome: 'Conta Faturamento Educação',
      descricao: 'Conta para faturamento dos gastos da Secretaria de Educação',
    },
  });

  console.log('✅ Contas de Faturamento criadas: Saúde e Educação');

  // ===============================
  // RESUMO FINAL
  // ===============================
  console.log('\n🎉 ========================================');
  console.log('🎉 SEED SUPER_ADMIN CONCLUÍDO COM SUCESSO!');
  console.log('🎉 ========================================\n');

  console.log('📊 RESUMO DOS DADOS CRIADOS:');
  console.log('👑 1 Super Admin');
  console.log('🏛️ 2 Prefeituras (São Paulo, Santos)');
  console.log('🏢 3 Órgãos (Saúde, Educação, Transporte)');
  console.log('⛽ 2 Empresas/Postos (Shell, Ipiranga)');
  console.log('👥 5 Usuários (diferentes perfis)');
  console.log('🔥 4 Combustíveis (Gasolina, Etanol, Diesel)');
  console.log('📂 3 Categorias (Ambulâncias, Administrativos, Motoristas)');
  console.log('🚗 3 Motoristas');
  console.log('🚑 3 Veículos (Ambulância, Carro, Van)');
  console.log('📋 2 Processos (OBJETIVO, CONSORCIADO)');
  console.log('📄 2 Contratos (Shell, Ipiranga)');
  console.log('📊 3 Cotas de Órgão');
  console.log('⛽ 2 Abastecimentos');
  console.log('💰 2 Contas de Faturamento');
  console.log('🔗 Múltiplas associações e relacionamentos');

  console.log('\n🔐 CREDENCIAIS DE ACESSO:');
  console.log('📧 Email: superadmin@nordev.com');
  console.log('🔑 Senha: 123456');
  console.log('👑 Tipo: SUPER_ADMIN');

  console.log('\n🌐 ACESSO AO SISTEMA:');
  console.log('🚀 API: http://localhost:3000');
  console.log('📚 Documentação: http://localhost:3000/api/docs');

  console.log('\n✨ O SUPER_ADMIN tem acesso completo a todos os módulos!');
}

main()
  .catch((e) => {
    console.error('❌ Erro durante o seed SUPER_ADMIN:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    console.log('🔌 Conexão com banco de dados encerrada.');
  });

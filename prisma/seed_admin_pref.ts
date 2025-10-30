import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Iniciando seed para ADMIN_PREFEITURA...');
  console.log('🏛️ Demonstrando todos os módulos acessíveis ao ADMIN_PREFEITURA');

  // Hash das senhas
  const hashedPassword = await bcrypt.hash('123456', 12);

  // ===============================
  // 1. PREFEITURA (Sua Administração)
  // ===============================
  console.log('🏛️ 1. Criando Prefeitura Municipal...');
  const prefeitura = await prisma.prefeitura.upsert({
    where: { cnpj: '15555666000190' },
    update: {},
    create: {
      nome: 'Prefeitura Municipal de Campinas',
      cnpj: '15555666000190',
      email_administrativo: 'admin@campinas.sp.gov.br',
      ativo: true,
      data_cadastro: new Date(),
      requer_cupom_fiscal: true,
    },
  });
  console.log('✅ Prefeitura criada:', prefeitura.nome);

  // ===============================
  // 2. ADMIN PREFEITURA (Usuário Principal)
  // ===============================
  console.log('👑 2. Criando Admin da Prefeitura...');
  const adminPrefeitura = await prisma.usuario.upsert({
    where: { email: 'admin@campinas.sp.gov.br' },
    update: {},
    create: {
      email: 'admin@campinas.sp.gov.br',
      senha: hashedPassword,
      nome: 'Carlos Eduardo Silva',
      cpf: '12345678901',
      tipo_usuario: 'ADMIN_PREFEITURA',
      prefeituraId: prefeitura.id,
      statusAcess: 'Ativado',
      ativo: true,
      data_cadastro: new Date(),
      phone: '19987654321',
    },
  });
  console.log('✅ Admin Prefeitura criado:', adminPrefeitura.email);

  // ===============================
  // 3. ÓRGÃOS (Estrutura Administrativa)
  // ===============================
  console.log('🏢 3. Criando Órgãos da Prefeitura...');
  
  const secretariaSaude = await prisma.orgao.create({
    data: {
      prefeituraId: prefeitura.id,
      nome: 'Secretaria Municipal de Saúde',
      sigla: 'SMS',
      ativo: true,
    },
  });

  const secretariaEducacao = await prisma.orgao.create({
    data: {
      prefeituraId: prefeitura.id,
      nome: 'Secretaria Municipal de Educação',
      sigla: 'SME',
      ativo: true,
    },
  });

  const secretariaObras = await prisma.orgao.create({
    data: {
      prefeituraId: prefeitura.id,
      nome: 'Secretaria Municipal de Obras',
      sigla: 'SMO',
      ativo: true,
    },
  });

  const secretariaAssistencia = await prisma.orgao.create({
    data: {
      prefeituraId: prefeitura.id,
      nome: 'Secretaria de Assistência Social',
      sigla: 'SAS',
      ativo: true,
    },
  });

  const gabinetePrefeito = await prisma.orgao.create({
    data: {
      prefeituraId: prefeitura.id,
      nome: 'Gabinete do Prefeito',
      sigla: 'GAB',
      ativo: true,
    },
  });

  console.log('✅ Órgãos criados: SMS, SME, SMO, SAS, GAB');

  // ===============================
  // 4. USUÁRIOS DA PREFEITURA (Equipe)
  // ===============================
  console.log('👥 4. Criando Usuários da Prefeitura...');

  // Colaborador da Saúde
  const colaboradorSaude = await prisma.usuario.upsert({
    where: { email: 'colaborador.saude@campinas.sp.gov.br' },
    update: {},
    create: {
      email: 'colaborador.saude@campinas.sp.gov.br',
      senha: hashedPassword,
      nome: 'Ana Paula Santos',
      cpf: '23456789012',
      tipo_usuario: 'COLABORADOR_PREFEITURA',
      prefeituraId: prefeitura.id,
      statusAcess: 'Ativado',
      ativo: true,
      data_cadastro: new Date(),
      phone: '19988887777',
    },
  });

  // Colaborador da Educação
  const colaboradorEducacao = await prisma.usuario.upsert({
    where: { email: 'colaborador.educacao@campinas.sp.gov.br' },
    update: {},
    create: {
      email: 'colaborador.educacao@campinas.sp.gov.br',
      senha: hashedPassword,
      nome: 'José Roberto Lima',
      cpf: '34567890123',
      tipo_usuario: 'COLABORADOR_PREFEITURA',
      prefeituraId: prefeitura.id,
      statusAcess: 'Ativado',
      ativo: true,
      data_cadastro: new Date(),
      phone: '19977776666',
    },
  });

  // Colaborador de Obras
  const colaboradorObras = await prisma.usuario.upsert({
    where: { email: 'colaborador.obras@campinas.sp.gov.br' },
    update: {},
    create: {
      email: 'colaborador.obras@campinas.sp.gov.br',
      senha: hashedPassword,
      nome: 'Miguel Fernandes',
      cpf: '45678901234',
      tipo_usuario: 'COLABORADOR_PREFEITURA',
      prefeituraId: prefeitura.id,
      statusAcess: 'Ativado',
      ativo: true,
      data_cadastro: new Date(),
      phone: '19966665555',
    },
  });

  // Colaborador de Assistência Social
  const colaboradorAssistencia = await prisma.usuario.upsert({
    where: { email: 'colaborador.assistencia@campinas.sp.gov.br' },
    update: {},
    create: {
      email: 'colaborador.assistencia@campinas.sp.gov.br',
      senha: hashedPassword,
      nome: 'Maria Aparecida Costa',
      cpf: '56789012345',
      tipo_usuario: 'COLABORADOR_PREFEITURA',
      prefeituraId: prefeitura.id,
      statusAcess: 'Ativado',
      ativo: true,
      data_cadastro: new Date(),
      phone: '19955554444',
    },
  });

  console.log('✅ Colaboradores criados: Saúde, Educação, Obras, Assistência');

  // ===============================
  // 5. CATEGORIAS (Classificações Internas)
  // ===============================
  console.log('📂 5. Criando Categorias da Prefeitura...');
  
  const categoriaAmbulancia = await prisma.categoria.create({
    data: {
      prefeituraId: prefeitura.id,
      tipo_categoria: 'VEICULO',
      nome: 'Ambulâncias',
      descricao: 'Veículos de emergência médica e transporte de pacientes',
      ativo: true,
    },
  });

  const categoriaEscolar = await prisma.categoria.create({
    data: {
      prefeituraId: prefeitura.id,
      tipo_categoria: 'VEICULO',
      nome: 'Transporte Escolar',
      descricao: 'Veículos para transporte de estudantes',
      ativo: true,
    },
  });

  const categoriaObras = await prisma.categoria.create({
    data: {
      prefeituraId: prefeitura.id,
      tipo_categoria: 'VEICULO',
      nome: 'Veículos de Obras',
      descricao: 'Caminhões, tratores e máquinas pesadas',
      ativo: true,
    },
  });

  const categoriaAdministrativo = await prisma.categoria.create({
    data: {
      prefeituraId: prefeitura.id,
      tipo_categoria: 'VEICULO',
      nome: 'Administrativos',
      descricao: 'Carros para uso administrativo',
      ativo: true,
    },
  });

  const categoriaMotoristaEmergencia = await prisma.categoria.create({
    data: {
      prefeituraId: prefeitura.id,
      tipo_categoria: 'MOTORISTA',
      nome: 'Motoristas de Emergência',
      descricao: 'Condutores habilitados para veículos de emergência',
      ativo: true,
    },
  });

  const categoriaMotoristaEscolar = await prisma.categoria.create({
    data: {
      prefeituraId: prefeitura.id,
      tipo_categoria: 'MOTORISTA',
      nome: 'Motoristas Escolares',
      descricao: 'Condutores especializados em transporte escolar',
      ativo: true,
    },
  });

  console.log('✅ Categorias criadas: Ambulâncias, Escolar, Obras, Administrativos, Motoristas');

  // ===============================
  // 6. MOTORISTAS (Condutores da Prefeitura)
  // ===============================
  console.log('🚗 6. Criando Motoristas da Prefeitura...');
  
  const motoristaJoao = await prisma.motorista.create({
    data: {
      prefeituraId: prefeitura.id,
      nome: 'João Carlos da Silva',
      cpf: '11122233344',
      cnh: '12345678901',
      categoria_cnh: 'D',
      data_vencimento_cnh: new Date('2025-12-31'),
      telefone: '19988881111',
      email: 'joao.silva@campinas.sp.gov.br',
      endereco: 'Rua das Amoreiras, 123 - Campinas/SP',
      ativo: true,
      observacoes: 'Motorista experiente com 20 anos, especializado em ambulâncias',
    },
  });

  const motoristaMaria = await prisma.motorista.create({
    data: {
      prefeituraId: prefeitura.id,
      nome: 'Maria José Santos',
      cpf: '22233344455',
      cnh: '23456789012',
      categoria_cnh: 'D',
      data_vencimento_cnh: new Date('2025-06-30'),
      telefone: '19977772222',
      email: 'maria.santos@campinas.sp.gov.br',
      endereco: 'Av. Brasil, 456 - Campinas/SP',
      ativo: true,
      observacoes: 'Motorista especializada em transporte escolar, curso de primeiros socorros',
    },
  });

  const motoristaPedro = await prisma.motorista.create({
    data: {
      prefeituraId: prefeitura.id,
      nome: 'Pedro Henrique Costa',
      cpf: '33344455566',
      cnh: '34567890123',
      categoria_cnh: 'E',
      data_vencimento_cnh: new Date('2025-09-15'),
      telefone: '19966663333',
      email: 'pedro.costa@campinas.sp.gov.br',
      endereco: 'Rua das Flores, 789 - Campinas/SP',
      ativo: true,
      observacoes: 'Motorista de máquinas pesadas, 15 anos de experiência em obras públicas',
    },
  });

  const motoristaCarlos = await prisma.motorista.create({
    data: {
      prefeituraId: prefeitura.id,
      nome: 'Carlos Alberto Ferreira',
      cpf: '44455566677',
      cnh: '45678901234',
      categoria_cnh: 'B',
      data_vencimento_cnh: new Date('2025-03-20'),
      telefone: '19955554444',
      email: 'carlos.ferreira@campinas.sp.gov.br',
      endereco: 'Rua da Paz, 321 - Campinas/SP',
      ativo: true,
      observacoes: 'Motorista administrativo, responsável pelo gabinete',
    },
  });

  console.log('✅ Motoristas criados: João (Emergência), Maria (Escolar), Pedro (Obras), Carlos (Admin)');

  // ===============================
  // 7. VEÍCULOS (Frota Municipal)
  // ===============================
  console.log('🚑 7. Criando Frota de Veículos...');

  // Obter combustíveis existentes (criados pelo super admin ou seed anterior)
  let gasolinaComum = await prisma.combustivel.findUnique({ where: { sigla: 'GAS_COMUM' } });
  let etanol = await prisma.combustivel.findUnique({ where: { sigla: 'ETANOL' } });
  let dieselS10 = await prisma.combustivel.findUnique({ where: { sigla: 'DIESEL_S10' } });

  // Se não existirem, criar combustíveis básicos
  if (!gasolinaComum) {
    gasolinaComum = await prisma.combustivel.create({
      data: {
        nome: 'Gasolina Comum',
        sigla: 'GAS_COMUM',
        descricao: 'Gasolina comum para veículos leves',
        ativo: true,
      },
    });
  }

  if (!etanol) {
    etanol = await prisma.combustivel.create({
      data: {
        nome: 'Etanol',
        sigla: 'ETANOL',
        descricao: 'Etanol hidratado para veículos flex',
        ativo: true,
      },
    });
  }

  if (!dieselS10) {
    dieselS10 = await prisma.combustivel.create({
      data: {
        nome: 'Diesel S10',
        sigla: 'DIESEL_S10',
        descricao: 'Diesel com baixo teor de enxofre',
        ativo: true,
      },
    });
  }

  // Ambulância UTI
  const ambulanciaUTI = await prisma.veiculo.create({
    data: {
      prefeituraId: prefeitura.id,
      orgaoId: secretariaSaude.id,
      nome: 'Ambulância UTI 01',
      placa: 'CAM1234',
      modelo: 'Mercedes Sprinter 415',
      ano: 2021,
      capacidade_tanque: 100.0,
      tipo_abastecimento: 'COTA',
      ativo: true,
      tipo_veiculo: 'Ambulancia',
      situacao_veiculo: 'Proprio',
      apelido: 'UTI Móvel',
      ano_fabricacao: 2020,
      chassi: '9BM979045N123456',
      renavam: '11111111111',
      cor: 'Branco',
      capacidade_passageiros: 3,
      observacoes: 'Ambulância UTI equipada com desfibrilador, respirador e equipamentos de suporte avançado',
      periodicidade: 'Semanal',
      quantidade: 200.0,
    },
  });

  // Ambulância Básica
  const ambulanciaBasica = await prisma.veiculo.create({
    data: {
      prefeituraId: prefeitura.id,
      orgaoId: secretariaSaude.id,
      nome: 'Ambulância Básica 01',
      placa: 'CAM5678',
      modelo: 'Fiat Ducato',
      ano: 2020,
      capacidade_tanque: 90.0,
      tipo_abastecimento: 'COTA',
      ativo: true,
      tipo_veiculo: 'Ambulancia',
      situacao_veiculo: 'Proprio',
      apelido: 'Básica 01',
      ano_fabricacao: 2019,
      chassi: '9BD21806AL123456',
      renavam: '22222222222',
      cor: 'Branco',
      capacidade_passageiros: 4,
      observacoes: 'Ambulância básica para transporte de pacientes estáveis',
      periodicidade: 'Semanal',
      quantidade: 150.0,
    },
  });

  // Micro-ônibus Escolar
  const microonibusEscolar = await prisma.veiculo.create({
    data: {
      prefeituraId: prefeitura.id,
      orgaoId: secretariaEducacao.id,
      nome: 'Micro-ônibus Escolar 01',
      placa: 'CAM9012',
      modelo: 'Iveco Daily',
      ano: 2022,
      capacidade_tanque: 120.0,
      tipo_abastecimento: 'COTA',
      ativo: true,
      tipo_veiculo: 'Microonibus',
      situacao_veiculo: 'Proprio',
      apelido: 'Escolar 01',
      ano_fabricacao: 2021,
      chassi: '9BM33C20C123456',
      renavam: '33333333333',
      cor: 'Amarelo',
      capacidade_passageiros: 25,
      observacoes: 'Micro-ônibus equipado com cintos de segurança e sistema de rastreamento',
      periodicidade: 'Semanal',
      quantidade: 300.0,
    },
  });

  // Caminhão de Obras
  const caminhaoObras = await prisma.veiculo.create({
    data: {
      prefeituraId: prefeitura.id,
      orgaoId: secretariaObras.id,
      nome: 'Caminhão Basculante 01',
      placa: 'CAM3456',
      modelo: 'Volkswagen Constellation',
      ano: 2019,
      capacidade_tanque: 200.0,
      tipo_abastecimento: 'COTA',
      ativo: true,
      tipo_veiculo: 'Caminhao',
      situacao_veiculo: 'Proprio',
      apelido: 'Basculante 01',
      ano_fabricacao: 2018,
      chassi: '9BW2ZEE123456',
      renavam: '44444444444',
      cor: 'Azul',
      capacidade_passageiros: 3,
      observacoes: 'Caminhão basculante para obras e limpeza urbana',
      periodicidade: 'Semanal',
      quantidade: 400.0,
    },
  });

  // Van Assistência Social
  const vanAssistencia = await prisma.veiculo.create({
    data: {
      prefeituraId: prefeitura.id,
      orgaoId: secretariaAssistencia.id,
      nome: 'Van Assistência Social 01',
      placa: 'CAM7890',
      modelo: 'Renault Master',
      ano: 2021,
      capacidade_tanque: 80.0,
      tipo_abastecimento: 'LIVRE',
      ativo: true,
      tipo_veiculo: 'Microonibus',
      situacao_veiculo: 'Proprio',
      apelido: 'Van Social',
      ano_fabricacao: 2020,
      chassi: '93Y4URC85123456',
      renavam: '55555555555',
      cor: 'Branco',
      capacidade_passageiros: 14,
      observacoes: 'Van para atendimento domiciliar e transporte de idosos',
    },
  });

  // Carro Administrativo
  const carroAdmin = await prisma.veiculo.create({
    data: {
      prefeituraId: prefeitura.id,
      orgaoId: gabinetePrefeito.id,
      nome: 'Carro Administrativo 01',
      placa: 'CAM2468',
      modelo: 'Honda Civic',
      ano: 2023,
      capacidade_tanque: 50.0,
      tipo_abastecimento: 'COM_AUTORIZACAO',
      ativo: true,
      tipo_veiculo: 'Carro',
      situacao_veiculo: 'Proprio',
      apelido: 'Civic do Gabinete',
      ano_fabricacao: 2022,
      chassi: '9BWHE51030123456',
      renavam: '66666666666',
      cor: 'Preto',
      capacidade_passageiros: 5,
      observacoes: 'Veículo executivo para uso do gabinete',
    },
  });

  console.log('✅ Veículos criados: 2 Ambulâncias, 1 Micro-ônibus, 1 Caminhão, 1 Van, 1 Carro');

  // Associar combustíveis aos veículos
  await prisma.veiculoCombustivel.createMany({
    data: [
      // Ambulâncias - Diesel
      { veiculoId: ambulanciaUTI.id, combustivelId: dieselS10.id, ativo: true },
      { veiculoId: ambulanciaBasica.id, combustivelId: dieselS10.id, ativo: true },
      // Micro-ônibus - Diesel
      { veiculoId: microonibusEscolar.id, combustivelId: dieselS10.id, ativo: true },
      // Caminhão - Diesel
      { veiculoId: caminhaoObras.id, combustivelId: dieselS10.id, ativo: true },
      // Van - Gasolina/Etanol
      { veiculoId: vanAssistencia.id, combustivelId: gasolinaComum.id, ativo: true },
      { veiculoId: vanAssistencia.id, combustivelId: etanol.id, ativo: true },
      // Carro - Gasolina/Etanol
      { veiculoId: carroAdmin.id, combustivelId: gasolinaComum.id, ativo: true },
      { veiculoId: carroAdmin.id, combustivelId: etanol.id, ativo: true },
    ],
  });

  // Associar categorias aos veículos
  await prisma.veiculoCategoria.createMany({
    data: [
      { veiculoId: ambulanciaUTI.id, categoriaId: categoriaAmbulancia.id, ativo: true },
      { veiculoId: ambulanciaBasica.id, categoriaId: categoriaAmbulancia.id, ativo: true },
      { veiculoId: microonibusEscolar.id, categoriaId: categoriaEscolar.id, ativo: true },
      { veiculoId: caminhaoObras.id, categoriaId: categoriaObras.id, ativo: true },
      { veiculoId: vanAssistencia.id, categoriaId: categoriaAdministrativo.id, ativo: true },
      { veiculoId: carroAdmin.id, categoriaId: categoriaAdministrativo.id, ativo: true },
    ],
  });

  // Associar motoristas aos veículos
  await prisma.veiculoMotorista.createMany({
    data: [
      // João - Ambulâncias
      { veiculoId: ambulanciaUTI.id, motoristaId: motoristaJoao.id, data_inicio: new Date(), ativo: true },
      { veiculoId: ambulanciaBasica.id, motoristaId: motoristaJoao.id, data_inicio: new Date(), ativo: true },
      // Maria - Escolar
      { veiculoId: microonibusEscolar.id, motoristaId: motoristaMaria.id, data_inicio: new Date(), ativo: true },
      // Pedro - Obras
      { veiculoId: caminhaoObras.id, motoristaId: motoristaPedro.id, data_inicio: new Date(), ativo: true },
      // Carlos - Administrativos
      { veiculoId: vanAssistencia.id, motoristaId: motoristaCarlos.id, data_inicio: new Date(), ativo: true },
      { veiculoId: carroAdmin.id, motoristaId: motoristaCarlos.id, data_inicio: new Date(), ativo: true },
    ],
  });

  console.log('✅ Associações criadas: Veículos ↔ Combustíveis, Categorias, Motoristas');

  // ===============================
  // 8. VINCULAÇÕES USUÁRIO-ÓRGÃO
  // ===============================
  console.log('🔗 8. Criando Vinculações Usuário-Órgão...');
  
  await prisma.usuarioOrgao.createMany({
    data: [
      // Ana Paula - Saúde
      { usuarioId: colaboradorSaude.id, orgaoId: secretariaSaude.id, ativo: true },
      // José Roberto - Educação
      { usuarioId: colaboradorEducacao.id, orgaoId: secretariaEducacao.id, ativo: true },
      // Miguel - Obras
      { usuarioId: colaboradorObras.id, orgaoId: secretariaObras.id, ativo: true },
      // Maria Aparecida - Assistência
      { usuarioId: colaboradorAssistencia.id, orgaoId: secretariaAssistencia.id, ativo: true },
      // Admin pode acessar todos os órgãos
      { usuarioId: adminPrefeitura.id, orgaoId: secretariaSaude.id, ativo: true },
      { usuarioId: adminPrefeitura.id, orgaoId: secretariaEducacao.id, ativo: true },
      { usuarioId: adminPrefeitura.id, orgaoId: secretariaObras.id, ativo: true },
      { usuarioId: adminPrefeitura.id, orgaoId: secretariaAssistencia.id, ativo: true },
      { usuarioId: adminPrefeitura.id, orgaoId: gabinetePrefeito.id, ativo: true },
    ],
  });

  console.log('✅ Vinculações criadas: Colaboradores ↔ Órgãos específicos, Admin ↔ Todos órgãos');

  // ===============================
  // 9. CONTAS DE FATURAMENTO
  // ===============================
  console.log('💰 9. Criando Contas de Faturamento por Órgão...');
  
  const contaFatSaude = await prisma.contaFaturamentoOrgao.create({
    data: {
      prefeituraId: prefeitura.id,
      orgaoId: secretariaSaude.id,
      nome: 'Conta Faturamento Saúde',
      descricao: 'Conta para controle de gastos com combustível da Secretaria de Saúde',
    },
  });

  const contaFatEducacao = await prisma.contaFaturamentoOrgao.create({
    data: {
      prefeituraId: prefeitura.id,
      orgaoId: secretariaEducacao.id,
      nome: 'Conta Faturamento Educação',
      descricao: 'Conta para controle de gastos com combustível da Secretaria de Educação',
    },
  });

  const contaFatObras = await prisma.contaFaturamentoOrgao.create({
    data: {
      prefeituraId: prefeitura.id,
      orgaoId: secretariaObras.id,
      nome: 'Conta Faturamento Obras',
      descricao: 'Conta para controle de gastos com combustível da Secretaria de Obras',
    },
  });

  const contaFatAssistencia = await prisma.contaFaturamentoOrgao.create({
    data: {
      prefeituraId: prefeitura.id,
      orgaoId: secretariaAssistencia.id,
      nome: 'Conta Faturamento Assistência',
      descricao: 'Conta para controle de gastos com combustível da Secretaria de Assistência Social',
    },
  });

  const contaFatGabinete = await prisma.contaFaturamentoOrgao.create({
    data: {
      prefeituraId: prefeitura.id,
      orgaoId: gabinetePrefeito.id,
      nome: 'Conta Faturamento Gabinete',
      descricao: 'Conta para controle de gastos com combustível do Gabinete do Prefeito',
    },
  });

  console.log('✅ Contas de Faturamento criadas: Saúde, Educação, Obras, Assistência, Gabinete');

  // ===============================
  // 10. PROCESSO LICITATÓRIO
  // ===============================
  console.log('📋 10. Criando Processo Licitatório da Prefeitura...');
  
  const processoMunicipal = await prisma.processo.create({
    data: {
      tipo_contrato: 'OBJETIVO',
      prefeituraId: prefeitura.id,
      litros_desejados: 50000.0,
      valor_utilizado: 25000.0,
      valor_disponivel: 400000.0,
      numero_processo: 'PROC-CAMP-2024-001',
      numero_documento: 'LICIT-CAMP-2024-001',
      tipo_documento: 'LICITACAO',
      tipo_itens: 'QUANTIDADE_LITROS',
      objeto: 'Contratação de empresa para fornecimento de combustíveis automotivos (gasolina comum, etanol hidratado e diesel S10) para abastecimento da frota municipal de veículos da Prefeitura Municipal de Campinas, incluindo ambulâncias, veículos escolares, máquinas de obras públicas e veículos administrativos',
      data_abertura: new Date('2024-01-15'),
      data_encerramento: new Date('2024-12-31'),
      status: 'ATIVO',
      ativo: true,
      observacoes: 'Processo licitatório modalidade pregão eletrônico nº 001/2024 da Prefeitura Municipal de Campinas. Estimativa anual de consumo: 50.000 litros. Valor máximo estimado: R$ 400.000,00. Prazo de entrega: imediato após ordem de fornecimento. Vigência: 12 meses com possibilidade de prorrogação.',
      arquivo_contrato: '/uploads/contratos/licitacao-campinas-001-2024.pdf',
    },
  });

  console.log('✅ Processo Municipal criado:', processoMunicipal.numero_processo);

  // Associar combustíveis ao processo
  await prisma.processoCombustivel.createMany({
    data: [
      {
        processoId: processoMunicipal.id,
        combustivelId: gasolinaComum.id,
        quantidade_litros: 15000.0,
        valor_unitario: 5.80,
        saldo_disponivel_processo: 87000.0,
      },
      {
        processoId: processoMunicipal.id,
        combustivelId: etanol.id,
        quantidade_litros: 10000.0,
        valor_unitario: 4.50,
        saldo_disponivel_processo: 45000.0,
      },
      {
        processoId: processoMunicipal.id,
        combustivelId: dieselS10.id,
        quantidade_litros: 25000.0,
        valor_unitario: 6.20,
        saldo_disponivel_processo: 155000.0,
      },
    ],
  });

  // ===============================
  // 11. COTAS POR ÓRGÃO
  // ===============================
  console.log('📊 11. Criando Cotas de Combustível por Órgão...');
  
  await prisma.cotaOrgao.createMany({
    data: [
      // Secretaria de Saúde - Diesel para ambulâncias
      {
        processoId: processoMunicipal.id,
        orgaoId: secretariaSaude.id,
        combustivelId: dieselS10.id,
        quantidade: 10000.0,
        quantidade_utilizada: 2500.0,
        restante: 7500.0,
        saldo_disponivel_cota: 46500.0,
        ativa: true,
      },
      // Secretaria de Educação - Diesel para transporte escolar
      {
        processoId: processoMunicipal.id,
        orgaoId: secretariaEducacao.id,
        combustivelId: dieselS10.id,
        quantidade: 8000.0,
        quantidade_utilizada: 1800.0,
        restante: 6200.0,
        saldo_disponivel_cota: 38440.0,
        ativa: true,
      },
      // Secretaria de Obras - Diesel para máquinas
      {
        processoId: processoMunicipal.id,
        orgaoId: secretariaObras.id,
        combustivelId: dieselS10.id,
        quantidade: 7000.0,
        quantidade_utilizada: 3200.0,
        restante: 3800.0,
        saldo_disponivel_cota: 23560.0,
        ativa: true,
      },
      // Secretaria de Assistência - Gasolina para van
      {
        processoId: processoMunicipal.id,
        orgaoId: secretariaAssistencia.id,
        combustivelId: gasolinaComum.id,
        quantidade: 3000.0,
        quantidade_utilizada: 800.0,
        restante: 2200.0,
        saldo_disponivel_cota: 12760.0,
        ativa: true,
      },
      // Secretaria de Assistência - Etanol para van
      {
        processoId: processoMunicipal.id,
        orgaoId: secretariaAssistencia.id,
        combustivelId: etanol.id,
        quantidade: 2000.0,
        quantidade_utilizada: 400.0,
        restante: 1600.0,
        saldo_disponivel_cota: 7200.0,
        ativa: true,
      },
      // Gabinete - Gasolina para carro administrativo
      {
        processoId: processoMunicipal.id,
        orgaoId: gabinetePrefeito.id,
        combustivelId: gasolinaComum.id,
        quantidade: 1500.0,
        quantidade_utilizada: 300.0,
        restante: 1200.0,
        saldo_disponivel_cota: 6960.0,
        ativa: true,
      },
      // Gabinete - Etanol para carro administrativo
      {
        processoId: processoMunicipal.id,
        orgaoId: gabinetePrefeito.id,
        combustivelId: etanol.id,
        quantidade: 1000.0,
        quantidade_utilizada: 150.0,
        restante: 850.0,
        saldo_disponivel_cota: 3825.0,
        ativa: true,
      },
    ],
  });

  console.log('✅ Cotas criadas: Saúde (Diesel), Educação (Diesel), Obras (Diesel), Assistência (Gasolina/Etanol), Gabinete (Gasolina/Etanol)');

  // ===============================
  // 12. HISTÓRICO DE ABASTECIMENTOS
  // ===============================
  console.log('⛽ 12. Criando Histórico de Abastecimentos da Prefeitura...');
  
  // Buscar uma empresa existente ou criar uma básica
  let empresaExistente = await prisma.empresa.findFirst({
    where: { ativo: true },
  });

  if (!empresaExistente) {
    empresaExistente = await prisma.empresa.create({
      data: {
        nome: 'Posto Campinas Centro',
        cnpj: '11223344000155',
        uf: 'SP',
        endereco: 'Av. Francisco Glicério, 1000',
        ativo: true,
        isPublic: true,
        tipo_empresa: 'POSTO_GASOLINA',
      },
    });
  }

  await prisma.abastecimento.createMany({
    data: [
      // Ambulância UTI - Diesel
      {
        veiculoId: ambulanciaUTI.id,
        motoristaId: motoristaJoao.id,
        combustivelId: dieselS10.id,
        empresaId: empresaExistente.id,
        solicitanteId: colaboradorSaude.id,
        tipo_abastecimento: 'COM_COTA',
        quantidade: 80.0,
        preco_anp: 6.20,
        preco_empresa: 6.15,
        desconto: 0.05,
        valor_total: 492.00,
        data_abastecimento: new Date('2024-03-15T08:30:00.000Z'),
        odometro: 45000,
        orimetro: 890,
        status: 'Aprovado',
        abastecido_por: 'João Carlos',
        nfe_chave_acesso: '35240411223344000155550010000000011987654321',
        ativo: true,
        data_aprovacao: new Date('2024-03-15T14:00:00.000Z'),
        aprovado_por: 'Carlos Eduardo Silva',
        aprovado_por_email: 'admin@campinas.sp.gov.br',
      },
      // Micro-ônibus Escolar - Diesel
      {
        veiculoId: microonibusEscolar.id,
        motoristaId: motoristaMaria.id,
        combustivelId: dieselS10.id,
        empresaId: empresaExistente.id,
        solicitanteId: colaboradorEducacao.id,
        tipo_abastecimento: 'COM_COTA',
        quantidade: 100.0,
        preco_anp: 6.20,
        preco_empresa: 6.15,
        desconto: 0.05,
        valor_total: 615.00,
        data_abastecimento: new Date('2024-03-16T07:00:00.000Z'),
        odometro: 32000,
        orimetro: 654,
        status: 'Aprovado',
        abastecido_por: 'Maria José',
        nfe_chave_acesso: '35240411223344000155550010000000021987654322',
        ativo: true,
        data_aprovacao: new Date('2024-03-16T16:30:00.000Z'),
        aprovado_por: 'Carlos Eduardo Silva',
        aprovado_por_email: 'admin@campinas.sp.gov.br',
      },
      // Van Assistência - Gasolina
      {
        veiculoId: vanAssistencia.id,
        motoristaId: motoristaCarlos.id,
        combustivelId: gasolinaComum.id,
        empresaId: empresaExistente.id,
        solicitanteId: colaboradorAssistencia.id,
        tipo_abastecimento: 'LIVRE',
        quantidade: 60.0,
        preco_anp: 5.80,
        preco_empresa: 5.75,
        desconto: 0.05,
        valor_total: 345.00,
        data_abastecimento: new Date('2024-03-17T10:15:00.000Z'),
        odometro: 28000,
        orimetro: 523,
        status: 'Aprovado',
        abastecido_por: 'Carlos Alberto',
        nfe_chave_acesso: '35240411223344000155550010000000031987654323',
        ativo: true,
        data_aprovacao: new Date('2024-03-17T15:45:00.000Z'),
        aprovado_por: 'Carlos Eduardo Silva',
        aprovado_por_email: 'admin@campinas.sp.gov.br',
      },
    ],
  });

  console.log('✅ Abastecimentos criados: Ambulância UTI, Micro-ônibus Escolar, Van Assistência');

  // ===============================
  // RESUMO FINAL
  // ===============================
  console.log('\n🎉 ==========================================');
  console.log('🎉 SEED ADMIN_PREFEITURA CONCLUÍDO COM SUCESSO!');
  console.log('🎉 ==========================================\n');

  console.log('📊 RESUMO DOS DADOS CRIADOS:');
  console.log('🏛️ 1 Prefeitura (Campinas)');
  console.log('🏢 5 Órgãos (Saúde, Educação, Obras, Assistência, Gabinete)');
  console.log('👑 1 Admin Prefeitura');
  console.log('👥 4 Colaboradores (um por secretaria)');
  console.log('📂 6 Categorias (4 veículos, 2 motoristas)');
  console.log('🚗 4 Motoristas especializados');
  console.log('🚑 6 Veículos (2 ambulâncias, micro-ônibus, caminhão, van, carro)');
  console.log('🔗 9 Vinculações usuário-órgão');
  console.log('💰 5 Contas de faturamento');
  console.log('📋 1 Processo licitatório municipal');
  console.log('📊 7 Cotas por órgão e combustível');
  console.log('⛽ 3 Abastecimentos aprovados');
  console.log('🔥 3 Combustíveis utilizados');

  console.log('\n🔐 CREDENCIAIS DE ACESSO:');
  console.log('📧 Email: admin@campinas.sp.gov.br');
  console.log('🔑 Senha: 123456');
  console.log('👑 Tipo: ADMIN_PREFEITURA');
  console.log('🏛️ Prefeitura: Campinas');

  console.log('\n🌐 ACESSO AO SISTEMA:');
  console.log('🚀 API: http://localhost:3000');
  console.log('📚 Documentação: http://localhost:3000/api/docs');

  console.log('\n✨ O ADMIN_PREFEITURA pode gerenciar TODA sua prefeitura!');
  console.log('🎯 Módulos disponíveis: Órgãos, Usuários, Veículos, Motoristas,');
  console.log('   Categorias, Processos, Cotas, Abastecimentos, Faturamento');
}

main()
  .catch((e) => {
    console.error('❌ Erro durante o seed ADMIN_PREFEITURA:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    console.log('🔌 Conexão com banco de dados encerrada.');
  });

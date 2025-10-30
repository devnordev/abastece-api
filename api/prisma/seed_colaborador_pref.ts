import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Iniciando seed para COLABORADOR_PREFEITURA...');
  console.log('👤 Demonstrando todos os módulos acessíveis ao COLABORADOR_PREFEITURA');

  // Hash das senhas
  const hashedPassword = await bcrypt.hash('123456', 12);

  // ===============================
  // 1. PREFEITURA (Contexto de Trabalho)
  // ===============================
  console.log('🏛️ 1. Criando Prefeitura (contexto de trabalho)...');
  const prefeitura = await prisma.prefeitura.upsert({
    where: { cnpj: '22333444000177' },
    update: {},
    create: {
      nome: 'Prefeitura Municipal de Ribeirão Preto',
      cnpj: '22333444000177',
      email_administrativo: 'admin@ribeiraopreto.sp.gov.br',
      ativo: true,
      data_cadastro: new Date(),
      requer_cupom_fiscal: true,
    },
  });
  console.log('✅ Prefeitura contexto criada:', prefeitura.nome);

  // ===============================
  // 2. ADMIN DA PREFEITURA (Já existente)
  // ===============================
  console.log('👑 2. Criando Admin da Prefeitura (contexto)...');
  const adminPrefeitura = await prisma.usuario.upsert({
    where: { email: 'admin@ribeiraopreto.sp.gov.br' },
    update: {},
    create: {
      email: 'admin@ribeiraopreto.sp.gov.br',
      senha: hashedPassword,
      nome: 'Sandra Regina Oliveira',
      cpf: '98765432100',
      tipo_usuario: 'ADMIN_PREFEITURA',
      prefeituraId: prefeitura.id,
      statusAcess: 'Ativado',
      ativo: true,
      data_cadastro: new Date(),
      phone: '16987654321',
    },
  });
  console.log('✅ Admin Prefeitura criado (contexto):', adminPrefeitura.email);

  // ===============================
  // 3. ÓRGÃOS (Já existentes - contexto)
  // ===============================
  console.log('🏢 3. Criando Órgãos (contexto de trabalho)...');
  
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

  const secretariaTransporte = await prisma.orgao.create({
    data: {
      prefeituraId: prefeitura.id,
      nome: 'Secretaria Municipal de Transportes',
      sigla: 'SMT',
      ativo: true,
    },
  });

  console.log('✅ Órgãos criados (contexto): SMS, SME, SMT');

  // ===============================
  // 4. COLABORADOR PRINCIPAL (Usuário Foco)
  // ===============================
  console.log('👤 4. Criando COLABORADOR_PREFEITURA (usuário principal)...');
  const colaboradorPrincipal = await prisma.usuario.upsert({
    where: { email: 'fernanda.santos@ribeiraopreto.sp.gov.br' },
    update: {},
    create: {
      email: 'fernanda.santos@ribeiraopreto.sp.gov.br',
      senha: hashedPassword,
      nome: 'Fernanda Santos Silva',
      cpf: '11223344556',
      tipo_usuario: 'COLABORADOR_PREFEITURA',
      prefeituraId: prefeitura.id,
      statusAcess: 'Ativado',
      ativo: true,
      data_cadastro: new Date(),
      phone: '16988776655',
    },
  });
  console.log('✅ Colaborador Principal criado:', colaboradorPrincipal.email);

  // Outros colaboradores (contexto)
  const colaboradorEducacao = await prisma.usuario.upsert({
    where: { email: 'marcos.lima@ribeiraopreto.sp.gov.br' },
    update: {},
    create: {
      email: 'marcos.lima@ribeiraopreto.sp.gov.br',
      senha: hashedPassword,
      nome: 'Marcos Lima Costa',
      cpf: '22334455667',
      tipo_usuario: 'COLABORADOR_PREFEITURA',
      prefeituraId: prefeitura.id,
      statusAcess: 'Ativado',
      ativo: true,
      data_cadastro: new Date(),
      phone: '16977665544',
    },
  });

  const colaboradorTransporte = await prisma.usuario.upsert({
    where: { email: 'patricia.alves@ribeiraopreto.sp.gov.br' },
    update: {},
    create: {
      email: 'patricia.alves@ribeiraopreto.sp.gov.br',
      senha: hashedPassword,
      nome: 'Patrícia Alves Mendes',
      cpf: '33445566778',
      tipo_usuario: 'COLABORADOR_PREFEITURA',
      prefeituraId: prefeitura.id,
      statusAcess: 'Ativado',
      ativo: true,
      data_cadastro: new Date(),
      phone: '16966554433',
    },
  });

  console.log('✅ Colaboradores contexto criados: Marcos (Educação), Patrícia (Transporte)');

  // ===============================
  // 5. VINCULAÇÕES USUÁRIO-ÓRGÃO
  // ===============================
  console.log('🔗 5. Criando Vinculações dos Colaboradores...');
  
  await prisma.usuarioOrgao.createMany({
    data: [
      // Fernanda - Saúde (principal) e Educação (apoio)
      { usuarioId: colaboradorPrincipal.id, orgaoId: secretariaSaude.id, ativo: true },
      { usuarioId: colaboradorPrincipal.id, orgaoId: secretariaEducacao.id, ativo: true },
      // Marcos - Educação
      { usuarioId: colaboradorEducacao.id, orgaoId: secretariaEducacao.id, ativo: true },
      // Patrícia - Transporte
      { usuarioId: colaboradorTransporte.id, orgaoId: secretariaTransporte.id, ativo: true },
      // Admin - Todos os órgãos
      { usuarioId: adminPrefeitura.id, orgaoId: secretariaSaude.id, ativo: true },
      { usuarioId: adminPrefeitura.id, orgaoId: secretariaEducacao.id, ativo: true },
      { usuarioId: adminPrefeitura.id, orgaoId: secretariaTransporte.id, ativo: true },
    ],
  });

  console.log('✅ Vinculações criadas: Fernanda (SMS+SME), Marcos (SME), Patrícia (SMT)');

  // ===============================
  // 6. CATEGORIAS (Criadas pelo Colaborador)
  // ===============================
  console.log('📂 6. Criando Categorias (módulo do colaborador)...');
  
  // Categorias que Fernanda pode criar para organizar a frota
  const categoriaEmergenciaMedica = await prisma.categoria.create({
    data: {
      prefeituraId: prefeitura.id,
      tipo_categoria: 'VEICULO',
      nome: 'Emergência Médica',
      descricao: 'Ambulâncias de emergência e UTI móvel',
      ativo: true,
    },
  });

  const categoriaTransportePaciente = await prisma.categoria.create({
    data: {
      prefeituraId: prefeitura.id,
      tipo_categoria: 'VEICULO',
      nome: 'Transporte de Pacientes',
      descricao: 'Veículos para transporte de pacientes não críticos',
      ativo: true,
    },
  });

  const categoriaVeiculoEducacional = await prisma.categoria.create({
    data: {
      prefeituraId: prefeitura.id,
      tipo_categoria: 'VEICULO',
      nome: 'Transporte Educacional',
      descricao: 'Veículos para atividades educacionais e transporte de profissionais',
      ativo: true,
    },
  });

  const categoriaVeiculoInspetoria = await prisma.categoria.create({
    data: {
      prefeituraId: prefeitura.id,
      tipo_categoria: 'VEICULO',
      nome: 'Veículos de Inspeção',
      descricao: 'Carros para fiscalização e inspeção sanitária',
      ativo: true,
    },
  });

  // Categorias de motoristas
  const categoriaMotoristaEmergencia = await prisma.categoria.create({
    data: {
      prefeituraId: prefeitura.id,
      tipo_categoria: 'MOTORISTA',
      nome: 'Motoristas de Emergência',
      descricao: 'Condutores especializados em atendimento de emergência',
      ativo: true,
    },
  });

  const categoriaMotoristaTransporte = await prisma.categoria.create({
    data: {
      prefeituraId: prefeitura.id,
      tipo_categoria: 'MOTORISTA',
      nome: 'Motoristas de Transporte',
      descricao: 'Condutores para transporte geral e educacional',
      ativo: true,
    },
  });

  console.log('✅ Categorias criadas: 4 veículos, 2 motoristas (organizadas por Fernanda)');

  // ===============================
  // 7. MOTORISTAS (Cadastrados pelo Colaborador)
  // ===============================
  console.log('🚗 7. Cadastrando Motoristas (módulo do colaborador)...');
  
  // Motoristas que Fernanda cadastra para sua área
  const motoristaRoberto = await prisma.motorista.create({
    data: {
      prefeituraId: prefeitura.id,
      nome: 'Roberto Carlos Mendes',
      cpf: '12312312300',
      cnh: '11223344556',
      categoria_cnh: 'D',
      data_vencimento_cnh: new Date('2025-08-15'),
      telefone: '16999111222',
      email: 'roberto.mendes@ribeiraopreto.sp.gov.br',
      endereco: 'Rua dos Bandeirantes, 789 - Ribeirão Preto/SP',
      ativo: true,
      observacoes: 'Motorista especializado em emergências médicas, curso de primeiros socorros atualizado. 18 anos de experiência na área.',
    },
  });

  const motoristaClaudio = await prisma.motorista.create({
    data: {
      prefeituraId: prefeitura.id,
      nome: 'Cláudio Ferreira Silva',
      cpf: '23423423411',
      cnh: '22334455667',
      categoria_cnh: 'D',
      data_vencimento_cnh: new Date('2025-11-30'),
      telefone: '16988222333',
      email: 'claudio.silva@ribeiraopreto.sp.gov.br',
      endereco: 'Av. Independência, 1456 - Ribeirão Preto/SP',
      ativo: true,
      observacoes: 'Motorista de ambulância básica, treinamento em transporte de pacientes. Conhece bem a cidade.',
    },
  });

  const motoristaLuciana = await prisma.motorista.create({
    data: {
      prefeituraId: prefeitura.id,
      nome: 'Luciana Pereira Santos',
      cpf: '34534534522',
      cnh: '33445566778',
      categoria_cnh: 'B',
      data_vencimento_cnh: new Date('2025-04-22'),
      telefone: '16977333444',
      email: 'luciana.santos@ribeiraopreto.sp.gov.br',
      endereco: 'Rua das Acácias, 321 - Ribeirão Preto/SP',
      ativo: true,
      observacoes: 'Motorista para atividades educacionais e transporte de profissionais da saúde.',
    },
  });

  const motoristaAnderson = await prisma.motorista.create({
    data: {
      prefeituraId: prefeitura.id,
      nome: 'Anderson Luis Rodrigues',
      cpf: '45645645633',
      cnh: '44556677889',
      categoria_cnh: 'B',
      data_vencimento_cnh: new Date('2025-07-10'),
      telefone: '16966444555',
      email: 'anderson.rodrigues@ribeiraopreto.sp.gov.br',
      endereco: 'Rua São Paulo, 654 - Ribeirão Preto/SP',
      ativo: true,
      observacoes: 'Motorista para fiscalização sanitária e atividades de inspeção.',
    },
  });

  const motoristaRegina = await prisma.motorista.create({
    data: {
      prefeituraId: prefeitura.id,
      nome: 'Regina Aparecida Costa',
      cpf: '56756756744',
      cnh: '55667788990',
      categoria_cnh: 'D',
      data_vencimento_cnh: new Date('2025-12-05'),
      telefone: '16955555666',
      email: 'regina.costa@ribeiraopreto.sp.gov.br',
      endereco: 'Rua da Liberdade, 987 - Ribeirão Preto/SP',
      ativo: true,
      observacoes: 'Motorista de transporte escolar, experiência com crianças e adolescentes.',
    },
  });

  console.log('✅ Motoristas cadastrados: Roberto (UTI), Cláudio (Ambulância), Luciana (Educação), Anderson (Inspeção), Regina (Escolar)');

  // ===============================
  // 8. COMBUSTÍVEIS (Contexto - já existentes)
  // ===============================
  console.log('⛽ 8. Verificando Combustíveis (contexto)...');
  
  // Buscar ou criar combustíveis básicos
  let gasolinaComum = await prisma.combustivel.findUnique({ where: { sigla: 'GAS_COMUM' } });
  let etanol = await prisma.combustivel.findUnique({ where: { sigla: 'ETANOL' } });
  let dieselS10 = await prisma.combustivel.findUnique({ where: { sigla: 'DIESEL_S10' } });

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

  console.log('✅ Combustíveis verificados: Gasolina, Etanol, Diesel S10');

  // ===============================
  // 9. VEÍCULOS (Cadastrados pelo Colaborador)
  // ===============================
  console.log('🚑 9. Cadastrando Veículos (módulo do colaborador)...');
  
  // Veículos que Fernanda cadastra para as secretarias que ela atende
  
  // Ambulância UTI (Saúde)
  const ambulanciaUTI = await prisma.veiculo.create({
    data: {
      prefeituraId: prefeitura.id,
      orgaoId: secretariaSaude.id,
      nome: 'Ambulância UTI 02',
      placa: 'RIB1234',
      modelo: 'Mercedes Sprinter 319',
      ano: 2022,
      capacidade_tanque: 90.0,
      tipo_abastecimento: 'COTA',
      ativo: true,
      tipo_veiculo: 'Ambulancia',
      situacao_veiculo: 'Proprio',
      apelido: 'UTI Móvel Central',
      ano_fabricacao: 2021,
      chassi: '9BM979045RIB001',
      renavam: '77777777777',
      cor: 'Branco',
      capacidade_passageiros: 3,
      observacoes: 'Ambulância UTI equipada com ventilador, monitor multiparamétrico, desfibrilador e bomba de infusão. Cadastrada por Fernanda Santos.',
      periodicidade: 'Semanal',
      quantidade: 180.0,
    },
  });

  // Ambulância Básica (Saúde)  
  const ambulanciaBasica = await prisma.veiculo.create({
    data: {
      prefeituraId: prefeitura.id,
      orgaoId: secretariaSaude.id,
      nome: 'Ambulância Básica 03',
      placa: 'RIB5678',
      modelo: 'Fiat Ducato 2.8',
      ano: 2021,
      capacidade_tanque: 85.0,
      tipo_abastecimento: 'COTA',
      ativo: true,
      tipo_veiculo: 'Ambulancia',
      situacao_veiculo: 'Proprio',
      apelido: 'Básica Norte',
      ano_fabricacao: 2020,
      chassi: '9BD21806RIB002',
      renavam: '88888888888',
      cor: 'Branco',
      capacidade_passageiros: 4,
      observacoes: 'Ambulância básica para transporte inter-hospitalar e remoções simples. Cadastrada por Fernanda Santos.',
      periodicidade: 'Semanal',
      quantidade: 140.0,
    },
  });

  // Veículo Educacional (Educação)
  const veiculoEducacional = await prisma.veiculo.create({
    data: {
      prefeituraId: prefeitura.id,
      orgaoId: secretariaEducacao.id,
      nome: 'Van Educacional 01',
      placa: 'RIB9012',
      modelo: 'Ford Transit 350L',
      ano: 2023,
      capacidade_tanque: 80.0,
      tipo_abastecimento: 'LIVRE',
      ativo: true,
      tipo_veiculo: 'Microonibus',
      situacao_veiculo: 'Proprio',
      apelido: 'Van da Educação',
      ano_fabricacao: 2022,
      chassi: '1FTBW3XM5RIB003',
      renavam: '99999999999',
      cor: 'Amarelo',
      capacidade_passageiros: 15,
      observacoes: 'Van para transporte de profissionais da educação em atividades externas e apoio escolar. Cadastrada por Fernanda Santos.',
    },
  });

  // Carro de Inspeção (Saúde - Vigilância Sanitária)
  const carroInspecao = await prisma.veiculo.create({
    data: {
      prefeituraId: prefeitura.id,
      orgaoId: secretariaSaude.id,
      nome: 'Carro Inspeção Sanitária 01',
      placa: 'RIB3456',
      modelo: 'Chevrolet Onix Plus',
      ano: 2023,
      capacidade_tanque: 44.0,
      tipo_abastecimento: 'COM_AUTORIZACAO',
      ativo: true,
      tipo_veiculo: 'Carro',
      situacao_veiculo: 'Proprio',
      apelido: 'Inspeção 01',
      ano_fabricacao: 2022,
      chassi: '9BGKS48U0RIB004',
      renavam: '10101010101',
      cor: 'Branco',
      capacidade_passageiros: 5,
      observacoes: 'Veículo para atividades de vigilância sanitária e fiscalização. Cadastrado por Fernanda Santos.',
    },
  });

  // Carro Administrativo Educação
  const carroAdminEducacao = await prisma.veiculo.create({
    data: {
      prefeituraId: prefeitura.id,
      orgaoId: secretariaEducacao.id,
      nome: 'Carro Administrativo Educação',
      placa: 'RIB7890',
      modelo: 'Volkswagen Virtus',
      ano: 2022,
      capacidade_tanque: 50.0,
      tipo_abastecimento: 'COM_AUTORIZACAO',
      ativo: true,
      tipo_veiculo: 'Carro',
      situacao_veiculo: 'Proprio',
      apelido: 'Admin Educação',
      ano_fabricacao: 2021,
      chassi: '9BWAA05Z5RIB005',
      renavam: '11111111112',
      cor: 'Prata',
      capacidade_passageiros: 5,
      observacoes: 'Veículo administrativo para atividades da Secretaria de Educação. Cadastrado por Fernanda Santos.',
    },
  });

  console.log('✅ Veículos cadastrados: 2 Ambulâncias (SMS), 1 Van (SME), 1 Carro Inspeção (SMS), 1 Carro Admin (SME)');

  // Associar combustíveis aos veículos
  await prisma.veiculoCombustivel.createMany({
    data: [
      // Ambulâncias - Diesel
      { veiculoId: ambulanciaUTI.id, combustivelId: dieselS10.id, ativo: true },
      { veiculoId: ambulanciaBasica.id, combustivelId: dieselS10.id, ativo: true },
      // Van Educacional - Diesel
      { veiculoId: veiculoEducacional.id, combustivelId: dieselS10.id, ativo: true },
      // Carros - Gasolina/Etanol
      { veiculoId: carroInspecao.id, combustivelId: gasolinaComum.id, ativo: true },
      { veiculoId: carroInspecao.id, combustivelId: etanol.id, ativo: true },
      { veiculoId: carroAdminEducacao.id, combustivelId: gasolinaComum.id, ativo: true },
      { veiculoId: carroAdminEducacao.id, combustivelId: etanol.id, ativo: true },
    ],
  });

  // Associar categorias aos veículos
  await prisma.veiculoCategoria.createMany({
    data: [
      { veiculoId: ambulanciaUTI.id, categoriaId: categoriaEmergenciaMedica.id, ativo: true },
      { veiculoId: ambulanciaBasica.id, categoriaId: categoriaTransportePaciente.id, ativo: true },
      { veiculoId: veiculoEducacional.id, categoriaId: categoriaVeiculoEducacional.id, ativo: true },
      { veiculoId: carroInspecao.id, categoriaId: categoriaVeiculoInspetoria.id, ativo: true },
      { veiculoId: carroAdminEducacao.id, categoriaId: categoriaVeiculoEducacional.id, ativo: true },
    ],
  });

  // Associar motoristas aos veículos
  await prisma.veiculoMotorista.createMany({
    data: [
      // Roberto - Ambulância UTI
      { veiculoId: ambulanciaUTI.id, motoristaId: motoristaRoberto.id, data_inicio: new Date(), ativo: true },
      // Cláudio - Ambulância Básica
      { veiculoId: ambulanciaBasica.id, motoristaId: motoristaClaudio.id, data_inicio: new Date(), ativo: true },
      { veiculoId: ambulanciaUTI.id, motoristaId: motoristaClaudio.id, data_inicio: new Date(), ativo: true },
      // Luciana - Van Educacional e Carro Admin Educação
      { veiculoId: veiculoEducacional.id, motoristaId: motoristaLuciana.id, data_inicio: new Date(), ativo: true },
      { veiculoId: carroAdminEducacao.id, motoristaId: motoristaLuciana.id, data_inicio: new Date(), ativo: true },
      // Anderson - Carro Inspeção
      { veiculoId: carroInspecao.id, motoristaId: motoristaAnderson.id, data_inicio: new Date(), ativo: true },
      // Regina - Van Educacional (backup)
      { veiculoId: veiculoEducacional.id, motoristaId: motoristaRegina.id, data_inicio: new Date(), ativo: true },
    ],
  });

  console.log('✅ Associações criadas: Veículos ↔ Combustíveis, Categorias, Motoristas');

  // ===============================
  // 10. PROCESSO E COTAS (Contexto - criados pelo Admin)
  // ===============================
  console.log('📋 10. Criando Processo Municipal (contexto - criado pelo admin)...');
  
  const processoMunicipal = await prisma.processo.create({
    data: {
      tipo_contrato: 'OBJETIVO',
      prefeituraId: prefeitura.id,
      litros_desejados: 35000.0,
      valor_utilizado: 18000.0,
      valor_disponivel: 280000.0,
      numero_processo: 'PROC-RIB-2024-001',
      numero_documento: 'LICIT-RIB-2024-001',
      tipo_documento: 'LICITACAO',
      tipo_itens: 'QUANTIDADE_LITROS',
      objeto: 'Contratação de empresa para fornecimento de combustíveis automotivos para a frota municipal de Ribeirão Preto, contemplando ambulâncias, veículos administrativos e de inspeção',
      data_abertura: new Date('2024-02-01'),
      data_encerramento: new Date('2024-12-31'),
      status: 'ATIVO',
      ativo: true,
      observacoes: 'Processo licitatório pregão eletrônico 001/2024. Contempla todas as secretarias municipais.',
      arquivo_contrato: '/uploads/contratos/licitacao-ribeirao-preto-001-2024.pdf',
    },
  });

  // Associar combustíveis ao processo
  await prisma.processoCombustivel.createMany({
    data: [
      {
        processoId: processoMunicipal.id,
        combustivelId: gasolinaComum.id,
        quantidade_litros: 12000.0,
        valor_unitario: 5.90,
        saldo_disponivel_processo: 70800.0,
      },
      {
        processoId: processoMunicipal.id,
        combustivelId: etanol.id,
        quantidade_litros: 8000.0,
        valor_unitario: 4.60,
        saldo_disponivel_processo: 36800.0,
      },
      {
        processoId: processoMunicipal.id,
        combustivelId: dieselS10.id,
        quantidade_litros: 15000.0,
        valor_unitario: 6.30,
        saldo_disponivel_processo: 94500.0,
      },
    ],
  });

  // Criar cotas por órgão (definidas pelo admin)
  await prisma.cotaOrgao.createMany({
    data: [
      // Saúde - Diesel para ambulâncias
      {
        processoId: processoMunicipal.id,
        orgaoId: secretariaSaude.id,
        combustivelId: dieselS10.id,
        quantidade: 8000.0,
        quantidade_utilizada: 1200.0,
        restante: 6800.0,
        saldo_disponivel_cota: 42840.0,
        ativa: true,
      },
      // Saúde - Gasolina para carros de inspeção
      {
        processoId: processoMunicipal.id,
        orgaoId: secretariaSaude.id,
        combustivelId: gasolinaComum.id,
        quantidade: 2000.0,
        quantidade_utilizada: 300.0,
        restante: 1700.0,
        saldo_disponivel_cota: 10030.0,
        ativa: true,
      },
      // Educação - Diesel para van
      {
        processoId: processoMunicipal.id,
        orgaoId: secretariaEducacao.id,
        combustivelId: dieselS10.id,
        quantidade: 4000.0,
        quantidade_utilizada: 800.0,
        restante: 3200.0,
        saldo_disponivel_cota: 20160.0,
        ativa: true,
      },
      // Educação - Gasolina para carros
      {
        processoId: processoMunicipal.id,
        orgaoId: secretariaEducacao.id,
        combustivelId: gasolinaComum.id,
        quantidade: 1500.0,
        quantidade_utilizada: 250.0,
        restante: 1250.0,
        saldo_disponivel_cota: 7375.0,
        ativa: true,
      },
      // Educação - Etanol para carros
      {
        processoId: processoMunicipal.id,
        orgaoId: secretariaEducacao.id,
        combustivelId: etanol.id,
        quantidade: 1000.0,
        quantidade_utilizada: 150.0,
        restante: 850.0,
        saldo_disponivel_cota: 3910.0,
        ativa: true,
      },
    ],
  });

  console.log('✅ Processo e Cotas criados (contexto): Processo municipal ativo');

  // ===============================
  // 11. EMPRESAS (Contexto - postos disponíveis)
  // ===============================
  console.log('⛽ 11. Criando Postos (contexto)...');
  
  let empresaExistente = await prisma.empresa.findFirst({
    where: { ativo: true },
  });

  if (!empresaExistente) {
    empresaExistente = await prisma.empresa.create({
      data: {
        nome: 'Posto BR Ribeirão Centro',
        cnpj: '55666777000188',
        uf: 'SP',
        endereco: 'Av. Francisco Junqueira, 1500',
        endereco_completo: 'Av. Francisco Junqueira, 1500, Centro, Ribeirão Preto - SP',
        ativo: true,
        isPublic: true,
        tipo_empresa: 'POSTO_GASOLINA',
        bandeira: 'BR',
        telefone: '16999887766',
        email: 'contato@postobr-ribeirao.com',
      },
    });
  }

  console.log('✅ Posto criado (contexto):', empresaExistente.nome);

  // ===============================
  // 12. SOLICITAÇÕES DE ABASTECIMENTO (Criadas pelo Colaborador)
  // ===============================
  console.log('⛽ 12. Criando Solicitações de Abastecimento (módulo do colaborador)...');
  
  // Solicitações que Fernanda faz para os veículos da sua área
  await prisma.solicitacaoAbastecimento.createMany({
    data: [
      // Solicitação para Ambulância UTI
      {
        prefeituraId: prefeitura.id,
        veiculoId: ambulanciaUTI.id,
        motoristaId: motoristaRoberto.id,
        combustivelId: dieselS10.id,
        empresaId: empresaExistente.id,
        quantidade: 85.0,
        data_solicitacao: new Date('2024-03-20T08:00:00.000Z'),
        data_expiracao: new Date('2024-03-22T08:00:00.000Z'),
        tipo_abastecimento: 'COM_COTA',
        status: 'PENDENTE',
        abastecido_por: 'Sistema',
        valor_total: 535.50,
        preco_empresa: 6.30,
        ativo: true,
        observacoes: 'Solicitação de abastecimento para ambulância UTI - turno manhã. Solicitado por Fernanda Santos.',
        created_at: new Date(),
        updated_at: new Date(),
      },
      // Solicitação para Ambulância Básica
      {
        prefeituraId: prefeitura.id,
        veiculoId: ambulanciaBasica.id,
        motoristaId: motoristaClaudio.id,
        combustivelId: dieselS10.id,
        empresaId: empresaExistente.id,
        quantidade: 75.0,
        data_solicitacao: new Date('2024-03-20T14:30:00.000Z'),
        data_expiracao: new Date('2024-03-22T14:30:00.000Z'),
        tipo_abastecimento: 'COM_COTA',
        status: 'APROVADA',
        aprovado_por: 'Sandra Regina Oliveira',
        aprovado_por_email: 'admin@ribeiraopreto.sp.gov.br',
        data_aprovacao: new Date('2024-03-20T16:00:00.000Z'),
        abastecido_por: 'Sistema',
        valor_total: 472.50,
        preco_empresa: 6.30,
        ativo: true,
        observacoes: 'Solicitação aprovada pelo admin. Ambulância para plantão noturno. Solicitado por Fernanda Santos.',
        created_at: new Date(),
        updated_at: new Date(),
      },
      // Solicitação para Carro de Inspeção
      {
        prefeituraId: prefeitura.id,
        veiculoId: carroInspecao.id,
        motoristaId: motoristaAnderson.id,
        combustivelId: gasolinaComum.id,
        empresaId: empresaExistente.id,
        quantidade: 40.0,
        data_solicitacao: new Date('2024-03-21T09:15:00.000Z'),
        data_expiracao: new Date('2024-03-23T09:15:00.000Z'),
        tipo_abastecimento: 'COM_AUTORIZACAO',
        status: 'APROVADA',
        aprovado_por: 'Sandra Regina Oliveira',
        aprovado_por_email: 'admin@ribeiraopreto.sp.gov.br',
        data_aprovacao: new Date('2024-03-21T10:45:00.000Z'),
        abastecido_por: 'Sistema',
        valor_total: 236.00,
        preco_empresa: 5.90,
        ativo: true,
        observacoes: 'Solicitação para fiscalização sanitária nos estabelecimentos da região central. Solicitado por Fernanda Santos.',
        created_at: new Date(),
        updated_at: new Date(),
      },
      // Solicitação para Van Educacional
      {
        prefeituraId: prefeitura.id,
        veiculoId: veiculoEducacional.id,
        motoristaId: motoristaLuciana.id,
        combustivelId: dieselS10.id,
        empresaId: empresaExistente.id,
        quantidade: 70.0,
        data_solicitacao: new Date('2024-03-21T13:20:00.000Z'),
        data_expiracao: new Date('2024-03-23T13:20:00.000Z'),
        tipo_abastecimento: 'LIVRE',
        status: 'PENDENTE',
        abastecido_por: 'Sistema',
        valor_total: 441.00,
        preco_empresa: 6.30,
        ativo: true,
        observacoes: 'Van para transporte de professores para capacitação externa. Solicitado por Fernanda Santos via delegação da Educação.',
        created_at: new Date(),
        updated_at: new Date(),
      },
    ],
  });

  console.log('✅ Solicitações criadas: 2 Ambulâncias, 1 Carro Inspeção, 1 Van (por Fernanda Santos)');

  // ===============================
  // 13. ABASTECIMENTOS REALIZADOS (Histórico)
  // ===============================
  console.log('⛽ 13. Criando Histórico de Abastecimentos...');
  
  await prisma.abastecimento.createMany({
    data: [
      // Abastecimento da Ambulância Básica (aprovado)
      {
        veiculoId: ambulanciaBasica.id,
        motoristaId: motoristaClaudio.id,
        combustivelId: dieselS10.id,
        empresaId: empresaExistente.id,
        solicitanteId: colaboradorPrincipal.id,
        tipo_abastecimento: 'COM_COTA',
        quantidade: 75.0,
        preco_anp: 6.30,
        preco_empresa: 6.25,
        desconto: 0.05,
        valor_total: 468.75,
        data_abastecimento: new Date('2024-03-20T17:30:00.000Z'),
        odometro: 28500,
        orimetro: 620,
        status: 'Aprovado',
        abastecido_por: 'Cláudio Ferreira',
        nfe_chave_acesso: '35240455666777000188550010000000101234567890',
        ativo: true,
        data_aprovacao: new Date('2024-03-20T18:00:00.000Z'),
        aprovado_por: 'Sandra Regina Oliveira',
        aprovado_por_email: 'admin@ribeiraopreto.sp.gov.br',
      },
      // Abastecimento do Carro de Inspeção (aprovado)
      {
        veiculoId: carroInspecao.id,
        motoristaId: motoristaAnderson.id,
        combustivelId: gasolinaComum.id,
        empresaId: empresaExistente.id,
        solicitanteId: colaboradorPrincipal.id,
        tipo_abastecimento: 'COM_AUTORIZACAO',
        quantidade: 40.0,
        preco_anp: 5.90,
        preco_empresa: 5.85,
        desconto: 0.05,
        valor_total: 234.00,
        data_abastecimento: new Date('2024-03-21T11:15:00.000Z'),
        odometro: 15200,
        orimetro: 310,
        status: 'Aprovado',
        abastecido_por: 'Anderson Luis',
        nfe_chave_acesso: '35240455666777000188550010000000111234567891',
        ativo: true,
        data_aprovacao: new Date('2024-03-21T15:30:00.000Z'),
        aprovado_por: 'Sandra Regina Oliveira',
        aprovado_por_email: 'admin@ribeiraopreto.sp.gov.br',
      },
    ],
  });

  console.log('✅ Abastecimentos históricos criados: Ambulância Básica, Carro Inspeção');

  // ===============================
  // RESUMO FINAL
  // ===============================
  console.log('\n🎉 ==========================================');
  console.log('🎉 SEED COLABORADOR_PREFEITURA CONCLUÍDO!');
  console.log('🎉 ==========================================\n');

  console.log('📊 RESUMO DOS DADOS CRIADOS:');
  console.log('🏛️ 1 Prefeitura (Ribeirão Preto) - contexto');
  console.log('🏢 3 Órgãos (SMS, SME, SMT) - contexto');
  console.log('👑 1 Admin Prefeitura - contexto');
  console.log('👤 1 Colaborador Principal (Fernanda Santos)');
  console.log('👥 2 Colaboradores contexto (Marcos, Patrícia)');
  console.log('🔗 7 Vinculações usuário-órgão');
  console.log('📂 6 Categorias criadas pelo colaborador');
  console.log('🚗 5 Motoristas cadastrados pelo colaborador');
  console.log('🚑 5 Veículos cadastrados pelo colaborador');
  console.log('📋 1 Processo municipal - contexto');
  console.log('📊 5 Cotas por órgão/combustível - contexto');
  console.log('⚠️ 4 Solicitações de abastecimento');
  console.log('⛽ 2 Abastecimentos realizados');
  console.log('🔥 3 Combustíveis em uso');

  console.log('\n🔐 CREDENCIAIS DE ACESSO:');
  console.log('📧 Email: fernanda.santos@ribeiraopreto.sp.gov.br');
  console.log('🔑 Senha: 123456');
  console.log('👤 Tipo: COLABORADOR_PREFEITURA');
  console.log('🏛️ Prefeitura: Ribeirão Preto');
  console.log('🏢 Órgãos: SMS (principal) + SME (apoio)');

  console.log('\n👥 OUTROS COLABORADORES:');
  console.log('📧 marcos.lima@ribeiraopreto.sp.gov.br (SME)');
  console.log('📧 patricia.alves@ribeiraopreto.sp.gov.br (SMT)');
  console.log('👑 admin@ribeiraopreto.sp.gov.br (ADMIN)');

  console.log('\n🌐 ACESSO AO SISTEMA:');
  console.log('🚀 API: http://localhost:3000');
  console.log('📚 Documentação: http://localhost:3000/api/docs');

  console.log('\n✨ O COLABORADOR_PREFEITURA pode:');
  console.log('📂 Criar categorias de organização');
  console.log('🚗 Cadastrar motoristas da prefeitura');
  console.log('🚑 Cadastrar veículos dos seus órgãos');
  console.log('⛽ Solicitar abastecimentos');
  console.log('👁️ Visualizar relatórios dos seus órgãos');
  console.log('📊 Acompanhar cotas e consumo');
}

main()
  .catch((e) => {
    console.error('❌ Erro durante o seed COLABORADOR_PREFEITURA:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    console.log('🔌 Conexão com banco de dados encerrada.');
  });

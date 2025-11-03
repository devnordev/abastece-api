import { PrismaClient, TipoVeiculo, SituacaoVeiculo, TipoAbastecimentoVeiculo, Periodicidade } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🚗 Iniciando seed de veículos...');

  // Verificar se existe prefeitura, senão criar uma
  let prefeitura = await prisma.prefeitura.findFirst();
  if (!prefeitura) {
    console.log('🏛️ Criando Prefeitura de exemplo...');
    prefeitura = await prisma.prefeitura.create({
      data: {
        nome: 'Prefeitura Municipal de São Paulo',
        cnpj: '12345678000195',
        email_administrativo: 'admin@prefeitura.sp.gov.br',
        ativo: true,
        data_cadastro: new Date(),
        requer_cupom_fiscal: true,
      },
    });
    console.log('✅ Prefeitura criada:', prefeitura.nome);
  } else {
    console.log('✅ Prefeitura encontrada:', prefeitura.nome);
  }

  // Verificar se existe órgão, senão criar alguns
  let orgaos = await prisma.orgao.findMany({
    where: { prefeituraId: prefeitura.id },
  });

  if (orgaos.length === 0) {
    console.log('🏢 Criando Órgãos de exemplo...');
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

    orgaos = [secretariaSaude, secretariaEducacao, secretariaObras];
    console.log('✅ Órgãos criados:', orgaos.length);
  } else {
    console.log('✅ Órgãos encontrados:', orgaos.length);
  }

  // Verificar se existem combustíveis, senão criar alguns
  let combustiveis = await prisma.combustivel.findMany();

  if (combustiveis.length === 0) {
    console.log('⛽ Criando Combustíveis de exemplo...');
    const combustiveisData = [
      {
        nome: 'Gasolina Comum',
        sigla: 'GAS_COMUM',
        descricao: 'Gasolina comum para veículos leves',
      },
      {
        nome: 'Gasolina Aditivada',
        sigla: 'GAS_ADITIVADA',
        descricao: 'Gasolina com aditivos para melhor performance',
      },
      {
        nome: 'Etanol',
        sigla: 'ETANOL',
        descricao: 'Etanol hidratado para veículos flex',
      },
      {
        nome: 'Diesel S10',
        sigla: 'DIESEL_S10',
        descricao: 'Diesel com baixo teor de enxofre',
      },
    ];

    for (const combustivelData of combustiveisData) {
      const combustivel = await prisma.combustivel.create({
        data: combustivelData,
      });
      combustiveis.push(combustivel);
    }
    console.log('✅ Combustíveis criados:', combustiveis.length);
  } else {
    console.log('✅ Combustíveis encontrados:', combustiveis.length);
  }

  // Verificar se existem categorias, senão criar algumas
  let categorias = await prisma.categoria.findMany({
    where: {
      prefeituraId: prefeitura.id,
      tipo_categoria: 'VEICULO',
    },
  });

  if (categorias.length === 0) {
    console.log('📂 Criando Categorias de exemplo...');
    const categoriasData = [
      {
        prefeituraId: prefeitura.id,
        tipo_categoria: 'VEICULO' as const,
        nome: 'Ambulâncias',
        descricao: 'Veículos de emergência médica',
      },
      {
        prefeituraId: prefeitura.id,
        tipo_categoria: 'VEICULO' as const,
        nome: 'Veículos Administrativos',
        descricao: 'Veículos para uso administrativo',
      },
      {
        prefeituraId: prefeitura.id,
        tipo_categoria: 'VEICULO' as const,
        nome: 'Máquinas Pesadas',
        descricao: 'Máquinas e equipamentos de obras',
      },
      {
        prefeituraId: prefeitura.id,
        tipo_categoria: 'VEICULO' as const,
        nome: 'Transporte Escolar',
        descricao: 'Veículos para transporte de estudantes',
      },
    ];

    for (const categoriaData of categoriasData) {
      const categoria = await prisma.categoria.create({
        data: categoriaData,
      });
      categorias.push(categoria);
    }
    console.log('✅ Categorias criadas:', categorias.length);
  } else {
    console.log('✅ Categorias encontradas:', categorias.length);
  }

  // Verificar se existem motoristas, senão criar alguns
  let motoristas = await prisma.motorista.findMany({
    where: { prefeituraId: prefeitura.id },
  });

  if (motoristas.length === 0) {
    console.log('👨‍✈️ Criando Motoristas de exemplo...');
    const motoristasData = [
      {
        prefeituraId: prefeitura.id,
        nome: 'João Silva',
        cpf: '11111111111',
        cnh: '12345678901',
        categoria_cnh: 'B',
        data_vencimento_cnh: new Date('2025-12-31'),
        telefone: '11988888888',
        email: 'joao.silva@prefeitura.sp.gov.br',
        ativo: true,
      },
      {
        prefeituraId: prefeitura.id,
        nome: 'Maria Santos',
        cpf: '22222222222',
        cnh: '23456789012',
        categoria_cnh: 'B',
        data_vencimento_cnh: new Date('2025-11-30'),
        telefone: '11977777777',
        email: 'maria.santos@prefeitura.sp.gov.br',
        ativo: true,
      },
      {
        prefeituraId: prefeitura.id,
        nome: 'Pedro Oliveira',
        cpf: '33333333333',
        cnh: '34567890123',
        categoria_cnh: 'C',
        data_vencimento_cnh: new Date('2025-10-31'),
        telefone: '11966666666',
        email: 'pedro.oliveira@prefeitura.sp.gov.br',
        ativo: true,
      },
    ];

    for (const motoristaData of motoristasData) {
      const motorista = await prisma.motorista.create({
        data: motoristaData,
      });
      motoristas.push(motorista);
    }
    console.log('✅ Motoristas criados:', motoristas.length);
  } else {
    console.log('✅ Motoristas encontrados:', motoristas.length);
  }

  // ===============================
  // CRIAR VEÍCULOS
  // ===============================
  console.log('\n🚗 Criando Veículos...');

  const veiculosData = [
    // Ambulâncias
    {
      prefeituraId: prefeitura.id,
      orgaoId: orgaos[0].id, // Secretaria de Saúde
      nome: 'Ambulância UTI 01',
      placa: 'ABC-1234',
      modelo: 'Ford Transit',
      ano: 2020,
      ano_fabricacao: 2019,
      tipo_veiculo: TipoVeiculo.Ambulancia,
      situacao_veiculo: SituacaoVeiculo.Proprio,
      tipo_abastecimento: TipoAbastecimentoVeiculo.COTA,
      periodicidade: Periodicidade.Semanal,
      quantidade: 150.0,
      capacidade_tanque: 80.0,
      capacidade_passageiros: 8,
      cor: 'Branco',
      chassi: '9BWZZZZZZZZZZZZZZ',
      renavam: '12345678901',
      apelido: 'Ambulância da Saúde',
      observacoes: 'Veículo de emergência médica - UTI',
      ativo: true,
      combustivelIds: [combustiveis.find(c => c.sigla === 'DIESEL_S10')?.id || combustiveis[0].id],
      categoriaIds: [categorias.find(c => c.nome === 'Ambulâncias')?.id],
      motoristaIds: [motoristas[0].id],
    },
    {
      prefeituraId: prefeitura.id,
      orgaoId: orgaos[0].id, // Secretaria de Saúde
      nome: 'Ambulância Básica 02',
      placa: 'ABC-5678',
      modelo: 'Mercedes Sprinter',
      ano: 2019,
      ano_fabricacao: 2018,
      tipo_veiculo: TipoVeiculo.Ambulancia,
      situacao_veiculo: SituacaoVeiculo.Proprio,
      tipo_abastecimento: TipoAbastecimentoVeiculo.COTA,
      periodicidade: Periodicidade.Semanal,
      quantidade: 120.0,
      capacidade_tanque: 75.0,
      capacidade_passageiros: 6,
      cor: 'Branco',
      chassi: '9BWZZZZZZZZZZZZZY',
      renavam: '12345678902',
      apelido: 'Ambulância Básica',
      observacoes: 'Veículo de emergência médica - Básica',
      ativo: true,
      combustivelIds: [combustiveis.find(c => c.sigla === 'DIESEL_S10')?.id || combustiveis[0].id],
      categoriaIds: [categorias.find(c => c.nome === 'Ambulâncias')?.id],
      motoristaIds: [motoristas[1].id],
    },
    // Veículos Administrativos
    {
      prefeituraId: prefeitura.id,
      orgaoId: orgaos[0].id, // Secretaria de Saúde
      nome: 'Carro Administrativo Saúde',
      placa: 'ABC-9012',
      modelo: 'Chevrolet Onix',
      ano: 2022,
      ano_fabricacao: 2021,
      tipo_veiculo: TipoVeiculo.Carro,
      situacao_veiculo: SituacaoVeiculo.Proprio,
      tipo_abastecimento: TipoAbastecimentoVeiculo.COTA,
      periodicidade: Periodicidade.Mensal,
      quantidade: 200.0,
      capacidade_tanque: 54.0,
      capacidade_passageiros: 5,
      cor: 'Prata',
      chassi: '9BWZZZZZZZZZZZZZX',
      renavam: '12345678903',
      apelido: 'Onix SMS',
      observacoes: 'Veículo para uso administrativo',
      ativo: true,
      combustivelIds: [
        combustiveis.find(c => c.sigla === 'GAS_COMUM')?.id || combustiveis[0].id,
        combustiveis.find(c => c.sigla === 'ETANOL')?.id || combustiveis[0].id,
      ],
      categoriaIds: [categorias.find(c => c.nome === 'Veículos Administrativos')?.id],
      motoristaIds: [motoristas[2].id],
    },
    {
      prefeituraId: prefeitura.id,
      orgaoId: orgaos[1].id, // Secretaria de Educação
      nome: 'Van Transporte Escolar',
      placa: 'ABC-3456',
      modelo: 'Volkswagen Kombi',
      ano: 2021,
      ano_fabricacao: 2020,
      tipo_veiculo: TipoVeiculo.Microonibus,
      situacao_veiculo: SituacaoVeiculo.Proprio,
      tipo_abastecimento: TipoAbastecimentoVeiculo.COTA,
      periodicidade: Periodicidade.Semanal,
      quantidade: 80.0,
      capacidade_tanque: 60.0,
      capacidade_passageiros: 12,
      cor: 'Amarelo',
      chassi: '9BWZZZZZZZZZZZZZW',
      renavam: '12345678904',
      apelido: 'Van Escolar',
      observacoes: 'Veículo para transporte de estudantes',
      ativo: true,
      combustivelIds: [combustiveis.find(c => c.sigla === 'DIESEL_S10')?.id || combustiveis[0].id],
      categoriaIds: [categorias.find(c => c.nome === 'Transporte Escolar')?.id],
      motoristaIds: [motoristas[0].id],
    },
    // Máquinas Pesadas
    {
      prefeituraId: prefeitura.id,
      orgaoId: orgaos[2].id, // Secretaria de Obras
      nome: 'Retroescavadeira 01',
      placa: 'ABC-7890',
      modelo: 'Caterpillar 416E',
      ano: 2020,
      ano_fabricacao: 2019,
      tipo_veiculo: TipoVeiculo.Maquina_Pesada,
      situacao_veiculo: SituacaoVeiculo.Proprio,
      tipo_abastecimento: TipoAbastecimentoVeiculo.COTA,
      periodicidade: Periodicidade.Mensal,
      quantidade: 300.0,
      capacidade_tanque: 120.0,
      cor: 'Amarelo',
      chassi: '9BWZZZZZZZZZZZZZV',
      renavam: '12345678905',
      apelido: 'Retroescavadeira',
      observacoes: 'Máquina pesada para obras e terraplanagem',
      ativo: true,
      combustivelIds: [combustiveis.find(c => c.sigla === 'DIESEL_S10')?.id || combustiveis[0].id],
      categoriaIds: [categorias.find(c => c.nome === 'Máquinas Pesadas')?.id],
      motoristaIds: [motoristas[2].id],
    },
    {
      prefeituraId: prefeitura.id,
      orgaoId: orgaos[2].id, // Secretaria de Obras
      nome: 'Caminhão Caçamba 01',
      placa: 'ABC-2468',
      modelo: 'Volvo FH 460',
      ano: 2019,
      ano_fabricacao: 2018,
      tipo_veiculo: TipoVeiculo.Caminhao,
      situacao_veiculo: SituacaoVeiculo.Proprio,
      tipo_abastecimento: TipoAbastecimentoVeiculo.COTA,
      periodicidade: Periodicidade.Semanal,
      quantidade: 250.0,
      capacidade_tanque: 150.0,
      cor: 'Branco',
      chassi: '9BWZZZZZZZZZZZZZU',
      renavam: '12345678906',
      apelido: 'Caçamba',
      observacoes: 'Caminhão para transporte de materiais',
      ativo: true,
      combustivelIds: [combustiveis.find(c => c.sigla === 'DIESEL_S10')?.id || combustiveis[0].id],
      categoriaIds: [categorias.find(c => c.nome === 'Máquinas Pesadas')?.id],
      motoristaIds: [motoristas[1].id],
    },
    // Veículo com abastecimento LIVRE
    {
      prefeituraId: prefeitura.id,
      orgaoId: orgaos[1].id, // Secretaria de Educação
      nome: 'Moto Administrativa',
      placa: 'ABC-1357',
      modelo: 'Honda CG 160',
      ano: 2023,
      ano_fabricacao: 2022,
      tipo_veiculo: TipoVeiculo.Moto,
      situacao_veiculo: SituacaoVeiculo.Proprio,
      tipo_abastecimento: TipoAbastecimentoVeiculo.LIVRE,
      capacidade_tanque: 15.0,
      cor: 'Preto',
      chassi: '9BWZZZZZZZZZZZZZT',
      renavam: '12345678907',
      apelido: 'Moto SME',
      observacoes: 'Moto para inspeções e serviços rápidos',
      ativo: true,
      combustivelIds: [
        combustiveis.find(c => c.sigla === 'GAS_COMUM')?.id || combustiveis[0].id,
        combustiveis.find(c => c.sigla === 'ETANOL')?.id || combustiveis[0].id,
      ],
      categoriaIds: [categorias.find(c => c.nome === 'Veículos Administrativos')?.id],
    },
    // Veículo com abastecimento COM_AUTORIZACAO
    {
      prefeituraId: prefeitura.id,
      orgaoId: orgaos[0].id, // Secretaria de Saúde
      nome: 'Caminhonete SMS',
      placa: 'ABC-9753',
      modelo: 'Toyota Hilux',
      ano: 2021,
      ano_fabricacao: 2020,
      tipo_veiculo: TipoVeiculo.Caminhonete,
      situacao_veiculo: SituacaoVeiculo.Proprio,
      tipo_abastecimento: TipoAbastecimentoVeiculo.COM_AUTORIZACAO,
      capacidade_tanque: 75.0,
      capacidade_passageiros: 5,
      cor: 'Branco',
      chassi: '9BWZZZZZZZZZZZZZS',
      renavam: '12345678908',
      apelido: 'Hilux Saúde',
      observacoes: 'Caminhonete para serviços externos - requer autorização',
      ativo: true,
      combustivelIds: [
        combustiveis.find(c => c.sigla === 'GAS_COMUM')?.id || combustiveis[0].id,
        combustiveis.find(c => c.sigla === 'ETANOL')?.id || combustiveis[0].id,
      ],
      categoriaIds: [categorias.find(c => c.nome === 'Veículos Administrativos')?.id],
      motoristaIds: [motoristas[0].id, motoristas[2].id],
    },
  ];

  let veiculosCriados = 0;
  let veiculosJaExistentes = 0;

  for (const veiculoData of veiculosData) {
    const { combustivelIds, categoriaIds, motoristaIds, ...veiculoCreateData } = veiculoData;

    // Verificar se veículo já existe pela placa
    const veiculoExistente = await prisma.veiculo.findUnique({
      where: { placa: veiculoData.placa },
    });

    if (veiculoExistente) {
      console.log(`⏭️  Veículo já existe: ${veiculoData.placa} - ${veiculoData.nome}`);
      veiculosJaExistentes++;
      continue;
    }

    // Criar veículo
    const veiculo = await prisma.veiculo.create({
      data: veiculoCreateData,
    });

    // Criar relacionamentos com combustíveis
    if (combustivelIds && combustivelIds.length > 0) {
      await prisma.veiculoCombustivel.createMany({
        data: combustivelIds.map((combustivelId) => ({
          veiculoId: veiculo.id,
          combustivelId: combustivelId!,
          ativo: true,
        })),
      });
    }

    // Criar relacionamentos com categorias
    if (categoriaIds && categoriaIds.length > 0) {
      await prisma.veiculoCategoria.createMany({
        data: categoriaIds
          .filter(id => id !== undefined)
          .map((categoriaId) => ({
            veiculoId: veiculo.id,
            categoriaId: categoriaId!,
            ativo: true,
          })),
      });
    }

    // Criar relacionamentos com motoristas
    if (motoristaIds && motoristaIds.length > 0) {
      await prisma.veiculoMotorista.createMany({
        data: motoristaIds.map((motoristaId) => ({
          veiculoId: veiculo.id,
          motoristaId,
          data_inicio: new Date(),
          ativo: true,
        })),
      });
    }

    console.log(`✅ Veículo criado: ${veiculo.placa} - ${veiculo.nome}`);
    veiculosCriados++;
  }

  console.log('\n🎉 Seed de veículos concluído!');
  console.log(`\n📊 Resumo:`);
  console.log(`   ✅ Veículos criados: ${veiculosCriados}`);
  console.log(`   ⏭️  Veículos já existentes: ${veiculosJaExistentes}`);
  console.log(`   🏛️  Prefeitura: ${prefeitura.nome}`);
  console.log(`   🏢 Órgãos: ${orgaos.length}`);
  console.log(`   ⛽ Combustíveis: ${combustiveis.length}`);
  console.log(`   📂 Categorias: ${categorias.length}`);
  console.log(`   👨‍✈️  Motoristas: ${motoristas.length}`);
}

main()
  .catch((e) => {
    console.error('❌ Erro durante o seed de veículos:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });


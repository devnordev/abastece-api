import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Iniciando seed completo do banco de dados...');
  console.log('📍 Cenário: Palmeira dos Índios, AL');

  // Hash das senhas
  const hashedPassword = await bcrypt.hash('123456', 12);

  // 1. Criar Super Admin
  console.log('👑 Criando Super Admin...');
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

  // 2. Criar Prefeitura de Palmeira dos Índios
  console.log('🏛️ Criando Prefeitura Municipal de Palmeira dos Índios...');
  const prefeitura = await prisma.prefeitura.upsert({
    where: { cnpj: '12345678000195' },
    update: {},
    create: {
      nome: 'Prefeitura Municipal de Palmeira dos Índios',
      cnpj: '12345678000195',
      email_administrativo: 'admin@palmeiradosindios.al.gov.br',
      ativo: true,
      data_cadastro: new Date(),
      requer_cupom_fiscal: true,
    },
  });

  console.log('✅ Prefeitura criada:', prefeitura.nome);

  // 3. Criar Órgãos da Prefeitura
  console.log('🏛️ Criando Órgãos da Prefeitura...');
  
  // Secretaria de Saúde
  const secretariaSaude = await prisma.orgao.create({
    data: {
      prefeituraId: prefeitura.id,
      nome: 'Secretaria Municipal de Saúde',
      sigla: 'SMS',
      ativo: true,
    },
  });

  // Secretaria de Assistência Social
  const secretariaAssistencia = await prisma.orgao.create({
    data: {
      prefeituraId: prefeitura.id,
      nome: 'Secretaria Municipal de Assistência Social',
      sigla: 'SMAS',
      ativo: true,
    },
  });

  console.log('✅ Órgãos criados: SMS e SMAS');

  // 4. Criar Categorias
  console.log('📂 Criando Categorias...');
  
  const categorias = [
    {
      prefeituraId: prefeitura.id,
      tipo_categoria: 'VEICULO',
      nome: 'Ambulâncias',
      descricao: 'Veículos de emergência médica',
    },
    {
      prefeituraId: prefeitura.id,
      tipo_categoria: 'VEICULO',
      nome: 'Veículos Administrativos',
      descricao: 'Veículos para uso administrativo',
    },
    {
      prefeituraId: prefeitura.id,
      tipo_categoria: 'VEICULO',
      nome: 'Veículos de Assistência Social',
      descricao: 'Veículos para atendimento social',
    },
    {
      prefeituraId: prefeitura.id,
      tipo_categoria: 'MOTORISTA',
      nome: 'Motoristas de Emergência',
      descricao: 'Motoristas habilitados para veículos de emergência',
    },
    {
      prefeituraId: prefeitura.id,
      tipo_categoria: 'MOTORISTA',
      nome: 'Motoristas Administrativos',
      descricao: 'Motoristas para veículos administrativos',
    },
  ];

  const categoriasCriadas = [];
  for (const categoria of categorias) {
    const categoriaCriada = await prisma.categoria.create({
      data: categoria as any,
    });
    categoriasCriadas.push(categoriaCriada);
    console.log(`✅ Categoria criada: ${categoria.nome}`);
  }

  // 5. Criar Usuários da Prefeitura
  console.log('👥 Criando Usuários da Prefeitura...');
  
  // Admin da Prefeitura
  const adminPrefeitura = await prisma.usuario.upsert({
    where: { email: 'admin@palmeiradosindios.al.gov.br' },
    update: {},
    create: {
      email: 'admin@palmeiradosindios.al.gov.br',
      senha: hashedPassword,
      nome: 'Maria José Silva Santos',
      cpf: '11111111111',
      tipo_usuario: 'ADMIN_PREFEITURA',
      prefeituraId: prefeitura.id,
      statusAcess: 'Ativado',
      ativo: true,
      data_cadastro: new Date(),
      phone: '82999999999',
    },
  });

  // Secretário de Saúde
  const secretarioSaude = await prisma.usuario.upsert({
    where: { email: 'saude@palmeiradosindios.al.gov.br' },
    update: {},
    create: {
      email: 'saude@palmeiradosindios.al.gov.br',
      senha: hashedPassword,
      nome: 'Dr. João Carlos Oliveira',
      cpf: '22222222222',
      tipo_usuario: 'COLABORADOR_PREFEITURA',
      prefeituraId: prefeitura.id,
      statusAcess: 'Ativado',
      ativo: true,
      data_cadastro: new Date(),
      phone: '82988888888',
    },
  });

  // Secretário de Assistência Social
  const secretarioAssistencia = await prisma.usuario.upsert({
    where: { email: 'assistencia@palmeiradosindios.al.gov.br' },
    update: {},
    create: {
      email: 'assistencia@palmeiradosindios.al.gov.br',
      senha: hashedPassword,
      nome: 'Ana Maria Ferreira',
      cpf: '33333333333',
      tipo_usuario: 'COLABORADOR_PREFEITURA',
      prefeituraId: prefeitura.id,
      statusAcess: 'Ativado',
      ativo: true,
      data_cadastro: new Date(),
      phone: '82977777777',
    },
  });

  console.log('✅ Usuários da Prefeitura criados');

  // 6. Criar Motoristas
  console.log('🚗 Criando Motoristas...');
  
  const motoristas = [
    {
      prefeituraId: prefeitura.id,
      nome: 'José da Silva Santos',
      cpf: '44444444444',
      cnh: '12345678901',
      categoria_cnh: 'B',
      data_vencimento_cnh: new Date('2025-12-31'),
      telefone: '82966666666',
      email: 'jose.santos@palmeiradosindios.al.gov.br',
      endereco: 'Rua das Palmeiras, 123, Centro',
      ativo: true,
      observacoes: 'Motorista experiente com 15 anos de experiência',
    },
    {
      prefeituraId: prefeitura.id,
      nome: 'Maria das Graças Oliveira',
      cpf: '55555555555',
      cnh: '23456789012',
      categoria_cnh: 'B',
      data_vencimento_cnh: new Date('2026-06-30'),
      telefone: '82955555555',
      email: 'maria.oliveira@palmeiradosindios.al.gov.br',
      endereco: 'Rua do Comércio, 456, Centro',
      ativo: true,
      observacoes: 'Motorista especializada em veículos de emergência',
    },
    {
      prefeituraId: prefeitura.id,
      nome: 'Antônio Carlos Ferreira',
      cpf: '66666666666',
      cnh: '34567890123',
      categoria_cnh: 'B',
      data_vencimento_cnh: new Date('2025-09-15'),
      telefone: '82944444444',
      email: 'antonio.ferreira@palmeiradosindios.al.gov.br',
      endereco: 'Rua da Liberdade, 789, Centro',
      ativo: true,
      observacoes: 'Motorista para veículos administrativos',
    },
  ];

  const motoristasCriados = [];
  for (const motorista of motoristas) {
    const motoristaCriado = await prisma.motorista.create({
      data: motorista,
    });
    motoristasCriados.push(motoristaCriado);
    console.log(`✅ Motorista criado: ${motorista.nome}`);
  }

  // 7. Criar Veículos
  console.log('🚑 Criando Veículos...');
  
  const veiculos = [
    {
      prefeituraId: prefeitura.id,
      orgaoId: secretariaSaude.id,
      nome: 'Ambulância UTI 01',
      placa: 'AL-1234',
      modelo: 'Ford Transit',
      ano: 2020,
      tipo_abastecimento: 'COTA' as any,
      ativo: true,
      capacidade_tanque: 80.0,
      tipo_veiculo: 'Ambulancia' as any,
      situacao_veiculo: 'Proprio' as any,
      periodicidade: 'Semanal' as any,
      quantidade: 100.0,
      apelido: 'Ambulância da Saúde',
      ano_fabricacao: 2019,
      chassi: '9BWZZZZZZZZZZZZZZ',
      renavam: '12345678901',
      cor: 'Branco',
      capacidade_passageiros: 8,
      observacoes: 'Veículo em excelente estado de conservação',
    },
    {
      prefeituraId: prefeitura.id,
      orgaoId: secretariaSaude.id,
      nome: 'Ambulância Básica 02',
      placa: 'AL-5678',
      modelo: 'Mercedes Sprinter',
      ano: 2019,
      tipo_abastecimento: 'COTA' as any,
      ativo: true,
      capacidade_tanque: 70.0,
      tipo_veiculo: 'Ambulancia' as any,
      situacao_veiculo: 'Proprio' as any,
      periodicidade: 'Semanal' as any,
      quantidade: 80.0,
      apelido: 'Ambulância Básica',
      ano_fabricacao: 2018,
      chassi: '9BWYYYYYYYYYYYYYY',
      renavam: '23456789012',
      cor: 'Branco',
      capacidade_passageiros: 6,
      observacoes: 'Veículo para atendimento básico',
    },
    {
      prefeituraId: prefeitura.id,
      orgaoId: secretariaAssistencia.id,
      nome: 'Van Assistência Social',
      placa: 'AL-9012',
      modelo: 'Volkswagen Kombi',
      ano: 2021,
      tipo_abastecimento: 'COTA' as any,
      ativo: true,
      capacidade_tanque: 60.0,
      tipo_veiculo: 'Microonibus' as any,
      situacao_veiculo: 'Proprio' as any,
      periodicidade: 'Semanal' as any,
      quantidade: 60.0,
      apelido: 'Van Social',
      ano_fabricacao: 2020,
      chassi: '9BWXXXXXXXXXXXXXX',
      renavam: '34567890123',
      cor: 'Azul',
      capacidade_passageiros: 12,
      observacoes: 'Veículo para atendimento social',
    },
    {
      prefeituraId: prefeitura.id,
      orgaoId: secretariaSaude.id,
      nome: 'Carro Administrativo Saúde',
      placa: 'AL-3456',
      modelo: 'Chevrolet Onix',
      ano: 2022,
      tipo_abastecimento: 'COTA' as any,
      ativo: true,
      capacidade_tanque: 50.0,
      tipo_veiculo: 'Carro' as any,
      situacao_veiculo: 'Proprio' as any,
      periodicidade: 'Semanal' as any,
      quantidade: 40.0,
      apelido: 'Carro Admin Saúde',
      ano_fabricacao: 2021,
      chassi: '9BWWWWWWWWWWWWWWW',
      renavam: '45678901234',
      cor: 'Prata',
      capacidade_passageiros: 5,
      observacoes: 'Veículo administrativo da saúde',
    },
  ];

  const veiculosCriados = [];
  for (const veiculo of veiculos) {
    const veiculoCriado = await prisma.veiculo.create({
      data: veiculo,
    });
    veiculosCriados.push(veiculoCriado);
    console.log(`✅ Veículo criado: ${veiculo.nome} (${veiculo.placa})`);
  }

  // 8. Criar Empresas (Postos de Gasolina)
  console.log('🏢 Criando Empresas (Postos de Gasolina)...');
  
  // Posto Dois Irmãos
  const postoDoisIrmaos = await prisma.empresa.create({
    data: {
      nome: 'Posto Dois Irmãos',
      cnpj: '12345678000123',
      uf: 'AL',
      endereco: 'BR-316, Km 15',
      endereco_completo: 'BR-316, Km 15, Palmeira dos Índios - AL',
      contato: 'João dos Santos',
      telefone: '82912345678',
      email: 'contato@postodoisirmaos.com.br',
      ativo: true,
      isPublic: true,
      tipo_empresa: 'POSTO_GASOLINA',
      bandeira: 'Dois Irmãos',
      latitude: -9.4056,
      longitude: -36.6333,
      horario_funcionamento: '06:00 às 22:00',
      servicos_disponiveis: 'Abastecimento, Conveniência, Lavagem',
      formas_pagamento: 'Dinheiro, Cartão, PIX',
      avaliacao: 4.2,
      total_avaliacoes: 85,
    },
  });

  // Posto Ipiranga Vila Maria
  const postoIpiranga = await prisma.empresa.create({
    data: {
      nome: 'Posto Ipiranga Vila Maria',
      cnpj: '98765432000123',
      uf: 'AL',
      endereco: 'Rua Vila Maria, 456',
      endereco_completo: 'Rua Vila Maria, 456, Centro, Palmeira dos Índios - AL',
      contato: 'Maria dos Santos',
      telefone: '82987654321',
      email: 'contato@postoipiranga.com.br',
      ativo: true,
      isPublic: true,
      tipo_empresa: 'POSTO_GASOLINA',
      bandeira: 'Ipiranga',
      latitude: -9.4089,
      longitude: -36.6367,
      horario_funcionamento: '24h',
      servicos_disponiveis: 'Abastecimento, Conveniência, Lavagem, Restaurante',
      formas_pagamento: 'Dinheiro, Cartão, PIX, Vale',
      avaliacao: 4.5,
      total_avaliacoes: 120,
    },
  });

  console.log('✅ Empresas criadas: Posto Dois Irmãos e Posto Ipiranga Vila Maria');

  // 9. Criar Usuários das Empresas
  console.log('👥 Criando Usuários das Empresas...');
  
  // Admin do Posto Dois Irmãos
  const adminDoisIrmaos = await prisma.usuario.upsert({
    where: { email: 'admin@postodoisirmaos.com.br' },
    update: {},
    create: {
      email: 'admin@postodoisirmaos.com.br',
      senha: hashedPassword,
      nome: 'João dos Santos',
      cpf: '77777777777',
      tipo_usuario: 'ADMIN_EMPRESA',
      empresaId: postoDoisIrmaos.id,
      statusAcess: 'Ativado',
      ativo: true,
      data_cadastro: new Date(),
      phone: '82912345678',
    },
  });

  // Colaborador do Posto Dois Irmãos
  const colaboradorDoisIrmaos = await prisma.usuario.upsert({
    where: { email: 'colaborador@postodoisirmaos.com.br' },
    update: {},
    create: {
      email: 'colaborador@postodoisirmaos.com.br',
      senha: hashedPassword,
      nome: 'Pedro Oliveira',
      cpf: '88888888888',
      tipo_usuario: 'COLABORADOR_EMPRESA',
      empresaId: postoDoisIrmaos.id,
      statusAcess: 'Ativado',
      ativo: true,
      data_cadastro: new Date(),
      phone: '82923456789',
    },
  });

  // Admin do Posto Ipiranga
  const adminIpiranga = await prisma.usuario.upsert({
    where: { email: 'admin@postoipiranga.com.br' },
    update: {},
    create: {
      email: 'admin@postoipiranga.com.br',
      senha: hashedPassword,
      nome: 'Maria dos Santos',
      cpf: '99999999999',
      tipo_usuario: 'ADMIN_EMPRESA',
      empresaId: postoIpiranga.id,
      statusAcess: 'Ativado',
      ativo: true,
      data_cadastro: new Date(),
      phone: '82987654321',
    },
  });

  // Colaborador do Posto Ipiranga
  const colaboradorIpiranga = await prisma.usuario.upsert({
    where: { email: 'colaborador@postoipiranga.com.br' },
    update: {},
    create: {
      email: 'colaborador@postoipiranga.com.br',
      senha: hashedPassword,
      nome: 'Ana Silva',
      cpf: '10101010101',
      tipo_usuario: 'COLABORADOR_EMPRESA',
      empresaId: postoIpiranga.id,
      statusAcess: 'Ativado',
      ativo: true,
      data_cadastro: new Date(),
      phone: '82976543210',
    },
  });

  console.log('✅ Usuários das Empresas criados');

  // 10. Criar Combustíveis
  console.log('⛽ Criando Combustíveis...');
  
  const combustiveis = [
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

  const combustiveisCriados = [];
  for (const combustivel of combustiveis) {
    const combustivelCriado = await prisma.combustivel.upsert({
      where: { sigla: combustivel.sigla },
      update: {},
      create: combustivel,
    });
    combustiveisCriados.push(combustivelCriado);
    console.log(`✅ Combustível criado: ${combustivel.nome}`);
  }

  // 11. Criar Contratos
  console.log('📄 Criando Contratos...');
  
  // Contrato com Posto Dois Irmãos
  const contratoDoisIrmaos = await prisma.contrato.create({
    data: {
      empresaId: postoDoisIrmaos.id,
      empresa_contratante: 'Prefeitura Municipal de Palmeira dos Índios',
      empresa_contratada: 'Posto Dois Irmãos Ltda',
      title: 'Contrato de Fornecimento de Combustíveis - Posto Dois Irmãos',
      cnpj_empresa: postoDoisIrmaos.cnpj,
      vigencia_inicio: new Date('2024-01-01'),
      vigencia_fim: new Date('2024-12-31'),
      ativo: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  });

  // Contrato com Posto Ipiranga
  const contratoIpiranga = await prisma.contrato.create({
    data: {
      empresaId: postoIpiranga.id,
      empresa_contratante: 'Prefeitura Municipal de Palmeira dos Índios',
      empresa_contratada: 'Posto Ipiranga Vila Maria Ltda',
      title: 'Contrato de Fornecimento de Combustíveis - Posto Ipiranga',
      cnpj_empresa: postoIpiranga.cnpj,
      vigencia_inicio: new Date('2024-01-01'),
      vigencia_fim: new Date('2024-12-31'),
      ativo: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  });

  console.log('✅ Contratos criados');

  // 12. Criar Processo (Teto de Combustível)
  console.log('📊 Criando Processo (Teto de Combustível)...');
  
  const processo = await prisma.processo.create({
    data: {
      prefeituraId: prefeitura.id,
      numero_processo: '2024.001',
      numero_documento: '2024.001',
      tipo_documento: 'CONTRATO',
      objeto: 'Processo para controle de abastecimento de veículos da prefeitura',
      data_abertura: new Date('2024-01-01'),
      data_encerramento: new Date('2024-12-31'),
      status: 'ATIVO',
      ativo: true,
      observacoes: 'Processo para controle de abastecimento de veículos da prefeitura',
      valor_disponivel: 500000.00,
    },
  });

  console.log('✅ Processo criado');

  // 13. Criar Solicitações de Abastecimento de Exemplo
  console.log('⛽ Criando Solicitações de Abastecimento de Exemplo...');
  
  const solicitacoes = [
    {
      veiculoId: veiculosCriados[0].id, // Ambulância UTI 01
      motoristaId: motoristasCriados[0].id, // José da Silva Santos
      combustivelId: combustiveisCriados[0].id, // Gasolina Comum
      empresaId: postoDoisIrmaos.id,
      solicitanteId: secretarioSaude.id,
      tipo_abastecimento: 'COM_COTA' as any,
      quantidade: 50.0,
      valor_total: 275.00,
      data_abastecimento: new Date('2024-01-15'),
      status: 'Aprovado' as any,
    },
    {
      veiculoId: veiculosCriados[1].id, // Ambulância Básica 02
      motoristaId: motoristasCriados[1].id, // Maria das Graças Oliveira
      combustivelId: combustiveisCriados[0].id, // Gasolina Comum
      empresaId: postoIpiranga.id,
      solicitanteId: secretarioSaude.id,
      tipo_abastecimento: 'COM_COTA' as any,
      quantidade: 40.0,
      valor_total: 218.00,
      data_abastecimento: new Date('2024-01-16'),
      status: 'Aprovado' as any,
    },
    {
      veiculoId: veiculosCriados[2].id, // Van Assistência Social
      motoristaId: motoristasCriados[2].id, // Antônio Carlos Ferreira
      combustivelId: combustiveisCriados[0].id, // Gasolina Comum
      empresaId: postoDoisIrmaos.id,
      solicitanteId: secretarioAssistencia.id,
      tipo_abastecimento: 'COM_COTA' as any,
      quantidade: 30.0,
      valor_total: 165.00,
      data_abastecimento: new Date('2024-01-17'),
      status: 'Aguardando' as any,
    },
  ];

  for (const solicitacao of solicitacoes) {
    await prisma.abastecimento.create({
      data: solicitacao,
    });
    console.log(`✅ Solicitação criada: Veículo ID ${solicitacao.veiculoId}`);
  }

  console.log('🎉 Seed completo concluído com sucesso!');
  console.log('\n📋 Resumo dos dados criados:');
  console.log('👑 Super Admin: superadmin@nordev.com (senha: 123456)');
  console.log('🏛️ Admin Prefeitura: admin@palmeiradosindios.al.gov.br (senha: 123456)');
  console.log('👨‍💻 Secretário Saúde: saude@palmeiradosindios.al.gov.br (senha: 123456)');
  console.log('👨‍💻 Secretário Assistência: assistencia@palmeiradosindios.al.gov.br (senha: 123456)');
  console.log('🏢 Admin Posto Dois Irmãos: admin@postodoisirmaos.com.br (senha: 123456)');
  console.log('🏢 Admin Posto Ipiranga: admin@postoipiranga.com.br (senha: 123456)');
  console.log('\n🚑 Veículos: 4 veículos (2 ambulâncias, 1 van social, 1 carro admin)');
  console.log('🚗 Motoristas: 3 motoristas habilitados');
  console.log('⛽ Combustíveis: 4 tipos de combustível');
  console.log('📄 Contratos: 2 contratos ativos');
  console.log('📊 Processo: 1 processo com teto de R$ 500.000,00');
  console.log('⛽ Solicitações: 3 solicitações de exemplo');
  console.log('\n🔗 Acesse a documentação em: http://localhost:3000/api/docs');
}

main()
  .catch((e) => {
    console.error('❌ Erro durante o seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
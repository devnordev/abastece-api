import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Iniciando seed do banco de dados...');

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

  // 2. Criar Prefeitura de exemplo
  console.log('🏛️ Criando Prefeitura de exemplo...');
  const prefeitura = await prisma.prefeitura.upsert({
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

  console.log('✅ Prefeitura criada:', prefeitura.nome);

  // 3. Criar Empresa de exemplo
  console.log('🏢 Criando Empresa de exemplo...');
  const empresa = await prisma.empresa.upsert({
    where: { id: 1 },
    update: {},
    create: {
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

  console.log('✅ Empresa criada:', empresa.nome);

  // 4. Criar Órgão de exemplo
  console.log('🏛️ Criando Órgão de exemplo...');
  const orgao = await prisma.orgao.upsert({
    where: { id: 1 },
    update: {},
    create: {
      prefeituraId: prefeitura.id,
      nome: 'Secretaria Municipal de Saúde',
      sigla: 'SMS',
      ativo: true,
    },
  });

  console.log('✅ Órgão criado:', orgao.nome);

  // 5. Criar Admin da Prefeitura
  console.log('👨‍💼 Criando Admin da Prefeitura...');
  const adminPrefeitura = await prisma.usuario.upsert({
    where: { email: 'admin@prefeitura.sp.gov.br' },
    update: {},
    create: {
      email: 'admin@prefeitura.sp.gov.br',
      senha: hashedPassword,
      nome: 'Administrador da Prefeitura',
      cpf: '11111111111',
      tipo_usuario: 'ADMIN_PREFEITURA',
      prefeituraId: prefeitura.id,
      statusAcess: 'Ativado',
      ativo: true,
      data_cadastro: new Date(),
    },
  });

  console.log('✅ Admin da Prefeitura criado:', adminPrefeitura.email);

  // 6. Criar Colaborador da Prefeitura
  console.log('👨‍💻 Criando Colaborador da Prefeitura...');
  const colaboradorPrefeitura = await prisma.usuario.upsert({
    where: { email: 'colaborador@prefeitura.sp.gov.br' },
    update: {},
    create: {
      email: 'colaborador@prefeitura.sp.gov.br',
      senha: hashedPassword,
      nome: 'Colaborador da Prefeitura',
      cpf: '22222222222',
      tipo_usuario: 'COLABORADOR_PREFEITURA',
      prefeituraId: prefeitura.id,
      statusAcess: 'Ativado',
      ativo: true,
      data_cadastro: new Date(),
    },
  });

  console.log('✅ Colaborador da Prefeitura criado:', colaboradorPrefeitura.email);

  // 7. Criar Admin da Empresa
  console.log('👨‍💼 Criando Admin da Empresa...');
  const adminEmpresa = await prisma.usuario.upsert({
    where: { email: 'admin@postoshell.com' },
    update: {},
    create: {
      email: 'admin@postoshell.com',
      senha: hashedPassword,
      nome: 'Administrador da Empresa',
      cpf: '33333333333',
      tipo_usuario: 'ADMIN_EMPRESA',
      empresaId: empresa.id,
      statusAcess: 'Ativado',
      ativo: true,
      data_cadastro: new Date(),
    },
  });

  console.log('✅ Admin da Empresa criado:', adminEmpresa.email);

  // 8. Criar Colaborador da Empresa
  console.log('👨‍💻 Criando Colaborador da Empresa...');
  const colaboradorEmpresa = await prisma.usuario.upsert({
    where: { email: 'colaborador@postoshell.com' },
    update: {},
    create: {
      email: 'colaborador@postoshell.com',
      senha: hashedPassword,
      nome: 'Colaborador da Empresa',
      cpf: '44444444444',
      tipo_usuario: 'COLABORADOR_EMPRESA',
      empresaId: empresa.id,
      statusAcess: 'Ativado',
      ativo: true,
      data_cadastro: new Date(),
    },
  });

  console.log('✅ Colaborador da Empresa criado:', colaboradorEmpresa.email);

  // 9. Criar Combustíveis de exemplo
  console.log('⛽ Criando Combustíveis de exemplo...');
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

  for (const combustivel of combustiveis) {
    await prisma.combustivel.upsert({
      where: { sigla: combustivel.sigla },
      update: {},
      create: combustivel,
    });
    console.log(`✅ Combustível criado: ${combustivel.nome}`);
  }

  // 10. Criar Categorias de exemplo
  console.log('📂 Criando Categorias de exemplo...');
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
      tipo_categoria: 'MOTORISTA',
      nome: 'Motoristas de Emergência',
      descricao: 'Motoristas habilitados para veículos de emergência',
    },
  ];

  for (const categoria of categorias) {
    await prisma.categoria.create({
      data: categoria as any,
    });
    console.log(`✅ Categoria criada: ${categoria.nome}`);
  }

  // 11. Criar Motorista de exemplo
  console.log('🚗 Criando Motorista de exemplo...');
  const motorista = await prisma.motorista.create({
    data: {
      prefeituraId: prefeitura.id,
      nome: 'João Silva',
      cpf: '55555555555',
      cnh: '12345678901',
      categoria_cnh: 'B',
      data_vencimento_cnh: new Date('2025-12-31'),
      telefone: '11988888888',
      email: 'joao.silva@prefeitura.sp.gov.br',
      endereco: 'Rua das Palmeiras, 456',
      ativo: true,
      observacoes: 'Motorista experiente com 10 anos de experiência',
    },
  });

  console.log('✅ Motorista criado:', motorista.nome);

  // 12. Criar Veículo de exemplo
  console.log('🚑 Criando Veículo de exemplo...');
  const veiculo = await prisma.veiculo.create({
    data: {
      prefeituraId: prefeitura.id,
      orgaoId: orgao.id,
      nome: 'Ambulância 01',
      placa: 'ABC-1234',
      modelo: 'Ford Transit',
      ano: 2020,
      tipo_abastecimento: 'COTA',
      ativo: true,
      capacidade_tanque: 80.0,
      tipo_veiculo: 'Ambulancia',
      situacao_veiculo: 'Proprio',
      periodicidade: 'Semanal',
      quantidade: 100.0,
      apelido: 'Ambulância da Saúde',
      ano_fabricacao: 2019,
      chassi: '9BWZZZZZZZZZZZZZZ',
      renavam: '12345678901',
      cor: 'Branco',
      capacidade_passageiros: 8,
      observacoes: 'Veículo em excelente estado de conservação',
    },
  });

  console.log('✅ Veículo criado:', veiculo.nome);

  console.log('🎉 Seed concluído com sucesso!');
  console.log('\n📋 Resumo dos dados criados:');
  console.log('👑 Super Admin: superadmin@nordev.com (senha: 123456)');
  console.log('🏛️ Admin Prefeitura: admin@prefeitura.sp.gov.br (senha: 123456)');
  console.log('👨‍💻 Colaborador Prefeitura: colaborador@prefeitura.sp.gov.br (senha: 123456)');
  console.log('🏢 Admin Empresa: admin@postoshell.com (senha: 123456)');
  console.log('👨‍💻 Colaborador Empresa: colaborador@postoshell.com (senha: 123456)');
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

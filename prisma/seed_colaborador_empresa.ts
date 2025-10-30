import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Iniciando seed para COLABORADOR_EMPRESA...');
  console.log('👤 Demonstrando os módulos que o COLABORADOR_EMPRESA pode visualizar');

  const hashedPassword = await bcrypt.hash('123456', 12);

  // ===============================
  // 1. EMPRESA (Contexto do colaborador)
  // ===============================
  console.log('🏢 1. Garantindo Empresa (contexto)...');
  const cnpjEmpresa = '66778899000110';

  let empresa = await prisma.empresa.findFirst({ where: { cnpj: cnpjEmpresa } });
  if (!empresa) {
    empresa = await prisma.empresa.create({
      data: {
        nome: 'Posto Colaborador Empresa Centro',
        cnpj: cnpjEmpresa,
        uf: 'SP',
        endereco: 'Av. das Nações, 500',
        endereco_completo: 'Av. das Nações, 500, Centro, São Paulo - SP',
        contato: 'Carla Nogueira',
        telefone: '11999990000',
        email: 'contato@colab-empresa.com',
        ativo: true,
        isPublic: true,
        tipo_empresa: 'POSTO_GASOLINA',
        bandeira: 'Bandeira Regional',
        horario_funcionamento: '24h',
        servicos_disponiveis: 'Abastecimento, Loja, Troca de Óleo',
        formas_pagamento: 'Dinheiro, Cartão, PIX',
        avaliacao: 4.4,
        total_avaliacoes: 27,
      },
    });
  }
  console.log('✅ Empresa pronta para visualização:', empresa.nome);

  // ===============================
  // 2. USUÁRIOS (Admin da empresa + Colaborador principal)
  // ===============================
  console.log('👥 2. Garantindo usuários de empresa (admin e colaborador)...');

  const adminEmpresa = await prisma.usuario.upsert({
    where: { email: 'admin@colab-empresa.com' },
    update: {},
    create: {
      email: 'admin@colab-empresa.com',
      senha: hashedPassword,
      nome: 'Admin Empresa (Contexto Colaborador)',
      cpf: '55544433322',
      tipo_usuario: 'ADMIN_EMPRESA',
      empresaId: empresa.id,
      statusAcess: 'Ativado',
      ativo: true,
      data_cadastro: new Date(),
      phone: '11988887777',
    },
  });

  const colaboradorPrincipal = await prisma.usuario.upsert({
    where: { email: 'colaborador@colab-empresa.com' },
    update: {},
    create: {
      email: 'colaborador@colab-empresa.com',
      senha: hashedPassword,
      nome: 'Colaborador Empresa Principal',
      cpf: '44433322211',
      tipo_usuario: 'COLABORADOR_EMPRESA',
      empresaId: empresa.id,
      statusAcess: 'Ativado',
      ativo: true,
      data_cadastro: new Date(),
      phone: '11977776666',
    },
  });

  console.log('✅ Usuários criados: Admin Empresa + Colaborador Empresa');

  // ===============================
  // 3. COMBUSTÍVEIS (Catálogo base - para visualizar em contratos e preços)
  // ===============================
  console.log('⛽ 3. Garantindo combustíveis base...');

  const gasolinaComum = await prisma.combustivel.upsert({
    where: { sigla: 'GAS_COMUM' },
    update: {},
    create: {
      nome: 'Gasolina Comum',
      sigla: 'GAS_COMUM',
      descricao: 'Gasolina comum para veículos leves',
      ativo: true,
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
    },
  });

  console.log('✅ Combustíveis disponíveis: Gasolina, Etanol, Diesel S10');

  // ===============================
  // 4. CONTRATOS (Dados que o colaborador pode visualizar)
  // ===============================
  console.log('📄 4. Criando contratos (contexto do colaborador)...');

  const contratoA = await prisma.contrato.create({
    data: {
      empresaId: empresa.id,
      empresa_contratante: 'Nordev',
      empresa_contratada: empresa.nome,
      title: 'Contrato de Fornecimento - Linha Principal',
      cnpj_empresa: empresa.cnpj,
      vigencia_inicio: new Date('2025-01-01'),
      vigencia_fim: new Date('2025-12-31'),
      ativo: true,
      anexo_contrato: 'contrato_fornecimento_principal_2025.pdf',
      anexo_contrato_assinado: 'contrato_fornecimento_principal_2025_assinado.pdf',
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  });

  const contratoB = await prisma.contrato.create({
    data: {
      empresaId: empresa.id,
      empresa_contratante: 'Nordev',
      empresa_contratada: empresa.nome,
      title: 'Contrato de Fornecimento - Linha Premium',
      cnpj_empresa: empresa.cnpj,
      vigencia_inicio: new Date('2025-01-01'),
      vigencia_fim: new Date('2025-12-31'),
      ativo: true,
      anexo_contrato: 'contrato_fornecimento_premium_2025.pdf',
      anexo_contrato_assinado: 'contrato_fornecimento_premium_2025_assinado.pdf',
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  });

  await prisma.contratoCombustivel.createMany({
    data: [
      { contratoId: contratoA.id, combustivelId: gasolinaComum.id, ativo: true },
      { contratoId: contratoA.id, combustivelId: etanol.id, ativo: true },
      { contratoId: contratoB.id, combustivelId: dieselS10.id, ativo: true },
      { contratoId: contratoB.id, combustivelId: gasolinaComum.id, ativo: true },
    ],
  });

  console.log('✅ Contratos criados e vinculados a combustíveis');

  // ===============================
  // 5. PREÇOS DA EMPRESA POR COMBUSTÍVEL (dados de referência para visualização)
  // ===============================
  console.log('💵 5. Criando preços por combustível (contexto)...');

  const agora = new Date();
  await prisma.empresaPrecoCombustivel.createMany({
    data: [
      {
        empresa_id: empresa.id,
        combustivel_id: gasolinaComum.id,
        preco_atual: 5.89,
        teto_vigente: 6.20,
        anp_base: 'MEDIO',
        anp_base_valor: 5.70,
        margem_app_pct: 3.00,
        uf_referencia: 'SP',
        status: 'ACTIVE',
        updated_at: agora,
        updated_by: adminEmpresa.email,
      },
      {
        empresa_id: empresa.id,
        combustivel_id: etanol.id,
        preco_atual: 4.09,
        teto_vigente: 4.50,
        anp_base: 'MEDIO',
        anp_base_valor: 3.95,
        margem_app_pct: 2.50,
        uf_referencia: 'SP',
        status: 'ACTIVE',
        updated_at: agora,
        updated_by: adminEmpresa.email,
      },
      {
        empresa_id: empresa.id,
        combustivel_id: dieselS10.id,
        preco_atual: 6.49,
        teto_vigente: 6.90,
        anp_base: 'MEDIO',
        anp_base_valor: 6.25,
        margem_app_pct: 2.20,
        uf_referencia: 'SP',
        status: 'ACTIVE',
        updated_at: agora,
        updated_by: adminEmpresa.email,
      },
    ],
  });

  console.log('✅ Tabela de preços preparada para visualização');

  // ===============================
  // RESUMO FINAL
  // ===============================
  console.log('\n🎉 ==========================================');
  console.log('🎉 SEED COLABORADOR_EMPRESA CONCLUÍDO!');
  console.log('🎉 ==========================================\n');

  console.log('📊 RESUMO DOS DADOS CRIADOS:');
  console.log('🏢 1 Empresa (Posto Colaborador Empresa Centro)');
  console.log('👑 1 Admin Empresa (contexto)');
  console.log('👤 1 Colaborador Empresa (principal)');
  console.log('⛽ 3 Combustíveis base');
  console.log('📄 2 Contratos vinculados a combustíveis');
  console.log('💵 3 Preços por combustível da empresa');

  console.log('\n🔐 CREDENCIAIS DE ACESSO (colaborador):');
  console.log('📧 Email: colaborador@colab-empresa.com');
  console.log('🔑 Senha: 123456');
  console.log('👤 Tipo: COLABORADOR_EMPRESA');
  console.log('🏢 Empresa:', empresa.nome);

  console.log('\n👁️ O COLABORADOR_EMPRESA pode:');
  console.log('- Visualizar usuários da própria empresa');
  console.log('- Visualizar contratos e combustíveis vinculados');
  console.log('- Visualizar preços de combustíveis da empresa');
}

main()
  .catch((e) => {
    console.error('❌ Erro durante o seed COLABORADOR_EMPRESA:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    console.log('🔌 Conexão com banco de dados encerrada.');
  });

import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Iniciando seed para ADMIN_EMPRESA...');
  console.log('🏢 Demonstrando todos os módulos acessíveis ao ADMIN_EMPRESA');

  const hashedPassword = await bcrypt.hash('123456', 12);

  // ===============================
  // 1. EMPRESA (Contexto do Admin Empresa)
  // ===============================
  console.log('🏢 1. Criando Empresa (contexto do ADMIN_EMPRESA)...');
  const cnpjEmpresa = '99887766000122';

  let empresa = await prisma.empresa.findFirst({ where: { cnpj: cnpjEmpresa } });
  if (!empresa) {
    empresa = await prisma.empresa.create({
      data: {
        nome: 'Posto Admin Empresa Centro',
        cnpj: cnpjEmpresa,
        uf: 'SP',
        endereco: 'Av. Central, 1000',
        endereco_completo: 'Av. Central, 1000, Centro, São Paulo - SP',
        contato: 'Bruno Andrade',
        telefone: '11988887777',
        email: 'contato@admin-empresa.com',
        ativo: true,
        isPublic: true,
        tipo_empresa: 'POSTO_GASOLINA',
        bandeira: 'Bandeira Local',
        horario_funcionamento: '24h',
        servicos_disponiveis: 'Abastecimento, Loja, Troca de Óleo',
        formas_pagamento: 'Dinheiro, Cartão, PIX',
        avaliacao: 4.6,
        total_avaliacoes: 42,
      },
    });
  }
  console.log('✅ Empresa pronta para uso:', empresa.nome);

  // ===============================
  // 2. USUÁRIOS DA EMPRESA (Admin + Colaboradores)
  // ===============================
  console.log('👥 2. Criando usuários da empresa...');

  const adminEmpresa = await prisma.usuario.upsert({
    where: { email: 'admin@admin-empresa.com' },
    update: {},
    create: {
      email: 'admin@admin-empresa.com',
      senha: hashedPassword,
      nome: 'Administrador Posto Admin Empresa',
      cpf: '99988877766',
      tipo_usuario: 'ADMIN_EMPRESA',
      empresaId: empresa.id,
      statusAcess: 'Ativado',
      ativo: true,
      data_cadastro: new Date(),
      phone: '11977776666',
    },
  });

  const colaborador1 = await prisma.usuario.upsert({
    where: { email: 'colaborador1@admin-empresa.com' },
    update: {},
    create: {
      email: 'colaborador1@admin-empresa.com',
      senha: hashedPassword,
      nome: 'Atendente Pista 01',
      cpf: '11122233344',
      tipo_usuario: 'COLABORADOR_EMPRESA',
      empresaId: empresa.id,
      statusAcess: 'Ativado',
      ativo: true,
      data_cadastro: new Date(),
      phone: '11966665555',
    },
  });

  const colaborador2 = await prisma.usuario.upsert({
    where: { email: 'colaborador2@admin-empresa.com' },
    update: {},
    create: {
      email: 'colaborador2@admin-empresa.com',
      senha: hashedPassword,
      nome: 'Atendente Caixa 01',
      cpf: '22233344455',
      tipo_usuario: 'COLABORADOR_EMPRESA',
      empresaId: empresa.id,
      statusAcess: 'Ativado',
      ativo: true,
      data_cadastro: new Date(),
      phone: '11955554444',
    },
  });

  console.log('✅ Usuários criados: Admin + 2 Colaboradores');

  // ===============================
  // 3. COMBUSTÍVEIS (Catálogo base para a empresa)
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
  // 4. CONTRATOS (Acordos comerciais da empresa)
  // ===============================
  console.log('📄 4. Criando contratos da empresa (exemplo)...');

  const contratoPrincipal = await prisma.contrato.create({
    data: {
      empresaId: empresa.id,
      empresa_contratante: 'Nordev',
      empresa_contratada: empresa.nome,
      title: 'Contrato Principal de Fornecimento',
      cnpj_empresa: empresa.cnpj,
      vigencia_inicio: new Date('2025-01-01'),
      vigencia_fim: new Date('2025-12-31'),
      ativo: true,
      anexo_contrato: 'contrato_admin_empresa_2025.pdf',
      anexo_contrato_assinado: 'contrato_admin_empresa_2025_assinado.pdf',
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  });

  // Vincular combustíveis ao contrato
  await prisma.contratoCombustivel.createMany({
    data: [
      { contratoId: contratoPrincipal.id, combustivelId: gasolinaComum.id, ativo: true },
      { contratoId: contratoPrincipal.id, combustivelId: etanol.id, ativo: true },
      { contratoId: contratoPrincipal.id, combustivelId: dieselS10.id, ativo: true },
    ],
  });

  console.log('✅ Contrato criado e vinculado a 3 combustíveis');

  // ===============================
  // 5. PREÇOS DA EMPRESA POR COMBUSTÍVEL (Tabela dinâmica)
  // ===============================
  console.log('💵 5. Definindo preços por combustível da empresa...');

  const agora = new Date();
  await prisma.empresaPrecoCombustivel.createMany({
    data: [
      {
        empresa_id: empresa.id,
        combustivel_id: gasolinaComum.id,
        preco_atual: 5.79,
        teto_vigente: 6.10,
        anp_base: 'MEDIO',
        anp_base_valor: 5.60,
        margem_app_pct: 3.50,
        uf_referencia: 'SP',
        status: 'ACTIVE',
        updated_at: agora,
        updated_by: adminEmpresa.email,
      },
      {
        empresa_id: empresa.id,
        combustivel_id: etanol.id,
        preco_atual: 3.99,
        teto_vigente: 4.40,
        anp_base: 'MEDIO',
        anp_base_valor: 3.85,
        margem_app_pct: 3.00,
        uf_referencia: 'SP',
        status: 'ACTIVE',
        updated_at: agora,
        updated_by: adminEmpresa.email,
      },
      {
        empresa_id: empresa.id,
        combustivel_id: dieselS10.id,
        preco_atual: 6.39,
        teto_vigente: 6.80,
        anp_base: 'MEDIO',
        anp_base_valor: 6.20,
        margem_app_pct: 2.50,
        uf_referencia: 'SP',
        status: 'ACTIVE',
        updated_at: agora,
        updated_by: adminEmpresa.email,
      },
    ],
  });

  console.log('✅ Preços cadastrados para Gasolina, Etanol e Diesel S10');

  // ===============================
  // 6. NOTIFICAÇÕES (Comunicações do posto)
  // ===============================
  console.log('🔔 6. Criando notificações para a empresa...');

  await prisma.notificacao.createMany({
    data: [
      {
        empresa_id: empresa.id,
        tipo: 'ATUALIZACAO_PRECOS',
        titulo: 'Atualização semanal de preços',
        mensagem: 'Preços atualizados conforme base ANP e teto vigente.',
        lida: false,
        data_notificacao: new Date(),
        notificado_por: adminEmpresa.nome,
        ativo: true,
      },
      {
        empresa_id: empresa.id,
        tipo: 'MANUTENCAO_SISTEMA',
        titulo: 'Janela de manutenção',
        mensagem: 'Sistema ficará indisponível no domingo das 02:00 às 04:00.',
        lida: false,
        data_notificacao: new Date(),
        notificado_por: adminEmpresa.nome,
        ativo: true,
      },
    ],
  });

  console.log('✅ Notificações criadas');

  // ===============================
  // RESUMO FINAL
  // ===============================
  console.log('\n🎉 ==========================================');
  console.log('🎉 SEED ADMIN_EMPRESA CONCLUÍDO COM SUCESSO!');
  console.log('🎉 ==========================================\n');

  console.log('📊 RESUMO DOS DADOS CRIADOS:');
  console.log('🏢 1 Empresa (Posto Admin Empresa Centro)');
  console.log('👑 1 Admin Empresa');
  console.log('👥 2 Colaboradores Empresa');
  console.log('⛽ 3 Combustíveis base (Gasolina, Etanol, Diesel S10)');
  console.log('📄 1 Contrato principal + vínculos com combustíveis');
  console.log('💵 3 Preços por combustível da empresa');
  console.log('🔔 2 Notificações criadas');

  console.log('\n🔐 CREDENCIAIS DE ACESSO:');
  console.log('📧 Email: admin@admin-empresa.com');
  console.log('🔑 Senha: 123456');
  console.log('👑 Tipo: ADMIN_EMPRESA');
  console.log('🏢 Empresa:', empresa.nome);

  console.log('\n🌐 ACESSO AO SISTEMA:');
  console.log('🚀 API: http://localhost:3000');
  console.log('📚 Documentação: http://localhost:3000/api/docs');

  console.log('\n✨ O ADMIN_EMPRESA pode gerenciar sua empresa, usuários, contratos,');
  console.log('   preços de combustíveis e notificações.');
}

main()
  .catch((e) => {
    console.error('❌ Erro durante o seed ADMIN_EMPRESA:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    console.log('🔌 Conexão com banco de dados encerrada.');
  });

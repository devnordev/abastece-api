import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('⛽ Iniciando cadastro de combustíveis...');

  // Lista de combustíveis para cadastrar
  const combustiveis = [
    {
      nome: 'ETANOL HIDRATADO',
      sigla: 'ETANOL',
      descricao: 'Etanol hidratado para veículos flex',
      ativo: true,
    },
    {
      nome: 'GASOLINA ADITIVADA',
      sigla: 'GAS_ADITIVADA',
      descricao: 'Gasolina com aditivos para melhor performance e limpeza do motor',
      ativo: true,
    },
    {
      nome: 'GASOLINA COMUM',
      sigla: 'GAS_COMUM',
      descricao: 'Gasolina comum para veículos leves',
      ativo: true,
    },
    {
      nome: 'GLP',
      sigla: 'GLP',
      descricao: 'Gás Liquefeito de Petróleo (Gás de cozinha)',
      ativo: true,
    },
    {
      nome: 'GNV',
      sigla: 'GNV',
      descricao: 'Gás Natural Veicular',
      ativo: true,
    },
    {
      nome: 'ÓLEO DIESEL',
      sigla: 'DIESEL',
      descricao: 'Óleo Diesel S500 (alto teor de enxofre)',
      ativo: true,
    },
    {
      nome: 'ÓLEO DIESEL S10',
      sigla: 'DIESEL_S10',
      descricao: 'Óleo Diesel S10 (baixo teor de enxofre)',
      ativo: true,
    },
  ];

  // Cadastrar cada combustível usando upsert (cria se não existe, atualiza se existe)
  for (const combustivel of combustiveis) {
    try {
      const result = await prisma.combustivel.upsert({
        where: { sigla: combustivel.sigla },
        update: {
          nome: combustivel.nome,
          descricao: combustivel.descricao,
          ativo: combustivel.ativo,
        },
        create: combustivel,
      });
      console.log(`✅ Combustível criado/atualizado: ${result.nome} (${result.sigla})`);
    } catch (error) {
      console.error(`❌ Erro ao cadastrar combustível ${combustivel.nome}:`, error);
    }
  }

  console.log('\n🎉 Cadastro de combustíveis concluído com sucesso!');
  console.log('\n📋 Resumo dos combustíveis cadastrados:');
  
  // Listar todos os combustíveis cadastrados
  const todosCombustiveis = await prisma.combustivel.findMany({
    orderBy: { nome: 'asc' },
  });
  
  todosCombustiveis.forEach((combustivel) => {
    console.log(`  - ${combustivel.nome} (${combustivel.sigla}) - ${combustivel.ativo ? '✅ Ativo' : '❌ Inativo'}`);
  });
}

main()
  .catch((e) => {
    console.error('❌ Erro durante o cadastro de combustíveis:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });


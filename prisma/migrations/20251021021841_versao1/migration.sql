-- CreateEnum
CREATE TYPE "UF" AS ENUM ('AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN', 'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO');

-- CreateEnum
CREATE TYPE "TipoUsuario" AS ENUM ('SUPER_ADMIN', 'ADMIN_PREFEITURA', 'COLABORADOR_PREFEITURA', 'ADMIN_EMPRESA', 'COLABORADOR_EMPRESA');

-- CreateEnum
CREATE TYPE "StatusAcesso" AS ENUM ('Acesso solicitado', 'Desativado', 'Em validação', 'Ativado');

-- CreateEnum
CREATE TYPE "TipoAbastecimento" AS ENUM ('COM_COTA', 'LIVRE', 'COM_AUTORIZACAO');

-- CreateEnum
CREATE TYPE "TipoAbastecimentoVeiculo" AS ENUM ('COTA', 'LIVRE', 'COM_AUTORIZACAO');

-- CreateEnum
CREATE TYPE "StatusAbastecimento" AS ENUM ('Aguardando', 'Aprovado', 'Rejeitado', 'Cancelado');

-- CreateEnum
CREATE TYPE "TipoVeiculo" AS ENUM ('Ambulância', 'Caminhão', 'Caminhonete', 'Carro', 'Máquina Pesada', 'Microônibus', 'Moto', 'Ônibus', 'Outro');

-- CreateEnum
CREATE TYPE "SituacaoVeiculo" AS ENUM ('Locado', 'Particular à serviço', 'Próprio');

-- CreateEnum
CREATE TYPE "Periodicidade" AS ENUM ('Diário', 'Semanal', 'Mensal');

-- CreateEnum
CREATE TYPE "TipoEmpresa" AS ENUM ('POSTO_GASOLINA', 'DISTRIBUIDORA', 'OUTROS');

-- CreateEnum
CREATE TYPE "TipoContrato" AS ENUM ('OBJETIVO', 'CONSORCIADO');

-- CreateEnum
CREATE TYPE "TipoDocumento" AS ENUM ('LICITAÇÃO', 'CONTRATO', 'ARP');

-- CreateEnum
CREATE TYPE "TipoItens" AS ENUM ('QUANTIDADE_LITROS');

-- CreateEnum
CREATE TYPE "StatusProcesso" AS ENUM ('ATIVO', 'DESATIVADO', 'EM_ANDAMENTO', 'CANCELADO');

-- CreateEnum
CREATE TYPE "TipoCategoria" AS ENUM ('VEICULO', 'MOTORISTA', 'OUTRO');

-- CreateEnum
CREATE TYPE "AnpBase" AS ENUM ('MINIMO', 'MEDIO', 'MAXIMO');

-- CreateEnum
CREATE TYPE "StatusPreco" AS ENUM ('ACTIVE', 'INACTIVE_AUTO', 'INACTIVE_MANUAL');

-- CreateEnum
CREATE TYPE "TipoCombustivelAnp" AS ENUM ('GASOLINA_COMUM', 'GASOLINA_ADITIVADA', 'ETANOL_COMUM', 'ETANOL_ADITIVADO', 'DIESEL_S10', 'DIESEL_S500', 'GNV', 'GLP');

-- CreateEnum
CREATE TYPE "TipoAditivo" AS ENUM ('PRAZO');

-- CreateEnum
CREATE TYPE "TipoAditivoProcesso" AS ENUM ('PRAZO', 'QUANTIDADE');

-- CreateEnum
CREATE TYPE "OperacaoAditivo" AS ENUM ('ADICIONAR', 'SUBTRAIR');

-- CreateEnum
CREATE TYPE "AcaoLog" AS ENUM ('INSERT', 'UPDATE', 'DELETE');

-- CreateEnum
CREATE TYPE "TipoNotificacao" AS ENUM ('RECLASSIFICACAO_SEMANA_ANP', 'ATUALIZACAO_PRECOS', 'MANUTENCAO_SISTEMA', 'OUTROS');

-- CreateEnum
CREATE TYPE "StatusSystem" AS ENUM ('Ligado', 'Desligado');

-- CreateEnum
CREATE TYPE "StatusAdesao" AS ENUM ('ATIVA', 'INATIVA', 'PENDENTE');

-- CreateEnum
CREATE TYPE "TipoAbastecimentoSolicitacao" AS ENUM ('COTA', 'COM_COTA', 'LIVRE', 'COM_AUTORIZACAO');

-- CreateEnum
CREATE TYPE "StatusSolicitacao" AS ENUM ('PENDENTE', 'APROVADA', 'REJEITADA', 'EXPIRADA', 'EFETIVADA');

-- CreateTable
CREATE TABLE "prefeitura" (
    "id" SERIAL NOT NULL,
    "nome" TEXT NOT NULL,
    "cnpj" TEXT NOT NULL,
    "imagem_perfil" TEXT,
    "email_administrativo" TEXT NOT NULL,
    "data_cadastro" TIMESTAMP(3),
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "requer_cupom_fiscal" BOOLEAN,

    CONSTRAINT "prefeitura_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "usuario" (
    "id" SERIAL NOT NULL,
    "prefeituraId" INTEGER,
    "email" TEXT NOT NULL,
    "senha" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "data_cadastro" TIMESTAMP(3),
    "ultimo_login" TIMESTAMP(3),
    "tipo_usuario" "TipoUsuario" NOT NULL,
    "empresaId" INTEGER,
    "imagem_perfil" TEXT,
    "cpf" TEXT NOT NULL,
    "phone" TEXT,
    "statusAcess" "StatusAcesso" NOT NULL,
    "ativo" BOOLEAN NOT NULL,

    CONSTRAINT "usuario_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "empresa" (
    "id" SERIAL NOT NULL,
    "nome" TEXT NOT NULL,
    "cnpj" TEXT NOT NULL,
    "endereco" TEXT,
    "uf" "UF" NOT NULL,
    "contato" TEXT,
    "ativo" BOOLEAN NOT NULL,
    "imagem_perfil" TEXT,
    "isPublic" BOOLEAN NOT NULL,
    "tipo_empresa" "TipoEmpresa" DEFAULT 'POSTO_GASOLINA',
    "latitude" DECIMAL(10,8),
    "longitude" DECIMAL(11,8),
    "endereco_completo" TEXT,
    "horario_funcionamento" TEXT,
    "telefone" TEXT,
    "email" TEXT,
    "website" TEXT,
    "bandeira" TEXT,
    "servicos_disponiveis" TEXT,
    "formas_pagamento" TEXT,
    "avaliacao" DECIMAL(3,2),
    "total_avaliacoes" INTEGER DEFAULT 0,

    CONSTRAINT "empresa_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "orgao" (
    "id" SERIAL NOT NULL,
    "prefeituraId" INTEGER NOT NULL,
    "nome" TEXT NOT NULL,
    "sigla" TEXT NOT NULL,
    "ativo" BOOLEAN,

    CONSTRAINT "orgao_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "contrato" (
    "id" SERIAL NOT NULL,
    "empresaId" INTEGER NOT NULL,
    "empresa_contratante" TEXT NOT NULL DEFAULT 'Nordev',
    "empresa_contratada" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "cnpj_empresa" TEXT NOT NULL,
    "vigencia_inicio" TIMESTAMP(3),
    "vigencia_fim" TIMESTAMP(3),
    "ativo" BOOLEAN NOT NULL,
    "anexo_contrato" TEXT,
    "anexo_contrato_assinado" TEXT,
    "createdAt" TIMESTAMP(3),
    "updatedAt" TIMESTAMP(3),

    CONSTRAINT "contrato_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "combustivel" (
    "id" SERIAL NOT NULL,
    "nome" TEXT NOT NULL,
    "sigla" TEXT NOT NULL,
    "descricao" TEXT,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "observacoes" TEXT,

    CONSTRAINT "combustivel_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "categoria" (
    "id" SERIAL NOT NULL,
    "prefeituraId" INTEGER NOT NULL,
    "tipo_categoria" "TipoCategoria" NOT NULL,
    "nome" TEXT NOT NULL,
    "descricao" TEXT,
    "ativo" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "categoria_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "motorista" (
    "id" SERIAL NOT NULL,
    "prefeituraId" INTEGER NOT NULL,
    "nome" TEXT NOT NULL,
    "cpf" TEXT NOT NULL,
    "cnh" TEXT,
    "categoria_cnh" TEXT,
    "data_vencimento_cnh" TIMESTAMP(3),
    "telefone" TEXT,
    "email" TEXT,
    "endereco" TEXT,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "observacoes" TEXT,

    CONSTRAINT "motorista_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "veiculo" (
    "id" SERIAL NOT NULL,
    "prefeituraId" INTEGER NOT NULL,
    "orgaoId" INTEGER,
    "contaFaturamentoOrgaoId" INTEGER,
    "nome" TEXT NOT NULL,
    "placa" TEXT NOT NULL,
    "modelo" TEXT,
    "ano" INTEGER NOT NULL,
    "tipo_abastecimento" "TipoAbastecimentoVeiculo" NOT NULL DEFAULT 'COTA',
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "capacidade_tanque" DECIMAL(10,2) NOT NULL,
    "tipo_veiculo" "TipoVeiculo" DEFAULT 'Outro',
    "situacao_veiculo" "SituacaoVeiculo" DEFAULT 'Próprio',
    "observacoes" TEXT,
    "periodicidade" "Periodicidade",
    "quantidade" DECIMAL(10,1),
    "apelido" TEXT,
    "ano_fabricacao" INTEGER,
    "chassi" TEXT,
    "renavam" TEXT,
    "crlv" TEXT,
    "crlv_vencimento" TIMESTAMP(3),
    "tacografo" TEXT,
    "foto_veiculo" TEXT,
    "foto_crlv" TEXT,
    "cor" TEXT,
    "capacidade_passageiros" INTEGER,

    CONSTRAINT "veiculo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "abastecimento" (
    "id" SERIAL NOT NULL,
    "veiculoId" INTEGER NOT NULL,
    "motoristaId" INTEGER,
    "combustivelId" INTEGER NOT NULL,
    "empresaId" INTEGER NOT NULL,
    "solicitanteId" INTEGER,
    "abastecedorId" INTEGER,
    "validadorId" INTEGER,
    "tipo_abastecimento" "TipoAbastecimento" NOT NULL,
    "quantidade" DECIMAL(10,3) NOT NULL,
    "preco_anp" DECIMAL(10,2),
    "preco_empresa" DECIMAL(10,2),
    "desconto" DECIMAL(10,2) DEFAULT 0.00,
    "valor_total" DECIMAL(10,2) NOT NULL,
    "data_abastecimento" TIMESTAMP(3),
    "odometro" INTEGER,
    "orimetro" INTEGER,
    "status" "StatusAbastecimento" NOT NULL DEFAULT 'Aguardando',
    "motivo_rejeicao" TEXT,
    "abastecido_por" TEXT,
    "nfe_chave_acesso" TEXT,
    "nfe_img_url" TEXT,
    "nfe_link" TEXT,
    "conta_faturamento_orgao_id" INTEGER,
    "cota_id" INTEGER,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "data_aprovacao" TIMESTAMP(3),
    "data_rejeicao" TIMESTAMP(3),
    "aprovado_por" TEXT,
    "aprovado_por_email" TEXT,
    "rejeitado_por" TEXT,
    "rejeitado_por_email" TEXT,

    CONSTRAINT "abastecimento_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cota_orgao" (
    "id" SERIAL NOT NULL,
    "processoId" INTEGER NOT NULL,
    "orgaoId" INTEGER NOT NULL,
    "combustivelId" INTEGER NOT NULL,
    "quantidade" DECIMAL(10,3) NOT NULL,
    "quantidade_utilizada" DECIMAL(10,1) NOT NULL DEFAULT 0,
    "valor_utilizado" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "restante" DECIMAL(10,1),
    "saldo_disponivel_cota" DECIMAL(10,2) DEFAULT 0.00,
    "ativa" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "cota_orgao_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "conta_faturamento_orgao" (
    "id" SERIAL NOT NULL,
    "prefeituraId" INTEGER NOT NULL,
    "orgaoId" INTEGER NOT NULL,
    "nome" TEXT NOT NULL,
    "descricao" TEXT,

    CONSTRAINT "conta_faturamento_orgao_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "processo" (
    "id" SERIAL NOT NULL,
    "tipo_contrato" "TipoContrato" NOT NULL DEFAULT 'OBJETIVO',
    "prefeituraId" INTEGER,
    "litros_desejados" DECIMAL(10,2),
    "valor_utilizado" DECIMAL(10,2),
    "valor_disponivel" DECIMAL(10,2),
    "numero_processo" TEXT NOT NULL,
    "numero_documento" TEXT NOT NULL,
    "tipo_documento" "TipoDocumento" NOT NULL,
    "tipo_itens" "TipoItens" NOT NULL DEFAULT 'QUANTIDADE_LITROS',
    "objeto" TEXT NOT NULL,
    "data_abertura" TIMESTAMP(3) NOT NULL,
    "data_encerramento" TIMESTAMP(3) NOT NULL,
    "status" "StatusProcesso" NOT NULL DEFAULT 'ATIVO',
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "observacoes" TEXT,
    "arquivo_contrato" TEXT,

    CONSTRAINT "processo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "contrato_combustivel" (
    "id" SERIAL NOT NULL,
    "contratoId" INTEGER NOT NULL,
    "combustivelId" INTEGER NOT NULL,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3),
    "updatedAt" TIMESTAMP(3),

    CONSTRAINT "contrato_combustivel_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "veiculo_combustivel" (
    "id" SERIAL NOT NULL,
    "veiculoId" INTEGER NOT NULL,
    "combustivelId" INTEGER NOT NULL,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "observacoes" TEXT,

    CONSTRAINT "veiculo_combustivel_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "veiculo_categoria" (
    "id" SERIAL NOT NULL,
    "veiculoId" INTEGER NOT NULL,
    "categoriaId" INTEGER NOT NULL,
    "ativo" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "veiculo_categoria_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "veiculo_motorista" (
    "id" SERIAL NOT NULL,
    "veiculoId" INTEGER NOT NULL,
    "motoristaId" INTEGER NOT NULL,
    "data_inicio" TIMESTAMP(3) NOT NULL,
    "data_fim" TIMESTAMP(3),
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "observacoes" TEXT,

    CONSTRAINT "veiculo_motorista_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "usuario_orgao" (
    "id" SERIAL NOT NULL,
    "usuarioId" INTEGER NOT NULL,
    "orgaoId" INTEGER NOT NULL,
    "ativo" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "usuario_orgao_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "processo_combustivel" (
    "id" SERIAL NOT NULL,
    "processoId" INTEGER NOT NULL,
    "combustivelId" INTEGER NOT NULL,
    "quantidade_litros" DECIMAL(10,2) NOT NULL,
    "valor_unitario" DECIMAL(10,2),
    "saldo_bloqueado_processo" DECIMAL(10,2) DEFAULT 0.00,
    "saldo_disponivel_processo" DECIMAL(10,2) DEFAULT 0.00,

    CONSTRAINT "processo_combustivel_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "processo_combustivel_consorciado" (
    "id" SERIAL NOT NULL,
    "processoId" INTEGER NOT NULL,
    "combustivelId" INTEGER NOT NULL,
    "quantidade_litros" DECIMAL(10,2) NOT NULL,
    "saldo_bloqueado_processo" DECIMAL(10,2) DEFAULT 0.00,
    "saldo_disponivel_processo" DECIMAL(10,2) DEFAULT 0.00,
    "ativo" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "processo_combustivel_consorciado_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "processo_prefeitura_consorcio" (
    "id" SERIAL NOT NULL,
    "processoId" INTEGER NOT NULL,
    "prefeituraId" INTEGER NOT NULL,
    "litros_alocados" DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    "percentual_participacao" DECIMAL(5,2),
    "data_adesao" TIMESTAMP(3) NOT NULL,
    "status_adesao" "StatusAdesao" NOT NULL DEFAULT 'ATIVA',
    "observacoes" TEXT,
    "ativo" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "processo_prefeitura_consorcio_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "processo_prefeitura_combustivel_consorcio" (
    "id" SERIAL NOT NULL,
    "processoId" INTEGER NOT NULL,
    "prefeituraId" INTEGER NOT NULL,
    "combustivelId" INTEGER NOT NULL,
    "litros_alocados" DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    "percentual_combustivel" DECIMAL(5,2),
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "saldo_bloqueado_processo" DECIMAL(10,2) DEFAULT 0.00,
    "saldo_disponivel_processo" DECIMAL(10,2) DEFAULT 0.00,

    CONSTRAINT "processo_prefeitura_combustivel_consorcio_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "empresa_preco_combustivel" (
    "id" SERIAL NOT NULL,
    "empresa_id" INTEGER NOT NULL,
    "combustivel_id" INTEGER NOT NULL,
    "preco_atual" DECIMAL(10,2) NOT NULL,
    "teto_vigente" DECIMAL(10,2) NOT NULL,
    "anp_base" "AnpBase" NOT NULL,
    "anp_base_valor" DECIMAL(10,2) NOT NULL,
    "margem_app_pct" DECIMAL(5,2) NOT NULL,
    "uf_referencia" CHAR(2) NOT NULL,
    "status" "StatusPreco" NOT NULL DEFAULT 'ACTIVE',
    "updated_at" TIMESTAMP(3) NOT NULL,
    "updated_by" TEXT,

    CONSTRAINT "empresa_preco_combustivel_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "aditivo_contrato" (
    "id" SERIAL NOT NULL,
    "contratoId" INTEGER NOT NULL,
    "tipo" "TipoAditivo" NOT NULL,
    "valor" DECIMAL(10,2),
    "data_anterior" TIMESTAMP(3),
    "data_apos" TIMESTAMP(3),
    "motivo" TEXT NOT NULL,
    "arquivo_atestado" TEXT,
    "data_registro" TIMESTAMP(3) NOT NULL,
    "nome_usuario" VARCHAR(100),
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3),
    "updatedAt" TIMESTAMP(3),

    CONSTRAINT "aditivo_contrato_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "aditivo_processo" (
    "id" SERIAL NOT NULL,
    "processoId" INTEGER NOT NULL,
    "tipo" "TipoAditivoProcesso" NOT NULL,
    "operacao" "OperacaoAditivo",
    "valor" DECIMAL(10,2),
    "data_anterior" TIMESTAMP(3),
    "data_apos" TIMESTAMP(3),
    "itemId" INTEGER,
    "motivo" TEXT NOT NULL,
    "arquivo_atestado" TEXT,
    "data_registro" TIMESTAMP(3) NOT NULL,
    "nome_usuario" VARCHAR(100),
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3),
    "updatedAt" TIMESTAMP(3),

    CONSTRAINT "aditivo_processo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "anp_semana" (
    "id" SERIAL NOT NULL,
    "semana_ref" DATE NOT NULL,
    "publicada_em" TIMESTAMP(3) NOT NULL,
    "ativo" BOOLEAN NOT NULL DEFAULT false,
    "observacoes" TEXT,
    "importado_em" TIMESTAMP(3),

    CONSTRAINT "anp_semana_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "anp_precos_uf" (
    "id" SERIAL NOT NULL,
    "anp_semana_id" INTEGER NOT NULL,
    "uf" "UF" NOT NULL,
    "combustivel" "TipoCombustivelAnp" NOT NULL,
    "preco_minimo" DECIMAL(10,2),
    "preco_medio" DECIMAL(10,2) NOT NULL,
    "preco_maximo" DECIMAL(10,2),
    "teto_calculado" DECIMAL(10,2),
    "base_utilizada" "AnpBase",
    "margem_aplicada" DECIMAL(5,2),

    CONSTRAINT "anp_precos_uf_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "logs_alteracoes" (
    "id" SERIAL NOT NULL,
    "tabela" VARCHAR(100) NOT NULL,
    "registro_id" INTEGER NOT NULL,
    "acao" "AcaoLog" NOT NULL,
    "campo_alterado" VARCHAR(100),
    "valor_antes" TEXT,
    "valor_depois" TEXT,
    "executado_por" INTEGER,
    "executado_em" TIMESTAMP(3) NOT NULL,
    "contexto" VARCHAR(100),
    "ip_address" VARCHAR(45),
    "user_agent" TEXT,

    CONSTRAINT "logs_alteracoes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notificacao" (
    "id" SERIAL NOT NULL,
    "empresa_id" INTEGER NOT NULL,
    "tipo" "TipoNotificacao" NOT NULL DEFAULT 'OUTROS',
    "titulo" TEXT NOT NULL,
    "mensagem" TEXT NOT NULL,
    "lida" BOOLEAN NOT NULL DEFAULT false,
    "data_notificacao" TIMESTAMP(3) NOT NULL,
    "data_leitura" TIMESTAMP(3),
    "notificado_por" TEXT,
    "dados_extras" JSONB,
    "ativo" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "notificacao_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "onoff" (
    "id" SERIAL NOT NULL,
    "ligadodesligado" BOOLEAN NOT NULL DEFAULT true,
    "status_system" "StatusSystem",

    CONSTRAINT "onoff_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "onoffapp" (
    "id" SERIAL NOT NULL,
    "ligadodesligado" BOOLEAN NOT NULL DEFAULT false,
    "status_system" "StatusSystem",

    CONSTRAINT "onoffapp_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "parametros_teto" (
    "id" SERIAL NOT NULL,
    "anp_base" "AnpBase" NOT NULL DEFAULT 'MEDIO',
    "margem_pct" DECIMAL(5,2),
    "excecoes_combustivel" TEXT,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "observacoes" TEXT,

    CONSTRAINT "parametros_teto_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "refresh_token" (
    "id" SERIAL NOT NULL,
    "usuarioId" INTEGER NOT NULL,
    "token" TEXT NOT NULL,
    "expiracao" TIMESTAMP(3) NOT NULL,
    "criadoEm" TIMESTAMP(3) NOT NULL,
    "revogadoEm" TIMESTAMP(3),
    "ipCriacao" TEXT,
    "ipRevogacao" TEXT,
    "userAgent" TEXT,

    CONSTRAINT "refresh_token_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "solicitacoes_abastecimento" (
    "id" SERIAL NOT NULL,
    "prefeituraId" INTEGER NOT NULL,
    "veiculoId" INTEGER NOT NULL,
    "motoristaId" INTEGER,
    "combustivelId" INTEGER NOT NULL,
    "empresaId" INTEGER NOT NULL,
    "quantidade" DECIMAL(10,2) NOT NULL,
    "data_solicitacao" TIMESTAMP(3) NOT NULL,
    "data_expiracao" TIMESTAMP(3) NOT NULL,
    "tipo_abastecimento" "TipoAbastecimentoSolicitacao" NOT NULL,
    "status" "StatusSolicitacao" NOT NULL DEFAULT 'PENDENTE',
    "nfe_chave_acesso" TEXT,
    "nfe_img_url" TEXT,
    "motivo_rejeicao" TEXT,
    "aprovado_por" TEXT,
    "aprovado_por_email" TEXT,
    "aprovado_por_empresa" TEXT,
    "data_aprovacao" TIMESTAMP(3),
    "rejeitado_por" TEXT,
    "rejeitado_por_email" TEXT,
    "rejeitado_por_empresa" TEXT,
    "data_rejeicao" TIMESTAMP(3),
    "conta_faturamento_orgao_id" INTEGER,
    "abastecido_por" TEXT DEFAULT 'Sistema',
    "valor_total" DECIMAL(10,2),
    "preco_empresa" DECIMAL(10,2),
    "abastecimento_id" INTEGER,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "observacoes" TEXT,
    "created_at" TIMESTAMP(3),
    "updated_at" TIMESTAMP(3),

    CONSTRAINT "solicitacoes_abastecimento_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "veiculo_cota_periodo" (
    "id" SERIAL NOT NULL,
    "veiculoId" INTEGER NOT NULL,
    "data_inicio_periodo" TIMESTAMP(3) NOT NULL,
    "data_fim_periodo" TIMESTAMP(3) NOT NULL,
    "quantidade_permitida" DECIMAL(10,1) NOT NULL,
    "quantidade_utilizada" DECIMAL(10,1) NOT NULL DEFAULT 0,
    "quantidade_disponivel" DECIMAL(10,1) NOT NULL,
    "periodicidade" "Periodicidade" NOT NULL,
    "ativo" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "veiculo_cota_periodo_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "prefeitura_cnpj_key" ON "prefeitura"("cnpj");

-- CreateIndex
CREATE UNIQUE INDEX "prefeitura_email_administrativo_key" ON "prefeitura"("email_administrativo");

-- CreateIndex
CREATE UNIQUE INDEX "usuario_email_key" ON "usuario"("email");

-- CreateIndex
CREATE UNIQUE INDEX "usuario_cpf_key" ON "usuario"("cpf");

-- CreateIndex
CREATE UNIQUE INDEX "usuario_phone_key" ON "usuario"("phone");

-- CreateIndex
CREATE UNIQUE INDEX "combustivel_sigla_key" ON "combustivel"("sigla");

-- CreateIndex
CREATE UNIQUE INDEX "motorista_cpf_key" ON "motorista"("cpf");

-- CreateIndex
CREATE UNIQUE INDEX "veiculo_placa_key" ON "veiculo"("placa");

-- CreateIndex
CREATE UNIQUE INDEX "contrato_combustivel_contratoId_combustivelId_key" ON "contrato_combustivel"("contratoId", "combustivelId");

-- CreateIndex
CREATE UNIQUE INDEX "veiculo_categoria_veiculoId_categoriaId_key" ON "veiculo_categoria"("veiculoId", "categoriaId");

-- CreateIndex
CREATE UNIQUE INDEX "processo_combustivel_consorciado_processoId_combustivelId_key" ON "processo_combustivel_consorciado"("processoId", "combustivelId");

-- CreateIndex
CREATE UNIQUE INDEX "processo_prefeitura_combustivel_consorcio_processoId_prefei_key" ON "processo_prefeitura_combustivel_consorcio"("processoId", "prefeituraId", "combustivelId");

-- CreateIndex
CREATE UNIQUE INDEX "refresh_token_token_key" ON "refresh_token"("token");

-- CreateIndex
CREATE UNIQUE INDEX "solicitacoes_abastecimento_abastecimento_id_key" ON "solicitacoes_abastecimento"("abastecimento_id");

-- AddForeignKey
ALTER TABLE "usuario" ADD CONSTRAINT "usuario_prefeituraId_fkey" FOREIGN KEY ("prefeituraId") REFERENCES "prefeitura"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "usuario" ADD CONSTRAINT "usuario_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "empresa"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "orgao" ADD CONSTRAINT "orgao_prefeituraId_fkey" FOREIGN KEY ("prefeituraId") REFERENCES "prefeitura"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contrato" ADD CONSTRAINT "contrato_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "empresa"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "categoria" ADD CONSTRAINT "categoria_prefeituraId_fkey" FOREIGN KEY ("prefeituraId") REFERENCES "prefeitura"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "motorista" ADD CONSTRAINT "motorista_prefeituraId_fkey" FOREIGN KEY ("prefeituraId") REFERENCES "prefeitura"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "veiculo" ADD CONSTRAINT "veiculo_prefeituraId_fkey" FOREIGN KEY ("prefeituraId") REFERENCES "prefeitura"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "veiculo" ADD CONSTRAINT "veiculo_orgaoId_fkey" FOREIGN KEY ("orgaoId") REFERENCES "orgao"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "veiculo" ADD CONSTRAINT "veiculo_contaFaturamentoOrgaoId_fkey" FOREIGN KEY ("contaFaturamentoOrgaoId") REFERENCES "conta_faturamento_orgao"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "abastecimento" ADD CONSTRAINT "abastecimento_veiculoId_fkey" FOREIGN KEY ("veiculoId") REFERENCES "veiculo"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "abastecimento" ADD CONSTRAINT "abastecimento_motoristaId_fkey" FOREIGN KEY ("motoristaId") REFERENCES "motorista"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "abastecimento" ADD CONSTRAINT "abastecimento_combustivelId_fkey" FOREIGN KEY ("combustivelId") REFERENCES "combustivel"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "abastecimento" ADD CONSTRAINT "abastecimento_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "empresa"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "abastecimento" ADD CONSTRAINT "abastecimento_solicitanteId_fkey" FOREIGN KEY ("solicitanteId") REFERENCES "usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "abastecimento" ADD CONSTRAINT "abastecimento_abastecedorId_fkey" FOREIGN KEY ("abastecedorId") REFERENCES "empresa"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "abastecimento" ADD CONSTRAINT "abastecimento_validadorId_fkey" FOREIGN KEY ("validadorId") REFERENCES "usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "abastecimento" ADD CONSTRAINT "abastecimento_conta_faturamento_orgao_id_fkey" FOREIGN KEY ("conta_faturamento_orgao_id") REFERENCES "conta_faturamento_orgao"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "abastecimento" ADD CONSTRAINT "abastecimento_cota_id_fkey" FOREIGN KEY ("cota_id") REFERENCES "cota_orgao"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cota_orgao" ADD CONSTRAINT "cota_orgao_orgaoId_fkey" FOREIGN KEY ("orgaoId") REFERENCES "orgao"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cota_orgao" ADD CONSTRAINT "cota_orgao_processoId_fkey" FOREIGN KEY ("processoId") REFERENCES "processo"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cota_orgao" ADD CONSTRAINT "cota_orgao_combustivelId_fkey" FOREIGN KEY ("combustivelId") REFERENCES "combustivel"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "conta_faturamento_orgao" ADD CONSTRAINT "conta_faturamento_orgao_prefeituraId_fkey" FOREIGN KEY ("prefeituraId") REFERENCES "prefeitura"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "conta_faturamento_orgao" ADD CONSTRAINT "conta_faturamento_orgao_orgaoId_fkey" FOREIGN KEY ("orgaoId") REFERENCES "orgao"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "processo" ADD CONSTRAINT "processo_prefeituraId_fkey" FOREIGN KEY ("prefeituraId") REFERENCES "prefeitura"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contrato_combustivel" ADD CONSTRAINT "contrato_combustivel_contratoId_fkey" FOREIGN KEY ("contratoId") REFERENCES "contrato"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contrato_combustivel" ADD CONSTRAINT "contrato_combustivel_combustivelId_fkey" FOREIGN KEY ("combustivelId") REFERENCES "combustivel"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "veiculo_combustivel" ADD CONSTRAINT "veiculo_combustivel_veiculoId_fkey" FOREIGN KEY ("veiculoId") REFERENCES "veiculo"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "veiculo_combustivel" ADD CONSTRAINT "veiculo_combustivel_combustivelId_fkey" FOREIGN KEY ("combustivelId") REFERENCES "combustivel"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "veiculo_categoria" ADD CONSTRAINT "veiculo_categoria_veiculoId_fkey" FOREIGN KEY ("veiculoId") REFERENCES "veiculo"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "veiculo_categoria" ADD CONSTRAINT "veiculo_categoria_categoriaId_fkey" FOREIGN KEY ("categoriaId") REFERENCES "categoria"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "veiculo_motorista" ADD CONSTRAINT "veiculo_motorista_veiculoId_fkey" FOREIGN KEY ("veiculoId") REFERENCES "veiculo"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "veiculo_motorista" ADD CONSTRAINT "veiculo_motorista_motoristaId_fkey" FOREIGN KEY ("motoristaId") REFERENCES "motorista"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "usuario_orgao" ADD CONSTRAINT "usuario_orgao_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "usuario_orgao" ADD CONSTRAINT "usuario_orgao_orgaoId_fkey" FOREIGN KEY ("orgaoId") REFERENCES "orgao"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "processo_combustivel" ADD CONSTRAINT "processo_combustivel_processoId_fkey" FOREIGN KEY ("processoId") REFERENCES "processo"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "processo_combustivel" ADD CONSTRAINT "processo_combustivel_combustivelId_fkey" FOREIGN KEY ("combustivelId") REFERENCES "combustivel"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "processo_combustivel_consorciado" ADD CONSTRAINT "processo_combustivel_consorciado_processoId_fkey" FOREIGN KEY ("processoId") REFERENCES "processo"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "processo_combustivel_consorciado" ADD CONSTRAINT "processo_combustivel_consorciado_combustivelId_fkey" FOREIGN KEY ("combustivelId") REFERENCES "combustivel"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "processo_prefeitura_consorcio" ADD CONSTRAINT "processo_prefeitura_consorcio_processoId_fkey" FOREIGN KEY ("processoId") REFERENCES "processo"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "processo_prefeitura_consorcio" ADD CONSTRAINT "processo_prefeitura_consorcio_prefeituraId_fkey" FOREIGN KEY ("prefeituraId") REFERENCES "prefeitura"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "processo_prefeitura_combustivel_consorcio" ADD CONSTRAINT "processo_prefeitura_combustivel_consorcio_processoId_fkey" FOREIGN KEY ("processoId") REFERENCES "processo"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "processo_prefeitura_combustivel_consorcio" ADD CONSTRAINT "processo_prefeitura_combustivel_consorcio_prefeituraId_fkey" FOREIGN KEY ("prefeituraId") REFERENCES "prefeitura"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "processo_prefeitura_combustivel_consorcio" ADD CONSTRAINT "processo_prefeitura_combustivel_consorcio_combustivelId_fkey" FOREIGN KEY ("combustivelId") REFERENCES "combustivel"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "empresa_preco_combustivel" ADD CONSTRAINT "empresa_preco_combustivel_empresa_id_fkey" FOREIGN KEY ("empresa_id") REFERENCES "empresa"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "empresa_preco_combustivel" ADD CONSTRAINT "empresa_preco_combustivel_combustivel_id_fkey" FOREIGN KEY ("combustivel_id") REFERENCES "combustivel"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "aditivo_contrato" ADD CONSTRAINT "aditivo_contrato_contratoId_fkey" FOREIGN KEY ("contratoId") REFERENCES "contrato"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "aditivo_processo" ADD CONSTRAINT "aditivo_processo_processoId_fkey" FOREIGN KEY ("processoId") REFERENCES "processo"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "aditivo_processo" ADD CONSTRAINT "aditivo_processo_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "processo_combustivel"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "anp_precos_uf" ADD CONSTRAINT "anp_precos_uf_anp_semana_id_fkey" FOREIGN KEY ("anp_semana_id") REFERENCES "anp_semana"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "logs_alteracoes" ADD CONSTRAINT "logs_alteracoes_executado_por_fkey" FOREIGN KEY ("executado_por") REFERENCES "usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "refresh_token" ADD CONSTRAINT "refresh_token_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "solicitacoes_abastecimento" ADD CONSTRAINT "solicitacoes_abastecimento_prefeituraId_fkey" FOREIGN KEY ("prefeituraId") REFERENCES "prefeitura"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "solicitacoes_abastecimento" ADD CONSTRAINT "solicitacoes_abastecimento_veiculoId_fkey" FOREIGN KEY ("veiculoId") REFERENCES "veiculo"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "solicitacoes_abastecimento" ADD CONSTRAINT "solicitacoes_abastecimento_motoristaId_fkey" FOREIGN KEY ("motoristaId") REFERENCES "motorista"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "solicitacoes_abastecimento" ADD CONSTRAINT "solicitacoes_abastecimento_combustivelId_fkey" FOREIGN KEY ("combustivelId") REFERENCES "combustivel"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "solicitacoes_abastecimento" ADD CONSTRAINT "solicitacoes_abastecimento_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "empresa"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "solicitacoes_abastecimento" ADD CONSTRAINT "solicitacoes_abastecimento_abastecimento_id_fkey" FOREIGN KEY ("abastecimento_id") REFERENCES "abastecimento"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "veiculo_cota_periodo" ADD CONSTRAINT "veiculo_cota_periodo_veiculoId_fkey" FOREIGN KEY ("veiculoId") REFERENCES "veiculo"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

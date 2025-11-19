import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { ScheduleModule } from '@nestjs/schedule';
import { PrismaModule } from './common/prisma/prisma.module';
import { AuthModule } from './modules/auth/auth.module';
import { UsuarioModule } from './modules/usuario/usuario.module';
import { PrefeituraModule } from './modules/prefeitura/prefeitura.module';
import { EmpresaModule } from './modules/empresa/empresa.module';
import { VeiculoModule } from './modules/veiculo/veiculo.module';
import { MotoristaModule } from './modules/motorista/motorista.module';
import { AbastecimentoModule } from './modules/abastecimento/abastecimento.module';
import { CombustivelModule } from './modules/combustivel/combustivel.module';
import { OrgaoModule } from './modules/orgao/orgao.module';
import { CategoriaModule } from './modules/categoria/categoria.module';
import { ProcessoModule } from './modules/processo/processo.module';
import { ContratoModule } from './modules/contrato/contrato.module';
import { ContaFaturamentoOrgaoModule } from './modules/conta-faturamento-orgao/conta-faturamento-orgao.module';
import { CotaOrgaoModule } from './modules/cota-orgao/cota-orgao.module';
import { LogModule } from './modules/log/log.module';
import { UploadModule } from './modules/upload/upload.module';
import { ParametrosTetoModule } from './modules/parametros-teto/parametros-teto.module';
import { AnpSemanaModule } from './modules/anp-semana/anp-semana.module';
import { AnpPrecosUfModule } from './modules/anp-precos-uf/anp-precos-uf.module';
import { BackupModule } from './modules/backup/backup.module';
import { EmpresaPrecoCombustivelModule } from './modules/empresa-preco-combustivel/empresa-preco-combustivel.module';
import { SolicitacaoAbastecimentoModule } from './modules/solicitacao-abastecimento/solicitacao-abastecimento.module';
import { ProcessoCombustivelModule } from './modules/processo-combustivel/processo-combustivel.module';
import { SolicitacoesQrCodeVeiculoModule } from './modules/solicitacoes-qrcode-veiculo/solicitacoes-qrcode-veiculo.module';
import { QrCodeMotoristaModule } from './modules/qrcode-motorista/qrcode-motorista.module';
import { DashboardsModule } from './modules/dashboards/dashboards.module';
import { RelatoriosModule } from './modules/relatorios/relatorios.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    ScheduleModule.forRoot(),
    ThrottlerModule.forRoot([
      {
        ttl: 60000,
        limit: 10,
      },
    ]),
    PrismaModule,
    AuthModule,
    UsuarioModule,
    PrefeituraModule,
    EmpresaModule,
    VeiculoModule,
    MotoristaModule,
    AbastecimentoModule,
    CombustivelModule,
    OrgaoModule,
    CategoriaModule,
    ProcessoModule,
    ContratoModule,
    ContaFaturamentoOrgaoModule,
    CotaOrgaoModule,
    LogModule,
    UploadModule,
    ParametrosTetoModule,
    AnpSemanaModule,
    AnpPrecosUfModule,
    BackupModule,
    EmpresaPrecoCombustivelModule,
    SolicitacaoAbastecimentoModule,
    ProcessoCombustivelModule,
    SolicitacoesQrCodeVeiculoModule,
    QrCodeMotoristaModule,
    DashboardsModule,
    RelatoriosModule,
  ],
})
export class AppModule {}

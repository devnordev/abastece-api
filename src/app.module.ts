import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
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
import { UploadModule } from './modules/upload/upload.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
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
    UploadModule,
  ],
})
export class AppModule {}

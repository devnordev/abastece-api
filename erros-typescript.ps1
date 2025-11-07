prisma/seed_veiculos.ts:1:37 - error TS2305: Module '"@prisma/client"' has no exported member 'TipoVeiculo'.

1 import { PrismaClient, TipoVeiculo, SituacaoVeiculo, TipoAbastecimentoVeiculo, Periodicidade } from '@prisma/client';
                         ~~~~~~~~~~~

prisma/seed_veiculos.ts:1:37 - error TS2305: Module '"@prisma/client"' has no exported member 'SituacaoVeiculo'.

1 import { PrismaClient, TipoVeiculo, SituacaoVeiculo, TipoAbastecimentoVeiculo, Periodicidade } from '@prisma/client';
                                      ~~~~~~~~~~~~~~~

prisma/seed_veiculos.ts:1:54 - error TS2305: Module '"@prisma/client"' has no exported member 'TipoAbastecimentoVeiculo'.

1 import { PrismaClient, TipoVeiculo, SituacaoVeiculo, TipoAbastecimentoVeiculo, Periodicidade } from '@prisma/client';
                                                       ~~~~~~~~~~~~~~~~~~~~~~~~

prisma/seed_veiculos.ts:1:80 - error TS2305: Module '"@prisma/client"' has no exported member 'Periodicidade'.

1 import { PrismaClient, TipoVeiculo, SituacaoVeiculo, TipoAbastecimentoVeiculo, Periodicidade } from '@prisma/client';
                                                                                 ~~~~~~~~~~~~~

src/modules/abastecimento/dto/create-abastecimento.dto.ts:3:10 - error TS2305: Module '"@prisma/client"' has no exported member 'TipoAbastecimento'.

3 import { TipoAbastecimento, StatusAbastecimento } from '@prisma/client';
           ~~~~~~~~~~~~~~~~~

src/modules/abastecimento/dto/create-abastecimento.dto.ts:3:29 - error TS2305: Module '"@prisma/client"' has no exported member 'StatusAbastecimento'.

3 import { TipoAbastecimento, StatusAbastecimento } from '@prisma/client';
                              ~~~~~~~~~~~~~~~~~~~

src/modules/abastecimento/dto/find-abastecimento.dto.ts:3:10 - error TS2305: Module '"@prisma/client"' has no exported member 'TipoAbastecimento'.

3 import { TipoAbastecimento, StatusAbastecimento } from '@prisma/client';
           ~~~~~~~~~~~~~~~~~

src/modules/abastecimento/dto/find-abastecimento.dto.ts:3:29 - error TS2305: Module '"@prisma/client"' has no exported member 'StatusAbastecimento'.

3 import { TipoAbastecimento, StatusAbastecimento } from '@prisma/client';
                              ~~~~~~~~~~~~~~~~~~~

src/modules/anp-precos-uf/anp-precos-uf.service.ts:3:10 - error TS2305: Module '"@prisma/client"' has no exported member 'AnpBase'.

3 import { AnpBase, Prisma, UF, TipoCombustivelAnp } from '@prisma/client';
           ~~~~~~~

src/modules/anp-precos-uf/anp-precos-uf.service.ts:3:27 - error TS2305: Module '"@prisma/client"' has no exported member 'UF'.

3 import { AnpBase, Prisma, UF, TipoCombustivelAnp } from '@prisma/client';
                            ~~

src/modules/anp-precos-uf/anp-precos-uf.service.ts:3:31 - error TS2305: Module '"@prisma/client"' has no exported member 'TipoCombustivelAnp'.

3 import { AnpBase, Prisma, UF, TipoCombustivelAnp } from '@prisma/client';
                                ~~~~~~~~~~~~~~~~~~

src/modules/anp-precos-uf/anp-precos-uf.service.ts:26:38 - error TS2339: Property 'Decimal' does not exist on type 'typeof Prisma'.

26     const margemDecimal = new Prisma.Decimal(margemPct);
                                        ~~~~~~~

src/modules/anp-precos-uf/anp-precos-uf.service.ts:31:31 - error TS2694: Namespace '"C:/Users/pessoal/Desktop/abastece-api/node_modules/.prisma/client/default".Prisma' has no exported member 'Decimal'.

31         let precoBase: Prisma.Decimal | null = null;
                                 ~~~~~~~

src/modules/anp-precos-uf/anp-precos-uf.service.ts:48:44 - error TS2339: Property 'Decimal' does not exist on type 'typeof Prisma'.

48           const tetoCalculado = new Prisma.Decimal(Number(precoBase) * fatorMultiplicacao);
                                              ~~~~~~~

src/modules/anp-precos-uf/anp-precos-uf.service.ts:302:70 - error TS2694: Namespace '"C:/Users/pessoal/Desktop/abastece-api/node_modules/.prisma/client/default".Prisma' has no exported member 'Decimal'.

302   private calcularTeto(precoBase: number, margemPct: number): Prisma.Decimal {
                                                                         ~~~~~~~

src/modules/anp-precos-uf/anp-precos-uf.service.ts:304:23 - error TS2339: Property 'Decimal' does not exist on type 'typeof Prisma'.

304     return new Prisma.Decimal(precoBase * fatorMultiplicacao);
                          ~~~~~~~

src/modules/anp-precos-uf/anp-precos-uf.service.ts:668:92 - error TS2339: Property 'Decimal' does not exist on type 'typeof Prisma'.

668           preco_minimo: precoMinimo && !isNaN(precoMinimo) && precoMinimo > 0 ? new Prisma.Decimal(precoMinimo) : null,
                                                                                               ~~~~~~~

src/modules/anp-precos-uf/anp-precos-uf.service.ts:669:35 - error TS2339: Property 'Decimal' does not exist on type 'typeof Prisma'.

669           preco_medio: new Prisma.Decimal(precoMedio),
                                      ~~~~~~~

src/modules/anp-precos-uf/anp-precos-uf.service.ts:670:92 - error TS2339: Property 'Decimal' does not exist on type 'typeof Prisma'.

670           preco_maximo: precoMaximo && !isNaN(precoMaximo) && precoMaximo > 0 ? new Prisma.Decimal(precoMaximo) : null,
                                                                                               ~~~~~~~

src/modules/anp-precos-uf/anp-precos-uf.service.ts:673:39 - error TS2339: Property 'Decimal' does not exist on type 'typeof Prisma'.

304     return new Prisma.Decimal(precoBase * fatorMultiplicacao);
                          ~~~~~~~

src/modules/anp-precos-uf/anp-precos-uf.service.ts:668:92 - error TS2339: Property 'Decimal' does not exist on type 'typeof Prisma'.

668           preco_minimo: precoMinimo && !isNaN(precoMinimo) && precoMinimo > 0 ? new Prisma.Decimal(precoMinimo) : null,
                                                                                               ~~~~~~~

src/modules/anp-precos-uf/anp-precos-uf.service.ts:669:35 - error TS2339: Property 'Decimal' does not exist on type 'typeof Prisma'.

669           preco_medio: new Prisma.Decimal(precoMedio),
                                      ~~~~~~~

src/modules/anp-precos-uf/anp-precos-uf.service.ts:670:92 - error TS2339: Property 'Decimal' does not exist on type 'typeof Prisma'.

670           preco_maximo: precoMaximo && !isNaN(precoMaximo) && precoMaximo > 0 ? new Prisma.Decimal(precoMaximo) : null,
                                                                                               ~~~~~~~

src/modules/anp-precos-uf/anp-precos-uf.service.ts:673:39 - error TS2339: Property 'Decimal' does not exist on type 'typeof Prisma'.

673           margem_aplicada: new Prisma.Decimal(margemPct),
                                          ~~~~~~~

src/modules/categoria/categoria.service.ts:3:10 - error TS2305: Module '"@prisma/client"' has no exported member 'TipoCategoria'.

3 import { TipoCategoria } from '@prisma/client';
           ~~~~~~~~~~~~~

src/modules/empresa/dto/create-empresa.dto.ts:3:10 - error TS2305: Module '"@prisma/client"' has no exported member 'UF'.

3 import { UF, TipoEmpresa } from '@prisma/client';
           ~~

src/modules/empresa/dto/create-empresa.dto.ts:3:14 - error TS2305: Module '"@prisma/client"' has no exported member 'TipoEmpresa'.

3 import { UF, TipoEmpresa } from '@prisma/client';
               ~~~~~~~~~~~

src/modules/empresa/dto/find-empresa.dto.ts:3:10 - error TS2305: Module '"@prisma/client"' has no exported member 'UF'.

3 import { UF, TipoEmpresa } from '@prisma/client';
           ~~

src/modules/empresa/dto/find-empresa.dto.ts:3:14 - error TS2305: Module '"@prisma/client"' has no exported member 'TipoEmpresa'.

3 import { UF, TipoEmpresa } from '@prisma/client';
               ~~~~~~~~~~~

src/modules/log/log.controller.ts:13:10 - error TS2305: Module '"@prisma/client"' has no exported member 'AcaoLog'.

13 import { AcaoLog } from '@prisma/client';
            ~~~~~~~

src/modules/log/log.service.ts:3:10 - error TS2305: Module '"@prisma/client"' has no exported member 'AcaoLog'.

3 import { AcaoLog } from '@prisma/client';
           ~~~~~~~

src/modules/parametros-teto/dto/create-parametros-teto.dto.ts:3:10 - error TS2305: Module '"@prisma/client"' has no exported member 'AnpBase'.

3 import { AnpBase } from '@prisma/client';
           ~~~~~~~

src/modules/parametros-teto/parametros-teto.service.ts:5:10 - error TS2305: Module '"@prisma/client"' has no exported member 'AnpBase'.

5 import { AnpBase } from '@prisma/client';
           ~~~~~~~

src/modules/processo/dto/create-processo.dto.ts:3:10 - error TS2305: Module '"@prisma/client"' has no exported member 'TipoContrato'.

3 import { TipoContrato, TipoDocumento, TipoItens, StatusProcesso } from '@prisma/client';
           ~~~~~~~~~~~~

src/modules/processo/dto/create-processo.dto.ts:3:24 - error TS2305: Module '"@prisma/client"' has no exported member 'TipoDocumento'.

3 import { TipoDocumento, TipoItens, StatusProcesso } from '@prisma/client';
                         ~~~~~~~~~~~~~

src/modules/processo/dto/create-processo.dto.ts:3:39 - error TS2305: Module '"@prisma/client"' has no exported member 'TipoItens'.

3 import { TipoContrato, TipoDocumento, TipoItens, StatusProcesso } from '@prisma/client';
                                        ~~~~~~~~~

src/modules/processo/dto/create-processo.dto.ts:3:50 - error TS2305: Module '"@prisma/client"' has no exported member 'StatusProcesso'.

3 import { TipoContrato, TipoDocumento, TipoItens, StatusProcesso } from '@prisma/client';
                                                   ~~~~~~~~~~~~~~

src/modules/processo/processo.service.ts:3:10 - error TS2305: Module '"@prisma/client"' has no exported member 'TipoContrato'.

3 import { TipoContrato, TipoDocumento, TipoItens, StatusProcesso } from '@prisma/client';
           ~~~~~~~~~~~~

src/modules/processo/processo.service.ts:3:24 - error TS2305: Module '"@prisma/client"' has no exported member 'TipoDocumento'.

3 import { TipoContrato, TipoDocumento, TipoItens, StatusProcesso } from '@prisma/client';
                         ~~~~~~~~~~~~~

src/modules/processo/processo.service.ts:3:39 - error TS2305: Module '"@prisma/client"' has no exported member 'TipoItens'.

3 import { TipoContrato, TipoDocumento, TipoItens, StatusProcesso } from '@prisma/client';
                                        ~~~~~~~~~

src/modules/processo/processo.service.ts:3:50 - error TS2305: Module '"@prisma/client"' has no exported member 'StatusProcesso'.

3 import { TipoContrato, TipoDocumento, TipoItens, StatusProcesso } from '@prisma/client';
                                                   ~~~~~~~~~~~~~~

src/modules/usuario/dto/create-usuario.dto.ts:3:10 - error TS2305: Module '"@prisma/client"' has no exported member 'TipoUsuario'.

3 import { TipoUsuario, StatusAcesso } from '@prisma/client';
           ~~~~~~~~~~~

src/modules/usuario/dto/create-usuario.dto.ts:3:23 - error TS2305: Module '"@prisma/client"' has no exported member 'StatusAcesso'.

3 import { TipoUsuario, StatusAcesso } from '@prisma/client';
                        ~~~~~~~~~~~~

src/modules/usuario/dto/find-usuario.dto.ts:3:10 - error TS2305: Module '"@prisma/client"' has no exported member 'TipoUsuario'.

3 import { TipoUsuario, StatusAcesso } from '@prisma/client';
           ~~~~~~~~~~~

src/modules/usuario/dto/find-usuario.dto.ts:3:23 - error TS2305: Module '"@prisma/client"' has no exported member 'StatusAcesso'.

3 import { TipoUsuario, StatusAcesso } from '@prisma/client';
                        ~~~~~~~~~~~~

src/modules/usuario/usuario.controller.ts:24:10 - error TS2305: Module '"@prisma/client"' has no exported member 'TipoUsuario'.

24 import { TipoUsuario, StatusAcesso } from '@prisma/client';
            ~~~~~~~~~~~

src/modules/usuario/usuario.controller.ts:24:23 - error TS2305: Module '"@prisma/client"' has no exported member 'StatusAcesso'.

24 import { TipoUsuario, StatusAcesso } from '@prisma/client';
                         ~~~~~~~~~~~~

src/modules/usuario/usuario.service.ts:8:10 - error TS2305: Module '"@prisma/client"' has no exported member 'TipoUsuario'.

8 import { TipoUsuario, StatusAcesso } from '@prisma/client';
           ~~~~~~~~~~~

src/modules/usuario/usuario.service.ts:8:23 - error TS2305: Module '"@prisma/client"' has no exported member 'StatusAcesso'.

8 import { TipoUsuario, StatusAcesso } from '@prisma/client';
                        ~~~~~~~~~~~~

src/modules/veiculo/dto/create-veiculo.dto.ts:3:10 - error TS2305: Module '"@prisma/client"' has no exported member 'TipoVeiculo'.

3 import { TipoVeiculo, SituacaoVeiculo, TipoAbastecimentoVeiculo, Periodicidade } from '@prisma/client';
           ~~~~~~~~~~~

src/modules/veiculo/dto/create-veiculo.dto.ts:3:23 - error TS2305: Module '"@prisma/client"' has no exported member 'SituacaoVeiculo'.

3 import { TipoVeiculo, SituacaoVeiculo, TipoAbastecimentoVeiculo, Periodicidade } from '@prisma/client';
                        ~~~~~~~~~~~~~~~

src/modules/veiculo/dto/create-veiculo.dto.ts:3:40 - error TS2305: Module '"@prisma/client"' has no exported member 'TipoAbastecimentoVeiculo'.

3 import { TipoVeiculo, SituacaoVeiculo, TipoAbastecimentoVeiculo, Periodicidade } from '@prisma/client';
                                         ~~~~~~~~~~~~~~~~~~~~~~~~

src/modules/veiculo/dto/create-veiculo.dto.ts:3:66 - error TS2305: Module '"@prisma/client"' has no exported member 'Periodicidade'.

3 import { TipoVeiculo, SituacaoVeiculo, TipoAbastecimentoVeiculo, Periodicidade } from '@prisma/client';
                                                                   ~~~~~~~~~~~~~

src/modules/veiculo/dto/find-veiculo.dto.ts:3:10 - error TS2305: Module '"@prisma/client"' has no exported member 'TipoVeiculo'.

3 import { TipoVeiculo, SituacaoVeiculo, TipoAbastecimentoVeiculo, Periodicidade } from '@prisma/client';
           ~~~~~~~~~~~

src/modules/veiculo/dto/find-veiculo.dto.ts:3:23 - error TS2305: Module '"@prisma/client"' has no exported member 'SituacaoVeiculo'.

3 import { TipoVeiculo, SituacaoVeiculo, TipoAbastecimentoVeiculo, Periodicidade } from '@prisma/client';
                        ~~~~~~~~~~~~~~~

src/modules/veiculo/dto/find-veiculo.dto.ts:3:40 - error TS2305: Module '"@prisma/client"' has no exported member 'TipoAbastecimentoVeiculo'.

3 import { TipoVeiculo, SituacaoVeiculo, TipoAbastecimentoVeiculo, Periodicidade } from '@prisma/client';
                                         ~~~~~~~~~~~~~~~~~~~~~~~~

src/modules/veiculo/dto/find-veiculo.dto.ts:3:66 - error TS2305: Module '"@prisma/client"' has no exported member 'Periodicidade'.

3 import { TipoVeiculo, SituacaoVeiculo, TipoAbastecimentoVeiculo, Periodicidade } from '@prisma/client';
                                                                   ~~~~~~~~~~~~~

[09:48:26] Found 53 errors. Watching for file changes.


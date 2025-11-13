import { Injectable, NotFoundException, ConflictException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { CreateVeiculoDto } from './dto/create-veiculo.dto';
import { UpdateVeiculoDto } from './dto/update-veiculo.dto';
import { FindVeiculoDto } from './dto/find-veiculo.dto';
import { CreateSolicitacaoQrCodeDto } from './dto/create-solicitacao-qrcode.dto';
import { UploadService } from '../upload/upload.service';

@Injectable()
export class VeiculoService {
  constructor(
    private prisma: PrismaService,
    private uploadService: UploadService,
  ) {}

  async create(createVeiculoDto: CreateVeiculoDto, currentUserId?: number, file?: Express.Multer.File) {
    // Validação de autorização
    if (currentUserId) {
      await this.validateCreateVeiculoPermission(currentUserId, createVeiculoDto.prefeituraId);
    }
    const { placa, prefeituraId, foto_veiculo, ...restDto } = createVeiculoDto;

    // Verificar se veículo já existe com esta placa (globalmente)
    const existingVeiculo = await this.prisma.veiculo.findFirst({
      where: { placa },
      include: {
        orgao: {
          select: {
            id: true,
            nome: true,
            sigla: true,
          },
        },
      },
    });

    if (existingVeiculo) {
      // Se o veículo existe na mesma prefeitura
      if (existingVeiculo.prefeituraId === prefeituraId) {
        if (createVeiculoDto.orgaoId && existingVeiculo.orgaoId && existingVeiculo.orgaoId !== createVeiculoDto.orgaoId) {
          throw new ConflictException(`Este veículo já está cadastrado no órgão "${existingVeiculo.orgao?.nome}" nesta prefeitura. Um veículo não pode pertencer a múltiplos órgãos.`);
        }
        throw new ConflictException('Veículo já existe com esta placa nesta prefeitura');
      } else {
        throw new ConflictException('Veículo já existe com esta placa em outra prefeitura');
      }
    }

    // Verificar se prefeitura existe
    const prefeitura = await this.prisma.prefeitura.findUnique({
      where: { id: prefeituraId },
    });

    if (!prefeitura) {
      throw new NotFoundException('Prefeitura não encontrada');
    }

    // Verificar se órgão existe e pertence à prefeitura
    if (createVeiculoDto.orgaoId) {
      const orgao = await this.prisma.orgao.findFirst({
        where: {
          id: createVeiculoDto.orgaoId,
          prefeituraId: prefeituraId,
        },
      });

      if (!orgao) {
        throw new NotFoundException('Órgão não encontrado ou não pertence a esta prefeitura');
      }
    }

    // Validar periodicidade e quantidade para tipo COTA
    if (createVeiculoDto.tipo_abastecimento === 'COTA') {
      if (!createVeiculoDto.periodicidade) {
        throw new BadRequestException('Periodicidade é obrigatória para tipo de abastecimento COTA');
      }
      if (!createVeiculoDto.quantidade) {
        throw new BadRequestException('Quantidade em litros é obrigatória para tipo de abastecimento COTA');
      }
    }

    // Verificar se combustíveis existem
    if (createVeiculoDto.combustivelIds && createVeiculoDto.combustivelIds.length > 0) {
      const combustiveis = await this.prisma.combustivel.findMany({
        where: {
          id: { in: createVeiculoDto.combustivelIds },
        },
      });

      if (combustiveis.length !== createVeiculoDto.combustivelIds.length) {
        throw new NotFoundException('Um ou mais combustíveis não foram encontrados');
      }
    }

    // Verificar se categorias existem (se fornecidas)
    if (createVeiculoDto.categoriaIds && createVeiculoDto.categoriaIds.length > 0) {
      const categorias = await this.prisma.categoria.findMany({
        where: {
          id: { in: createVeiculoDto.categoriaIds },
        },
      });

      if (categorias.length !== createVeiculoDto.categoriaIds.length) {
        throw new NotFoundException('Uma ou mais categorias não foram encontradas');
      }
    }

    // Verificar se motoristas existem e pertencem à prefeitura (se fornecidos)
    if (createVeiculoDto.motoristaIds && createVeiculoDto.motoristaIds.length > 0) {
      const motoristas = await this.prisma.motorista.findMany({
        where: {
          id: { in: createVeiculoDto.motoristaIds },
          prefeituraId: prefeituraId,
        },
      });

      if (motoristas.length !== createVeiculoDto.motoristaIds.length) {
        throw new NotFoundException('Um ou mais motoristas não foram encontrados ou não pertencem a esta prefeitura');
      }
    }

    // Fazer upload da imagem se arquivo foi enviado
    let imagemUrl = foto_veiculo;
    if (file) {
      try {
        const veiculoIdTmp = Date.now(); // ID temporário para nome do arquivo
        imagemUrl = await this.uploadService.uploadImage(file, 'veiculos', `veiculo-${veiculoIdTmp}`);
      } catch (error) {
        // Se falhar o upload, continua sem imagem (ou lança erro se preferir)
        console.warn('Erro ao fazer upload da imagem:', error.message);
        // throw new BadRequestException(`Erro ao fazer upload da imagem: ${error.message}`);
      }
    }

    // Extrair dados para criação do veículo (sem os arrays de relacionamentos)
    const { categoriaIds, combustivelIds, motoristaIds, cotasPeriodo, ...veiculoData } = restDto;

    // Remover campos undefined para evitar problemas com o Prisma
    const cleanedVeiculoData = Object.entries(veiculoData).reduce((acc, [key, value]) => {
      if (value !== undefined) {
        acc[key] = value;
      }
      return acc;
    }, {} as any);

    // Criar veículo com status ativo por padrão quando não especificado
    const veiculo = await this.prisma.veiculo.create({
      data: {
        ...cleanedVeiculoData,
        placa,
        prefeituraId,
        foto_veiculo: imagemUrl,
        ativo: veiculoData.ativo !== undefined ? veiculoData.ativo : true,
      } as any,
      include: {
        prefeitura: {
          select: {
            id: true,
            nome: true,
            cnpj: true,
          },
        },
        orgao: {
          select: {
            id: true,
            nome: true,
            sigla: true,
          },
        },
        contaFaturamento: {
          select: {
            id: true,
            nome: true,
            descricao: true,
          },
        },
        categorias: {
          include: {
            categoria: {
              select: {
                id: true,
                nome: true,
                descricao: true,
              },
            },
          },
        },
        combustiveis: {
          include: {
            combustivel: {
              select: {
                id: true,
                nome: true,
                descricao: true,
              },
            },
          },
        },
        motoristas: {
          include: {
            motorista: {
              select: {
                id: true,
                nome: true,
                cpf: true,
              },
            },
          },
        },
      },
    });

    // Criar relacionamentos com categorias (se fornecidas)
    if (categoriaIds && categoriaIds.length > 0) {
      await this.prisma.veiculoCategoria.createMany({
        data: categoriaIds.map(categoriaId => ({
          veiculoId: veiculo.id,
          categoriaId,
          ativo: true,
        })),
      });
    }

    // Criar relacionamentos com combustíveis (obrigatório)
    if (combustivelIds && combustivelIds.length > 0) {
      await this.prisma.veiculoCombustivel.createMany({
        data: combustivelIds.map(combustivelId => ({
          veiculoId: veiculo.id,
          combustivelId,
          ativo: true,
        })),
      });
    }

    // Criar relacionamentos com motoristas (se fornecidos)
    if (motoristaIds && motoristaIds.length > 0) {
      await this.prisma.veiculoMotorista.createMany({
        data: motoristaIds.map(motoristaId => ({
          veiculoId: veiculo.id,
          motoristaId,
          data_inicio: new Date(),
          ativo: true,
        })),
      });
    }

    // Criar relacionamentos com cotas de período (se fornecidas)
    if (cotasPeriodo && cotasPeriodo.length > 0) {
      await this.prisma.veiculoCotaPeriodo.createMany({
        data: cotasPeriodo.map(cota => ({
          veiculoId: veiculo.id,
          data_inicio_periodo: new Date(cota.data_inicio_periodo),
          data_fim_periodo: new Date(cota.data_fim_periodo),
          quantidade_permitida: cota.quantidade_permitida,
          quantidade_utilizada: 0,
          quantidade_disponivel: cota.quantidade_permitida,
          periodicidade: cota.periodicidade as any,
          ativo: true,
        })),
      });
    }

    // Buscar o veículo completo com todos os relacionamentos
    const veiculoCompleto = await this.prisma.veiculo.findUnique({
      where: { id: veiculo.id },
      include: {
        prefeitura: {
          select: {
            id: true,
            nome: true,
            cnpj: true,
          },
        },
        orgao: {
          select: {
            id: true,
            nome: true,
            sigla: true,
          },
        },
        contaFaturamento: {
          select: {
            id: true,
            nome: true,
            descricao: true,
          },
        },
        categorias: {
          include: {
            categoria: {
              select: {
                id: true,
                nome: true,
                descricao: true,
              },
            },
          },
        },
        combustiveis: {
          include: {
            combustivel: {
              select: {
                id: true,
                nome: true,
                descricao: true,
              },
            },
          },
        },
        motoristas: {
          include: {
            motorista: {
              select: {
                id: true,
                nome: true,
                cpf: true,
              },
            },
          },
        },
        cotasPeriodo: true,
      },
    });

    return {
      message: 'Veículo criado com sucesso',
      veiculo: veiculoCompleto,
    };
  }

  async findAll(findVeiculoDto: FindVeiculoDto, currentUserId?: number) {
    let {
      nome,
      placa,
      modelo,
      tipo_veiculo,
      situacao_veiculo,
      tipo_abastecimento,
      periodicidade,
      ativo,
      prefeituraId,
      orgaoId,
      page = 1,
      limit = 10,
    } = findVeiculoDto;

    const skip = (page - 1) * limit;

    // Aplicar filtros de autorização se houver usuário logado
    if (currentUserId) {
      const currentUser = await this.prisma.usuario.findUnique({
        where: { id: currentUserId },
      });

      if (currentUser) {
        // ADMIN_PREFEITURA só pode ver veículos da sua prefeitura
        if (currentUser.tipo_usuario === 'ADMIN_PREFEITURA') {
          if (!currentUser.prefeituraId) {
            throw new ForbiddenException('Administrador sem prefeitura vinculada');
          }
          
          // Filtrar apenas veículos da prefeitura do admin
          prefeituraId = currentUser.prefeituraId;
          
          // Se especificar um órgão, verificar se pertence à prefeitura do admin
          if (orgaoId) {
            const orgao = await this.prisma.orgao.findFirst({
              where: {
                id: orgaoId,
                prefeituraId: currentUser.prefeituraId,
              },
            });
            
            if (!orgao) {
              throw new ForbiddenException('Órgão não pertence à sua prefeitura');
            }
          }
        }
      }
    }

    // Construir filtros
    const where: any = {};

    if (nome) {
      where.nome = {
        contains: nome,
        mode: 'insensitive',
      };
    }

    if (placa) {
      where.placa = {
        contains: placa,
        mode: 'insensitive',
      };
    }

    if (modelo) {
      where.modelo = {
        contains: modelo,
        mode: 'insensitive',
      };
    }

    if (tipo_veiculo) {
      where.tipo_veiculo = tipo_veiculo;
    }

    if (situacao_veiculo) {
      where.situacao_veiculo = situacao_veiculo;
    }

    if (tipo_abastecimento) {
      where.tipo_abastecimento = tipo_abastecimento;
    }

    if (periodicidade) {
      where.periodicidade = periodicidade;
    }

    if (ativo !== undefined) {
      where.ativo = ativo;
    }

    if (prefeituraId) {
      where.prefeituraId = prefeituraId;
    }

    if (orgaoId) {
      where.orgaoId = orgaoId;
    }

    // Buscar veículos
    const [veiculos, total] = await Promise.all([
      this.prisma.veiculo.findMany({
        where,
        skip,
        take: limit,
        include: {
          prefeitura: {
            select: {
              id: true,
              nome: true,
              cnpj: true,
            },
          },
          orgao: {
            select: {
              id: true,
              nome: true,
              sigla: true,
            },
          },
          contaFaturamento: {
            select: {
              id: true,
              nome: true,
              descricao: true,
            },
          },
        },
        orderBy: {
          nome: 'asc',
        },
      }),
      this.prisma.veiculo.count({ where }),
    ]);

    // Buscar IDs dos veículos
    const veiculoIds = veiculos.map((v) => v.id);

    // Buscar solicitações de QR Code para os veículos
    let solicitacoesQrCode: any[] = [];
    if (veiculoIds.length > 0) {
      try {
        // Usar Prisma Client (funciona após aplicar migration e regenerar Prisma Client)
        solicitacoesQrCode = await (this.prisma as any).solicitacoesQrCodeVeiculo.findMany({
          where: {
            idVeiculo: { in: veiculoIds },
          },
          select: {
            id: true,
            idVeiculo: true,
            status: true,
            data_cadastro: true,
            codigo_qrcode: true,
          },
          orderBy: {
            data_cadastro: 'desc',
          },
        });
      } catch (error) {
        // Se o modelo não existir, retornar array vazio (tabela ainda não foi criada)
        console.warn('Tabela solicitacoes_qrcode_veiculo não encontrada. Aplique a migration primeiro.');
        solicitacoesQrCode = [];
      }
    }

    // Agrupar solicitações por veículo
    const solicitacoesPorVeiculo = new Map<number, any[]>();
    solicitacoesQrCode.forEach((solicitacao) => {
      if (!solicitacoesPorVeiculo.has(solicitacao.idVeiculo)) {
        solicitacoesPorVeiculo.set(solicitacao.idVeiculo, []);
      }
      solicitacoesPorVeiculo.get(solicitacao.idVeiculo)!.push(solicitacao);
    });

    // Processar veículos para adicionar informações sobre solicitações de QR Code
    const veiculosComSolicitacao = veiculos.map((veiculo) => {
      const solicitacoesDoVeiculo = solicitacoesPorVeiculo.get(veiculo.id) || [];
      
      // Verificar se existe solicitação com status "Solicitado" (independente de outras)
      const possuiSolicitacaoSolicitada = solicitacoesDoVeiculo.some(
        (s) => s.status === 'Solicitado'
      );
      
      // Verificar se existe solicitação com status "Aprovado" (independente de outras)
      const possuiSolicitacaoAprovada = solicitacoesDoVeiculo.some(
        (s) => s.status === 'Aprovado'
      );
      
      // Verificar se existe solicitação com status "Inativo" (momentâneo)
      const possuiSolicitacaoInativa = solicitacoesDoVeiculo.some(
        (s) => s.status === 'Inativo'
      );
      
      // Verificar se existe solicitação com status "Cancelado" (permanente)
      const possuiSolicitacaoCancelada = solicitacoesDoVeiculo.some(
        (s) => s.status === 'Cancelado'
      );
      
      // Buscar solicitação com status "Solicitado" primeiro (prioridade)
      const solicitacaoSolicitada = solicitacoesDoVeiculo.find(
        (s) => s.status === 'Solicitado'
      );
      
      // Se não houver solicitação com status "Solicitado", buscar com status "Aprovado"
      const solicitacaoAprovada = !solicitacaoSolicitada
        ? solicitacoesDoVeiculo.find((s) => s.status === 'Aprovado')
        : null;
      
      // Buscar solicitação com status "Inativo" (se não houver Solicitado ou Aprovado)
      const solicitacaoInativa = !solicitacaoSolicitada && !solicitacaoAprovada
        ? solicitacoesDoVeiculo.find((s) => s.status === 'Inativo')
        : null;
      
      // Buscar solicitação com status "Cancelado" (se não houver outras)
      const solicitacaoCancelada = !solicitacaoSolicitada && !solicitacaoAprovada && !solicitacaoInativa
        ? solicitacoesDoVeiculo.find((s) => s.status === 'Cancelado')
        : null;
      
      // Usar a solicitação encontrada (prioridade: Solicitado > Aprovado > Inativo > Cancelado > Mais recente)
      const solicitacaoAtiva = solicitacaoSolicitada || solicitacaoAprovada || solicitacaoInativa || solicitacaoCancelada || solicitacoesDoVeiculo[0] || null;
      
      let temSolicitacaoQRCode = false;
      let statusSolicitacaoQRCode: string | null = null;
      let mensagemSolicitacaoQRCode: string = '';
      let idSolicitacaoQRCode: number | null = null;
      let codigoQrCode: string | null = null;
      let estaInativo = false;
      let estaCancelado = false;

      if (solicitacaoAtiva) {
        temSolicitacaoQRCode = true;
        statusSolicitacaoQRCode = solicitacaoAtiva.status;
        idSolicitacaoQRCode = solicitacaoAtiva.id;
        codigoQrCode = solicitacaoAtiva.codigo_qrcode || null;
        
        // Verificar se está inativo (momentâneo)
        estaInativo = solicitacaoAtiva.status === 'Inativo';
        
        // Verificar se está cancelado (permanente)
        estaCancelado = solicitacaoAtiva.status === 'Cancelado';

        // Verificar status da solicitação e definir mensagem
        if (solicitacaoAtiva.status === 'Solicitado') {
          mensagemSolicitacaoQRCode = 'Este veículo possui uma solicitação de QR Code com status Solicitado';
        } else if (solicitacaoAtiva.status === 'Aprovado') {
          mensagemSolicitacaoQRCode = 'Este veículo possui uma solicitação de QR Code com status Aprovado';
        } else if (solicitacaoAtiva.status === 'Em_Producao') {
          mensagemSolicitacaoQRCode = 'Este veículo possui uma solicitação de QR Code em produção';
        } else if (solicitacaoAtiva.status === 'Integracao') {
          mensagemSolicitacaoQRCode = 'Este veículo possui uma solicitação de QR Code em integração';
        } else if (solicitacaoAtiva.status === 'Concluida') {
          mensagemSolicitacaoQRCode = 'Este veículo possui uma solicitação de QR Code concluída';
        } else if (solicitacaoAtiva.status === 'Inativo') {
          mensagemSolicitacaoQRCode = 'Este veículo possui uma solicitação de QR Code com status Inativo (momentâneo)';
        } else if (solicitacaoAtiva.status === 'Cancelado') {
          mensagemSolicitacaoQRCode = 'Este veículo possui uma solicitação de QR Code com status Cancelado (permanente)';
        } else {
          mensagemSolicitacaoQRCode = `Este veículo possui uma solicitação de QR Code com status ${solicitacaoAtiva.status}`;
        }
      } else {
        mensagemSolicitacaoQRCode = 'Não há solicitação de QR Code para este veículo';
      }

      return {
        ...veiculo,
        solicitacaoQRCode: {
          temSolicitacao: temSolicitacaoQRCode,
          possuiSolicitacaoSolicitada,
          possuiSolicitacaoAprovada,
          estaInativo,
          estaCancelado,
          status: statusSolicitacaoQRCode,
          mensagem: mensagemSolicitacaoQRCode,
          id: idSolicitacaoQRCode,
          codigo_qrcode: codigoQrCode,
        },
      };
    });

    return {
      message: 'Veículos encontrados com sucesso',
      veiculos: veiculosComSolicitacao,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: number) {
    const veiculo = await this.prisma.veiculo.findUnique({
      where: { id },
      include: {
        prefeitura: {
          select: {
            id: true,
            nome: true,
            cnpj: true,
          },
        },
        orgao: {
          select: {
            id: true,
            nome: true,
            sigla: true,
          },
        },
        contaFaturamento: {
          select: {
            id: true,
            nome: true,
            descricao: true,
          },
        },
        categorias: {
          include: {
            categoria: {
              select: {
                id: true,
                nome: true,
                descricao: true,
                tipo_categoria: true,
              },
            },
          },
        },
        combustiveis: {
          include: {
            combustivel: {
              select: {
                id: true,
                nome: true,
                sigla: true,
                descricao: true,
              },
            },
          },
        },
        motoristas: {
          include: {
            motorista: {
              select: {
                id: true,
                nome: true,
                cpf: true,
                telefone: true,
              },
            },
          },
        },
        _count: {
          select: {
            abastecimentos: true,
            solicitacoes: true,
          },
        },
      },
    });

    if (!veiculo) {
      throw new NotFoundException('Veículo não encontrado');
    }

    // Formatar combustíveis permitidos
    const combustiveisPermitidos = veiculo.combustiveis.map(vc => vc.combustivel);
    const combustivelIds = veiculo.combustiveis.map(vc => vc.combustivel.id);

    // Adicionar nomes e dados formatados diretamente no objeto para facilitar o acesso
    const veiculoFormatado = {
      ...veiculo,
      nomeOrgao: veiculo.orgao?.nome || null,
      nomeContaFaturamento: veiculo.contaFaturamento?.nome || null,
      combustiveisPermitidos, // Array de combustíveis formatado
      combustivelIds, // IDs para formulário de edição
    };

    return {
      message: 'Veículo encontrado com sucesso',
      veiculo: veiculoFormatado,
    };
  }

  async findMotoristasByVeiculo(veiculoId: number) {
    // Verificar se o veículo existe
    const veiculo = await this.prisma.veiculo.findUnique({
      where: { id: veiculoId },
      select: { id: true, nome: true, placa: true },
    });

    if (!veiculo) {
      throw new NotFoundException('Veículo não encontrado');
    }

    // Buscar motoristas vinculados ao veículo
    const veiculoMotoristas = await this.prisma.veiculoMotorista.findMany({
      where: {
        veiculoId: veiculoId,
        ativo: true,
      },
      include: {
        motorista: {
          select: {
            id: true,
            nome: true,
            cpf: true,
            cnh: true,
            categoria_cnh: true,
            data_vencimento_cnh: true,
            telefone: true,
            email: true,
            ativo: true,
            observacoes: true,
          },
        },
      },
      orderBy: {
        data_inicio: 'desc',
      },
    });

    // Formatar resposta
    const motoristas = veiculoMotoristas.map((vm) => ({
      id: vm.motorista.id,
      nome: vm.motorista.nome,
      cpf: vm.motorista.cpf,
      cnh: vm.motorista.cnh,
      categoria_cnh: vm.motorista.categoria_cnh,
      data_vencimento_cnh: vm.motorista.data_vencimento_cnh,
      telefone: vm.motorista.telefone,
      email: vm.motorista.email,
      ativo: vm.motorista.ativo,
      observacoes: vm.motorista.observacoes,
      vinculo: {
        id: vm.id,
        data_inicio: vm.data_inicio,
        data_fim: vm.data_fim,
        ativo: vm.ativo,
        observacoes: vm.observacoes,
      },
    }));

    return {
      message: 'Motoristas encontrados com sucesso',
      veiculo: {
        id: veiculo.id,
        nome: veiculo.nome,
        placa: veiculo.placa,
      },
      motoristas,
      total: motoristas.length,
    };
  }

  async update(id: number, updateVeiculoDto: UpdateVeiculoDto, file?: Express.Multer.File) {
    // Verificar se veículo existe
    const existingVeiculo = await this.prisma.veiculo.findUnique({
      where: { id },
    });

    if (!existingVeiculo) {
      throw new NotFoundException('Veículo não encontrado');
    }

    // Se estiver atualizando a placa, verificar se já existe
    if (updateVeiculoDto.placa) {
      const conflictingVeiculo = await this.prisma.veiculo.findFirst({
        where: {
          placa: updateVeiculoDto.placa,
          id: { not: id },
        },
      });

      if (conflictingVeiculo) {
        throw new ConflictException('Placa já está em uso por outro veículo');
      }
    }

    // Se arquivo foi enviado, fazer upload
    let imagemUrl = updateVeiculoDto.foto_veiculo;
    if (file) {
      try {
        // Remover imagem antiga se existir
        if (existingVeiculo.foto_veiculo) {
          try {
            const oldFilePath = this.uploadService.extractFilePathFromUrl(existingVeiculo.foto_veiculo);
            if (oldFilePath) {
              await this.uploadService.deleteImage(oldFilePath);
            }
          } catch (error) {
            console.warn('Erro ao remover imagem antiga:', error.message);
          }
        }

        // Fazer upload da nova imagem
        imagemUrl = await this.uploadService.uploadImage(file, 'veiculos', `veiculo-${id}`);
      } catch (error) {
        console.warn('Erro ao fazer upload da imagem:', error.message);
        // Se falhar, mantém a URL anterior ou lança erro
        if (!existingVeiculo.foto_veiculo) {
          throw new BadRequestException(`Erro ao fazer upload da imagem: ${error.message}`);
        }
      }
    }

    // Remover prefeituraId do objeto de update (não deve ser atualizável)
    const { prefeituraId, categoriaIds, combustivelIds, motoristaIds, cotasPeriodo, foto_veiculo, ...restUpdateData } = updateVeiculoDto;

    // Preparar dados para atualização
    const updateData: any = {
      ...restUpdateData,
    };

    // Só atualiza foto_veiculo se tiver nova URL ou se foi explicitamente enviado como null
    if (imagemUrl !== undefined) {
      updateData.foto_veiculo = imagemUrl;
    }

    // Atualizar veículo
    const veiculo = await this.prisma.veiculo.update({
      where: { id },
      data: updateData,
      include: {
        prefeitura: {
          select: {
            id: true,
            nome: true,
            cnpj: true,
          },
        },
        orgao: {
          select: {
            id: true,
            nome: true,
            sigla: true,
          },
        },
        contaFaturamento: {
          select: {
            id: true,
            nome: true,
            descricao: true,
          },
        },
      },
    });

    return {
      message: 'Veículo atualizado com sucesso',
      veiculo,
    };
  }

  async remove(id: number) {
    // Verificar se veículo existe
    const existingVeiculo = await this.prisma.veiculo.findUnique({
      where: { id },
    });

    if (!existingVeiculo) {
      throw new NotFoundException('Veículo não encontrado');
    }

    // Verificar se veículo tem relacionamentos que impedem a exclusão
    const hasRelations = await this.prisma.abastecimento.findFirst({
      where: { veiculoId: id },
    });

    if (hasRelations) {
      throw new BadRequestException('Não é possível excluir veículo com abastecimentos associados');
    }

    // Excluir veículo
    await this.prisma.veiculo.delete({
      where: { id },
    });

    return {
      message: 'Veículo excluído com sucesso',
    };
  }

  async findByPlaca(placa: string) {
    return this.prisma.veiculo.findUnique({
      where: { placa },
    });
  }

  async createSolicitacoesQrCode(createSolicitacaoQrCodeDto: CreateSolicitacaoQrCodeDto, currentUserId: number) {
    // Validar permissões do usuário
    const currentUser = await this.prisma.usuario.findUnique({
      where: { id: currentUserId },
    });

    if (!currentUser) {
      throw new ForbiddenException('Usuário atual não encontrado');
    }

    // Apenas ADMIN_PREFEITURA e COLABORADOR_PREFEITURA podem criar solicitações
    if (
      currentUser.tipo_usuario !== 'ADMIN_PREFEITURA' &&
      currentUser.tipo_usuario !== 'COLABORADOR_PREFEITURA' &&
      currentUser.tipo_usuario !== 'SUPER_ADMIN'
    ) {
      throw new ForbiddenException('Apenas ADMIN_PREFEITURA e COLABORADOR_PREFEITURA podem criar solicitações de QR Code');
    }

    // Validar que pelo menos 1 veículo foi fornecido
    if (!createSolicitacaoQrCodeDto.veiculos || createSolicitacaoQrCodeDto.veiculos.length === 0) {
      throw new BadRequestException('Deve ser fornecido pelo menos 1 veículo');
    }

    // Extrair IDs dos veículos
    const veiculoIds = createSolicitacaoQrCodeDto.veiculos.map((v) => v.idVeiculo);

    // Verificar se os veículos existem
    const veiculos = await this.prisma.veiculo.findMany({
      where: {
        id: { in: veiculoIds },
      },
      select: {
        id: true,
        nome: true,
        placa: true,
        prefeituraId: true,
      },
    });

    // Verificar se todos os veículos foram encontrados
    if (veiculos.length !== veiculoIds.length) {
      const encontradosIds = veiculos.map((v) => v.id);
      const naoEncontrados = veiculoIds.filter((id) => !encontradosIds.includes(id));
      throw new NotFoundException(
        `Um ou mais veículos não foram encontrados. IDs não encontrados: ${naoEncontrados.join(', ')}`
      );
    }

    // Para ADMIN_PREFEITURA e COLABORADOR_PREFEITURA, verificar se têm prefeitura vinculada
    if (currentUser.tipo_usuario !== 'SUPER_ADMIN') {
      if (!currentUser.prefeituraId) {
        throw new ForbiddenException('Usuário sem prefeitura vinculada');
      }

      // Verificar se todos os veículos pertencem à prefeitura do usuário
      const veiculosForaPrefeitura = veiculos.filter((v) => v.prefeituraId !== currentUser.prefeituraId);
      if (veiculosForaPrefeitura.length > 0) {
        const placasForaPrefeitura = veiculosForaPrefeitura.map((v) => `${v.nome} (${v.placa})`).join(', ');
        throw new ForbiddenException(
          `Os seguintes veículos não pertencem à sua prefeitura: ${placasForaPrefeitura}`
        );
      }
    }

    // Obter prefeituraId: do usuário para ADMIN_PREFEITURA/COLABORADOR_PREFEITURA, dos veículos para SUPER_ADMIN
    let prefeituraId: number;
    if (currentUser.tipo_usuario === 'SUPER_ADMIN') {
      // Para SUPER_ADMIN, verificar se todos os veículos pertencem à mesma prefeitura
      const prefeituraIds = [...new Set(veiculos.map((v) => v.prefeituraId))] as number[];
      if (prefeituraIds.length !== 1) {
        throw new BadRequestException(
          'Todos os veículos devem pertencer à mesma prefeitura. Foram encontradas múltiplas prefeituras.'
        );
      }
      prefeituraId = prefeituraIds[0];
    } else {
      prefeituraId = currentUser.prefeituraId!;
    }

    // Verificar se já existe uma solicitação pendente para algum dos veículos
    // Não considerar solicitações com status "Inativo" ou "Cancelado" como bloqueio
    let solicitacoesExistentes: any[] = [];
    try {
      solicitacoesExistentes = await (this.prisma as any).solicitacoesQrCodeVeiculo.findMany({
        where: {
          idVeiculo: { in: veiculoIds },
          prefeitura_id: prefeituraId,
          status: {
            in: ['Solicitado', 'Aprovado', 'Em_Producao', 'Integracao', 'Concluida'],
          },
        },
        select: {
          id: true,
          idVeiculo: true,
          status: true,
          veiculo: {
            select: {
              nome: true,
              placa: true,
            },
          },
        },
      });
    } catch (error) {
      // Se o modelo não existir, continuar sem verificação (tabela ainda não foi criada)
      console.warn('Tabela solicitacoes_qrcode_veiculo não encontrada. Aplique a migration primeiro.');
      solicitacoesExistentes = [];
    }

    if (solicitacoesExistentes.length > 0) {
      const veiculosComSolicitacao = solicitacoesExistentes.map(
        (s) => `${s.veiculo.nome} (${s.veiculo.placa}) - Status: ${s.status}`
      );
      throw new ConflictException(
        `Já existe uma solicitação em andamento para os seguintes veículos: ${veiculosComSolicitacao.join(', ')}`
      );
    }

    // Criar as solicitações para cada veículo
    const solicitacoes = await Promise.all(
      veiculoIds.map((idVeiculo) =>
        (this.prisma as any).solicitacoesQrCodeVeiculo.create({
          data: {
            idVeiculo,
            prefeitura_id: prefeituraId,
            status: 'Solicitado',
            foto: createSolicitacaoQrCodeDto.foto,
          },
          include: {
            veiculo: {
              select: {
                id: true,
                nome: true,
                placa: true,
              },
            },
            prefeitura: {
              select: {
                id: true,
                nome: true,
                cnpj: true,
              },
            },
          },
        })
      )
    );

    return {
      message: `${solicitacoes.length} solicitação(ões) de QR Code criada(s) com sucesso`,
      solicitacoes,
    };
  }

  private async validateCreateVeiculoPermission(currentUserId: number, prefeituraId: number) {
    const currentUser = await this.prisma.usuario.findUnique({
      where: { id: currentUserId },
    });

    if (!currentUser) {
      throw new ForbiddenException('Usuário atual não encontrado');
    }

    // Apenas ADMIN_PREFEITURA e SUPER_ADMIN podem cadastrar veículos
    if (currentUser.tipo_usuario !== 'ADMIN_PREFEITURA' && currentUser.tipo_usuario !== 'SUPER_ADMIN') {
      throw new ForbiddenException('Apenas ADMIN_PREFEITURA pode cadastrar veículos');
    }

    // Verificar se o veículo está sendo criado para a própria prefeitura
    if (currentUser.tipo_usuario === 'ADMIN_PREFEITURA' && currentUser.prefeituraId !== prefeituraId) {
      throw new ForbiddenException('Você só pode cadastrar veículos da sua própria prefeitura');
    }
  }
}

import { Injectable, NotFoundException, ConflictException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { CreateVeiculoDto } from './dto/create-veiculo.dto';
import { UpdateVeiculoDto } from './dto/update-veiculo.dto';
import { FindVeiculoDto } from './dto/find-veiculo.dto';
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

    // Criar veículo com status ativo por padrão quando não especificado
    const veiculo = await this.prisma.veiculo.create({
      data: {
        ...veiculoData,
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

    return {
      message: 'Veículos encontrados com sucesso',
      veiculos,
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

    return {
      message: 'Veículo encontrado com sucesso',
      veiculo,
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

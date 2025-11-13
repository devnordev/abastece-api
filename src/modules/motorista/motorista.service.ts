import { Injectable, NotFoundException, ConflictException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { CreateMotoristaDto } from './dto/create-motorista.dto';
import { UpdateMotoristaDto } from './dto/update-motorista.dto';
import { FindMotoristaDto } from './dto/find-motorista.dto';
import { UploadService } from '../upload/upload.service';

@Injectable()
export class MotoristaService {
  constructor(
    private prisma: PrismaService,
    private uploadService: UploadService,
  ) {}

  async create(createMotoristaDto: CreateMotoristaDto, currentUserId?: number, file?: Express.Multer.File) {
    // Validação de autorização
    if (currentUserId) {
      await this.validateCreateMotoristaPermission(currentUserId, createMotoristaDto.prefeituraId);
    }
    const { cpf, email, prefeituraId, imagem_perfil, ...restDto } = createMotoristaDto;

    // Validar campos obrigatórios
    if (!cpf) {
      throw new BadRequestException('CPF é obrigatório para o cadastro de motorista');
    }

    if (!email) {
      throw new BadRequestException('Email é obrigatório para o cadastro de motorista');
    }

    // Verificar se motorista já existe (por CPF ou email)
    const existingMotorista = await this.prisma.motorista.findFirst({
      where: { cpf },
    });

    if (existingMotorista) {
      throw new ConflictException('Motorista já existe com este CPF');
    }

    const existingMotoristaByEmail = await this.prisma.motorista.findFirst({
      where: { email },
    });

    if (existingMotoristaByEmail) {
      throw new ConflictException('Motorista já existe com este email');
    }

    // Verificar se prefeitura existe
    const prefeitura = await this.prisma.prefeitura.findUnique({
      where: { id: prefeituraId },
    });

    if (!prefeitura) {
      throw new NotFoundException('Prefeitura não encontrada');
    }

    // Fazer upload da imagem se arquivo foi enviado
    let imagemUrl = imagem_perfil;
    if (file) {
      try {
        const motoristaIdTmp = Date.now(); // ID temporário para nome do arquivo
        imagemUrl = await this.uploadService.uploadImage(file, 'motoristas', `motorista-${motoristaIdTmp}`);
      } catch (error) {
        // Se falhar o upload, continua sem imagem (ou lança erro se preferir)
        console.warn('Erro ao fazer upload da imagem:', error.message);
        // throw new BadRequestException(`Erro ao fazer upload da imagem: ${error.message}`);
      }
    }

    // Criar motorista com status ativo por padrão quando não especificado
    const motorista = await this.prisma.motorista.create({
      data: {
        ...restDto,
        prefeituraId,
        cpf,
        email,
        imagem_perfil: imagemUrl,
        ativo: createMotoristaDto.ativo !== undefined ? createMotoristaDto.ativo : true,
      },
      include: {
        prefeitura: {
          select: {
            id: true,
            nome: true,
            cnpj: true,
          },
        },
      },
    });

    return {
      message: 'Motorista criado com sucesso',
      motorista,
    };
  }

  async findAll(findMotoristaDto: FindMotoristaDto, currentUserId?: number) {
    let {
      nome,
      cpf,
      cnh,
      ativo,
      prefeituraId,
      page = 1,
      limit = 10,
    } = findMotoristaDto;

    const skip = (page - 1) * limit;

    // Aplicar filtros de autorização se houver usuário logado
    if (currentUserId) {
      const currentUser = await this.prisma.usuario.findUnique({
        where: { id: currentUserId },
      });

      if (currentUser) {
        // ADMIN_PREFEITURA só pode ver motoristas da sua prefeitura
        if (currentUser.tipo_usuario === 'ADMIN_PREFEITURA') {
          if (!currentUser.prefeituraId) {
            throw new ForbiddenException('Administrador sem prefeitura vinculada');
          }
          prefeituraId = currentUser.prefeituraId;
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

    if (cpf) {
      where.cpf = {
        contains: cpf,
      };
    }

    if (cnh) {
      where.cnh = {
        contains: cnh,
      };
    }

    if (ativo !== undefined) {
      where.ativo = ativo;
    }

    if (prefeituraId) {
      where.prefeituraId = prefeituraId;
    }

    // Buscar motoristas
    const [motoristas, total] = await Promise.all([
      this.prisma.motorista.findMany({
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
          solicitacoesQrCode: {
            select: {
              id: true,
              idMotorista: true,
              data_cadastro: true,
              status: true,
              data_cancelamento: true,
              motivo_cancelamento: true,
              cancelamento_solicitado_por: true,
              cancelamento_efetuado_por: true,
              prefeitura_id: true,
              foto: true,
            },
            orderBy: {
              data_cadastro: 'desc',
            },
            take: 1, // Pegar apenas a mais recente
          },
        },
        orderBy: {
          nome: 'asc',
        },
      }),
      this.prisma.motorista.count({ where }),
    ]);

    return {
      message: 'Motoristas encontrados com sucesso',
      motoristas,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: number) {
    const motorista = await this.prisma.motorista.findUnique({
      where: { id },
      include: {
        prefeitura: {
          select: {
            id: true,
            nome: true,
            cnpj: true,
          },
        },
        veiculos: {
          include: {
            veiculo: {
              select: {
                id: true,
                nome: true,
                placa: true,
                modelo: true,
                tipo_veiculo: true,
              },
            },
          },
        },
        solicitacoesQrCode: {
          select: {
            id: true,
            idMotorista: true,
            data_cadastro: true,
            status: true,
            data_cancelamento: true,
            motivo_cancelamento: true,
            cancelamento_solicitado_por: true,
            cancelamento_efetuado_por: true,
            prefeitura_id: true,
            foto: true,
          },
          orderBy: {
            data_cadastro: 'desc',
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

    if (!motorista) {
      throw new NotFoundException('Motorista não encontrado');
    }

    return {
      message: 'Motorista encontrado com sucesso',
      motorista,
    };
  }

  async update(id: number, updateMotoristaDto: UpdateMotoristaDto, file?: Express.Multer.File) {
    // Verificar se motorista existe
    const existingMotorista = await this.prisma.motorista.findUnique({
      where: { id },
    });

    if (!existingMotorista) {
      throw new NotFoundException('Motorista não encontrado');
    }

    // Se estiver atualizando o CPF, verificar se já existe
    if (updateMotoristaDto.cpf) {
      const conflictingMotorista = await this.prisma.motorista.findFirst({
        where: {
          cpf: updateMotoristaDto.cpf,
          id: { not: id },
        },
      });

      if (conflictingMotorista) {
        throw new ConflictException('CPF já está em uso por outro motorista');
      }
    }

    // Se arquivo foi enviado, fazer upload
    let imagemUrl = updateMotoristaDto.imagem_perfil;
    if (file) {
      try {
        // Remover imagem antiga se existir
        if (existingMotorista.imagem_perfil) {
          try {
            const oldFilePath = this.uploadService.extractFilePathFromUrl(existingMotorista.imagem_perfil);
            if (oldFilePath) {
              await this.uploadService.deleteImage(oldFilePath);
            }
          } catch (error) {
            console.warn('Erro ao remover imagem antiga:', error.message);
          }
        }

        // Fazer upload da nova imagem
        imagemUrl = await this.uploadService.uploadImage(file, 'motoristas', `motorista-${id}`);
      } catch (error) {
        console.warn('Erro ao fazer upload da imagem:', error.message);
        // Se falhar, mantém a URL anterior ou lança erro
        if (!existingMotorista.imagem_perfil) {
          throw new BadRequestException(`Erro ao fazer upload da imagem: ${error.message}`);
        }
      }
    }

    // Preparar dados para atualização
    const { imagem_perfil, ...restDto } = updateMotoristaDto;
    const updateData: any = {
      ...restDto,
    };

    // Só atualiza imagem_perfil se tiver nova URL ou se foi explicitamente enviado como null
    if (imagemUrl !== undefined) {
      updateData.imagem_perfil = imagemUrl;
    }

    // Atualizar motorista
    const motorista = await this.prisma.motorista.update({
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
      },
    });

    return {
      message: 'Motorista atualizado com sucesso',
      motorista,
    };
  }

  async remove(id: number) {
    // Verificar se motorista existe
    const existingMotorista = await this.prisma.motorista.findUnique({
      where: { id },
    });

    if (!existingMotorista) {
      throw new NotFoundException('Motorista não encontrado');
    }

    // Verificar se motorista tem relacionamentos que impedem a exclusão
    const hasRelations = await this.prisma.abastecimento.findFirst({
      where: { motoristaId: id },
    });

    if (hasRelations) {
      throw new BadRequestException('Não é possível excluir motorista com abastecimentos associados');
    }

    // Excluir motorista
    await this.prisma.motorista.delete({
      where: { id },
    });

    return {
      message: 'Motorista excluído com sucesso',
    };
  }

  async findByCpf(cpf: string) {
    return this.prisma.motorista.findUnique({
      where: { cpf },
    });
  }

  private async validateCreateMotoristaPermission(currentUserId: number, prefeituraId: number) {
    const currentUser = await this.prisma.usuario.findUnique({
      where: { id: currentUserId },
    });

    if (!currentUser) {
      throw new ForbiddenException('Usuário atual não encontrado');
    }

    // Apenas ADMIN_PREFEITURA e SUPER_ADMIN podem cadastrar motoristas
    if (currentUser.tipo_usuario !== 'ADMIN_PREFEITURA' && currentUser.tipo_usuario !== 'SUPER_ADMIN') {
      throw new ForbiddenException('Apenas ADMIN_PREFEITURA pode cadastrar motoristas');
    }

    // Verificar se o motorista está sendo criado para a própria prefeitura
    if (currentUser.tipo_usuario === 'ADMIN_PREFEITURA' && currentUser.prefeituraId !== prefeituraId) {
      throw new ForbiddenException('Você só pode cadastrar motoristas da sua própria prefeitura');
    }
  }
}

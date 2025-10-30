import { Injectable, NotFoundException, ConflictException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { CreateMotoristaDto } from './dto/create-motorista.dto';
import { UpdateMotoristaDto } from './dto/update-motorista.dto';
import { FindMotoristaDto } from './dto/find-motorista.dto';

@Injectable()
export class MotoristaService {
  constructor(private prisma: PrismaService) {}

  async create(createMotoristaDto: CreateMotoristaDto, currentUserId?: number) {
    // Validação de autorização
    if (currentUserId) {
      await this.validateCreateMotoristaPermission(currentUserId, createMotoristaDto.prefeituraId);
    }
    const { cpf, email, prefeituraId } = createMotoristaDto;

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

    // Criar motorista com status ativo por padrão quando não especificado
    const motorista = await this.prisma.motorista.create({
      data: {
        ...createMotoristaDto,
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

  async update(id: number, updateMotoristaDto: UpdateMotoristaDto) {
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

    // Atualizar motorista
    const motorista = await this.prisma.motorista.update({
      where: { id },
      data: updateMotoristaDto,
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

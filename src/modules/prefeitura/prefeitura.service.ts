import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { CreatePrefeituraDto } from './dto/create-prefeitura.dto';
import { UpdatePrefeituraDto } from './dto/update-prefeitura.dto';
import { FindPrefeituraDto } from './dto/find-prefeitura.dto';

@Injectable()
export class PrefeituraService {
  constructor(private prisma: PrismaService) {}

  async create(createPrefeituraDto: CreatePrefeituraDto) {
    const { cnpj, email_administrativo } = createPrefeituraDto;

    // Verificar se prefeitura já existe
    const existingPrefeitura = await this.prisma.prefeitura.findFirst({
      where: {
        OR: [
          { cnpj },
          { email_administrativo },
        ],
      },
    });

    if (existingPrefeitura) {
      throw new ConflictException('Prefeitura já existe com este CNPJ ou email');
    }

    // Criar prefeitura
    const prefeitura = await this.prisma.prefeitura.create({
      data: {
        ...createPrefeituraDto,
        data_cadastro: new Date(),
      },
    });

    return {
      message: 'Prefeitura criada com sucesso',
      prefeitura,
    };
  }

  async findAll(findPrefeituraDto: FindPrefeituraDto) {
    const {
      nome,
      cnpj,
      email_administrativo,
      ativo,
      page = 1,
      limit = 10,
    } = findPrefeituraDto;

    const skip = (page - 1) * limit;

    // Construir filtros
    const where: any = {};

    if (nome) {
      where.nome = {
        contains: nome,
        mode: 'insensitive',
      };
    }

    if (cnpj) {
      where.cnpj = {
        contains: cnpj,
      };
    }

    if (email_administrativo) {
      where.email_administrativo = {
        contains: email_administrativo,
        mode: 'insensitive',
      };
    }

    if (ativo !== undefined) {
      where.ativo = ativo;
    }

    // Buscar prefeituras
    const [prefeituras, total] = await Promise.all([
      this.prisma.prefeitura.findMany({
        where,
        skip,
        take: limit,
        orderBy: {
          data_cadastro: 'desc',
        },
      }),
      this.prisma.prefeitura.count({ where }),
    ]);

    return {
      message: 'Prefeituras encontradas com sucesso',
      prefeituras,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: number) {
    const prefeitura = await this.prisma.prefeitura.findUnique({
      where: { id },
      include: {
        usuarios: {
          select: {
            id: true,
            nome: true,
            email: true,
            tipo_usuario: true,
            ativo: true,
          },
        },
        orgaos: {
          select: {
            id: true,
            nome: true,
            sigla: true,
            ativo: true,
          },
        },
        _count: {
          select: {
            usuarios: true,
            orgaos: true,
            veiculos: true,
            motoristas: true,
          },
        },
      },
    });

    if (!prefeitura) {
      throw new NotFoundException('Prefeitura não encontrada');
    }

    return {
      message: 'Prefeitura encontrada com sucesso',
      prefeitura,
    };
  }

  async update(id: number, updatePrefeituraDto: UpdatePrefeituraDto) {
    // Verificar se prefeitura existe
    const existingPrefeitura = await this.prisma.prefeitura.findUnique({
      where: { id },
    });

    if (!existingPrefeitura) {
      throw new NotFoundException('Prefeitura não encontrada');
    }

    // Se estiver atualizando CNPJ ou email, verificar se já existe
    if (updatePrefeituraDto.cnpj || updatePrefeituraDto.email_administrativo) {
      const whereCondition: any = {
        id: { not: id },
      };

      if (updatePrefeituraDto.cnpj || updatePrefeituraDto.email_administrativo) {
        whereCondition.OR = [];
        if (updatePrefeituraDto.cnpj) {
          whereCondition.OR.push({ cnpj: updatePrefeituraDto.cnpj });
        }
        if (updatePrefeituraDto.email_administrativo) {
          whereCondition.OR.push({ email_administrativo: updatePrefeituraDto.email_administrativo });
        }
      }

      const conflictingPrefeitura = await this.prisma.prefeitura.findFirst({
        where: whereCondition,
      });

      if (conflictingPrefeitura) {
        throw new ConflictException('CNPJ ou email já está em uso por outra prefeitura');
      }
    }

    // Atualizar prefeitura
    const prefeitura = await this.prisma.prefeitura.update({
      where: { id },
      data: updatePrefeituraDto,
    });

    return {
      message: 'Prefeitura atualizada com sucesso',
      prefeitura,
    };
  }

  async remove(id: number) {
    // Verificar se prefeitura existe
    const existingPrefeitura = await this.prisma.prefeitura.findUnique({
      where: { id },
    });

    if (!existingPrefeitura) {
      throw new NotFoundException('Prefeitura não encontrada');
    }

    // Verificar se prefeitura tem relacionamentos que impedem a exclusão
    const hasRelations = await this.prisma.usuario.findFirst({
      where: { prefeituraId: id },
    });

    if (hasRelations) {
      throw new BadRequestException('Não é possível excluir prefeitura com usuários associados');
    }

    // Excluir prefeitura
    await this.prisma.prefeitura.delete({
      where: { id },
    });

    return {
      message: 'Prefeitura excluída com sucesso',
    };
  }

  async findByCnpj(cnpj: string) {
    return this.prisma.prefeitura.findUnique({
      where: { cnpj },
    });
  }

  async findByEmail(email: string) {
    return this.prisma.prefeitura.findUnique({
      where: { email_administrativo: email },
    });
  }
}

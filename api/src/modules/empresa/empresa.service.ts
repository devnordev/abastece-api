import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { CreateEmpresaDto } from './dto/create-empresa.dto';
import { UpdateEmpresaDto } from './dto/update-empresa.dto';
import { FindEmpresaDto } from './dto/find-empresa.dto';

@Injectable()
export class EmpresaService {
  constructor(private prisma: PrismaService) {}

  async create(createEmpresaDto: CreateEmpresaDto) {
    const { cnpj } = createEmpresaDto;

    // Verificar se empresa já existe
    const existingEmpresa = await this.prisma.empresa.findFirst({
      where: { cnpj },
    });

    if (existingEmpresa) {
      throw new ConflictException('Empresa já existe com este CNPJ');
    }

    // Criar empresa
    const empresa = await this.prisma.empresa.create({
      data: {
        ...createEmpresaDto,
        ativo: createEmpresaDto.ativo ?? true,
      } as any,
    });

    return {
      message: 'Empresa criada com sucesso',
      empresa,
    };
  }

  async findAll(findEmpresaDto: FindEmpresaDto) {
    const {
      nome,
      cnpj,
      uf,
      tipo_empresa,
      ativo,
      isPublic,
      bandeira,
      page = 1,
      limit = 10,
    } = findEmpresaDto;

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

    if (uf) {
      where.uf = uf;
    }

    if (tipo_empresa) {
      where.tipo_empresa = tipo_empresa;
    }

    if (ativo !== undefined) {
      where.ativo = ativo;
    }

    if (isPublic !== undefined) {
      where.isPublic = isPublic;
    }

    if (bandeira) {
      where.bandeira = {
        contains: bandeira,
        mode: 'insensitive',
      };
    }

    // Buscar empresas
    const [empresas, total] = await Promise.all([
      this.prisma.empresa.findMany({
        where,
        skip,
        take: limit,
        orderBy: {
          nome: 'asc',
        },
      }),
      this.prisma.empresa.count({ where }),
    ]);

    return {
      message: 'Empresas encontradas com sucesso',
      empresas,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: number) {
    const empresa = await this.prisma.empresa.findUnique({
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
        contratos: {
          select: {
            id: true,
            title: true,
            vigencia_inicio: true,
            vigencia_fim: true,
            ativo: true,
          },
        },
        precosCombustiveis: {
          select: {
            id: true,
            preco_atual: true,
            teto_vigente: true,
            status: true,
            combustivel: {
              select: {
                id: true,
                nome: true,
                sigla: true,
              },
            },
          },
        },
        _count: {
          select: {
            usuarios: true,
            contratos: true,
            abastecimentos: true,
          },
        },
      },
    });

    if (!empresa) {
      throw new NotFoundException('Empresa não encontrada');
    }

    return {
      message: 'Empresa encontrada com sucesso',
      empresa,
    };
  }

  async update(id: number, updateEmpresaDto: UpdateEmpresaDto) {
    // Verificar se empresa existe
    const existingEmpresa = await this.prisma.empresa.findUnique({
      where: { id },
    });

    if (!existingEmpresa) {
      throw new NotFoundException('Empresa não encontrada');
    }

    // Se estiver atualizando CNPJ, verificar se já existe
    if (updateEmpresaDto.cnpj) {
      const conflictingEmpresa = await this.prisma.empresa.findFirst({
        where: {
          cnpj: updateEmpresaDto.cnpj,
          id: { not: id },
        },
      });

      if (conflictingEmpresa) {
        throw new ConflictException('CNPJ já está em uso por outra empresa');
      }
    }

    // Atualizar empresa
    const empresa = await this.prisma.empresa.update({
      where: { id },
      data: updateEmpresaDto as any,
    });

    return {
      message: 'Empresa atualizada com sucesso',
      empresa,
    };
  }

  async remove(id: number) {
    // Verificar se empresa existe
    const existingEmpresa = await this.prisma.empresa.findUnique({
      where: { id },
    });

    if (!existingEmpresa) {
      throw new NotFoundException('Empresa não encontrada');
    }

    // Verificar se empresa tem relacionamentos que impedem a exclusão
    const hasRelations = await this.prisma.usuario.findFirst({
      where: { empresaId: id },
    });

    if (hasRelations) {
      throw new BadRequestException('Não é possível excluir empresa com usuários associados');
    }

    // Excluir empresa
    await this.prisma.empresa.delete({
      where: { id },
    });

    return {
      message: 'Empresa excluída com sucesso',
    };
  }

  async findByCnpj(cnpj: string) {
    return this.prisma.empresa.findFirst({
      where: { cnpj },
    });
  }

  async findNearby(latitude: number, longitude: number, radius: number = 10) {
    // Esta é uma implementação simplificada
    // Em produção, você usaria extensões do PostgreSQL como PostGIS para busca geográfica
    const empresas = await this.prisma.empresa.findMany({
      where: {
        ativo: true,
        latitude: {
          gte: latitude - (radius / 111), // Aproximação: 1 grau ≈ 111 km
          lte: latitude + (radius / 111),
        },
        longitude: {
          gte: longitude - (radius / 111),
          lte: longitude + (radius / 111),
        },
      },
      select: {
        id: true,
        nome: true,
        endereco_completo: true,
        latitude: true,
        longitude: true,
        telefone: true,
        bandeira: true,
        tipo_empresa: true,
      },
    });

    return {
      message: 'Empresas próximas encontradas com sucesso',
      empresas,
    };
  }
}

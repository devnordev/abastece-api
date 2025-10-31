import { Injectable, NotFoundException, ConflictException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';

@Injectable()
export class OrgaoService {
  constructor(private prisma: PrismaService) {}

  async create(data: { prefeituraId: number; nome: string; sigla: string; ativo?: boolean }, currentUserId?: number) {
    // Validação de autorização
    if (currentUserId) {
      await this.validateCreateOrgaoPermission(currentUserId, data.prefeituraId);
    }
    const prefeitura = await this.prisma.prefeitura.findUnique({
      where: { id: data.prefeituraId },
    });

    if (!prefeitura) {
      throw new NotFoundException('Prefeitura não encontrada');
    }

    // Verificar se já existe um órgão com o mesmo nome ou sigla nesta prefeitura
    const existingOrgao = await this.prisma.orgao.findFirst({
      where: {
        prefeituraId: data.prefeituraId,
        OR: [
          { nome: data.nome },
          { sigla: data.sigla },
        ],
      },
    });

    if (existingOrgao) {
      if (existingOrgao.nome.toLowerCase() === data.nome.toLowerCase()) {
        throw new ConflictException('Já existe um órgão com este nome nesta prefeitura');
      }
      if (existingOrgao.sigla.toUpperCase() === data.sigla.toUpperCase()) {
        throw new ConflictException('Já existe um órgão com esta sigla nesta prefeitura');
      }
    }

    const orgao = await this.prisma.orgao.create({
      data,
      include: {
        prefeitura: {
          select: { id: true, nome: true, cnpj: true },
        },
      },
    });

    return {
      message: 'Órgão criado com sucesso',
      orgao,
    };
  }

  async findAll(page = 1, limit = 10, prefeituraId?: number, ativo?: boolean, currentUserId?: number) {
    const skip = (page - 1) * limit;
    const where: any = {};
    
    // Aplicar filtros de autorização se houver usuário logado
    if (currentUserId) {
      const currentUser = await this.prisma.usuario.findUnique({
        where: { id: currentUserId },
      });

      if (currentUser) {
        // ADMIN_PREFEITURA só pode ver órgãos da sua prefeitura
        if (currentUser.tipo_usuario === 'ADMIN_PREFEITURA') {
          if (!currentUser.prefeituraId) {
            throw new ForbiddenException('Administrador sem prefeitura vinculada');
          }
          prefeituraId = currentUser.prefeituraId;
        }
      }
    }
    
    if (prefeituraId) where.prefeituraId = prefeituraId;
    if (ativo !== undefined) where.ativo = ativo;

    const [orgaos, total] = await Promise.all([
      this.prisma.orgao.findMany({
        where,
        skip,
        take: limit,
        include: {
          prefeitura: {
            select: { id: true, nome: true, cnpj: true },
          },
        },
        orderBy: { nome: 'asc' },
      }),
      this.prisma.orgao.count({ where }),
    ]);

    return {
      message: 'Órgãos encontrados com sucesso',
      orgaos,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  async findOne(id: number) {
    const orgao = await this.prisma.orgao.findUnique({
      where: { id },
      include: {
        prefeitura: {
          select: { id: true, nome: true, cnpj: true },
        },
        _count: {
          select: {
            veiculos: true,
            usuarios: true,
            cotasOrgao: true,
          },
        },
      },
    });

    if (!orgao) {
      throw new NotFoundException('Órgão não encontrado');
    }

    return {
      message: 'Órgão encontrado com sucesso',
      orgao,
    };
  }

  async update(id: number, data: { nome?: string; sigla?: string; ativo?: boolean }) {
    const existingOrgao = await this.prisma.orgao.findUnique({
      where: { id },
    });

    if (!existingOrgao) {
      throw new NotFoundException('Órgão não encontrado');
    }

    const orgao = await this.prisma.orgao.update({
      where: { id },
      data,
      include: {
        prefeitura: {
          select: { id: true, nome: true, cnpj: true },
        },
      },
    });

    return {
      message: 'Órgão atualizado com sucesso',
      orgao,
    };
  }

  async remove(id: number) {
    const existingOrgao = await this.prisma.orgao.findUnique({
      where: { id },
    });

    if (!existingOrgao) {
      throw new NotFoundException('Órgão não encontrado');
    }

    await this.prisma.orgao.delete({
      where: { id },
    });

    return {
      message: 'Órgão excluído com sucesso',
    };
  }

  async findVeiculosByOrgao(orgaoId: number, page = 1, limit = 10, currentUserId?: number) {
    const skip = (page - 1) * limit;

    // Verificar se o órgão existe
    const orgao = await this.prisma.orgao.findUnique({
      where: { id: orgaoId },
    });

    if (!orgao) {
      throw new NotFoundException('Órgão não encontrado');
    }

    // Aplicar filtros de autorização se houver usuário logado
    if (currentUserId) {
      const currentUser = await this.prisma.usuario.findUnique({
        where: { id: currentUserId },
      });

      if (currentUser) {
        // ADMIN_PREFEITURA só pode ver veículos dos órgãos da sua prefeitura
        if (currentUser.tipo_usuario === 'ADMIN_PREFEITURA') {
          if (!currentUser.prefeituraId) {
            throw new ForbiddenException('Administrador sem prefeitura vinculada');
          }
          
          // Verificar se o órgão pertence à prefeitura do admin
          if (orgao.prefeituraId !== currentUser.prefeituraId) {
            throw new ForbiddenException('Você não tem permissão para acessar este órgão');
          }
        }
      }
    }

    // Buscar veículos do órgão
    const [veiculos, total] = await Promise.all([
      this.prisma.veiculo.findMany({
        where: { orgaoId },
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
      this.prisma.veiculo.count({ where: { orgaoId } }),
    ]);

    return {
      message: 'Veículos encontrados com sucesso',
      orgao: {
        id: orgao.id,
        nome: orgao.nome,
        sigla: orgao.sigla,
      },
      veiculos,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  private async validateCreateOrgaoPermission(currentUserId: number, prefeituraId: number) {
    const currentUser = await this.prisma.usuario.findUnique({
      where: { id: currentUserId },
    });

    if (!currentUser) {
      throw new ForbiddenException('Usuário atual não encontrado');
    }

    // Apenas ADMIN_PREFEITURA e SUPER_ADMIN podem cadastrar órgãos
    if (currentUser.tipo_usuario !== 'ADMIN_PREFEITURA' && currentUser.tipo_usuario !== 'SUPER_ADMIN') {
      throw new ForbiddenException('Apenas ADMIN_PREFEITURA pode cadastrar órgãos');
    }

    // Verificar se o órgão está sendo criado para a própria prefeitura
    if (currentUser.tipo_usuario === 'ADMIN_PREFEITURA' && currentUser.prefeituraId !== prefeituraId) {
      throw new ForbiddenException('Você só pode cadastrar órgãos da sua própria prefeitura');
    }
  }
}

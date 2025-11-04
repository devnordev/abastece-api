import { Injectable, NotFoundException, ConflictException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';

@Injectable()
export class ContaFaturamentoOrgaoService {
  constructor(private prisma: PrismaService) {}

  async create(
    data: { prefeituraId: number; orgaoId: number; nome: string; descricao?: string },
    currentUserId?: number,
  ) {
    // Validação de autorização
    if (currentUserId) {
      await this.validateCreatePermission(currentUserId, data.prefeituraId, data.orgaoId);
    }

    // Verificar se a prefeitura existe
    const prefeitura = await this.prisma.prefeitura.findUnique({
      where: { id: data.prefeituraId },
    });

    if (!prefeitura) {
      throw new NotFoundException('Prefeitura não encontrada');
    }

    // Verificar se o órgão existe e pertence à prefeitura
    const orgao = await this.prisma.orgao.findUnique({
      where: { id: data.orgaoId },
    });

    if (!orgao) {
      throw new NotFoundException('Órgão não encontrado');
    }

    if (orgao.prefeituraId !== data.prefeituraId) {
      throw new ConflictException('Órgão não pertence à prefeitura informada');
    }

    // Verificar se já existe uma conta de faturamento com o mesmo nome para este órgão
    const existingConta = await this.prisma.contaFaturamentoOrgao.findFirst({
      where: {
        orgaoId: data.orgaoId,
        nome: {
          equals: data.nome,
          mode: 'insensitive',
        },
      },
    });

    if (existingConta) {
      throw new ConflictException('Já existe uma conta de faturamento com este nome para este órgão');
    }

    const conta = await this.prisma.contaFaturamentoOrgao.create({
      data,
      include: {
        prefeitura: {
          select: { id: true, nome: true, cnpj: true },
        },
        orgao: {
          select: { id: true, nome: true, sigla: true },
        },
      },
    });

    return {
      message: 'Conta de faturamento criada com sucesso',
      conta,
    };
  }

  async findAll(page = 1, limit = 10, prefeituraId?: number, orgaoId?: number, currentUserId?: number) {
    const skip = (page - 1) * limit;
    const where: any = {};

    // Aplicar filtros de autorização se houver usuário logado
    if (currentUserId) {
      const currentUser = await this.prisma.usuario.findUnique({
        where: { id: currentUserId },
      });

      if (currentUser) {
        // ADMIN_PREFEITURA só pode ver contas da sua prefeitura
        if (currentUser.tipo_usuario === 'ADMIN_PREFEITURA') {
          if (!currentUser.prefeituraId) {
            throw new ForbiddenException('Administrador sem prefeitura vinculada');
          }
          prefeituraId = currentUser.prefeituraId;
        }
      }
    }

    if (prefeituraId) where.prefeituraId = prefeituraId;
    if (orgaoId) where.orgaoId = orgaoId;

    const [contas, total] = await Promise.all([
      this.prisma.contaFaturamentoOrgao.findMany({
        where,
        skip,
        take: limit,
        include: {
          prefeitura: {
            select: { id: true, nome: true, cnpj: true },
          },
          orgao: {
            select: { id: true, nome: true, sigla: true },
          },
          _count: {
            select: {
              veiculos: true,
              abastecimentos: true,
            },
          },
        },
        orderBy: { nome: 'asc' },
      }),
      this.prisma.contaFaturamentoOrgao.count({ where }),
    ]);

    return {
      message: 'Contas de faturamento encontradas com sucesso',
      contas,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  async findOne(id: number, currentUserId?: number) {
    const conta = await this.prisma.contaFaturamentoOrgao.findUnique({
      where: { id },
      include: {
        prefeitura: {
          select: { id: true, nome: true, cnpj: true },
        },
        orgao: {
          select: { id: true, nome: true, sigla: true },
        },
        _count: {
          select: {
            veiculos: true,
            abastecimentos: true,
          },
        },
      },
    });

    if (!conta) {
      throw new NotFoundException('Conta de faturamento não encontrada');
    }

    // Verificar permissão de acesso
    if (currentUserId) {
      await this.validateAccessPermission(currentUserId, conta.prefeituraId);
    }

    return {
      message: 'Conta de faturamento encontrada com sucesso',
      conta,
    };
  }

  async update(
    id: number,
    data: { nome?: string; descricao?: string },
    currentUserId?: number,
  ) {
    const existingConta = await this.prisma.contaFaturamentoOrgao.findUnique({
      where: { id },
      include: {
        prefeitura: true,
        orgao: true,
      },
    });

    if (!existingConta) {
      throw new NotFoundException('Conta de faturamento não encontrada');
    }

    // Verificar permissão de atualização
    if (currentUserId) {
      await this.validateAccessPermission(currentUserId, existingConta.prefeituraId);
    }

    // Se estiver atualizando o nome, verificar se não existe outra conta com o mesmo nome no mesmo órgão
    if (data.nome && data.nome !== existingConta.nome) {
      const existingContaWithName = await this.prisma.contaFaturamentoOrgao.findFirst({
        where: {
          orgaoId: existingConta.orgaoId,
          nome: {
            equals: data.nome,
            mode: 'insensitive',
          },
          id: {
            not: id,
          },
        },
      });

      if (existingContaWithName) {
        throw new ConflictException('Já existe uma conta de faturamento com este nome para este órgão');
      }
    }

    const conta = await this.prisma.contaFaturamentoOrgao.update({
      where: { id },
      data,
      include: {
        prefeitura: {
          select: { id: true, nome: true, cnpj: true },
        },
        orgao: {
          select: { id: true, nome: true, sigla: true },
        },
      },
    });

    return {
      message: 'Conta de faturamento atualizada com sucesso',
      conta,
    };
  }

  async remove(id: number, currentUserId?: number) {
    const existingConta = await this.prisma.contaFaturamentoOrgao.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            veiculos: true,
            abastecimentos: true,
          },
        },
      },
    });

    if (!existingConta) {
      throw new NotFoundException('Conta de faturamento não encontrada');
    }

    // Verificar permissão de exclusão
    if (currentUserId) {
      await this.validateAccessPermission(currentUserId, existingConta.prefeituraId);
    }

    // Verificar se há veículos ou abastecimentos vinculados
    if (existingConta._count.veiculos > 0 || existingConta._count.abastecimentos > 0) {
      throw new ConflictException(
        'Não é possível excluir a conta de faturamento pois há veículos ou abastecimentos vinculados',
      );
    }

    await this.prisma.contaFaturamentoOrgao.delete({
      where: { id },
    });

    return {
      message: 'Conta de faturamento excluída com sucesso',
    };
  }

  private async validateCreatePermission(
    currentUserId: number,
    prefeituraId: number,
    orgaoId: number,
  ) {
    const currentUser = await this.prisma.usuario.findUnique({
      where: { id: currentUserId },
    });

    if (!currentUser) {
      throw new ForbiddenException('Usuário atual não encontrado');
    }

    // Apenas ADMIN_PREFEITURA pode criar contas de faturamento
    if (currentUser.tipo_usuario !== 'ADMIN_PREFEITURA') {
      throw new ForbiddenException('Apenas ADMIN_PREFEITURA pode criar contas de faturamento');
    }

    // Verificar se a conta está sendo criada para a própria prefeitura
    if (!currentUser.prefeituraId) {
      throw new ForbiddenException('Administrador sem prefeitura vinculada');
    }

    if (currentUser.prefeituraId !== prefeituraId) {
      throw new ForbiddenException('Você só pode criar contas de faturamento para a sua própria prefeitura');
    }

    // Verificar se o órgão pertence à prefeitura do admin
    const orgao = await this.prisma.orgao.findUnique({
      where: { id: orgaoId },
    });

    if (!orgao) {
      throw new NotFoundException('Órgão não encontrado');
    }

    if (orgao.prefeituraId !== prefeituraId) {
      throw new ForbiddenException('Órgão não pertence à sua prefeitura');
    }
  }

  private async validateAccessPermission(currentUserId: number, prefeituraId: number) {
    const currentUser = await this.prisma.usuario.findUnique({
      where: { id: currentUserId },
    });

    if (!currentUser) {
      throw new ForbiddenException('Usuário atual não encontrado');
    }

    // Apenas ADMIN_PREFEITURA pode acessar contas de faturamento
    if (currentUser.tipo_usuario !== 'ADMIN_PREFEITURA') {
      throw new ForbiddenException('Apenas ADMIN_PREFEITURA pode acessar contas de faturamento');
    }

    // Verificar se o usuário está tentando acessar conta de outra prefeitura
    if (!currentUser.prefeituraId) {
      throw new ForbiddenException('Administrador sem prefeitura vinculada');
    }

    if (currentUser.prefeituraId !== prefeituraId) {
      throw new ForbiddenException('Você não tem permissão para acessar esta conta de faturamento');
    }
  }
}


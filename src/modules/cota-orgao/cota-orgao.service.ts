import { Injectable, NotFoundException, ConflictException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { CreateCotaOrgaoDto, UpdateCotaOrgaoDto } from './dto';

@Injectable()
export class CotaOrgaoService {
  constructor(private prisma: PrismaService) {}

  async create(createDto: CreateCotaOrgaoDto, currentUserId?: number) {
    const { processoId, orgaoId, combustivelId, quantidade, ativa } = createDto;

    // Validar se o processo existe
    const processo = await this.prisma.processo.findUnique({
      where: { id: processoId },
      include: {
        prefeitura: true,
        combustiveis: {
          where: { combustivelId },
        },
      },
    });

    if (!processo) {
      throw new NotFoundException('Processo não encontrado');
    }

    // Validar permissão do usuário (se for ADMIN_PREFEITURA, deve ser da mesma prefeitura)
    if (currentUserId) {
      await this.validateUserPermission(currentUserId, processo.prefeituraId);
    }

    // Validar se o órgão existe e pertence à prefeitura do processo
    const orgao = await this.prisma.orgao.findUnique({
      where: { id: orgaoId },
    });

    if (!orgao) {
      throw new NotFoundException('Órgão não encontrado');
    }

    if (orgao.prefeituraId !== processo.prefeituraId) {
      throw new BadRequestException('Órgão não pertence à prefeitura do processo');
    }

    // Validar se o combustível existe no processo
    if (processo.combustiveis.length === 0) {
      throw new BadRequestException('Combustível não está vinculado a este processo');
    }

    const processoCombustivel = processo.combustiveis[0];
    const quantidadeDisponivel = Number(processoCombustivel.quantidade_litros);

    // Verificar quantidade disponível no processo
    const cotasExistentes = await this.prisma.cotaOrgao.findMany({
      where: {
        processoId,
        combustivelId,
      },
    });

    const totalAlocado = cotasExistentes.reduce(
      (sum, cota) => sum + Number(cota.quantidade),
      0
    );

    if (totalAlocado + quantidade > quantidadeDisponivel) {
      throw new BadRequestException(
        `Quantidade solicitada (${quantidade}L) excede a disponível no processo. Disponível: ${quantidadeDisponivel - totalAlocado}L`
      );
    }

    // Verificar se já existe uma cota para este órgão, processo e combustível
    const cotaExistente = await this.prisma.cotaOrgao.findFirst({
      where: {
        processoId,
        orgaoId,
        combustivelId,
      },
    });

    if (cotaExistente) {
      throw new ConflictException('Já existe uma cota para este órgão e combustível neste processo');
    }

    // Criar a cota
    const cota = await this.prisma.cotaOrgao.create({
      data: {
        processoId,
        orgaoId,
        combustivelId,
        quantidade,
        quantidade_utilizada: 0,
        valor_utilizado: 0,
        restante: quantidade,
        saldo_disponivel_cota: 0,
        ativa: ativa !== undefined ? ativa : true,
      },
      include: {
        orgao: {
          select: { id: true, nome: true, sigla: true },
        },
        processo: {
          select: { id: true, numero_processo: true },
        },
        combustivel: {
          select: { id: true, nome: true, sigla: true },
        },
      },
    });

    return {
      message: 'Cota de órgão criada com sucesso',
      cota,
    };
  }

  async findAll(page = 1, limit = 10, processoId?: number, orgaoId?: number, currentUserId?: number) {
    const skip = (page - 1) * limit;
    const where: any = {};

    if (processoId) where.processoId = processoId;
    if (orgaoId) where.orgaoId = orgaoId;

    // Aplicar filtros de autorização
    if (currentUserId) {
      const currentUser = await this.prisma.usuario.findUnique({
        where: { id: currentUserId },
      });

      if (currentUser && currentUser.tipo_usuario === 'ADMIN_PREFEITURA') {
        if (!currentUser.prefeituraId) {
          throw new ForbiddenException('Administrador sem prefeitura vinculada');
        }

        // Filtrar apenas cotas de processos da prefeitura do admin
        where.processo = {
          prefeituraId: currentUser.prefeituraId,
        };
      }
    }

    const [cotas, total] = await Promise.all([
      this.prisma.cotaOrgao.findMany({
        where,
        skip,
        take: limit,
        include: {
          orgao: {
            select: { id: true, nome: true, sigla: true },
          },
          processo: {
            select: { id: true, numero_processo: true, status: true },
          },
          combustivel: {
            select: { id: true, nome: true, sigla: true },
          },
          _count: {
            select: {
              abastecimentos: true,
            },
          },
        },
        orderBy: { id: 'desc' },
      }),
      this.prisma.cotaOrgao.count({ where }),
    ]);

    return {
      message: 'Cotas de órgão encontradas com sucesso',
      cotas,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  async findByOrgaoId(orgaoId: number, currentUserId?: number) {
    // Verificar se o órgão existe
    const orgao = await this.prisma.orgao.findUnique({
      where: { id: orgaoId },
      include: { prefeitura: true },
    });

    if (!orgao) {
      throw new NotFoundException('Órgão não encontrado');
    }

    // Validar permissão do usuário
    if (currentUserId) {
      await this.validateUserPermission(currentUserId, orgao.prefeituraId);
    }

    // Buscar cotas existentes do órgão
    const cotas = await this.prisma.cotaOrgao.findMany({
      where: { orgaoId },
      include: {
        orgao: {
          select: { id: true, nome: true, sigla: true },
        },
        processo: {
          select: { id: true, numero_processo: true, status: true, data_abertura: true, data_encerramento: true },
        },
        combustivel: {
          select: { id: true, nome: true, sigla: true, descricao: true },
        },
        _count: {
          select: {
            abastecimentos: true,
          },
        },
      },
      orderBy: { id: 'desc' },
    });

    // Buscar processo da prefeitura para cadastro de novas cotas
    const processo = await this.prisma.processo.findFirst({
      where: { 
        prefeituraId: orgao.prefeituraId,
        ativo: true,
      },
      include: {
        prefeitura: {
          select: { id: true, nome: true, cnpj: true },
        },
        combustiveis: {
          include: {
            combustivel: {
              select: { id: true, nome: true, sigla: true, descricao: true },
            },
          },
        },
      },
    });

    // Calcular quantidades disponíveis para cada combustível do processo
    let combustiveisDisponiveis = [];
    if (processo) {
      // Para cada combustível do processo, calcular quanto já foi alocado
      combustiveisDisponiveis = await Promise.all(
        processo.combustiveis.map(async (pc) => {
          // Buscar todas as cotas deste combustível no processo
          const cotasExistentes = await this.prisma.cotaOrgao.findMany({
            where: {
              processoId: processo.id,
              combustivelId: pc.combustivelId,
            },
          });

          // Calcular total alocado
          const totalAlocado = cotasExistentes.reduce(
            (sum, cota) => sum + Number(cota.quantidade),
            0
          );

          const quantidadeTotal = Number(pc.quantidade_litros);
          const quantidadeDisponivel = quantidadeTotal - totalAlocado;

          // Verificar se este órgão já tem cota deste combustível
          const cotaExistenteOrgao = cotasExistentes.find(c => c.orgaoId === orgaoId);

          return {
            id: pc.id,
            combustivelId: pc.combustivel.id,
            nome: pc.combustivel.nome,
            sigla: pc.combustivel.sigla,
            descricao: pc.combustivel.descricao,
            quantidadeTotal,
            quantidadeAlocada: totalAlocado,
            quantidadeDisponivel,
            percentualAlocado: quantidadeTotal > 0 ? (totalAlocado / quantidadeTotal) * 100 : 0,
            possuiCotaNesteOrgao: !!cotaExistenteOrgao,
            cotaIdNesteOrgao: cotaExistenteOrgao?.id || null,
          };
        })
      );
    }

    return {
      message: 'Cotas do órgão encontradas com sucesso',
      orgao: {
        id: orgao.id,
        nome: orgao.nome,
        sigla: orgao.sigla,
        prefeitura: {
          id: orgao.prefeitura.id,
          nome: orgao.prefeitura.nome,
          cnpj: orgao.prefeitura.cnpj,
        },
      },
      cotas,
      total: cotas.length,
      // Dados para cadastro de nova cota
      dadosParaCadastro: processo ? {
        processo: {
          id: processo.id,
          numero_processo: processo.numero_processo,
          tipo_contrato: processo.tipo_contrato,
          status: processo.status,
          data_abertura: processo.data_abertura,
          data_encerramento: processo.data_encerramento,
          objeto: processo.objeto,
        },
        combustiveisDisponiveis,
        totalCombustiveis: combustiveisDisponiveis.length,
        instrucoes: {
          titulo: 'Como criar uma nova cota',
          passos: [
            '1. Selecione um combustível disponível da lista',
            '2. Verifique a quantidade disponível para alocação',
            '3. Defina a quantidade em litros que deseja alocar',
            '4. A quantidade não pode exceder o disponível no processo',
            '5. Não é possível criar cota duplicada para o mesmo combustível',
          ],
        },
      } : null,
    };
  }

  async findOne(id: number, currentUserId?: number) {
    const cota = await this.prisma.cotaOrgao.findUnique({
      where: { id },
      include: {
        orgao: {
          select: { id: true, nome: true, sigla: true, prefeituraId: true },
        },
        processo: {
          select: { 
            id: true, 
            numero_processo: true, 
            status: true, 
            data_abertura: true, 
            data_encerramento: true,
            prefeituraId: true,
          },
        },
        combustivel: {
          select: { id: true, nome: true, sigla: true, descricao: true },
        },
        _count: {
          select: {
            abastecimentos: true,
          },
        },
      },
    });

    if (!cota) {
      throw new NotFoundException('Cota de órgão não encontrada');
    }

    // Validar permissão do usuário
    if (currentUserId) {
      await this.validateUserPermission(currentUserId, cota.processo.prefeituraId);
    }

    return {
      message: 'Cota de órgão encontrada com sucesso',
      cota,
    };
  }

  async update(id: number, updateDto: UpdateCotaOrgaoDto, currentUserId?: number) {
    const cotaExistente = await this.prisma.cotaOrgao.findUnique({
      where: { id },
      include: {
        processo: {
          include: {
            combustiveis: true,
          },
        },
      },
    });

    if (!cotaExistente) {
      throw new NotFoundException('Cota de órgão não encontrada');
    }

    // Validar permissão do usuário
    if (currentUserId) {
      await this.validateUserPermission(currentUserId, cotaExistente.processo.prefeituraId);
    }

    // Se estiver atualizando a quantidade, validar disponibilidade
    if (updateDto.quantidade !== undefined) {
      const processoCombustivel = cotaExistente.processo.combustiveis.find(
        pc => pc.combustivelId === cotaExistente.combustivelId
      );

      if (!processoCombustivel) {
        throw new BadRequestException('Combustível não encontrado no processo');
      }

      const quantidadeDisponivel = Number(processoCombustivel.quantidade_litros);

      // Buscar outras cotas do mesmo processo e combustível
      const outrasCotaas = await this.prisma.cotaOrgao.findMany({
        where: {
          processoId: cotaExistente.processoId,
          combustivelId: cotaExistente.combustivelId,
          id: { not: id },
        },
      });

      const totalOutrasCotaas = outrasCotaas.reduce(
        (sum, cota) => sum + Number(cota.quantidade),
        0
      );

      if (totalOutrasCotaas + updateDto.quantidade > quantidadeDisponivel) {
        throw new BadRequestException(
          `Quantidade solicitada (${updateDto.quantidade}L) excede a disponível no processo. Disponível: ${quantidadeDisponivel - totalOutrasCotaas}L`
        );
      }

      // Verificar se a quantidade não é menor que a já utilizada
      if (updateDto.quantidade < Number(cotaExistente.quantidade_utilizada)) {
        throw new BadRequestException(
          `Quantidade não pode ser menor que a já utilizada (${cotaExistente.quantidade_utilizada}L)`
        );
      }
    }

    // Atualizar a cota
    const updateData: any = {};
    if (updateDto.quantidade !== undefined) {
      updateData.quantidade = updateDto.quantidade;
      updateData.restante = updateDto.quantidade - Number(cotaExistente.quantidade_utilizada);
    }
    if (updateDto.ativa !== undefined) {
      updateData.ativa = updateDto.ativa;
    }

    const cota = await this.prisma.cotaOrgao.update({
      where: { id },
      data: updateData,
      include: {
        orgao: {
          select: { id: true, nome: true, sigla: true },
        },
        processo: {
          select: { id: true, numero_processo: true, status: true },
        },
        combustivel: {
          select: { id: true, nome: true, sigla: true },
        },
      },
    });

    return {
      message: 'Cota de órgão atualizada com sucesso',
      cota,
    };
  }

  async ativar(id: number, currentUserId?: number) {
    const cota = await this.prisma.cotaOrgao.findUnique({
      where: { id },
      include: {
        processo: true,
      },
    });

    if (!cota) {
      throw new NotFoundException('Cota de órgão não encontrada');
    }

    // Validar permissão do usuário
    if (currentUserId) {
      await this.validateUserPermission(currentUserId, cota.processo.prefeituraId);
    }

    if (cota.ativa) {
      throw new BadRequestException('Cota já está ativa');
    }

    const cotaAtualizada = await this.prisma.cotaOrgao.update({
      where: { id },
      data: { ativa: true },
      include: {
        orgao: {
          select: { id: true, nome: true, sigla: true },
        },
        processo: {
          select: { id: true, numero_processo: true },
        },
        combustivel: {
          select: { id: true, nome: true, sigla: true },
        },
      },
    });

    return {
      message: 'Cota de órgão ativada com sucesso',
      cota: cotaAtualizada,
    };
  }

  async desativar(id: number, currentUserId?: number) {
    const cota = await this.prisma.cotaOrgao.findUnique({
      where: { id },
      include: {
        processo: true,
      },
    });

    if (!cota) {
      throw new NotFoundException('Cota de órgão não encontrada');
    }

    // Validar permissão do usuário
    if (currentUserId) {
      await this.validateUserPermission(currentUserId, cota.processo.prefeituraId);
    }

    if (!cota.ativa) {
      throw new BadRequestException('Cota já está desativada');
    }

    const cotaAtualizada = await this.prisma.cotaOrgao.update({
      where: { id },
      data: { ativa: false },
      include: {
        orgao: {
          select: { id: true, nome: true, sigla: true },
        },
        processo: {
          select: { id: true, numero_processo: true },
        },
        combustivel: {
          select: { id: true, nome: true, sigla: true },
        },
      },
    });

    return {
      message: 'Cota de órgão desativada com sucesso',
      cota: cotaAtualizada,
    };
  }

  async remove(id: number, currentUserId?: number) {
    const cota = await this.prisma.cotaOrgao.findUnique({
      where: { id },
      include: {
        processo: true,
        _count: {
          select: {
            abastecimentos: true,
          },
        },
      },
    });

    if (!cota) {
      throw new NotFoundException('Cota de órgão não encontrada');
    }

    // Validar permissão do usuário
    if (currentUserId) {
      await this.validateUserPermission(currentUserId, cota.processo.prefeituraId);
    }

    // Verificar se há abastecimentos vinculados
    if (cota._count.abastecimentos > 0) {
      throw new ConflictException(
        'Não é possível excluir a cota pois há abastecimentos vinculados'
      );
    }

    await this.prisma.cotaOrgao.delete({
      where: { id },
    });

    return {
      message: 'Cota de órgão excluída com sucesso',
    };
  }

  private async validateUserPermission(currentUserId: number, prefeituraId: number) {
    const currentUser = await this.prisma.usuario.findUnique({
      where: { id: currentUserId },
    });

    if (!currentUser) {
      throw new ForbiddenException('Usuário atual não encontrado');
    }

    // Apenas ADMIN_PREFEITURA pode gerenciar cotas
    if (currentUser.tipo_usuario !== 'ADMIN_PREFEITURA') {
      throw new ForbiddenException('Apenas ADMIN_PREFEITURA pode gerenciar cotas de órgão');
    }

    // Verificar se o usuário está tentando acessar cota de outra prefeitura
    if (!currentUser.prefeituraId) {
      throw new ForbiddenException('Administrador sem prefeitura vinculada');
    }

    if (currentUser.prefeituraId !== prefeituraId) {
      throw new ForbiddenException('Você não tem permissão para gerenciar esta cota de órgão');
    }
  }
}


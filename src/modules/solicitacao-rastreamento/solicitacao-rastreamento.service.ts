import { BadRequestException, Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { CreateSolicitacaoRastreamentoDto } from './dto/create-solicitacao-rastreamento.dto';
import { UpdateStatusSolicitacaoRastreamentoDto } from './dto/update-status-solicitacao-rastreamento.dto';
import { FindSolicitacaoRastreamentoDto } from './dto/find-solicitacao-rastreamento.dto';
import { StatusSolicitacaoRastreamento } from '@prisma/client';

@Injectable()
export class SolicitacaoRastreamentoService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateSolicitacaoRastreamentoDto, userId: number) {
    try {
      // Verificar se o veículo existe
      const veiculo = await this.prisma.veiculo.findUnique({
        where: { id: dto.veiculoId },
        include: { prefeitura: true },
      });

      if (!veiculo) {
        throw new NotFoundException('Veículo não encontrado');
      }

      // Verificar se o usuário pertence à mesma prefeitura do veículo
      const usuario = await this.prisma.usuario.findUnique({
        where: { id: userId },
      });

      if (!usuario || usuario.prefeituraId !== veiculo.prefeituraId) {
        throw new BadRequestException('Usuário não tem permissão para solicitar rastreamento para este veículo');
      }

      // Verificar se já existe uma solicitação pendente para este veículo
      const solicitacaoExistente = await this.prisma.solicitacaoRastreamento.findFirst({
        where: {
          veiculoId: dto.veiculoId,
          status: StatusSolicitacaoRastreamento.PENDENTE,
        },
      });

      if (solicitacaoExistente) {
        throw new BadRequestException('Já existe uma solicitação pendente para este veículo');
      }

      // Criar a solicitação
      const solicitacao = await this.prisma.solicitacaoRastreamento.create({
        data: {
          veiculoId: dto.veiculoId,
          prefeituraId: veiculo.prefeituraId,
          solicitadoPor: userId,
          motivo: dto.motivo,
          observacoes: dto.observacoes,
          status: StatusSolicitacaoRastreamento.PENDENTE,
        },
        include: {
          veiculo: {
            select: {
              id: true,
              placa: true,
              nome: true,
              modelo: true,
            },
          },
          prefeitura: {
            select: {
              id: true,
              nome: true,
            },
          },
          solicitadoPorUsuario: {
            select: {
              id: true,
              nome: true,
              email: true,
            },
          },
        },
      });

      return solicitacao;
    } catch (error: any) {
      // Se já for uma exceção do NestJS, re-lançar
      if (error instanceof NotFoundException || error instanceof BadRequestException) {
        throw error;
      }
      
      console.error('[SolicitacaoRastreamentoService.create] Erro:', error);
      const errorMessage = error?.message || '';
      if (errorMessage.includes('solicitacaoRastreamento') || errorMessage.includes('does not exist')) {
        throw new InternalServerErrorException(
          'Erro ao acessar banco de dados. O Prisma Client precisa ser regenerado. Execute: npm run prisma:generate'
        );
      }
      throw new InternalServerErrorException(`Erro ao criar solicitação: ${errorMessage || 'Erro desconhecido'}`);
    }
  }

  async findAll(dto: FindSolicitacaoRastreamentoDto, userId?: number, isSuperAdmin: boolean = false) {
    try {
      const page = dto.page || 1;
      const perPage = dto.perPage || 20;
      const skip = (page - 1) * perPage;

      // Se não for superadmin, filtrar pela prefeitura do usuário
      let prefeituraIdFilter = dto.prefeituraId;
      if (!isSuperAdmin && userId) {
        const usuario = await this.prisma.usuario.findUnique({
          where: { id: userId },
          select: { prefeituraId: true },
        });
        if (usuario?.prefeituraId) {
          prefeituraIdFilter = usuario.prefeituraId;
        }
      }

      const where: any = {};
      if (prefeituraIdFilter) {
        where.prefeituraId = prefeituraIdFilter;
      }
      if (dto.veiculoId) {
        where.veiculoId = dto.veiculoId;
      }
      if (dto.status) {
        where.status = dto.status;
      }

      const [solicitacoes, total] = await Promise.all([
        this.prisma.solicitacaoRastreamento.findMany({
          where,
          skip,
          take: perPage,
          orderBy: { dataSolicitacao: 'desc' },
          include: {
            veiculo: {
              select: {
                id: true,
                placa: true,
                nome: true,
                modelo: true,
              },
            },
            prefeitura: {
              select: {
                id: true,
                nome: true,
              },
            },
            solicitadoPorUsuario: {
              select: {
                id: true,
                nome: true,
                email: true,
              },
            },
            aprovadoPorUsuario: {
              select: {
                id: true,
                nome: true,
                email: true,
              },
            },
          },
        }),
        this.prisma.solicitacaoRastreamento.count({ where }),
      ]);

      return {
        data: solicitacoes,
        meta: {
          total,
          page,
          perPage,
          totalPages: Math.ceil(total / perPage),
        },
      };
    } catch (error: any) {
      console.error('[SolicitacaoRastreamentoService.findAll] Erro completo:', {
        message: error?.message,
        code: error?.code,
        name: error?.name,
        stack: error?.stack,
      });
      
      // Verificar se o erro é relacionado ao Prisma Client não ter o modelo
      const errorMessage = error?.message || '';
      const errorString = JSON.stringify(error || {});
      
      if (
        errorMessage.includes('solicitacaoRastreamento') ||
        errorMessage.includes('does not exist') ||
        errorMessage.includes('Property') ||
        error?.code === 'P2001' ||
        errorString.includes('solicitacaoRastreamento')
      ) {
        throw new InternalServerErrorException(
          'Erro ao acessar banco de dados. O Prisma Client precisa ser regenerado. Execute: npm run prisma:generate'
        );
      }
      
      throw new InternalServerErrorException(
        `Erro ao listar solicitações: ${errorMessage || 'Erro desconhecido'}`
      );
    }
  }

  async findOne(id: number, userId?: number, isSuperAdmin: boolean = false) {
    try {
      const solicitacao = await this.prisma.solicitacaoRastreamento.findUnique({
        where: { id },
        include: {
          veiculo: {
            select: {
              id: true,
              placa: true,
              nome: true,
              modelo: true,
            },
          },
          prefeitura: {
            select: {
              id: true,
              nome: true,
            },
          },
          solicitadoPorUsuario: {
            select: {
              id: true,
              nome: true,
              email: true,
            },
          },
          aprovadoPorUsuario: {
            select: {
              id: true,
              nome: true,
              email: true,
            },
          },
        },
      });

      if (!solicitacao) {
        throw new NotFoundException('Solicitação não encontrada');
      }

      // Verificar permissão (superadmin ou mesma prefeitura)
      if (!isSuperAdmin && userId) {
        const usuario = await this.prisma.usuario.findUnique({
          where: { id: userId },
          select: { prefeituraId: true },
        });
        if (usuario?.prefeituraId !== solicitacao.prefeituraId) {
          throw new BadRequestException('Usuário não tem permissão para visualizar esta solicitação');
        }
      }

      return solicitacao;
    } catch (error: any) {
      if (error instanceof NotFoundException || error instanceof BadRequestException) {
        throw error;
      }
      console.error('[SolicitacaoRastreamentoService.findOne] Erro:', error);
      const errorMessage = error?.message || '';
      if (errorMessage.includes('solicitacaoRastreamento') || errorMessage.includes('does not exist')) {
        throw new InternalServerErrorException(
          'Erro ao acessar banco de dados. O Prisma Client precisa ser regenerado. Execute: npm run prisma:generate'
        );
      }
      throw new InternalServerErrorException(`Erro ao buscar solicitação: ${errorMessage || 'Erro desconhecido'}`);
    }
  }

  async updateStatus(
    id: number,
    dto: UpdateStatusSolicitacaoRastreamentoDto,
    userId: number,
    isSuperAdmin: boolean = false,
  ) {
    try {
      // Apenas superadmin pode aprovar/rejeitar
      if (!isSuperAdmin) {
        throw new BadRequestException('Apenas superadmin pode aprovar ou rejeitar solicitações');
      }

      const solicitacao = await this.prisma.solicitacaoRastreamento.findUnique({
        where: { id },
      });

      if (!solicitacao) {
        throw new NotFoundException('Solicitação não encontrada');
      }

      if (solicitacao.status !== StatusSolicitacaoRastreamento.PENDENTE) {
        throw new BadRequestException('Apenas solicitações pendentes podem ser aprovadas ou rejeitadas');
      }

      const updated = await this.prisma.solicitacaoRastreamento.update({
        where: { id },
        data: {
          status: dto.status,
          aprovadoPor: userId,
          dataAprovacao: new Date(),
          observacoes: dto.observacoes || solicitacao.observacoes,
        },
        include: {
          veiculo: {
            select: {
              id: true,
              placa: true,
              nome: true,
              modelo: true,
            },
          },
          prefeitura: {
            select: {
              id: true,
              nome: true,
            },
          },
          solicitadoPorUsuario: {
            select: {
              id: true,
              nome: true,
              email: true,
            },
          },
          aprovadoPorUsuario: {
            select: {
              id: true,
              nome: true,
              email: true,
            },
          },
        },
      });

      return updated;
    } catch (error: any) {
      if (error instanceof NotFoundException || error instanceof BadRequestException) {
        throw error;
      }
      console.error('[SolicitacaoRastreamentoService.updateStatus] Erro:', error);
      const errorMessage = error?.message || '';
      if (errorMessage.includes('solicitacaoRastreamento') || errorMessage.includes('does not exist')) {
        throw new InternalServerErrorException(
          'Erro ao acessar banco de dados. O Prisma Client precisa ser regenerado. Execute: npm run prisma:generate'
        );
      }
      throw new InternalServerErrorException(`Erro ao atualizar status: ${errorMessage || 'Erro desconhecido'}`);
    }
  }
}

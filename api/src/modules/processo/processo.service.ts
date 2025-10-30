import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { TipoContrato, TipoDocumento, TipoItens, StatusProcesso } from '@prisma/client';
import { CreateProcessoDto } from './dto/create-processo.dto';
import { UpdateProcessoDto } from './dto/update-processo.dto';

@Injectable()
export class ProcessoService {
  constructor(private prisma: PrismaService) {}

  async create(data: CreateProcessoDto) {
    // Validar se tipo_contrato é obrigatório
    if (!data.tipo_contrato) {
      throw new BadRequestException('Tipo de contrato é obrigatório');
    }

    // Validações específicas para tipo OBJETIVO
    if (data.tipo_contrato === TipoContrato.OBJETIVO) {
      const camposObrigatorios = [];
      
      if (!data.prefeituraId) camposObrigatorios.push('prefeituraId');
      if (!data.numero_processo) camposObrigatorios.push('numero_processo');
      if (!data.numero_documento) camposObrigatorios.push('numero_documento');
      if (!data.data_abertura) camposObrigatorios.push('data_abertura');
      if (!data.status) camposObrigatorios.push('status');
      if (!data.objeto) camposObrigatorios.push('objeto');

      if (camposObrigatorios.length > 0) {
        throw new BadRequestException(
          `Para processos do tipo OBJETIVO, os seguintes campos são obrigatórios: ${camposObrigatorios.join(', ')}`
        );
      }

      // Verificar se a prefeitura existe
      const prefeituraExists = await this.prisma.prefeitura.findUnique({
        where: { id: data.prefeituraId },
      });

      if (!prefeituraExists) {
        throw new NotFoundException('Prefeitura não encontrada');
      }

    // Verificar se já existe um processo para esta prefeitura
      const existingProcesso = await this.prisma.processo.findFirst({
        where: { prefeituraId: data.prefeituraId },
      });

      if (existingProcesso) {
        throw new ConflictException('Esta prefeitura já possui um processo cadastrado. Uma prefeitura só pode ter um processo ativo.');
      }
    }

    // Validar se data de encerramento é posterior à data de abertura
    if (data.data_abertura && data.data_encerramento) {
      if (new Date(data.data_abertura) >= new Date(data.data_encerramento)) {
        throw new BadRequestException('Data de encerramento deve ser posterior à data de abertura');
      }
    }

    const processo = await this.prisma.processo.create({
      data: {
        ...data,
        // Converter strings de data para objetos Date se necessário
        data_abertura: data.data_abertura ? new Date(data.data_abertura) : undefined,
        data_encerramento: data.data_encerramento ? new Date(data.data_encerramento) : undefined,
        // Definir valores padrão se não fornecidos
        tipo_itens: data.tipo_itens || TipoItens.QUANTIDADE_LITROS,
        status: data.status || StatusProcesso.ATIVO,
        ativo: data.ativo !== undefined ? data.ativo : true,
      },
      include: {
        prefeitura: {
          select: { id: true, nome: true, cnpj: true },
        },
      },
    });

    return {
      message: 'Processo criado com sucesso',
      processo,
    };
  }

  async findAll(page = 1, limit = 10, prefeituraId?: number, status?: StatusProcesso, ativo?: boolean) {
    const skip = (page - 1) * limit;
    const where: any = {};
    if (prefeituraId) where.prefeituraId = prefeituraId;
    if (status) where.status = status;
    if (ativo !== undefined) where.ativo = ativo;

    const [processos, total] = await Promise.all([
      this.prisma.processo.findMany({
        where,
        skip,
        take: limit,
        include: {
          prefeitura: {
            select: { id: true, nome: true, cnpj: true },
          },
        },
        orderBy: { data_abertura: 'desc' },
      }),
      this.prisma.processo.count({ where }),
    ]);

    return {
      message: 'Processos encontrados com sucesso',
      processos,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  async findOne(id: number) {
    const processo = await this.prisma.processo.findUnique({
      where: { id },
      include: {
        prefeitura: {
          select: { id: true, nome: true, cnpj: true },
        },
        combustiveis: {
          include: {
            combustivel: {
              select: { id: true, nome: true, sigla: true },
            },
          },
        },
        _count: {
          select: {
            cotasOrgao: true,
            prefeiturasConsorcio: true,
          },
        },
      },
    });

    if (!processo) {
      throw new NotFoundException('Processo não encontrado');
    }

    return {
      message: 'Processo encontrado com sucesso',
      processo,
    };
  }

  async update(id: number, data: UpdateProcessoDto) {
    const existingProcesso = await this.prisma.processo.findUnique({
      where: { id },
    });

    if (!existingProcesso) {
      throw new NotFoundException('Processo não encontrado');
    }

    const processo = await this.prisma.processo.update({
      where: { id },
      data,
      include: {
        prefeitura: {
          select: { id: true, nome: true, cnpj: true },
        },
      },
    });

    return {
      message: 'Processo atualizado com sucesso',
      processo,
    };
  }

  async remove(id: number) {
    const existingProcesso = await this.prisma.processo.findUnique({
      where: { id },
    });

    if (!existingProcesso) {
      throw new NotFoundException('Processo não encontrado');
    }

    await this.prisma.processo.delete({
      where: { id },
    });

    return {
      message: 'Processo excluído com sucesso',
    };
  }
}

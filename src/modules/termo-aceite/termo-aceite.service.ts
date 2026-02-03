import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';

@Injectable()
export class TermoAceiteService {
  constructor(private prisma: PrismaService) {}

  private readonly TERMO_VERSAO = '1.0';

  /**
   * Verifica se o usuário já aceitou o termo atual
   */
  async verificarAceite(usuarioId: number, versao: string = this.TERMO_VERSAO) {
    const termoAceite = await this.prisma.termoAceite.findUnique({
      where: {
        usuarioId_versao: {
          usuarioId,
          versao,
        },
      },
    });

    return {
      aceito: termoAceite?.aceito ?? false,
      versao,
      data_aceite: termoAceite?.data_aceite ?? null,
      termoAceite: termoAceite
        ? {
            id: termoAceite.id,
            usuarioId: termoAceite.usuarioId,
            versao: termoAceite.versao,
            aceito: termoAceite.aceito,
            data_aceite: termoAceite.data_aceite,
            plataforma: termoAceite.plataforma,
            created_date: termoAceite.created_date,
            modified_date: termoAceite.modified_date,
          }
        : null,
    };
  }

  /**
   * Salva ou atualiza o aceite do termo pelo usuário
   */
  async salvarAceite(
    usuarioId: number,
    createTermoAceiteDto: {
      versao?: string;
      aceito: boolean;
      ip_address?: string;
      user_agent?: string;
      plataforma?: string;
    },
  ) {
    const versao = createTermoAceiteDto.versao || this.TERMO_VERSAO;

    // Verificar se o usuário existe
    const usuario = await this.prisma.usuario.findUnique({
      where: { id: usuarioId },
    });

    if (!usuario) {
      throw new NotFoundException('Usuário não encontrado');
    }

    // Upsert: criar ou atualizar o registro
    const termoAceite = await this.prisma.termoAceite.upsert({
      where: {
        usuarioId_versao: {
          usuarioId,
          versao,
        },
      },
      update: {
        aceito: createTermoAceiteDto.aceito,
        data_aceite: createTermoAceiteDto.aceito ? new Date() : null,
        ip_address: createTermoAceiteDto.ip_address,
        user_agent: createTermoAceiteDto.user_agent,
        plataforma: createTermoAceiteDto.plataforma,
      },
      create: {
        usuarioId,
        versao,
        aceito: createTermoAceiteDto.aceito,
        data_aceite: createTermoAceiteDto.aceito ? new Date() : null,
        ip_address: createTermoAceiteDto.ip_address,
        user_agent: createTermoAceiteDto.user_agent,
        plataforma: createTermoAceiteDto.plataforma,
      },
    });

    return {
      id: termoAceite.id,
      usuarioId: termoAceite.usuarioId,
      versao: termoAceite.versao,
      aceito: termoAceite.aceito,
      data_aceite: termoAceite.data_aceite,
      plataforma: termoAceite.plataforma,
      created_date: termoAceite.created_date,
      modified_date: termoAceite.modified_date,
    };
  }

  /**
   * Obtém o histórico de aceites do usuário
   */
  async obterHistorico(usuarioId: number) {
    const termosAceite = await this.prisma.termoAceite.findMany({
      where: { usuarioId },
      orderBy: { created_date: 'desc' },
    });

    return termosAceite.map((termo) => ({
      id: termo.id,
      usuarioId: termo.usuarioId,
      versao: termo.versao,
      aceito: termo.aceito,
      data_aceite: termo.data_aceite,
      plataforma: termo.plataforma,
      created_date: termo.created_date,
      modified_date: termo.modified_date,
    }));
  }
}

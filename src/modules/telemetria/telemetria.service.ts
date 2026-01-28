import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { CreateTelemetriaPrefeituraDto } from './dto/create-telemetria-prefeitura.dto';

@Injectable()
export class TelemetriaService {
  constructor(private prisma: PrismaService) {}

  /**
   * Salva ou atualiza a configuração de telemetria de uma prefeitura
   */
  async savePrefeituraConfig(
    prefeituraId: number,
    createDto: CreateTelemetriaPrefeituraDto,
  ) {
    // Verificar se a prefeitura existe
    const prefeitura = await this.prisma.prefeitura.findUnique({
      where: { id: prefeituraId },
    });

    if (!prefeitura) {
      throw new NotFoundException('Prefeitura não encontrada');
    }

    // Validar dados
    if (!createDto.organizacaoId || !createDto.apiKey) {
      throw new BadRequestException('organizacaoId e apiKey são obrigatórios');
    }

    // Atualizar prefeitura com dados de telemetria
    const updatedPrefeitura = await this.prisma.prefeitura.update({
      where: { id: prefeituraId },
      data: {
        telemetria_organizacao_id: createDto.organizacaoId,
        telemetria_api_key: createDto.apiKey,
        telemetria_api_key_id: createDto.apiKeyId || null,
      },
      select: {
        id: true,
        nome: true,
        telemetria_organizacao_id: true,
        telemetria_api_key: true,
        telemetria_api_key_id: true,
      },
    });

    return {
      message: 'Configuração de telemetria salva com sucesso',
      organizacaoId: updatedPrefeitura.telemetria_organizacao_id,
      apiKey: updatedPrefeitura.telemetria_api_key,
      apiKeyId: updatedPrefeitura.telemetria_api_key_id,
    };
  }

  /**
   * Busca a configuração de telemetria de uma prefeitura
   */
  async getPrefeituraConfig(prefeituraId: number) {
    const prefeitura = await this.prisma.prefeitura.findUnique({
      where: { id: prefeituraId },
      select: {
        id: true,
        nome: true,
        telemetria_organizacao_id: true,
        telemetria_api_key: true,
        telemetria_api_key_id: true,
      },
    });

    if (!prefeitura) {
      throw new NotFoundException('Prefeitura não encontrada');
    }

    // Se não tiver configuração, retornar null
    if (!prefeitura.telemetria_organizacao_id || !prefeitura.telemetria_api_key) {
      return null;
    }

    return {
      organizacaoId: prefeitura.telemetria_organizacao_id,
      apiKey: prefeitura.telemetria_api_key,
      apiKeyId: prefeitura.telemetria_api_key_id,
    };
  }
}

import {
  Controller,
  Get,
  Post,
  Body,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { TermoAceiteService } from './termo-aceite.service';
import { CreateTermoAceiteDto } from './dto/create-termo-aceite.dto';
import { VerificarAceiteResponseDto, TermoAceiteResponseDto } from './dto/termo-aceite-response.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('Termo de Aceite')
@Controller('termo-aceite')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class TermoAceiteController {
  constructor(private readonly termoAceiteService: TermoAceiteService) {}

  @Get('verificar')
  @ApiOperation({ summary: 'Verificar se o usuário já aceitou o termo' })
  @ApiResponse({
    status: 200,
    description: 'Status do aceite retornado com sucesso',
    type: VerificarAceiteResponseDto,
  })
  async verificarAceite(@Request() req): Promise<VerificarAceiteResponseDto> {
    const usuarioId = req.user.id;
    return this.termoAceiteService.verificarAceite(usuarioId);
  }

  @Post('aceitar')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Salvar o aceite do termo pelo usuário' })
  @ApiResponse({
    status: 200,
    description: 'Aceite salvo com sucesso',
    type: TermoAceiteResponseDto,
  })
  async aceitarTermo(
    @Request() req,
    @Body() createTermoAceiteDto: CreateTermoAceiteDto,
  ): Promise<TermoAceiteResponseDto> {
    const usuarioId = req.user.id;
    
    // Capturar IP e User Agent da requisição
    const ip_address = req.ip || req.headers['x-forwarded-for'] || req.connection.remoteAddress;
    const user_agent = req.headers['user-agent'];

    return this.termoAceiteService.salvarAceite(usuarioId, {
      ...createTermoAceiteDto,
      ip_address: Array.isArray(ip_address) ? ip_address[0] : ip_address,
      user_agent,
    });
  }

  @Get('historico')
  @ApiOperation({ summary: 'Obter histórico de aceites do usuário' })
  @ApiResponse({
    status: 200,
    description: 'Histórico retornado com sucesso',
    type: [TermoAceiteResponseDto],
  })
  async obterHistorico(@Request() req): Promise<TermoAceiteResponseDto[]> {
    const usuarioId = req.user.id;
    return this.termoAceiteService.obterHistorico(usuarioId);
  }
}

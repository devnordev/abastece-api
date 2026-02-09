import { PartialType } from '@nestjs/swagger';
import { CreateConfiguracaoAlertaDto } from './create-configuracao-alerta.dto';

export class UpdateConfiguracaoAlertaDto extends PartialType(CreateConfiguracaoAlertaDto) {}


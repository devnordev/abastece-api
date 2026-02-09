import { PartialType } from '@nestjs/swagger';
import { CreateRegraAlertaDto } from './create-regra-alerta.dto';

export class UpdateRegraAlertaDto extends PartialType(CreateRegraAlertaDto) {}


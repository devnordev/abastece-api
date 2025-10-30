import { PartialType } from '@nestjs/swagger';
import { CreateMotoristaDto } from './create-motorista.dto';

export class UpdateMotoristaDto extends PartialType(CreateMotoristaDto) {}

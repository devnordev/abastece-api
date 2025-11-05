import { PartialType } from '@nestjs/swagger';
import { CreateParametrosTetoDto } from './create-parametros-teto.dto';

export class UpdateParametrosTetoDto extends PartialType(CreateParametrosTetoDto) {}


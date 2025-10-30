import { PartialType } from '@nestjs/swagger';
import { CreatePrefeituraDto } from './create-prefeitura.dto';

export class UpdatePrefeituraDto extends PartialType(CreatePrefeituraDto) {}

import { PartialType } from '@nestjs/swagger';
import { CreateProcessoCombustivelDto } from './create-processo-combustivel.dto';

export class UpdateProcessoCombustivelDto extends PartialType(CreateProcessoCombustivelDto) {}


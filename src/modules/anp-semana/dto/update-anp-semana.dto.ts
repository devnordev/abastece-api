import { PartialType } from '@nestjs/swagger';
import { CreateAnpSemanaDto } from './create-anp-semana.dto';

export class UpdateAnpSemanaDto extends PartialType(CreateAnpSemanaDto) {}


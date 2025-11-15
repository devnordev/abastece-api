import { Type } from 'class-transformer';
import { IsInt, IsOptional, Min } from 'class-validator';

export class AdminEmpresaDashboardQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  abastecimentosLimit?: number;
}


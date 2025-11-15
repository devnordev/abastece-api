import { ArgumentMetadata, Injectable, PipeTransform } from '@nestjs/common';
import { CreateProcessoDto } from '../dto/create-processo.dto';
import { UpdateProcessoDto } from '../dto/update-processo.dto';

type ProcessoDTO = CreateProcessoDto | UpdateProcessoDto;

@Injectable()
export class TransformProcessoCombustiveisPipe implements PipeTransform {
  transform(value: any, metadata: ArgumentMetadata) {
    if (
      !value ||
      typeof value !== 'object' ||
      !Array.isArray(value.combustiveis) ||
      value.combustiveis.length === 0
    ) {
      return value as ProcessoDTO;
    }

    value.combustiveis = value.combustiveis.map((combustivel: any) => {
      if (combustivel && typeof combustivel === 'object') {
        const quantidade =
          combustivel.quantidade_litros ??
          combustivel.quantidadeLitros ??
          combustivel.quantidade ??
          null;

        if (quantidade !== null && quantidade !== undefined && quantidade !== '') {
          const parsed =
            typeof quantidade === 'string'
              ? parseFloat(quantidade.replace(',', '.'))
              : quantidade;

          combustivel.quantidade_litros = parsed;
        }
      }

      return combustivel;
    });

    return value as ProcessoDTO;
  }
}


import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { CreatePrefeituraDto } from './dto/create-prefeitura.dto';
import { UpdatePrefeituraDto } from './dto/update-prefeitura.dto';
import { FindPrefeituraDto } from './dto/find-prefeitura.dto';
import { UploadService } from '../upload/upload.service';

@Injectable()
export class PrefeituraService {
  constructor(
    private prisma: PrismaService,
    private uploadService: UploadService,
  ) {}

  async create(createPrefeituraDto: CreatePrefeituraDto, file?: Express.Multer.File) {
    const { cnpj, email_administrativo, imagem_perfil, ...restDto } = createPrefeituraDto;

    // Verificar se prefeitura já existe
    const existingPrefeitura = await this.prisma.prefeitura.findFirst({
      where: {
        OR: [
          { cnpj },
          { email_administrativo },
        ],
      },
    });

    if (existingPrefeitura) {
      throw new ConflictException('Prefeitura já existe com este CNPJ ou email');
    }

    // Fazer upload da imagem se arquivo foi enviado
    let imagemUrl = imagem_perfil;
    if (file) {
      try {
        const prefeituraIdTmp = Date.now(); // ID temporário para nome do arquivo
        imagemUrl = await this.uploadService.uploadImage(file, 'prefeituras', `prefeitura-${prefeituraIdTmp}`);
      } catch (error) {
        // Se falhar o upload, continua sem imagem (ou lança erro se preferir)
        console.warn('Erro ao fazer upload da imagem:', error.message);
        // throw new BadRequestException(`Erro ao fazer upload da imagem: ${error.message}`);
      }
    }

    // Criar prefeitura
    const prefeitura = await this.prisma.prefeitura.create({
      data: {
        ...restDto,
        cnpj,
        email_administrativo,
        imagem_perfil: imagemUrl,
        data_cadastro: new Date(),
      },
    });

    return {
      message: 'Prefeitura criada com sucesso',
      prefeitura,
    };
  }

  async findAll(findPrefeituraDto: FindPrefeituraDto) {
    const {
      nome,
      cnpj,
      email_administrativo,
      ativo,
      page = 1,
      limit = 10,
    } = findPrefeituraDto;

    const skip = (page - 1) * limit;

    // Construir filtros
    const where: any = {};

    if (nome) {
      where.nome = {
        contains: nome,
        mode: 'insensitive',
      };
    }

    if (cnpj) {
      where.cnpj = {
        contains: cnpj,
      };
    }

    if (email_administrativo) {
      where.email_administrativo = {
        contains: email_administrativo,
        mode: 'insensitive',
      };
    }

    if (ativo !== undefined) {
      where.ativo = ativo;
    }

    // Buscar prefeituras
    const [prefeituras, total] = await Promise.all([
      this.prisma.prefeitura.findMany({
        where,
        skip,
        take: limit,
        orderBy: {
          data_cadastro: 'desc',
        },
      }),
      this.prisma.prefeitura.count({ where }),
    ]);

    return {
      message: 'Prefeituras encontradas com sucesso',
      prefeituras,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: number) {
    const prefeitura = await this.prisma.prefeitura.findUnique({
      where: { id },
      include: {
        usuarios: {
          select: {
            id: true,
            nome: true,
            email: true,
            tipo_usuario: true,
            ativo: true,
          },
        },
        orgaos: {
          select: {
            id: true,
            nome: true,
            sigla: true,
            ativo: true,
          },
        },
        _count: {
          select: {
            usuarios: true,
            orgaos: true,
            veiculos: true,
            motoristas: true,
          },
        },
      },
    });

    if (!prefeitura) {
      throw new NotFoundException('Prefeitura não encontrada');
    }

    return {
      message: 'Prefeitura encontrada com sucesso',
      prefeitura,
    };
  }

  async update(id: number, updatePrefeituraDto: UpdatePrefeituraDto, file?: Express.Multer.File) {
    // Verificar se prefeitura existe
    const existingPrefeitura = await this.prisma.prefeitura.findUnique({
      where: { id },
    });

    if (!existingPrefeitura) {
      throw new NotFoundException('Prefeitura não encontrada');
    }

    // Se estiver atualizando CNPJ ou email, verificar se já existe
    if (updatePrefeituraDto.cnpj || updatePrefeituraDto.email_administrativo) {
      const whereCondition: any = {
        id: { not: id },
      };

      if (updatePrefeituraDto.cnpj || updatePrefeituraDto.email_administrativo) {
        whereCondition.OR = [];
        if (updatePrefeituraDto.cnpj) {
          whereCondition.OR.push({ cnpj: updatePrefeituraDto.cnpj });
        }
        if (updatePrefeituraDto.email_administrativo) {
          whereCondition.OR.push({ email_administrativo: updatePrefeituraDto.email_administrativo });
        }
      }

      const conflictingPrefeitura = await this.prisma.prefeitura.findFirst({
        where: whereCondition,
      });

      if (conflictingPrefeitura) {
        throw new ConflictException('CNPJ ou email já está em uso por outra prefeitura');
      }
    }

    // Se arquivo foi enviado, fazer upload
    let imagemUrl = updatePrefeituraDto.imagem_perfil;
    if (file) {
      try {
        // Remover imagem antiga se existir
        if (existingPrefeitura.imagem_perfil) {
          try {
            const oldFilePath = this.uploadService.extractFilePathFromUrl(existingPrefeitura.imagem_perfil);
            if (oldFilePath) {
              await this.uploadService.deleteImage(oldFilePath);
            }
          } catch (error) {
            console.warn('Erro ao remover imagem antiga:', error.message);
          }
        }

        // Fazer upload da nova imagem
        imagemUrl = await this.uploadService.uploadImage(file, 'prefeituras', `prefeitura-${id}`);
      } catch (error) {
        console.warn('Erro ao fazer upload da imagem:', error.message);
        // Se falhar, mantém a URL anterior ou lança erro
        if (!existingPrefeitura.imagem_perfil) {
          throw new BadRequestException(`Erro ao fazer upload da imagem: ${error.message}`);
        }
      }
    }

    // Preparar dados para atualização
    const { imagem_perfil, ...restDto } = updatePrefeituraDto;
    const updateData: any = {
      ...restDto,
    };

    // Só atualiza imagem_perfil se tiver nova URL ou se foi explicitamente enviado como null
    if (imagemUrl !== undefined) {
      updateData.imagem_perfil = imagemUrl;
    }

    // Atualizar prefeitura
    const prefeitura = await this.prisma.prefeitura.update({
      where: { id },
      data: updateData,
    });

    return {
      message: 'Prefeitura atualizada com sucesso',
      prefeitura,
    };
  }

  async remove(id: number) {
    // Verificar se prefeitura existe
    const existingPrefeitura = await this.prisma.prefeitura.findUnique({
      where: { id },
    });

    if (!existingPrefeitura) {
      throw new NotFoundException('Prefeitura não encontrada');
    }

    // Verificar se prefeitura tem relacionamentos que impedem a exclusão
    const hasRelations = await this.prisma.usuario.findFirst({
      where: { prefeituraId: id },
    });

    if (hasRelations) {
      throw new BadRequestException('Não é possível excluir prefeitura com usuários associados');
    }

    // Excluir prefeitura
    await this.prisma.prefeitura.delete({
      where: { id },
    });

    return {
      message: 'Prefeitura excluída com sucesso',
    };
  }

  async findByCnpj(cnpj: string) {
    return this.prisma.prefeitura.findUnique({
      where: { cnpj },
    });
  }

  async findByEmail(email: string) {
    return this.prisma.prefeitura.findUnique({
      where: { email_administrativo: email },
    });
  }
}

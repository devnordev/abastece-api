import { Injectable, NotFoundException, ConflictException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { CreateMotoristaDto } from './dto/create-motorista.dto';
import { UpdateMotoristaDto } from './dto/update-motorista.dto';
import { FindMotoristaDto } from './dto/find-motorista.dto';
import { CreateSolicitacaoQrCodeMotoristaDto } from './dto/create-solicitacao-qrcode.dto';
import { UploadService } from '../upload/upload.service';
import { StatusQrCodeMotorista } from '@prisma/client';

@Injectable()
export class MotoristaService {
  constructor(
    private prisma: PrismaService,
    private uploadService: UploadService,
  ) {}

  async create(createMotoristaDto: CreateMotoristaDto, currentUserId?: number, file?: Express.Multer.File) {
    // Validação de autorização
    if (currentUserId) {
      await this.validateCreateMotoristaPermission(currentUserId, createMotoristaDto.prefeituraId);
    }
    const { cpf, email, prefeituraId, imagem_perfil, ...restDto } = createMotoristaDto;

    // Validar campos obrigatórios
    if (!cpf) {
      throw new BadRequestException('CPF é obrigatório para o cadastro de motorista');
    }

    // Verificar se motorista já existe (por CPF)
    const existingMotorista = await this.prisma.motorista.findFirst({
      where: { cpf },
    });

    if (existingMotorista) {
      throw new ConflictException('Motorista já existe com este CPF');
    }

    // Verificar se email já existe (apenas se email foi fornecido)
    if (email) {
      const existingMotoristaByEmail = await this.prisma.motorista.findFirst({
        where: { email },
      });

      if (existingMotoristaByEmail) {
        throw new ConflictException('Motorista já existe com este email');
      }
    }

    // Verificar se prefeitura existe
    const prefeitura = await this.prisma.prefeitura.findUnique({
      where: { id: prefeituraId },
    });

    if (!prefeitura) {
      throw new NotFoundException('Prefeitura não encontrada');
    }

    // Fazer upload da imagem se arquivo foi enviado
    let imagemUrl = imagem_perfil;
    if (file) {
      try {
        const motoristaIdTmp = Date.now(); // ID temporário para nome do arquivo
        imagemUrl = await this.uploadService.uploadImage(file, 'motoristas', `motorista-${motoristaIdTmp}`);
      } catch (error) {
        // Se falhar o upload, continua sem imagem (ou lança erro se preferir)
        console.warn('Erro ao fazer upload da imagem:', error.message);
        // throw new BadRequestException(`Erro ao fazer upload da imagem: ${error.message}`);
      }
    }

    // Criar motorista com status ativo por padrão quando não especificado
    const motorista = await this.prisma.motorista.create({
      data: {
        ...restDto,
        prefeituraId,
        cpf,
        email,
        imagem_perfil: imagemUrl,
        ativo: createMotoristaDto.ativo !== undefined ? createMotoristaDto.ativo : true,
      },
      include: {
        prefeitura: {
          select: {
            id: true,
            nome: true,
            cnpj: true,
          },
        },
      },
    });

    return {
      message: 'Motorista criado com sucesso',
      motorista,
    };
  }

  async findAll(findMotoristaDto: FindMotoristaDto, currentUserId?: number) {
    let {
      nome,
      cpf,
      cnh,
      ativo,
      prefeituraId,
      page = 1,
      limit = 10,
    } = findMotoristaDto;

    const skip = (page - 1) * limit;

    // Aplicar filtros de autorização se houver usuário logado
    if (currentUserId) {
      const currentUser = await this.prisma.usuario.findUnique({
        where: { id: currentUserId },
      });

      if (currentUser) {
        // ADMIN_PREFEITURA só pode ver motoristas da sua prefeitura
        if (currentUser.tipo_usuario === 'ADMIN_PREFEITURA') {
          if (!currentUser.prefeituraId) {
            throw new ForbiddenException('Administrador sem prefeitura vinculada');
          }
          prefeituraId = currentUser.prefeituraId;
        }
      }
    }

    // Construir filtros
    const where: any = {};

    if (nome) {
      where.nome = {
        contains: nome,
        mode: 'insensitive',
      };
    }

    if (cpf) {
      where.cpf = {
        contains: cpf,
      };
    }

    if (cnh) {
      where.cnh = {
        contains: cnh,
      };
    }

    if (ativo !== undefined) {
      where.ativo = ativo;
    }

    if (prefeituraId) {
      where.prefeituraId = prefeituraId;
    }

    // Buscar motoristas
    const [motoristas, total] = await Promise.all([
      this.prisma.motorista.findMany({
        where,
        skip,
        take: limit,
        include: {
          prefeitura: {
            select: {
              id: true,
              nome: true,
              cnpj: true,
            },
          },
          solicitacoesQrCode: {
            select: {
              id: true,
              idMotorista: true,
              data_cadastro: true,
              status: true,
              data_cancelamento: true,
              motivo_cancelamento: true,
              cancelamento_solicitado_por: true,
              cancelamento_efetuado_por: true,
              prefeitura_id: true,
              foto: true,
              codigo_qrcode: true,
            } as any,
            orderBy: {
              data_cadastro: 'desc',
            },
            take: 1, // Pegar apenas a mais recente
          },
        },
        orderBy: {
          nome: 'asc',
        },
      }),
      this.prisma.motorista.count({ where }),
    ]);

    // Processar motoristas para adicionar informações sobre solicitações de QR Code
    const motoristasComSolicitacao = motoristas.map((motorista: any) => {
      const solicitacoesDoMotorista = motorista.solicitacoesQrCode || [];
      
      // Verificar se existe solicitação com status "Solicitado" (independente de outras)
      const possuiSolicitacaoSolicitada = solicitacoesDoMotorista.some(
        (s: any) => s.status === 'Solicitado'
      );
      
      // Verificar se existe solicitação com status "Aprovado" (independente de outras)
      const possuiSolicitacaoAprovada = solicitacoesDoMotorista.some(
        (s: any) => s.status === 'Aprovado'
      );
      
      // Verificar se existe solicitação com status "Inativo" (momentâneo)
      const possuiSolicitacaoInativa = solicitacoesDoMotorista.some(
        (s: any) => s.status === 'Inativo'
      );
      
      // Verificar se existe solicitação com status "Cancelado" (permanente)
      const possuiSolicitacaoCancelada = solicitacoesDoMotorista.some(
        (s: any) => s.status === 'Cancelado'
      );
      
      // Buscar solicitação com status "Solicitado" primeiro (prioridade)
      const solicitacaoSolicitada = solicitacoesDoMotorista.find(
        (s: any) => s.status === 'Solicitado'
      );
      
      // Se não houver solicitação com status "Solicitado", buscar com status "Aprovado"
      const solicitacaoAprovada = !solicitacaoSolicitada
        ? solicitacoesDoMotorista.find((s: any) => s.status === 'Aprovado')
        : null;
      
      // Buscar solicitação com status "Inativo" (se não houver Solicitado ou Aprovado)
      const solicitacaoInativa = !solicitacaoSolicitada && !solicitacaoAprovada
        ? solicitacoesDoMotorista.find((s: any) => s.status === 'Inativo')
        : null;
      
      // Buscar solicitação com status "Cancelado" (se não houver outras)
      const solicitacaoCancelada = !solicitacaoSolicitada && !solicitacaoAprovada && !solicitacaoInativa
        ? solicitacoesDoMotorista.find((s: any) => s.status === 'Cancelado')
        : null;
      
      // Usar a solicitação encontrada (prioridade: Solicitado > Aprovado > Inativo > Cancelado > Mais recente)
      const solicitacaoAtiva = solicitacaoSolicitada || solicitacaoAprovada || solicitacaoInativa || solicitacaoCancelada || solicitacoesDoMotorista[0] || null;
      
      let temSolicitacaoQRCode = false;
      let statusSolicitacaoQRCode: string | null = null;
      let mensagemSolicitacaoQRCode: string = '';
      let idSolicitacaoQRCode: number | null = null;
      let codigoQrCode: string | null = null;
      let estaInativo = false;
      let estaCancelado = false;

      if (solicitacaoAtiva) {
        temSolicitacaoQRCode = true;
        statusSolicitacaoQRCode = solicitacaoAtiva.status;
        idSolicitacaoQRCode = solicitacaoAtiva.id;
        codigoQrCode = solicitacaoAtiva.codigo_qrcode || null;
        
        // Verificar se está inativo (momentâneo)
        estaInativo = solicitacaoAtiva.status === 'Inativo';
        
        // Verificar se está cancelado (permanente)
        estaCancelado = solicitacaoAtiva.status === 'Cancelado';

        // Verificar status da solicitação e definir mensagem
        if (solicitacaoAtiva.status === 'Solicitado') {
          mensagemSolicitacaoQRCode = 'Este motorista possui uma solicitação de QR Code com status Solicitado';
        } else if (solicitacaoAtiva.status === 'Aprovado') {
          mensagemSolicitacaoQRCode = 'Este motorista possui uma solicitação de QR Code com status Aprovado';
        } else if (solicitacaoAtiva.status === 'Em_Producao') {
          mensagemSolicitacaoQRCode = 'Este motorista possui uma solicitação de QR Code em produção';
        } else if (solicitacaoAtiva.status === 'Integracao') {
          mensagemSolicitacaoQRCode = 'Este motorista possui uma solicitação de QR Code em integração';
        } else if (solicitacaoAtiva.status === 'Concluida') {
          mensagemSolicitacaoQRCode = 'Este motorista possui uma solicitação de QR Code concluída';
        } else if (solicitacaoAtiva.status === 'Inativo') {
          mensagemSolicitacaoQRCode = 'Este motorista possui uma solicitação de QR Code com status Inativo (momentâneo)';
        } else if (solicitacaoAtiva.status === 'Cancelado') {
          mensagemSolicitacaoQRCode = 'Este motorista possui uma solicitação de QR Code com status Cancelado (permanente)';
        } else {
          mensagemSolicitacaoQRCode = `Este motorista possui uma solicitação de QR Code com status ${solicitacaoAtiva.status}`;
        }
      } else {
        mensagemSolicitacaoQRCode = 'Não há solicitação de QR Code para este motorista';
      }

      // Remover solicitacoesQrCode do objeto original e adicionar a estrutura processada
      const { solicitacoesQrCode, ...motoristaSemSolicitacao } = motorista as any;

      return {
        ...motoristaSemSolicitacao,
        solicitacaoQRCode: {
          temSolicitacao: temSolicitacaoQRCode,
          possuiSolicitacaoSolicitada,
          possuiSolicitacaoAprovada,
          estaInativo,
          estaCancelado,
          status: statusSolicitacaoQRCode,
          mensagem: mensagemSolicitacaoQRCode,
          id: idSolicitacaoQRCode,
          codigo_qrcode: codigoQrCode,
        },
      };
    });

    return {
      message: 'Motoristas encontrados com sucesso',
      motoristas: motoristasComSolicitacao,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: number) {
    const motorista = await this.prisma.motorista.findUnique({
      where: { id },
      include: {
        prefeitura: {
          select: {
            id: true,
            nome: true,
            cnpj: true,
          },
        },
        veiculos: {
          include: {
            veiculo: {
              select: {
                id: true,
                nome: true,
                placa: true,
                modelo: true,
                tipo_veiculo: true,
              },
            },
          },
        },
        solicitacoesQrCode: {
          select: {
            id: true,
            idMotorista: true,
            data_cadastro: true,
            status: true,
            data_cancelamento: true,
            motivo_cancelamento: true,
            cancelamento_solicitado_por: true,
            cancelamento_efetuado_por: true,
            prefeitura_id: true,
            foto: true,
            codigo_qrcode: true,
          } as any,
          orderBy: {
            data_cadastro: 'desc',
          },
        },
        _count: {
          select: {
            abastecimentos: true,
            solicitacoes: true,
          },
        },
      },
    });

    if (!motorista) {
      throw new NotFoundException('Motorista não encontrado');
    }

    // Processar informações de QR Code similar ao findAll
    const solicitacoesDoMotorista = (motorista as any).solicitacoesQrCode || [];
    
    // Buscar solicitação com status "Solicitado" primeiro (prioridade)
    const solicitacaoSolicitada = solicitacoesDoMotorista.find(
      (s: any) => s.status === 'Solicitado'
    );
    
    // Se não houver solicitação com status "Solicitado", buscar com status "Aprovado"
    const solicitacaoAprovada = !solicitacaoSolicitada
      ? solicitacoesDoMotorista.find((s: any) => s.status === 'Aprovado')
      : null;
    
    // Buscar solicitação com status "Inativo" (se não houver Solicitado ou Aprovado)
    const solicitacaoInativa = !solicitacaoSolicitada && !solicitacaoAprovada
      ? solicitacoesDoMotorista.find((s: any) => s.status === 'Inativo')
      : null;
    
    // Buscar solicitação com status "Cancelado" (se não houver outras)
    const solicitacaoCancelada = !solicitacaoSolicitada && !solicitacaoAprovada && !solicitacaoInativa
      ? solicitacoesDoMotorista.find((s: any) => s.status === 'Cancelado')
      : null;
    
    // Usar a solicitação encontrada (prioridade: Solicitado > Aprovado > Inativo > Cancelado > Mais recente)
    const solicitacaoAtiva = solicitacaoSolicitada || solicitacaoAprovada || solicitacaoInativa || solicitacaoCancelada || solicitacoesDoMotorista[0] || null;
    
    let temSolicitacaoQRCode = false;
    let statusSolicitacaoQRCode: string | null = null;
    let mensagemSolicitacaoQRCode: string = '';
    let idSolicitacaoQRCode: number | null = null;
    let codigoQrCode: string | null = null;
    let estaInativo = false;
    let estaCancelado = false;
    let possuiSolicitacaoSolicitada = false;
    let possuiSolicitacaoAprovada = false;

    if (solicitacaoAtiva) {
      temSolicitacaoQRCode = true;
      statusSolicitacaoQRCode = solicitacaoAtiva.status;
      idSolicitacaoQRCode = solicitacaoAtiva.id;
      codigoQrCode = solicitacaoAtiva.codigo_qrcode || null;
      
      // Verificar se está inativo (momentâneo)
      estaInativo = solicitacaoAtiva.status === 'Inativo';
      
      // Verificar se está cancelado (permanente)
      estaCancelado = solicitacaoAtiva.status === 'Cancelado';

      possuiSolicitacaoSolicitada = solicitacoesDoMotorista.some((s: any) => s.status === 'Solicitado');
      possuiSolicitacaoAprovada = solicitacoesDoMotorista.some((s: any) => s.status === 'Aprovado');

      // Verificar status da solicitação e definir mensagem
      if (solicitacaoAtiva.status === 'Solicitado') {
        mensagemSolicitacaoQRCode = 'Este motorista possui uma solicitação de QR Code com status Solicitado';
      } else if (solicitacaoAtiva.status === 'Aprovado') {
        mensagemSolicitacaoQRCode = 'Este motorista possui uma solicitação de QR Code com status Aprovado';
      } else if (solicitacaoAtiva.status === 'Em_Producao') {
        mensagemSolicitacaoQRCode = 'Este motorista possui uma solicitação de QR Code em produção';
      } else if (solicitacaoAtiva.status === 'Integracao') {
        mensagemSolicitacaoQRCode = 'Este motorista possui uma solicitação de QR Code em integração';
      } else if (solicitacaoAtiva.status === 'Concluida') {
        mensagemSolicitacaoQRCode = 'Este motorista possui uma solicitação de QR Code concluída';
      } else if (solicitacaoAtiva.status === 'Inativo') {
        mensagemSolicitacaoQRCode = 'Este motorista possui uma solicitação de QR Code com status Inativo (momentâneo)';
      } else if (solicitacaoAtiva.status === 'Cancelado') {
        mensagemSolicitacaoQRCode = 'Este motorista possui uma solicitação de QR Code com status Cancelado (permanente)';
      } else {
        mensagemSolicitacaoQRCode = `Este motorista possui uma solicitação de QR Code com status ${solicitacaoAtiva.status}`;
      }
    } else {
      mensagemSolicitacaoQRCode = 'Não há solicitação de QR Code para este motorista';
    }

    // Remover solicitacoesQrCode do objeto original e adicionar a estrutura processada
    const { solicitacoesQrCode, ...motoristaSemSolicitacao } = motorista;

    return {
      message: 'Motorista encontrado com sucesso',
      motorista: {
        ...motoristaSemSolicitacao,
        solicitacaoQRCode: {
          temSolicitacao: temSolicitacaoQRCode,
          possuiSolicitacaoSolicitada,
          possuiSolicitacaoAprovada,
          estaInativo,
          estaCancelado,
          status: statusSolicitacaoQRCode,
          mensagem: mensagemSolicitacaoQRCode,
          id: idSolicitacaoQRCode,
          codigo_qrcode: codigoQrCode,
        },
      },
    };
  }

  async update(id: number, updateMotoristaDto: UpdateMotoristaDto, file?: Express.Multer.File) {
    // Verificar se motorista existe
    const existingMotorista = await this.prisma.motorista.findUnique({
      where: { id },
    });

    if (!existingMotorista) {
      throw new NotFoundException('Motorista não encontrado');
    }

    // Se estiver atualizando o CPF, verificar se já existe
    if (updateMotoristaDto.cpf) {
      const conflictingMotorista = await this.prisma.motorista.findFirst({
        where: {
          cpf: updateMotoristaDto.cpf,
          id: { not: id },
        },
      });

      if (conflictingMotorista) {
        throw new ConflictException('CPF já está em uso por outro motorista');
      }
    }

    // Se arquivo foi enviado, fazer upload
    let imagemUrl = updateMotoristaDto.imagem_perfil;
    if (file) {
      try {
        // Remover imagem antiga se existir
        if (existingMotorista.imagem_perfil) {
          try {
            const oldFilePath = this.uploadService.extractFilePathFromUrl(existingMotorista.imagem_perfil);
            if (oldFilePath) {
              await this.uploadService.deleteImage(oldFilePath);
            }
          } catch (error) {
            console.warn('Erro ao remover imagem antiga:', error.message);
          }
        }

        // Fazer upload da nova imagem
        imagemUrl = await this.uploadService.uploadImage(file, 'motoristas', `motorista-${id}`);
      } catch (error) {
        console.warn('Erro ao fazer upload da imagem:', error.message);
        // Se falhar, mantém a URL anterior ou lança erro
        if (!existingMotorista.imagem_perfil) {
          throw new BadRequestException(`Erro ao fazer upload da imagem: ${error.message}`);
        }
      }
    }

    // Preparar dados para atualização
    const { imagem_perfil, ...restDto } = updateMotoristaDto;
    const updateData: any = {
      ...restDto,
    };

    // Só atualiza imagem_perfil se tiver nova URL ou se foi explicitamente enviado como null
    if (imagemUrl !== undefined) {
      updateData.imagem_perfil = imagemUrl;
    }

    // Atualizar motorista
    const motorista = await this.prisma.motorista.update({
      where: { id },
      data: updateData,
      include: {
        prefeitura: {
          select: {
            id: true,
            nome: true,
            cnpj: true,
          },
        },
      },
    });

    return {
      message: 'Motorista atualizado com sucesso',
      motorista,
    };
  }

  async remove(id: number) {
    // Verificar se motorista existe
    const existingMotorista = await this.prisma.motorista.findUnique({
      where: { id },
    });

    if (!existingMotorista) {
      throw new NotFoundException('Motorista não encontrado');
    }

    // Verificar se motorista tem relacionamentos que impedem a exclusão
    const hasRelations = await this.prisma.abastecimento.findFirst({
      where: { motoristaId: id },
    });

    if (hasRelations) {
      throw new BadRequestException('Não é possível excluir motorista com abastecimentos associados');
    }

    // Excluir motorista
    await this.prisma.motorista.delete({
      where: { id },
    });

    return {
      message: 'Motorista excluído com sucesso',
    };
  }

  async findByCpf(cpf: string) {
    return this.prisma.motorista.findUnique({
      where: { cpf },
    });
  }

  private async validateCreateMotoristaPermission(currentUserId: number, prefeituraId: number) {
    const currentUser = await this.prisma.usuario.findUnique({
      where: { id: currentUserId },
    });

    if (!currentUser) {
      throw new ForbiddenException('Usuário atual não encontrado');
    }

    // Apenas ADMIN_PREFEITURA e SUPER_ADMIN podem cadastrar motoristas
    if (currentUser.tipo_usuario !== 'ADMIN_PREFEITURA' && currentUser.tipo_usuario !== 'SUPER_ADMIN') {
      throw new ForbiddenException('Apenas ADMIN_PREFEITURA pode cadastrar motoristas');
    }

    // Verificar se o motorista está sendo criado para a própria prefeitura
    if (currentUser.tipo_usuario === 'ADMIN_PREFEITURA' && currentUser.prefeituraId !== prefeituraId) {
      throw new ForbiddenException('Você só pode cadastrar motoristas da sua própria prefeitura');
    }
  }

  async createSolicitacoesQrCode(createSolicitacaoQrCodeDto: CreateSolicitacaoQrCodeMotoristaDto, currentUserId: number) {
    // Validar permissões do usuário
    const currentUser = await this.prisma.usuario.findUnique({
      where: { id: currentUserId },
    });

    if (!currentUser) {
      throw new ForbiddenException('Usuário atual não encontrado');
    }

    // Apenas ADMIN_PREFEITURA e COLABORADOR_PREFEITURA podem criar solicitações
    if (
      currentUser.tipo_usuario !== 'ADMIN_PREFEITURA' &&
      currentUser.tipo_usuario !== 'COLABORADOR_PREFEITURA' &&
      currentUser.tipo_usuario !== 'SUPER_ADMIN'
    ) {
      throw new ForbiddenException('Apenas ADMIN_PREFEITURA e COLABORADOR_PREFEITURA podem criar solicitações de QR Code');
    }

    // Validar que pelo menos 1 motorista foi fornecido
    if (!createSolicitacaoQrCodeDto.motoristas || createSolicitacaoQrCodeDto.motoristas.length === 0) {
      throw new BadRequestException('Deve ser fornecido pelo menos 1 motorista');
    }

    // Extrair IDs dos motoristas
    const motoristaIds = createSolicitacaoQrCodeDto.motoristas.map((m) => m.idMotorista);

    // Verificar se os motoristas existem
    const motoristas = await this.prisma.motorista.findMany({
      where: {
        id: { in: motoristaIds },
      },
      select: {
        id: true,
        nome: true,
        cpf: true,
        prefeituraId: true,
      },
    });

    // Verificar se todos os motoristas foram encontrados
    if (motoristas.length !== motoristaIds.length) {
      const encontradosIds = motoristas.map((m) => m.id);
      const naoEncontrados = motoristaIds.filter((id) => !encontradosIds.includes(id));
      throw new NotFoundException(
        `Um ou mais motoristas não foram encontrados. IDs não encontrados: ${naoEncontrados.join(', ')}`
      );
    }

    // Para ADMIN_PREFEITURA e COLABORADOR_PREFEITURA, verificar se têm prefeitura vinculada
    if (currentUser.tipo_usuario !== 'SUPER_ADMIN') {
      if (!currentUser.prefeituraId) {
        throw new ForbiddenException('Usuário sem prefeitura vinculada');
      }

      // Verificar se todos os motoristas pertencem à prefeitura do usuário
      const motoristasForaPrefeitura = motoristas.filter((m) => m.prefeituraId !== currentUser.prefeituraId);
      if (motoristasForaPrefeitura.length > 0) {
        const nomesForaPrefeitura = motoristasForaPrefeitura.map((m) => `${m.nome} (${m.cpf})`).join(', ');
        throw new ForbiddenException(
          `Os seguintes motoristas não pertencem à sua prefeitura: ${nomesForaPrefeitura}`
        );
      }
    }

    // Obter prefeituraId: do usuário para ADMIN_PREFEITURA/COLABORADOR_PREFEITURA, dos motoristas para SUPER_ADMIN
    let prefeituraId: number;
    if (currentUser.tipo_usuario === 'SUPER_ADMIN') {
      // Para SUPER_ADMIN, verificar se todos os motoristas pertencem à mesma prefeitura
      const prefeituraIds = [...new Set(motoristas.map((m) => m.prefeituraId))] as number[];
      if (prefeituraIds.length !== 1) {
        throw new BadRequestException(
          'Todos os motoristas devem pertencer à mesma prefeitura. Foram encontradas múltiplas prefeituras.'
        );
      }
      prefeituraId = prefeituraIds[0];
    } else {
      prefeituraId = currentUser.prefeituraId!;
    }

    // Verificar se já existe uma solicitação pendente para algum dos motoristas
    // Não considerar solicitações com status "Inativo" ou "Cancelado" como bloqueio
    let solicitacoesExistentes: any[] = [];
    try {
      solicitacoesExistentes = await (this.prisma as any).qrCodeMotorista.findMany({
        where: {
          idMotorista: { in: motoristaIds },
          prefeitura_id: prefeituraId,
          status: {
            in: ['Solicitado', 'Aprovado', 'Em_Producao', 'Integracao', 'Concluida'],
          },
        },
        select: {
          id: true,
          idMotorista: true,
          status: true,
          motorista: {
            select: {
              nome: true,
              cpf: true,
            },
          },
        },
      });
    } catch (error) {
      // Se o modelo não existir, continuar sem verificação (tabela ainda não foi criada)
      console.warn('Tabela qrcode_motorista não encontrada. Aplique a migration primeiro.');
      solicitacoesExistentes = [];
    }

    if (solicitacoesExistentes.length > 0) {
      const motoristasComSolicitacao = solicitacoesExistentes.map(
        (s) => `${s.motorista.nome} (${s.motorista.cpf}) - Status: ${s.status}`
      );
      throw new ConflictException(
        `Já existe uma solicitação em andamento para os seguintes motoristas: ${motoristasComSolicitacao.join(', ')}`
      );
    }

    // Criar as solicitações para cada motorista
    const solicitacoes = await Promise.all(
      motoristaIds.map((idMotorista) =>
        (this.prisma as any).qrCodeMotorista.create({
          data: {
            idMotorista,
            prefeitura_id: prefeituraId,
            status: 'Solicitado',
          },
          include: {
            motorista: {
              select: {
                id: true,
                nome: true,
                cpf: true,
              },
            },
            prefeitura: {
              select: {
                id: true,
                nome: true,
                cnpj: true,
              },
            },
          },
        })
      )
    );

    return {
      message: `${solicitacoes.length} solicitação(ões) de QR Code criada(s) com sucesso`,
      solicitacoes,
    };
  }

  /**
   * Busca motorista por código QR code
   * Aceita código QR code (string de 8 caracteres) e prefeituraId para validação
   */
  async findByQrCode(codigoQrCode: string, prefeituraId: number) {
    if (!codigoQrCode || codigoQrCode.trim() === '') {
      throw new BadRequestException({
        statusCode: 400,
        message: 'Código QR code não informado',
        error: 'O parâmetro "codigo" é obrigatório e não pode estar vazio',
        details: 'Verifique se o código QR code foi informado corretamente na URL da requisição',
      });
    }

    if (!prefeituraId || prefeituraId <= 0) {
      throw new BadRequestException({
        statusCode: 400,
        message: 'ID da prefeitura inválido ou não informado',
        error: 'O parâmetro "prefeituraId" é obrigatório e deve ser um número inteiro positivo',
        details: 'Certifique-se de informar um ID de prefeitura válido na query string da requisição',
        exemplo: '/motoristas/qrcode/ABC12345?prefeituraId=5',
      });
    }

    // Buscar solicitação de QR code do motorista pelo código
    const qrCodeMotorista = await (this.prisma as any).qrCodeMotorista.findFirst({
      where: {
        codigo_qrcode: codigoQrCode.trim(),
      },
      include: {
        motorista: {
          include: {
            prefeitura: {
              select: {
                id: true,
                nome: true,
                cnpj: true,
              },
            },
            veiculos: {
              where: {
                ativo: true,
              },
              include: {
                veiculo: {
                  select: {
                    id: true,
                    nome: true,
                    placa: true,
                    modelo: true,
                    tipo_veiculo: true,
                  },
                },
              },
            },
          },
        },
        prefeitura: {
          select: {
            id: true,
            nome: true,
            cnpj: true,
          },
        },
      },
    });

    if (!qrCodeMotorista) {
      throw new NotFoundException({
        statusCode: 404,
        message: `Nenhum motorista encontrado com o código QR code informado`,
        error: `O código QR code "${codigoQrCode.trim()}" não foi encontrado no sistema`,
        details: 'Verifique se o código QR code está correto e se existe uma solicitação de QR code aprovada para este código',
        codigoInformado: codigoQrCode.trim(),
      });
    }

    // Verificar se o motorista está ativo
    if (!qrCodeMotorista.motorista.ativo) {
      throw new NotFoundException({
        statusCode: 404,
        message: 'Motorista inativo',
        error: `O motorista vinculado ao QR code "${codigoQrCode.trim()}" está inativo no sistema`,
        details: 'Não é possível consultar motoristas que foram desativados. Entre em contato com o administrador da prefeitura para reativar o cadastro do motorista',
        motorista: {
          id: qrCodeMotorista.motorista.id,
          nome: qrCodeMotorista.motorista.nome,
          cpf: qrCodeMotorista.motorista.cpf,
        },
        codigoQrCode: codigoQrCode.trim(),
      });
    }

    // Validar se o motorista pertence à prefeitura informada
    const motoristaPrefeituraId = qrCodeMotorista.motorista.prefeituraId;
    if (motoristaPrefeituraId !== prefeituraId) {
      throw new BadRequestException({
        statusCode: 400,
        message: 'Motorista não pertence à prefeitura informada',
        error: `O motorista encontrado pertence à prefeitura de ID ${motoristaPrefeituraId}, mas foi informado o ID ${prefeituraId}`,
        details: 'Você deve informar o ID da prefeitura correta à qual o motorista está vinculado. Verifique o código QR code e o ID da prefeitura na requisição',
        motorista: {
          id: qrCodeMotorista.motorista.id,
          nome: qrCodeMotorista.motorista.nome,
          cpf: qrCodeMotorista.motorista.cpf,
          prefeituraId: motoristaPrefeituraId,
          prefeitura: qrCodeMotorista.motorista.prefeitura,
        },
        prefeituraIdInformado: prefeituraId,
        codigoQrCode: codigoQrCode.trim(),
      });
    }

    // Verificar se o QR code está ativo (status válidos para uso)
    // Status válidos: Aprovado, Em_Producao, Integracao, Concluida
    const statusValidos = ['Aprovado', 'Em_Producao', 'Integracao', 'Concluida'];
    const statusAtual = qrCodeMotorista.status;
    if (!statusValidos.includes(statusAtual)) {
      const statusMapeamento: Record<string, string> = {
        Solicitado: 'O QR code ainda está aguardando aprovação',
        Inativo: 'O QR code foi desativado temporariamente',
        Cancelado: 'O QR code foi cancelado permanentemente',
      };

      const detalheStatus = statusMapeamento[statusAtual] || 'Status não permite o uso do QR code no momento';

      throw new NotFoundException({
        statusCode: 404,
        message: 'QR code não está disponível para uso',
        error: `O QR code "${codigoQrCode.trim()}" não pode ser utilizado porque está com status "${statusAtual}"`,
        details: `${detalheStatus}. Apenas QR codes com status "Aprovado", "Em_Producao", "Integracao" ou "Concluida" podem ser consultados`,
        statusAtual,
        statusValidos,
        motorista: {
          id: qrCodeMotorista.motorista.id,
          nome: qrCodeMotorista.motorista.nome,
        },
        codigoQrCode: codigoQrCode.trim(),
      });
    }

    // Retornar dados do motorista
    return {
      message: 'Motorista encontrado com sucesso',
      motorista: {
        id: qrCodeMotorista.motorista.id,
        nome: qrCodeMotorista.motorista.nome,
        cpf: qrCodeMotorista.motorista.cpf,
        email: qrCodeMotorista.motorista.email,
        cnh: qrCodeMotorista.motorista.cnh,
        categoria_cnh: qrCodeMotorista.motorista.categoria_cnh,
        data_vencimento_cnh: qrCodeMotorista.motorista.data_vencimento_cnh,
        telefone: qrCodeMotorista.motorista.telefone,
        endereco: qrCodeMotorista.motorista.endereco,
        ativo: qrCodeMotorista.motorista.ativo,
        imagem_perfil: qrCodeMotorista.motorista.imagem_perfil,
        prefeitura: qrCodeMotorista.motorista.prefeitura,
        veiculos: qrCodeMotorista.motorista.veiculos.map((v: any) => ({
          id: v.veiculo.id,
          nome: v.veiculo.nome,
          placa: v.veiculo.placa,
          modelo: v.veiculo.modelo,
          tipo_veiculo: v.veiculo.tipo_veiculo,
        })),
      },
      qrCode: {
        id: qrCodeMotorista.id,
        codigo_qrcode: qrCodeMotorista.codigo_qrcode,
        status: qrCodeMotorista.status,
        data_cadastro: qrCodeMotorista.data_cadastro,
        foto: qrCodeMotorista.foto,
      },
    };
  }

  /**
   * Verifica se o QR code do motorista está com status "Concluida"
   * @param motoristaId ID do motorista
   * @returns Objeto com informações sobre o status do QR code
   */
  async verificarQrCodeConcluida(motoristaId: number) {
    // Verificar se o motorista existe
    const motorista = await this.prisma.motorista.findUnique({
      where: { id: motoristaId },
      select: {
        id: true,
        nome: true,
        cpf: true,
      },
    });

    if (!motorista) {
      throw new NotFoundException({
        statusCode: 404,
        message: 'Motorista não encontrado',
        error: `Nenhum motorista encontrado com o ID ${motoristaId}`,
        details: 'Verifique se o ID do motorista está correto',
        motoristaId,
      });
    }

    // Buscar a solicitação de QR code mais recente do motorista que não esteja cancelada
    let qrCodeMotorista: any = null;
    try {
      qrCodeMotorista = await (this.prisma as any).qrCodeMotorista.findFirst({
        where: {
          idMotorista: motoristaId,
          status: {
            not: 'Cancelado',
          },
        },
        orderBy: {
          data_cadastro: 'desc',
        },
        select: {
          id: true,
          idMotorista: true,
          status: true,
          codigo_qrcode: true,
          data_cadastro: true,
        },
      });
    } catch (error) {
      // Se a tabela não existir ou houver erro, retornar que não há QR code
      qrCodeMotorista = null;
    }

    if (!qrCodeMotorista) {
      return {
        message: 'QR code não encontrado para este motorista',
        motorista: {
          id: motorista.id,
          nome: motorista.nome,
          cpf: motorista.cpf,
        },
        qrCodeConcluida: false,
        possuiQrCode: false,
        statusAtual: null,
      };
    }

    const statusConcluida = qrCodeMotorista.status === StatusQrCodeMotorista.Concluida;

    return {
      message: statusConcluida
        ? 'QR code do motorista está com status Concluída'
        : 'QR code do motorista não está com status Concluída',
      motorista: {
        id: motorista.id,
        nome: motorista.nome,
        cpf: motorista.cpf,
      },
      qrCodeConcluida: statusConcluida,
      possuiQrCode: true,
      statusAtual: qrCodeMotorista.status,
      qrCode: {
        id: qrCodeMotorista.id,
        codigo_qrcode: qrCodeMotorista.codigo_qrcode,
        data_cadastro: qrCodeMotorista.data_cadastro,
      },
    };
  }
}

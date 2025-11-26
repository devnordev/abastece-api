import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../../common/prisma/prisma.service';
import { CreateUsuarioDto } from '../usuario/dto/create-usuario.dto';
import { LoginDto } from './dto/login.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import * as bcrypt from 'bcryptjs';
import { randomBytes } from 'crypto';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  async register(createUsuarioDto: CreateUsuarioDto) {
    const { email, senha, cpf } = createUsuarioDto;

    // Verificar se usuário já existe
    const existingUser = await this.prisma.usuario.findFirst({
      where: {
        OR: [
          { email },
          { cpf },
        ],
      },
    });

    if (existingUser) {
      throw new ConflictException('Usuário já existe com este email ou CPF');
    }

    // Hash da senha
    const hashedPassword = await bcrypt.hash(senha, 12);

    // Criar usuário
    const usuario = await this.prisma.usuario.create({
      data: {
        ...createUsuarioDto,
        senha: hashedPassword,
        data_cadastro: new Date(),
        statusAcess: 'Acesso_solicitado',
        ativo: true,
      },
      select: {
        id: true,
        email: true,
        nome: true,
        cpf: true,
        tipo_usuario: true,
        statusAcess: true,
        ativo: true,
        prefeituraId: true,
        empresaId: true,
      },
    });

    return {
      message: 'Usuário criado com sucesso',
      usuario,
    };
  }

  async login(loginDto: LoginDto) {
    const { email, senha } = loginDto;

    // Buscar usuário
    const usuario = await this.prisma.usuario.findUnique({
      where: { email },
      include: {
        prefeitura: {
          select: {
            id: true,
            nome: true,
            cnpj: true,
          },
        },
        empresa: {
          select: {
            id: true,
            nome: true,
            cnpj: true,
            uf: true,
          },
        },
      },
    });

    if (!usuario) {
      throw new UnauthorizedException('Credenciais inválidas');
    }

    // Verificar senha
    const isPasswordValid = await bcrypt.compare(senha, usuario.senha);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Credenciais inválidas');
    }

    // Verificar se usuário está ativo
    if (!usuario.ativo) {
      throw new UnauthorizedException({
        message: 'Usuário desativado',
        error: 'Este usuário está desativado e não pode fazer login. Por favor, entre em contato com o administrador do sistema para reativar sua conta.',
        statusCode: 401,
      });
    }

    // Atualizar último login
    await this.prisma.usuario.update({
      where: { id: usuario.id },
      data: { ultimo_login: new Date() },
    });

    // Gerar tokens
    const tokens = await this.generateTokens(usuario.id);

    return {
      message: 'Login realizado com sucesso',
      usuario: {
        id: usuario.id,
        email: usuario.email,
        nome: usuario.nome,
        cpf: usuario.cpf,
        tipo_usuario: usuario.tipo_usuario,
        statusAcess: usuario.statusAcess,
        prefeitura: usuario.prefeitura,
        empresa: usuario.empresa,
      },
      ...tokens,
    };
  }

  async refreshToken(refreshTokenDto: RefreshTokenDto) {
    const { refreshToken } = refreshTokenDto;

    // Buscar refresh token
    const tokenRecord = await this.prisma.refreshToken.findUnique({
      where: { token: refreshToken },
      include: { usuario: true },
    });

    if (!tokenRecord) {
      throw new UnauthorizedException('Refresh token inválido');
    }

    // Verificar se token não expirou
    if (tokenRecord.expiracao < new Date()) {
      throw new UnauthorizedException('Refresh token expirado');
    }

    // Verificar se token não foi revogado
    if (tokenRecord.revogadoEm) {
      throw new UnauthorizedException('Refresh token revogado');
    }

    // Verificar se usuário ainda está ativo
    if (!tokenRecord.usuario.ativo) {
      throw new UnauthorizedException({
        message: 'Usuário desativado',
        error: 'Este usuário está desativado e não pode renovar o token de acesso. Por favor, entre em contato com o administrador do sistema para reativar sua conta.',
        statusCode: 401,
      });
    }

    // Revogar refresh token atual
    await this.prisma.refreshToken.update({
      where: { id: tokenRecord.id },
      data: { revogadoEm: new Date() },
    });

    // Gerar novos tokens
    const tokens = await this.generateTokens(tokenRecord.usuario.id);

    return {
      message: 'Tokens renovados com sucesso',
      ...tokens,
    };
  }

  async logout(userId: number) {
    // Revogar todos os refresh tokens do usuário
    await this.prisma.refreshToken.updateMany({
      where: {
        usuarioId: userId,
        revogadoEm: null,
      },
      data: {
        revogadoEm: new Date(),
      },
    });

    return {
      message: 'Logout realizado com sucesso',
    };
  }

  private async generateTokens(userId: number) {
    const payload = { sub: userId };

    // Gerar access token
    const accessToken = this.jwtService.sign(payload, {
      secret: process.env.JWT_SECRET,
      expiresIn: process.env.JWT_EXPIRES_IN || '15m',
    });

    // Gerar refresh token
    const refreshToken = randomBytes(32).toString('hex');
    const refreshTokenExpiry = new Date();
    refreshTokenExpiry.setDate(refreshTokenExpiry.getDate() + 7); // 7 dias

    // Salvar refresh token no banco
    await this.prisma.refreshToken.create({
      data: {
        usuarioId: userId,
        token: refreshToken,
        expiracao: refreshTokenExpiry,
        criadoEm: new Date(),
      },
    });

    return {
      accessToken,
      refreshToken,
      expiresIn: process.env.JWT_EXPIRES_IN || '15m',
    };
  }

  async validateUser(userId: number) {
    const usuario = await this.prisma.usuario.findUnique({
      where: { id: userId },
      include: {
        prefeitura: {
          select: {
            id: true,
            nome: true,
            cnpj: true,
          },
        },
        empresa: {
          select: {
            id: true,
            nome: true,
            cnpj: true,
            uf: true,
          },
        },
      },
    });

    if (!usuario) {
      return null;
    }

    if (!usuario.ativo) {
      return 'INACTIVE';
    }

    return {
      id: usuario.id,
      email: usuario.email,
      nome: usuario.nome,
      cpf: usuario.cpf,
      tipo_usuario: usuario.tipo_usuario,
      statusAcess: usuario.statusAcess,
      prefeitura: usuario.prefeitura,
      empresa: usuario.empresa,
    };
  }
}

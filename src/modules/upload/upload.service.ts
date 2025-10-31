import { Injectable, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

@Injectable()
export class UploadService {
  private supabase: SupabaseClient;
  private readonly bucketName: string;

  private isConfigured: boolean = false;

  constructor(private configService: ConfigService) {
    const supabaseUrl = this.configService.get<string>('SUPABASE_URL');
    const supabaseKey = this.configService.get<string>('SUPABASE_KEY');
    this.bucketName = this.configService.get<string>('SUPABASE_BUCKET', 'cdn_hosp_imgs_abastece');

    if (supabaseUrl && supabaseKey) {
      try {
        this.supabase = createClient(supabaseUrl, supabaseKey, {
          auth: {
            persistSession: false,
          },
        });
        this.isConfigured = true;
      } catch (error) {
        console.warn('⚠️ Supabase não configurado corretamente. Upload de imagens desabilitado.', error.message);
        this.isConfigured = false;
      }
    } else {
      console.warn('⚠️ SUPABASE_URL e SUPABASE_KEY não configurados. Upload de imagens desabilitado.');
      this.isConfigured = false;
    }
  }

  /**
   * Faz upload de uma imagem para o Supabase Storage
   * @param file Arquivo a ser enviado
   * @param folder Pasta dentro do bucket (ex: 'empresas', 'usuarios')
   * @param fileName Nome do arquivo (opcional, será gerado se não fornecido)
   * @returns URL pública da imagem
   */
  async uploadImage(
    file: Express.Multer.File,
    folder: string = 'uploads',
    fileName?: string,
  ): Promise<string | null> {
    if (!this.isConfigured) {
      throw new BadRequestException('Serviço de upload não está configurado. Verifique as variáveis SUPABASE_URL e SUPABASE_KEY no .env');
    }

    if (!file) {
      throw new BadRequestException('Nenhum arquivo foi enviado');
    }

    // Validar se é uma imagem
    const allowedMimeTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
    if (!allowedMimeTypes.includes(file.mimetype)) {
      throw new BadRequestException(
        `Tipo de arquivo não permitido. Permitidos: ${allowedMimeTypes.join(', ')}`,
      );
    }

    // Validar tamanho (máximo 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      throw new BadRequestException('Arquivo muito grande. Tamanho máximo: 5MB');
    }

    // Gerar nome único para o arquivo
    const fileExtension = file.originalname.split('.').pop() || 'jpg';
    const uniqueFileName = fileName
      ? `${fileName}.${fileExtension}`
      : `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExtension}`;
    const filePath = `${folder}/${uniqueFileName}`;

    try {
      // Upload para o Supabase Storage
      const { data, error } = await this.supabase.storage
        .from(this.bucketName)
        .upload(filePath, file.buffer, {
          contentType: file.mimetype,
          upsert: true,
        });

      if (error) {
        throw new BadRequestException(`Erro ao fazer upload: ${error.message}`);
      }

      // Obter URL pública da imagem
      const { data: urlData } = this.supabase.storage
        .from(this.bucketName)
        .getPublicUrl(data.path);

      if (!urlData?.publicUrl) {
        throw new BadRequestException('Erro ao obter URL pública da imagem');
      }

      return urlData.publicUrl;
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException(`Erro ao processar upload: ${error.message}`);
    }
  }

  /**
   * Remove uma imagem do Supabase Storage
   * @param filePath Caminho do arquivo no storage (ex: 'empresas/image.jpg')
   * @returns true se removido com sucesso
   */
  async deleteImage(filePath: string): Promise<boolean> {
    try {
      const { error } = await this.supabase.storage.from(this.bucketName).remove([filePath]);

      if (error) {
        throw new BadRequestException(`Erro ao remover imagem: ${error.message}`);
      }

      return true;
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException(`Erro ao processar remoção: ${error.message}`);
    }
  }

  /**
   * Extrai o caminho do arquivo da URL pública
   * @param publicUrl URL pública da imagem
   * @returns Caminho do arquivo no storage
   */
  extractFilePathFromUrl(publicUrl: string): string | null {
    try {
      const url = new URL(publicUrl);
      const pathParts = url.pathname.split('/');
      const bucketIndex = pathParts.findIndex((part) => part === this.bucketName);
      
      if (bucketIndex === -1 || bucketIndex === pathParts.length - 1) {
        return null;
      }

      return pathParts.slice(bucketIndex + 1).join('/');
    } catch {
      return null;
    }
  }
}


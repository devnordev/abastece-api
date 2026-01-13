# 🔧 Correção do Erro de Build Docker

## ❌ Erro Encontrado

```
runc run failed: unable to start container process: error during container init: exec: "/bin/sh": stat /bin/sh: no such file or directory
```

## 🔍 Causa

Este erro geralmente ocorre quando:
1. O Docker buildx está usando uma plataforma diferente (ARM vs x86_64)
2. A imagem Alpine não está disponível para a plataforma alvo
3. Problemas com cache do Docker
4. Problemas com a versão do buildx

## ✅ Soluções Aplicadas

### Solução 1: Dockerfile Principal (Alpine - Corrigido)

O Dockerfile principal foi corrigido para:
- Garantir que o bash está instalado antes de qualquer comando
- Usar `/bin/sh` explicitamente em todos os comandos RUN
- Adicionar bash nas dependências do sistema

**Arquivo:** `Dockerfile`

### Solução 2: Dockerfile Alternativo (Debian - Backup)

Se o problema persistir, use o Dockerfile alternativo que usa `node:20-slim` (Debian):

```bash
# Renomeie o Dockerfile atual
mv Dockerfile Dockerfile.alpine

# Use o Dockerfile alternativo
mv Dockerfile.alternative Dockerfile

# Faça o build novamente
docker buildx build --platform linux/amd64 -t sua-imagem .
```

**Arquivo:** `Dockerfile.alternative`

## 🚀 Como Resolver

### Opção 1: Limpar Cache e Rebuildar

```bash
# Limpar cache do Docker
docker builder prune -a

# Rebuildar sem cache
docker buildx build --no-cache --platform linux/amd64 -t sua-imagem .
```

### Opção 2: Especificar Plataforma Explicitamente

```bash
docker buildx build --platform linux/amd64 -t sua-imagem .
```

### Opção 3: Usar Dockerfile Alternativo (Debian)

```bash
# No seu servidor de deploy (Easypanel), altere o Dockerfile para usar a versão alternativa
# Ou renomeie os arquivos conforme mostrado acima
```

## 📝 Notas Importantes

1. **Alpine vs Debian:**
   - Alpine: Imagem menor (~5MB), mas pode ter problemas com algumas plataformas
   - Debian (slim): Imagem maior (~70MB), mas mais estável e compatível

2. **Buildx:**
   - Se estiver usando buildx, certifique-se de especificar a plataforma
   - Use `--platform linux/amd64` para garantir compatibilidade

3. **Cache:**
   - Limpar o cache pode resolver problemas de build
   - Use `--no-cache` se o problema persistir

## 🔄 Verificação

Após aplicar as correções, verifique:

```bash
# Verificar se o build funciona
docker buildx build --platform linux/amd64 -t teste .

# Verificar se a imagem tem /bin/sh
docker run --rm teste ls -la /bin/sh
```

## 📞 Se o Problema Persistir

1. Verifique a plataforma do servidor de build
2. Use o Dockerfile alternativo (Debian)
3. Verifique os logs completos do buildx
4. Considere usar `docker build` ao invés de `docker buildx build`

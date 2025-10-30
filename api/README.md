# API Sistema de Abastecimento

API REST desenvolvida em NestJS para gerenciamento de abastecimento de veículos de prefeituras e empresas.

## 🚀 Tecnologias Utilizadas

- **NestJS** - Framework Node.js
- **Prisma** - ORM para banco de dados
- **PostgreSQL** - Banco de dados
- **JWT** - Autenticação e autorização
- **Swagger** - Documentação da API
- **TypeScript** - Linguagem de programação
- **bcryptjs** - Hash de senhas
- **class-validator** - Validação de dados
- **class-transformer** - Transformação de dados

## 📋 Funcionalidades

### Autenticação e Autorização
- ✅ Login com JWT
- ✅ Refresh Token
- ✅ Hash de senhas com bcryptjs
- ✅ Middleware de autenticação
- ✅ Diferentes tipos de usuários

### Módulos Principais
- ✅ **Usuários** - CRUD completo com validações
- ✅ **Prefeituras** - Gestão de prefeituras
- ✅ **Empresas** - Gestão de postos e distribuidoras
- ✅ **Veículos** - Cadastro e controle de veículos
- ✅ **Motoristas** - Gestão de motoristas
- ✅ **Abastecimentos** - Controle de abastecimentos
- ✅ **Combustíveis** - Tipos de combustíveis
- ✅ **Órgãos** - Departamentos das prefeituras
- ✅ **Categorias** - Categorização de veículos
- ✅ **Processos** - Processos licitatórios
- ✅ **Contratos** - Contratos com empresas

### Recursos Técnicos
- ✅ Validação de dados com DTOs
- ✅ Paginação em todas as listagens
- ✅ Filtros avançados
- ✅ Documentação Swagger
- ✅ Tratamento de erros
- ✅ Logs de auditoria
- ✅ Relacionamentos complexos

## 🛠️ Instalação

### Pré-requisitos
- Node.js 18+
- PostgreSQL 13+
- npm ou yarn

### Passos para instalação

1. **Clone o repositório**
```bash
git clone <url-do-repositorio>
cd api-abastecimento
```

2. **Instale as dependências**
```bash
npm install
```

3. **Configure o banco de dados**
```bash
# Copie o arquivo de exemplo
cp env.example .env

# Edite o arquivo .env com suas configurações
DATABASE_URL="postgresql://username:password@localhost:5432/abastecimento_db?schema=public"
JWT_SECRET="your-super-secret-jwt-key-here"
JWT_EXPIRES_IN="15m"
JWT_REFRESH_SECRET="your-super-secret-refresh-key-here"
JWT_REFRESH_EXPIRES_IN="7d"
```

4. **Execute as migrações do Prisma**
```bash
npx prisma migrate dev
npx prisma generate
```

5. **Execute a aplicação**
```bash
# Desenvolvimento
npm run start:dev

# Produção
npm run build
npm run start:prod
```

## 📚 Documentação da API

Após iniciar a aplicação, acesse a documentação Swagger em:
- **Desenvolvimento**: http://localhost:3000/api/docs
- **Produção**: https://seu-dominio.com/api/docs

## 🔐 Autenticação

A API utiliza JWT para autenticação. Para acessar endpoints protegidos:

1. **Registre um usuário**:
```bash
POST /auth/register
{
  "email": "usuario@exemplo.com",
  "senha": "senha123",
  "nome": "João Silva",
  "cpf": "12345678901",
  "tipo_usuario": "ADMIN_PREFEITURA"
}
```

2. **Faça login**:
```bash
POST /auth/login
{
  "email": "usuario@exemplo.com",
  "senha": "senha123"
}
```

3. **Use o token retornado**:
```bash
Authorization: Bearer <seu-jwt-token>
```

## 📊 Estrutura do Banco de Dados

O banco de dados foi modelado com base no schema Prisma e inclui:

- **Entidades principais**: Usuario, Prefeitura, Empresa, Veiculo, Motorista, Abastecimento
- **Relacionamentos**: Many-to-Many, One-to-Many, Foreign Keys
- **Enums**: Tipos de usuário, status, UF, tipos de veículo, etc.
- **Auditoria**: Logs de alterações, refresh tokens

## 🧪 Testes

```bash
# Testes unitários
npm run test

# Testes e2e
npm run test:e2e

# Cobertura de testes
npm run test:cov
```

## 📝 Scripts Disponíveis

```bash
# Desenvolvimento
npm run start:dev

# Build
npm run build

# Produção
npm run start:prod

# Linting
npm run lint

# Formatação
npm run format

# Prisma
npm run prisma:generate
npm run prisma:migrate
npm run prisma:studio
```

## 🏗️ Arquitetura

```
src/
├── common/
│   └── prisma/          # Configuração do Prisma
├── modules/
│   ├── auth/            # Autenticação e autorização
│   ├── usuario/         # Gestão de usuários
│   ├── prefeitura/      # Gestão de prefeituras
│   ├── empresa/         # Gestão de empresas
│   ├── veiculo/         # Gestão de veículos
│   ├── motorista/       # Gestão de motoristas
│   ├── abastecimento/   # Gestão de abastecimentos
│   ├── combustivel/     # Gestão de combustíveis
│   ├── orgao/           # Gestão de órgãos
│   ├── categoria/       # Gestão de categorias
│   ├── processo/        # Gestão de processos
│   └── contrato/        # Gestão de contratos
├── app.module.ts        # Módulo principal
└── main.ts             # Arquivo de inicialização
```

## 🔒 Segurança

- ✅ Hash de senhas com bcryptjs
- ✅ JWT com refresh token
- ✅ Validação de dados de entrada
- ✅ Rate limiting
- ✅ CORS configurado
- ✅ Sanitização de dados

## 📈 Performance

- ✅ Paginação em todas as consultas
- ✅ Índices no banco de dados
- ✅ Queries otimizadas
- ✅ Cache de tokens
- ✅ Compressão de respostas

## 🤝 Contribuição

1. Fork o projeto
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo [LICENSE](LICENSE) para mais detalhes.

## 📞 Suporte

Para suporte, entre em contato através de:
- Email: suporte@exemplo.com
- Issues: [GitHub Issues](https://github.com/seu-usuario/api-abastecimento/issues)

---

Desenvolvido com ❤️ usando NestJS e Prisma

# 📋 Regras de Perfis e Permissões

## Tipos de Usuários

O sistema possui cinco tipos de usuários, cada um com permissões específicas:

### 1. SUPER_ADMIN
**Descrição:** Administrador geral do sistema com controle total sobre configurações, mas sem acesso a operações específicas de prefeituras.

#### ✅ Módulos Permitidos (CRUD Completo):
- **Usuários** (`/usuarios`) - Gerenciamento de todos os tipos de usuários
- **Combustíveis** (`/combustiveis`) - Cadastro e gerenciamento de combustíveis
- **Empresas** (`/empresas`) - Cadastro e gerenciamento de empresas
- **Prefeituras** (`/prefeituras`) - Cadastro e gerenciamento de prefeituras
- **Processos** (`/processos`) - Gerenciamento de processos licitatórios
- **Contratos** (`/contratos`) - Gerenciamento de contratos
- **Categorias** (`/categorias`) - Gerenciamento de categorias
- **Política de Preços ANP** - Gerenciamento de preços da ANP

#### ❌ Módulos Bloqueados:
- Veículos (`/veiculos`)
- Motoristas (`/motoristas`)
- Órgãos (`/orgaos`)
- Abastecimentos (`/abastecimentos`)

**Mensagem de erro ao tentar acessar módulos bloqueados:**
```json
{
  "message": "Usuários com perfil SUPER_ADMIN não têm acesso a este recurso",
  "error": "Forbidden",
  "statusCode": 403
}
```

---

### 2. ADMIN_PREFEITURA
**Descrição:** Administrador de uma prefeitura específica com controle total sobre recursos da sua prefeitura.

#### ✅ Módulos Permitidos:
- **Usuários da própria prefeitura** - Pode criar COLABORADOR_PREFEITURA
- **Órgãos da própria prefeitura** (`/orgaos`)
- **Veículos da própria prefeitura** (`/veiculos`)
- **Motoristas da própria prefeitura** (`/motoristas`)
- **Abastecimentos da própria prefeitura** (`/abastecimentos`)

#### ❌ Restrições:
- Não pode criar outro ADMIN_PREFEITURA
- Não pode criar usuários de empresa
- Não pode acessar dados de outras prefeituras
- Não pode cadastrar veículos de outras prefeituras
- Não pode cadastrar motoristas de outras prefeituras

#### 🔒 Isolamento de Dados:
Todos os dados visualizados são automaticamente filtrados pela prefeitura do administrador.

---

### 3. COLABORADOR_PREFEITURA
**Descrição:** Colaborador de uma prefeitura com permissões limitadas.

#### ✅ Módulos Permitidos (Apenas Leitura):
- Visualizar usuários da própria prefeitura
- Visualizar órgãos da própria prefeitura
- Visualizar veículos da própria prefeitura
- Visualizar motoristas da própria prefeitura
- Visualizar abastecimentos da própria prefeitura

#### ❌ Restrições:
- Não pode criar usuários
- Não pode criar órgãos
- Não pode criar veículos
- Não pode criar motoristas
- Não pode cadastrar abastecimentos

#### 🔒 Isolamento de Dados:
Todos os dados visualizados são automaticamente filtrados pela prefeitura do colaborador.

---

### 4. ADMIN_EMPRESA
**Descrição:** Administrador de uma empresa com controle sobre recursos da sua empresa.

#### ✅ Módulos Permitidos:
- **Usuários da própria empresa** - Pode criar COLABORADOR_EMPRESA
- Visualizar contratos da própria empresa
- Visualizar processos da própria empresa

#### ❌ Restrições:
- Não pode criar outro ADMIN_EMPRESA
- Não pode acessar dados de prefeituras
- Não pode acessar veículos
- Não pode acessar motoristas
- Não pode acessar órgãos
- Não pode cadastrar abastecimentos

---

### 5. COLABORADOR_EMPRESA
**Descrição:** Colaborador de uma empresa com permissões limitadas.

#### ✅ Módulos Permitidos (Apenas Leitura):
- Visualizar usuários da própria empresa
- Visualizar contratos da própria empresa
- Visualizar processos da própria empresa

#### ❌ Restrições:
- Não pode criar usuários
- Não pode criar contratos
- Não pode criar processos
- Não pode acessar dados de prefeituras
- Não pode acessar dados de veículos, motoristas ou órgãos

---

## 📊 Tabela de Permissões por Módulo

| Módulo | SUPER_ADMIN | ADMIN_PREFEITURA | COLABORADOR_PREFEITURA | ADMIN_EMPRESA | COLABORADOR_EMPRESA |
|--------|-------------|------------------|------------------------|--------------|---------------------|
| **Usuários** | ✅ CRUD Todos | ✅ CRUD (APENAS COLABORADOR_PREFEITURA da mesma prefeitura) | 👁️ Visualizar (própria prefeitura) | ✅ CRUD (APENAS COLABORADOR_EMPRESA da mesma empresa) | 👁️ Visualizar (própria empresa) |
| **Combustíveis** | ✅ CRUD | ❌ | ❌ | ❌ | ❌ |
| **Empresas** | ✅ CRUD | ❌ | ❌ | ❌ | ❌ |
| **Prefeituras** | ✅ CRUD | ❌ | ❌ | ❌ | ❌ |
| **Processos** | ✅ CRUD | ❌ | ❌ | 👁️ Ver (própria empresa) | 👁️ Ver (própria empresa) |
| **Contratos** | ✅ CRUD | ❌ | ❌ | 👁️ Ver (própria empresa) | 👁️ Ver (própria empresa) |
| **Órgãos** | ❌ | ✅ CRUD (própria prefeitura) | 👁️ Ver (própria prefeitura) | ❌ | ❌ |
| **Veículos** | ❌ | ✅ CRUD (própria prefeitura) | 👁️ Ver (própria prefeitura) | ❌ | ❌ |
| **Motoristas** | ❌ | ✅ CRUD (própria prefeitura) | 👁️ Ver (própria prefeitura) | ❌ | ❌ |
| **Abastecimentos** | ❌ | ✅ CRUD (própria prefeitura) | 👁️ Ver (própria prefeitura) | ❌ | ❌ |
| **Categorias** | ✅ CRUD | ❌ | ❌ | ❌ | ❌ |

**Legenda:**
- ✅ CRUD = Criar, Ler, Atualizar e Deletar
- 👁️ = Apenas visualização
- ❌ = Sem acesso

---

## 🛡️ Regras de Negócio Importantes

### ADMIN_PREFEITURA

#### ❌ Não Pode:
1. Cadastrar outro ADMIN_PREFEITURA
2. Cadastrar usuários de empresa
3. Acessar dados de outras prefeituras
4. Cadastrar órgãos em outras prefeituras
5. Cadastrar veículos em outras prefeituras
6. Cadastrar motoristas em outras prefeituras

#### ✅ Pode:
1. Cadastrar COLABORADOR_PREFEITURA (status ativado automaticamente)
2. Cadastrar órgãos vinculados à própria prefeitura
3. Cadastrar veículos e vinculá-los a um órgão
4. Cadastrar motoristas e vinculá-los ao veículo
5. Cadastrar abastecimentos da própria prefeitura
6. Visualizar e gerenciar todos os recursos da sua prefeitura

### COLABORADOR_PREFEITURA

#### ❌ Não Pode:
1. Cadastrar qualquer tipo de usuário
2. Cadastrar órgãos
3. Cadastrar veículos
4. Cadastrar motoristas
5. Acessar dados de outras prefeituras

#### ✅ Pode:
1. Visualizar usuários da própria prefeitura
2. Visualizar órgãos da própria prefeitura
3. Visualizar veículos da própria prefeitura
4. Visualizar motoristas da própria prefeitura
5. Visualizar abastecimentos da própria prefeitura

### Isolamento de Dados

**ADMIN_PREFEITURA** e **COLABORADOR_PREFEITURA** têm acesso automático apenas aos dados da sua prefeitura. O sistema aplica filtros automáticos em:
- Usuários
- Órgãos
- Veículos
- Motoristas
- Abastecimentos

---

## 📝 Validações de Cadastro por Perfil

### ADMIN_PREFEITURA - Cadastro de Usuários

**Permitido:**
- ✅ COLABORADOR_PREFEITURA (status = "Ativado" automaticamente)
- ✅ Vinculação de COLABORADOR_PREFEITURA a um ou mais órgãos

**Bloqueado:**
- ❌ ADMIN_PREFEITURA (próprio perfil)
- ❌ Usuários de empresa

### ADMIN_PREFEITURA - Cadastro de Órgãos

**Permitido:**
- ✅ Cadastrar órgãos vinculados à própria prefeitura
- ✅ Validar nome e sigla únicos na prefeitura

**Bloqueado:**
- ❌ Cadastrar órgãos de outras prefeituras
- ❌ Cadastrar órgãos duplicados (nome ou sigla)

### ADMIN_PREFEITURA - Cadastro de Veículos

**Campos Obrigatórios:**
- Nome do veículo
- Placa (única no sistema)
- Ano do veículo
- Capacidade do tanque
- Órgão responsável
- Tipo de abastecimento (COTA, LIVRE, COM_AUTORIZACAO)
- Periodicidade (obrigatório apenas para tipo COTA)
- Quantidade em litros (obrigatório apenas para tipo COTA)
- Combustíveis permitidos (pelo menos um)

**Campos Opcionais:**
- Categorias
- Motoristas
- Cotas de período
- Modelo, tipo_veiculo, situacao_veiculo, etc.

**Permitido:**
- ✅ Cadastrar veículos da própria prefeitura
- ✅ Vincular veículo a um órgão da prefeitura

**Bloqueado:**
- ❌ Cadastrar veículo em múltiplos órgãos da mesma prefeitura
- ❌ Cadastrar veículos de outras prefeituras

### ADMIN_PREFEITURA - Cadastro de Motoristas

**Campos Obrigatórios:**
- Nome completo
- Email
- CPF

**Campos Opcionais:**
- CNH, categoria_cnh, telefone, endereco, observacoes

**Permitido:**
- ✅ Cadastrar motoristas da própria prefeitura
- ✅ Status ativo por padrão

**Bloqueado:**
- ❌ Cadastrar motoristas de outras prefeituras
- ❌ Cadastrar motorista sem CPF

---

## 🔐 Segurança e Validações

### Validação de Email
Todos os módulos que solicitam email validam o formato e verificam duplicidade.

### Validação de CPF
- Motoristas: CPF obrigatório
- Usuários: CPF obrigatório
- Verificação de duplicidade

### Validação de Placa
- Veículos têm placas únicas no sistema
- Verificação de duplicidade antes do cadastro

### Mensagens de Erro Amigáveis
Todos os endpoints retornam mensagens claras e específicas quando há violação de regras de negócio.

---

## 📚 Endpoints por Módulo

### Usuários
- `POST /usuarios` - Criar usuário
- `GET /usuarios` - Listar usuários (filtro por prefeitura)
- `GET /usuarios/:id` - Buscar usuário por ID
- `PATCH /usuarios/:id` - Atualizar usuário
- `DELETE /usuarios/:id` - Excluir usuário

### Veículos
- `POST /veiculos` - Criar veículo
- `GET /veiculos` - Listar veículos (filtro por prefeitura)
- `GET /veiculos/:id` - Buscar veículo por ID
- `PATCH /veiculos/:id` - Atualizar veículo
- `DELETE /veiculos/:id` - Excluir veículo

### Motoristas
- `POST /motoristas` - Criar motorista
- `GET /motoristas` - Listar motoristas (filtro por prefeitura)
- `GET /motoristas/:id` - Buscar motorista por ID
- `PATCH /motoristas/:id` - Atualizar motorista
- `DELETE /motoristas/:id` - Excluir motorista

### Órgãos
- `POST /orgaos` - Criar órgão
- `GET /orgaos` - Listar órgãos (filtro por prefeitura)
- `GET /orgaos/:id` - Buscar órgão por ID
- `PATCH /orgaos/:id` - Atualizar órgão
- `DELETE /orgaos/:id` - Excluir órgão

### Abastecimentos
- `POST /abastecimentos` - Criar abastecimento
- `GET /abastecimentos` - Listar abastecimentos
- `GET /abastecimentos/:id` - Buscar abastecimento por ID
- `PATCH /abastecimentos/:id` - Atualizar abastecimento
- `DELETE /abastecimentos/:id` - Excluir abastecimento

---

## 📌 Notas Importantes

1. **Isolamento de Dados:** ADMIN_PREFEITURA e COLABORADOR_PREFEITURA só visualizam dados da sua própria prefeitura.
2. **Status Padrão:** Usuários, veículos e motoristas criados por ADMIN_PREFEITURA são ativados automaticamente.
3. **Validação de Duplicidade:** Sistema impede cadastros duplicados por email, CPF, placa, etc.
4. **Mensagens Amigáveis:** Todos os erros retornam mensagens claras e específicas.
5. **Autorização Automática:** O sistema aplica filtros de autorização automaticamente em todos os endpoints.


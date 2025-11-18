# Guia Completo — Abastecimento de Veículos com VeiculoCotaPeriodo

## Objetivo
- Explicar como usuários autenticados realizam um abastecimento para veículos configurados com `tipo_abastecimento = COTA`.
- Detalhar como consultar e respeitar os registros da tabela `VeiculoCotaPeriodo`.
- Mostrar as rotas necessárias para validar cotas, registrar a solicitação e finalizar o abastecimento.

## Modelos e campos relevantes

```967:982:prisma/schema.prisma
model VeiculoCotaPeriodo {
  id                    Int           @id @default(autoincrement())
  veiculoId             Int
  data_inicio_periodo   DateTime
  data_fim_periodo      DateTime
  quantidade_permitida  Decimal       @db.Decimal(10, 1)
  quantidade_utilizada  Decimal       @default(0) @db.Decimal(10, 1)
  quantidade_disponivel Decimal       @db.Decimal(10, 1)
  periodicidade         Periodicidade
  ativo                 Boolean       @default(true)
  veiculo               Veiculo       @relation(fields: [veiculoId], references: [id])
  @@map("veiculo_cota_periodo")
}
```

Além do relacionamento direto com `Veiculo`, os seguintes modelos participam do fluxo:
- `SolicitacaoAbastecimento`: armazena o pedido formal do órgão.
- `Abastecimento`: registro final do consumo, responsável por atualizar `CotaOrgao` e `Processo`.
- `CotaOrgao`: controla o saldo do órgão e é sempre atualizada após a confirmação do abastecimento direto ou via solicitação.

## Perfis e autenticação
- **ADMIN_PREFEITURA**: cadastra veículos, cotas periódicas e abre solicitações para sua prefeitura.
- **ADMIN_EMPRESA / COLABORADOR_EMPRESA**: executa o abastecimento (rotas `POST /abastecimentos` ou `POST /abastecimentos/from-solicitacao`). O guard `EmpresaGuard` impede criação caso o usuário não pertença à empresa informada.
- Todas as rotas descritas aqui exigem JWT válido enviado em `Authorization: Bearer <token>`.

## Fluxo completo

### Passo 0 — Conferir o veículo e suas cotas periódicas
1. **Buscar o veículo**: `GET /veiculos/:id`. A resposta inclui `tipo_abastecimento`, `periodicidade`, `quantidade` e demais vínculos necessários para o formulário.
2. **Listar cotas do órgão** (opcional, prefeitura): `GET /solicitacoes-abastecimento/orgao/:orgaoId/cotas`.
3. **Confirmar o tipo de abastecimento** (prefeitura): `GET /solicitacoes-abastecimento/veiculo/:id/tipo-abastecimento`. Esta rota centraliza as mesmas validações usadas na criação de solicitações e retorna um resumo do período atual.

### Passo 1 — Validar limite disponível para a data de uso
- Para qualquer usuário autorizado é possível simular o consumo com `GET /abastecimentos/veiculo/tipo/abastecimento/:veiculoId/:qntLitros`.  
  - A service calcula o intervalo vigente e soma o que já foi abastecido no período, retornando se o novo volume ultrapassa o limite configurado na cota.  
  - Caso o veículo não seja de cota, a resposta indica `possuiCota = false`.

No momento da solicitação, a validação do `VeiculoCotaPeriodo` ocorre automaticamente:

```624:808:src/modules/solicitacao-abastecimento/solicitacao-abastecimento.service.ts
else if (veiculo.tipo_abastecimento === TipoAbastecimentoVeiculo.COTA) {
  if (veiculo.periodicidade) {
    await this.validarVeiculoCotaPeriodo(
      veiculo.id,
      veiculo.periodicidade,
      dataSolicitacao,
      quantidade,
    );
  }
  await this.validarCotaOrgaoParaComCota(...);
}
```

A função `validarVeiculoCotaPeriodo` garante que exista um registro ativo para o dia/semana/mês e que `quantidade_disponivel` seja suficiente para o pedido.

### Passo 2 — Registrar a solicitação (prefeitura)
`POST /solicitacoes-abastecimento`

Exemplo de payload com veículo de cota mensal:

```json
{
  "prefeituraId": 12,
  "veiculoId": 87,
  "motoristaId": 44,
  "combustivelId": 2,
  "empresaId": 9,
  "quantidade": 120.5,
  "data_solicitacao": "2025-11-17T09:00:00Z",
  "data_expiracao": "2025-11-20T23:59:59Z",
  "tipo_abastecimento": "COM_COTA"
}
```

Se a periodicidade for diária/semanal/mensal, a solicitação só é criada quando a soma do período + `quantidade` continuar menor ou igual a `quantidade_permitida`. Em caso de divergência, o serviço retorna uma das exceções:
- `SolicitacaoAbastecimentoVeiculoCotaPeriodoNaoEncontradaException`
- `SolicitacaoAbastecimentoVeiculoCotaPeriodoEsgotadaException`
- `SolicitacaoAbastecimentoVeiculoCotaPeriodoQuantidadeInsuficienteException`

### Passo 3 — Gerar o abastecimento
Existem duas estratégias válidas para usuários da empresa:

**A. Conversão direta da solicitação**  
- `POST /abastecimentos/from-solicitacao` com `{ "solicitacaoId": <id> }`.
- Se a solicitação ainda estiver `PENDENTE`, o serviço aprova automaticamente, cria o abastecimento e vincula os registros.

**B. Criação manual (sem solicitação)**  
- `POST /abastecimentos` com os campos obrigatórios (`veiculoId`, `combustivelId`, `empresaId`, `quantidade`, `valor_total`, `tipo_abastecimento` etc.).  
- Antes de persistir, o serviço repete as validações de vínculo de combustível, motorista, empresa e capacidade do tanque. Se `cota_id` não for informado, o sistema busca automaticamente a `CotaOrgao` do órgão do veículo, processo ativo e combustível solicitado.

### Passo 4 — Atualizações automáticas após salvar
- **Cota do órgão**: `AbastecimentoService.atualizarCotaOrgao` soma quantidade e valor utilizados, recalcula o restante e garante que nunca fique negativo.  
- **Processo**: `AbastecimentoService.atualizarProcesso` acumula o `valor_total` no processo ativo da prefeitura.
- **VeiculoCotaPeriodo**: a validação garante que o veículo nunca exceda o que foi configurado para o período. Quando a prefeitura precisa refletir a quantidade utilizada dentro do registro periódico, deve atualizar `quantidade_utilizada`/`quantidade_disponivel` conforme a política interna (via script ou rotina específica). O sistema não escreve automaticamente nesses campos; eles continuam servindo como a camada de restrição para novas solicitações, evitando que o volume aprovado ultrapasse o limite pré-configurado.

## Exemplo ponta a ponta
1. Prefeitura consulta `GET /solicitacoes-abastecimento/veiculo/:id/tipo-abastecimento` e confirma que o veículo possui periodicidade mensal com 800 L disponíveis.
2. Prefeitura registra solicitação de 250 L. O serviço aceita porque `quantidade_disponivel = 300 L`.
3. Empresa logada testa `GET /abastecimentos/veiculo/tipo/abastecimento/:veiculoId/250` para verificar se ainda está dentro do período — resposta `excedeu = false`.
4. Empresa chama `POST /abastecimentos/from-solicitacao` com o `solicitacaoId`.  
5. Sistema cria o abastecimento, vincula a CotaOrgao e atualiza o processo. O registro de cota periódica segue válido para novas solicitações até o fim do intervalo.

## Checklist antes de salvar o abastecimento
- Usuário autenticado pertence à empresa informada no payload (guard `EmpresaGuard`).
- Veículo está ativo, pertence à prefeitura esperada e possui `tipo_abastecimento = COTA`.
- `VeiculoCotaPeriodo` ativo cobre a data do abastecimento e ainda possui saldo.
- Combustível está vinculado ao veículo e possui preço ativo para a empresa.
- Quantidade solicitada ≤ capacidade do tanque e não excede `CotaOrgao.restante`.
- Valor total é coerente com `quantidade × preco_empresa ± desconto`.

## Tratamento de erros frequentes
- **403 no POST /abastecimentos**: token não pertence a `ADMIN_EMPRESA`/`COLABORADOR_EMPRESA` ou a empresa do token não é a mesma do payload.
- **409 na conversão de solicitação**: já existe abastecimento vinculado; use `GET /solicitacoes-abastecimento/:id` para conferir o status.
- **Exceções de cota periódica**: revise se foi criado o registro correspondente na tabela `veiculo_cota_periodo` para aquele intervalo específico.

## Referências úteis
- `docs/solicitacao-abastecimento-texto.md`: regras completas das solicitações com exemplos adicionais.
- `docs/abastecimento-textual.md`: detalhes do modelo `Abastecimento` e todas as validações envolvidas.


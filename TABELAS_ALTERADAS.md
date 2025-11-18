# 📋 Tabelas Alteradas - Adição de created_date e modified_date

## ✅ Todas as 37 tabelas foram atualizadas

### Tabelas que receberam created_date E modified_date (35 tabelas):

1. **prefeitura** - Adicionado `created_date` e `modified_date`
2. **usuario** - Adicionado `created_date` e `modified_date`
3. **empresa** - Adicionado `created_date` e `modified_date`
4. **orgao** - Adicionado `created_date` e `modified_date`
5. **contrato** - Adicionado `created_date` e `modified_date` (já tinha createdAt/updatedAt)
6. **combustivel** - Adicionado `created_date` e `modified_date`
7. **categoria** - Adicionado `created_date` e `modified_date`
8. **veiculo** - Adicionado `created_date` e `modified_date`
9. **abastecimento** - Adicionado `created_date` e `modified_date`
10. **cota_orgao** - Adicionado `created_date` e `modified_date`
11. **conta_faturamento_orgao** - Adicionado `created_date` e `modified_date`
12. **processo** - Adicionado `created_date` e `modified_date`
13. **contrato_combustivel** - Adicionado `created_date` e `modified_date` (já tinha createdAt/updatedAt)
14. **veiculo_combustivel** - Adicionado `created_date` e `modified_date`
15. **veiculo_categoria** - Adicionado `created_date` e `modified_date`
16. **veiculo_motorista** - Adicionado `created_date` e `modified_date`
17. **usuario_orgao** - Adicionado `created_date` e `modified_date`
18. **processo_combustivel** - Adicionado `created_date` e `modified_date`
19. **processo_combustivel_consorciado** - Adicionado `created_date` e `modified_date`
20. **processo_prefeitura_consorcio** - Adicionado `created_date` e `modified_date`
21. **processo_prefeitura_combustivel_consorcio** - Adicionado `created_date` e `modified_date`
22. **empresa_preco_combustivel** - Adicionado `created_date` e `modified_date`
23. **aditivo_contrato** - Adicionado `created_date` e `modified_date` (já tinha createdAt/updatedAt)
24. **aditivo_processo** - Adicionado `created_date` e `modified_date` (já tinha createdAt/updatedAt)
25. **anp_semana** - Adicionado `created_date` e `modified_date`
26. **anp_precos_uf** - Adicionado `created_date` e `modified_date`
27. **logs_alteracoes** - Adicionado `created_date` e `modified_date`
28. **notificacao** - Adicionado `created_date` e `modified_date`
29. **onoff** - Adicionado `created_date` e `modified_date`
30. **onoffapp** - Adicionado `created_date` e `modified_date`
31. **parametros_teto** - Adicionado `created_date` e `modified_date`
32. **refresh_token** - Adicionado `created_date` e `modified_date`
33. **solicitacoes_abastecimento** - Adicionado `created_date` e `modified_date` (já tinha created_at/updated_at)
34. **veiculo_cota_periodo** - Adicionado `created_date` e `modified_date`

### Tabelas que receberam apenas modified_date (2 tabelas):

35. **solicitacoes_qrcode_veiculo** - Adicionado apenas `modified_date` (já tinha `data_cadastro`)
36. **qrcode_motorista** - Adicionado apenas `modified_date` (já tinha `data_cadastro`)

### Tabela que já tinha os campos (1 tabela):

37. **motorista** - Já possuía `created_date` e `modified_date` (adicionado anteriormente)

---

## 📝 Resumo

- **Total de tabelas no schema**: 37
- **Tabelas alteradas**: 36
- **Tabelas que já tinham os campos**: 1 (motorista)
- **Tabelas que receberam created_date + modified_date**: 34
- **Tabelas que receberam apenas modified_date**: 2 (já tinham data_cadastro)

## 🔧 Migration Criada

**Arquivo**: `prisma/migrations/20251118165950_add_created_modified_date_all_tables/migration.sql`

A migration adiciona:
- `created_date TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP` em todas as tabelas que não tinham
- `modified_date TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP` em todas as tabelas

**Nota**: O Prisma gerencia automaticamente o `modified_date` através do `@updatedAt`, mas a migration garante que as colunas existam no banco de dados.

## 🚀 Próximos Passos

1. Aplicar a migration em desenvolvimento:
   ```bash
   npx prisma migrate dev
   ```

2. Aplicar a migration em produção:
   ```bash
   npx prisma migrate deploy
   ```

3. Regenerar o Prisma Client:
   ```bash
   npm run prisma:generate
   ```


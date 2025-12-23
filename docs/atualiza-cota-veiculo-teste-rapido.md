# ⚡ Guia Rápido - Teste Upload PDF no Postman

## 🎯 Resumo Rápido

### 1️⃣ Login (Obter Token)

**POST** `http://localhost:3000/auth/login`

**Headers**: Nenhum necessário

**Body** (raw JSON):
```json
{
  "email": "seu-email@exemplo.com",
  "senha": "sua-senha"
}
```

**Copie o `accessToken` da resposta**

---

### 2️⃣ Upload PDF

**POST** `http://localhost:3000/atualiza-cota-veiculo/upload-pdf`

**Headers**:
```
Authorization: Bearer SEU_TOKEN_AQUI
```

**Body** → Selecione **form-data**:

| Key | Type | Value |
|-----|------|-------|
| `file` | **File** | [Selecione seu PDF] |

**Enviar** → ✅ Pronto!

---

## 📊 Resposta de Sucesso

```json
{
  "message": "Processamento concluído com sucesso",
  "veiculos_atualizados": [
    {
      "placa": "ABC1234",
      "veiculoId": 10,
      "id": 25,
      "quantidade_permitida": 100.5,
      "quantidade_utilizada": 45.2,
      "quantidade_disponivel": 55.3
    }
  ],
  "placas_nao_atualizadas": ["XYZ9876"],
  "total_processado": 2,
  "total_atualizado": 1,
  "total_nao_atualizado": 1
}
```

---

## ⚠️ Erros Comuns

| Erro | Causa | Solução |
|------|-------|---------|
| 401 Unauthorized | Token inválido/expirado | Faça login novamente |
| 400 Invalid PDF | Arquivo não é PDF | Verifique o formato do arquivo |
| 404 Prefeitura não encontrada | Nome da prefeitura não existe no banco | Verifique o nome no PDF vs banco |
| 400 Cabeçalho não encontrado | PDF sem tabela com colunas corretas | Verifique se tem: Órgão, Placa, Cota Total, Cota Utilizada |

---

## ✅ Checklist Antes de Enviar

- [ ] PDF contém nome da prefeitura no início
- [ ] PDF tem tabela com colunas: Órgão, Placa, Cota Total, Cota Utilizada
- [ ] Token JWT válido no header Authorization
- [ ] Arquivo é PDF (extensão .pdf)
- [ ] Tamanho do arquivo < 10MB
- [ ] Prefeitura está cadastrada no banco
- [ ] Veículos estão cadastrados e vinculados aos órgãos corretos
- [ ] Veículos têm periodicidade configurada


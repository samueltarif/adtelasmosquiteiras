# Plano de Implementação Revisado — Patch 3.0.1: CRM Operacional (Clientes + Conversão de Leads + Perfil da Empresa)

Este plano consolida todos os refinamentos de engenharia, proteções de segurança, contratos defensivos e casos de teste para a implementação da Fase 3.0.

---

## 1. Decisões Arquiteturais e de Segurança

1. **Proteção de PII na Busca de Clientes:** `CLIENT_PII_SEARCH_TRANSPORT=POST_BODY`. O endpoint `POST /api/admin/crm/clients/search` recebe parâmetros de busca (incluindo telefone, e-mail e documento) no body JSON, impedindo exposição de dados sensíveis na URL. Listagens genéricas não sensíveis utilizam `GET /api/admin/crm/clients`.
2. **Server-Side Warning Gate na Deduplicação Manual:** `MANUAL_CLIENT_DUPLICATE_ENFORCEMENT=SERVER_SIDE_WARNING_GATE`. `POST /api/admin/crm/clients` normaliza os dados e busca duplicatas no servidor. Se encontrar possíveis clientes e não houver `confirmPossibleDuplicate: true`, retorna `HTTP 409 POSSIBLE_DUPLICATE`.
3. **Server-Side Warning Gate na Conversão de Leads:** `LEAD_CONVERSION_DUPLICATE_GATE=SERVER_SIDE_BEFORE_RPC`. `POST /api/admin/crm/leads/:id/convert` executa busca de duplicatas no servidor ANTES de chamar a RPC `convert_lead_to_client_atomic`. Se encontrar e não houver confirmação explícita, retorna `HTTP 409 POSSIBLE_DUPLICATE`.
   - Se o admin escolher `[ Abrir cliente existente ]`: o frontend apenas navega para a ficha do cliente sem mutações no lead e sem chamar a RPC.
   - Se escolher `[ Criar novo cliente mesmo assim ]`: o frontend reenvia a requisição com `confirmPossibleDuplicate: true`, permitindo a chamada à RPC.
4. **Estratégia de Compensação para Endereço Principal:** `PRIMARY_ADDRESS_ATOMIC_SWAP_SUPPORTED=NO`, `PRIMARY_ADDRESS_SWAP_STRATEGY=COMPENSATING_WORKFLOW`. Ao trocar de principal (A -> B), o servidor desmarca A (`is_principal = false`) e depois marca B (`is_principal = true`). Se a etapa B falhar, tenta restaurar A para principal.
5. **Deleção e Arquivamento de Endereço:** `ADDRESS_DELETE_BEHAVIOR=STRICT_RESTRICT_WITH_EXPLICIT_ARCHIVE_OPTION`. Tentativa de deleção física de endereço com histórico responderá com `409 ADDRESS_HAS_HISTORY`, exibindo na UI a opção de arquivamento explícito via `PATCH` (`is_archived: true`).
6. **Auditoria Não-ACID e Minimização de PII:** `CRM_NON_RPC_AUDIT_ATOMICITY=NOT_SUPPORTED_WITH_CURRENT_SCHEMA`, `PHASE_3_ACTIVITY_LOG_PII=MINIMIZED`. O payload do `crm_activity_log` armazena apenas identificadores e campos alterados (`{ changed_fields: ['email', 'telefone_principal'] }`, `{ address_id }`, `{ note_id, categoria }`), sem duplicar conteúdo completo sensível.
7. **Confirmação Explícita de Endereço e Tipo na Conversão:** `LEAD_ADDRESS_CREATION=EXPLICIT_ADMIN_CONFIRMATION`, `LEAD_CLIENT_TYPE_SELECTION=EXPLICIT_ADMIN_CONFIRMATION`. O endereço inicial só é criado se o checkbox correspondente for explicitamente marcado. O tipo de cliente (`pessoa_fisica`, `empresa`, `condominio`) é enviado explicitamente.
8. **Contrato Estrito da 1ª OS:** `RPC_OS_PAYLOAD_CONTRACT=AUDITED_EXACT_SHAPE`. O payload enviado à RPC corresponde exatamente a `{ categoria_operacional, descricao, valor_orcamento, data_prevista }`.
9. **Upload de Logo via Presigned Direct R2:** `COMPANY_LOGO_UPLOAD_TRANSPORT=PRESIGNED_DIRECT_R2`, `COMPANY_LOGO_CROSS_SYSTEM_CONSISTENCY=COMPENSATING_WORKFLOW`. Segue o padrão do projeto: `authorize` (valida extensão/MIME e gera `storage_key` sob `branding/company/`) -> upload direto do browser ao R2 com URL pré-assinada -> `finalize` (valida magic bytes, tamanho <= 5MB e atualiza `company_profile`). Se o banco falhar, compensa deletando o novo objeto R2. A logo estática `/images/logo_adt_telas_nova.png` nunca é deletada.
10. **Autoridade de Timestamp no Servidor:** `CLIENT_ARCHIVE_TIMESTAMP_AUTHORITY=SERVER`. O timestamp `archived_at` é gerado exclusivamente no servidor.
11. **CSRF Confirmado:** `ADMIN_CSRF_PROTECTION=CONFIRMED` em todos os endpoints mutáveis.
12. **Zero Mutações em Produção:** `PRODUCTION_TEST_MUTATIONS=0`.

---

## 2. Mapa Completo de Endpoints Server-Side

### Clientes
- `POST /api/admin/crm/clients/search`: Busca geral paginada por nome, telefone, email ou documento via POST body.
- `GET /api/admin/crm/clients`: Listagem paginada padrão com sort allowlist (`nome`, `created_at`, `updated_at`, `tipo_cliente`, `status`).
- `POST /api/admin/crm/clients/search-duplicates`: Verificação rápida de duplicatas por telefone/email/CPF.
- `POST /api/admin/crm/clients`: Criação manual com verificação defensiva de duplicatas (Warning Gate).
- `GET /api/admin/crm/clients/:id`: Ficha cadastral e endereços do cliente.
- `PATCH /api/admin/crm/clients/:id`: Edição e arquivamento com autoridade de timestamp server-side.
- `GET /api/admin/crm/clients/:id/activity`: Histórico de atividades paginado (max pageSize 100).
- `GET /api/admin/crm/clients/:id/notes`: Notas paginadas.
- `POST /api/admin/crm/clients/:id/notes`: Criação de nota com log minimizado.
- `GET /api/admin/crm/clients/:id/work-orders`: Listagem paginada de ordens de serviço.

### Endereços
- `POST /api/admin/crm/clients/:id/addresses`: Criação de endereço com swap de principal.
- `PATCH /api/admin/crm/clients/:id/addresses/:addressId`: Edição ou arquivamento explícito.
- `DELETE /api/admin/crm/clients/:id/addresses/:addressId`: Deleção física ou 409 se houver histórico.

### Conversão de Leads
- `POST /api/admin/crm/leads/:id/convert`: Validação de duplicatas antes da RPC, chamada de `convert_lead_to_client_atomic` e retorno de identificadores gerados.

### Perfil da Empresa
- `GET /api/admin/configuracoes/empresa`: Leitura do singleton com resolução de `logo_url`.
- `PATCH /api/admin/configuracoes/empresa`: Atualização com allowlist estrita e normalização de strings vazias para `NULL`.
- `POST /api/admin/configuracoes/empresa/logo/authorize`: Gera URL pré-assinada de upload direto para R2.
- `POST /api/admin/configuracoes/empresa/logo/finalize`: Validação de magic bytes e atualização no banco com compensação.
- `POST /api/admin/configuracoes/empresa/logo/restore-default`: Restauração da logo estática padrão.

---

## 3. Componentes e Telas

```text
app/
├── layouts/
│   └── admin.vue                                 [MODIFY: Menus Clientes e Configurações]
├── pages/
│   └── admin/
│       ├── clientes/
│       │   ├── index.vue                         [NEW: Listagem de Clientes com busca POST]
│       │   ├── novo.vue                          [NEW: Cadastro Manual Rápido com Duplicate Warning]
│       │   └── [id].vue                          [NEW: Ficha do Cliente com Sub-recursos Paginados]
│       └── configuracoes/
│           └── empresa.vue                       [NEW: Perfil da Empresa, Logo e Live Preview]
└── components/
    └── admin/
        ├── LeadJourneyDrawer.vue                 [MODIFY: Botão Converter/Abrir Cliente]
        ├── crm/
        │   ├── ClientListTable.vue               [NEW: Tabela Desktop com Sort Allowlist]
        │   ├── ClientListCards.vue               [NEW: Cards Responsivos Mobile]
        │   ├── ClientEditModal.vue               [NEW: Modal/Sheet de Edição]
        │   ├── ClientArchiveModal.vue            [NEW: Confirmação de Arquivamento]
        │   ├── ClientAddressManager.vue          [NEW: Gerenciador de Endereços com Swap e 409 Handling]
        │   ├── ClientNotesManager.vue            [NEW: Gerenciador Paginado de Notas]
        │   ├── ClientActivityTimeline.vue        [NEW: Timeline Paginada com PII Minimizada]
        │   ├── ClientWorkOrdersReadOnly.vue      [NEW: Lista Paginada de OSs]
        │   ├── LeadConversionModal.vue           [NEW: Wizard de Conversão com Duplicate Gate]
        │   └── ClientDuplicateAlert.vue          [NEW: Alerta de Clientes Parecidos]
        └── company/
            ├── CompanyLogoUploader.vue           [NEW: Upload Presigned Direct R2 + Compensação]
            └── CompanyDocumentPreview.vue        [NEW: Live Preview do Cabeçalho]
```

---

## 4. Plano de Testes Locais Obrigatórios (51 Casos)

Todos os testes de mutação serão executados no ambiente **PostgreSQL Docker Local**:

### Clientes (Testes 1 a 9)
1. Criação de cliente normal.
2. Nome inválido (< 2 chars) -> 400.
3. Telefone inválido -> 400.
4. Duplicata sem flag de confirmação -> 409 `POSSIBLE_DUPLICATE`.
5. Duplicata com `confirmPossibleDuplicate: true` -> Sucesso.
6. Edição de dados cadastrais.
7. Arquivamento de cliente com `archived_at` gerado no servidor.
8. Reativação de cliente (`is_archived: false`, `archived_at: null`).
9. Registro de atividade `client_created` gravado.

### Endereços (Testes 10 a 17)
10. Criação de endereço secundário.
11. Criação de primeiro endereço marcado como principal.
12. Troca de endereço principal com sucesso.
13. Falha induzida na troca de principal.
14. Compensação restaura o endereço principal anterior.
15. Deleção física de endereço sem histórico.
16. Deleção de endereço vinculado a OS -> 409 `ADDRESS_HAS_HISTORY`.
17. Arquivamento explícito de endereço com histórico via PATCH.

### Notas & Atividade (Testes 18 a 21)
18. Criação de anotação de atendimento.
19. Categoria inválida de nota rejeitada pelo schema.
20. Carregamento paginado de notas.
21. Atividade `note_added` gravada sem duplicar o texto completo no payload JSON.

### Conversão de Leads (Testes 22 a 31)
22. Conversão normal de lead sem OS.
23. Conversão de lead com 1ª OS criada e valores vinculados.
24. Conversão sem OS desmarcando o checkbox.
25. Possível duplicata detectada antes da chamada RPC -> 409.
26. Confirmação explícita de duplicata -> RPC invocada.
27. Ação de abrir cliente existente -> zero mutação no lead e zero RPC.
28. Prevenção de clique duplo (idempotência).
29. Tentativa de conversão de lead já convertido -> rejeição clara.
30. Mapeamento de erros de domínio da RPC.
31. Endereço não criado quando o lead possui apenas cidade/bairro a menos que o admin confirme.

### Perfil da Empresa (Testes 32 a 37)
32. Leitura GET do perfil da empresa com `logo_url` resolvida.
33. Edição PATCH de campos corporativos com allowlist.
34. Campos opcionais vazios convertidos para `NULL`.
35. CNPJ inválido rejeitado.
36. E-mail inválido rejeitado.
37. Website com formato inválido rejeitado.

### Logo & R2 (Testes 38 a 46)
38. Exibição da logo estática padrão.
39. Upload válido via URL pré-assinada e finalização.
40. Rejeição de arquivo com MIME inválido.
41. Rejeição de arquivo com magic bytes divergentes da extensão.
42. Rejeição de arquivo maior que 5 MB.
43. Falha de upload no R2 tratada defensivamente.
44. Falha no DB após upload no R2 aciona compensação (deleção do objeto R2).
45. Restauração da logo estática padrão com limpeza do objeto R2 anterior.
46. Falha na limpeza de logo R2 antiga não impede o salvamento do perfil.

### Segurança & Acessibilidade (Testes 47 a 51)
47. Requisição sem token -> 401.
48. Usuário inativo ou não-admin -> 403.
49. Falha de validação CSRF Same-Origin -> 403.
50. Tentativa de mutação direta do navegador ao Supabase bloqueada por RLS.
51. Ausência de PII em logs de console e eventos de telemetria.

---

## 5. Documentação Centralizada
- Produção de um único arquivo ao final: [`docs/CRM_PHASE_3_IMPLEMENTATION.md`](file:///d:/sicons/ADT/docs/CRM_PHASE_3_IMPLEMENTATION.md) cobrindo as 19 partes numeradas (Parte 0 a Parte 18).

# 01 — DECISÕES ARQUITETURAIS DEFINITIVAS (ADR)

**Status:** APROVADO PARA MODELAGEM (FASE 1.1)  
**Data:** 26 de Agosto de 2026  
**Escopo:** Registro formal de decisões de arquitetura de software e dados (Architecture Decision Records) que regem o novo módulo CRM.

---

## ADR 01: Conversão Atômica e Idempotente de Lead → Cliente

- **Contexto:** A conversão de um Lead em Cliente pode envolver a criação de cliente, endereço inicial, primeira OS, associação de itens e vinculação de mídias. Se executada em múltiplos passos HTTP desacoplados, uma falha de rede intermediária geraria estado parcial corrompido ou clientes duplicados em caso de clique repetido.
- **Alternativas Avaliadas:**
  1. *Passos HTTP independentes pelo frontend:* Alto risco de inconsistência e clientes órfãos.
  2. *Transação Atômica via Backend BFF / RPC:* Operação única com controle de transação (`BEGIN...COMMIT / ROLLBACK`).
- **Decisão:** **Transação Atômica no Servidor.**
  - A conversão é executada em uma única transação garantida pelo backend.
  - A tabela `clients` terá a coluna `lead_id UUID NULL` com índice parcial `CREATE UNIQUE INDEX unq_clients_lead_id ON public.clients(lead_id) WHERE lead_id IS NOT NULL`.
  - **Regra:** Um lead pode originar no máximo um cliente. Cliques repetidos ou concorrentes são bloqueados pela constraint única parcial. Clientes manuais mantêm `lead_id = NULL`.
- **Impacto:** Zero risco de duplicidade de clientes a partir do mesmo lead e rollback total automático em caso de qualquer falha.

---

## ADR 02: Cliente com Endereços Opcionais (0:N)

- **Contexto:** Na Fase 1 cogitou-se a obrigatoriedade de 1 endereço por cliente. No entanto, clientes oriundos de WhatsApp, indicações ou leads parciais frequentemente informam apenas o bairro ou solicitam orçamento preliminar sem endereço completo.
- **Decisão:** **Cardinalidade `CLIENT (1) ── (0:N) CLIENT_ADDRESSES`.**
  - O cliente pode existir sem nenhum endereço cadastrado.
  - Uma Ordem de Serviço pode ser aberta em fase de pré-orçamento com `address_id = NULL`, tornando-se obrigatória apenas na etapa de agendamento de visita técnica ou instalação.
- **Impacto:** Flexibilidade comercial sem necessidade de criar endereços "falsos" ou incompletos para satisfazer chaves estrangeiras.

---

## ADR 03: Desacoplamento da OS em Relação ao Catálogo de Marketing

- **Contexto:** O site possui 12 chaves canônicas de serviços (`service_key`) para SEO e conversão. Porém, a operação real de campo executa manutenções, trocas de tela, retornos, ajustes, instalações especiais e serviços combinados.
- **Decisão:** **A camada operacional é independente das 12 chaves.**
  - A OS e seus itens possuem descrição e categoria operacional livre/padronizada (`categoria_operacional: 'tela_mosquiteira', 'rede_protecao', 'vidracaria', 'manutencao', 'especial'`).
  - O campo `service_key` do catálogo público existe apenas como referência opcional de marketing/atribuição.
- **Impacto:** A operação não fica engessada caso surjam novos serviços técnicos que não existam como landing pages no site.

---

## ADR 04: Estrutura da OS com Múltiplos Itens (1:N) e Medições no Item

- **Contexto:** Um cliente frequentemente contrata múltiplos tipos de serviços em uma única contratação (ex: 3 Telas para Janela + 1 Porta Pet Screen + 1 Rede de Sacada).
- **Decisão:** **Adoção obrigatória de `WORK_ORDERS (1) ── (1:N) WORK_ORDER_ITEMS`.**
  - Cada item representa uma linha do serviço contratado com quantidade, preço unitário, total e categoria.
  - A tabela de medições `work_order_measurements` vincula-se diretamente ao `work_order_item_id` (1:N), permitindo que cada vão pertença ao produto correto.
- **Impacto:** Clareza absoluta na ordem de produção, cálculo correto de metragem e possibilidade de prazos de garantia diferenciados por item.

---

## ADR 05: Garantias Flexíveis e Separação de Estado Temporal vs Operacional

- **Contexto:** Redes de proteção possuem garantia típica de 5 anos (60 meses), enquanto telas mosquiteiras possuem de 1 a 2 anos. Armazenar colunas estáticas como "Vigente" ou "Vencida" gera inconsistência à medida que o tempo passa sem que o banco seja atualizado.
- **Decisão:** **Garantia por Item de OS + Separação Temporal/Operacional.**
  - A garantia aponta para `work_order_item_id` (com suporte opcional a `work_order_id` para coberturas globais via constraint de exclusão).
  - **Estado Temporal (Calculado em tempo de consulta):** `Vigente` (hoje <= término), `Vencendo` (término - hoje <= 30 dias), `Vencida` (hoje > término).
  - **Estado Operacional (Persistido no banco):** `normal`, `acionada`, `em_atendimento`, `resolvida`, `cancelada`.
- **Impacto:** O banco nunca fica defasado com relação à data corrente e o operador gerencia apenas o fluxo de atendimento em caso de acionamento.

---

## ADR 06: Unidade Canônica de Medidas em Milímetros (mm)

- **Contexto:** Permitir que cada medição informe uma unidade diferente (`m`, `cm`, `mm`) gera erros graves de conversão e cálculo de área.
- **Decisão:** **Persistência canônica estrita em Milímetros (`largura_mm`, `altura_mm` inteiros).**
  - O frontend permite entrada amigável em metros ou centímetros (ex: `1,20 m`), convertendo automaticamente para `1200 mm` no payload enviado à API.
- **Impacto:** Cálculos matemáticos de área ($m^2 = \frac{\text{largura\_mm} \times \text{altura\_mm}}{1.000.000}$), conferência e corte de alumínio 100% livres de erros de arredondamento de ponto flutuante.

---

## ADR 07: Pagamentos Reais Desacoplados (1:N) sem Complexidade de ERP

- **Contexto:** Uma OS raramente é paga em parcela única sem sinal. Comumente há entrada de 50% no pedido e 50% na conclusão da instalação.
- **Decisão:** **Criação da entidade `work_order_payments` (1:N).**
  - Registra cada transação financeira real com valor, data de pagamento, método (`pix`, `cartao_credito`, `dinheiro`, `boleto`) e nota.
  - `valor_pago` é derivado da soma dos pagamentos válidos (não cancelados).
  - `status_pagamento` é calculado: `Pendente` (pago = 0), `Parcial` (0 < pago < total), `Pago` (pago >= total).
  - Cancelamentos de lançamento gravam `cancelled_at`, `cancelled_by` e `cancellation_reason` sem apagar o registro físico.
- **Impacto:** Controle financeiro confiável sem o peso de um ERP bancário complexo.

---

## ADR 08: Idempotência de Notificações com Reserva Prévia (Reservation-Before-Send)

- **Contexto:** Disparadores de cron ou retries de rede concorrentes podem tentar enviar o mesmo alerta simultaneamente, causando envio de e-mails duplicados se a unicidade for validada apenas após o envio.
- **Decisão:** **Padrão de Reserva Atômica Obrigatório em `notification_deliveries`.**
  1. O worker calcula a `idempotency_key` determinística baseada na regra, entidade, e-mail e janela temporal.
  2. O worker tenta inserir a linha em `notification_deliveries` com `status: 'processing'` e `locked_until = now() + interval '5 minutes'`.
  3. Apenas o processo que obtiver sucesso na inserção (vencendo a constraint `UNIQUE(idempotency_key)`) ganha a posse do envio.
  4. Dispara o SMTP:
     - Sucesso → atualiza para `status: 'sent'`, `sent_at = now()`.
     - Falha → atualiza para `status: 'failed'`, `last_error = ...`.
- **Impacto:** Impossibilidade matemática de envio concorrente duplicado.

---

## ADR 09: Histórico Híbrido: `crm_activity_log` Auditável + `crm_notes` Humanas

- **Contexto:** Sobrescrever campos como no modelo legado de leads destrói a trilha de auditoria. Por outro lado, replicar o banco inteiro em JSON gera volume desnecessário e consultas lentas.
- **Decisão:** **Abordagem Híbrida.**
  - **`crm_activity_log`:** Grava eventos transacionais chave do sistema (mudanças de status de OS, reagendamentos, confirmações de pagamento, conversão de lead) com autor (`actor_id`), timestamp, entidade e diff `old_values`/`new_values`.
  - **`crm_notes`:** Grava notas humanas e anotações de atendimento (ligações, mensagens, preferências de horário do cliente) com autor e timestamp.
- **Impacto:** Rastreabilidade corporativa completa e timeline de cliente fluida.

---

## ADR 10: Responsáveis Operacionais sem Login no Sistema na V1 (`crm_staff`)

- **Contexto:** Técnicos e instaladores de campo não precisam, na V1, de contas completas em `auth.users` com painel próprio. Mas usar texto livre geraria inconsistências de filtros.
- **Decisão:** **Tabela `public.crm_staff` gerenciada pelo Administrador.**
  - Armazena nome, telefone, e-mail, função (`instalador`, `vistoriador`, `atendente`) e flag `is_active`.
  - Permite seleção padronizada em Comboboxes e filtros de agenda sem criar credenciais de acesso ao painel.
- **Impacto:** Organização da equipe técnica sem sobrecarga de segurança ou gestão de senhas na primeira versão.

# 13 — DECISÕES ESTRATÉGICAS E ARQUITETURAIS PENDENTES DE REVISÃO HUMANA

> [!IMPORTANT]
> **DECISÕES DA FASE 1 RESOLVIDAS NA FASE 1.1:**
> As 6 decisões fundamentais deste documento foram formalizadas e resolvidas na modelagem definitiva da Fase 1.1. Para o status atualizado e as decisões de negócio restantes, consulte: [docs/CRM_DATA_MODEL/17_OPEN_DECISIONS.md](../CRM_DATA_MODEL/17_OPEN_DECISIONS.md) e [docs/CRM_DATA_MODEL/00_INDEX.md](../CRM_DATA_MODEL/00_INDEX.md).

**Status:** HISTÓRICO / RESOLVIDO NA FASE 1.1  
**Data da Auditoria:** 26 de Agosto de 2026  
**Escopo:** Questões fundamentais levantadas originalmente na Fase 1.

---

## 1. Decisão 01: Identificação do Cliente e Obrigatoriedade de CPF/CNPJ

- **Por que importa:** Determina as restrições de schema (`NOT NULL`, validações de formato) e define como clientes residenciais, empresas e condomínios serão registrados.
- **Opções:**
  - *Opção A:* `cpf_cnpj` estritamente obrigatório com validação de dígitos verificadores.
  - *Opção B (Recomendada):* `cpf_cnpj` opcional no primeiro contato/orçamento, podendo ser preenchido posteriormente no fechamento da OS. Permite flag `tipo_pessoa: 'PF' | 'PJ' | 'CONDOMINIO'`.
- **Recomendação Técnica:** **Opção B.** No mercado de telas e redes, muitos clientes pedem orçamento apenas com Nome, Telefone e Bairro. Exigir CPF no primeiro contato cria atrito e inviabiliza o cadastro rápido pelo WhatsApp.
- **Impacto no Banco:** Coluna `cpf_cnpj VARCHAR(20) NULL` com validação condicional no backend caso seja fornecido.

---

## 2. Decisão 02: Política de Deduplicação no Cadastro Manual de Clientes

- **Por que importa:** Evita criação de clientes duplicados quando o mesmo cliente entra em contato por WhatsApp, telefone e formulário em momentos diferentes.
- **Opções:**
  - *Opção A:* Constraint `UNIQUE(telefone)` rígida no banco (bloqueia inserção se o telefone já existir).
  - *Opção B (Recomendada):* Validação inteligente no backend com aviso ao operador. Se o telefone/e-mail já existir, o sistema exibe a ficha do cliente encontrado e pergunta: *"Deseja abrir nova OS para este cliente ou criar novo registro?"*.
- **Recomendação Técnica:** **Opção B.** Em condomínios ou residências familiares, duas pessoas diferentes (ex: marido e esposa ou síndico e morador) podem compartilhar o mesmo telefone fixo ou e-mail de contato.
- **Impacto no Banco:** Índice de busca `idx_clients_telefone` sem `UNIQUE` forçada no banco, com verificação proativa no frontend/backend.

---

## 3. Decisão 03: Modelo de Técnicos e Responsáveis Operacionais

- **Por que importa:** Define se os instaladores e vistoriadores terão contas de usuário no sistema para acessar o painel ou se serão apenas nomes cadastrados para atribuição.
- **Opções:**
  - *Opção A:* Campo de texto livre / seleção de lista (`responsavel_nome: VARCHAR(100)`). Apenas a equipe administrativa do escritório acessa o painel.
  - *Opção B:* Tabela `public.installers` / `public.technicians` vinculada a `auth.users` com permissão restrita para ver apenas a sua própria agenda no celular.
- **Recomendação Técnica:** **Iniciar com Opção A na V1** (lista de nomes gerenciada pelo admin) e evoluir para Opção B em fase futura se houver necessidade de os técnicos darem baixa pelo próprio login.
- **Impacto no Banco:** Campo `responsavel_nome VARCHAR(100)` na OS e na Agenda.

---

## 4. Decisão 04: Destinatários dos Disparos Automáticos de Agenda e Garantia

- **Por que importa:** Define o escopo de envio do motor SMTP e as regras de comunicação externa.
- **Opções:**
  - *Opção A:* Disparos enviados **exclusivamente para a equipe interna** (`LEAD_NOTIFICATION_EMAIL` e administradores).
  - *Opção B:* Disparos para a equipe interna + e-mails automáticos transacionais para o **cliente final** (ex: lembrete de visita no dia anterior e aviso de término de garantia com cupom de renovação).
- **Recomendação Técnica:** **Opção B com chave seletiva por regra.** O sistema deve permitir configurar por toggle no painel se a notificação é `INTERNA_APENAS` ou `INTERNA_E_CLIENTE`.
- **Impacto no Backend:** Template bifurcado (versão interna operacional vs versão cliente profissional).

---

## 5. Decisão 05: Provedor de Agendamento do Cron em Produção

- **Por que importa:** Determina a infraestrutura externa responsável por disparar a verificação diária das 09:00 SP.
- **Opções:**
  - *Opção A (Recomendada para Vercel):* **Vercel Cron Jobs** via arquivo `vercel.json` chamando `POST /api/cron/process-scheduled-tasks` com header `CRON_SECRET`.
  - *Opção B (Recomendada para Supabase):* Extensão nativa `pg_cron` no Supabase executando chamada HTTP ou procedure SQL.
  - *Opção C:* GitHub Actions com cron schedule de periodicidade.
- **Recomendação Técnica:** **Opção A (Vercel Cron)**, pois todo o projeto já está hospedado e integrado na Vercel, permitindo logs centralizados e zero dependência de extensões adicionais no PostgreSQL.
- **Impacto na Infraestrutura:** Criação de `vercel.json` com token `CRON_SECRET` no `runtimeConfig`.

---

## 6. Decisão 06: Profundidade do Controle Financeiro da Ordem de Serviço

- **Por que importa:** Define se a OS será apenas um registro de valor de faturamento ou se funcionará como módulo financeiro com controle de parcelas e meios de pagamento.
- **Opções:**
  - *Opção A (Recomendada para V1):* Controle simplificado na OS: `valor_total`, `valor_pago`, `status_pagamento: 'Pendente' | 'Parcial' | 'Pago'` e `forma_pagamento: 'Pix' | 'Cartao_Credito' | 'Dinheiro' | 'Boleto'`.
  - *Opção B:* Tabela complexa de contas a receber com parcelamento, emissão de boletos e conciliação bancária.
- **Recomendação Técnica:** **Opção A.** Mantém o sistema leve, focado na operação ágil de instalação, sem a complexidade de um ERP financeiro pesado.
- **Impacto no Banco:** 4 colunas financeiras na tabela `public.work_orders`.

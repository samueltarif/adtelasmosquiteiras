BEGIN;

CREATE TABLE public.finance_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  kind text NOT NULL CHECK (kind IN ('payable', 'receivable')),
  description text NOT NULL CHECK (length(trim(description)) BETWEEN 2 AND 180),
  counterpart text NOT NULL CHECK (length(trim(counterpart)) BETWEEN 2 AND 180),
  category text NOT NULL DEFAULT '' CHECK (length(category) <= 80),
  amount_cents bigint NOT NULL CHECK (amount_cents BETWEEN 1 AND 99999999999),
  due_date date NOT NULL CHECK (due_date BETWEEN '2000-01-01' AND '2100-12-31'),
  status text NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'settled', 'cancelled')),
  settled_date date,
  payment_method text CHECK (payment_method IN ('pix', 'boleto', 'transferencia', 'dinheiro', 'cartao', 'outro')),
  notes text NOT NULL DEFAULT '' CHECK (length(notes) <= 2000),
  version integer NOT NULL DEFAULT 1 CHECK (version > 0),
  actor_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK ((status = 'settled' AND settled_date IS NOT NULL AND payment_method IS NOT NULL) OR (status <> 'settled' AND settled_date IS NULL AND payment_method IS NULL))
);
CREATE INDEX finance_entries_due ON public.finance_entries(due_date, id) WHERE status = 'open';
CREATE INDEX finance_entries_kind_status ON public.finance_entries(kind, status, due_date, id);

CREATE TABLE public.finance_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  entry_id uuid NOT NULL REFERENCES public.finance_entries(id),
  actor_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  action text NOT NULL,
  before_data jsonb,
  after_data jsonb NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX finance_history_entry ON public.finance_history(entry_id, created_at DESC);

CREATE FUNCTION public.finance_entry_version() RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  NEW.version := OLD.version + 1;
  NEW.updated_at := clock_timestamp();
  RETURN NEW;
END $$;
CREATE TRIGGER finance_entry_version BEFORE UPDATE ON public.finance_entries FOR EACH ROW EXECUTE FUNCTION public.finance_entry_version();
CREATE FUNCTION public.finance_entry_history() RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  INSERT INTO public.finance_history(entry_id, actor_id, action, before_data, after_data)
  VALUES (NEW.id, NEW.actor_id, CASE WHEN TG_OP = 'INSERT' THEN 'created' WHEN OLD.status <> NEW.status THEN NEW.status ELSE 'updated' END,
    CASE WHEN TG_OP = 'INSERT' THEN NULL ELSE to_jsonb(OLD) END, to_jsonb(NEW));
  RETURN NEW;
END $$;
CREATE TRIGGER finance_entry_history AFTER INSERT OR UPDATE ON public.finance_entries FOR EACH ROW EXECUTE FUNCTION public.finance_entry_history();

CREATE TABLE public.finance_settings (
  id integer PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  recipient text NOT NULL DEFAULT 'vendas.adtelaseredes@gmail.com' CHECK (length(recipient) BETWEEN 5 AND 254 AND recipient !~ '[\r\n,;<> ]'),
  enabled boolean NOT NULL DEFAULT true,
  days_before integer NOT NULL DEFAULT 3 CHECK (days_before BETWEEN 1 AND 30),
  version integer NOT NULL DEFAULT 1,
  updated_at timestamptz NOT NULL DEFAULT now(),
  last_run_at timestamptz
);
INSERT INTO public.finance_settings(id) VALUES (1);

CREATE TABLE public.finance_reminders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  entry_id uuid NOT NULL REFERENCES public.finance_entries(id),
  due_date date NOT NULL,
  stage text NOT NULL CHECK (stage IN ('upcoming', 'due')),
  recipient text NOT NULL,
  run_id uuid NOT NULL,
  status text NOT NULL DEFAULT 'processing' CHECK (status IN ('processing', 'sent', 'uncertain')),
  created_at timestamptz NOT NULL DEFAULT now(),
  sent_at timestamptz,
  error text,
  UNIQUE(entry_id, due_date, stage)
);
CREATE INDEX finance_reminders_run ON public.finance_reminders(run_id);

-- Todos os dados e funções ficam acessíveis somente ao backend autenticado.
ALTER TABLE public.finance_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.finance_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.finance_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.finance_reminders ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.finance_entries, public.finance_history, public.finance_settings, public.finance_reminders FROM PUBLIC, anon, authenticated;
GRANT SELECT, INSERT, UPDATE ON public.finance_entries, public.finance_settings, public.finance_reminders TO service_role;
GRANT SELECT, INSERT ON public.finance_history TO service_role;

CREATE FUNCTION public.finance_overview(p_kind text DEFAULT '', p_status text DEFAULT '', p_search text DEFAULT '', p_from text DEFAULT '', p_to text DEFAULT '', p_page integer DEFAULT 1)
RETURNS jsonb LANGUAGE sql STABLE SET search_path = public AS $$
  WITH filtered AS (
    SELECT * FROM public.finance_entries
    WHERE (p_kind = '' OR kind = p_kind)
      AND (p_status = '' OR status = p_status OR (p_status = 'overdue' AND status = 'open' AND due_date < (now() AT TIME ZONE 'America/Sao_Paulo')::date))
      AND (p_search = '' OR strpos(lower(description || ' ' || counterpart), lower(p_search)) > 0)
      AND (p_from = '' OR due_date >= nullif(p_from, '')::date)
      AND (p_to = '' OR due_date <= nullif(p_to, '')::date)
  ), page_rows AS (
    SELECT * FROM filtered ORDER BY due_date, id LIMIT 25 OFFSET (greatest(p_page, 1) - 1) * 25
  )
  SELECT jsonb_build_object(
    'entries', COALESCE((SELECT jsonb_agg(to_jsonb(p) ORDER BY due_date, id) FROM page_rows p), '[]'::jsonb),
    'total', (SELECT count(*) FROM filtered),
    'today', (now() AT TIME ZONE 'America/Sao_Paulo')::date,
    'summary', (SELECT jsonb_build_object(
      'payable_open', COALESCE(sum(amount_cents) FILTER (WHERE kind = 'payable' AND status = 'open'), 0),
      'receivable_open', COALESCE(sum(amount_cents) FILTER (WHERE kind = 'receivable' AND status = 'open'), 0),
      'payable_overdue', COALESCE(sum(amount_cents) FILTER (WHERE kind = 'payable' AND status = 'open' AND due_date < (now() AT TIME ZONE 'America/Sao_Paulo')::date), 0),
      'receivable_overdue', COALESCE(sum(amount_cents) FILTER (WHERE kind = 'receivable' AND status = 'open' AND due_date < (now() AT TIME ZONE 'America/Sao_Paulo')::date), 0)
    ) FROM public.finance_entries)
  );
$$;

-- A reserva e a deduplicação são atômicas no banco, inclusive entre execuções concorrentes.
-- Um aviso na janela de antecedência e um no vencimento (ou no próximo processamento, se já vencido).
CREATE FUNCTION public.claim_finance_reminders(p_run_id uuid)
RETURNS jsonb LANGUAGE plpgsql SET search_path = public AS $$
DECLARE result jsonb; today_sp date := (now() AT TIME ZONE 'America/Sao_Paulo')::date;
BEGIN
  UPDATE public.finance_settings SET last_run_at = now() WHERE id = 1;
  UPDATE public.finance_reminders SET status = 'uncertain', error = 'Execução interrompida; recebimento do e-mail precisa ser conferido.'
    WHERE status = 'processing' AND created_at < now() - interval '15 minutes';
  WITH eligible AS (
    SELECT e.id, e.due_date, s.recipient, CASE WHEN e.due_date <= today_sp THEN 'due' ELSE 'upcoming' END AS stage
    FROM public.finance_entries e CROSS JOIN public.finance_settings s
    WHERE s.id = 1 AND s.enabled AND e.status = 'open' AND e.due_date <= today_sp + s.days_before
      AND NOT EXISTS (SELECT 1 FROM public.finance_reminders r WHERE r.entry_id = e.id AND r.due_date = e.due_date AND r.stage = CASE WHEN e.due_date <= today_sp THEN 'due' ELSE 'upcoming' END)
    ORDER BY e.due_date, e.id LIMIT 500
    FOR UPDATE OF e SKIP LOCKED
  ), claimed AS (
    INSERT INTO public.finance_reminders(entry_id, due_date, recipient, stage, run_id)
    SELECT id, due_date, recipient, stage, p_run_id FROM eligible
    ON CONFLICT (entry_id, due_date, stage) DO NOTHING
    RETURNING *
  )
  SELECT COALESCE(jsonb_agg(jsonb_build_object('reminder_id', c.id, 'entry_id', e.id, 'kind', e.kind, 'description', e.description,
    'counterpart', e.counterpart, 'amount_cents', e.amount_cents, 'due_date', e.due_date, 'recipient', c.recipient, 'stage', c.stage)), '[]'::jsonb)
    INTO result FROM claimed c JOIN public.finance_entries e ON e.id = c.entry_id;
  RETURN jsonb_build_object('entries', result, 'today', today_sp);
END $$;

REVOKE ALL ON FUNCTION public.finance_entry_version(), public.finance_entry_history(), public.finance_overview(text,text,text,text,text,integer), public.claim_finance_reminders(uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.finance_entry_version(), public.finance_entry_history(), public.finance_overview(text,text,text,text,text,integer), public.claim_finance_reminders(uuid) TO service_role;
COMMIT;

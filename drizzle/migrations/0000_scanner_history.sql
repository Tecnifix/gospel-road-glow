CREATE TABLE public.scanner_history (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 user_id uuid NOT NULL,
 vehicle text NOT NULL DEFAULT 'Meu veículo' CHECK (char_length(vehicle) BETWEEN 1 AND 80),
 mode text NOT NULL CHECK (mode IN ('usb','demo')),
 items jsonb NOT NULL CHECK (jsonb_typeof(items) = 'array'),
 created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, DELETE ON public.scanner_history TO authenticated;
GRANT ALL ON public.scanner_history TO service_role;
ALTER TABLE public.scanner_history ENABLE ROW LEVEL SECURITY;
CREATE POLICY scanner_read_own ON public.scanner_history FOR SELECT TO authenticated USING ((select auth.uid()) = user_id);
CREATE POLICY scanner_insert_own ON public.scanner_history FOR INSERT TO authenticated WITH CHECK ((select auth.uid()) = user_id);
CREATE POLICY scanner_delete_own ON public.scanner_history FOR DELETE TO authenticated USING ((select auth.uid()) = user_id);
CREATE INDEX scanner_history_user_date ON public.scanner_history (user_id, created_at DESC);
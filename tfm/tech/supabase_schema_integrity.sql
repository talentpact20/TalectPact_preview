-- Corrector v2 · integridad de las evaluaciones.
-- Ejecutar en Supabase → SQL Editor después de supabase_schema.sql.
--
-- `integrity` guarda dos cosas distintas, y conviene no confundirlas:
--   · verified / evaluatorVersion / injectionSignals: los decide el SERVIDOR al
--     comprobar los recibos firmados del corrector. Son prueba.
--   · risk / camera / tabSwitches / pasteBlocked…: los informa el NAVEGADOR.
--     Son indicio para la revisión humana, nunca motivo de descarte automático.
alter table evaluations add column if not exists integrity jsonb;

create index if not exists idx_evaluations_verified
  on evaluations (((integrity->>'verified')::boolean));

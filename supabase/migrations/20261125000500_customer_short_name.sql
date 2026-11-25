-- Kurzname für den Stundenzettel (z. B. „Donautal“ statt „Wohnbau Donautal GmbH“).
-- Ohne Kurzname kürzt die App Rechtsformen (GmbH, KG, …) automatisch.
alter table public.customers
  add column short_name text check (short_name is null or length(trim(short_name)) between 1 and 40);

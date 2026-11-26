-- Berufsschultag: Azubis tragen die Schulzeiten selbst als Arbeitstag ein (zählt als Arbeitszeit,
-- braucht keinen Arbeitsbericht). Im Stundenzettel erscheint „Schule“.
alter table public.arbeitstage add column if not exists berufsschule boolean not null default false;

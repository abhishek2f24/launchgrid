-- Fixes the uniqueness constraint on early_access_signups.
--
-- 0043 created a unique index on the EXPRESSION lower(email), source. Postgres
-- cannot resolve `ON CONFLICT (email, source)` against an expression index —
-- it raises "there is no unique or exclusion constraint matching the ON
-- CONFLICT specification" — so every signup failed with a 500 while the table
-- itself looked perfectly healthy.
--
-- Replaced with a plain unique constraint over the two columns. Case is now
-- normalised in the API route before insert, which is where it belongs: the
-- database should not be quietly rewriting the value it was handed.

DROP INDEX IF EXISTS early_access_email_source_idx;

ALTER TABLE early_access_signups
  DROP CONSTRAINT IF EXISTS early_access_email_source_key;

ALTER TABLE early_access_signups
  ADD CONSTRAINT early_access_email_source_key UNIQUE (email, source);

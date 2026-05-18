-- MVP Web Push reminder scheduler.
-- Registers a minute-level Supabase Cron job that calls the protected Next.js
-- reminder dispatcher. Secrets are read from Supabase Vault and are not stored
-- in this migration.
--
-- Required Vault secrets before enabling the job remotely:
--   fevio_app_url      = production app origin (no trailing slash)
--   fevio_cron_secret = same value as Vercel CRON_SECRET / REMINDER_DISPATCH_SECRET

create extension if not exists pg_cron with schema extensions;
create extension if not exists pg_net with schema extensions;
create extension if not exists vault with schema vault;

select cron.unschedule('fevio-reminder-check')
where exists (
  select 1
  from cron.job
  where jobname = 'fevio-reminder-check'
);

select cron.schedule(
  'fevio-reminder-check',
  '* * * * *',
  $cron$
    select net.http_post(
      url := rtrim((
        select decrypted_secret
        from vault.decrypted_secrets
        where name = 'fevio_app_url'
        limit 1
      ), '/') || '/api/reminders/send-due',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || (
          select decrypted_secret
          from vault.decrypted_secrets
          where name = 'fevio_cron_secret'
          limit 1
        )
      ),
      body := jsonb_build_object(
        'source', 'pg_cron',
        'job', 'fevio-reminder-check'
      ),
      timeout_milliseconds := 5000
    );
  $cron$
);

-- Card payments through Paystack (the owner's choice after PayFast's
-- approval stalled). Paystack charges the parent's card R99 every month; the
-- site keeps Paystack's reference numbers to recognise the family in
-- Paystack's notifications and to cancel. No card details are kept.

alter table public.subscriptions
  add column provider text check (provider in ('payfast', 'paystack')),
  add column paystack_customer text unique check (char_length(paystack_customer) <= 100),
  add column paystack_subscription text check (char_length(paystack_subscription) <= 100),
  add column paystack_email_token text check (char_length(paystack_email_token) <= 100);

update public.subscriptions set provider = 'payfast' where payfast_token is not null;

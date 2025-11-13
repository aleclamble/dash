-- Team members
create table if not exists team_members (
  id bigserial primary key,
  name text not null,
  email text
);

-- Pipelines (e.g., source channels)
create table if not exists pipelines (
  id bigserial primary key,
  name text not null unique
);

-- Sales
create table if not exists sales (
  id bigserial primary key,
  stripe_id text unique not null,            -- Stripe charge or payment_intent id
  source text,                               -- optional, e.g. 'charge'
  currency text not null default 'usd',
  customer_email text,
  description text,
  status text,
  created_at timestamptz not null default now(),
  pipeline_id bigint references pipelines(id) on delete set null,
  gross_amount bigint not null default 0,    -- cents (original amount)
  fee_amount bigint not null default 0,      -- cents (Stripe fees)
  net_amount bigint not null default 0       -- cents (gross - fees)
);

-- Splits: supports multiple members per sale
create table if not exists sales_splits (
  sale_id bigint references sales(id) on delete cascade,
  member_id bigint references team_members(id) on delete cascade,
  percent numeric not null check (percent >= 0 and percent <= 100),
  amount bigint not null default 0, -- cents, computed as net_amount * percent / 100
  role text,
  note text,
  primary key (sale_id, member_id)
);

-- Views
create or replace view sales_with_splits as
select
  s.id,
  s.created_at,
  s.currency,
  s.customer_email,
  s.description,
  s.status,
  s.pipeline_id,
  p.name as pipeline_name,
  s.gross_amount,
  s.fee_amount,
  s.net_amount,
  coalesce(json_agg(json_build_object(
    'member_id', tm.id,
    'member_name', tm.name,
    'percent', ss.percent,
    'amount', ss.amount,
    'role', ss.role
  ) order by tm.name) filter (where ss.member_id is not null), '[]'::json) as contributors
from sales s
left join pipelines p on p.id = s.pipeline_id
left join sales_splits ss on ss.sale_id = s.id
left join team_members tm on tm.id = ss.member_id
where s.status is distinct from 'failed'
group by s.id, p.name
order by s.created_at desc;

create or replace view member_totals as
select tm.id as member_id, tm.name as member_name, coalesce(sum(ss.amount),0) as total_amount
from team_members tm
left join sales_splits ss on ss.member_id = tm.id
left join sales s on s.id = ss.sale_id and s.status is distinct from 'failed'
group by tm.id, tm.name
order by tm.name;

create or replace view pipeline_totals as
select p.id as pipeline_id, p.name as pipeline_name, coalesce(sum(s.net_amount),0) as total_amount
from pipelines p
left join sales s on s.pipeline_id = p.id and s.status is distinct from 'failed'
group by p.id, p.name
order by p.name;

create or replace view overall_totals as
select coalesce(sum(net_amount),0) as total_net, coalesce(sum(gross_amount),0) as total_gross, coalesce(sum(fee_amount),0) as total_fees from sales s where s.status is distinct from 'failed';

-- Optional RLS: keep disabled for now
-- alter table sales enable row level security;
-- alter table team_members enable row level security;
-- alter table sales_splits enable row level security;
-- alter table pipelines enable row level security;

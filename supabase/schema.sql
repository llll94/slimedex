-- Slimedex — base colaborativa: envios feitos pelo app ("Enviar minhas descobertas"),
-- com nomes PT, chances, combinações novas e votos 👍/👎 em combinações existentes.
-- O público (chave publishable/anon) só consegue INSERIR. Ninguém lê, edita ou apaga envios de outros.
-- O merge diário (GitHub Actions) usa a chave secreta para ler e marcar o que foi processado.

create table if not exists public.contribuicoes (
  id            bigint generated always as identity primary key,
  created_at    timestamptz not null default now(),
  autor         uuid not null,              -- id aleatório gerado no PC; não identifica a pessoa
  versao_app    text not null default '' check (char_length(versao_app) <= 20),
  payload       jsonb not null check (jsonb_typeof(payload) = 'object' and octet_length(payload::text) <= 200000),
  origem        text,                       -- hash do IP, só para limitar spam (o IP em si não é guardado)
  status        text not null default 'pendente' check (status in ('pendente', 'aceita', 'rejeitada')),
  processado_em timestamptz
);
create index if not exists contribuicoes_pendentes on public.contribuicoes (created_at) where status = 'pendente';
create index if not exists contribuicoes_origem    on public.contribuicoes (origem, created_at);
create index if not exists contribuicoes_autor     on public.contribuicoes (autor, created_at);

alter table public.contribuicoes enable row level security;

-- permissões: o app só insere estas 3 colunas; o resto é preenchido pelo gatilho abaixo
revoke all on public.contribuicoes from anon, authenticated;
grant insert (autor, versao_app, payload) on public.contribuicoes to anon, authenticated;
grant select, update on public.contribuicoes to service_role;

drop policy if exists "app pode enviar" on public.contribuicoes;
create policy "app pode enviar" on public.contribuicoes
  for insert to anon, authenticated
  with check (status = 'pendente' and processado_em is null);

-- antes de gravar: valida o formato e aplica os limites anti-spam
create or replace function public.contribuicoes_guarda() returns trigger
language plpgsql security definer set search_path = public, extensions as $$
declare
  ip text;
  n  int;
begin
  -- formato igual ao meus-dados.json do app: { pt: {...}, pc: {...}, combos: [...], votos: { id_combinação: 1 | -1 } }
  if exists (select 1 from jsonb_object_keys(new.payload) k where k not in ('pt', 'pc', 'combos', 'votos')) then
    raise exception 'formato inválido';
  end if;
  if new.payload ? 'votos' then
    if jsonb_typeof(new.payload -> 'votos') <> 'object'
       or (select count(*) from jsonb_object_keys(new.payload -> 'votos')) > 2000
       or exists (select 1 from jsonb_each(new.payload -> 'votos') v where v.value not in ('1'::jsonb, '-1'::jsonb)) then
      raise exception 'votos inválido';
    end if;
  end if;
  if new.payload ? 'combos' and (jsonb_typeof(new.payload -> 'combos') <> 'array'
                                 or jsonb_array_length(new.payload -> 'combos') > 1000) then
    raise exception 'combos inválido';
  end if;
  if (new.payload ? 'pt' and jsonb_typeof(new.payload -> 'pt') <> 'object')
     or (new.payload ? 'pc' and jsonb_typeof(new.payload -> 'pc') <> 'object') then
    raise exception 'formato inválido';
  end if;

  -- campos controlados pelo servidor (ignora o que vier do cliente)
  new.status := 'pendente';
  new.processado_em := null;
  new.created_at := now();

  ip := trim(split_part(coalesce(current_setting('request.headers', true)::json ->> 'x-forwarded-for', ''), ',', 1));
  if ip <> '' then
    new.origem := encode(digest(ip || ':slimepedia', 'sha256'), 'hex');
    select count(*) into n from contribuicoes where origem = new.origem and created_at > now() - interval '1 day';
    if n >= 10 then raise exception 'limite diário de envios atingido'; end if;
  end if;

  select count(*) into n from contribuicoes where autor = new.autor and created_at > now() - interval '1 day';
  if n >= 10 then raise exception 'limite diário de envios atingido'; end if;

  select count(*) into n from contribuicoes where created_at > now() - interval '1 hour';
  if n >= 1000 then raise exception 'muitos envios agora, tente mais tarde'; end if;

  return new;
end $$;

revoke execute on function public.contribuicoes_guarda() from public, anon, authenticated;

drop trigger if exists contribuicoes_guarda on public.contribuicoes;
create trigger contribuicoes_guarda
  before insert on public.contribuicoes
  for each row execute function public.contribuicoes_guarda();

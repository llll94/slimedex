-- Slimedex — base colaborativa: envios feitos pelo app ("Enviar minhas descobertas"),
-- com nomes PT, números de slime, chances, combinações novas e votos 👍/👎 em combinações existentes.
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
  if exists (select 1 from jsonb_object_keys(new.payload) k where k not in ('pt', 'pc', 'combos', 'votos', 'num', 'loc', 'per', 'sk', 'skn', 'skc', 'mapap', 'skd')) then
    raise exception 'formato inválido';
  end if;
  -- sk: [{ s: slime, k: skill, l: nível (1 a 99) ou null }] (2.1.0: skills anotadas, até 2000)
  if new.payload ? 'sk' then
    if jsonb_typeof(new.payload -> 'sk') <> 'array' or jsonb_array_length(new.payload -> 'sk') > 2000
       or exists (select 1 from jsonb_array_elements(new.payload -> 'sk') e
                  where jsonb_typeof(e) <> 'object'
                     or exists (select 1 from jsonb_object_keys(e) k where k not in ('s', 'k', 'l'))
                     or jsonb_typeof(e -> 's') is distinct from 'string' or length(e ->> 's') > 60
                     or jsonb_typeof(e -> 'k') is distinct from 'string' or length(e ->> 'k') > 60
                     or case coalesce(jsonb_typeof(e -> 'l'), 'null')
                          when 'null' then false
                          when 'number' then (e ->> 'l')::numeric not between 1 and 99 or (e ->> 'l')::numeric % 1 <> 0
                          else true end) then
      raise exception 'sk inválido';
    end if;
  end if;
  -- skn: { skill: nome no jogo em PT } (até 500, nome de 2 a 40)
  if new.payload ? 'skn' then
    if jsonb_typeof(new.payload -> 'skn') <> 'object'
       or (select count(*) from jsonb_object_keys(new.payload -> 'skn')) > 500
       or exists (select 1 from jsonb_each(new.payload -> 'skn') v
                  where length(v.key) > 60 or jsonb_typeof(v.value) <> 'string' or length(v.value #>> '{}') not between 2 and 40) then
      raise exception 'skn inválido';
    end if;
  end if;
  -- skd: { skill: descrição escrita no app } (2.2.1, até 500, texto de 2 a 300)
  if new.payload ? 'skd' then
    if jsonb_typeof(new.payload -> 'skd') <> 'object'
       or (select count(*) from jsonb_object_keys(new.payload -> 'skd')) > 500
       or exists (select 1 from jsonb_each(new.payload -> 'skd') v
                  where length(v.key) > 60 or jsonb_typeof(v.value) <> 'string' or length(v.value #>> '{}') not between 2 and 300) then
      raise exception 'skd inválido';
    end if;
  end if;
  -- mapap: { texto lido pelo OCR: mapa escolhido em "Qual é este mapa?" } (2.2.0, até 300)
  if new.payload ? 'mapap' then
    if jsonb_typeof(new.payload -> 'mapap') <> 'object'
       or (select count(*) from jsonb_object_keys(new.payload -> 'mapap')) > 300
       or exists (select 1 from jsonb_each(new.payload -> 'mapap') v
                  where length(v.key) > 80 or jsonb_typeof(v.value) <> 'string' or length(v.value #>> '{}') not between 1 and 80) then
      raise exception 'mapap inválido';
    end if;
  end if;
  -- skc: [{ k: 'u:...', nm: nome, el: elemento }] (skills cadastradas que não estão na lista, até 50)
  if new.payload ? 'skc' then
    if jsonb_typeof(new.payload -> 'skc') <> 'array' or jsonb_array_length(new.payload -> 'skc') > 50
       or exists (select 1 from jsonb_array_elements(new.payload -> 'skc') e
                  where jsonb_typeof(e) <> 'object'
                     or exists (select 1 from jsonb_object_keys(e) k where k not in ('k', 'nm', 'el'))
                     or jsonb_typeof(e -> 'k') is distinct from 'string' or length(e ->> 'k') > 60 or left(e ->> 'k', 2) <> 'u:'
                     or jsonb_typeof(e -> 'nm') is distinct from 'string' or length(e ->> 'nm') not between 2 and 40
                     or coalesce(e ->> 'el', '') not in ('Água', 'Gelo', 'Sombrio', 'Metal', 'Fogo', 'Poder', 'Elétrico', 'Luz', 'Grama', 'Terra', 'Vento', 'Magia', 'Veneno')) then
      raise exception 'skc inválido';
    end if;
  end if;
  -- num: { slime: número do slime } (inteiro de 1 a 9999)
  if new.payload ? 'num' then
    if jsonb_typeof(new.payload -> 'num') <> 'object'
       or (select count(*) from jsonb_object_keys(new.payload -> 'num')) > 500
       or exists (select 1 from jsonb_each(new.payload -> 'num') v
                  where case when jsonb_typeof(v.value) = 'number'
                             then (v.value::text)::numeric not between 1 and 9999 or (v.value::text)::numeric % 1 <> 0
                             else true end) then
      raise exception 'num inválido';
    end if;
  end if;
  -- loc: { mapa: [slimes vistos nele] } (até 300 mapas, 100 slimes cada)
  if new.payload ? 'loc' then
    if jsonb_typeof(new.payload -> 'loc') <> 'object'
       or (select count(*) from jsonb_object_keys(new.payload -> 'loc')) > 300
       or exists (select 1 from jsonb_each(new.payload -> 'loc') v
                  where length(v.key) > 80 or jsonb_typeof(v.value) <> 'array' or jsonb_array_length(v.value) > 100
                     or exists (select 1 from jsonb_array_elements(v.value) e where jsonb_typeof(e) <> 'string' or length(e #>> '{}') > 60)) then
      raise exception 'loc inválido';
    end if;
  end if;
  -- per: { slime: 'dia' | 'noite' | 'ambos' } (até 500)
  if new.payload ? 'per' then
    if jsonb_typeof(new.payload -> 'per') <> 'object'
       or (select count(*) from jsonb_object_keys(new.payload -> 'per')) > 500
       or exists (select 1 from jsonb_each(new.payload -> 'per') v where length(v.key) > 60 or v.value not in ('"dia"'::jsonb, '"noite"'::jsonb, '"ambos"'::jsonb)) then
      raise exception 'per inválido';
    end if;
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

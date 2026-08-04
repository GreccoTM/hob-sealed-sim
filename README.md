# Sealed Deck: The Hobbit

Simulador de Sealed Deck para o set "The Hobbit" (HOB) de Magic: The Gathering,
com deck builder e partidas 1v1 em tempo real (mesa virtual manual, sem
automação de regras).

**Produção:**
- App: https://hob-sealed-sim.pages.dev
- API: https://hob-sealed-sim-worker.hob-worker.workers.dev

## Stack

- **Front-end**: React + Vite, publicado no Cloudflare Pages.
- **API / motor de partida**: Cloudflare Workers + Durable Objects (SQLite-backed),
  WebSocket com Hibernation API.
- **Imagens das cartas**: cacheadas no Cloudflare R2, servidas através do Worker.
- **Auth e persistência**: Supabase (Postgres + Auth, JWT assimétrico via JWKS).

## Estrutura

```
apps/
  web/          React + Vite (front-end)
  worker/       Cloudflare Worker + Durable Object da partida
packages/
  shared/       Tipos, algoritmo de booster, protocolo de jogo (compartilhado)
scripts/
  ingest/       Pipeline de ingestão de dados/imagens da Scryfall (roda uma vez)
  dev/          CLI de inspeção do gerador de booster
supabase/
  migrations/   Schema + RLS do Postgres
```

## Desenvolvimento local

Requer `wrangler`, `supabase` CLI e Node 20+.

```bash
npm install
npm run test --workspace packages/shared   # testes do algoritmo de booster

# dois terminais:
npm run dev --workspace apps/worker         # wrangler dev, porta 8787
npm run dev --workspace apps/web            # vite, porta 5173 (proxy /api -> worker)
```

Copie `apps/web/.env.example` para `apps/web/.env` e preencha com a URL/chave
publishable do seu projeto Supabase.

## Pipeline de dados

```bash
npm run ingest:cards    # busca as cartas do set na Scryfall -> packages/shared/data/cards.json
npm run ingest:images   # baixa as imagens e sobe pro bucket R2 (precisa de wrangler autenticado)
npm run booster:cli -- --seed=123   # inspeciona um pool sealed gerado, sem precisar de UI
```

## Regras de design assumidas

- Sealed individual: cada jogador abre seu próprio pool (6 Play Boosters, estrutura
  oficial da Wizards) e monta o deck sozinho.
- Mesa virtual **manual**: o servidor só garante estado (vida, zonas, mão oculta,
  tap/untap); os jogadores aplicam o efeito das cartas manualmente, como em
  Cockatrice/Untap.in.
- Layout da mesa segue o MTR 4.7 (terras na borda do jogador, não-terras entre o
  jogador e o oponente; biblioteca/cemitério/exílio como zonas visíveis e distintas).

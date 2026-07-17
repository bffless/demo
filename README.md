# BFFless Demo

A small React + TypeScript + Vite app that exercises [BFFless](https://bffless.dev) features end-to-end. Live at **[demo.bffless.dev](https://demo.bffless.dev)**.

## What it demonstrates

| Feature | How |
| --- | --- |
| **Pipelines (rules as code)** | A click counter backed by a `counter` DB Record. `GET`/`POST /api/count` are pipeline rules authored as YAML + tested JS handlers in [`.bffless/proxy-rules/demo/`](.bffless/proxy-rules/demo/), synced by CI on every merge. |
| **Proxy rules** | The app fetches `/flags/features.json` same-origin; a `/flags/*` proxy rule forwards it to the [demo-feature-flags](https://github.com/bffless/demo-feature-flags) project — no CORS. |
| **Deploy via GitHub Actions** | [`bffless/upload-artifact`](https://github.com/bffless/upload-artifact) uploads `dist/` to the `production` alias on every push to `main`, and to a `preview` alias on PRs. |
| **Coverage comparison** | CI uploads a coverage baseline from `main`; PRs compare against it with [`bffless/compare-coverage`](https://github.com/bffless/compare-coverage) and comment the delta. |
| **Screenshot diffing** | Playwright captures screenshots; PRs compare them against the `production` baseline with [`bffless/compare-screenshots`](https://github.com/bffless/compare-screenshots). |

## Development

```bash
pnpm install
pnpm dev             # Vite dev server
pnpm test            # unit tests (Vitest)
pnpm test:coverage   # unit tests with coverage
pnpm test:vrt        # Playwright screenshot capture
pnpm build           # tsc + vite build → dist/
```

Note: `/api/count` and `/flags/*` are served by BFFless, so they only resolve on a deployed alias (the unit tests mock them locally).

## Backend as code

Everything the app needs server-side lives in [`.bffless/`](.bffless/):

```
.bffless/
  config.json                 # apiUrl + project (no secrets)
  proxy-rules/demo/
    ruleset.yaml
    schemas/counter.schema.yaml
    rules/
      api/count/get/          # GET /api/count  — read the counter
      api/count/post/         # POST /api/count — increment (self-seeding)
      flags/[...path]/        # /flags/* — proxy to demo-feature-flags
```

Handler code is plain JS with YAML test fixtures:

```bash
npx bffless rules validate   # lint manifests + handler code
npx bffless rules test       # run *.fn.test.yaml fixtures
npx bffless rules build      # compile to dist/demo.proxy-rules.json
```

The `main` deploy workflow syncs the set with [`bffless/deploy-proxy-rules`](https://github.com/bffless/deploy-proxy-rules) and attaches it to the alias, so a merged PR ships frontend and backend together.

## CI

- [`main-deploy.yml`](.github/workflows/main-deploy.yml) — tests, coverage baseline, proxy-rule sync, production deploy, screenshot baseline
- [`pr-preview.yml`](.github/workflows/pr-preview.yml) — tests, screenshot + coverage comparison against `main`'s baselines, preview deploy

Repo configuration: `ASSET_HOST_URL` (Actions variable) and `ASSET_HOST_KEY` (secret) point at the BFFless instance.

## Docs

- [Pipelines](https://docs.bffless.dev/features/pipelines/)
- [Proxy rules](https://docs.bffless.dev/features/proxy-rules/)
- [Rules as code](https://docs.bffless.dev/recipes/proxy-rules-as-code/)
- [Traffic splitting](https://docs.bffless.dev/features/traffic-splitting/)
- [GitHub Actions deployment](https://docs.bffless.dev/deployment/github-actions/)

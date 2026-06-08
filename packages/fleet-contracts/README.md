# @broberg/fleet-contracts

Shared **zod contracts + TypeScript types** for the broberg fleet HTTP API.
The **single source of truth**: the buddy server validates inbound requests
against these schemas, and every client (`@broberg/fleet-client`, F072.3) gets
its types from the same place — so caller and callee can never drift.

Part of **F072 — @broberg/fleet-client** (see `docs/features/F72-fleet-client.md`).
The fourth shared lib after `@broberg/db-sdk` (data), `@broberg/ai-sdk` (LLM),
`@upmetrics/sdk` (telemetry): **fleet communication.**

## Endpoints covered

| Name | Method | Path | Served by |
|---|---|---|---|
| `intercomDispatch` | POST | `/api/intercom/dispatch` | buddy (F072.2) |
| `terminalProvision` | POST | `/api/terminal/provision` | buddy (F069) |
| `notifyMobile` | POST | `/api/notify` | buddy |
| `boardDigest` | GET | `/api/board/digest` | cardmem |
| `submitIdea` | POST | `/api/board/idea` | cardmem |

`FLEET_ENDPOINTS` exports the canonical method/path/server for each, so the
client and server share **routing** as well as **shapes**.

## Usage

```ts
import { IntercomDispatchRequestSchema, type IntercomDispatchRequest } from '@broberg/fleet-contracts';

const body: IntercomDispatchRequest = { targetSession: 'cardmem', message: 'pick up F070.2' };
const parsed = IntercomDispatchRequestSchema.safeParse(body); // validate at the boundary
```

## Status

- In the buddy monorepo the package resolves from `src` (`main` → `./src/index.ts`)
  so bun/pnpm read source directly (same pattern as `@broberg/db-sdk`).
- Publish to npm via trusted-publisher is **F072.7** (own repo, `main` → `dist`).

## Test

```bash
bun test
```

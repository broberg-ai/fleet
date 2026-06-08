# @broberg/fleet-client

Typed client for the broberg **fleet HTTP API** (buddy + cardmem). One import
instead of hand-rolling `fetch` + Bearer + payload in every repo — typed
end-to-end from [`@broberg/fleet-contracts`](../fleet-contracts), with request
bodies **validated before send** (you literally can't get the shape wrong).

Part of **F072 — @broberg/fleet-client** (see `docs/features/F72-fleet-client.md`).

## Usage

```ts
import { createFleetClient } from '@broberg/fleet-client';

const fleet = createFleetClient({
  buddyBaseUrl: process.env.BUDDY_URL ?? 'http://localhost:4123',
  buddyKey: process.env.BUDDY_SERVER_TOKEN,        // omit on localhost-open edges
  cardmemBaseUrl: 'https://services.cardmem.com',  // for board endpoints
  cardmemKey: process.env.CARDMEM_DAEMON_KEY,
});

await fleet.dispatchIntercom({ targetSession: 'cardmem', message: 'pick up F070.2' });
await fleet.provisionTerminal({ name: 'buddy', repoName: 'buddy' });
await fleet.notifyMobile({ message: 'shipped F072.1', severity: 'info' });
const digest = await fleet.boardDigest();
await fleet.submitIdea({ project_slug: 'buddy', text: 'an idea from a service' });
```

## Methods

| Method | Endpoint | Served by |
|---|---|---|
| `dispatchIntercom` | POST `/api/intercom/dispatch` | buddy (needs F072.2) |
| `provisionTerminal` | POST `/api/terminal/provision` | buddy (F069) |
| `notifyMobile` | POST `/api/notify` | buddy |
| `boardDigest` | GET `/api/board/digest` | cardmem |
| `submitIdea` | POST `/api/board/idea` | cardmem |

Routing (which base URL + key) is chosen automatically from
`FLEET_ENDPOINTS[name].server`. The **reachability ladder** (local daemon vs
F067 cloud-relay for a specific edge) is **F072.4** — this client v1 takes
explicit base URLs.

## Errors

- Invalid request → throws (zod) **before** any network call.
- Non-2xx → throws `FleetError` (`.status`, `.body`).

## Test

```bash
bun test
```

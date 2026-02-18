# @trylandeu/land-sdk

Type-safe client for Land backend REST endpoints used by `land-app-web`.

## Usage

```ts
import { createLandBackendClient } from '@trylandeu/land-sdk';

const client = createLandBackendClient({
  baseUrl: import.meta.env.VITE_LENDING_API_URL,
  timeout: 30000,
});

const markets = await client.listMarkets({ chain: 'solana', protocol: 'kamino' });
```

## Included endpoint groups

- Health/auth: `/healthz`, `/readyz`, `/auth/context`
- Wallet/obligations/positions/summary/risk
- Markets/tokens/prices
- History: events, prices, rates, obligation, position
- Webhooks: subscriptions + event lookup

## Build

```bash
npm run build
```

## Test

```bash
npm run test
```

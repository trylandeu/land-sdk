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

### Proxy-first frontend usage (recommended)

```ts
const client = createLandBackendClient({
  // Point this to your own backend/proxy endpoint
  // so API keys stay server-side.
  baseUrl: '/api/land',
});
```

### Direct backend usage with API key (server-side)

```ts
const client = createLandBackendClient({
  baseUrl: 'https://land-api.example.com',
  apiKey: process.env.LAND_API_KEY,
  apiKeyHeader: 'x-api-key', // default
});
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

import assert from 'node:assert/strict';
import test from 'node:test';

import { createLandBackendClient, LandBackendApiError } from '../../dist/index.js';

function jsonResponse(status, body) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' },
  });
}

test('serializes query params and calls obligation risk/history/position endpoints', async () => {
  const calls = [];

  const client = createLandBackendClient({
    baseUrl: 'https://api.example.com',
    fetchImpl: async (url, init) => {
      calls.push({ url: String(url), method: init?.method ?? 'GET' });
      if (String(url).includes('/obligations/') && String(url).endsWith('/risk')) {
        return jsonResponse(200, {
          obligation: {
            id: 'obligation-1',
            chain: 'solana',
            protocol: 'kamino',
            protocol_obligation_ref: 'obligation-1',
            pool_ref: 'pool-1',
            wallet_address: 'wallet-1',
          },
          risk: {
            protocol_health_factor: 1.2,
            backend_health_score: 0.8,
            total_collateral_value_usd: 1000,
            total_borrow_value_usd: 200,
            effective_ltv: 0.2,
            max_borrowable_value_usd: 500,
            liquidation_threshold_ltv: 0.75,
            liquidation_buffer: 0.55,
            ltv_model_version: 'v1',
            as_of: '2026-01-01T00:00:00Z',
          },
          coverage: {
            coverage_mode: 'forward_only',
            coverage_start_slot: 0,
            coverage_start_block: null,
            wallet_tracking_status: 'tracked',
            first_tracked_at: '2026-01-01T00:00:00Z',
          },
          outcome: null,
        });
      }

      return jsonResponse(200, { items: [], limit: 10, offset: 0, total: 0 });
    },
  });

  await client.getObligationRisk('obligation-1');
  await client.listObligationHistory('obligation-1', {
    since: '2026-01-01T00:00:00Z',
    until: '2026-01-02T00:00:00Z',
    limit: 10,
    offset: 0,
  });
  await client.listPositionHistory('position-1', {
    since: '2026-01-01T00:00:00Z',
    limit: 5,
  });

  assert.equal(calls.length, 3);
  assert.equal(calls[0]?.method, 'GET');
  assert.equal(calls[1]?.method, 'GET');
  assert.equal(calls[2]?.method, 'GET');
  assert.equal(calls[0]?.url, 'https://api.example.com/obligations/obligation-1/risk');
  assert.ok(calls[1]?.url.startsWith('https://api.example.com/history/obligations/obligation-1?'));
  assert.ok(calls[1]?.url.includes('since=2026-01-01T00%3A00%3A00Z'));
  assert.ok(calls[1]?.url.includes('until=2026-01-02T00%3A00%3A00Z'));
  assert.ok(calls[2]?.url.startsWith('https://api.example.com/history/positions/position-1?'));
  assert.ok(calls[2]?.url.includes('limit=5'));
});

test('maps structured API errors to LandBackendApiError', async () => {
  const client = createLandBackendClient({
    baseUrl: 'https://api.example.com',
    fetchImpl: async () => jsonResponse(400, { code: 'INVALID_FILTERS', message: 'bad filters' }),
  });

  await assert.rejects(
    () => client.listHistoryRates({ chain: 'solana' }),
    (error) => {
      assert.ok(error instanceof LandBackendApiError);
      assert.equal(error.status, 400);
      assert.equal(error.code, 'INVALID_FILTERS');
      assert.equal(error.message, 'bad filters');
      return true;
    },
  );
});

test('sends webhook create/update payloads with JSON body', async () => {
  const calls = [];

  const client = createLandBackendClient({
    baseUrl: 'https://api.example.com',
    fetchImpl: async (url, init) => {
      calls.push({ url: String(url), init });
      return jsonResponse(200, {
        subscription: {
          id: 'sub-1',
          event_type: 'risk.liquidation',
          filters: {},
          callback_url: 'https://cb.example.com',
          auth_config: {},
          max_retry_window: 60,
          is_active: true,
          created_at: '2026-01-01T00:00:00Z',
          updated_at: '2026-01-01T00:00:00Z',
        },
      });
    },
  });

  await client.createWebhookSubscription({
    event_type: 'risk.liquidation',
    callback_url: 'https://cb.example.com',
  });
  await client.updateWebhookSubscription('sub-1', { is_active: false });

  assert.equal(calls.length, 2);
  assert.equal(calls[0]?.init?.method, 'POST');
  assert.equal(calls[1]?.init?.method, 'PATCH');
  assert.equal(calls[1]?.url, 'https://api.example.com/webhooks/subscriptions/sub-1');
  assert.equal(calls[0]?.init?.headers['Content-Type'], 'application/json');
  assert.equal(calls[1]?.init?.headers['Content-Type'], 'application/json');
});

test('supports api key header and dynamic headers for direct or proxied access', async () => {
  const calls = [];

  const client = createLandBackendClient({
    baseUrl: 'https://proxy.example.com/land',
    apiKey: 'secret-key',
    apiKeyHeader: 'x-land-api-key',
    defaultHeaders: { 'x-client': 'land-sdk-test' },
    getHeaders: async () => ({ authorization: 'Bearer token-123' }),
    fetchImpl: async (url, init) => {
      calls.push({ url: String(url), headers: init?.headers });
      return jsonResponse(200, { status: 'ok', timestamp: '2026-01-01T00:00:00Z', detail: null });
    },
  });

  await client.healthz();

  assert.equal(calls.length, 1);
  assert.equal(calls[0]?.url, 'https://proxy.example.com/land/healthz');
  assert.equal(calls[0]?.headers['x-land-api-key'], 'secret-key');
  assert.equal(calls[0]?.headers['x-client'], 'land-sdk-test');
  assert.equal(calls[0]?.headers.authorization, 'Bearer token-123');
});

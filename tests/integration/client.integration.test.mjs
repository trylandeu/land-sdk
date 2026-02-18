import assert from 'node:assert/strict';
import test from 'node:test';

import { createLandBackendClient } from '../../dist/index.js';

const baseUrl = process.env.LAND_SDK_BASE_URL;
const client = baseUrl
  ? createLandBackendClient({
      baseUrl,
      timeout: 10000,
    })
  : null;

async function ensureBackendAvailable(t) {
  if (!client) {
    t.skip('Set LAND_SDK_BASE_URL to run integration tests');
    return false;
  }

  try {
    await client.healthz();
    return true;
  } catch {
    t.skip(`Backend unavailable at ${baseUrl}`);
    return false;
  }
}

test('healthz returns service status', async (t) => {
  if (!(await ensureBackendAvailable(t))) return;

  const response = await client.healthz();
  assert.equal(typeof response.status, 'string');
  assert.equal(typeof response.timestamp, 'string');
});

test('listMarkets returns paged response shape', async (t) => {
  if (!(await ensureBackendAvailable(t))) return;

  const response = await client.listMarkets({
    chain: 'solana',
    protocol: 'kamino',
    limit: 1,
    offset: 0,
  });

  assert.ok(Array.isArray(response.items));
  assert.equal(typeof response.limit, 'number');
  assert.equal(typeof response.offset, 'number');
  assert.equal(typeof response.total, 'number');
});

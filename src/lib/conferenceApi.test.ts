import test from 'node:test';
import assert from 'node:assert/strict';

import { fetchOrganizers } from './conferenceApi';

async function withOrganizerPayload(payload: unknown, run: () => Promise<void>) {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = (async () => new Response(JSON.stringify(payload), {
    status: 200,
    headers: { 'content-type': 'application/json' },
  })) as typeof fetch;

  try {
    await run();
  } finally {
    globalThis.fetch = originalFetch;
  }
}

test('fetchOrganizers normalizes the flat single-conference API payload', async () => {
  await withOrganizerPayload({
    organizers: [{ name: 'Ada', organization: 'Example U', role: 'General Chair', order: 1 }],
  }, async () => {
    assert.deepEqual(await fetchOrganizers(), [{
      id: undefined,
      name: 'Ada',
      org: 'Example U',
      role: 'General Chair',
      photo: undefined,
      order: 1,
      email: undefined,
    }]);
  });
});

test('fetchOrganizers accepts the previous HCOMP group during rolling deployments', async () => {
  await withOrganizerPayload({
    hcomp: [{ name: 'Legacy', organization: 'Example U', role: 'Chair' }],
    ci: [],
  }, async () => {
    assert.equal((await fetchOrganizers())[0]?.name, 'Legacy');
  });
});

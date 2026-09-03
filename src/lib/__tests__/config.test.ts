import assert from 'node:assert/strict';
import { test } from 'node:test';

/**
 * Mirrors the check in src/lib/supabase.ts. Kept as a copy because that module
 * reads process.env and pulls in React Native at import time, neither of which
 * belongs in a unit test.
 */
const PROJECT_URL = /^https:\/\/[a-z0-9-]+\.supabase\.(co|in)$/i;

test('accepts a real project URL', () => {
  assert.ok(PROJECT_URL.test('https://abcdefghijklmnop.supabase.co'));
  assert.ok(PROJECT_URL.test('https://my-project-123.supabase.co'));
});

test('rejects the dashboard URL people copy from the address bar', () => {
  assert.ok(!PROJECT_URL.test('https://supabase.com/dashboard/project/abcdef'));
});

test('rejects near misses', () => {
  assert.ok(!PROJECT_URL.test('http://abcdef.supabase.co')); // not https
  assert.ok(!PROJECT_URL.test('https://abcdef.supabase.co/')); // trailing slash
  assert.ok(!PROJECT_URL.test('abcdef.supabase.co')); // no scheme
  assert.ok(!PROJECT_URL.test('https://supabase.co'));
});

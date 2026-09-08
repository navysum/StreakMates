import assert from 'node:assert/strict';
import { test } from 'node:test';
import { gradient, sampleGradient } from '../palette.ts';

test('sampleGradient: the ends are the stops themselves', () => {
  assert.equal(sampleGradient(gradient, 0), gradient[0]);
  assert.equal(sampleGradient(gradient, 1), gradient[gradient.length - 1]);
});

test('sampleGradient: a stop lands exactly on itself', () => {
  // Four stops, so each sits at a third of the way along.
  for (let i = 0; i < gradient.length; i++) {
    assert.equal(sampleGradient(gradient, i / (gradient.length - 1)), gradient[i]);
  }
});

test('sampleGradient: halfway between two stops is their midpoint', () => {
  assert.equal(sampleGradient(['#000000', '#ffffff'], 0.5), '#808080');
  assert.equal(sampleGradient(['#000000', '#ff0000'], 0.5), '#800000');
});

test('sampleGradient: t is clamped rather than trusted', () => {
  assert.equal(sampleGradient(gradient, -5), gradient[0]);
  assert.equal(sampleGradient(gradient, 99), gradient[gradient.length - 1]);
  // A single tick divides by zero upstream; this must not produce '#NaNNaNNaN'.
  assert.equal(sampleGradient(gradient, NaN), gradient[0]);
});

test('sampleGradient: one stop is a colour, not an error', () => {
  assert.equal(sampleGradient(['#4b61f8'], 0.5), '#4b61f8');
});

test('sampleGradient: every sample is a valid six-digit hex', () => {
  for (let i = 0; i <= 40; i++) {
    const hex = sampleGradient(gradient, i / 40);
    assert.match(hex, /^#[0-9a-f]{6}$/, `${hex} at ${i}`);
  }
});

import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const appSource = readFileSync(new URL('../App.tsx', import.meta.url), 'utf8');
const fallbackContentSource = readFileSync(new URL('../constants/content.ts', import.meta.url), 'utf8');

test('the current conference section does not render HCOMP-only fallback details unconditionally', () => {
  assert.doesNotMatch(appSource, /about\.conference\.(?:description|details)/);
});

test('single-conference fallback constants do not retain the joint-conference discount code', () => {
  assert.doesNotMatch(fallbackContentSource, new RegExp(['COLLECTIVE', '2026'].join('')));
});

test('secondary pages stay hidden from the shared navigation menu', () => {
  const menuStart = appSource.indexOf('const sections = [');
  const menuEnd = appSource.indexOf('];', menuStart);

  assert.notEqual(menuStart, -1);
  assert.notEqual(menuEnd, -1);

  const menuSource = appSource.slice(menuStart, menuEnd);
  assert.doesNotMatch(menuSource, /id: 'coc'/);
  assert.doesNotMatch(menuSource, /id: 'past-meetings'/);
});

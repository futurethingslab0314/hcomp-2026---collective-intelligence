import test from 'node:test';
import assert from 'node:assert/strict';

import type { DatabaseRecord } from './conferenceApi';
import { parseConferenceInfoContent } from './registryParsers';

function conferenceInfoRecord(year: string | number): DatabaseRecord {
  return {
    id: 'conference-info',
    fields: {
      main: true,
      name: 'HCOMP',
      year,
    },
  };
}

test('parseConferenceInfoContent reads a numeric year from the main record', () => {
  assert.equal(parseConferenceInfoContent([conferenceInfoRecord(2027)]).year, '2027');
});

test('parseConferenceInfoContent reads a string year from the main record', () => {
  assert.equal(parseConferenceInfoContent([conferenceInfoRecord('2028')]).year, '2028');
});

test('parseConferenceInfoContent returns an empty year when records are unavailable', () => {
  assert.equal(parseConferenceInfoContent([]).year, '');
});

import test from 'node:test';
import assert from 'node:assert/strict';

import type { DatabaseRecord } from './conferenceApi';
import {
  parseConferenceInfoContent,
  parseConferenceTopicBriefs,
  parseOrganizers,
  parsePastMeetings,
  parseTopicSections,
} from './registryParsers';

function record(fields: DatabaseRecord['fields'], id = 'record'): DatabaseRecord {
  return { id, fields };
}

function conferenceInfoRecord(year: string | number): DatabaseRecord {
  return record({ main: true, name: 'HCOMP', year }, 'conference-info');
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

test('parseConferenceInfoContent reads the conference name from the main record', () => {
  assert.equal(
    parseConferenceInfoContent([record({ main: true, name: 'TAICHI', year: 2027 })]).heroName,
    'TAICHI',
  );
});

test('parseTopicSections returns every topic without a conference discriminator', () => {
  assert.deepEqual(
    parseTopicSections([
      record({ name: 'Human-AI teams', topic: ['Coordination', 'Complementarity'] }, 'topic'),
    ]),
    [{ category: 'Human-AI teams', items: ['Coordination', 'Complementarity'] }],
  );
});

test('parseConferenceTopicBriefs returns one brief without a conference discriminator', () => {
  assert.equal(
    parseConferenceTopicBriefs([
      record({ brief_topic_of_interests: 'One conference brief' }, 'brief'),
    ]),
    'One conference brief',
  );
});

test('parseOrganizers returns every organizer without a conference discriminator', () => {
  assert.deepEqual(
    parseOrganizers([record({ name: 'Ada', Role: 'General Chair', organization: 'Example U' }, 'ada')]),
    [{
      id: 'ada',
      name: 'Ada',
      org: 'Example U',
      role: 'General Chair',
      photo: '',
      email: '',
      order: 999,
    }],
  );
});

test('parsePastMeetings returns every meeting without a conference discriminator', () => {
  assert.deepEqual(
    parsePastMeetings([record({ year: 2025, name: 'Annual Meeting' }, 'meeting')]),
    [{
      year: 2025,
      name: 'Annual Meeting',
      location: '',
      website: '',
      proceedings: '',
      bestPaperAward: '',
    }],
  );
});

import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const appSource = readFileSync(new URL('../App.tsx', import.meta.url), 'utf8');
const fallbackContentSource = readFileSync(new URL('../constants/content.ts', import.meta.url), 'utf8');
const contentApiSource = readFileSync(new URL('../../api/content.ts', import.meta.url), 'utf8');

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

test('the papers submission tab uses the Papers label and Notion section key', () => {
  const submissionStart = appSource.indexOf('function SubmissionSection(');
  const submissionEnd = appSource.indexOf('\nfunction ProgramSection(', submissionStart);

  assert.notEqual(submissionStart, -1);
  assert.notEqual(submissionEnd, -1);

  const submissionSource = appSource.slice(submissionStart, submissionEnd);
  assert.match(
    submissionSource,
    /getRegistryEntry\(registryContent, 'call for participation', 'papers'\)/,
  );
  assert.match(submissionSource, /\{ id: 'papers', label: 'Papers',/);
  assert.match(submissionSource, />Call for Papers<\/h3>/);
  assert.doesNotMatch(submissionSource, /papers and talks/i);
});

test('secondary submission pages stay implemented but hidden from the tabs', () => {
  const submissionStart = appSource.indexOf('function SubmissionSection(');
  const submissionEnd = appSource.indexOf('\nfunction ProgramSection(', submissionStart);
  const submissionSource = appSource.slice(submissionStart, submissionEnd);
  const tabsStart = submissionSource.indexOf('const tabs = [');
  const tabsEnd = submissionSource.indexOf('];', tabsStart);
  const tabsSource = submissionSource.slice(tabsStart, tabsEnd);

  assert.doesNotMatch(tabsSource, /id: 'dc'/);
  assert.doesNotMatch(tabsSource, /id: 'crowdcamp'/);
  assert.match(submissionSource, /activeTab === 'dc'/);
  assert.match(submissionSource, /activeTab === 'crowdcamp'/);
});

test('submission pages select organizers by paper, poster, and demo roles', () => {
  const submissionStart = appSource.indexOf('function SubmissionSection(');
  const submissionEnd = appSource.indexOf('\nfunction ProgramSection(', submissionStart);
  const submissionSource = appSource.slice(submissionStart, submissionEnd);

  assert.match(
    submissionSource,
    /const paperOrganizers = organizerPeople\.filter\(\(person\) => roleIncludes\(person\.role, \['paper'\]\)\)/,
  );
  assert.match(
    submissionSource,
    /const posterOrganizers = organizerPeople\.filter\(\(person\) => roleIncludes\(person\.role, \['poster', 'demo'\]\)\)/,
  );
});

test('the current conference panel renders every organizer with a general role', () => {
  const aboutStart = appSource.indexOf('function AboutLandingSection(');
  const aboutEnd = appSource.indexOf('\nfunction SponsorsSection(', aboutStart);
  const aboutSource = appSource.slice(aboutStart, aboutEnd);
  const featureStart = appSource.indexOf('function GeneralChairsFeature(');
  const featureEnd = appSource.indexOf('\nfunction PastMeetingsSection(', featureStart);
  const featureSource = appSource.slice(featureStart, featureEnd);

  assert.match(
    aboutSource,
    /const generalChairs = homeOrganizers\.filter\(\(person\) => roleIncludes\(person\.role, \['general'\]\)\)/,
  );
  assert.match(aboutSource, /<GeneralChairsFeature\s+people=\{generalChairs\}/);
  assert.match(featureSource, /displayPeople\.map\(\(person, index\) =>/);
  assert.match(featureSource, /grid-cols-1 md:grid-cols-2/);
});

test('unchecked registry entries drive navigation visibility without loading sources', () => {
  assert.match(contentApiSource, /visibility_only/);
  assert.match(contentApiSource, /visibility\[pageKey\]\[sectionKey\] = enabled/);
  assert.match(appSource, /fetchRegistryVisibility\(\)/);
  assert.match(appSource, /isRegistryPageEnabled\(registryVisibility, section\.pageKeys\)/);
  assert.match(appSource, /isRegistrySectionEnabled\(registryVisibility, tab\.pageKey, tab\.sectionKey\)/);
});

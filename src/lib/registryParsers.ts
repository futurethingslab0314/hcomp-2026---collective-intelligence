import type { DatabaseRecord, RegistryContent, RegistryEntry } from './conferenceApi';
import { getStringField, getStringListField, normalizeKey } from './notionContent';

export type DeadlineItem = {
  date: string;
  label: string;
  status: string;
  color: string;
};

export type VenueLocation = {
  name: string;
  address: string;
  location: string;
  days: string[];
  imageUrl?: string;
  mainHall?: string;
};

export type AccommodationItem = {
  name: string;
  rate: string;
  discountCode: string;
  address: string;
  distance: string;
};

export type TransportationItem = {
  mode: string;
  detail: string;
};

export type SponsorLogoItem = {
  name: string;
  sub: string;
  logo: string;
  url: string;
  group: string;
};

export type CommunityPhotoItem = {
  name: string;
  caption: string;
  image: string;
  url: string;
};

export type SponsorTierRow = {
  feature: string;
  platinum: string;
  gold: string;
  silver: string;
  bronze: string;
};

export type TopicSection = {
  category: string;
  items: string[];
  conference: string;
};

export type ConferenceTopicBriefs = {
  hcomp: string;
  ci: string;
};

export type ConferenceInfoContent = {
  year: string;
  heroName: string;
  heroLongName: string;
  about: string;
  conferenceInfo: string;
  venueInfo: string;
};

export type OrganizerPerson = {
  id: string;
  name: string;
  org: string;
  role: string;
  photo: string;
  conference: string;
  email: string;
  order?: number;
};

function prettifyFeatureLabel(value: string) {
  return value
    .replace(/_/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function getRegistryEntry(registry: RegistryContent | null, pageKey: string, sectionKey: string) {
  return registry?.[normalizeKey(pageKey)]?.[normalizeKey(sectionKey)] ?? null;
}

export function getRegistryEntryFromPages(
  registry: RegistryContent | null,
  pageKeys: string[],
  sectionKey: string,
) {
  for (const pageKey of pageKeys) {
    const entry = getRegistryEntry(registry, pageKey, sectionKey);
    if (entry) return entry;
  }
  return null;
}

export function getDatabaseRecords(entry: RegistryEntry | null) {
  return entry?.sourceType === 'database' ? entry.records : [];
}

export function getPageBlocks(entry: RegistryEntry | null) {
  return entry?.sourceType === 'page' ? entry.blocks : [];
}

function sortByText(a: string, b: string) {
  return a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' });
}

function normalizeConferenceBucket(value: string) {
  const normalized = value.trim().toLowerCase();
  if (normalized.includes('hcomp')) return 'hcomp';
  if (normalized.includes('ci')) return 'ci';
  return 'other';
}

export function parseDeadlines(records: DatabaseRecord[]) {
  const colors = ['text-brand-blue', 'text-brand-teal', 'text-brand-purple', 'text-brand-blue', 'text-white'];

  return records
    .map((record, index) => ({
      date: getStringField(record, ['date', 'deadline', 'due date']),
      label: getStringField(record, ['label', 'title', 'name', 'event']),
      status: getStringField(record, ['status']) || 'Upcoming',
      color: getStringField(record, ['color']) || colors[index % colors.length],
    }))
    .filter((item) => item.date || item.label);
}

export function parseVenueLocations(records: DatabaseRecord[]) {
  return records
    .map((record) => ({
      name: getStringField(record, ['name', 'venue', 'venue name']),
      address: getStringField(record, ['address']),
      location: getStringField(record, ['location', 'city', 'place']),
      days: getStringListField(record, ['day', 'days', 'usage days']),
      imageUrl: getStringField(record, ['photo', 'photos', 'image', 'image url']),
      mainHall: getStringField(record, ['main hall', 'hall']),
    }))
    .filter((item) => item.name || item.address);
}

export function parseAccommodations(records: DatabaseRecord[]) {
  return records
    .map((record) => ({
      name: getStringField(record, ['hotel name', 'name']),
      rate: getStringField(record, ['price', 'rate']),
      discountCode: getStringField(record, ['discount code', 'code']),
      address: getStringField(record, ['address']),
      distance: getStringField(record, ['distance']),
    }))
    .filter((item) => item.name);
}

export function parseTransportation(records: DatabaseRecord[]) {
  return records
    .map((record) => ({
      mode: getStringField(record, ['name', 'mode', 'transportation']),
      detail: getStringField(record, ['description', 'detail']),
    }))
    .filter((item) => item.mode || item.detail);
}

export function parseProgram(records: DatabaseRecord[]) {
  const sessions = records
    .map((record) => ({
      dateValue: getStringField(record, ['date']),
      startTime: getStringField(record, ['start_time', 'start time', 'start']),
      endTime: getStringField(record, ['end_time', 'end time', 'end']),
      title: getStringField(record, ['topic', 'title', 'name']),
      location: getStringField(record, ['location']),
      keywords: getStringListField(record, ['keywords', 'keyword', 'tags']),
    }))
    .filter((item) => item.dateValue && item.title)
    .sort((a, b) => `${a.dateValue}-${a.startTime}`.localeCompare(`${b.dateValue}-${b.startTime}`));

  const formatterDay = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' });
  const formatterWeekday = new Intl.DateTimeFormat('en-US', { weekday: 'long', timeZone: 'UTC' });
  const groups = new Map<string, any>();

  for (const session of sessions) {
    if (!groups.has(session.dateValue)) {
      groups.set(session.dateValue, {
        day: groups.size + 1,
        name: formatterDay.format(new Date(session.dateValue)),
        date: formatterWeekday.format(new Date(session.dateValue)),
        sessions: [],
      });
    }

    const type = session.keywords.some((keyword) => keyword.toLowerCase().includes('keynote'))
      ? 'Keynote'
      : session.keywords.some((keyword) => {
          const value = keyword.toLowerCase();
          return value.includes('network') || value.includes('social');
        })
        ? 'Social'
        : 'Technical';

    groups.get(session.dateValue).sessions.push({
      startTime: session.startTime || 'TBD',
      endTime: session.endTime || 'TBD',
      title: session.title,
      type,
      location: session.location || 'TBD',
      keywords: session.keywords,
    });
  }

  return Array.from(groups.values());
}

export function parseTopicSections(records: DatabaseRecord[]) {
  const grouped = {
    hcomp: [] as TopicSection[],
    ci: [] as TopicSection[],
  };

  for (const record of records) {
    const category = getStringField(record, ['name', 'title', 'category']);
    const items = getStringListField(record, ['topic', 'topics', 'item', 'items']);
    const conference = getStringField(record, ['conference']);

    if (!category && items.length === 0) continue;

    const section = {
      category,
      items,
      conference,
    } satisfies TopicSection;

    const bucket = normalizeConferenceBucket(conference);
    if (bucket === 'hcomp') grouped.hcomp.push(section);
    if (bucket === 'ci') grouped.ci.push(section);
  }

  return grouped;
}

export function parseConferenceTopicBriefs(records: DatabaseRecord[]): ConferenceTopicBriefs {
  const briefs: ConferenceTopicBriefs = {
    hcomp: '',
    ci: '',
  };

  for (const record of records) {
    const conference = getStringField(record, ['conference']);
    const brief = getStringField(record, [
      'brief_topic_of_interests',
      'brief topic of interests',
      'brief_topic_of_interest',
      'brief topic of interest',
    ]);

    if (!conference || !brief) continue;

    const bucket = normalizeConferenceBucket(conference);
    if (bucket === 'hcomp' || bucket === 'ci') {
      briefs[bucket] = brief;
    }
  }

  return briefs;
}

export function parseConferenceInfoContent(records: DatabaseRecord[]): ConferenceInfoContent {
  const mainRecord =
    records.find((record) => getStringField(record, ['main']).toLowerCase() === 'true') ?? records[0];
  const locationValues = new Set<string>();
  const eventDateValues = new Set<string>();

  for (const record of records) {
    const location = getStringField(record, ['location', 'venue', 'place']);
    const eventDate = getStringField(record, ['event date', 'event_date', 'date']);

    if (location) locationValues.add(location);
    if (eventDate) eventDateValues.add(eventDate);
  }

  const locationText = Array.from(locationValues).join(' • ');
  const eventDateText = Array.from(eventDateValues).join(' • ');

  return {
    year: mainRecord ? getStringField(mainRecord, ['year']) : '',
    heroName: mainRecord ? getStringField(mainRecord, ['name']) : '',
    heroLongName: mainRecord ? getStringField(mainRecord, ['long name', 'long_name']) : '',
    about: mainRecord ? getStringField(mainRecord, ['about']) : '',
    conferenceInfo: mainRecord ? getStringField(mainRecord, ['conference info', 'conference_info']) : '',
    venueInfo: [locationText, eventDateText].filter(Boolean).join(' • '),
  };
}

export function parseOrganizers(records: DatabaseRecord[]) {
  const groups = { hcomp: [] as OrganizerPerson[], ci: [] as OrganizerPerson[] };

  for (const record of records) {
    const name = getStringField(record, ['name']);
    if (!name) continue;

    const person = {
      id: record.id,
      name,
      org: getStringField(record, ['organization', 'org']),
      role: getStringField(record, ['role']),
      photo: getStringField(record, ['photos', 'photo', 'image']),
      conference: getStringField(record, ['conference']),
      email: getStringField(record, ['email', 'e-mail', 'mail']),
      order: Number(getStringField(record, ['order'])) || 999,
    };

    const conference = person.conference.toLowerCase();
    if (conference.includes('ci')) groups.ci.push(person);
    if (conference.includes('hcomp')) groups.hcomp.push(person);
  }

  groups.hcomp.sort((a, b) => sortByText(`${a.role}-${a.name}`, `${b.role}-${b.name}`));
  groups.ci.sort((a, b) => sortByText(`${a.role}-${a.name}`, `${b.role}-${b.name}`));

  return groups;
}

export function parseOrganizerPeople(records: DatabaseRecord[]) {
  return records
    .map((record) => {
      const name = getStringField(record, ['name']);
      if (!name) return null;

      return {
        id: record.id,
        name,
        org: getStringField(record, ['organization', 'org']),
        role: getStringField(record, ['role']),
        photo: getStringField(record, ['photos', 'photo', 'image']),
        conference: getStringField(record, ['conference']),
        email: getStringField(record, ['email', 'e-mail', 'mail']),
        order: Number(getStringField(record, ['order'])) || 999,
      } satisfies OrganizerPerson;
    })
    .filter(Boolean) as OrganizerPerson[];
}

export function parseSponsorLogos(records: DatabaseRecord[]) {
  return records
    .map((record) => ({
      name: getStringField(record, ['name', 'sponsorsname', 'sponsor name']),
      sub: getStringField(record, ['sub', 'subtitle', 'description', 'organization']),
      logo: getStringField(record, ['logo', 'image', 'photo', 'photos']),
      url: getStringField(record, ['url', 'link', 'website']),
      group: getStringField(record, ['group', 'tier', 'category', 'label']) || 'general',
    }))
    .filter((item) => item.name || item.logo);
}

export function parseCommunityPhotos(records: DatabaseRecord[]) {
  return records
    .map((record) => ({
      name: getStringField(record, ['name', 'title']),
      caption: getStringField(record, ['caption', 'description', 'subtitle', 'name', 'title']),
      image: getStringField(record, ['files & media', 'files and media', 'image', 'photo', 'photos', 'logo']),
      url: getStringField(record, ['url', 'link', 'website']),
    }))
    .filter((item) => item.image || item.name || item.caption);
}

export function parseSponsorTierRows(records: DatabaseRecord[]) {
  if (records.length === 0) {
    return [];
  }

  const tierValues: Record<string, Partial<Omit<SponsorTierRow, 'feature'>>> = {
    platinum: {},
    gold: {},
    silver: {},
    bronze: {},
  };

  const featureOrder: string[] = [];

  for (const record of records) {
    const tierName = getStringField(record, ['name']).trim().toLowerCase();
    if (!['platinum', 'gold', 'silver', 'bronze'].includes(tierName)) {
      continue;
    }

    for (const [key, rawValue] of Object.entries(record.fields)) {
      if (normalizeKey(key) === 'name') {
        continue;
      }

      if (!featureOrder.includes(key)) {
        featureOrder.push(key);
      }

      let value = '';
      if (typeof rawValue === 'boolean') {
        value = rawValue ? '✓' : '×';
      } else if (typeof rawValue === 'number') {
        value = String(rawValue);
      } else if (Array.isArray(rawValue)) {
        value = rawValue.join(', ');
      } else if (typeof rawValue === 'string') {
        value = rawValue || '';
      }

      tierValues[tierName][key] = value;
    }
  }

  return featureOrder.map((feature) => ({
    feature: prettifyFeatureLabel(feature),
    platinum: tierValues.platinum[feature] ?? '',
    gold: tierValues.gold[feature] ?? '',
    silver: tierValues.silver[feature] ?? '',
    bronze: tierValues.bronze[feature] ?? '',
  }));
}

export type PastMeetingRecord = {
  year: number;
  name: string;
  location: string;
  website: string;
  proceedings: string;
  bestPaperAward: string;
  conference: string;
};

export function parsePastMeetings(records: DatabaseRecord[]) {
  const all: PastMeetingRecord[] = records
    .map((record) => {
      const yearRaw = record.fields['year'] ?? record.fields['Year'];
      const year = typeof yearRaw === 'number' ? yearRaw : Number(getStringField(record, ['year']));
      if (!year || isNaN(year)) return null;

      return {
        year,
        name: getStringField(record, ['name', 'title']),
        location: getStringField(record, ['location', 'city', 'place']),
        website: getStringField(record, ['website', 'url', 'link']),
        proceedings: getStringField(record, ['proceedings', 'proceeding', 'proceedings url']),
        bestPaperAward: getStringField(record, ['best paper award', 'best paper', 'award']),
        conference: getStringField(record, ['conference']),
      };
    })
    .filter(Boolean) as PastMeetingRecord[];

  all.sort((a, b) => b.year - a.year);

  const hcomp = all.filter((m) => m.conference.toLowerCase().includes('hcomp'));
  const ci = all.filter((m) => m.conference.toLowerCase().includes('ci'));

  return { hcomp, ci };
}

export type PastReportRecord = {
  name: string;
  link: string;
};

export function parsePastReports(records: DatabaseRecord[]) {
  return records
    .map((record) => ({
      name: getStringField(record, ['name', 'title', 'citation']),
      link: getStringField(record, ['link', 'url', 'website']),
    }))
    .filter((item) => item.name || item.link);
}

export type ParsedAwardEntry = {
  title: string;
  authors: string;
};

export type ParsedAwardCategory = {
  category: string;
  entries: ParsedAwardEntry[];
};

/**
 * Parse a "best paper award" text field from Notion into structured award data.
 *
 * Expected format (from Notion rich text):
 *   Best Paper Award
 *   [1] Paper Title Here
 *   Author One, Author Two and Author Three
 *
 *   Honorable Mention Paper Awards
 *   [1] Paper Title Here
 *   Author One, Author Two
 *
 *   [2] Another Paper Title
 *   Author Three, Author Four
 */
export function parseBestPaperAwardText(text: string): ParsedAwardCategory[] {
  if (!text || !text.trim()) return [];

  const lines = text.split('\n').map((line) => line.trim());
  const categories: ParsedAwardCategory[] = [];
  let currentCategory: ParsedAwardCategory | null = null;
  let pendingTitle: string | null = null;

  for (const line of lines) {
    if (!line) {
      // Empty line — flush pending title without authors
      if (pendingTitle && currentCategory) {
        currentCategory.entries.push({ title: pendingTitle, authors: '' });
        pendingTitle = null;
      }
      continue;
    }

    // Check if this is a category header (award-related lines that aren't numbered entries)
    const isCategoryHeader =
      !/^\[/.test(line) && !/^[\d]/.test(line) &&
      (/award/i.test(line) || /finalist/i.test(line) || /honorable/i.test(line) || /^best\s/i.test(line));

    if (isCategoryHeader) {
      // Flush any pending title from previous category
      if (pendingTitle && currentCategory) {
        currentCategory.entries.push({ title: pendingTitle, authors: '' });
        pendingTitle = null;
      }
      currentCategory = { category: line, entries: [] };
      categories.push(currentCategory);
      continue;
    }

    // Check if this line starts with [N] — it's a title line
    const titleMatch = line.match(/^\[\d+\]\s*(.*)/);
    if (titleMatch) {
      // Flush previous pending title
      if (pendingTitle && currentCategory) {
        currentCategory.entries.push({ title: pendingTitle, authors: '' });
      }
      pendingTitle = titleMatch[1].trim();
      continue;
    }

    // Otherwise, if we have a pending title, this line is the authors
    if (pendingTitle && currentCategory) {
      currentCategory.entries.push({ title: pendingTitle, authors: line });
      pendingTitle = null;
      continue;
    }

    // If no category yet but line looks like a standalone title (no [N] prefix),
    // create a default category
    if (!currentCategory) {
      currentCategory = { category: 'Award', entries: [] };
      categories.push(currentCategory);
    }

    // Treat as a title without [N] prefix
    if (!pendingTitle) {
      pendingTitle = line;
    } else {
      // This is authors for the pending title
      currentCategory.entries.push({ title: pendingTitle, authors: line });
      pendingTitle = null;
    }
  }

  // Flush any remaining pending title
  if (pendingTitle && currentCategory) {
    currentCategory.entries.push({ title: pendingTitle, authors: '' });
  }

  return categories;
}

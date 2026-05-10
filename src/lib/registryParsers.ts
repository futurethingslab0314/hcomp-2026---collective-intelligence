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

export function parseOrganizers(records: DatabaseRecord[]) {
  const groups = { hcomp: [] as any[], ci: [] as any[] };

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
    };

    const conference = person.conference.toLowerCase();
    if (conference.includes('ci')) groups.ci.push(person);
    if (conference.includes('hcomp')) groups.hcomp.push(person);
  }

  groups.hcomp.sort((a, b) => sortByText(`${a.role}-${a.name}`, `${b.role}-${b.name}`));
  groups.ci.sort((a, b) => sortByText(`${a.role}-${a.name}`, `${b.role}-${b.name}`));

  return groups;
}

export function parseSponsorLogos(records: DatabaseRecord[]) {
  return records
    .map((record) => ({
      name: getStringField(record, ['name']),
      sub: getStringField(record, ['sub', 'subtitle', 'description', 'organization']),
      logo: getStringField(record, ['logo', 'image', 'photo', 'photos']),
      url: getStringField(record, ['url', 'link', 'website']),
      group: getStringField(record, ['group', 'tier', 'category']) || 'general',
    }))
    .filter((item) => item.name || item.logo);
}

export function parseCommunityPhotos(records: DatabaseRecord[]) {
  return records
    .map((record) => ({
      name: getStringField(record, ['name', 'title']),
      caption: getStringField(record, ['caption', 'description', 'subtitle', 'name', 'title']),
      image: getStringField(record, ['image', 'photo', 'photos', 'logo']),
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

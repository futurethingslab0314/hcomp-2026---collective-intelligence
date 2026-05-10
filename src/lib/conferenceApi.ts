export type ProgramSession = {
  startTime: string;
  endTime: string;
  title: string;
  type: string;
  location: string;
  keywords?: string[];
};

export type ProgramDay = {
  day: number;
  name: string;
  date: string;
  sessions: ProgramSession[];
};

export type Organizer = {
  id?: string;
  name: string;
  org: string;
  role: string;
  photo?: string;
  conference?: string;
  order?: number;
  email?: string;
};

export type OrganizerGroups = {
  hcomp: Organizer[];
  ci: Organizer[];
};

export type RichTextSpan = {
  text: string;
  href?: string;
  bold?: boolean;
  italic?: boolean;
  strikethrough?: boolean;
  underline?: boolean;
  code?: boolean;
};

export type ContentBlock =
  | { type: 'paragraph'; richText: RichTextSpan[] }
  | { type: 'heading_1'; richText: RichTextSpan[] }
  | { type: 'heading_2'; richText: RichTextSpan[] }
  | { type: 'heading_3'; richText: RichTextSpan[] }
  | { type: 'quote'; richText: RichTextSpan[] }
  | { type: 'callout'; richText: RichTextSpan[] }
  | { type: 'divider' }
  | { type: 'table'; rows: RichTextSpan[][][] }
  | { type: 'bulleted_list'; items: Array<{ type: 'bulleted_list_item'; richText: RichTextSpan[]; children?: ContentBlock[] }> }
  | { type: 'numbered_list'; items: Array<{ type: 'numbered_list_item'; richText: RichTextSpan[]; children?: ContentBlock[] }> };

export type DatabaseRecordValue = string | string[] | number | boolean | null;

export type DatabaseRecord = {
  id: string;
  fields: Record<string, DatabaseRecordValue>;
};

export type RegistryEntry =
  | {
      pageKey: string;
      sectionKey: string;
      sourceType: 'database';
      sourceId: string;
      enabled: boolean;
      description: string;
      sourceUrl: string;
      records: DatabaseRecord[];
    }
  | {
      pageKey: string;
      sectionKey: string;
      sourceType: 'page';
      sourceId: string;
      enabled: boolean;
      description: string;
      sourceUrl: string;
      blocks: ContentBlock[];
    }
  | {
      pageKey: string;
      sectionKey: string;
      sourceType: 'inline';
      sourceId: string;
      enabled: boolean;
      description: string;
      sourceUrl: string;
      text: string;
    };

export type RegistryContent = Record<string, Record<string, RegistryEntry>>;

function normalizeProgramDays(days: any[]): ProgramDay[] {
  return days.map((day, index) => ({
    day: Number(day.day) || index + 1,
    name: String(day.name ?? ''),
    date: String(day.date ?? ''),
    sessions: Array.isArray(day.sessions)
      ? day.sessions.map((session) => ({
          startTime: String(session.startTime ?? 'TBD'),
          endTime: String(session.endTime ?? 'TBD'),
          title: String(session.title ?? ''),
          type: String(session.type ?? 'Technical'),
          location: String(session.location ?? 'TBD'),
          keywords: Array.isArray(session.keywords)
            ? session.keywords.map((keyword: unknown) => String(keyword))
            : [],
        }))
      : [],
  }));
}

function normalizeOrganizers(payload: any): OrganizerGroups {
  const normalizeList = (items: any[]) =>
    items.map((item) => ({
      id: item.id ? String(item.id) : undefined,
      name: String(item.name ?? ''),
      org: String(item.organization ?? item.org ?? ''),
      role: String(item.role ?? ''),
      photo: item.photo ? String(item.photo) : undefined,
      conference: item.conference ? String(item.conference) : undefined,
      order: typeof item.order === 'number' ? item.order : Number(item.order ?? 999),
      email: item.email ? String(item.email) : undefined,
    }));

  return {
    hcomp: normalizeList(Array.isArray(payload?.hcomp) ? payload.hcomp : []),
    ci: normalizeList(Array.isArray(payload?.ci) ? payload.ci : []),
  };
}

async function fetchJson(url: string) {
  const response = await fetch(url);
  if (!response.ok) {
    const body = await response.text();
    let message = `Request failed: ${response.status}`;

    try {
      const parsed = JSON.parse(body);
      if (parsed?.error) {
        message = `Request failed: ${response.status} - ${parsed.error}`;
      } else if (body) {
        message = `Request failed: ${response.status} - ${body}`;
      }
    } catch {
      if (body) {
        message = `Request failed: ${response.status} - ${body}`;
      }
    }

    throw new Error(message);
  }
  return response.json();
}

export async function fetchProgramDays() {
  const payload = await fetchJson('/api/program');
  return normalizeProgramDays(Array.isArray(payload?.days) ? payload.days : []);
}

export async function fetchOrganizers() {
  const payload = await fetchJson('/api/organizers');
  return normalizeOrganizers(payload);
}

export async function fetchRegistryContent(pageKeys?: string[]) {
  const query = pageKeys && pageKeys.length > 0
    ? `?page_keys=${encodeURIComponent(pageKeys.join(','))}`
    : '';
  const payload = await fetchJson(`/api/content${query}`);
  return (payload?.registry ?? {}) as RegistryContent;
}

const NOTION_VERSION = '2022-06-28';
const NOTION_API_BASE = 'https://api.notion.com/v1';

function normalizeNotionId(value: string) {
  const match = value.match(/[0-9a-fA-F]{32}/);
  return (match ? match[0] : value).trim();
}

function normalizePropertyName(value: string) {
  return value.trim().toLowerCase().replace(/[\s/]+/g, '_');
}

type NotionSelect = { name?: string | null } | null;
type NotionText = { plain_text?: string | null };
type NotionFile =
  | {
      type?: 'external' | 'file';
      name?: string;
      external?: { url?: string };
      file?: { url?: string };
    }
  | null;

type NotionPropertyValue = {
  type?: string;
  title?: NotionText[];
  rich_text?: NotionText[];
  select?: NotionSelect;
  multi_select?: Array<{ name?: string | null }>;
  relation?: Array<{ id?: string | null }>;
  url?: string | null;
  email?: string | null;
  phone_number?: string | null;
  date?: { start?: string | null; end?: string | null } | null;
  files?: NotionFile[];
  status?: { name?: string | null } | null;
  checkbox?: boolean | null;
  unique_id?: { prefix?: string | null; number?: number | null } | null;
  rollup?:
    | {
        type?: string;
        number?: number | null;
        date?: { start?: string | null; end?: string | null } | null;
        array?: Array<NotionPropertyValue>;
      }
    | null;
  formula?:
    | {
        type?: string;
        string?: string | null;
        number?: number | null;
        boolean?: boolean | null;
      }
    | null;
  number?: number | null;
};

type NotionPage = {
  id: string;
  properties?: Record<string, NotionPropertyValue>;
};

function getProperty(
  properties: Record<string, NotionPropertyValue> | undefined,
  propertyName: string,
) {
  if (!properties) return undefined;
  if (properties[propertyName]) return properties[propertyName];

  const normalizedTarget = normalizePropertyName(propertyName);
  for (const [key, value] of Object.entries(properties)) {
    if (normalizePropertyName(key) === normalizedTarget) {
      return value;
    }
  }

  return undefined;
}

function getEnv(name: string) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing environment variable: ${name}`);
  }
  return value;
}

async function notionFetch(path: string, init?: RequestInit) {
  const apiKey = getEnv('NOTION_API_KEY');

  const response = await fetch(`${NOTION_API_BASE}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Notion-Version': NOTION_VERSION,
      'Content-Type': 'application/json',
      ...(init?.headers ?? {}),
    },
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Notion request failed (${response.status}): ${body}`);
  }

  return response.json();
}

export async function queryDatabaseById(databaseId: string) {
  const normalizedDatabaseId = normalizeNotionId(databaseId);
  const pages: NotionPage[] = [];
  let hasMore = true;
  let startCursor: string | undefined;

  while (hasMore) {
    const payload = startCursor ? { start_cursor: startCursor } : {};
    const data = await notionFetch(`/databases/${normalizedDatabaseId}/query`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });

    pages.push(...(data.results ?? []));
    hasMore = Boolean(data.has_more);
    startCursor = data.next_cursor ?? undefined;
  }

  return pages;
}

export async function queryDatabase(databaseIdEnvName: string) {
  const databaseId = getEnv(databaseIdEnvName);
  return queryDatabaseById(databaseId);
}

export function getPlainText(
  properties: Record<string, NotionPropertyValue> | undefined,
  propertyName: string,
) {
  const property = getProperty(properties, propertyName);
  if (!property) return '';

  if (property.type === 'title') {
    return (property.title ?? []).map((item) => item?.plain_text ?? '').join('').trim();
  }

  if (property.type === 'rich_text') {
    return (property.rich_text ?? []).map((item) => item?.plain_text ?? '').join('').trim();
  }

  if (property.type === 'select') {
    return property.select?.name?.trim?.() ?? '';
  }

  if (property.type === 'multi_select') {
    return (property.multi_select ?? [])
      .map((item) => item?.name?.trim?.() ?? '')
      .filter(Boolean)
      .join(', ');
  }

  if (property.type === 'status') {
    return property.status?.name?.trim?.() ?? '';
  }

  if (property.type === 'relation') {
    return (property.relation ?? [])
      .map((item) => item?.id?.trim?.() ?? '')
      .filter(Boolean)
      .join(', ');
  }

  if (property.type === 'url') {
    return property.url?.trim?.() ?? '';
  }

  if (property.type === 'email') {
    return property.email?.trim?.() ?? '';
  }

  if (property.type === 'phone_number') {
    return property.phone_number?.trim?.() ?? '';
  }

  if (property.type === 'date') {
    return property.date?.start?.trim?.() ?? '';
  }

  if (property.type === 'number') {
    return property.number != null ? String(property.number) : '';
  }

  if (property.type === 'checkbox') {
    return property.checkbox ? 'true' : 'false';
  }

  if (property.type === 'unique_id') {
    if (property.unique_id?.number == null) return '';
    return `${property.unique_id.prefix ?? ''}${property.unique_id.number}`;
  }

  if (property.type === 'rollup') {
    if (property.rollup?.type === 'number') {
      return property.rollup.number != null ? String(property.rollup.number) : '';
    }

    if (property.rollup?.type === 'date') {
      return property.rollup.date?.start?.trim?.() ?? '';
    }

    if (property.rollup?.type === 'array') {
      return (property.rollup.array ?? [])
        .map((item) => {
          if (item?.type === 'title') {
            return (item.title ?? []).map((text) => text?.plain_text ?? '').join('').trim();
          }
          if (item?.type === 'rich_text') {
            return (item.rich_text ?? []).map((text) => text?.plain_text ?? '').join('').trim();
          }
          if (item?.type === 'select') {
            return item.select?.name?.trim?.() ?? '';
          }
          if (item?.type === 'url') {
            return item.url?.trim?.() ?? '';
          }
          if (item?.type === 'relation') {
            return (item.relation ?? []).map((relation) => relation?.id?.trim?.() ?? '').filter(Boolean).join(', ');
          }
          if (item?.type === 'formula') {
            if (item.formula?.type === 'string') return item.formula.string?.trim?.() ?? '';
            if (item.formula?.type === 'number') return item.formula.number != null ? String(item.formula.number) : '';
            if (item.formula?.type === 'boolean') return item.formula.boolean ? 'true' : 'false';
          }
          return '';
        })
        .filter(Boolean)
        .join(', ');
    }
  }

  if (property.type === 'formula') {
    if (property.formula?.type === 'string') return property.formula.string?.trim?.() ?? '';
    if (property.formula?.type === 'number') return property.formula.number != null ? String(property.formula.number) : '';
    if (property.formula?.type === 'boolean') return property.formula.boolean ? 'true' : 'false';
  }

  return '';
}

export function getSelectValues(
  properties: Record<string, NotionPropertyValue> | undefined,
  propertyName: string,
) {
  const property = getProperty(properties, propertyName);
  if (!property) return [];

  if (property.type === 'multi_select') {
    return (property.multi_select ?? []).map((item) => item?.name?.trim?.() ?? '').filter(Boolean);
  }

  if (property.type === 'select') {
    return property.select?.name ? [property.select.name.trim()] : [];
  }

  const plainText = getPlainText(properties, propertyName);
  return plainText ? [plainText] : [];
}

export function getDateValue(
  properties: Record<string, NotionPropertyValue> | undefined,
  propertyName: string,
) {
  const property = getProperty(properties, propertyName);
  if (property?.type === 'date') {
    return property.date?.start ?? '';
  }
  return getPlainText(properties, propertyName);
}

export function getCheckboxValue(
  properties: Record<string, NotionPropertyValue> | undefined,
  propertyName: string,
) {
  const property = getProperty(properties, propertyName);
  if (property?.type === 'checkbox') {
    return Boolean(property.checkbox);
  }
  return getPlainText(properties, propertyName) === 'true';
}

export function getFileUrl(
  properties: Record<string, NotionPropertyValue> | undefined,
  propertyName: string,
) {
  const property = getProperty(properties, propertyName);
  if (property?.type !== 'files') {
    return getPlainText(properties, propertyName);
  }

  const file = property.files?.[0];
  if (!file) return '';
  if (file.type === 'external') return file.external?.url ?? '';
  if (file.type === 'file') return file.file?.url ?? '';
  return '';
}

export function getFileUrls(
  properties: Record<string, NotionPropertyValue> | undefined,
  propertyName: string,
) {
  const property = getProperty(properties, propertyName);
  if (property?.type !== 'files') {
    const plainText = getPlainText(properties, propertyName);
    return plainText ? [plainText] : [];
  }

  return (property.files ?? [])
    .map((file) => {
      if (file?.type === 'external') return file.external?.url ?? '';
      if (file?.type === 'file') return file.file?.url ?? '';
      return '';
    })
    .filter(Boolean);
}

export async function listBlockChildren(blockId: string) {
  const normalizedBlockId = normalizeNotionId(blockId);
  const blocks: any[] = [];
  let hasMore = true;
  let startCursor: string | undefined;

  while (hasMore) {
    const searchParams = new URLSearchParams({ page_size: '100' });
    if (startCursor) {
      searchParams.set('start_cursor', startCursor);
    }

    const data = await notionFetch(`/blocks/${normalizedBlockId}/children?${searchParams.toString()}`);
    blocks.push(...(data.results ?? []));
    hasMore = Boolean(data.has_more);
    startCursor = data.next_cursor ?? undefined;
  }

  return blocks;
}

export function json(res: any, status: number, body: unknown) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.end(JSON.stringify(body));
}

export function sortByDateTime<T extends { dateValue: string; startTime: string }>(items: T[]) {
  return [...items].sort((a, b) => {
    const dateCompare = a.dateValue.localeCompare(b.dateValue);
    if (dateCompare !== 0) return dateCompare;
    return a.startTime.localeCompare(b.startTime);
  });
}

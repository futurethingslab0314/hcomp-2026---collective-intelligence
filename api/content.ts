import {
  getCheckboxValue,
  getPlainText,
  json,
  listBlockChildren,
  queryDatabase,
  queryDatabaseById,
} from './_lib/notion';
import {
  coalesceDocumentBlocks,
  extractNotionId,
  normalizeKey,
  type ContentBlock,
  type DatabaseRecord,
  type DatabaseRecordValue,
  type RegistryContent,
  type RegistryEntry,
  type RichTextSpan,
} from '../src/lib/notionContent';

type NotionRichText = {
  plain_text?: string | null;
  href?: string | null;
  annotations?: {
    bold?: boolean;
    italic?: boolean;
    strikethrough?: boolean;
    underline?: boolean;
    code?: boolean;
  } | null;
};

function normalizeRichText(items: NotionRichText[] = []): RichTextSpan[] {
  return items
    .map((item) => ({
      text: item?.plain_text ?? '',
      href: item?.href ?? undefined,
      bold: item?.annotations?.bold ?? undefined,
      italic: item?.annotations?.italic ?? undefined,
      strikethrough: item?.annotations?.strikethrough ?? undefined,
      underline: item?.annotations?.underline ?? undefined,
      code: item?.annotations?.code ?? undefined,
    }))
    .filter((item) => item.text);
}

function serializePropertyValue(property: any): DatabaseRecordValue {
  if (!property?.type) return null;

  switch (property.type) {
    case 'title':
      return normalizeRichText(property.title).map((item) => item.text).join('').trim();
    case 'rich_text':
      return normalizeRichText(property.rich_text).map((item) => item.text).join('').trim();
    case 'select':
      return property.select?.name?.trim?.() ?? '';
    case 'multi_select':
      return (property.multi_select ?? []).map((item: any) => item?.name?.trim?.() ?? '').filter(Boolean);
    case 'status':
      return property.status?.name?.trim?.() ?? '';
    case 'url':
      return property.url?.trim?.() ?? '';
    case 'email':
      return property.email?.trim?.() ?? '';
    case 'phone_number':
      return property.phone_number?.trim?.() ?? '';
    case 'date':
      return property.date?.start?.trim?.() ?? '';
    case 'number':
      return typeof property.number === 'number' ? property.number : null;
    case 'checkbox':
      return Boolean(property.checkbox);
    case 'files':
      return (property.files ?? [])
        .map((file: any) => {
          if (file?.type === 'external') return file.external?.url ?? '';
          if (file?.type === 'file') return file.file?.url ?? '';
          return '';
        })
        .filter(Boolean);
    case 'formula':
      if (property.formula?.type === 'string') return property.formula.string?.trim?.() ?? '';
      if (property.formula?.type === 'number') return typeof property.formula.number === 'number' ? property.formula.number : null;
      if (property.formula?.type === 'boolean') return Boolean(property.formula.boolean);
      return null;
    default:
      return null;
  }
}

function serializeDatabaseRecords(pages: any[]): DatabaseRecord[] {
  return pages.map((page) => ({
    id: String(page.id ?? ''),
    fields: Object.fromEntries(
      Object.entries(page.properties ?? {}).map(([key, value]) => [key, serializePropertyValue(value)]),
    ),
  }));
}

async function normalizeBlock(block: any): Promise<ContentBlock | null> {
  const payload = block?.[block.type] ?? {};
  const richText = normalizeRichText(payload.rich_text ?? []);

  if (block.type === 'paragraph') {
    return { type: 'paragraph', richText };
  }

  if (block.type === 'heading_1' || block.type === 'heading_2' || block.type === 'heading_3') {
    return { type: block.type, richText } as ContentBlock;
  }

  if (block.type === 'quote') {
    return { type: 'quote', richText };
  }

  if (block.type === 'callout') {
    return { type: 'callout', richText };
  }

  if (block.type === 'divider') {
    return { type: 'divider' };
  }

  if (block.type === 'bulleted_list_item' || block.type === 'numbered_list_item') {
    const children = block.has_children ? await fetchDocumentBlocks(block.id) : undefined;
    return {
      type: block.type,
      richText,
      children: children && children.length > 0 ? children : undefined,
    } as ContentBlock;
  }

  if (block.type === 'table') {
    const rows = await listBlockChildren(block.id);
    return {
      type: 'table',
      rows: rows
        .filter((row) => row.type === 'table_row')
        .map((row) =>
          (row.table_row?.cells ?? []).map((cell: NotionRichText[]) => normalizeRichText(cell)),
        ),
    };
  }

  return null;
}

async function fetchDocumentBlocks(sourceId: string) {
  const blockId = extractNotionId(sourceId);
  const blocks = await listBlockChildren(blockId);
  const normalized = await Promise.all(blocks.map((block) => normalizeBlock(block)));
  return coalesceDocumentBlocks(normalized.filter(Boolean) as ContentBlock[]);
}

function inferSourceType(rawValue: string, sourceId: string, description: string): 'database' | 'page' | 'inline' {
  const value = rawValue.trim().toLowerCase();
  if (value === 'database' || value === 'page' || value === 'inline') {
    return value;
  }
  if (sourceId) return 'database';
  if (description) return 'inline';
  return 'page';
}

async function resolveRegistryEntry(page: any): Promise<RegistryEntry | null> {
  const properties = page.properties;
  const pageKey = getPlainText(properties, 'page_key');
  const sectionKey = getPlainText(properties, 'section_key');
  const description = getPlainText(properties, 'description');
  const sourceUrl = getPlainText(properties, 'source_url') || getPlainText(properties, 'URL');
  const sourceId = extractNotionId(getPlainText(properties, 'source_id') || sourceUrl);
  const sourceType = inferSourceType(getPlainText(properties, 'source_type'), sourceId, description);
  const enabled = properties?.enabled ? getCheckboxValue(properties, 'enabled') : true;

  if (!enabled || !pageKey || !sectionKey) {
    return null;
  }

  if (sourceType === 'database' && sourceId) {
    const records = serializeDatabaseRecords(await queryDatabaseById(sourceId));
    return {
      pageKey,
      sectionKey,
      sourceType,
      sourceId,
      sourceUrl,
      description,
      enabled,
      records,
    };
  }

  if (sourceType === 'page' && sourceId) {
    return {
      pageKey,
      sectionKey,
      sourceType,
      sourceId,
      sourceUrl,
      description,
      enabled,
      blocks: await fetchDocumentBlocks(sourceId),
    };
  }

  return {
    pageKey,
    sectionKey,
    sourceType: 'inline',
    sourceId,
    sourceUrl,
    description,
    enabled,
    text: description,
  };
}

export default async function handler(_req: any, res: any) {
  try {
    const pages = await queryDatabase('NOTION_REGISTRY_DATABASE_ID');
    const rawPageKeys = typeof _req?.query?.page_keys === 'string' ? _req.query.page_keys : '';
    const requestedPageKeys = rawPageKeys
      .split(',')
      .map((value: string) => normalizeKey(value))
      .filter(Boolean);
    const filteredPages =
      requestedPageKeys.length > 0
        ? pages.filter((page) => {
            const pageKey = normalizeKey(getPlainText(page.properties, 'page_key'));
            return requestedPageKeys.includes(pageKey);
          })
        : pages;
    const settled = await Promise.allSettled(filteredPages.map((page) => resolveRegistryEntry(page)));

    const registry: RegistryContent = {};
    const warnings: string[] = [];

    for (const result of settled) {
      if (result.status === 'rejected') {
        warnings.push(result.reason instanceof Error ? result.reason.message : 'Unknown registry error');
        continue;
      }

      const entry = result.value;
      if (!entry) continue;

      const pageKey = normalizeKey(entry.pageKey);
      const sectionKey = normalizeKey(entry.sectionKey);
      if (!registry[pageKey]) {
        registry[pageKey] = {};
      }
      registry[pageKey][sectionKey] = entry;
    }

    json(res, 200, { registry, warnings });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    json(res, 500, { error: message });
  }
}

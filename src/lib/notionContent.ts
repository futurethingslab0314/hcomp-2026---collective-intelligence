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
  | { type: 'bulleted_list_item'; richText: RichTextSpan[]; children?: ContentBlock[] }
  | { type: 'numbered_list_item'; richText: RichTextSpan[]; children?: ContentBlock[] }
  | { type: 'bulleted_list'; items: Array<Extract<ContentBlock, { type: 'bulleted_list_item' }>> }
  | { type: 'numbered_list'; items: Array<Extract<ContentBlock, { type: 'numbered_list_item' }>> };

export type DatabaseRecordValue = string | string[] | number | boolean | null;

export type DatabaseRecord = {
  id: string;
  fields: Record<string, DatabaseRecordValue>;
};

export type RegistrySourceType = 'database' | 'page' | 'inline';

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

export function normalizeKey(value: string) {
  return value.trim().toLowerCase().replace(/[\s/]+/g, '_');
}

export function extractNotionId(value: string) {
  const match = value.match(/[0-9a-fA-F]{32}/);
  return match ? match[0].toLowerCase() : value.trim();
}

export function coalesceDocumentBlocks(blocks: ContentBlock[]) {
  const result: ContentBlock[] = [];

  for (const block of blocks) {
    const previous = result[result.length - 1];

    if (block.type === 'bulleted_list_item' && previous?.type === 'bulleted_list') {
      previous.items.push(block);
      continue;
    }

    if (block.type === 'numbered_list_item' && previous?.type === 'numbered_list') {
      previous.items.push(block);
      continue;
    }

    if (block.type === 'bulleted_list_item') {
      result.push({ type: 'bulleted_list', items: [block] });
      continue;
    }

    if (block.type === 'numbered_list_item') {
      result.push({ type: 'numbered_list', items: [block] });
      continue;
    }

    result.push(block);
  }

  return result;
}

export function getRecordField(record: DatabaseRecord, aliases: string[]) {
  const normalizedAliases = aliases.map(normalizeKey);

  for (const [key, value] of Object.entries(record.fields)) {
    if (normalizedAliases.includes(normalizeKey(key))) {
      return value;
    }
  }

  return null;
}

export function getStringField(record: DatabaseRecord, aliases: string[]) {
  const value = getRecordField(record, aliases);
  if (Array.isArray(value)) return value.join(', ');
  if (typeof value === 'number') return String(value);
  if (typeof value === 'boolean') return value ? 'true' : 'false';
  return value ?? '';
}

export function getStringListField(record: DatabaseRecord, aliases: string[]) {
  const value = getRecordField(record, aliases);
  if (Array.isArray(value)) return value.map((item) => String(item)).filter(Boolean);
  if (typeof value === 'string') {
    return value
      .split(/[,;\n]/)
      .map((item) => item.trim())
      .filter(Boolean);
  }
  return [];
}

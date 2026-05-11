import { getCheckboxValue, getPlainText, queryDatabase } from './notion.js';

function normalizeKey(value: string) {
  return value.trim().toLowerCase().replace(/[\s/]+/g, '_');
}

function splitPageKeys(value: string) {
  return value
    .split(/[,;\n]/)
    .map((item) => normalizeKey(item))
    .filter(Boolean);
}

export async function getRegistrySourceId(pageKey: string | string[], sectionKey: string) {
  const rows = await queryDatabase('NOTION_REGISTRY_DATABASE_ID');
  const normalizedPageKeys = (Array.isArray(pageKey) ? pageKey : [pageKey]).map(normalizeKey);
  const normalizedSectionKey = normalizeKey(sectionKey);

  for (const row of rows) {
    const properties = row.properties;
    const rowPageKeys = splitPageKeys(getPlainText(properties, 'page_key'));
    const rowSectionKey = normalizeKey(getPlainText(properties, 'section_key'));
    const enabled = properties?.enabled ? getCheckboxValue(properties, 'enabled') : true;
    const sourceId = getPlainText(properties, 'source_id');

    if (enabled && rowPageKeys.some((rowPageKey) => normalizedPageKeys.includes(rowPageKey)) && rowSectionKey === normalizedSectionKey && sourceId) {
      return sourceId;
    }
  }

  throw new Error(`Missing registry source for ${Array.isArray(pageKey) ? pageKey.join(', ') : pageKey} / ${sectionKey}`);
}

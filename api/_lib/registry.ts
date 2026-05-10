import { getCheckboxValue, getPlainText, queryDatabase } from './notion';

function normalizeKey(value: string) {
  return value.trim().toLowerCase().replace(/[\s/]+/g, '_');
}

export async function getRegistrySourceId(pageKey: string, sectionKey: string) {
  const rows = await queryDatabase('NOTION_REGISTRY_DATABASE_ID');
  const normalizedPageKey = normalizeKey(pageKey);
  const normalizedSectionKey = normalizeKey(sectionKey);

  for (const row of rows) {
    const properties = row.properties;
    const rowPageKey = normalizeKey(getPlainText(properties, 'page_key'));
    const rowSectionKey = normalizeKey(getPlainText(properties, 'section_key'));
    const enabled = properties?.enabled ? getCheckboxValue(properties, 'enabled') : true;
    const sourceId = getPlainText(properties, 'source_id');

    if (enabled && rowPageKey === normalizedPageKey && rowSectionKey === normalizedSectionKey && sourceId) {
      return sourceId;
    }
  }

  throw new Error(`Missing registry source for ${pageKey} / ${sectionKey}`);
}

import { getFileUrl, getPlainText, json, queryDatabaseById } from './_lib/notion.js';
import { getRegistrySourceId } from './_lib/registry.js';

type OrganizerItem = {
  id: string;
  name: string;
  organization: string;
  role: string;
  photo: string;
  order: number;
  email: string;
};

export default async function handler(_req: any, res: any) {
  try {
    const databaseId = await getRegistrySourceId(['organizer page', 'organizers page'], 'organizers');
    const pages = await queryDatabaseById(databaseId);

    const people = pages
      .map((page) => {
        const properties = page.properties;
        const name = getPlainText(properties, 'Name');
        if (!name) return null;

        const person: OrganizerItem = {
          id: page.id,
          name,
          organization: getPlainText(properties, 'organization'),
          role: getPlainText(properties, 'Role'),
          photo: getFileUrl(properties, 'photos'),
          order: Number(getPlainText(properties, 'order')) || 999,
          email:
            getPlainText(properties, 'email') ||
            getPlainText(properties, 'Email') ||
            getPlainText(properties, 'e-mail'),
        };

        return person;
      })
      .filter(Boolean) as OrganizerItem[];

    const sorted = [...people].sort((a, b) => {
      const orderCompare = a.order - b.order;
      if (orderCompare !== 0) return orderCompare;
      const roleCompare = a.role.localeCompare(b.role, undefined, { sensitivity: 'base' });
      if (roleCompare !== 0) return roleCompare;
      return a.name.localeCompare(b.name);
    });

    json(res, 200, { organizers: sorted });
  } catch (error) {
    console.error('Failed to load organizers', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    json(res, 500, { error: message });
  }
}

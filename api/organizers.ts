import { getFileUrl, getPlainText, json, queryDatabaseById } from './_lib/notion';
import { getRegistrySourceId } from './_lib/registry';

type OrganizerItem = {
  id: string;
  name: string;
  organization: string;
  role: string;
  photo: string;
  conference: string;
};

function normalizeConference(value: string) {
  const normalized = value.toLowerCase();
  if (normalized.includes('hcomp')) return 'hcomp';
  if (normalized.includes('ci')) return 'ci';
  return 'other';
}

export default async function handler(_req: any, res: any) {
  try {
    const databaseId = await getRegistrySourceId(['organizer page', 'organizers page'], 'organizers');
    const pages = await queryDatabaseById(databaseId);

    const people = pages
      .map((page) => {
        const properties = page.properties;
        const name = getPlainText(properties, 'Name');
        if (!name) return null;

        return {
          id: page.id,
          name,
          organization: getPlainText(properties, 'organization'),
          role: getPlainText(properties, 'Role'),
          photo: getFileUrl(properties, 'photos'),
          conference: getPlainText(properties, 'conference'),
        } satisfies OrganizerItem;
      })
      .filter(Boolean) as OrganizerItem[];

    const sorted = [...people].sort((a, b) => {
      const conferenceCompare = normalizeConference(a.conference).localeCompare(normalizeConference(b.conference));
      if (conferenceCompare !== 0) return conferenceCompare;
      const roleCompare = a.role.localeCompare(b.role);
      if (roleCompare !== 0) return roleCompare;
      return a.name.localeCompare(b.name);
    });

    const payload = sorted.reduce<{ hcomp: OrganizerItem[]; ci: OrganizerItem[] }>(
      (acc, person) => {
        const conference = normalizeConference(person.conference);
        if (conference === 'hcomp') acc.hcomp.push(person);
        if (conference === 'ci') acc.ci.push(person);
        return acc;
      },
      { hcomp: [], ci: [] },
    );

    json(res, 200, payload);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    json(res, 500, { error: message });
  }
}

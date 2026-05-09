import {
  getDateValue,
  getPlainText,
  getSelectValues,
  json,
  queryDatabase,
  sortByDateTime,
} from './_lib/notion';

type ProgramItem = {
  id: string;
  dateValue: string;
  startTime: string;
  endTime: string;
  title: string;
  location: string;
  keywords: string[];
};

function formatDayName(dateValue: string) {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    timeZone: 'UTC',
  }).format(new Date(dateValue));
}

function formatWeekday(dateValue: string) {
  return new Intl.DateTimeFormat('en-US', {
    weekday: 'long',
    timeZone: 'UTC',
  }).format(new Date(dateValue));
}

function detectSessionType(keywords: string[]) {
  const normalized = keywords.map((keyword) => keyword.toLowerCase());
  if (normalized.some((keyword) => keyword.includes('keynote'))) return 'Keynote';
  if (normalized.some((keyword) => keyword.includes('network') || keyword.includes('social'))) return 'Social';
  return 'Technical';
}

export default async function handler(_req: any, res: any) {
  try {
    const pages = await queryDatabase('NOTION_PROGRAM_DATABASE_ID');

    const items = sortByDateTime(
      pages
        .map((page) => {
          const properties = page.properties;
          const dateValue = getDateValue(properties, 'Date');
          const startTime = getPlainText(properties, 'start_time');
          const endTime = getPlainText(properties, 'end_time');
          const title = getPlainText(properties, 'Topic');
          const location = getPlainText(properties, 'location');
          const keywords = getSelectValues(properties, 'keywords');

          if (!dateValue || !title) return null;

          return {
            id: page.id,
            dateValue,
            startTime,
            endTime,
            title,
            location,
            keywords,
          } satisfies ProgramItem;
        })
        .filter(Boolean) as ProgramItem[],
    );

    const dayIndexMap = new Map<string, number>();
    const days = items.reduce<
      Array<{
        day: number;
        name: string;
        date: string;
        sessions: Array<{
          startTime: string;
          endTime: string;
          title: string;
          type: string;
          location: string;
          keywords: string[];
        }>;
      }>
    >((acc, item) => {
      if (!dayIndexMap.has(item.dateValue)) {
        dayIndexMap.set(item.dateValue, acc.length + 1);
        acc.push({
          day: acc.length + 1,
          name: formatDayName(item.dateValue),
          date: formatWeekday(item.dateValue),
          sessions: [],
        });
      }

      const day = acc[dayIndexMap.get(item.dateValue)! - 1];
      day.sessions.push({
        startTime: item.startTime || 'TBD',
        endTime: item.endTime || 'TBD',
        title: item.title,
        type: detectSessionType(item.keywords),
        location: item.location || 'TBD',
        keywords: item.keywords,
      });

      return acc;
    }, []);

    json(res, 200, { days });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    json(res, 500, { error: message });
  }
}

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
};

export type OrganizerGroups = {
  hcomp: Organizer[];
  ci: Organizer[];
};

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
    }));

  return {
    hcomp: normalizeList(Array.isArray(payload?.hcomp) ? payload.hcomp : []),
    ci: normalizeList(Array.isArray(payload?.ci) ? payload.ci : []),
  };
}

async function fetchJson(url: string) {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Request failed: ${response.status}`);
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

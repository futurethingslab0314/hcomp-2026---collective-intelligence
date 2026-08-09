import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Users, 
  FileText, 
  Calendar, 
  MapPin, 
  Menu, 
  X, 
  ChevronRight,
  Clock,
  ShieldCheck,
  Network,
  Info,
  ArrowUp,
  ChevronDown,
  Layers
} from 'lucide-react';
import BackgroundCanvas from './components/BackgroundCanvas';
import NotionContentRenderer from './components/NotionContentRenderer';
import { CONFERENCE_CONTENT } from './constants/content';
import { THEME_COLORS } from './constants/theme';
import LoadingOverlay from './components/LoadingOverlay';
import { fetchOrganizers, fetchRegistryContent, fetchRegistryVisibility, type Organizer, type ProgramDay, type RegistryContent, type RegistryVisibility } from './lib/conferenceApi';
import { isRegistryPageEnabled, isRegistrySectionEnabled } from './lib/notionContent';
import {
  getDatabaseRecords,
  getRegistryEntryFromPages,
  getPageBlocks,
  getRegistryEntry,
  parseAccommodations,
  parseCommunityPhotos,
  parseConferenceInfoContent,
  parseConferenceTopicBriefs,
  parseDeadlines,
  parseOrganizerPeople,
  parseOrganizationLogos,
  parsePastMeetings,
  parsePastReports,
  parseBestPaperAwardText,
  parseProgram,
  parseSponsorLogos,
  parseSponsorTierRows,
  parseTopicSections,
  parseTransportation,
  parseVenueLocations,
  type PastMeetingRecord,
  type PastReportRecord,
  type TopicSection,
  type OrganizationLogoItem,
} from './lib/registryParsers';

type SectionId = 'home' | 'submission' | 'program' | 'organization' | 'past-meetings' | 'venue' | 'sponsors' | 'coc';

function getTopicSectionsFromRegistry(registryContent: RegistryContent | null) {
  let records = getDatabaseRecords(getRegistryEntry(registryContent, 'home page', 'topics of interest'));

  if (records.length === 0) {
    records = getDatabaseRecords(getRegistryEntry(registryContent, 'call for participation', 'topics of interest'));
  }

  if (records.length === 0 && registryContent) {
    for (const pageSections of Object.values(registryContent)) {
      const entry = pageSections?.['topics_of_interest'];
      const entryRecords = getDatabaseRecords(entry ?? null);
      if (entryRecords.length > 0) {
        records = entryRecords;
        break;
      }
    }
  }

  return parseTopicSections(records);
}

function getConferenceTopicBriefsFromRegistry(registryContent: RegistryContent | null) {
  let records = getDatabaseRecords(getRegistryEntry(registryContent, 'home page', 'conference info'));

  if (records.length === 0) {
    records = getDatabaseRecords(getRegistryEntry(registryContent, 'call for participation', 'conference info'));
  }

  if (records.length === 0 && registryContent) {
    for (const pageSections of Object.values(registryContent)) {
      const entry = pageSections?.['conference_info'];
      const entryRecords = getDatabaseRecords(entry ?? null);
      if (entryRecords.length > 0) {
        records = entryRecords;
        break;
      }
    }
  }

  return parseConferenceTopicBriefs(records);
}

function getConferenceInfoContentFromRegistry(registryContent: RegistryContent | null) {
  let records = getDatabaseRecords(getRegistryEntry(registryContent, 'home page', 'conference info'));

  if (records.length === 0) {
    records = getDatabaseRecords(getRegistryEntry(registryContent, 'call for participation', 'conference info'));
  }

  if (records.length === 0 && registryContent) {
    for (const pageSections of Object.values(registryContent)) {
      const entry = pageSections?.['conference_info'];
      const entryRecords = getDatabaseRecords(entry ?? null);
      if (entryRecords.length > 0) {
        records = entryRecords;
        break;
      }
    }
  }

  return parseConferenceInfoContent(records);
}

function withConferenceYear(value: string, conferenceYear: string) {
  return value.replaceAll(CONFERENCE_CONTENT.hero.year, conferenceYear);
}

export default function App() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [activeSection, setActiveSection] = useState<SectionId>('home');
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [selectedAwardYear, setSelectedAwardYear] = useState<number | null>(null);
  const [registryContent, setRegistryContent] = useState<RegistryContent | null>(null);
  const [registryVisibility, setRegistryVisibility] = useState<RegistryVisibility | null>(null);
  const [isLoadingRegistry, setIsLoadingRegistry] = useState(true);
  const conferenceInfoContent = getConferenceInfoContentFromRegistry(registryContent);
  const conferenceName = conferenceInfoContent.heroName.trim() || CONFERENCE_CONTENT.hero.title;
  const conferenceYear = conferenceInfoContent.year.trim() || CONFERENCE_CONTENT.hero.year;
  const shortConferenceYear = conferenceYear.slice(-2);

  // Apply colors to CSS variables
  useEffect(() => {
    let isMounted = true;
    void fetchRegistryVisibility()
      .then((visibility) => {
        if (isMounted) setRegistryVisibility(visibility);
      })
      .catch((error) => console.error('Failed to load registry visibility from Notion API.', error));
    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty('--brand-blue', THEME_COLORS.blue);
    root.style.setProperty('--brand-purple', THEME_COLORS.purple);
    root.style.setProperty('--brand-teal', THEME_COLORS.teal);
    root.style.setProperty('--brand-bg', THEME_COLORS.background);

    const handleSwitchSection = (e: any) => {
      const data = e.detail;
      if (typeof data === 'string') {
        setActiveSection(data as SectionId);
      } else if (data && typeof data === 'object') {
        setActiveSection(data.id as SectionId);
      }
      window.scrollTo(0, 0);
    };
    window.addEventListener('switch-section', handleSwitchSection);
    return () => window.removeEventListener('switch-section', handleSwitchSection);
  }, []);

  useEffect(() => {
    let isMounted = true;

    const registryPagesBySection: Record<SectionId, string[]> = {
      home: ['home page', 'call for participation'],
      submission: ['call for participation', 'home page', 'organizer page', 'organizers page'],
      venue: ['attend page'],
      program: ['program page'],
      organization: [],
      sponsors: ['sponsor page', 'organizer page', 'organizers page'],
      coc: ['code of conduct'],
      'past-meetings': ['past meetings'],
    };

    const loadRegistry = async () => {
      const requestedPageKeys = registryPagesBySection[activeSection] ?? [];
      if (requestedPageKeys.length === 0) {
        if (isMounted) {
          setIsLoadingRegistry(false);
        }
        return;
      }

      try {
        const content = await fetchRegistryContent(requestedPageKeys);
        if (isMounted && Object.keys(content).length > 0) {
          setRegistryContent((current) => ({ ...(current ?? {}), ...content }));
        }
      } catch (error) {
        console.error('Failed to load content registry from Notion API.', error);
      } finally {
        if (isMounted) {
          setIsLoadingRegistry(false);
        }
      }
    };

    void loadRegistry();

    return () => {
      isMounted = false;
    };
  }, [activeSection]);

  useEffect(() => {
    document.title = `${conferenceName} ${conferenceYear}`;
  }, [conferenceName, conferenceYear]);

  const sections = [
    { id: 'submission', label: 'Call for Participation', icon: FileText, pageKeys: ['call for participation'] },
    { id: 'venue', label: 'Attend', icon: MapPin, pageKeys: ['attend page'] },
    { id: 'program', label: 'Program', icon: Calendar, pageKeys: ['program page'] },
    { id: 'organization', label: 'Organizers', icon: Users, pageKeys: ['organizer page', 'organizers page'] },
    { id: 'sponsors', label: 'Sponsors', icon: ShieldCheck, pageKeys: ['sponsor page'] },
  ].filter((section) => isRegistryPageEnabled(registryVisibility, section.pageKeys));
  const visibleSectionIds = sections.map((section) => section.id).join(',');

  useEffect(() => {
    if (activeSection !== 'home' && !sections.some((section) => section.id === activeSection)) {
      setActiveSection('home');
    }
  }, [activeSection, registryVisibility, visibleSectionIds]);

  return (
    <div className="relative min-h-screen font-sans selection:bg-brand-blue/30 selection:text-white">
      {/* Background elements */}
      <div className="orb w-[500px] h-[500px] bg-brand-blue -top-[100px] -left-[100px] animate-float" />
      <div className="orb w-[600px] h-[600px] bg-brand-purple -bottom-[150px] -right-[100px] animate-float [animation-delay:2s]" />
      <div className="orb w-[400px] h-[400px] bg-brand-teal top-[200px] left-[400px] animate-float [animation-delay:4s]" />
      <div className="connection-grid" />
      
      <BackgroundCanvas />

      {/* Navigation */}
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        isScrolled 
          ? 'bg-brand-bg/80 backdrop-blur-2xl border-b border-white/5 py-4' 
          : 'bg-transparent py-8'
      }`}>
        <div className="px-6 md:px-10 flex items-center justify-between">
          {/* Logo */}
          <button 
            onClick={() => setActiveSection('home')}
            className="flex items-center gap-3 transition-transform hover:scale-105 group cursor-pointer"
          >
            <div className="text-left">
              <div className="text-[18px] md:text-[22px] font-bold tracking-tighter leading-none text-white">{conferenceName}'{shortConferenceYear}</div>
            </div>
          </button>

          {/* Desktop Nav Pill - Hidden on Mobile */}
          <div className="hidden md:flex items-center glass px-8 py-3 rounded-full gap-8 shadow-2xl">
            {sections.map((section) => (
              <button
                key={section.id}
                onClick={() => {
                  setActiveSection(section.id as SectionId);
                  setIsMenuOpen(false);
                }}
                className={`text-[11px] uppercase tracking-[0.15em] font-bold transition-all duration-300 cursor-pointer ${
                  activeSection === section.id 
                    ? 'text-white scale-105' 
                    : 'text-white/50 hover:text-white'
                }`}
              >
                {section.label}
              </button>
            ))}
          </div>

          {/* Registration/CTA Action */}
          <div className="hidden md:block">
            <button className="px-6 py-2.5 bg-white text-black text-[10px] font-bold uppercase tracking-[0.1em] rounded-full hover:scale-105 active:scale-95 transition-all cursor-pointer shadow-xl">
              Register
            </button>
          </div>
          
          {/* Mobile menu trigger - Only visible on small screens */}
          <button 
            className="md:hidden glass p-3.5 rounded-full text-white shadow-xl pointer-events-auto" 
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            {isMenuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </nav>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {isMenuOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 md:hidden bg-black/90 backdrop-blur-xl flex flex-col items-center justify-center gap-8 p-10"
          >
            {sections.map((section) => (
              <motion.button
                key={section.id}
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                onClick={() => {
                  setActiveSection(section.id as SectionId);
                  setIsMenuOpen(false);
                }}
                className={`text-2xl font-bold uppercase tracking-widest ${
                  activeSection === section.id ? 'text-brand-blue' : 'text-white/60'
                }`}
              >
                {section.label}
              </motion.button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <main className={`relative z-10 text-white transition-all duration-500 ${
        activeSection === 'home' 
          ? 'pt-32 pb-0 px-0 max-w-none' 
          : 'pt-32 pb-20 px-6 max-w-7xl mx-auto'
      }`}>
        <AnimatePresence mode="wait">
          <motion.div
            key={activeSection}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
          >
            {activeSection === 'home' && <AboutLandingSection registryContent={registryContent} registryVisibility={registryVisibility} conferenceName={conferenceName} conferenceYear={conferenceYear} />}
            {activeSection === 'submission' && <SubmissionSection registryContent={registryContent} registryVisibility={registryVisibility} isLoadingRegistry={isLoadingRegistry} conferenceName={conferenceName} conferenceYear={conferenceYear} />}
            {activeSection === 'venue' && <VenueSection registryContent={registryContent} isLoadingRegistry={isLoadingRegistry} conferenceName={conferenceName} conferenceYear={conferenceYear} />}
            {activeSection === 'program' && <ProgramSection registryContent={registryContent} isLoadingRegistry={isLoadingRegistry} />}
            {activeSection === 'organization' && <OrgSection isLoadingRegistry={isLoadingRegistry} conferenceName={conferenceName} conferenceYear={conferenceYear} />}
            {activeSection === 'sponsors' && <SponsorsSection registryContent={registryContent} isLoadingRegistry={isLoadingRegistry} conferenceName={conferenceName} conferenceYear={conferenceYear} />}
            {activeSection === 'coc' && <CodeOfConductSection registryContent={registryContent} isLoadingRegistry={isLoadingRegistry} />}
            {activeSection === 'past-meetings' && (
              <PastMeetingsSection 
                onShowAwards={setSelectedAwardYear} 
                registryContent={registryContent}
                conferenceName={conferenceName}
                conferenceYear={conferenceYear}
              />
            )}
          </motion.div>
        </AnimatePresence>
      </main>

      <AwardDrawer 
        year={selectedAwardYear} 
        onClose={() => setSelectedAwardYear(null)}
        conferenceName={conferenceName}
        dynamicMeetings={(() => {
          const entry = getRegistryEntry(registryContent, 'past meetings', 'past meetings');
          const records = getDatabaseRecords(entry);
          return records.length > 0 ? parsePastMeetings(records) : undefined;
        })()}
      />
    </div>
  );
}

function normalizeRoleLabel(value: string) {
  return value.trim().toLowerCase();
}

function roleIncludes(value: string, keywords: string[]) {
  const normalized = normalizeRoleLabel(value);
  return keywords.some((keyword) => normalized.includes(keyword));
}

function OrganizerMiniGrid({
  title,
  people,
  accentClass,
  conferenceName,
  conferenceYear,
}: {
  title: string;
  people: Organizer[];
  accentClass: string;
  conferenceName: string;
  conferenceYear: string;
}) {
  if (people.length === 0) {
    return null;
  }

  const sortPeople = (items: typeof people) =>
    [...items].sort((a, b) => {
      const orderCompare = (a.order ?? 999) - (b.order ?? 999);
      if (orderCompare !== 0) return orderCompare;
      const roleCompare = a.role.localeCompare(b.role, undefined, { sensitivity: 'base' });
      if (roleCompare !== 0) return roleCompare;
      return a.name.localeCompare(b.name, undefined, { sensitivity: 'base' });
    });

  const sortedPeople = sortPeople(people);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <h4 className={`text-xl font-bold ${accentClass}`}>{title}</h4>
        <div className="h-px flex-1 bg-white/10" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {sortedPeople.map((person, index) => (
          <div key={person.id ?? `${person.name}-${index}`} className="p-6 rounded-[2rem] glass border border-white/10 flex items-center gap-4">
            {person.photo ? (
              <img src={person.photo} alt={person.name} className="w-14 h-14 rounded-2xl object-cover border border-white/10" />
            ) : (
              <div className="w-14 h-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-white font-bold text-lg">
                {person.name[0]}
              </div>
            )}
            <div className="space-y-1">
              <div className="text-[10px] uppercase tracking-widest text-white/40 font-bold">{person.role}</div>
              <div className="text-lg font-bold leading-tight text-white">{person.name}</div>
              <div className={`text-[10px] uppercase tracking-widest font-bold ${accentClass}`}>{conferenceName} {conferenceYear}</div>
              <div className="text-sm text-white/50">{person.org}</div>
              {person.email ? <a href={`mailto:${person.email}`} className="inline-flex text-xs text-brand-blue hover:underline break-all">{person.email}</a> : null}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ComingSoonPanel({
  title,
  message,
}: {
  title: string;
  message: string;
}) {
  return (
    <div className="min-h-[400px] flex flex-col items-center justify-center text-center space-y-6">
      <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center border border-white/10">
        <Clock className="text-white/40" size={32} />
      </div>
      <div className="space-y-2">
        <h4 className="text-2xl font-display font-medium text-white/60">{title}</h4>
        <p className="text-white/30 font-serif italic text-base max-w-sm">{message}</p>
      </div>
    </div>
  );
}

function SponsorContactsGrid({
  people,
  conferenceName,
  conferenceYear,
}: {
  people: Organizer[];
  conferenceName: string;
  conferenceYear: string;
}) {
  if (people.length === 0) {
    return null;
  }

  const grouped = people.reduce<Array<{ role: string; items: typeof people }>>((acc, person) => {
    const role = person.role || 'contact';
    const existing = acc.find((group) => group.role === role);
    if (existing) {
      existing.items.push(person);
      return acc;
    }
    acc.push({ role, items: [person] });
    return acc;
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <h4 className="text-xl font-bold text-brand-blue">Sponsor Contacts</h4>
        <div className="h-px flex-1 bg-white/10" />
      </div>
      <div className="space-y-4">
        {grouped.map((group, index) => (
          <div key={`${group.role}-${index}`} className={`grid grid-cols-1 ${group.items.length > 1 ? 'md:grid-cols-2' : ''} gap-4`}>
            {group.items.map((person, itemIndex) => (
              <div key={person.id ?? `${person.name}-${itemIndex}`} className="p-6 rounded-[2rem] glass border border-white/10 flex items-center gap-4">
                {person.photo ? (
                  <img
                    src={person.photo}
                    alt={person.name}
                    className="w-14 h-14 rounded-2xl object-cover border border-white/10"
                  />
                ) : (
                  <div className="w-14 h-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-white font-bold text-lg">
                    {person.name[0]}
                  </div>
                )}
                <div className="space-y-1">
                  <div className="text-[10px] uppercase tracking-widest text-white/40 font-bold">{group.role}</div>
                  <div className="text-lg font-bold leading-tight text-white">{person.name}</div>
                  <div className="text-[10px] uppercase tracking-widest text-brand-blue font-bold">
                    {conferenceName} {conferenceYear}
                  </div>
                  <div className="text-sm text-white/50">{person.org}</div>
                  {person.email ? (
                    <a
                      href={`mailto:${person.email}`}
                      className="inline-flex text-xs text-brand-blue hover:underline break-all"
                    >
                      {person.email}
                    </a>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

function OrganizerConferenceColumn({
  title,
  people,
  accentClass,
}: {
  title: string;
  people: Organizer[];
  accentClass: string;
}) {
  const grouped = people.reduce<Array<{ order: number; items: Organizer[] }>>((acc, person) => {
    const order = person.order ?? 999;
    const existing = acc.find((group) => group.order === order);
    if (existing) {
      existing.items.push(person);
      return acc;
    }
    acc.push({ order, items: [person] });
    return acc;
  }, []);

  grouped.sort((a, b) => a.order - b.order);

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-4">
        <h3 className={`text-2xl font-bold ${accentClass}`}>{title}</h3>
        <div className={`h-px flex-1 ${accentClass === 'text-brand-teal' ? 'bg-brand-teal/20' : 'bg-brand-purple/20'}`} />
      </div>
      <div className="space-y-4">
        {grouped.map((group) => (
          <div key={group.order} className={`grid grid-cols-1 ${group.items.length > 1 ? 'md:grid-cols-2' : ''} gap-4`}>
            {group.items.map((member, i) => (
              <div key={`${member.id ?? member.name}-${i}`} className="p-6 rounded-3xl glass flex items-center gap-4 group">
                {member.photo ? (
                  <img
                    src={member.photo}
                    alt={member.name}
                    className={`w-12 h-12 rounded-2xl object-cover border ${accentClass === 'text-brand-teal' ? 'border-brand-teal/20' : 'border-brand-purple/20'}`}
                  />
                ) : (
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-bold text-lg transition-all ${accentClass === 'text-brand-teal'
                    ? 'bg-brand-teal/10 border border-brand-teal/20 text-brand-teal group-hover:bg-brand-teal group-hover:text-white'
                    : 'bg-brand-purple/10 border border-brand-purple/20 text-brand-purple group-hover:bg-brand-purple group-hover:text-white'}`}>
                    {member.name[0]}
                  </div>
                )}
                <div>
                  <div className={`text-[10px] font-bold uppercase tracking-widest leading-none mb-1 ${accentClass}`}>{member.role}</div>
                  <div className="font-bold text-lg leading-tight">{member.name}</div>
                  <div className="text-white/40 text-xs mt-0.5">{member.org}</div>
                  {member.email ? (
                    <a
                      href={`mailto:${member.email}`}
                      className="inline-flex mt-1 text-xs text-brand-blue hover:underline break-all"
                    >
                      {member.email}
                    </a>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

function GeneralChairsFeature({
  people,
  fallbackName,
  fallbackOrg,
  accentClass,
  borderClass,
  bgClass,
}: {
  people: Organizer[];
  fallbackName: string;
  fallbackOrg: string;
  accentClass: string;
  borderClass: string;
  bgClass: string;
}) {
  const displayPeople = people.length > 0
    ? people
    : [{ name: fallbackName, org: fallbackOrg, role: 'General Chair' }];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-10">
      {displayPeople.map((person, index) => (
        <div key={person.id ?? `${person.name}-${index}`} className="p-0 h-full flex items-center gap-5">
          {person.photo ? (
            <img
              src={person.photo}
              alt={person.name}
              className={`w-20 h-20 md:w-24 md:h-24 rounded-[1.75rem] object-cover border ${borderClass} shadow-xl`}
            />
          ) : (
            <div className={`w-20 h-20 md:w-24 md:h-24 rounded-[1.75rem] border ${borderClass} ${bgClass} flex items-center justify-center text-2xl font-bold ${accentClass}`}>
              {person.name[0]}
            </div>
          )}
          <div className="space-y-1 min-w-0">
            <div className={`text-xs uppercase tracking-widest font-bold ${accentClass}`}>{person.role || 'General Chair'}</div>
            <div className="text-xl md:text-2xl font-bold leading-tight">{person.name}</div>
            <div className="text-sm text-white/40 italic font-serif">{person.org}</div>
            {person.email ? (
              <a href={`mailto:${person.email}`} className="inline-flex text-xs text-brand-blue hover:underline break-all">
                {person.email}
              </a>
            ) : null}
          </div>
        </div>
      ))}
    </div>
  );
}

function HomeOrganizationLogos({ items }: { items: OrganizationLogoItem[] }) {
  const groups: Array<[string, string]> = [
    ['main organizers', '主辦單位'],
    ['co-organizers', '共同主辦'],
    ['supporting organizations', '協辦單位'],
    ['sponsors', '贊助單位'],
  ];
  const visibleGroups = groups
    .map(([area, label]) => ({
      area,
      label,
      items: items.filter((item) => item.area.trim().toLowerCase() === area),
    }))
    .filter((group) => group.items.length > 0);

  if (visibleGroups.length === 0) return null;

  return (
    <section className="snap-start flex-none px-6 py-24 md:py-32">
      <div className="max-w-6xl mx-auto space-y-16">
        <div className="space-y-4 text-center">
          <div className="text-brand-teal text-xs font-bold uppercase tracking-[0.3em]">Partners</div>
          <h2 className="text-4xl md:text-5xl font-display font-bold">合作單位</h2>
        </div>
        <div className="space-y-14">
          {visibleGroups.map((group) => (
            <div key={group.area} className="space-y-6">
              <div className="flex items-center gap-4">
                <h3 className="text-lg md:text-xl font-bold whitespace-nowrap">{group.label}</h3>
                <div className="h-px flex-1 bg-white/15" />
              </div>
              <div className="flex flex-wrap justify-center gap-4 md:gap-6">
                {group.items.map((item) => (
                  <figure
                    key={item.id}
                    className="w-[160px] sm:w-[190px] min-h-[120px] rounded-2xl bg-white p-5 flex flex-col items-center justify-center gap-3 shadow-xl shadow-black/10"
                  >
                    <img src={item.logo} alt={item.name} className="w-full h-14 object-contain" />
                    <figcaption className="text-center text-xs font-semibold leading-snug text-black/70">
                      {item.name}
                    </figcaption>
                  </figure>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function PastMeetingsSection({ 
  onShowAwards,
  registryContent,
  conferenceName,
  conferenceYear,
}: { 
  onShowAwards: (year: number) => void,
  registryContent: RegistryContent | null,
  conferenceName: string,
  conferenceYear: string,
}) {
  const entry = getRegistryEntry(registryContent, 'past meetings', 'past meetings');
  const records = getDatabaseRecords(entry);
  const dynamicMeetings = records.length > 0 ? parsePastMeetings(records) : null;

  const reportsEntry = getRegistryEntry(registryContent, 'past meetings', 'past reports');
  const reportsRecords = getDatabaseRecords(reportsEntry);
  const dynamicReports = reportsRecords.length > 0 ? parsePastReports(reportsRecords) : null;
  const hasPastMeetingsData = Boolean((dynamicMeetings?.length ?? 0) > 0 || (dynamicReports?.length ?? 0) > 0);

  if (!hasPastMeetingsData) {
    return (
      <div className="space-y-24 pb-32">
        <div className="space-y-8">
          <div className="space-y-4">
            <h2 className="text-4xl md:text-5xl font-display font-bold">Past Meetings</h2>
            <p className="text-white/60 max-w-4xl text-lg md:text-xl font-light leading-relaxed">
              Archived conference materials will appear here once they are available.
            </p>
          </div>
        </div>
        <ComingSoonPanel
          title="Coming soon!"
          message="Past meetings and reports will be published here once the archive is ready."
        />
      </div>
    );
  }

  return (
    <div className="space-y-24 pb-32">
      <div className="space-y-8">
        <div className="space-y-4">
          <h2 className="text-4xl md:text-5xl font-display font-bold">Past Meetings</h2>
          <p className="text-white/60 max-w-4xl text-lg md:text-xl font-light leading-relaxed">
            Explore the history of {conferenceName}.
          </p>
        </div>
      </div>
      <PastConferenceSection onShowAwards={onShowAwards} hideHeader dynamicMeetings={dynamicMeetings ?? undefined} dynamicReports={dynamicReports} conferenceName={conferenceName} conferenceYear={conferenceYear} />
    </div>
  );
}

function AwardDrawer({ year, onClose, dynamicMeetings, conferenceName }: { year: number | null, onClose: () => void, dynamicMeetings?: PastMeetingRecord[], conferenceName: string }) {
  const dynamicMeeting = dynamicMeetings?.find(m => m.year === year);

  // Parse dynamic award text into structured categories
  const parsedAwards = dynamicMeeting?.bestPaperAward
    ? parseBestPaperAwardText(dynamicMeeting.bestPaperAward)
    : [];

  // Determine if we have any award content to show
  const hasStaticAwards = false;
  const hasDynamicAwards = parsedAwards.length > 0;
  const hasAnyAwards = hasStaticAwards || hasDynamicAwards;

  // Get proceedings URL from dynamic or static data
  const proceedingsUrl = dynamicMeeting?.proceedings;
  
  return (
    <AnimatePresence>
      {year && dynamicMeeting && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60]"
          />
          
          {/* Drawer */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed top-0 right-0 bottom-0 w-full max-w-xl bg-[#0a0a0a] border-l border-white/10 z-[70] shadow-2xl p-8 md:p-12 overflow-y-auto"
          >
            <div className="flex justify-between items-start mb-12">
              <div className="space-y-1">
                <div className="text-brand-teal text-xs font-bold uppercase tracking-widest">Awards Archive</div>
                <h2 className="text-4xl md:text-5xl font-display font-bold">{conferenceName} {year}</h2>
              </div>
              <button 
                onClick={onClose}
                className="p-2 hover:bg-white/5 rounded-full transition-colors cursor-pointer"
                aria-label="Close"
              >
                <X size={24} />
              </button>
            </div>

            <div className="space-y-16">
              {/* Dynamic parsed awards from Notion text */}
              {hasDynamicAwards && !hasStaticAwards && parsedAwards.map((category, catIndex) => {
                const isPrimaryAward = /^best\s/i.test(category.category);
                return (
                  <div key={catIndex} className="space-y-8">
                    <div className="flex items-center gap-4">
                      <span className={`px-4 py-1 ${isPrimaryAward ? 'bg-brand-teal/20 text-brand-teal' : 'bg-white/10 text-white/60'} text-[10px] font-bold uppercase tracking-widest rounded-full`}>
                        {category.category}
                      </span>
                      {!isPrimaryAward && <div className="h-px flex-1 bg-white/10" />}
                    </div>
                    <div className="space-y-12">
                      {category.entries.map((entry, entryIndex) => (
                        <div key={entryIndex} className="space-y-4">
                          <h3 className={`${isPrimaryAward ? 'text-2xl' : 'text-xl'} font-bold leading-snug`}>{entry.title}</h3>
                          {entry.authors && (
                            <p className={`${isPrimaryAward ? 'text-white/60 text-lg' : 'text-white/40 text-base'} font-serif italic leading-relaxed`}>{entry.authors}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}

              {!hasAnyAwards && (
                <div className="text-center py-20 text-white/30 italic font-serif">
                  Award metadata for this year is being transitioned to the digital archive.
                </div>
              )}
            </div>

            {proceedingsUrl && (
              <div className="mt-20 pt-12 border-t border-white/5 text-center">
                 <a 
                  href={proceedingsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-brand-teal font-bold group"
                 >
                   Read these papers in the full proceedings
                   <ChevronRight size={16} className="group-hover:translate-x-1 transition-transform" />
                 </a>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

function PastConferenceSection({
  onShowAwards,
  hideHeader = false,
  dynamicMeetings,
  dynamicReports,
  conferenceName,
  conferenceYear,
}: {
  onShowAwards: (year: number) => void;
  hideHeader?: boolean;
  dynamicMeetings?: PastMeetingRecord[];
  dynamicReports?: PastReportRecord[] | null;
  conferenceName: string;
  conferenceYear: string;
}) {
  const hcompMeetings = dynamicMeetings && dynamicMeetings.length > 0
    ? dynamicMeetings.map(m => ({
        year: m.year,
        name: m.name,
        location: m.location,
        website: m.website,
        proceedings: m.proceedings,
        bestPaperAward: m.bestPaperAward,
      }))
    : [];

  const reports = dynamicReports && dynamicReports.length > 0
    ? dynamicReports
    : [];

  return (
    <div className="space-y-16 pb-32">
      {!hideHeader && (
        <div className="space-y-6">
          <button 
            onClick={() => window.dispatchEvent(new CustomEvent('switch-section', { detail: 'home' }))}
            className="flex items-center gap-2 text-brand-teal font-bold text-sm hover:translate-x-1 transition-transform cursor-pointer"
          >
            <ChevronRight className="rotate-180" size={16} /> Back to {conferenceName}'{conferenceYear.slice(-2)}
          </button>
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
            <div className="space-y-4">
              <h2 className="text-4xl md:text-5xl font-display font-bold">Past Meetings</h2>
              <p className="text-white/60 max-w-2xl text-lg md:text-xl font-light leading-relaxed">
                Tracking the evolution of {conferenceName} through its archived meetings and reports.
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-px bg-white/10 rounded-[2rem] border border-white/10 overflow-hidden">
      {hcompMeetings.map((meeting, i) => (
          <motion.div
            key={meeting.year}
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            className="group relative bg-white/5 p-8 hover:bg-black/60 transition-colors"
          >
            <div className="space-y-6">
              <div className="flex justify-between items-start">
                <div className="text-brand-teal font-display font-bold text-5xl opacity-40 group-hover:opacity-100 transition-all">
                  {meeting.year}
                </div>
                <div className="text-[10px] font-bold text-white/30 uppercase tracking-[0.2em]">{conferenceName}</div>
              </div>

              <div className="space-y-2">
                {meeting.name ? <div className="text-white font-bold text-base">{meeting.name}</div> : null}
                <div className="flex items-center gap-2 text-white font-bold text-sm">
                  <MapPin size={12} className="text-brand-teal" />
                  {meeting.location}
                </div>
              </div>

              <div className="grid grid-cols-1 gap-2 pt-4">
                {meeting.website ? (
                  <a 
                    href={meeting.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between px-4 py-3 bg-white/5 rounded-xl text-[10px] uppercase tracking-widest font-bold hover:bg-white/10 hover:text-brand-teal transition-all group/btn"
                  >
                    Website
                    <ChevronRight size={12} className="group-hover/btn:translate-x-1 transition-transform" />
                  </a>
                ) : null}
                {meeting.proceedings ? (
                  <a 
                    href={meeting.proceedings}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between px-4 py-3 bg-white/5 rounded-xl text-[10px] uppercase tracking-widest font-bold hover:bg-white/10 hover:text-brand-teal transition-all group/btn"
                  >
                    Proceedings
                    <ChevronRight size={12} className="group-hover/btn:translate-x-1 transition-transform" />
                  </a>
                ) : null}
                {meeting.bestPaperAward ? (
                  <button 
                    onClick={() => onShowAwards(meeting.year)}
                    className="flex items-center justify-between px-4 py-3 bg-white/5 rounded-xl text-[10px] uppercase tracking-widest font-bold hover:bg-white/10 hover:text-brand-teal transition-all group/btn cursor-pointer"
                  >
                    Best Paper Award
                    <ChevronRight size={12} className="group-hover/btn:translate-x-1 transition-transform" />
                  </button>
                ) : null}
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="space-y-12 mt-32">
        <div className="flex items-center gap-4">
            <h3 className="text-3xl font-display font-bold">Library</h3>
            <div className="h-px flex-1 bg-white/10" />
        </div>
        
        <div className="space-y-8">
          <h4 className="text-xl font-bold text-brand-teal">Past Reports</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {reports.map((report, i) => (
              <motion.div 
                key={i}
                whileHover={{ x: 4 }}
                className="group p-8 glass rounded-[2rem] border-white/5 hover:border-brand-teal/30 transition-all flex flex-col justify-between items-start gap-6"
              >
                <p className="text-white/60 font-serif italic leading-relaxed">
                  {report.name}
                </p>
                {report.link && (
                  <a 
                    href={report.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-xs font-bold text-brand-teal hover:underline"
                  >
                    Read Report
                    <ChevronRight size={14} />
                  </a>
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function AboutLandingSection({
  registryContent: _registryContent,
  registryVisibility,
  conferenceName,
  conferenceYear,
}: {
  registryContent: RegistryContent | null;
  registryVisibility: RegistryVisibility | null;
  conferenceName: string;
  conferenceYear: string;
}) {
  const { hero, venueInfo, about } = CONFERENCE_CONTENT;
  const topicSections = getTopicSectionsFromRegistry(_registryContent);
  const conferenceInfoContent = getConferenceInfoContentFromRegistry(_registryContent);
  const organizationLogos = isRegistrySectionEnabled(registryVisibility, 'home page', 'logo area')
    ? parseOrganizationLogos(
        getDatabaseRecords(getRegistryEntry(_registryContent, 'home page', 'logo area')),
      )
    : [];
  const [homeOrganizers, setHomeOrganizers] = useState<Organizer[]>([]);
  const [isHeroLoading, setIsHeroLoading] = useState(true);
  const sectionHeight = `calc(100dvh - 12rem)`; // Adjusting height to better fit between header and footer
  const aboutParagraphs = (conferenceInfoContent.about || about.landing.content)
    .split(/\n{2,}/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean);
  const conferenceInfoText = conferenceInfoContent.conferenceInfo || about.info.content;
  const venueInfoText = conferenceInfoContent.venueInfo || venueInfo;
  const heroTitle = conferenceInfoContent.heroName || hero.title;
  const heroSubtitle = conferenceInfoContent.heroLongName || withConferenceYear(hero.subtitle, conferenceYear);
  const generalChairs = homeOrganizers.filter((person) => roleIncludes(person.role, ['general']));
  const fallbackGeneralChair = about.chairs.find((chair) => chair.event.includes('HCOMP')) ?? about.chairs[0];

  // Loop for the hero animation
  useEffect(() => {
    if (!isHeroLoading) {
      const timer = setTimeout(() => {
        setIsHeroLoading(true);
      }, 10000);
      return () => clearTimeout(timer);
    }
  }, [isHeroLoading]);

  useEffect(() => {
    let isMounted = true;

    const loadOrganizers = async () => {
      try {
        const organizers = await fetchOrganizers();
        if (isMounted) {
          setHomeOrganizers(organizers);
        }
      } catch (error) {
        console.error('Failed to load homepage organizers from Notion API.', error);
      }
    };

    void loadOrganizers();

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <div 
      className="snap-y snap-mandatory overflow-y-auto no-scrollbar scroll-smooth overscroll-contain flex flex-col gap-0"
      style={{ height: sectionHeight }}
    >
      {/* Page 1: Hero Section */}
      <div 
        className="snap-start flex-shrink-0 flex flex-col items-center justify-center relative px-6 overflow-hidden"
        style={{ height: sectionHeight }}
      >
        <AnimatePresence>
          {isHeroLoading && (
            <LoadingOverlay onComplete={() => setIsHeroLoading(false)} />
          )}
        </AnimatePresence>

        <div className="text-center space-y-8 max-w-7xl relative z-10">
          <motion.h1 
            className="text-[48px] sm:text-[70px] md:text-[110px] lg:text-[140px] font-bold leading-[0.85] tracking-tight text-title-gradient uppercase select-none"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          >
            {heroTitle}<br />
            {conferenceYear}
          </motion.h1>
          
          <motion.p 
            className="font-serif italic text-lg md:text-xl text-white/60 max-w-xl mx-auto leading-relaxed"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4, duration: 1 }}
          >
            {heroSubtitle}
          </motion.p>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1, duration: 1 }}
            className="pt-12 text-white/30 flex flex-col items-center gap-2"
          >
            <span className="text-[10px] uppercase tracking-[0.3em] font-bold">Scroll to Explore</span>
            <motion.div 
              animate={{ y: [0, 8, 0] }} 
              transition={{ repeat: Infinity, duration: 2 }}
              className="w-[1px] h-12 bg-white/20" 
            />
          </motion.div>
        </div>

        <div className="fixed bottom-12 left-12 z-20 hidden md:block">
          <div className="border-l-2 border-brand-blue pl-4 space-y-1">
            <h3 className="text-[10px] uppercase tracking-[0.2em] font-bold text-brand-blue">Location & Event Date</h3>
            <p className="text-sm font-medium text-white/80">{venueInfoText}</p>
          </div>
        </div>

        <div className="fixed bottom-12 right-12 z-20 hidden md:block">
          <button className="px-12 py-4 bg-white text-black text-[12px] font-bold uppercase tracking-[0.1em] rounded-sm hover:scale-105 active:scale-95 transition-all cursor-pointer shadow-2xl">
            Register Now
          </button>
        </div>
      </div>

      {/* Page 2: About the Conference */}
      <div 
        className="snap-start flex-none flex flex-col justify-center relative px-6 py-20"
        style={{ minHeight: sectionHeight }}
      >
        <div className="max-w-5xl mx-auto w-full">
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="space-y-12"
          >
            <h2 className="text-4xl md:text-5xl font-display font-bold text-white leading-tight">
              {about.landing.title}
            </h2>
            <div className="max-w-4xl space-y-8">
              {aboutParagraphs.map((para, i) => (
                <p key={i} className="text-lg md:text-xl text-white/70 leading-relaxed font-light">
                  {para}
                </p>
              ))}
            </div>
          </motion.div>
        </div>
      </div>

      {/* Page 3: Conference Information */}
      <div 
        className="snap-start flex-none flex flex-col justify-center relative px-6 py-20"
        style={{ minHeight: sectionHeight }}
      >
        <div className="max-w-6xl mx-auto w-full">
          <motion.div 
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="space-y-12 text-center"
          >
            <h2 className="text-4xl md:text-5xl font-display font-bold">{about.info.title}</h2>
            <div className="glass p-12 md:p-20 rounded-[4rem] border-brand-blue/20 bg-brand-blue/5">
              <p className="text-2xl md:text-4xl text-white/90 leading-snug font-light italic font-serif">
                "{conferenceInfoText}"
              </p>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Page 4: Current Conference */}
      <div className="snap-start flex-none min-h-screen py-24 md:py-32 px-6 flex flex-col gap-12 md:gap-16">
        <div className="space-y-6 text-center max-w-4xl mx-auto">
          <h2 className="text-4xl md:text-5xl font-display font-bold">{conferenceName} {conferenceYear}</h2>
          <p className="text-white/60 text-lg md:text-xl font-light leading-relaxed">
            {conferenceInfoText}
          </p>
        </div>
        
        <div className="grid grid-cols-1 gap-px bg-white/10 rounded-[2rem] md:rounded-[3rem] overflow-hidden glass border border-white/10 max-w-5xl w-full mx-auto auto-rows-min">
          <div className="p-8 md:p-16 pb-6 space-y-6 bg-white/5">
            <div className="text-brand-teal text-xs font-bold uppercase tracking-[0.3em] mb-2">Current Conference</div>
            <h3 className="text-3xl md:text-5xl font-display font-bold text-white leading-tight">{conferenceName}</h3>
          </div>
          
          {/* Chair Row T1 */}
          <div className="px-8 md:px-16 py-12 md:py-16 border-t border-white/10 bg-white/5">
            <GeneralChairsFeature
              people={generalChairs}
              fallbackName={fallbackGeneralChair?.name ?? 'To be announced'}
              fallbackOrg={fallbackGeneralChair?.org ?? ''}
              accentClass="text-brand-teal"
              borderClass="border-brand-teal/20"
              bgClass="bg-brand-teal/10"
            />
          </div>

          {/* Topics Row T1 */}
          <div className="p-8 md:p-16 border-t border-white/10 space-y-8 bg-white/5">
            <div className="text-xl font-bold flex items-center gap-3">
              <div className="w-8 h-[1px] bg-brand-teal" />
              Topics of Interest
            </div>
            {topicSections.length > 0 ? (
              <div className="space-y-8">
                {topicSections.map((topic, j) => (
                  <div key={j} className="space-y-4">
                    <div className="text-[10px] uppercase tracking-[0.15em] font-bold text-brand-teal bg-white/5 px-3 py-1 rounded-full w-fit">
                      {topic.category}
                    </div>
                    <ul className="grid grid-cols-1 gap-2">
                      {topic.items.map((item, k) => (
                        <li key={k} className="text-base text-white flex items-start gap-3 group">
                          <span className="text-brand-teal mt-1 flex-shrink-0 opacity-50 group-hover:opacity-100 transition-opacity">•</span>
                          <span className="leading-relaxed">{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-8 rounded-[2rem] border border-dashed border-white/10 bg-white/[0.02] text-sm text-white/35 italic font-serif">
                Topics of Interest for {conferenceName} {conferenceYear} are coming soon.
              </div>
            )}
          </div>

          {/* Footer Row T1 */}
          <div className="p-8 md:p-16 border-t border-white/10 bg-white/5">
            <a
              href="https://taiwanchi.org/"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-6 py-2 rounded-full border-[#ffe7a6]/30 text-[#ffe7a6] text-xs font-bold hover:bg-[#ffe7a6] hover:text-black transition-all group cursor-pointer"
            >
              View Past {conferenceName}
              <ChevronRight size={14} className="group-hover:translate-x-1 transition-transform" />
            </a>
          </div>

        </div>
        
        {/* Snap Cap: Helps with snapping and prevents rebound at the very bottom */}
        <div className="snap-end h-1 w-full" />
      </div>

      <HomeOrganizationLogos items={organizationLogos} />
    </div>
  );
}

function SponsorsSection({
  registryContent,
  isLoadingRegistry,
  conferenceName,
  conferenceYear,
}: {
  registryContent: RegistryContent | null;
  isLoadingRegistry: boolean;
  conferenceName: string;
  conferenceYear: string;
}) {
  const callForSponsorBlocks = getPageBlocks(getRegistryEntry(registryContent, 'sponsor page', 'call for sponsor'));
  const sponsorLogoItems = parseSponsorLogos(
    getDatabaseRecords(getRegistryEntry(registryContent, 'sponsor page', 'sponsor logo')),
  );
  const organizerPeople = parseOrganizerPeople(
    getDatabaseRecords(
      getRegistryEntryFromPages(registryContent, ['organizer page', 'organizers page'], 'organizers'),
    ),
  );
  const provenCommunityItems = parseCommunityPhotos(
    getDatabaseRecords(
      getRegistryEntry(registryContent, 'sponsor page', 'proven committee') ??
      getRegistryEntry(registryContent, 'sponsor page', 'proven communities'),
    ),
  );
  const sponsorTierRows = parseSponsorTierRows(
    getDatabaseRecords(getRegistryEntry(registryContent, 'sponsor page', 'sponsorship tiers')),
  );
  const groupedSponsorLogos = sponsorLogoItems.reduce<Record<string, typeof sponsorLogoItems>>(
    (acc, item) => {
      const group = item.group.trim().toLowerCase() || 'general';
      if (!acc[group]) {
        acc[group] = [];
      }
      acc[group].push(item);
      return acc;
    },
    {},
  );
  const sponsorLogoSections = [
    { key: 'platinum', title: 'Platinum Sponsors', accent: 'text-brand-teal' },
    { key: 'gold', title: 'Gold Sponsors', accent: 'text-[#ffe7a6]' },
    { key: 'silver', title: 'Silver Sponsors', accent: 'text-brand-blue' },
    { key: 'bronze', title: 'Bronze Sponsors', accent: 'text-orange-400' },
    { key: 'sponsoring societies', title: 'Sponsoring Societies', accent: 'text-brand-purple' },
  ].filter((section) => (groupedSponsorLogos[section.key] ?? []).length > 0);
  const usesRegistrySponsorTiers = sponsorTierRows.length > 0;
  const tiers = usesRegistrySponsorTiers ? [{ name: 'Platinum', price: '', perks: sponsorTierRows }] : [];
  const sponsorContacts = organizerPeople.filter((person) =>
    roleIncludes(person.role, ['general', 'sponsor']),
  );
  const marqueePhotos = provenCommunityItems.length > 0
    ? provenCommunityItems.map((item) => ({
        url: item.image,
        caption: item.caption || item.name,
        link: item.url,
      }))
    : [];
  const hasSponsorData = callForSponsorBlocks.length > 0
    || sponsorLogoItems.length > 0
    || sponsorTierRows.length > 0
    || provenCommunityItems.length > 0
    || sponsorContacts.length > 0;

  if (!hasSponsorData) {
    return (
      <div className="space-y-24 pb-32">
        <div className="space-y-8">
          <div className="space-y-4">
            <h2 className="text-4xl md:text-5xl font-display font-bold">Call for Sponsors</h2>
            {isLoadingRegistry ? (
              <p className="text-sm uppercase tracking-[0.18em] text-white/30 font-bold">Syncing with Notion...</p>
            ) : null}
          </div>
        </div>
        <ComingSoonPanel
          title="Coming soon!"
          message="Sponsor details will appear here once they are published."
        />
      </div>
    );
  }

  return (
    <div className="space-y-24 pb-32">
      {/* Hero Section */}
      <div className="space-y-8">
        <div className="space-y-4">
          <h2 className="text-4xl md:text-5xl font-display font-bold">Call for Sponsors</h2>
          {callForSponsorBlocks.length > 0 ? (
            <div className="max-w-4xl">
              <NotionContentRenderer blocks={callForSponsorBlocks} />
            </div>
          ) : null}
          {isLoadingRegistry ? (
            <p className="text-sm uppercase tracking-[0.18em] text-white/30 font-bold">Syncing with Notion...</p>
          ) : null}
        </div>

        {/* Current Sponsors Display (Moved to top) */}
        <div className="py-12 border-y border-white/5 space-y-16">
          {sponsorLogoSections.map((section) => {
            const items = groupedSponsorLogos[section.key] ?? [];
            const isSocieties = section.key === 'sponsoring societies';

            return (
              <div key={section.key} className="text-center space-y-10">
                <div className={`text-[10px] uppercase tracking-[0.4em] font-bold ${section.accent}`}>
                  {section.title}
                </div>
                <div className="flex flex-wrap justify-center gap-8 md:gap-12 items-start">
                  {items.map((s, i) => (
                    <motion.a
                      key={`${section.key}-${i}`}
                      href={s.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      initial={{ opacity: 0, y: 10 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      whileHover={{ scale: 1.02 }}
                      transition={{ delay: i * 0.08 }}
                      className="group flex flex-col items-center gap-4 w-[260px]"
                    >
                      <div className={`w-[260px] h-[150px] rounded-2xl border border-white/10 flex items-center justify-center p-6 overflow-hidden transition-all ${isSocieties ? 'bg-white shadow-xl shadow-white/5' : 'bg-white shadow-xl shadow-brand-teal/5 group-hover:shadow-brand-teal/20'}`}>
                        <img
                          src={s.logo}
                          alt={s.name}
                          className={`w-full h-full object-contain transition-all duration-500 ${isSocieties ? 'opacity-100' : 'filter grayscale group-hover:grayscale-0'}`}
                          referrerPolicy="no-referrer"
                        />
                      </div>
                      <div className="text-center">
                        <div className="text-sm font-bold text-white/90 group-hover:text-brand-teal transition-colors leading-tight">{s.name}</div>
                        {s.sub ? <div className="text-[9px] uppercase tracking-widest font-bold text-white/30 mt-1">{s.sub}</div> : null}
                      </div>
                    </motion.a>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 mt-12">
          <div className="space-y-6">
            <p className="text-white/70 leading-relaxed">
              Partnering with {conferenceName} {conferenceYear} as a sponsor offers your organization a unique opportunity to support the conference community and its research.
            </p>
            <p className="text-white/70 leading-relaxed">
              {conferenceName} is a cross-disciplinary conference fostering an inclusive atmosphere that encourages active participation from both industry and academia to share expertise and collaborate.
            </p>
          </div>
          <div className="glass p-8 rounded-3xl space-y-4">
            <h3 className="font-bold text-brand-teal uppercase tracking-widest text-xs">Your generous sponsorship will:</h3>
            <ul className="space-y-3">
              {[
                "Make the conference more accessible for academic researchers & students",
                "Invite influential keynote speakers",
                "Organize social events for community building",
                "Support essential conference logistics"
              ].map((item, i) => (
                <li key={i} className="flex items-start gap-3 text-sm text-white/60 italic font-serif">
                  <span className="text-brand-teal">•</span>
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Proven Communities */}
      <div className="space-y-12">
        <div className="flex items-center gap-4">
          <h3 className="text-3xl font-display font-bold whitespace-nowrap">Proven Communities</h3>
          <div className="h-px flex-1 bg-white/10" />
        </div>
        
        {/* Photo Marquee */}
        <div className="relative overflow-hidden py-10 -mx-4 md:-mx-12 lg:-mx-24">
          <div className="absolute inset-y-0 left-0 w-32 bg-gradient-to-r from-brand-bg to-transparent z-10" />
          <div className="absolute inset-y-0 right-0 w-32 bg-gradient-to-l from-brand-bg to-transparent z-10" />
          
          <motion.div 
            className="flex gap-6 w-max"
            animate={{ x: ["0%", "-50%"] }}
            transition={{ 
              duration: 40, 
              repeat: Infinity, 
              ease: "linear" 
            }}
          >
            {[...marqueePhotos, ...marqueePhotos].map((photo, i) => (
              photo.link ? (
                <a
                  key={i}
                  href={photo.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group relative w-[300px] md:w-[450px] aspect-[16/10] overflow-hidden rounded-[2rem] glass border border-white/10 block"
                >
                  <img 
                    src={photo.url} 
                    alt={photo.caption}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-8">
                    <div className="text-white font-display font-medium text-lg">{photo.caption}</div>
                  </div>
                </a>
              ) : (
                <div key={i} className="group relative w-[300px] md:w-[450px] aspect-[16/10] overflow-hidden rounded-[2rem] glass border border-white/10">
                  <img 
                    src={photo.url} 
                    alt={photo.caption}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-8">
                    <div className="text-white font-display font-medium text-lg">{photo.caption}</div>
                  </div>
                </div>
              )
            ))}
          </motion.div>
        </div>

      </div>

      {/* Sponsorship Tiers Table */}
      {tiers.length > 0 ? (
      <div className="space-y-12 overflow-hidden">
        <div className="space-y-2">
          <h3 className="text-3xl font-display font-bold">Sponsorship Tiers</h3>
          <p className="text-white/40 text-sm italic font-serif">Bronze levels and higher receive branding across website, materials, and signage.</p>
        </div>

        <div className="overflow-x-auto no-scrollbar">
          <table className="w-full border-collapse glass rounded-3xl overflow-hidden min-w-[800px]">
            <thead>
              <tr className="bg-white/10 uppercase text-[10px] tracking-widest font-bold">
                <th className="p-6 text-left border-r border-white/5">Feature</th>
                <th className="p-6 text-center border-r border-white/5 text-brand-teal">Platinum</th>
                <th className="p-6 text-center border-r border-white/5 text-[#ffe7a6]">Gold</th>
                <th className="p-6 text-center border-r border-white/5 text-brand-blue">Silver</th>
                <th className="p-6 text-center text-orange-400">Bronze</th>
              </tr>
            </thead>
            <tbody className="text-sm font-medium">
              {tiers[0].perks.map((perk, i) => (
                <tr key={i} className={`border-b border-white/5 hover:bg-white/[0.02] transition-colors ${i % 2 === 0 ? 'bg-black/20' : ''}`}>
                  <td className="p-5 border-r border-white/5 text-white/80">{perk.feature}</td>
                  <td className={`p-5 text-center border-r border-white/5 ${perk.platinum === '✓' ? 'text-brand-teal font-bold text-lg' : perk.platinum === '×' ? 'text-white/20' : 'text-brand-teal'}`}>{perk.platinum}</td>
                  <td className={`p-5 text-center border-r border-white/5 ${perk.gold === '✓' ? 'text-[#ffe7a6] font-bold text-lg' : perk.gold === '×' ? 'text-white/20' : 'text-[#ffe7a6]'}`}>{perk.gold}</td>
                  <td className={`p-5 text-center border-r border-white/5 ${perk.silver === '✓' ? 'text-brand-blue font-bold text-lg' : perk.silver === '×' ? 'text-white/20' : 'text-brand-blue'}`}>{perk.silver}</td>
                  <td className={`p-5 text-center ${perk.bronze === '✓' ? 'text-orange-400 font-bold text-lg' : perk.bronze === '×' ? 'text-white/20' : 'text-orange-400'}`}>{perk.bronze}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      ) : null}

      {/* Let's Talk / CTA */}
      <div className="space-y-12">
        <div className="space-y-4">
          <h3 className="text-3xl font-display font-bold">Let's Talk!</h3>
          <p className="text-white/60 max-w-2xl text-lg font-light italic font-serif">
            We invite potential sponsors to get in touch with the General Chairs to discuss partnership details.
          </p>
        </div>

        {sponsorContacts.length > 0 ? (
          <SponsorContactsGrid people={sponsorContacts} conferenceName={conferenceName} conferenceYear={conferenceYear} />
        ) : null}
      </div>
    </div>
  );
}

function CodeOfConductSection({
  registryContent,
  isLoadingRegistry,
}: {
  registryContent: RegistryContent | null;
  isLoadingRegistry: boolean;
}) {
  const { codeOfConduct } = CONFERENCE_CONTENT;
  const pageBlocks = getPageBlocks(getRegistryEntry(registryContent, 'code of conduct', 'code of conduct'));

  return (
    <div className="space-y-24 pb-32">
      <div className="space-y-8">
        <div className="space-y-4">
          <h2 className="text-4xl md:text-5xl font-display font-bold">{codeOfConduct.title}</h2>
          {isLoadingRegistry ? (
            <p className="text-sm uppercase tracking-[0.18em] text-white/30 font-bold">Syncing with Notion...</p>
          ) : null}
        </div>
      </div>
      {pageBlocks.length > 0 ? (
        <div className="max-w-5xl">
          <NotionContentRenderer blocks={pageBlocks} />
        </div>
      ) : (
        <ComingSoonPanel
          title="Coming soon!"
          message="The code of conduct will be published here once it is available."
        />
      )}
    </div>
  );
}

function SubmissionSection({
  registryContent,
  registryVisibility,
  isLoadingRegistry,
  conferenceName,
  conferenceYear,
}: {
  registryContent: RegistryContent | null;
  registryVisibility: RegistryVisibility | null;
  isLoadingRegistry: boolean;
  conferenceName: string;
  conferenceYear: string;
}) {
  const { cfpDetails, deadlines } = CONFERENCE_CONTENT;
  const topicSections = getTopicSectionsFromRegistry(registryContent);
  const topicBriefs = getConferenceTopicBriefsFromRegistry(registryContent);
  const [activeTab, setActiveTab] = useState<'general' | 'papers' | 'posters' | 'dc' | 'workshops' | 'crowdcamp' | 'dates'>('general');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const generalInstructionBlocks = getPageBlocks(getRegistryEntry(registryContent, 'call for participation', 'general instructions'));
  const papersBlocks = getPageBlocks(getRegistryEntry(registryContent, 'call for participation', 'papers'));
  const postersAndDemosBlocks = getPageBlocks(getRegistryEntry(registryContent, 'call for participation', 'poster and demos'));
  const doctoralConsortiumBlocks = getPageBlocks(getRegistryEntry(registryContent, 'call for participation', 'doctoral consortium'));
  const workshopsBlocks = getPageBlocks(getRegistryEntry(registryContent, 'call for participation', 'workshops'));
  const crowdcampBlocks = getPageBlocks(getRegistryEntry(registryContent, 'call for participation', 'crowdcamp'));
  const importantDateRecords = parseDeadlines(
    getDatabaseRecords(getRegistryEntry(registryContent, 'home page', 'important dates')),
  );
  const organizerPeople = parseOrganizerPeople(
    getDatabaseRecords(
      getRegistryEntryFromPages(registryContent, ['organizer page', 'organizers page'], 'organizers'),
    ),
  );
  const submissionDeadlines = importantDateRecords.length > 0 ? importantDateRecords : deadlines;
  const paperOrganizers = organizerPeople.filter((person) => roleIncludes(person.role, ['paper']));
  const posterOrganizers = organizerPeople.filter((person) => roleIncludes(person.role, ['poster', 'demo']));
  const dcOrganizers = organizerPeople.filter((person) => roleIncludes(person.role, ['doctoral consortium']));
  const workshopOrganizers = organizerPeople.filter((person) => roleIncludes(person.role, ['workshops']));
  const crowdcampOrganizers = organizerPeople.filter((person) => roleIncludes(person.role, ['crowdcamp']));

  const tabs = [
    { id: 'general', label: 'Instructions', pageKey: 'call for participation', sectionKey: 'general instructions' },
    { id: 'dates', label: 'Important Dates', pageKey: 'home page', sectionKey: 'important dates' },
    { id: 'papers', label: 'Papers', pageKey: 'call for participation', sectionKey: 'papers' },
    { id: 'posters', label: 'Posters and Demos', pageKey: 'call for participation', sectionKey: 'poster and demos' },
    { id: 'workshops', label: 'Workshops', pageKey: 'call for participation', sectionKey: 'workshops' },
  ].filter((tab) => isRegistrySectionEnabled(registryVisibility, tab.pageKey, tab.sectionKey));
  const visibleTabIds = tabs.map((tab) => tab.id).join(',');

  useEffect(() => {
    if (!tabs.some((tab) => tab.id === activeTab) && tabs[0]) {
      setActiveTab(tabs[0].id as typeof activeTab);
    }
  }, [activeTab, registryVisibility, visibleTabIds]);

  const currentTabLabel = tabs.find(t => t.id === activeTab)?.label;
  const topicBriefParagraphs = topicBriefs
    ? topicBriefs
        .split(/\n{2,}/)
        .map((paragraph) => paragraph.trim())
        .filter(Boolean)
    : [`${conferenceName} topics will be published here once they are available.`];
  const topicExampleLead = `Example topics for ${conferenceName} include, but are not limited to, the following:`;

  return (
    <div className="space-y-24 pb-32">
      {/* Header - Not Sticky */}
      <div className="space-y-8">
        <div className="space-y-4">
          <h2 className="text-4xl md:text-5xl font-display font-bold">Submission</h2>
          <p className="text-white/60 max-w-4xl text-lg md:text-xl font-light leading-relaxed">
            The primary submission formats are designed to accommodate the diverse fields represented in the {conferenceName} community.
          </p>
          {isLoadingRegistry ? (
            <p className="text-sm uppercase tracking-[0.18em] text-white/30 font-bold">Syncing with Notion...</p>
          ) : null}
        </div>
      </div>

      {/* Sticky Navigation Sub-Menu - Desktop: Tab behavior, Mobile: Dropdown behavior */}
      <div className="sticky top-20 md:top-24 z-30 py-2.5 md:py-6 -mx-4 px-4 bg-brand-bg/98 backdrop-blur-3xl border-b border-white/10 shadow-2xl">
        <div className="max-w-7xl mx-auto">
          {/* Desktop Version */}
          <div className="hidden md:flex flex-nowrap gap-3 no-scrollbar overflow-x-auto">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-5 py-3 rounded-xl text-[11px] uppercase font-extrabold tracking-[0.1em] transition-all border whitespace-nowrap cursor-pointer ${
                  activeTab === tab.id
                    ? 'bg-white text-black border-white shadow-xl shadow-white/20'
                    : 'bg-white/10 text-white border-white/20 hover:bg-white/20 hover:border-white/30'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Mobile Version: Dropdown UI */}
          <div className="md:hidden">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="w-full flex items-center justify-between py-4 bg-transparent text-white cursor-pointer transition-all border-b border-white/10"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 flex items-center justify-center text-brand-teal">
                  <Layers size={18} />
                </div>
                <span className="text-[11px] uppercase font-bold tracking-[0.2em]">{currentTabLabel}</span>
              </div>
              <motion.div
                animate={{ rotate: isMobileMenuOpen ? 180 : 0 }}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
              >
                <ChevronDown size={18} className="text-white/40" />
              </motion.div>
            </button>

            <AnimatePresence>
              {isMobileMenuOpen && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden z-50 border-b border-white/10"
                >
                  <div className="py-2 space-y-0.5">
                    {tabs.map(tab => (
                      <button
                        key={tab.id}
                        onClick={() => {
                          setActiveTab(tab.id as any);
                          setIsMobileMenuOpen(false);
                          // Optional: Scroll to top of section when changing tabs
                          window.scrollTo({ top: window.scrollY, behavior: 'smooth' });
                        }}
                        className={`w-full text-left p-4 text-[10px] uppercase font-bold tracking-widest transition-all ${
                          activeTab === tab.id
                            ? 'bg-brand-teal/10 text-brand-teal border-l-2 border-brand-teal'
                            : 'text-white/40 hover:text-white'
                        }`}
                      >
                        {tab.label}
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.3 }}
        >
          {activeTab === 'general' && (
            <section className="space-y-20">
              <div className="flex items-center gap-4">
                <h3 className="text-3xl font-display font-bold text-white">Instructions</h3>
                <div className="h-px flex-1 bg-white/10" />
              </div>

              {/* Topic of Interests */}
              <div className="space-y-8">
                <div className="flex items-center justify-between gap-6">
                  <h4 className="text-xl font-bold">Topic of Interests</h4>
                  <div className="px-4 py-2 rounded-full bg-brand-teal/10 text-brand-teal text-[10px] uppercase font-bold tracking-widest">{conferenceName}</div>
                </div>

                {/* Track Description Section */}
                <div className="max-w-4xl space-y-6">
                  <div className="space-y-6 text-sm md:text-base text-white/70 font-light leading-relaxed">
                    {topicBriefParagraphs.map((paragraph, index) => (
                      <p key={`${conferenceName}-brief-${index}`}>{paragraph}</p>
                    ))}
                    <p className="font-bold text-white">{topicExampleLead}</p>
                  </div>
                </div>

                {topicSections.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {topicSections.map((group, i: number) => (
                      <div key={i} className="p-8 glass rounded-[2rem] border-white/5 space-y-6">
                        <div className="text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full w-fit bg-brand-teal/10 text-brand-teal">
                          {group.category}
                        </div>
                        <ul className="space-y-3">
                          {group.items.map((item: string, j: number) => (
                            <li key={j} className="flex items-start gap-3 text-sm text-white/60 group">
                              <span className="mt-1.5 w-1 h-1 rounded-full shrink-0 bg-brand-teal" />
                              <span className="group-hover:text-white transition-colors">{item}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                ) : (
                  <ComingSoonPanel
                    title="Coming soon!"
                    message={`Topics of Interest for ${conferenceName} ${conferenceYear} will appear here once they are published.`}
                  />
                )}
              </div>

              <div className="space-y-8">
                <div className="flex items-center gap-4">
                  <h4 className="text-2xl font-display font-bold text-white">General Instructions</h4>
                  <div className="h-px flex-1 bg-white/10" />
                </div>

              {/* Submission Templates */}
                {generalInstructionBlocks.length > 0 ? (
                  <div className="max-w-5xl">
                    <NotionContentRenderer blocks={generalInstructionBlocks} />
                  </div>
                ) : (
                  <>
                    <div className="space-y-10">
                      <h4 className="text-xl font-bold">Submission Templates</h4>
                      <div className="space-y-6 max-w-4xl">
                        <p className="text-white/60 font-light leading-relaxed">
                          All submissions should use one of the following templates and must be converted to PDF at the time of submission. All authors should submit manuscripts for review in a single column format.
                        </p>
                        <div className="flex flex-wrap gap-4">
                          <button className="px-10 py-4 bg-white text-black rounded-sm font-bold uppercase tracking-widest text-[11px] hover:bg-brand-blue hover:text-white transition-all shadow-xl shadow-white/5">Word Template</button>
                          <button className="px-10 py-4 bg-white text-black rounded-sm font-bold uppercase tracking-widest text-[11px] hover:bg-brand-blue hover:text-white transition-all shadow-xl shadow-white/5">LaTex Template</button>
                        </div>
                        <div className="space-y-4 text-sm text-white/50 leading-relaxed font-light mt-8">
                          <p>For the Word Template, follow the embedded instructions to apply the paragraph styles to your various text elements.</p>
                          <p>
                            To use the LaTex Template within Overleaf, select New Project -&gt; Upload Project and select the .zip file downloaded from the link above. Please use the "sigconf" proceedings template to prepare your manuscript (see sample-sigconf.tex in the samples folder). On the first active line of the Code or Visual Text Editor, replace <code className="bg-white/10 px-1 rounded text-white">\documentclass[sigconf]{'{'}acmart{'}'}</code> with <code className="bg-white/10 px-1 rounded text-white">\documentclass[manuscript]{'{'}acmart{'}'}</code> to create a single-column format.
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-8">
                      <h4 className="text-xl font-bold">Policy on Using Large Language Models (LLMs) when Authoring Submissions</h4>
                      <div className="space-y-6 max-w-4xl text-sm text-white/60 leading-relaxed font-light">
                        <p>In line with other SIGCHI and computing conferences, {conferenceName} {conferenceYear} employs the following policy on the use of Large Language Models in authoring submissions.</p>
                        <p>Text generated from a large-scale language model (LLM), such as ChatGPT, must be clearly marked where such tools are used for purposes beyond editing the author’s own text. Please carefully review the ACM Policy on Authorship before you use these tools.</p>
                        <p>Note that the LaTeX template will default to hiding the Acknowledgements section while in review mode; please make sure that any LLM disclosure is available in your submitted version.</p>
                      </div>
                    </div>

                    <div className="space-y-8">
                      <h4 className="text-xl font-bold">Preprints Policy</h4>
                      <div className="space-y-6 max-w-4xl text-sm text-white/60 leading-relaxed font-light">
                        <p>We do not prohibit authors from posting preprints of their work on platforms such as SSRN or arXiv either before or during review by the conference. However, to maintain the integrity of the double-blind peer review, we ask that authors refrain from publicizing the research on social media or discussing it with the press until the review process is complete.</p>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </section>
          )}

          {activeTab === 'dates' && (
            <div className="space-y-12">
              <div className="flex items-center gap-4">
                <h3 className="text-3xl font-display font-bold text-white">Important Dates</h3>
                <div className="h-px flex-1 bg-white/10" />
              </div>
              <div className="grid grid-cols-1 gap-4">
                {submissionDeadlines.map((item: any, i: number) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.1 }}
                    className="group relative glass p-8 rounded-3xl flex flex-col md:flex-row md:items-center justify-between gap-6 overflow-hidden"
                  >
                    <div className={`absolute left-0 top-0 bottom-0 w-1 ${item.color.replace('text-', 'bg-')} opacity-50`} />
                    <div className="space-y-1">
                      <span className={`text-xs font-bold uppercase tracking-widest ${item.color}`}>{item.status}</span>
                      <h3 className="text-2xl font-bold">{item.label}</h3>
                    </div>
                    <div className="text-3xl md:text-4xl font-display font-bold tracking-tighter">
                      {item.date}
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'papers' && (
            <section className="space-y-12">
              <div className="flex items-center gap-4">
                <h3 className="text-3xl font-display font-bold text-white">Call for Papers</h3>
                <div className="h-px flex-1 bg-white/10" />
              </div>

              {papersBlocks.length > 0 ? (
                <div className="space-y-12">
                  <div className="max-w-5xl">
                    <NotionContentRenderer blocks={papersBlocks} />
                  </div>
                  <OrganizerMiniGrid title="Program Chairs and Organizers" people={paperOrganizers} accentClass="text-brand-purple" conferenceName={conferenceName} conferenceYear={conferenceYear} />
                </div>
              ) : (
                <>
                  <div className="hidden md:block glass rounded-[2rem] overflow-hidden border border-white/10">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="bg-brand-purple/20 border-b border-white/10">
                            <th className="p-6 text-[9px] uppercase tracking-widest font-bold">Option</th>
                            <th className="p-6 text-[9px] uppercase tracking-widest font-bold">Track</th>
                            <th className="p-6 text-[9px] uppercase tracking-widest font-bold">Max Words</th>
                            <th className="p-6 text-[9px] uppercase tracking-widest font-bold">Archival?</th>
                            <th className="p-6 text-[9px] uppercase tracking-widest font-bold">Review</th>
                            <th className="p-6 text-[9px] uppercase tracking-widest font-bold">Publication</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                          {cfpDetails.table.map((row: any, i: number) => (
                            <tr key={i} className="hover:bg-white/5 transition-colors">
                              <td className="p-6 align-top font-bold text-sm">{row.option}</td>
                              <td className="p-6 align-top text-xs text-white/70">{row.track}</td>
                              <td className="p-6 align-top text-xs text-white/70">{row.wordCount}</td>
                              <td className="p-6 align-top text-xs text-white/70 font-serif italic">{row.archival}</td>
                              <td className="p-6 align-top text-xs text-white/70">{row.review}</td>
                              <td className="p-6 align-top text-[10px] text-white/50">{row.published}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  <div className="md:hidden space-y-4">
                    {cfpDetails.table.map((row: any, i: number) => (
                      <div key={i} className="p-6 glass rounded-2xl border border-white/10 space-y-6">
                        <div className="flex justify-between items-start gap-4">
                          <div className="space-y-1">
                            <div className="text-[10px] text-brand-purple uppercase tracking-widest font-bold">{row.track}</div>
                            <h4 className="text-lg font-bold">{row.option}</h4>
                          </div>
                          <div className="bg-white/10 px-3 py-1 rounded-lg text-[9px] font-bold uppercase text-white/60">
                            {row.archival}
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4 text-xs">
                          <div className="space-y-2">
                            <div className="text-[9px] uppercase tracking-widest text-white/30 font-bold">Limit</div>
                            <div className="text-white/80">{row.wordCount}</div>
                          </div>
                          <div className="space-y-2">
                            <div className="text-[9px] uppercase tracking-widest text-white/30 font-bold">Review</div>
                            <div className="text-white/80">{row.review}</div>
                          </div>
                        </div>

                        <div className="space-y-2 pt-4 border-t border-white/5">
                          <div className="text-[9px] uppercase tracking-widest text-white/30 font-bold">Publication</div>
                          <div className="text-[11px] text-white/60 leading-relaxed italic">{row.published}</div>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                    <div className="space-y-10">
                      {cfpDetails.sections.map((section: any, i: number) => (
                        <div key={i} className="space-y-4">
                          <h4 className="font-bold text-white/90 underline decoration-white/10 underline-offset-4">{section.title}</h4>
                          {section.content && (
                            <p className="text-sm text-white/60 font-light leading-relaxed">
                              {section.title === 'ACM Publication Policies'
                                ? section.content
                                : withConferenceYear(section.content, conferenceYear)}
                            </p>
                          )}
                          {section.subsections?.map((sub: any, k: number) => (
                            <div key={k} className="space-y-1 pl-4 border-l border-white/10">
                              <div className="text-brand-blue font-bold text-xs">{sub.title}</div>
                              <div className="text-xs text-white/50">
                                {section.title === 'ACM Publication Policies'
                                  ? sub.content
                                  : withConferenceYear(sub.content, conferenceYear)}
                              </div>
                            </div>
                          ))}
                        </div>
                      ))}
                    </div>

                    <div className="space-y-8">
                      <div className="p-10 glass rounded-[2rem] border-white/10 bg-white/5 h-fit space-y-6">
                        <h4 className="text-lg font-bold">ACM Open Transition 2026</h4>
                        <p className="text-xs text-white/60 leading-relaxed font-light">
                          Starting January 1, 2026, all ACM-sponsored conferences will be 100% Open Access. A temporary subsidy is offered for 2026 to ease the transition ($250 for members, $350 for non-members).
                        </p>
                        <button className="w-full py-4 bg-white text-black rounded-xl font-bold uppercase tracking-widest text-[10px] hover:scale-[1.02] transition-all">Submit Now</button>
                      </div>
                    </div>
                  </div>
                  <OrganizerMiniGrid title="Program Chairs and Organizers" people={paperOrganizers} accentClass="text-brand-purple" conferenceName={conferenceName} conferenceYear={conferenceYear} />
                </>
              )}
            </section>
          )}

          {activeTab === 'posters' && (
            postersAndDemosBlocks.length > 0 ? (
              <section className="space-y-12">
                <div className="flex items-center gap-4">
                  <h3 className="text-3xl font-display font-bold text-white">Posters and Demos</h3>
                  <div className="h-px flex-1 bg-white/10" />
                </div>
                <div className="max-w-5xl">
                  <NotionContentRenderer blocks={postersAndDemosBlocks} />
                </div>
                <OrganizerMiniGrid title="Posters and Demos Organizers" people={posterOrganizers} accentClass="text-brand-purple" conferenceName={conferenceName} conferenceYear={conferenceYear} />
              </section>
            ) : (
              <>
                <div className="min-h-[400px] flex flex-col items-center justify-center text-center space-y-6">
                  <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center border border-white/10">
                    <Clock className="text-white/40" size={32} />
                  </div>
                  <div className="space-y-2">
                    <h4 className="text-2xl font-display font-medium text-white/60">Coming soon!</h4>
                    <p className="text-white/30 font-serif italic text-base max-w-sm">Full details for the Posters and Demos call will be posted shortly.</p>
                  </div>
                </div>
                <OrganizerMiniGrid title="Posters and Demos Organizers" people={posterOrganizers} accentClass="text-brand-purple" conferenceName={conferenceName} conferenceYear={conferenceYear} />
              </>
            )
          )}

          {activeTab === 'dc' && (
            doctoralConsortiumBlocks.length > 0 ? (
              <section className="space-y-12">
                <div className="flex items-center gap-4">
                  <h3 className="text-3xl font-display font-bold text-white">Doctoral Consortium</h3>
                  <div className="h-px flex-1 bg-white/10" />
                </div>
                <div className="max-w-5xl">
                  <NotionContentRenderer blocks={doctoralConsortiumBlocks} />
                </div>
                <OrganizerMiniGrid title="Doctoral Consortium Organizers" people={dcOrganizers} accentClass="text-brand-purple" conferenceName={conferenceName} conferenceYear={conferenceYear} />
              </section>
            ) : (
              <>
                <div className="min-h-[400px] flex flex-col items-center justify-center text-center space-y-6">
                  <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center border border-white/10">
                    <Clock className="text-white/40" size={32} />
                  </div>
                  <div className="space-y-2">
                    <h4 className="text-2xl font-display font-medium text-white/60">Coming soon!</h4>
                    <p className="text-white/30 font-serif italic text-base max-w-sm">Full details for the Doctoral Consortium will be posted shortly.</p>
                  </div>
                </div>
                <OrganizerMiniGrid title="Doctoral Consortium Organizers" people={dcOrganizers} accentClass="text-brand-purple" conferenceName={conferenceName} conferenceYear={conferenceYear} />
              </>
            )
          )}

          {activeTab === 'workshops' && (
            workshopsBlocks.length > 0 ? (
              <section className="space-y-12">
                <div className="flex items-center gap-4">
                  <h3 className="text-3xl font-display font-bold text-white">Workshops</h3>
                  <div className="h-px flex-1 bg-white/10" />
                </div>
                <div className="max-w-5xl">
                  <NotionContentRenderer blocks={workshopsBlocks} />
                </div>
                <OrganizerMiniGrid title="Workshop Organizers" people={workshopOrganizers} accentClass="text-brand-purple" conferenceName={conferenceName} conferenceYear={conferenceYear} />
              </section>
            ) : (
              <>
                <div className="min-h-[400px] flex flex-col items-center justify-center text-center space-y-6">
                  <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center border border-white/10">
                    <Clock className="text-white/40" size={32} />
                  </div>
                  <div className="space-y-2">
                    <h4 className="text-2xl font-display font-medium text-white/60">Coming soon!</h4>
                    <p className="text-white/30 font-serif italic text-base max-w-sm">Full details for the Workshops call will be posted shortly.</p>
                  </div>
                </div>
                <OrganizerMiniGrid title="Workshop Organizers" people={workshopOrganizers} accentClass="text-brand-purple" conferenceName={conferenceName} conferenceYear={conferenceYear} />
              </>
            )
          )}

          {activeTab === 'crowdcamp' && (
            crowdcampBlocks.length > 0 ? (
              <section className="space-y-12">
                <div className="flex items-center gap-4">
                  <h3 className="text-3xl font-display font-bold text-white">CrowdCamp</h3>
                  <div className="h-px flex-1 bg-white/10" />
                </div>
                <div className="max-w-5xl">
                  <NotionContentRenderer blocks={crowdcampBlocks} />
                </div>
                <OrganizerMiniGrid title="CrowdCamp Organizers" people={crowdcampOrganizers} accentClass="text-brand-purple" conferenceName={conferenceName} conferenceYear={conferenceYear} />
              </section>
            ) : (
              <>
                <div className="min-h-[400px] flex flex-col items-center justify-center text-center space-y-6">
                  <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center border border-white/10">
                    <Clock className="text-white/40" size={32} />
                  </div>
                  <div className="space-y-2">
                    <h4 className="text-2xl font-display font-medium text-white/60">Coming soon!</h4>
                    <p className="text-white/30 font-serif italic text-base max-w-sm">Full details for the CrowdCamp call will be posted shortly.</p>
                  </div>
                </div>
                <OrganizerMiniGrid title="CrowdCamp Organizers" people={crowdcampOrganizers} accentClass="text-brand-purple" conferenceName={conferenceName} conferenceYear={conferenceYear} />
              </>
            )
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

function ProgramSection({
  registryContent,
  isLoadingRegistry,
}: {
  registryContent: RegistryContent | null;
  isLoadingRegistry: boolean;
}) {
  const [showScrollTop, setShowScrollTop] = useState(false);
  const registryProgram = parseProgram(getDatabaseRecords(getRegistryEntry(registryContent, 'program page', 'program'))) as ProgramDay[];
  const program = registryProgram;

  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 400);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="space-y-32 pb-32 relative">
      {/* Floating Scroll Top */}
      <motion.button
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: showScrollTop ? 1 : 0, scale: showScrollTop ? 1 : 0.8 }}
        onClick={scrollToTop}
        className={`fixed bottom-8 right-8 z-50 p-4 rounded-full glass border border-white/10 shadow-2xl text-brand-teal hover:scale-110 active:scale-90 transition-all cursor-pointer ${showScrollTop ? 'pointer-events-auto' : 'pointer-events-none'}`}
      >
        <ArrowUp size={24} />
      </motion.button>

      <div className="space-y-8">
        <div className="space-y-4">
          <h2 className="text-4xl md:text-5xl font-display font-bold">Program</h2>
          <p className="text-white/60 max-w-4xl text-lg md:text-xl font-light leading-relaxed">
            A multi-track schedule featuring keynotes, technical sessions, and interactive workshops.
          </p>
          {isLoadingRegistry ? (
            <p className="text-sm uppercase tracking-[0.18em] text-white/30 font-bold">
              Syncing with Notion...
            </p>
          ) : null}
        </div>

        {/* Quick Jump Bar */}
        {program.length > 0 ? (
          <div className="sticky top-24 z-30 py-4 -mx-4 px-4 pointer-events-none">
            <div className="glass-dense p-2 rounded-full inline-flex gap-2 border border-white/10 shadow-2xl pointer-events-auto">
              {program.map((day) => (
                <button
                  key={day.day}
                  onClick={() => {
                    const el = document.getElementById(`day-${day.day}`);
                    if (el) {
                      const yOffset = -140; 
                      const y = el.getBoundingClientRect().top + window.pageYOffset + yOffset;
                      window.scrollTo({top: y, behavior: 'smooth'});
                    }
                  }}
                  className="px-6 py-2 rounded-full text-[10px] font-bold uppercase tracking-widest transition-all hover:bg-white/10 hover:text-white text-white/50 cursor-pointer"
                >
                  Day {day.day}
                </button>
              ))}
            </div>
          </div>
        ) : null}
      </div>

      {program.length > 0 ? (
      <div className="flex flex-col gap-40">
        {program.map((day) => {
          // Group sessions by startTime to handle parallel tracks
          const timeSlots = day.sessions.reduce((acc: any, session: any) => {
            const time = session.startTime;
            if (!acc[time]) acc[time] = [];
            acc[time].push(session);
            return acc;
          }, {});

          return (
            <div key={day.day} id={`day-${day.day}`} className="space-y-12 scroll-mt-48">
              <div className="space-y-4">
                <div className="text-[#fff9b0] font-display font-bold text-base md:text-lg uppercase tracking-[0.4em] opacity-80">
                  Day {day.day}
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-white font-display font-bold text-3xl md:text-5xl">{day.name}</div>
                  <div className="text-white/30 text-lg font-medium pt-2">{day.date}</div>
                  <div className="h-px flex-1 bg-white/10" />
                </div>
              </div>
              
              <div className="space-y-16">
                {Object.entries(timeSlots).map(([time, sessions]: [string, any], k) => (
                  <div key={k} className="grid grid-cols-1 md:grid-cols-[180px_1fr] gap-8 items-start relative">
                    {/* Time Column */}
                    <div className="md:sticky md:top-32 space-y-1">
                      <div className="font-mono text-brand-teal font-extrabold text-xl">
                         {time}
                      </div>
                      <div className="text-white/30 text-xs font-mono uppercase tracking-widest">
                         to {sessions[0].endTime}
                      </div>
                      <div className="hidden md:block w-px h-12 bg-gradient-to-b from-brand-teal/40 to-transparent mt-4 ml-2" />
                    </div>

                    {/* Sessions Grid */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      {sessions.map((session: any, j: number) => (
                        <div key={j} className="p-8 rounded-[2.5rem] glass border border-white/5 bg-white/5 hover:border-brand-teal/30 hover:bg-white/[0.07] transition-all group relative overflow-hidden">
                          <div className={`absolute left-0 top-0 bottom-0 w-1 ${session.type === 'Keynote' ? 'bg-orange-400' : session.type === 'Technical' ? 'bg-brand-teal' : 'bg-brand-purple'} opacity-40`} />
                          
                          <div className="flex flex-col h-full justify-between gap-6">
                            <div className="space-y-4">
                              <div className="flex items-center justify-between">
                                <div className={`text-[10px] uppercase tracking-[0.2em] font-bold px-3 py-1 rounded-full ${
                                  session.type === 'Keynote' ? 'bg-orange-400/10 text-orange-400' : 
                                  session.type === 'Technical' ? 'bg-brand-teal/10 text-brand-teal' : 
                                  'bg-brand-purple/10 text-brand-purple'
                                }`}>
                                  {session.type}
                                </div>
                                <div className="text-[10px] text-white/40 uppercase tracking-widest font-bold flex items-center gap-1.5">
                                  <MapPin size={12} className="text-brand-teal/50" />
                                  {session.location}
                                </div>
                              </div>
                              <h4 className="text-2xl font-bold leading-tight group-hover:text-brand-teal transition-colors">
                                {session.title}
                              </h4>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
      ) : (
        <ComingSoonPanel
          title="Coming soon!"
          message="The conference program will appear here once it has been published."
        />
      )}
    </div>
  );
}

function OrgSection({
  isLoadingRegistry,
  conferenceName,
  conferenceYear,
}: {
  isLoadingRegistry: boolean;
  conferenceName: string;
  conferenceYear: string;
}) {
  const [organization, setOrganization] = useState<Organizer[]>([]);
  const [isLoadingOrganizers, setIsLoadingOrganizers] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const loadOrganizers = async () => {
      try {
        const organizers = await fetchOrganizers();
        if (isMounted && organizers.length > 0) {
          setOrganization(organizers);
        }
      } catch (error) {
        console.error('Failed to load organizers from Notion API.', error);
      } finally {
        if (isMounted) {
          setIsLoadingOrganizers(false);
        }
      }
    };

    void loadOrganizers();

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <div className="space-y-24 pb-32">
      <div className="space-y-8">
        <div className="space-y-4">
          <h2 className="text-4xl md:text-5xl font-display font-bold">Organization</h2>
          <p className="text-white/60 max-w-4xl text-lg md:text-xl font-light leading-relaxed">
            Meet the team behind {conferenceName} {conferenceYear}.
          </p>
          {isLoadingRegistry || isLoadingOrganizers ? (
            <p className="text-sm uppercase tracking-[0.18em] text-white/30 font-bold">
              Syncing with Notion...
            </p>
          ) : null}
        </div>
      </div>

      {organization.length > 0 ? (
        <OrganizerConferenceColumn title={`${conferenceName} Team`} people={organization} accentClass="text-brand-teal" />
      ) : (
        <ComingSoonPanel
          title="Coming soon!"
          message="Organizer details will appear here once they are published."
        />
      )}
    </div>
  );
}

function VenueSection({
  registryContent,
  isLoadingRegistry,
  conferenceName,
  conferenceYear,
}: {
  registryContent: RegistryContent | null;
  isLoadingRegistry: boolean;
  conferenceName: string;
  conferenceYear: string;
}) {
  const registryLocations = parseVenueLocations(
    getDatabaseRecords(getRegistryEntry(registryContent, 'attend page', 'venue')),
  );
  const registryHotels = parseAccommodations(
    getDatabaseRecords(getRegistryEntry(registryContent, 'attend page', 'accomodation')),
  );
  const registryTransportation = parseTransportation(
    getDatabaseRecords(getRegistryEntry(registryContent, 'attend page', 'transportation')),
  );
  const venue = {
    locations: registryLocations,
    hotels: registryHotels,
    transportation: registryTransportation,
    imageUrl: registryLocations.find((item) => item.imageUrl)?.imageUrl || '',
    mainHall: registryLocations.find((item) => item.mainHall)?.mainHall || '',
  };
  const hasVenueData = registryLocations.length > 0 || registryHotels.length > 0 || registryTransportation.length > 0;
  const [showHotels, setShowHotels] = useState(false);
  const [showTransportation, setShowTransportation] = useState(false);

  return (
    <div className="space-y-24 pb-32">
      <div className="space-y-8">
        <div className="space-y-4">
          <h2 className="text-4xl md:text-5xl font-display font-bold text-[#ffe7a6]">Venue</h2>
          <p className="text-white/60 max-w-4xl text-lg md:text-xl font-light leading-relaxed">
            {conferenceName} {conferenceYear} will be held across the locations listed below.
          </p>
          {isLoadingRegistry ? (
            <p className="text-sm uppercase tracking-[0.18em] text-white/30 font-bold">Syncing with Notion...</p>
          ) : null}
        </div>
      </div>

      {!hasVenueData ? (
        <ComingSoonPanel
          title="Coming soon!"
          message="Venue, accommodation, and transportation details will appear here once they are available."
        />
      ) : (
        <>

      <div className="space-y-6">
        {/* Desktop Table View */}
        <div className="hidden md:block glass rounded-[2rem] overflow-hidden border border-white/10 shadow-2xl">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-white/5 border-b border-white/10 uppercase text-[10px] tracking-[0.2em] font-bold text-white/40">
                <th className="p-8">Venue Location</th>
                <th className="p-8">Address</th>
                <th className="p-8">Usage Days</th>
              </tr>
            </thead>
            <tbody>
              {venue.locations?.map((loc: any, i: number) => (
                <tr key={i} className="border-b border-white/5 hover:bg-white/[0.04] transition-all group">
                  <td className="p-8">
                    <div className="flex flex-col gap-1">
                      <span className="text-xl font-bold text-white group-hover:text-brand-teal transition-colors tracking-tight">{loc.name}</span>
                      <span className="text-xs uppercase tracking-widest text-white/30 font-medium">{loc.location}</span>
                    </div>
                  </td>
                  <td className="p-8 font-light text-white/50 leading-relaxed max-w-md">
                    {loc.address}
                  </td>
                  <td className="p-8">
                    <div className="flex flex-wrap gap-2">
                      {loc.days.map((day: any, dj: number) => (
                        <span 
                          key={dj} 
                          className={`text-[10px] font-bold uppercase tracking-[0.1em] px-4 py-1.5 rounded-full border transition-all ${
                            day.toLowerCase() === 'day1' ? 'bg-[#fff9b0]/10 text-[#fff9b0] border-[#fff9b0]/20' : 
                            day.toLowerCase() === 'day2' ? 'bg-brand-purple/10 text-brand-purple border-brand-purple/20' : 
                            'bg-brand-teal/10 text-brand-teal border-brand-teal/20'
                          }`}
                        >
                          {day}
                        </span>
                      ))}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile Card View */}
        <div className="md:hidden space-y-4">
          {venue.locations?.map((loc: any, i: number) => (
            <div key={i} className="p-8 rounded-[2rem] glass border border-white/10 space-y-6">
              <div className="space-y-1">
                <h4 className="text-2xl font-bold text-white tracking-tight">{loc.name}</h4>
                <div className="flex items-center gap-2 text-brand-teal text-[10px] uppercase tracking-widest font-bold">
                   <MapPin size={12} /> {loc.location}
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="text-[10px] uppercase tracking-widest text-white/40 font-bold">Address</div>
                <p className="text-sm text-white/60 leading-relaxed font-light">
                  {loc.address}
                </p>
              </div>

              <div className="space-y-3">
                <div className="text-[10px] uppercase tracking-widest text-white/40 font-bold">Usage Days</div>
                <div className="flex flex-wrap gap-2">
                  {loc.days.map((day: any, dj: number) => (
                    <span 
                      key={dj} 
                      className={`text-[9px] font-bold uppercase tracking-[0.1em] px-4 py-1.5 rounded-full border ${
                        day.toLowerCase() === 'day1' ? 'bg-[#fff9b0]/10 text-[#fff9b0] border-[#fff9b0]/20' : 
                        day.toLowerCase() === 'day2' ? 'bg-brand-purple/10 text-brand-purple border-brand-purple/20' : 
                        'bg-brand-teal/10 text-brand-teal border-brand-teal/20'
                      }`}
                    >
                      {day}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {venue.imageUrl && venue.locations[0] ? (
      <div className="relative group rounded-[3rem] overflow-hidden glass aspect-video md:aspect-[21/9]">
        <div 
          className="absolute inset-0 bg-cover bg-center mix-blend-overlay opacity-40 group-hover:scale-105 transition-transform duration-700" 
          style={{ backgroundImage: `url(${venue.imageUrl})` }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent" />
        <div className="absolute bottom-6 left-6 md:bottom-10 md:left-10 space-y-2">
          <div 
            style={{ backgroundColor: '#e81b39' }}
            className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-white text-[10px] font-bold uppercase tracking-widest shadow-lg"
          >
             {venue.mainHall}
          </div>
          <h3 className="text-3xl md:text-4xl font-display font-bold">{venue.locations[0].name}</h3>
          <p className="text-white/70 italic flex items-center gap-2 text-sm">
            <MapPin size={16} /> {venue.locations[0].address || venue.locations[0].location}
          </p>
        </div>
      </div>
      ) : null}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
        <div className="flex flex-col gap-4">
          <div className="glass rounded-3xl p-8 flex flex-col justify-center gap-2">
            <h4 className="text-[#ffe7a6] font-bold text-lg">Accommodations</h4>
            <p className="text-white/60 text-sm leading-relaxed">We have partnered with several hotels nearby to offer special rates for attendees.</p>
            <button 
              onClick={() => setShowHotels(!showHotels)}
              style={{ color: '#ffe7a6' }}
              className="font-bold flex items-center gap-1 hover:gap-2 transition-all mt-2 text-sm cursor-pointer w-fit"
            >
              {showHotels ? 'Close Details' : 'View Hotels'} <ChevronRight size={16} className={showHotels ? 'rotate-90 transition-transform' : 'transition-transform'} />
            </button>
          </div>
          
          <AnimatePresence>
            {showHotels && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden"
              >
                <div className="glass rounded-3xl p-6 space-y-4 border-brand-purple/20">
                  {venue.hotels?.map((hotel, i) => (
                    <div key={i} className="border-b border-white/5 last:border-0 pb-3 last:pb-0">
                      <div className="flex justify-between items-start">
                        <div className="font-bold">{hotel.name}</div>
                        <div className="text-xs text-brand-teal">{hotel.rate}</div>
                      </div>
                      <div className="text-xs text-white/40 flex justify-between mt-1">
                        <span>{hotel.distance} from venue</span>
                        <span className="font-mono bg-white/5 px-2 py-0.5 rounded italic">Code: {hotel.discountCode}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="flex flex-col gap-4">
          <div className="glass rounded-3xl p-8 flex flex-col justify-center gap-2">
            <h4 style={{ color: '#ffe7a6' }} className="font-bold text-lg">Transportation</h4>
            <p className="text-white/60 text-sm leading-relaxed">Conveniently located near major transit hubs and international airports.</p>
            <button 
              onClick={() => setShowTransportation(!showTransportation)}
              className="text-[#ffe7a6] font-bold flex items-center gap-1 hover:gap-2 transition-all mt-2 text-sm cursor-pointer w-fit"
            >
              {showTransportation ? 'Close Details' : 'Getting here'} <ChevronRight size={16} className={showTransportation ? 'rotate-90 transition-transform' : 'transition-transform'} />
            </button>
          </div>

          <AnimatePresence>
            {showTransportation && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden"
              >
                <div className="glass rounded-3xl p-6 space-y-4 border-brand-teal/20">
                  {venue.transportation?.map((item, i) => (
                    <div key={i} className="space-y-1">
                      <div className="text-[10px] font-bold uppercase tracking-widest text-brand-teal">{item.mode}</div>
                      <div className="text-sm text-white/70 leading-relaxed font-serif italic">{item.detail}</div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
        </>
      )}
    </div>
  );
}

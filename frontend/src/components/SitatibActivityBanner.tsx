import React, { useState } from 'react';
import { CalendarDays, Clock, User, ExternalLink, ChevronDown, ChevronUp } from 'lucide-react';
import { SitatibClassActivity } from '../types';
import { FormattedText } from './FormattedText';

const STORAGE_KEY = 'sitatib_activity_collapsed';

interface SitatibActivityBannerProps {
  activities: SitatibClassActivity[];
  todayISO?: string;
  onOpenSitatibActivities?: () => void;
}

export const SitatibActivityBanner: React.FC<SitatibActivityBannerProps> = ({
  activities,
  todayISO,
  onOpenSitatibActivities
}) => {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [isCollapsed, setIsCollapsed] = useState<boolean>(() => {
    try {
      return localStorage.getItem(STORAGE_KEY) === 'true';
    } catch {
      return false;
    }
  });

  if (!activities || activities.length === 0) return null;

  const toggleCollapsed = () => {
    setIsCollapsed(prev => {
      const next = !prev;
      try {
        localStorage.setItem(STORAGE_KEY, String(next));
      } catch {
        // Ignore storage write errors
      }
      return next;
    });
  };

  return (
    <section
      aria-label="Jadwal Kegiatan Kelas SITATIB"
      className="w-full rounded-xl border border-violet-200/80 dark:border-violet-900/60 bg-white dark:bg-[#18191C] flex-shrink-0 overflow-hidden animate-fade-in"
    >
      {/* Collapsible header strip explicitly labeled SITATIB (separate from iCal) */}
      <div
        role="button"
        tabIndex={0}
        aria-expanded={!isCollapsed}
        aria-controls="sitatib-activity-content"
        onClick={toggleCollapsed}
        onKeyDown={e => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            toggleCollapsed();
          }
        }}
        className={`px-3.5 py-2 ${
          isCollapsed ? '' : 'border-b border-violet-200/70 dark:border-violet-900/50'
        } bg-violet-50/70 dark:bg-[#191524] hover:bg-violet-100/60 dark:hover:bg-[#211B30] transition-colors flex items-center justify-between gap-2 cursor-pointer select-none`}
      >
        <div className="flex items-center gap-2 min-w-0">
          <CalendarDays className="w-4 h-4 text-violet-700 dark:text-violet-400 flex-shrink-0" />
          <span className="text-xs font-bold uppercase tracking-wider text-violet-950 dark:text-violet-200 truncate">
            Kegiatan Kelas · SITATIB
          </span>
          {isCollapsed && (
            <span className="text-[11px] font-semibold text-violet-700 dark:text-violet-300 tabular-nums whitespace-nowrap">
              ({activities.length})
            </span>
          )}
          <span className="hidden sm:inline text-[11px] font-medium text-violet-700/80 dark:text-violet-300/80 whitespace-nowrap">
            · Terpisah dari iCal
          </span>
        </div>

        <div className="flex items-center gap-1.5 flex-shrink-0">
          {onOpenSitatibActivities && (
            <button
              type="button"
              onClick={e => {
                e.stopPropagation();
                onOpenSitatibActivities();
              }}
              className="text-xs font-semibold text-violet-800 dark:text-violet-300 hover:underline whitespace-nowrap shrink-0 cursor-pointer px-1.5 py-0.5 rounded"
            >
              Semua Kegiatan
            </button>
          )}
          <span
            aria-hidden="true"
            className="inline-flex items-center justify-center w-6 h-6 rounded-md text-violet-700 dark:text-violet-300 hover:bg-violet-200/50 dark:hover:bg-violet-900/40 transition-colors"
            title={isCollapsed ? 'Tampilkan Kegiatan SITATIB' : 'Sembunyikan Kegiatan SITATIB'}
          >
            <ChevronDown
              className={`w-4 h-4 transition-transform duration-200 ${isCollapsed ? '-rotate-90' : 'rotate-0'}`}
            />
          </span>
        </div>
      </div>

      {/* Collapsible hairline-divided activity entries */}
      <div
        id="sitatib-activity-content"
        className={`grid transition-[grid-template-rows,opacity] duration-200 ease-out ${
          isCollapsed ? 'grid-rows-[0fr] opacity-0' : 'grid-rows-[1fr] opacity-100'
        }`}
      >
        <div className="overflow-hidden">
          <div className="divide-y divide-stone-200/70 dark:divide-stone-800/70">
            {activities.map(act => {
              const isExpanded = expandedId === act.id;
              const isPast = Boolean(act.isPast || (todayISO && act.endDate < todayISO));
              const hasDesc = Boolean(act.description && act.description.trim().length > 0);
              const isLongDesc = Boolean(act.description && act.description.length > 140);

              return (
                <article key={act.id} className="p-3 sm:p-3.5 space-y-1.5">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1 space-y-1">
                      <div className="flex items-center gap-1.5 flex-wrap text-[11px] font-medium text-stone-500 dark:text-stone-400">
                        <span className="font-semibold text-violet-700 dark:text-violet-400">
                          Sumber: SITATIB
                        </span>
                        {act.className && (
                          <span>· {act.className}</span>
                        )}
                        <span className="font-mono tabular-nums">· {act.dateLabel}</span>
                        {isPast && (
                          <span className="text-stone-500 dark:text-stone-400 font-semibold">
                            · Sudah Berlalu
                          </span>
                        )}
                      </div>

                      <h3 className="font-editorial font-bold text-sm sm:text-base text-stone-900 dark:text-stone-100 leading-snug">
                        {act.title}
                      </h3>

                      {(act.timeLabel || act.organizer) && (
                        <div className="flex items-center gap-3 flex-wrap text-xs text-stone-600 dark:text-stone-400 pt-0.5">
                          {act.timeLabel && (
                            <span className="inline-flex items-center gap-1 font-mono tabular-nums text-violet-800 dark:text-violet-300 font-semibold">
                              <Clock className="w-3.5 h-3.5 opacity-80" />
                              <span>{act.timeLabel}</span>
                            </span>
                          )}
                          {act.organizer && (
                            <span className="inline-flex items-center gap-1">
                              <User className="w-3.5 h-3.5 opacity-75" />
                              <span>{act.organizer}</span>
                            </span>
                          )}
                        </div>
                      )}
                    </div>

                    {act.sourceUrl && (
                      <a
                        href={act.sourceUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        tabIndex={isCollapsed ? -1 : 0}
                        title="Buka entri di Portal SITATIB"
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-stone-200/80 dark:border-stone-800/80 bg-white dark:bg-[#1E1F23] hover:bg-stone-50 dark:hover:bg-[#25272C] text-[11px] font-semibold text-stone-700 dark:text-stone-300 whitespace-nowrap shrink-0 transition"
                      >
                        <span>SITATIB</span>
                        <ExternalLink className="w-3 h-3 opacity-70" />
                      </a>
                    )}
                  </div>

                  {hasDesc && (
                    <div className="mt-1.5 text-xs sm:text-sm text-stone-700 dark:text-stone-300 leading-relaxed bg-stone-50/80 dark:bg-[#141519] px-3 py-2 rounded-lg border border-stone-200/60 dark:border-stone-800/70">
                      <div className={!isExpanded && isLongDesc ? 'line-clamp-3' : ''}>
                        <FormattedText content={act.description!} />
                      </div>
                      {isLongDesc && (
                        <button
                          type="button"
                          tabIndex={isCollapsed ? -1 : 0}
                          onClick={() => setExpandedId(isExpanded ? null : act.id)}
                          className="mt-1 inline-flex items-center gap-0.5 text-[11px] font-semibold text-violet-700 dark:text-violet-400 hover:underline cursor-pointer"
                        >
                          {isExpanded ? (
                            <>
                              <span>Ringkas</span>
                              <ChevronUp className="w-3 h-3" />
                            </>
                          ) : (
                            <>
                              <span>Selengkapnya</span>
                              <ChevronDown className="w-3 h-3" />
                            </>
                          )}
                        </button>
                      )}
                    </div>
                  )}
                </article>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
};

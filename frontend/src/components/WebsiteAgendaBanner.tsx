import React, { useState } from 'react';
import { Globe, Clock, ExternalLink, ChevronDown, ChevronUp } from 'lucide-react';
import { WebsiteAgendaItem } from '../types';
import { FormattedText } from './FormattedText';

interface WebsiteAgendaBannerProps {
  items: WebsiteAgendaItem[];
  todayISO?: string;
}

export const WebsiteAgendaBanner: React.FC<WebsiteAgendaBannerProps> = ({ items, todayISO }) => {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  if (!items || items.length === 0) return null;

  return (
    <section
      aria-label="Agenda Kegiatan Website SMA Putra Nirmala"
      className="w-full rounded-xl border border-indigo-200/80 dark:border-indigo-900/60 bg-white dark:bg-[#18191C] flex-shrink-0 overflow-hidden animate-fade-in"
    >
      {/* Header strip explicitly labeled Website */}
      <div className="px-3.5 py-2 border-b border-indigo-200/70 dark:border-indigo-900/50 bg-indigo-50/75 dark:bg-[#151829] flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <Globe className="w-4 h-4 text-indigo-700 dark:text-indigo-400 flex-shrink-0" />
          <span className="text-xs font-bold uppercase tracking-wider text-indigo-950 dark:text-indigo-200 truncate">
            Agenda · Website
          </span>
          <span className="hidden sm:inline text-[11px] font-medium text-indigo-700/80 dark:text-indigo-300/80 whitespace-nowrap">
            · SMA Putra Nirmala
          </span>
        </div>

        <a
          href="https://sma.putranirmala.sch.id/index.php/agenda"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-800 dark:text-indigo-300 hover:underline whitespace-nowrap shrink-0"
        >
          <span>Buka Website</span>
          <ExternalLink className="w-3 h-3 opacity-80" />
        </a>
      </div>

      {/* Hairline-divided Website agenda entries */}
      <div className="divide-y divide-stone-200/70 dark:divide-stone-800/70">
        {items.map(item => {
          const isExpanded = expandedId === item.id;
          const endIso = item.endDate || item.isoDate;
          const isPast = Boolean(todayISO && endIso && endIso < todayISO);
          const hasDesc = Boolean(item.description && item.description.trim().length > 0);
          const isLongDesc = Boolean(item.description && item.description.length > 140);

          return (
            <article key={item.id} className="p-3 sm:p-3.5 space-y-1.5">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1 space-y-1">
                  <div className="flex items-center gap-1.5 flex-wrap text-[11px] font-medium text-stone-500 dark:text-stone-400">
                    <span className="font-semibold text-indigo-700 dark:text-indigo-400">
                      Sumber: Website
                    </span>
                    {item.category && (
                      <span className="px-1.5 py-0.5 rounded bg-indigo-50 dark:bg-indigo-950/60 text-indigo-800 dark:text-indigo-300 border border-indigo-200/70 dark:border-indigo-800/60 text-[10px] font-semibold">
                        {item.category}
                      </span>
                    )}
                    <span className="font-mono tabular-nums">· {item.range || `${item.day} ${item.month}`}</span>
                    {isPast && (
                      <span className="text-stone-500 dark:text-stone-400 font-semibold">
                        · Sudah Berlalu
                      </span>
                    )}
                  </div>

                  <h3 className="font-editorial font-bold text-sm sm:text-base text-stone-900 dark:text-stone-100 leading-snug">
                    {item.title}
                  </h3>

                  {item.timeLabel && (
                    <div className="flex items-center gap-2 text-xs text-stone-600 dark:text-stone-400 pt-0.5">
                      <span className="inline-flex items-center gap-1 font-mono tabular-nums text-indigo-800 dark:text-indigo-300 font-semibold">
                        <Clock className="w-3.5 h-3.5 opacity-80" />
                        <span>{item.timeLabel}</span>
                      </span>
                    </div>
                  )}
                </div>

                {item.sourceUrl && (
                  <a
                    href={item.sourceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    title="Lihat agenda ini di Website SMA Putra Nirmala"
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-stone-200/80 dark:border-stone-800/80 bg-white dark:bg-[#1E1F23] hover:bg-stone-50 dark:hover:bg-[#25272C] text-[11px] font-semibold text-stone-700 dark:text-stone-300 whitespace-nowrap shrink-0 transition"
                  >
                    <span>Website</span>
                    <ExternalLink className="w-3 h-3 opacity-70" />
                  </a>
                )}
              </div>

              {hasDesc && (
                <div className="mt-1.5 text-xs sm:text-sm text-stone-700 dark:text-stone-300 leading-relaxed bg-stone-50/80 dark:bg-[#141519] px-3 py-2 rounded-lg border border-stone-200/60 dark:border-stone-800/70">
                  <div className={!isExpanded && isLongDesc ? 'line-clamp-3' : ''}>
                    <FormattedText content={item.description} />
                  </div>
                  {isLongDesc && (
                    <button
                      type="button"
                      onClick={() => setExpandedId(isExpanded ? null : item.id)}
                      className="mt-1 inline-flex items-center gap-0.5 text-[11px] font-semibold text-indigo-700 dark:text-indigo-400 hover:underline cursor-pointer"
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
    </section>
  );
};

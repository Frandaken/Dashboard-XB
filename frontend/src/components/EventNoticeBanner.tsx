import React, { useState } from 'react';
import { CalendarEventNotice, TaskAttachment } from '../types';
import {
  Megaphone,
  Tent,
  Laptop,
  Building2,
  Sun,
  MapPin,
  Calendar,
  ChevronDown,
  ChevronUp,
  FileText,
  ExternalLink
} from 'lucide-react';
import { MONTH_ID } from '../data/demoData';

interface EventNoticeBannerProps {
  notices: CalendarEventNotice[];
  onOpenAttachment?: (attachment: TaskAttachment, subjectTitle?: string) => void;
  compact?: boolean;
}

function formatNoticeDateSpan(startDateStr: string, endDateStr: string): string {
  if (!startDateStr) return '';
  if (startDateStr === endDateStr) {
    const [y, m, d] = startDateStr.split('-').map(Number);
    return `${d} ${MONTH_ID[m - 1]} ${y}`;
  }
  const [sy, sm, sd] = startDateStr.split('-').map(Number);
  const [ey, em, ed] = endDateStr.split('-').map(Number);

  if (sy === ey && sm === em) {
    return `${sd} – ${ed} ${MONTH_ID[sm - 1]} ${sy}`;
  }
  if (sy === ey) {
    return `${sd} ${MONTH_ID[sm - 1]} – ${ed} ${MONTH_ID[em - 1]} ${sy}`;
  }
  return `${sd} ${MONTH_ID[sm - 1]} ${sy} – ${ed} ${MONTH_ID[em - 1]} ${ey}`;
}

function getEventIcon(title: string) {
  const lower = title.toLowerCase();
  if (lower.includes('camp') || lower.includes('kemah') || lower.includes('ppta') || lower.includes('pramuka')) {
    return Tent;
  }
  if (lower.includes('pjj') || lower.includes('daring') || lower.includes('online') || lower.includes('zoom')) {
    return Laptop;
  }
  if (lower.includes('masuk sekolah') || lower.includes('tatap muka') || lower.includes('sekolah') || lower.includes('ptm')) {
    return Building2;
  }
  if (lower.includes('libur') || lower.includes('cuti') || lower.includes('weekend')) {
    return Sun;
  }
  return Megaphone;
}

function getEventTheme(title: string) {
  const lower = title.toLowerCase();
  if (lower.includes('camp') || lower.includes('kemah') || lower.includes('ppta') || lower.includes('pramuka')) {
    return {
      bg: 'bg-emerald-950/15 dark:bg-emerald-950/40',
      border: 'border-emerald-600/40 dark:border-emerald-500/40',
      badgeBg: 'bg-emerald-100/90 dark:bg-emerald-900/60',
      badgeText: 'text-emerald-900 dark:text-emerald-200',
      iconBox: 'bg-emerald-600 text-white dark:bg-emerald-500 dark:text-stone-950',
      accentText: 'text-emerald-800 dark:text-emerald-300'
    };
  }
  if (lower.includes('pjj') || lower.includes('daring') || lower.includes('online')) {
    return {
      bg: 'bg-indigo-950/10 dark:bg-indigo-950/40',
      border: 'border-indigo-500/35 dark:border-indigo-500/40',
      badgeBg: 'bg-indigo-100/90 dark:bg-indigo-900/60',
      badgeText: 'text-indigo-900 dark:text-indigo-200',
      iconBox: 'bg-indigo-600 text-white dark:bg-indigo-500 dark:text-stone-950',
      accentText: 'text-indigo-800 dark:text-indigo-300'
    };
  }
  if (lower.includes('libur') || lower.includes('cuti')) {
    return {
      bg: 'bg-amber-950/10 dark:bg-amber-950/35',
      border: 'border-amber-500/35 dark:border-amber-500/40',
      badgeBg: 'bg-amber-100/90 dark:bg-amber-900/60',
      badgeText: 'text-amber-900 dark:text-amber-200',
      iconBox: 'bg-amber-600 text-white dark:bg-amber-500 dark:text-stone-950',
      accentText: 'text-amber-800 dark:text-amber-300'
    };
  }
  // Default blue/slate
  return {
    bg: 'bg-sky-950/10 dark:bg-sky-950/35',
    border: 'border-sky-500/35 dark:border-sky-500/40',
    badgeBg: 'bg-sky-100/90 dark:bg-sky-900/60',
    badgeText: 'text-sky-900 dark:text-sky-200',
    iconBox: 'bg-sky-600 text-white dark:bg-sky-500 dark:text-stone-950',
    accentText: 'text-sky-800 dark:text-sky-300'
  };
}

export const EventNoticeBanner: React.FC<EventNoticeBannerProps> = ({
  notices,
  onOpenAttachment,
  compact = false
}) => {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  if (!notices || notices.length === 0) return null;

  return (
    <div className="flex flex-col gap-2 w-full flex-shrink-0 animate-fade-in" id="event-notice-banner-container">
      {notices.map(notice => {
        const IconComponent = getEventIcon(notice.title);
        const theme = getEventTheme(notice.title);
        const isExpanded = expandedId === notice.id;
        const dateSpanStr = formatNoticeDateSpan(notice.startDate, notice.endDate);

        return (
          <div
            key={notice.id}
            className={`rounded-xl border p-3 sm:p-3.5 transition-all shadow-xs ${theme.bg} ${theme.border}`}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-2.5 sm:gap-3 min-w-0 flex-1">
                <div
                  className={`w-8 h-8 sm:w-9 sm:h-9 rounded-lg flex items-center justify-center flex-shrink-0 shadow-xs ${theme.iconBox}`}
                >
                  <IconComponent className="w-4 h-4 sm:w-5 sm:h-5" />
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-stone-500 dark:text-stone-400">
                      Pengumuman / Kegiatan
                    </span>

                    {notice.isMultiDay ? (
                      <span
                        className={`text-[11px] font-bold px-2 py-0.5 rounded-full border border-black/10 dark:border-white/10 ${theme.badgeBg} ${theme.badgeText}`}
                      >
                        Hari ke-{notice.dayIndex} dari {notice.totalDays}
                      </span>
                    ) : (
                      <span
                        className={`text-[11px] font-bold px-2 py-0.5 rounded-full border border-black/10 dark:border-white/10 ${theme.badgeBg} ${theme.badgeText}`}
                      >
                        Sepanjang Hari
                      </span>
                    )}
                  </div>

                  <h3 className="font-editorial font-bold text-base sm:text-lg text-stone-900 dark:text-stone-100 tracking-tight leading-snug mt-0.5">
                    {notice.title}
                  </h3>

                  <div className="flex items-center gap-3 flex-wrap mt-1 text-xs text-stone-600 dark:text-stone-400">
                    {dateSpanStr && (
                      <div className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 opacity-75" />
                        <span>{dateSpanStr}</span>
                      </div>
                    )}

                    {notice.location && (
                      <div className="flex items-center gap-1 font-medium">
                        <MapPin className="w-3.5 h-3.5 opacity-75" />
                        <span className="truncate max-w-[200px] sm:max-w-[320px]">{notice.location}</span>
                      </div>
                    )}
                  </div>

                  {/* Description / Notes */}
                  {notice.description && (
                    <div className="mt-2 text-xs sm:text-sm text-stone-700 dark:text-stone-300 leading-relaxed bg-white/60 dark:bg-stone-900/40 p-2 sm:p-2.5 rounded-lg border border-black/5 dark:border-white/5">
                      <p className={`whitespace-pre-line ${!isExpanded && !compact ? 'line-clamp-2' : ''}`}>
                        {notice.description}
                      </p>
                      {notice.description.length > 120 && !compact && (
                        <button
                          type="button"
                          onClick={() => setExpandedId(isExpanded ? null : notice.id)}
                          className="mt-1 text-[11px] font-semibold text-emerald-700 dark:text-emerald-400 hover:underline flex items-center gap-0.5"
                        >
                          {isExpanded ? (
                            <>
                              <span>Sembunyikan</span>
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

                  {/* Attachment if present */}
                  {notice.attachment && (
                    <div className="mt-2">
                      <button
                        type="button"
                        onClick={() => {
                          if (onOpenAttachment) {
                            onOpenAttachment(notice.attachment!, notice.title);
                          } else {
                            window.open(notice.attachment!.url, '_blank');
                          }
                        }}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-white dark:bg-stone-800 border border-stone-300 dark:border-stone-700 hover:bg-stone-50 dark:hover:bg-stone-700 text-stone-800 dark:text-stone-200 transition"
                      >
                        <FileText className="w-3.5 h-3.5" />
                        <span>{notice.attachment.filename || 'Buka Lampiran'}</span>
                        <ExternalLink className="w-3 h-3 opacity-60" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

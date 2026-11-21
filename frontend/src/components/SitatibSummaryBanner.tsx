import React, { useMemo } from 'react';
import { Bell, CalendarDays, ChevronRight, Paperclip, Scale } from 'lucide-react';
import { SitatibAttachment, SitatibOverviewData } from '../types';
import { sortSitatibAnnouncementsByNearestDate } from '../utils/sitatibUtils';

interface SitatibSummaryBannerProps {
  data?: SitatibOverviewData | null;
  onOpenModal: (initialTab?: 'announcements' | 'rules' | 'activities') => void;
  onOpenAttachment?: (attachment: SitatibAttachment, announcementTitle?: string) => void;
}

export const SitatibSummaryBanner: React.FC<SitatibSummaryBannerProps> = ({
  data,
  onOpenModal,
  onOpenAttachment
}) => {
  const sortedAnnouncements = useMemo(
    () => sortSitatibAnnouncementsByNearestDate(data?.announcements),
    [data?.announcements]
  );

  // Only show the dashboard banner strip when there are real announcements from SITATIB.
  // Users can still access rules, sync status, and portal config anytime via Hamburger Menu.
  if (!data || sortedAnnouncements.length === 0) {
    return null;
  }

  const topAnnouncements = sortedAnnouncements.slice(0, 2);
  const rulesCount = data.rules?.length ?? 0;
  const activitiesCount = data.activities?.length ?? 0;

  return (
    <section
      aria-label="Pengumuman SITATIB Terbaru"
      className="w-full rounded-xl border border-stone-200/80 dark:border-stone-800/80 bg-white dark:bg-[#18191C] flex-shrink-0 overflow-hidden animate-fade-in"
    >
      {/* Header strip */}
      <div className="px-3.5 py-2.5 border-b border-stone-200/70 dark:border-stone-800/70 flex items-center justify-between gap-3 bg-stone-50/70 dark:bg-[#151619]">
        <div className="flex items-center gap-2 min-w-0">
          <Bell className="w-4 h-4 text-[#1E3A2F] dark:text-emerald-400 flex-shrink-0" />
          <span className="text-xs font-bold uppercase tracking-wider text-stone-800 dark:text-stone-200 truncate">
            Pengumuman SITATIB
          </span>
          {data.academicYearLabel && (
            <span className="hidden sm:inline text-[11px] font-medium text-stone-500 dark:text-stone-400 whitespace-nowrap">
              · {data.academicYearLabel}
            </span>
          )}
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          {activitiesCount > 0 && (
            <button
              type="button"
              onClick={() => onOpenModal('activities')}
              className="hidden sm:inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium text-violet-800 dark:text-violet-300 hover:bg-violet-50 dark:hover:bg-violet-950/40 transition whitespace-nowrap shrink-0 cursor-pointer"
            >
              <CalendarDays className="w-3.5 h-3.5 text-violet-600 dark:text-violet-400" />
              <span>Kegiatan ({activitiesCount})</span>
            </button>
          )}
          {rulesCount > 0 && (
            <button
              type="button"
              onClick={() => onOpenModal('rules')}
              className="hidden sm:inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium text-stone-600 dark:text-stone-300 hover:bg-stone-200/60 dark:hover:bg-[#222429] transition whitespace-nowrap shrink-0 cursor-pointer"
            >
              <Scale className="w-3.5 h-3.5 text-stone-500 dark:text-stone-400" />
              <span>Tata Tertib ({rulesCount})</span>
            </button>
          )}
          <button
            type="button"
            onClick={() => onOpenModal('announcements')}
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold text-[#1E3A2F] dark:text-emerald-300 hover:bg-emerald-50 dark:hover:bg-[#122A1E] transition whitespace-nowrap shrink-0 cursor-pointer"
          >
            <span>Lihat Semua ({data.announcements.length})</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Hairline-divided announcement rows */}
      <div className="divide-y divide-stone-200/70 dark:divide-stone-800/70">
        {topAnnouncements.map(item => {
          const attachments = item.attachments || [];
          const primaryAtt = attachments.find(a => a.kind === 'pdf') || attachments[0];
          return (
            <div
              key={item.id}
              role="button"
              tabIndex={0}
              onClick={() => onOpenModal('announcements')}
              onKeyDown={e => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  onOpenModal('announcements');
                }
              }}
              className="w-full text-left px-3.5 py-2.5 hover:bg-stone-50 dark:hover:bg-[#1E2025] transition flex items-start justify-between gap-3 cursor-pointer"
            >
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5 text-[11px] text-stone-500 dark:text-stone-400 font-medium flex-wrap">
                  {item.isPinned && (
                    <span className="font-semibold text-amber-700 dark:text-amber-300">
                      Disematkan ·
                    </span>
                  )}
                  <span>{item.category || 'Informasi Sekolah'}</span>
                  {item.publishedAt && (
                    <span className="font-mono tabular-nums">· {item.publishedAt}</span>
                  )}
                  {primaryAtt && onOpenAttachment && (
                    <button
                      type="button"
                      onClick={e => {
                        e.stopPropagation();
                        onOpenAttachment(primaryAtt, item.title);
                      }}
                      className="inline-flex items-center gap-1 text-[#1E3A2F] dark:text-emerald-400 font-semibold hover:underline cursor-pointer"
                    >
                      <Paperclip className="w-3 h-3" />
                      <span>
                        {attachments.length > 1
                          ? `${attachments.length} Lampiran/Tautan`
                          : primaryAtt.kind === 'pdf'
                          ? 'Lihat PDF'
                          : 'Lihat Lampiran'}
                      </span>
                    </button>
                  )}
                </div>
                <p className="text-sm font-semibold text-stone-900 dark:text-stone-100 leading-snug mt-0.5 line-clamp-1">
                  {item.title}
                </p>
                {item.content && (
                  <p className="text-xs text-stone-600 dark:text-stone-400 line-clamp-1 mt-0.5">
                    {item.content}
                  </p>
                )}
              </div>
              <ChevronRight className="w-4 h-4 text-stone-400 self-center flex-shrink-0" />
            </div>
          );
        })}
      </div>
    </section>
  );
};

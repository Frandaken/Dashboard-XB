import React from 'react';
import { Globe, Calendar, ExternalLink } from 'lucide-react';
import { WebsiteAgendaItem } from '../types';

interface WebsiteAgendaBannerProps {
  items: WebsiteAgendaItem[];
  todayISO: string;
}

export const WebsiteAgendaBanner: React.FC<WebsiteAgendaBannerProps> = ({ items }) => {
  if (!items || items.length === 0) return null;

  return (
    <div className="flex flex-col gap-2.5 flex-shrink-0">
      {items.map(item => (
        <div
          key={item.id}
          className="bg-indigo-50/90 dark:bg-[#151724] border border-indigo-500/30 dark:border-indigo-500/30 rounded-xl p-3.5 sm:p-4 flex flex-col justify-start transition-all duration-200 hover:border-indigo-500/50 shadow-2xs"
        >
          <div className="flex items-center justify-between gap-2 mb-2 pb-1.5 border-b border-indigo-500/15 dark:border-indigo-500/20 flex-wrap">
            <div className="flex items-center gap-2">
              <Globe className="w-4 h-4 sm:w-5 sm:h-5 text-indigo-700 dark:text-indigo-400 flex-shrink-0" />
              <h3 className="text-indigo-950 dark:text-indigo-200 font-bold text-xs sm:text-sm tracking-tight flex items-center gap-1.5">
                <span>Agenda Website Putra Nirmala</span>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-indigo-100/80 dark:bg-indigo-950/70 text-indigo-900 dark:text-indigo-300 border border-indigo-300/50 dark:border-indigo-800">
                  {item.category || 'Sekolah'}
                </span>
              </h3>
            </div>
            {item.sourceUrl && (
              <a
                href={item.sourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-[11px] font-semibold text-indigo-700 dark:text-indigo-300 hover:underline"
                title="Buka Website Agenda Resmi"
              >
                <span>Sumber Web</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            )}
          </div>

          <div className="flex flex-col gap-1.5">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-indigo-900 dark:text-indigo-300">
              <Calendar className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400 flex-shrink-0" />
              <span>{item.range || `${item.day} ${item.month}`}</span>
            </div>

            <h4 className="font-editorial text-sm sm:text-base font-bold text-indigo-950 dark:text-indigo-100 tracking-tight leading-snug">
              {item.title}
            </h4>

            {item.description && (
              <p className="text-xs sm:text-sm text-indigo-900/80 dark:text-indigo-300/80 leading-relaxed font-normal whitespace-pre-line mt-0.5">
                {item.description}
              </p>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

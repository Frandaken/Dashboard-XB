import React, { useEffect, useMemo, useState } from 'react';
import {
  X,
  Bell,
  Scale,
  Search,
  RefreshCw,
  ExternalLink,
  Sun,
  Moon,
  AlertTriangle,
  KeyRound,
  ChevronDown,
  ChevronUp,
  ShieldCheck,
  Inbox,
  CalendarDays,
  Clock,
  User,
  ArrowRight,
  FileText,
  FileImage,
  Link2,
  Paperclip
} from 'lucide-react';
import { SitatibAttachment, SitatibOverviewData } from '../types';
import { FormattedText } from './FormattedText';

interface SitatibModalProps {
  isOpen: boolean;
  onClose: () => void;
  data?: SitatibOverviewData | null;
  isLoading: boolean;
  onRefresh: () => void;
  initialTab?: 'announcements' | 'rules' | 'activities';
  onSelectDate?: (iso: string) => void;
  onOpenAttachment?: (attachment: SitatibAttachment, announcementTitle?: string) => void;
  disableEscapeClose?: boolean;
  darkMode?: boolean;
  onToggleDarkMode?: () => void;
}

function formatSyncTimestamp(iso?: string): string {
  if (!iso) return '-';
  const dt = new Date(iso);
  if (Number.isNaN(dt.getTime())) return iso;
  return dt.toLocaleString('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

export const SitatibModal: React.FC<SitatibModalProps> = ({
  isOpen,
  onClose,
  data,
  isLoading,
  onRefresh,
  initialTab = 'announcements',
  onSelectDate,
  onOpenAttachment,
  disableEscapeClose = false,
  darkMode,
  onToggleDarkMode
}) => {
  const [activeTab, setActiveTab] = useState<'announcements' | 'rules' | 'activities'>(initialTab);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRuleCategory, setSelectedRuleCategory] = useState<string>('Semua');
  const [expandedAnnouncementId, setExpandedAnnouncementId] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setActiveTab(initialTab);
      setSearchQuery('');
      setSelectedRuleCategory('Semua');
      setExpandedAnnouncementId(null);
    }
  }, [isOpen, initialTab]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !disableEscapeClose) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose, disableEscapeClose]);

  const announcements = data?.announcements ?? [];
  const rules = data?.rules ?? [];
  const activities = data?.activities ?? [];

  const ruleCategories = useMemo(() => {
    const set = new Set<string>();
    rules.forEach(r => {
      if (r.category) set.add(r.category);
    });
    return ['Semua', ...Array.from(set).sort((a, b) => a.localeCompare(b, 'id-ID'))];
  }, [rules]);

  const filteredAnnouncements = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return announcements;
    return announcements.filter(a =>
      a.title.toLowerCase().includes(q) ||
      a.content.toLowerCase().includes(q) ||
      (a.fullContent || '').toLowerCase().includes(q) ||
      (a.category || '').toLowerCase().includes(q) ||
      (a.attachments || []).some(att => att.label.toLowerCase().includes(q))
    );
  }, [announcements, searchQuery]);

  const filteredActivities = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return activities;
    return activities.filter(act =>
      act.title.toLowerCase().includes(q) ||
      act.dateLabel.toLowerCase().includes(q) ||
      (act.organizer || '').toLowerCase().includes(q) ||
      (act.description || '').toLowerCase().includes(q)
    );
  }, [activities, searchQuery]);

  const filteredRules = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return rules.filter(r => {
      if (selectedRuleCategory !== 'Semua' && r.category !== selectedRuleCategory) {
        return false;
      }
      if (!q) return true;
      return (
        r.title.toLowerCase().includes(q) ||
        r.description.toLowerCase().includes(q) ||
        r.codeOrNumber.toLowerCase().includes(q) ||
        r.category.toLowerCase().includes(q)
      );
    });
  }, [rules, selectedRuleCategory, searchQuery]);

  if (!isOpen) return null;

  const isConfigured = Boolean(data?.configured);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="sitatib-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 modal-backdrop-tint transition-colors duration-200 animate-in fade-in duration-150"
      onClick={e => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-[#F8F9FA] dark:bg-[#111215] text-[#191B1F] dark:text-[#F1F3F5] rounded-2xl border border-stone-200/80 dark:border-stone-800/80 shadow-xl w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden">
        {/* Top Modal Header */}
        <div className="px-5 py-4 border-b border-stone-200/80 dark:border-stone-800/80 bg-white dark:bg-[#18191C] flex items-center justify-between gap-3 flex-shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-[#122A1E] border border-emerald-600/20 dark:border-emerald-500/30 flex items-center justify-center text-[#1E3A2F] dark:text-emerald-300 flex-shrink-0">
              <Scale className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h2
                id="sitatib-modal-title"
                className="font-editorial font-bold text-base sm:text-lg text-stone-900 dark:text-stone-100 leading-tight truncate"
              >
                SITATIB SMA Putra Nirmala
              </h2>
              <p className="text-xs text-stone-500 dark:text-stone-400 truncate mt-0.5">
                Pengumuman &amp; Tata Tertib Sekolah
                {data?.academicYearLabel ? ` · ${data.academicYearLabel}` : ''}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 flex-shrink-0">
            <button
              type="button"
              onClick={onRefresh}
              disabled={isLoading}
              aria-label="Muat ulang data SITATIB"
              title="Muat ulang data dari server SITATIB"
              className="w-9 h-9 rounded-lg border border-stone-200/80 dark:border-stone-800/80 bg-white dark:bg-[#18191C] hover:bg-stone-100 dark:hover:bg-[#222429] flex items-center justify-center text-stone-700 dark:text-stone-300 transition cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            </button>

            {onToggleDarkMode && (
              <button
                type="button"
                onClick={onToggleDarkMode}
                aria-label={darkMode ? 'Beralih ke Mode Terang' : 'Beralih ke Mode Gelap'}
                title={darkMode ? 'Ganti ke Mode Terang' : 'Ganti ke Mode Gelap'}
                className="w-9 h-9 rounded-lg border border-stone-200/80 dark:border-stone-800/80 bg-white dark:bg-[#18191C] hover:bg-stone-100 dark:hover:bg-[#222429] flex items-center justify-center text-stone-700 dark:text-stone-300 transition cursor-pointer"
              >
                {darkMode ? (
                  <Sun className="w-4 h-4 text-amber-300" />
                ) : (
                  <Moon className="w-4 h-4 text-stone-700" />
                )}
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              aria-label="Tutup Jendela SITATIB"
              className="w-9 h-9 rounded-lg border border-stone-200/80 dark:border-stone-800/80 bg-white dark:bg-[#18191C] hover:bg-stone-100 dark:hover:bg-[#222429] flex items-center justify-center text-stone-600 dark:text-stone-200 transition cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Navigation Tabs + Search Bar */}
        <div className="px-4 sm:px-5 pt-3 pb-3 border-b border-stone-200/80 dark:border-stone-800/80 bg-white dark:bg-[#18191C] space-y-3 flex-shrink-0">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <div
              className="inline-flex items-center gap-1 p-1 rounded-xl bg-stone-100 dark:bg-[#131417] border border-stone-200/80 dark:border-stone-800/80 overflow-x-auto no-scrollbar max-w-full"
              role="tablist"
              aria-label="Tab Informasi SITATIB"
            >
              <button
                type="button"
                role="tab"
                aria-selected={activeTab === 'announcements'}
                onClick={() => setActiveTab('announcements')}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition whitespace-nowrap shrink-0 cursor-pointer ${
                  activeTab === 'announcements'
                    ? 'bg-white dark:bg-[#202227] text-stone-900 dark:text-stone-100 shadow-2xs border border-stone-200/70 dark:border-stone-700/80 font-bold'
                    : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-200'
                }`}
              >
                <Bell className="w-3.5 h-3.5 text-[#1E3A2F] dark:text-emerald-400" />
                <span>Pengumuman</span>
                <span className="font-mono tabular-nums text-[11px] opacity-75">
                  ({announcements.length})
                </span>
              </button>

              <button
                type="button"
                role="tab"
                aria-selected={activeTab === 'activities'}
                onClick={() => setActiveTab('activities')}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition whitespace-nowrap shrink-0 cursor-pointer ${
                  activeTab === 'activities'
                    ? 'bg-white dark:bg-[#202227] text-stone-900 dark:text-stone-100 shadow-2xs border border-stone-200/70 dark:border-stone-700/80 font-bold'
                    : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-200'
                }`}
              >
                <CalendarDays className="w-3.5 h-3.5 text-violet-700 dark:text-violet-400" />
                <span>Kegiatan Kelas</span>
                <span className="font-mono tabular-nums text-[11px] opacity-75">
                  ({activities.length})
                </span>
              </button>

              <button
                type="button"
                role="tab"
                aria-selected={activeTab === 'rules'}
                onClick={() => setActiveTab('rules')}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition whitespace-nowrap shrink-0 cursor-pointer ${
                  activeTab === 'rules'
                    ? 'bg-white dark:bg-[#202227] text-stone-900 dark:text-stone-100 shadow-2xs border border-stone-200/70 dark:border-stone-700/80 font-bold'
                    : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-200'
                }`}
              >
                <Scale className="w-3.5 h-3.5 text-[#1E3A2F] dark:text-emerald-400" />
                <span>Pasal &amp; Tata Tertib</span>
                <span className="font-mono tabular-nums text-[11px] opacity-75">
                  ({rules.length})
                </span>
              </button>
            </div>

            <a
              href="https://sitatib.sma.putranirmala.sch.id/"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-stone-200/80 dark:border-stone-800/80 bg-white dark:bg-[#18191C] hover:bg-stone-50 dark:hover:bg-[#202227] text-xs font-semibold text-stone-700 dark:text-stone-300 transition whitespace-nowrap shrink-0"
            >
              <span>Portal SITATIB</span>
              <ExternalLink className="w-3.5 h-3.5 opacity-70" />
            </a>
          </div>

          {/* Search input + Category filter */}
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder={
                  activeTab === 'announcements'
                    ? 'Cari pengumuman atau informasi SITATIB...'
                    : activeTab === 'activities'
                    ? 'Cari jadwal kegiatan kelas, tanggal, atau penyelenggara...'
                    : 'Cari pasal, nomor aturan, kata kunci tata tertib, atau poin...'
                }
                className="w-full pl-9 pr-8 py-2 rounded-lg border border-stone-200/80 dark:border-stone-800/80 bg-[#F8F9FA] dark:bg-[#121317] text-xs sm:text-sm text-stone-900 dark:text-stone-100 placeholder:text-stone-400 dark:placeholder:text-stone-500 focus:outline-hidden focus:ring-2 focus:ring-[#1E3A2F]/40"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  aria-label="Hapus kata kunci"
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {activeTab === 'rules' && ruleCategories.length > 2 && (
              <div className="flex items-center gap-1 overflow-x-auto no-scrollbar pb-0.5">
                {ruleCategories.map(cat => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setSelectedRuleCategory(cat)}
                    className={`px-2.5 py-1.5 rounded-lg text-xs font-medium transition whitespace-nowrap shrink-0 cursor-pointer border ${
                      selectedRuleCategory === cat
                        ? 'bg-[#1E3A2F] text-white border-[#1E3A2F] dark:bg-emerald-700 dark:border-emerald-700'
                        : 'bg-white dark:bg-[#18191C] text-stone-600 dark:text-stone-300 border-stone-200/80 dark:border-stone-800/80 hover:bg-stone-100 dark:hover:bg-[#222429]'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Scrollable Content Area */}
        <div className="flex-1 min-h-0 overflow-y-auto p-4 sm:p-5 space-y-3">
          {/* 1. Loading Skeleton State */}
          {isLoading && !data ? (
            <div className="rounded-xl border border-stone-200/80 dark:border-stone-800/80 bg-white dark:bg-[#18191C] divide-y divide-stone-200/70 dark:divide-stone-800/70">
              {[1, 2, 3, 4].map(n => (
                <div key={n} className="p-4 space-y-2">
                  <div className="h-3 w-32 rounded bg-stone-200 dark:bg-stone-800" />
                  <div className="h-4 w-3/4 rounded bg-stone-200 dark:bg-stone-800" />
                  <div className="h-3 w-full rounded bg-stone-100 dark:bg-stone-800/70" />
                </div>
              ))}
            </div>
          ) : !isConfigured ? (
            /* 2. Unconfigured State (.env credentials absent on backend) */
            <div className="rounded-xl border border-stone-200/80 dark:border-stone-800/80 bg-white dark:bg-[#18191C] p-6 text-center space-y-3">
              <div className="w-11 h-11 rounded-xl bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-800/70 text-amber-700 dark:text-amber-300 flex items-center justify-center mx-auto">
                <KeyRound className="w-5 h-5" />
              </div>
              <div className="max-w-md mx-auto space-y-1.5">
                <h3 className="font-editorial font-bold text-base text-stone-900 dark:text-stone-100">
                  Integrasi SITATIB Belum Dikonfigurasi di Server
                </h3>
                <p className="text-xs sm:text-sm text-stone-600 dark:text-stone-400 leading-relaxed">
                  {data?.error ||
                    'Kredensial akun layanan SITATIB (SITATIB_USERNAME dan SITATIB_PASSWORD) belum diisi pada file .env server backend.'}
                </p>
                <p className="text-xs text-stone-500 dark:text-stone-400 pt-1">
                  Setelah variabel tersebut ditambahkan pada konfigurasi server, pengumuman dan daftar pasal tata tertib resmi akan otomatis tersinkronisasi di sini.
                </p>
              </div>
              <div className="pt-1 flex items-center justify-center gap-2 flex-wrap">
                <button
                  type="button"
                  onClick={onRefresh}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-[#202227] hover:bg-stone-100 dark:hover:bg-[#272A30] text-xs font-semibold text-stone-800 dark:text-stone-200 transition cursor-pointer"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Cek Status Server</span>
                </button>
                <a
                  href="https://sitatib.sma.putranirmala.sch.id/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-[#1E3A2F] hover:bg-[#172E25] text-white text-xs font-semibold transition"
                >
                  <span>Buka SITATIB Langsung</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>
          ) : data?.error ? (
            /* 3. Authentication / Network Error State */
            <div className="rounded-xl border border-rose-200/80 dark:border-rose-900/70 bg-white dark:bg-[#18191C] p-5 space-y-3">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-rose-600 dark:text-rose-400 flex-shrink-0 mt-0.5" />
                <div className="min-w-0 flex-1 space-y-1">
                  <h3 className="text-sm font-bold text-stone-900 dark:text-stone-100">
                    Gagal Menghubungkan ke Portal SITATIB
                  </h3>
                  <p className="text-xs sm:text-sm text-stone-600 dark:text-stone-400 leading-relaxed">
                    {data.error}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 pl-8">
                <button
                  type="button"
                  onClick={onRefresh}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#1E3A2F] hover:bg-[#172E25] text-white text-xs font-semibold transition cursor-pointer"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Coba Sinkron Ulang</span>
                </button>
              </div>
            </div>
          ) : activeTab === 'announcements' ? (
            /* 4A. Announcements List */
            filteredAnnouncements.length === 0 ? (
              <div className="rounded-xl border border-stone-200/80 dark:border-stone-800/80 bg-white dark:bg-[#18191C] py-10 px-4 text-center space-y-2">
                <Inbox className="w-8 h-8 text-stone-300 dark:text-stone-600 mx-auto stroke-1.5" />
                <p className="text-sm font-semibold text-stone-800 dark:text-stone-200">
                  {searchQuery
                    ? 'Tidak ada pengumuman yang cocok'
                    : 'Belum ada pengumuman aktif di SITATIB'}
                </p>
                <p className="text-xs text-stone-500 dark:text-stone-400 max-w-md mx-auto">
                  {searchQuery
                    ? 'Coba kata kunci lain atau hapus pencarian untuk melihat seluruh daftar.'
                    : 'Portal SITATIB terhubung, namun belum ada butir pengumuman baru yang dipublikasikan untuk akun kelas.'}
                </p>
              </div>
            ) : (
              <div className="rounded-xl border border-stone-200/80 dark:border-stone-800/80 bg-white dark:bg-[#18191C] divide-y divide-stone-200/80 dark:divide-stone-800/80 overflow-hidden">
                {filteredAnnouncements.map(item => {
                  const isExpanded = expandedAnnouncementId === item.id;
                  const displayBody = item.fullContent || item.content;
                  const canExpand = displayBody.length > 180;
                  const attachments = item.attachments || [];

                  return (
                    <article key={item.id} className="p-4 space-y-2">
                      <div className="flex items-center justify-between gap-2 flex-wrap text-[11px] text-stone-500 dark:text-stone-400 font-medium">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {item.isPinned && (
                            <span className="font-semibold text-amber-700 dark:text-amber-300">
                              Disematkan ·
                            </span>
                          )}
                          <span className="text-[#1E3A2F] dark:text-emerald-400 font-semibold">
                            {item.category || 'Pengumuman SITATIB'}
                          </span>
                          {item.publishedAt && (
                            <span className="font-mono tabular-nums">· {item.publishedAt}</span>
                          )}
                        </div>
                        {item.sourceUrl && (
                          <a
                            href={item.sourceUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-stone-500 hover:text-[#1E3A2F] dark:hover:text-emerald-400 transition"
                          >
                            <span>Sumber</span>
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        )}
                      </div>

                      <h3 className="font-editorial font-bold text-sm sm:text-base text-stone-900 dark:text-stone-100 leading-snug">
                        {item.title}
                      </h3>

                      {displayBody && (
                        <div className="text-xs sm:text-sm text-stone-600 dark:text-stone-300 leading-relaxed">
                          <div className={!isExpanded && canExpand ? 'line-clamp-3' : ''}>
                            <FormattedText content={displayBody} />
                          </div>
                          {canExpand && (
                            <button
                              type="button"
                              onClick={() =>
                                setExpandedAnnouncementId(isExpanded ? null : item.id)
                              }
                              className="mt-1 inline-flex items-center gap-1 text-xs font-semibold text-[#1E3A2F] dark:text-emerald-400 hover:underline cursor-pointer"
                            >
                              {isExpanded ? (
                                <>
                                  <span>Ringkas</span>
                                  <ChevronUp className="w-3.5 h-3.5" />
                                </>
                              ) : (
                                <>
                                  <span>Baca selengkapnya</span>
                                  <ChevronDown className="w-3.5 h-3.5" />
                                </>
                              )}
                            </button>
                          )}
                        </div>
                      )}

                      {attachments.length > 0 && (
                        <div className="pt-1.5 flex items-center gap-2 flex-wrap">
                          {attachments.map(att => {
                            const isPdf = att.kind === 'pdf';
                            const isImg = att.kind === 'image';
                            const isLink = att.kind === 'link';
                            return (
                              <button
                                key={att.id}
                                type="button"
                                onClick={() => onOpenAttachment?.(att, item.title)}
                                className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold border transition cursor-pointer max-w-full ${
                                  isPdf
                                    ? 'bg-rose-50 hover:bg-rose-100 text-rose-800 border-rose-200 dark:bg-rose-950/50 dark:hover:bg-rose-950/80 dark:text-rose-200 dark:border-rose-800/70'
                                    : isImg
                                    ? 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-950/50 dark:hover:bg-emerald-950/80 dark:text-emerald-200 dark:border-emerald-800/70'
                                    : isLink
                                    ? 'bg-sky-50 hover:bg-sky-100 text-sky-800 border-sky-200 dark:bg-sky-950/50 dark:hover:bg-sky-950/80 dark:text-sky-200 dark:border-sky-800/70'
                                    : 'bg-stone-100 hover:bg-stone-200 text-stone-800 border-stone-200 dark:bg-stone-800 dark:hover:bg-stone-700 dark:text-stone-200 dark:border-stone-700'
                                }`}
                              >
                                {isPdf ? (
                                  <FileText className="w-3.5 h-3.5 flex-shrink-0" />
                                ) : isImg ? (
                                  <FileImage className="w-3.5 h-3.5 flex-shrink-0" />
                                ) : isLink ? (
                                  <Link2 className="w-3.5 h-3.5 flex-shrink-0" />
                                ) : (
                                  <Paperclip className="w-3.5 h-3.5 flex-shrink-0" />
                                )}
                                <span className="truncate">{att.label}</span>
                                <span className="text-[10px] font-mono uppercase opacity-75 flex-shrink-0">
                                  {isPdf ? 'PDF' : isImg ? 'IMG' : isLink ? 'Tautan' : 'Berkas'}
                                </span>
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </article>
                  );
                })}
              </div>
            )
          ) : activeTab === 'activities' ? (
            /* 4B. Class Activities Schedule List (Strictly separate from iCal) */
            filteredActivities.length === 0 ? (
              <div className="rounded-xl border border-stone-200/80 dark:border-stone-800/80 bg-white dark:bg-[#18191C] py-10 px-4 text-center space-y-2">
                <CalendarDays className="w-8 h-8 text-stone-300 dark:text-stone-600 mx-auto stroke-1.5" />
                <p className="text-sm font-semibold text-stone-800 dark:text-stone-200">
                  {searchQuery
                    ? 'Tidak ada jadwal kegiatan kelas yang cocok'
                    : 'Belum ada jadwal kegiatan kelas di SITATIB'}
                </p>
                <p className="text-xs text-stone-500 dark:text-stone-400 max-w-md mx-auto">
                  {searchQuery
                    ? 'Coba kata kunci lain atau hapus pencarian untuk melihat seluruh daftar.'
                    : 'Portal SITATIB terhubung, namun belum ada jadwal kegiatan kelas yang dipublikasikan.'}
                </p>
              </div>
            ) : (
              <div className="rounded-xl border border-stone-200/80 dark:border-stone-800/80 bg-white dark:bg-[#18191C] divide-y divide-stone-200/80 dark:divide-stone-800/80 overflow-hidden">
                {filteredActivities.map(act => (
                  <article key={act.id} className="p-4 space-y-1.5">
                    <div className="flex items-center justify-between gap-2 flex-wrap text-[11px] text-stone-500 dark:text-stone-400 font-medium">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-violet-700 dark:text-violet-400 font-semibold">
                          SITATIB · Kegiatan Kelas
                        </span>
                        <span className="font-mono tabular-nums">· {act.dateLabel}</span>
                        {act.isPast && (
                          <span className="font-semibold text-stone-500 dark:text-stone-400">
                            · Sudah Berlalu
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        {onSelectDate && (
                          <button
                            type="button"
                            onClick={() => {
                              onSelectDate(act.startDate);
                              onClose();
                            }}
                            className="inline-flex items-center gap-1 text-violet-700 dark:text-violet-400 font-semibold hover:underline whitespace-nowrap shrink-0 cursor-pointer"
                          >
                            <span>Lihat di Kalender</span>
                            <ArrowRight className="w-3 h-3" />
                          </button>
                        )}
                        {act.sourceUrl && (
                          <a
                            href={act.sourceUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-stone-500 hover:text-[#1E3A2F] dark:hover:text-emerald-400 transition whitespace-nowrap shrink-0"
                          >
                            <span>Sumber</span>
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        )}
                      </div>
                    </div>

                    <h3 className="font-editorial font-bold text-sm sm:text-base text-stone-900 dark:text-stone-100 leading-snug">
                      {act.title}
                    </h3>

                    {(act.timeLabel || act.className || act.organizer) && (
                      <div className="flex items-center gap-3 flex-wrap text-xs text-stone-600 dark:text-stone-400">
                        {act.timeLabel && (
                          <span className="inline-flex items-center gap-1 font-mono tabular-nums text-violet-800 dark:text-violet-300 font-semibold">
                            <Clock className="w-3.5 h-3.5" />
                            <span>{act.timeLabel}</span>
                          </span>
                        )}
                        {(act.className || act.organizer) && (
                          <span className="inline-flex items-center gap-1">
                            <User className="w-3.5 h-3.5 opacity-75" />
                            <span>
                              {[act.className, act.organizer].filter(Boolean).join(' · ')}
                            </span>
                          </span>
                        )}
                      </div>
                    )}

                    {act.description && (
                      <div className="pt-1 text-xs sm:text-sm text-stone-600 dark:text-stone-300 leading-relaxed">
                        <FormattedText content={act.description} />
                      </div>
                    )}
                  </article>
                ))}
              </div>
            )
          ) : /* 4C. Rules & Tata Tertib List */
          filteredRules.length === 0 ? (
            <div className="rounded-xl border border-stone-200/80 dark:border-stone-800/80 bg-white dark:bg-[#18191C] py-10 px-4 text-center space-y-2">
              <Scale className="w-8 h-8 text-stone-300 dark:text-stone-600 mx-auto stroke-1.5" />
              <p className="text-sm font-semibold text-stone-800 dark:text-stone-200">
                {searchQuery || selectedRuleCategory !== 'Semua'
                  ? 'Tidak ada pasal tata tertib yang cocok'
                  : 'Daftar pasal tata tertib belum tersedia'}
              </p>
              <p className="text-xs text-stone-500 dark:text-stone-400 max-w-md mx-auto">
                {searchQuery || selectedRuleCategory !== 'Semua'
                  ? 'Coba ubah filter kategori atau kata kunci pencarian.'
                  : 'Portal SITATIB terhubung, namun tidak ada daftar pasal tata tertib yang ditemukan pada menu akun layanan.'}
              </p>
            </div>
          ) : (
            <div className="rounded-xl border border-stone-200/80 dark:border-stone-800/80 bg-white dark:bg-[#18191C] divide-y divide-stone-200/80 dark:divide-stone-800/80 overflow-hidden">
              {filteredRules.map(rule => (
                <div key={rule.id} className="p-4 flex items-start justify-between gap-4">
                  <div className="min-w-0 flex-1 space-y-1">
                    <div className="flex items-center gap-1.5 text-[11px] text-stone-500 dark:text-stone-400 font-medium flex-wrap">
                      <span className="font-mono tabular-nums font-bold text-[#1E3A2F] dark:text-emerald-400">
                        {rule.codeOrNumber}
                      </span>
                      <span>· {rule.category}</span>
                    </div>

                    <h3 className="text-sm font-semibold text-stone-900 dark:text-stone-100 leading-snug">
                      {rule.title}
                    </h3>

                    {rule.description && rule.description !== rule.title && (
                      <p className="text-xs text-stone-600 dark:text-stone-400 leading-relaxed">
                        {rule.description}
                      </p>
                    )}
                  </div>

                  {typeof rule.points === 'number' && (
                    <div className="text-right flex-shrink-0">
                      <span
                        className={`font-mono tabular-nums text-xs sm:text-sm font-bold ${
                          rule.pointType === 'penghargaan'
                            ? 'text-emerald-700 dark:text-emerald-400'
                            : rule.pointType === 'pelanggaran'
                            ? 'text-rose-700 dark:text-rose-400'
                            : 'text-stone-700 dark:text-stone-300'
                        }`}
                      >
                        {rule.pointType === 'penghargaan' ? '+' : ''}
                        {rule.points} poin
                      </span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-stone-200/80 dark:border-stone-800/80 bg-white dark:bg-[#18191C] flex items-center justify-between gap-2 flex-shrink-0">
          <div className="flex items-center gap-2 text-[11px] text-stone-500 dark:text-stone-400 min-w-0">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-700 dark:text-emerald-400 flex-shrink-0" />
            <span className="truncate">
              {data?.authenticated
                ? `Tersinkron (${formatSyncTimestamp(data.syncedAt)}) · Data kelas tanpa identitas pribadi`
                : `Status: ${isConfigured ? 'Belum terautentikasi' : 'Menunggu konfigurasi .env server'}`}
            </span>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-stone-100 dark:bg-[#141518] hover:bg-stone-200 dark:hover:bg-[#202227] text-stone-700 dark:text-stone-300 text-xs font-semibold transition whitespace-nowrap shrink-0 cursor-pointer"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};

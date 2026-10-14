import React, { useState, useMemo } from 'react';
import {
  X,
  Wallet,
  AlertCircle,
  CheckCircle2,
  TrendingDown,
  TrendingUp,
  Search,
  Download,
  Filter,
  RefreshCw,
  ExternalLink,
  Info,
  Calendar,
  Receipt,
  ArrowUpRight,
  UserCheck,
  UserX,
  CreditCard,
  DollarSign
} from 'lucide-react';
import { KasDataStore, KasStudentEntry, KasPengeluaranItem, KasPendapatanLainItem } from '../types';

interface KasMuridModalProps {
  isOpen: boolean;
  onClose: () => void;
  kasData?: KasDataStore;
  onRefresh?: () => void;
  isRefreshing?: boolean;
}

type TabType = 'penunggakan' | 'pengeluaran' | 'pendapatan' | 'rekap';
type FilterStatus = 'all' | 'nunggak' | 'lunas' | 'lebih';

export const KasMuridModal: React.FC<KasMuridModalProps> = ({
  isOpen,
  onClose,
  kasData,
  onRefresh,
  isRefreshing = false
}) => {
  const [activeTab, setActiveTab] = useState<TabType>('penunggakan');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<FilterStatus>('all');
  const [selectedStudent, setSelectedStudent] = useState<KasStudentEntry | null>(null);

  if (!isOpen) return null;

  const weeks = kasData?.weeks || [];
  const students = kasData?.students || [];
  const pengeluaranList = kasData?.pengeluaranList || [];
  const pendapatanLainList = kasData?.pendapatanLainList || [];
  const rekap = kasData?.rekapSummary;

  // Filtered students
  const filteredStudents = useMemo(() => {
    return students.filter(student => {
      const matchSearch =
        student.nama.toLowerCase().includes(searchQuery.toLowerCase()) ||
        student.absen.toString().includes(searchQuery);

      if (!matchSearch) return false;

      if (statusFilter === 'all') return true;
      if (statusFilter === 'nunggak') return student.status === 'nunggak';
      if (statusFilter === 'lunas') return student.status === 'lunas';
      if (statusFilter === 'lebih') return student.status === 'lebih';

      return true;
    });
  }, [students, searchQuery, statusFilter]);

  // Statistics
  const totalStudents = students.length;
  const nunggakCount = students.filter(s => s.status === 'nunggak').length;
  const lunasCount = students.filter(s => s.status === 'lunas').length;
  const lebihCount = students.filter(s => s.status === 'lebih').length;
  const totalTunggakan = kasData?.totalTunggakan || 0;
  const totalTerkumpul = kasData?.totalKasTerkumpul || 0;

  const formatRupiah = (val: number) => {
    return `Rp ${val.toLocaleString('id-ID')}`;
  };

  // Export CSV
  const handleExportCSV = () => {
    if (activeTab === 'penunggakan') {
      const headers = ['Absen', 'Nama', ...weeks.map(w => w.label), 'Total Terbayar', 'Target Wajib', 'Tunggakan', 'Status'];
      const rows = students.map(s => [
        s.absen,
        `"${s.nama}"`,
        ...weeks.map(w => (s.payments[w.colIndex] ? s.payments[w.colIndex] / 1000 : 0)),
        s.totalBayar,
        s.targetWajib,
        s.tunggakan,
        s.status.toUpperCase()
      ]);
      const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `kas_kelas_xb_penunggakan_${new Date().toISOString().slice(0, 10)}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else if (activeTab === 'pengeluaran') {
      const headers = ['Tanggal', 'Barang', 'Kuantitas', 'Harga Satuan', 'Harga Total', 'Saldo Terakhir'];
      const rows = pengeluaranList.map(p => [
        p.tanggal,
        `"${p.barang}"`,
        p.kuantitas,
        p.hargaSatuan,
        p.hargaTotal,
        `"${p.saldo}"`
      ]);
      const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `kas_kelas_xb_pengeluaran_${new Date().toISOString().slice(0, 10)}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="kas-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/60 backdrop-blur-xs animate-fade-in"
    >
      <div
        className="w-full max-w-6xl max-h-[94vh] bg-[#FAF7F2] dark:bg-[#0C0C0C] rounded-2xl border border-[#D8D2C5] dark:border-[#222222] shadow-2xl flex flex-col overflow-hidden text-stone-900 dark:text-stone-100 transition-colors"
        onClick={e => e.stopPropagation()}
      >
        {/* MODAL HEADER */}
        <div className="px-4 sm:px-6 py-4 bg-white dark:bg-[#111111] border-b border-[#D8D2C5] dark:border-[#222222] flex items-center justify-between gap-3 flex-shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-[#062419] text-emerald-800 dark:text-emerald-400 flex items-center justify-center flex-shrink-0 border border-emerald-300 dark:border-emerald-800/40">
              <Wallet className="w-5 h-5 text-emerald-700 dark:text-emerald-400" />
            </div>
            <div className="min-w-0">
              <h2 id="kas-modal-title" className="text-base sm:text-lg font-bold font-display tracking-tight text-stone-900 dark:text-white leading-tight">
                Buku Kas Murid Kelas XB
              </h2>
              <p className="text-xs text-stone-600 dark:text-stone-400 mt-0.5 leading-none">
                Iuran Wajib Rp 3.000 / minggu • SMA Putra Nirmala
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            {onRefresh && (
              <button
                type="button"
                onClick={onRefresh}
                disabled={isRefreshing}
                title="Perbarui data dari Google Sheets"
                className="p-2 rounded-lg border border-[#D8D2C5] dark:border-[#262626] bg-stone-50 dark:bg-[#1A1A1A] hover:bg-stone-100 dark:hover:bg-[#222222] text-stone-700 dark:text-stone-300 transition cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
              >
                <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-emerald-600' : ''}`} />
                <span className="hidden sm:inline text-xs font-semibold">Segarkan</span>
              </button>
            )}
            <button
              type="button"
              onClick={handleExportCSV}
              title="Unduh data dalam format CSV"
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#D8D2C5] dark:border-[#262626] bg-stone-50 dark:bg-[#1A1A1A] hover:bg-stone-100 dark:hover:bg-[#222222] text-xs font-semibold text-stone-700 dark:text-stone-300 transition cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Ekspor CSV</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              aria-label="Tutup jendela buku kas"
              className="p-2 rounded-lg border border-[#D8D2C5] dark:border-[#262626] bg-stone-50 dark:bg-[#1A1A1A] hover:bg-stone-100 dark:hover:bg-[#222222] text-stone-700 dark:text-stone-300 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* TOP SUMMARY METRICS BAR */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3 p-3 sm:p-4 bg-[#F5EFE6] dark:bg-[#141414] border-b border-[#D8D2C5] dark:border-[#222222] flex-shrink-0">
          {/* Card 1: Saldo Kas */}
          <div className="p-3 rounded-xl bg-white dark:bg-[#181818] border border-[#E5DFD5] dark:border-[#2A2A2A] shadow-2xs">
            <div className="flex items-center justify-between text-xs text-stone-600 dark:text-stone-400 mb-1">
              <span className="font-medium">Saldo Kas Aktif</span>
              <DollarSign className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div className="font-display font-bold text-lg sm:text-xl text-emerald-800 dark:text-emerald-400">
              {formatRupiah(rekap?.saldoTotal ?? (totalTerkumpul + (rekap?.pendapatanLain ?? 0) - (rekap?.totalPengeluaran ?? 0)))}
            </div>
            <div className="text-[10px] text-stone-500 dark:text-stone-400 mt-0.5">
              Total kas siap digunakan
            </div>
          </div>

          {/* Card 2: Kas Terkumpul */}
          <div className="p-3 rounded-xl bg-white dark:bg-[#181818] border border-[#E5DFD5] dark:border-[#2A2A2A] shadow-2xs">
            <div className="flex items-center justify-between text-xs text-stone-600 dark:text-stone-400 mb-1">
              <span className="font-medium">Total Iuran Murid</span>
              <TrendingUp className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="font-display font-bold text-lg sm:text-xl text-blue-800 dark:text-blue-400">
              {formatRupiah(totalTerkumpul)}
            </div>
            <div className="text-[10px] text-stone-500 dark:text-stone-400 mt-0.5">
              Dari {totalStudents} murid kelas XB
            </div>
          </div>

          {/* Card 3: Total Pengeluaran */}
          <div className="p-3 rounded-xl bg-white dark:bg-[#181818] border border-[#E5DFD5] dark:border-[#2A2A2A] shadow-2xs">
            <div className="flex items-center justify-between text-xs text-stone-600 dark:text-stone-400 mb-1">
              <span className="font-medium">Total Pengeluaran</span>
              <TrendingDown className="w-4 h-4 text-rose-600 dark:text-rose-400" />
            </div>
            <div className="font-display font-bold text-lg sm:text-xl text-rose-700 dark:text-rose-400">
              {formatRupiah(rekap?.totalPengeluaran ?? 0)}
            </div>
            <div className="text-[10px] text-stone-500 dark:text-stone-400 mt-0.5">
              {pengeluaranList.length > 0 ? `${pengeluaranList.length} transaksi pembelanjaan` : 'Belum ada pengeluaran'}
            </div>
          </div>

          {/* Card 4: Penunggakan */}
          <div className="p-3 rounded-xl bg-white dark:bg-[#181818] border border-[#E5DFD5] dark:border-[#2A2A2A] shadow-2xs">
            <div className="flex items-center justify-between text-xs text-stone-600 dark:text-stone-400 mb-1">
              <span className="font-medium">Total Tunggakan</span>
              <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400" />
            </div>
            <div className="font-display font-bold text-lg sm:text-xl text-amber-700 dark:text-amber-400">
              {formatRupiah(totalTunggakan)}
            </div>
            <div className="text-[10px] text-amber-700 dark:text-amber-400 mt-0.5 font-medium">
              {nunggakCount} murid belum lunas
            </div>
          </div>
        </div>

        {/* NAVIGATION TABS */}
        <div className="px-4 sm:px-6 pt-3 bg-white dark:bg-[#111111] border-b border-[#D8D2C5] dark:border-[#222222] flex items-center gap-2 sm:gap-4 overflow-x-auto no-scrollbar flex-shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab('penunggakan')}
            className={`pb-2.5 px-3 text-xs sm:text-sm font-bold border-b-2 transition whitespace-nowrap flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'penunggakan'
                ? 'border-emerald-600 text-emerald-800 dark:text-emerald-400'
                : 'border-transparent text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-200'
            }`}
          >
            <UserCheck className="w-4 h-4" />
            <span>Iuran & Penunggakan Murid</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-emerald-100 dark:bg-[#082B1E] text-emerald-800 dark:text-emerald-300 font-bold ml-1">
              Utama
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('pengeluaran')}
            className={`pb-2.5 px-3 text-xs sm:text-sm font-bold border-b-2 transition whitespace-nowrap flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'pengeluaran'
                ? 'border-emerald-600 text-emerald-800 dark:text-emerald-400'
                : 'border-transparent text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-200'
            }`}
          >
            <Receipt className="w-4 h-4" />
            <span>Pengeluaran Kelas</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-rose-100 dark:bg-[#2C0D11] text-rose-800 dark:text-rose-300 font-bold ml-1">
              {pengeluaranList.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('pendapatan')}
            className={`pb-2.5 px-3 text-xs sm:text-sm font-bold border-b-2 transition whitespace-nowrap flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'pendapatan'
                ? 'border-emerald-600 text-emerald-800 dark:text-emerald-400'
                : 'border-transparent text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-200'
            }`}
          >
            <ArrowUpRight className="w-4 h-4" />
            <span>Pendapatan Lain</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-blue-100 dark:bg-[#0D1D2C] text-blue-800 dark:text-blue-300 font-bold ml-1">
              {pendapatanLainList.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('rekap')}
            className={`pb-2.5 px-3 text-xs sm:text-sm font-bold border-b-2 transition whitespace-nowrap flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'rekap'
                ? 'border-emerald-600 text-emerald-800 dark:text-emerald-400'
                : 'border-transparent text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-200'
            }`}
          >
            <Calendar className="w-4 h-4" />
            <span>Rekap Keseluruhan</span>
          </button>
        </div>

        {/* TAB BODY CONTENT */}
        <div className="flex-1 min-h-0 overflow-y-auto p-3 sm:p-5">
          {/* TAB 1: PENUNGGAKAN */}
          {activeTab === 'penunggakan' && (
            <div className="space-y-4">
              {/* Filter and Search Bar */}
              <div className="flex flex-col sm:flex-row gap-2.5 sm:items-center justify-between bg-white dark:bg-[#141414] p-3 rounded-xl border border-[#D8D2C5] dark:border-[#222222]">
                <div className="relative flex-1 min-w-[200px]">
                  <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    placeholder="Cari murid berdasarkan nama atau nomor absen..."
                    className="w-full pl-9 pr-3 py-1.5 text-xs sm:text-sm rounded-lg border border-[#D8D2C5] dark:border-[#2C2C2C] bg-stone-50 dark:bg-[#1A1A1A] focus:outline-hidden focus:ring-2 focus:ring-emerald-600"
                  />
                </div>

                <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
                  <span className="text-xs text-stone-500 font-medium hidden sm:inline flex-shrink-0">
                    Status:
                  </span>
                  <button
                    type="button"
                    onClick={() => setStatusFilter('all')}
                    className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition cursor-pointer flex-shrink-0 ${
                      statusFilter === 'all'
                        ? 'bg-stone-800 dark:bg-stone-200 text-white dark:text-stone-900'
                        : 'bg-stone-100 dark:bg-[#202020] text-stone-600 dark:text-stone-300 hover:bg-stone-200'
                    }`}
                  >
                    Semua ({totalStudents})
                  </button>
                  <button
                    type="button"
                    onClick={() => setStatusFilter('nunggak')}
                    className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition cursor-pointer flex-shrink-0 flex items-center gap-1 ${
                      statusFilter === 'nunggak'
                        ? 'bg-amber-600 text-white'
                        : 'bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800 hover:bg-amber-100'
                    }`}
                  >
                    <UserX className="w-3 h-3" />
                    <span>Nunggak ({nunggakCount})</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setStatusFilter('lunas')}
                    className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition cursor-pointer flex-shrink-0 flex items-center gap-1 ${
                      statusFilter === 'lunas'
                        ? 'bg-emerald-600 text-white'
                        : 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 hover:bg-emerald-100'
                    }`}
                  >
                    <CheckCircle2 className="w-3 h-3" />
                    <span>Lunas ({lunasCount})</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setStatusFilter('lebih')}
                    className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition cursor-pointer flex-shrink-0 flex items-center gap-1 ${
                      statusFilter === 'lebih'
                        ? 'bg-blue-600 text-white'
                        : 'bg-blue-50 dark:bg-blue-950/40 text-blue-800 dark:text-blue-300 border border-blue-300 dark:border-blue-800 hover:bg-blue-100'
                    }`}
                  >
                    <span>Lebih ({lebihCount})</span>
                  </button>
                </div>
              </div>

              {/* Status Info Banner (Clean, no formula syntax) */}
              <div className="flex items-center justify-between p-3 rounded-xl bg-emerald-50/70 dark:bg-[#07241A] border border-emerald-200 dark:border-emerald-800/80 text-xs text-emerald-950 dark:text-emerald-200">
                <div className="flex items-center gap-2">
                  <Info className="w-4 h-4 text-emerald-700 dark:text-emerald-400 flex-shrink-0" />
                  <div>
                    <span className="font-bold">
                      Minggu Berjalan: {kasData?.activeWeeksCount ?? 12} Minggu
                    </span>
                    <span className="mx-2 opacity-40">•</span>
                    <span>
                      Target Wajib: <strong>{formatRupiah(kasData?.targetWajibPerStudent ?? ((kasData?.activeWeeksCount ?? 12) * 3000))}</strong> per murid
                    </span>
                  </div>
                </div>
              </div>

              {/* Responsive Table / Cards */}
              <div className="bg-white dark:bg-[#141414] rounded-xl border border-[#D8D2C5] dark:border-[#222222] overflow-hidden shadow-xs">
                <div className="overflow-x-auto max-h-[50vh]">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead className="bg-[#FAF7F2] dark:bg-[#1A1A1A] text-stone-700 dark:text-stone-300 sticky top-0 z-10 border-b border-[#D8D2C5] dark:border-[#2A2A2A]">
                      <tr>
                        <th className="py-2.5 px-3 font-bold w-12 text-center">No</th>
                        <th className="py-2.5 px-3 font-bold min-w-[200px]">Nama Siswa</th>
                        <th className="py-2.5 px-3 font-bold text-center">Status</th>
                        <th className="py-2.5 px-3 font-bold text-right">Terkumpul</th>
                        <th className="py-2.5 px-3 font-bold text-right">Tunggakan</th>
                        <th className="py-2.5 px-3 font-bold text-center">Riwayat Minggu</th>
                        <th className="py-2.5 px-3 font-bold text-center">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#E5DFD5] dark:divide-[#222222]">
                      {filteredStudents.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="py-8 text-center text-stone-500">
                            Tidak ada data murid yang sesuai kriteria pencarian.
                          </td>
                        </tr>
                      ) : (
                        filteredStudents.map(student => (
                          <tr
                            key={student.absen}
                            onClick={() => setSelectedStudent(student)}
                            className="hover:bg-amber-50/50 dark:hover:bg-[#1E1E1E] transition cursor-pointer group"
                          >
                            <td className="py-2.5 px-3 text-center font-bold text-stone-600 dark:text-stone-400">
                              {student.absen}
                            </td>
                            <td className="py-2.5 px-3 font-medium text-stone-900 dark:text-white">
                              <div className="flex items-center gap-2">
                                <span>{student.nama}</span>
                                {student.status === 'nunggak' && (
                                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500 flex-shrink-0 animate-pulse" />
                                )}
                              </div>
                            </td>
                            <td className="py-2.5 px-3 text-center">
                              {student.status === 'lunas' && (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
                                  <CheckCircle2 className="w-3 h-3" />
                                  Lunas
                                </span>
                              )}
                              {student.status === 'nunggak' && (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-300 dark:border-amber-800">
                                  <AlertCircle className="w-3 h-3" />
                                  Nunggak
                                </span>
                              )}
                              {student.status === 'lebih' && (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-300 dark:border-blue-800">
                                  Lebih
                                </span>
                              )}
                            </td>
                            <td className="py-2.5 px-3 text-right font-semibold text-emerald-700 dark:text-emerald-400 tabular-nums">
                              {formatRupiah(student.totalBayar)}
                            </td>
                            <td className="py-2.5 px-3 text-right tabular-nums">
                              {student.tunggakan > 0 ? (
                                <span className="font-bold text-amber-700 dark:text-amber-400">
                                  {formatRupiah(student.tunggakan)}
                                </span>
                              ) : (
                                <span className="text-stone-400 dark:text-stone-600 font-normal">
                                  Rp 0
                                </span>
                              )}
                            </td>
                            <td className="py-2.5 px-3 text-center">
                              {/* Miniature progress bar of paid weeks */}
                              <div className="flex items-center justify-center gap-0.5 max-w-[120px] mx-auto">
                                {weeks.slice(0, 12).map((w, i) => {
                                  const paid = (student.payments[w.colIndex] || 0) >= 3000;
                                  const partial = (student.payments[w.colIndex] || 0) > 0 && (student.payments[w.colIndex] || 0) < 3000;
                                  return (
                                    <span
                                      key={i}
                                      title={`${w.label}: ${formatRupiah(student.payments[w.colIndex] || 0)}`}
                                      className={`w-1.5 h-3.5 rounded-2xs ${
                                        paid
                                          ? 'bg-emerald-500'
                                          : partial
                                          ? 'bg-amber-400'
                                          : 'bg-stone-200 dark:bg-[#2A2A2A]'
                                      }`}
                                    />
                                  );
                                })}
                              </div>
                            </td>
                            <td className="py-2.5 px-3 text-center">
                              <button
                                type="button"
                                onClick={e => {
                                  e.stopPropagation();
                                  setSelectedStudent(student);
                                }}
                                className="px-2 py-1 rounded-md text-[11px] font-semibold bg-stone-100 dark:bg-[#222222] text-stone-700 dark:text-stone-300 hover:bg-emerald-100 hover:text-emerald-800 dark:hover:bg-[#07251A] dark:hover:text-emerald-300 transition"
                              >
                                Detail
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: PENGELUARAN */}
          {activeTab === 'pengeluaran' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-stone-900 dark:text-white">
                    Daftar Pengeluaran Kelas XB
                  </h3>
                  <p className="text-xs text-stone-500">
                    Transparansi pembelanjaan barang dan operasional kelas
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-xs text-stone-500 block">Total Pengeluaran:</span>
                  <span className="font-display font-bold text-base text-rose-700 dark:text-rose-400">
                    {formatRupiah(rekap?.totalPengeluaran ?? 0)}
                  </span>
                </div>
              </div>

              {pengeluaranList.length === 0 ? (
                <div className="py-12 text-center text-xs text-stone-500 bg-white dark:bg-[#141414] rounded-xl border border-[#D8D2C5] dark:border-[#222222]">
                  Belum ada catatan transaksi pengeluaran di lembar Google Sheets.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {pengeluaranList.map((item, idx) => (
                    <div
                      key={item.id || idx}
                      className="p-3.5 rounded-xl bg-white dark:bg-[#141414] border border-[#D8D2C5] dark:border-[#222222] shadow-2xs flex flex-col justify-between gap-3"
                    >
                      <div>
                        <div className="flex items-center justify-between text-xs text-stone-500 mb-1">
                          <span className="flex items-center gap-1 font-medium">
                            <Calendar className="w-3.5 h-3.5 text-stone-400" />
                            {item.tanggal}
                          </span>
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300 border border-rose-200 dark:border-rose-800">
                            Pengeluaran
                          </span>
                        </div>
                        <h4 className="font-bold text-stone-900 dark:text-white text-sm">
                          {item.barang}
                        </h4>
                        <div className="text-xs text-stone-600 dark:text-stone-400 mt-1 flex items-center justify-between">
                          <span>Kuantitas: {item.kuantitas} item</span>
                          <span>@ {formatRupiah(item.hargaSatuan)}</span>
                        </div>
                      </div>

                      <div className="pt-2 border-t border-[#E5DFD5] dark:border-[#242424] flex items-center justify-between">
                        <div>
                          <span className="text-[10px] text-stone-500 block">Harga Total:</span>
                          <span className="font-display font-bold text-sm text-rose-700 dark:text-rose-400">
                            {formatRupiah(item.hargaTotal)}
                          </span>
                        </div>
                        {item.saldo && (
                          <div className="text-right">
                            <span className="text-[10px] text-stone-500 block">Saldo Setelahnya:</span>
                            <span className="text-xs font-semibold text-stone-700 dark:text-stone-300">
                              {item.saldo}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: PENDAPATAN LAIN */}
          {activeTab === 'pendapatan' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-stone-900 dark:text-white">
                    Pendapatan Di Luar Kas Rutin
                  </h3>
                  <p className="text-xs text-stone-500">
                    Sumbangan sukarela, donasi, atau sumber dana lainnya
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-xs text-stone-500 block">Total Pendapatan Lain:</span>
                  <span className="font-display font-bold text-base text-blue-700 dark:text-blue-400">
                    {formatRupiah(rekap?.pendapatanLain ?? 0)}
                  </span>
                </div>
              </div>

              {pendapatanLainList.length === 0 ? (
                <div className="py-12 text-center text-xs text-stone-500 bg-white dark:bg-[#141414] rounded-xl border border-[#D8D2C5] dark:border-[#222222]">
                  Belum ada catatan pendapatan lain di luar iuran rutin.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {pendapatanLainList.map((item, idx) => (
                    <div
                      key={item.id || idx}
                      className="p-4 rounded-xl bg-white dark:bg-[#141414] border border-[#D8D2C5] dark:border-[#222222] shadow-2xs"
                    >
                      <div className="flex items-center justify-between text-xs text-stone-500 mb-1.5">
                        <span className="flex items-center gap-1 font-medium">
                          <Calendar className="w-3.5 h-3.5 text-stone-400" />
                          {item.tanggal}
                        </span>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                          Pemasukan Khusus
                        </span>
                      </div>
                      <h4 className="font-bold text-base text-stone-900 dark:text-white">
                        {item.keterangan}
                      </h4>
                      <div className="mt-3 flex items-center justify-between pt-2 border-t border-[#E5DFD5] dark:border-[#242424]">
                        <span className="text-xs text-stone-500">Nominal:</span>
                        <span className="font-display font-bold text-lg text-emerald-700 dark:text-emerald-400">
                          {formatRupiah(item.jumlah)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 4: REKAP KESELURUHAN */}
          {activeTab === 'rekap' && (
            <div className="space-y-5">
              <div>
                <h3 className="text-sm font-bold text-stone-900 dark:text-white">
                  Ringkasan Rekapitulasi Kas Kelas
                </h3>
                <p className="text-xs text-stone-500">
                  Laporan gabungan semester dan rincian alokasi per bulan
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="p-4 rounded-xl bg-emerald-50/70 dark:bg-[#07241A] border border-emerald-200 dark:border-emerald-800">
                  <span className="text-xs font-semibold text-emerald-800 dark:text-emerald-300 block mb-1">
                    Kas Semester Ganjil
                  </span>
                  <div className="font-display font-bold text-xl text-emerald-900 dark:text-emerald-200">
                    {formatRupiah(rekap?.kasSemesterGanjil ?? totalTerkumpul)}
                  </div>
                  <span className="text-[11px] text-emerald-700/80 dark:text-emerald-400 block mt-1">
                    Iuran {totalStudents} siswa kelas XB
                  </span>
                </div>

                <div className="p-4 rounded-xl bg-blue-50/70 dark:bg-[#0A1F33] border border-blue-200 dark:border-blue-800">
                  <span className="text-xs font-semibold text-blue-800 dark:text-blue-300 block mb-1">
                    Pendapatan Lain / Donasi
                  </span>
                  <div className="font-display font-bold text-xl text-blue-900 dark:text-blue-200">
                    {formatRupiah(rekap?.pendapatanLain ?? 0)}
                  </div>
                  <span className="text-[11px] text-blue-700/80 dark:text-blue-400 block mt-1">
                    {(rekap?.pendapatanLain ?? 0) > 0 ? 'Pemasukan khusus' : 'Tidak ada'}
                  </span>
                </div>

                <div className="p-4 rounded-xl bg-stone-100 dark:bg-[#1A1A1A] border border-stone-300 dark:border-stone-700">
                  <span className="text-xs font-semibold text-stone-700 dark:text-stone-300 block mb-1">
                    Kas Semester Genap
                  </span>
                  <div className="font-display font-bold text-xl text-stone-900 dark:text-stone-100">
                    {formatRupiah(rekap?.kasSemesterGenap ?? 0)}
                  </div>
                  <span className="text-[11px] text-stone-500 dark:text-stone-400 block mt-1">
                    Belum dimulai
                  </span>
                </div>
              </div>

              {/* Monthly breakdown */}
              {rekap?.pengeluaranPerBulan && rekap.pengeluaranPerBulan.length > 0 && (
                <div className="bg-white dark:bg-[#141414] rounded-xl border border-[#D8D2C5] dark:border-[#222222] p-4">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-stone-600 dark:text-stone-400 mb-3">
                    Realisasi Pengeluaran Per Bulan
                  </h4>
                  <div className="space-y-2">
                    {rekap.pengeluaranPerBulan.map((item, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between py-2 border-b border-[#F0ECE1] dark:border-[#1F1F1F] text-xs"
                      >
                        <span className="font-medium text-stone-800 dark:text-stone-200">
                          {item.bulan}
                        </span>
                        <span className="font-bold text-stone-900 dark:text-white tabular-nums">
                          {formatRupiah(item.nominal)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* MODAL FOOTER */}
        <div className="px-4 sm:px-6 py-3 bg-white dark:bg-[#111111] border-t border-[#D8D2C5] dark:border-[#222222] flex items-center justify-between text-xs text-stone-500 flex-shrink-0">
          <div className="flex items-center gap-1.5">
            <Info className="w-3.5 h-3.5 text-stone-400" />
            <span>Sinkronisasi otomatis dari Google Sheets resmi kelas</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-stone-800 dark:bg-stone-200 text-white dark:text-stone-900 font-semibold hover:opacity-90 transition cursor-pointer"
          >
            Tutup
          </button>
        </div>
      </div>

      {/* STUDENT INDIVIDUAL DETAIL MODAL (SUB-POPUP) */}
      {selectedStudent && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-60 flex items-center justify-center p-3 bg-black/60 backdrop-blur-xs animate-fade-in"
          onClick={() => setSelectedStudent(null)}
        >
          <div
            className="w-full max-w-lg bg-white dark:bg-[#141414] rounded-2xl border border-[#D8D2C5] dark:border-[#262626] shadow-2xl p-5 overflow-hidden flex flex-col gap-4 text-stone-900 dark:text-stone-100"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-3 pb-3 border-b border-[#D8D2C5] dark:border-[#222222]">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-stone-500">
                  Detail Iuran Siswa • Absen {selectedStudent.absen}
                </span>
                <h3 className="font-bold text-lg text-stone-900 dark:text-white">
                  {selectedStudent.nama}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedStudent(null)}
                className="p-1.5 rounded-lg hover:bg-stone-100 dark:hover:bg-[#222222] transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Metrics */}
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="p-2.5 rounded-xl bg-stone-50 dark:bg-[#1A1A1A] border border-stone-200 dark:border-[#282828]">
                <span className="text-[10px] text-stone-500 block">Total Bayar</span>
                <span className="font-display font-bold text-sm text-emerald-700 dark:text-emerald-400">
                  {formatRupiah(selectedStudent.totalBayar)}
                </span>
              </div>
              <div className="p-2.5 rounded-xl bg-stone-50 dark:bg-[#1A1A1A] border border-stone-200 dark:border-[#282828]">
                <span className="text-[10px] text-stone-500 block">Target Wajib</span>
                <span className="font-display font-bold text-sm text-stone-700 dark:text-stone-300">
                  {formatRupiah(selectedStudent.targetWajib)}
                </span>
              </div>
              <div className="p-2.5 rounded-xl bg-stone-50 dark:bg-[#1A1A1A] border border-stone-200 dark:border-[#282828]">
                <span className="text-[10px] text-stone-500 block">Tunggakan</span>
                <span
                  className={`font-display font-bold text-sm ${
                    selectedStudent.tunggakan > 0
                      ? 'text-amber-700 dark:text-amber-400'
                      : 'text-stone-400'
                  }`}
                >
                  {formatRupiah(selectedStudent.tunggakan)}
                </span>
              </div>
            </div>

            {/* Weekly grid */}
            <div>
              <h4 className="text-xs font-bold text-stone-700 dark:text-stone-300 mb-2">
                Catatan Pembayaran Per Minggu:
              </h4>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 max-h-48 overflow-y-auto p-1">
                {weeks.map(w => {
                  const amt = selectedStudent.payments[w.colIndex] || 0;
                  const isPaid = amt >= 3000;
                  const isPartial = amt > 0 && amt < 3000;
                  return (
                    <div
                      key={w.colIndex}
                      className={`p-2 rounded-lg border text-xs flex items-center justify-between ${
                        isPaid
                          ? 'bg-emerald-50/60 dark:bg-emerald-950/30 border-emerald-300 dark:border-emerald-800 text-emerald-900 dark:text-emerald-300'
                          : isPartial
                          ? 'bg-amber-50/60 dark:bg-amber-950/30 border-amber-300 dark:border-amber-800 text-amber-900 dark:text-amber-300'
                          : 'bg-stone-50 dark:bg-[#181818] border-stone-200 dark:border-[#262626] text-stone-500 dark:text-stone-500'
                      }`}
                    >
                      <span className="font-medium">{w.label}</span>
                      <span className="font-bold tabular-nums">
                        {amt > 0 ? formatRupiah(amt) : '-'}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="pt-2 border-t border-[#D8D2C5] dark:border-[#222222] flex justify-end">
              <button
                type="button"
                onClick={() => setSelectedStudent(null)}
                className="px-4 py-1.5 rounded-lg bg-stone-800 dark:bg-stone-200 text-white dark:text-stone-900 text-xs font-semibold hover:opacity-90 transition"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

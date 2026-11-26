import { useMemo, useState } from 'react';
import {
  ChevronDown,
  ChevronUp,
  Download,
  Printer,
  Settings2,
} from 'lucide-react';
import {
  BookItem,
  LoanTransaction,
  ReportType,
  SignatoryConfig,
  UnitKerja,
} from '../types/library';
import {
  BOOK_CATEGORIES,
  LIBRARY_ASSETS,
  UNIT_KERJA_LIST,
} from '../data/seedData';
import {
  addDaysIso,
  downloadTextFile,
  escapeCsvCell,
  formatTanggalLengkap,
  formatTanggalSingkat,
  getLoanOverdueDays,
  getShortUnitKerja,
  getTodayIso,
} from '../utils/format';
import { SafeImage } from '../components/SafeImage';

interface ReportViewProps {
  books: BookItem[];
  loans: LoanTransaction[];
  signatory: SignatoryConfig;
  getAvailableCopies: (bookId: string) => number;
  onUpdateSignatory: (updates: Partial<SignatoryConfig>) => void;
}

export function ReportView({
  books,
  loans,
  signatory,
  getAvailableCopies,
  onUpdateSignatory,
}: ReportViewProps) {
  const today = getTodayIso();
  const [reportType, setReportType] = useState<ReportType>('sirkulasi');
  const [startDate, setStartDate] = useState<string>(addDaysIso(today, -180));
  const [endDate, setEndDate] = useState<string>(today);
  const [reportDate, setReportDate] = useState<string>(today);
  const [unitFilter, setUnitFilter] = useState<'semua' | UnitKerja>('semua');
  const [statusFilter, setStatusFilter] = useState<'semua' | 'Dipinjam' | 'Dikembalikan'>('semua');
  const [showSignatoryEditor, setShowSignatoryEditor] = useState(false);

  const filteredLoans = useMemo(() => {
    return loans
      .filter((loan) => {
        if (startDate && loan.loanDate < startDate) return false;
        if (endDate && loan.loanDate > endDate) return false;
        if (unitFilter !== 'semua' && loan.unitKerja !== unitFilter) return false;
        if (statusFilter !== 'semua' && loan.status !== statusFilter) return false;
        return true;
      })
      .sort((a, b) => a.loanDate.localeCompare(b.loanDate));
  }, [loans, startDate, endDate, unitFilter, statusFilter]);

  const recapSummary = useMemo(() => {
    const totalTx = filteredLoans.length;
    const returned = filteredLoans.filter((l) => l.status === 'Dikembalikan');
    const active = filteredLoans.filter((l) => l.status === 'Dipinjam');
    const onTimeReturned = returned.filter((l) => getLoanOverdueDays(l) === 0).length;
    const lateReturned = returned.length - onTimeReturned;
    const activeOverdue = active.filter((l) => getLoanOverdueDays(l) > 0).length;
    const uniqueBorrowers = new Set(
      filteredLoans.map((l) => l.borrowerNip || l.borrowerName)
    ).size;
    const totalTitles = books.length;
    const totalCopies = books.reduce((s, b) => s + b.totalCopies, 0);
    const goodConditionCopies = books
      .filter((b) => b.condition === 'Baik')
      .reduce((s, b) => s + b.totalCopies, 0);

    const byUnit = UNIT_KERJA_LIST.map((unit) => {
      const unitLoans = filteredLoans.filter((l) => l.unitKerja === unit);
      return {
        unit,
        total: unitLoans.length,
        returned: unitLoans.filter((l) => l.status === 'Dikembalikan').length,
        active: unitLoans.filter((l) => l.status === 'Dipinjam').length,
        borrowers: new Set(unitLoans.map((l) => l.borrowerNip || l.borrowerName)).size,
      };
    });

    const byCategory = BOOK_CATEGORIES.map((category) => {
      const catBooks = books.filter((b) => b.category === category);
      const catLoans = filteredLoans.filter((l) => l.bookCategorySnapshot === category);
      return {
        category,
        titles: catBooks.length,
        copies: catBooks.reduce((s, b) => s + b.totalCopies, 0),
        loans: catLoans.length,
      };
    });

    return {
      totalTx,
      returnedCount: returned.length,
      activeCount: active.length,
      onTimeReturned,
      lateReturned,
      activeOverdue,
      onTimeRate: returned.length > 0 ? Math.round((onTimeReturned / returned.length) * 100) : 100,
      uniqueBorrowers,
      totalTitles,
      totalCopies,
      goodConditionCopies,
      byUnit,
      byCategory,
    };
  }, [filteredLoans, books]);

  const handleExportReportCsv = () => {
    if (reportType === 'inventaris') {
      const headers = [
        'No',
        'No. Induk',
        'Kode Panggil (DDC)',
        'Judul Koleksi',
        'Pengarang',
        'Penerbit',
        'Tahun',
        'Subjek',
        'Lokasi Rak',
        'Jumlah Eksemplar',
        'Tersedia',
        'Kondisi',
      ];
      const rows = books.map((b, i) => [
        i + 1,
        b.inventoryCode,
        b.callNumber,
        b.title,
        b.author,
        b.publisher,
        b.year,
        b.category,
        b.shelfLocation,
        b.totalCopies,
        getAvailableCopies(b.id),
        b.condition,
      ]);
      const csv = '\uFEFF' + [headers, ...rows].map((r) => r.map(escapeCsvCell).join(',')).join('\n');
      downloadTextFile(`inventaris-widya-pustaka-${reportDate}.csv`, csv, 'text/csv;charset=utf-8');
      return;
    }

    const headers = [
      'No',
      'No. Bukti',
      'Nama Peminjam',
      'NIP',
      'Unit Kerja',
      'Kode DDC',
      'Judul Buku',
      'Tanggal Pinjam',
      'Batas Kembali',
      'Tanggal Kembali',
      'Status',
      'Keterangan Ketepatan',
    ];
    const rows = filteredLoans.map((l, i) => {
      const overdue = getLoanOverdueDays(l);
      const ket =
        l.status === 'Dikembalikan'
          ? overdue > 0
            ? `Terlambat ${overdue} hari`
            : 'Tepat Waktu'
          : overdue > 0
            ? `Belum Kembali (Lewat ${overdue} hari)`
            : 'Sedang Dipinjam';
      return [
        i + 1,
        l.receiptNumber,
        l.borrowerName,
        `'${l.borrowerNip}`,
        l.unitKerja,
        l.bookCallNumberSnapshot,
        l.bookTitleSnapshot,
        l.loanDate,
        l.dueDate,
        l.returnDate ?? '-',
        l.status,
        ket,
      ];
    });
    const csv = '\uFEFF' + [headers, ...rows].map((r) => r.map(escapeCsvCell).join(',')).join('\n');
    downloadTextFile(`rekap-bukti-dukung-widya-pustaka-${reportDate}.csv`, csv, 'text/csv;charset=utf-8');
  };

  const documentTitle =
    reportType === 'sirkulasi'
      ? 'REKAPITULASI PEMINJAMAN DAN PENGEMBALIAN BUKU PERPUSTAKAAN'
      : reportType === 'inventaris'
        ? 'LAPORAN INVENTARIS KOLEKSI BAHAN PUSTAKA'
        : 'REKAPITULASI KINERJA LAYANAN PERPUSTAKAAN SKPD (LAMPIRAN SKP / DUPAK / SAKIP)';

  return (
    <div className="space-y-6">
      {/* Control Panel — Hidden when printing */}
      <div className="no-print space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <h1 className="font-display text-2xl font-bold text-slate-900 tracking-tight">
              Cetak Laporan & Rekap Bukti Dukung
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Susun dan cetak dokumen resmi ber-Kop Surat BKPSDM Kota Batu siap tanda tangan untuk arsip, SKP, DUPAK, dan SAKIP.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <button
              type="button"
              onClick={handleExportReportCsv}
              className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-lg transition-colors whitespace-nowrap cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Unduh CSV (Excel)</span>
            </button>
            <button
              type="button"
              onClick={() => window.print()}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-[#0F5C4D] hover:bg-[#0B463B] rounded-lg transition-colors whitespace-nowrap cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>Cetak / Simpan PDF</span>
            </button>
          </div>
        </div>

        {/* Report Type & Filters */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-4">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
            <div className="inline-flex flex-wrap items-center gap-1 p-1 bg-slate-100 rounded-lg self-start">
              {(
                [
                  { id: 'sirkulasi', label: 'Rekap Sirkulasi Buku' },
                  { id: 'kinerja_skp', label: 'Bukti Dukung SKP / DUPAK / SAKIP' },
                  { id: 'inventaris', label: 'Inventaris Koleksi' },
                ] as const
              ).map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setReportType(item.id)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap cursor-pointer ${
                    reportType === item.id
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={() => setShowSignatoryEditor((v) => !v)}
              className="inline-flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-50 border border-slate-200 hover:bg-slate-100 rounded-lg transition-colors self-start lg:self-auto whitespace-nowrap cursor-pointer"
            >
              <Settings2 className="w-3.5 h-3.5 text-slate-500" />
              <span>Pengaturan Kop & Pejabat Penandatangan</span>
              {showSignatoryEditor ? (
                <ChevronUp className="w-3.5 h-3.5" />
              ) : (
                <ChevronDown className="w-3.5 h-3.5" />
              )}
            </button>
          </div>

          {/* Date & Scope Filters */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 pt-1">
            {reportType !== 'inventaris' && (
              <>
                <div>
                  <label htmlFor="rep-start" className="block text-[11px] font-semibold text-slate-600 mb-1">
                    Dari Tanggal
                  </label>
                  <input
                    id="rep-start"
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs font-mono bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:bg-white focus:border-[#0F5C4D]"
                  />
                </div>
                <div>
                  <label htmlFor="rep-end" className="block text-[11px] font-semibold text-slate-600 mb-1">
                    Sampai Tanggal
                  </label>
                  <input
                    id="rep-end"
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs font-mono bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:bg-white focus:border-[#0F5C4D]"
                  />
                </div>
                <div>
                  <label htmlFor="rep-unit" className="block text-[11px] font-semibold text-slate-600 mb-1">
                    Unit Kerja / Bidang
                  </label>
                  <select
                    id="rep-unit"
                    value={unitFilter}
                    onChange={(e) => setUnitFilter(e.target.value as 'semua' | UnitKerja)}
                    className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:bg-white focus:border-[#0F5C4D]"
                  >
                    <option value="semua">Semua Unit Kerja</option>
                    {UNIT_KERJA_LIST.map((u) => (
                      <option key={u} value={u}>
                        {getShortUnitKerja(u)}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label htmlFor="rep-status" className="block text-[11px] font-semibold text-slate-600 mb-1">
                    Status Transaksi
                  </label>
                  <select
                    id="rep-status"
                    value={statusFilter}
                    onChange={(e) =>
                      setStatusFilter(e.target.value as 'semua' | 'Dipinjam' | 'Dikembalikan')
                    }
                    className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:bg-white focus:border-[#0F5C4D]"
                  >
                    <option value="semua">Semua Status</option>
                    <option value="Dipinjam">Sedang Dipinjam</option>
                    <option value="Dikembalikan">Sudah Dikembalikan</option>
                  </select>
                </div>
              </>
            )}

            <div>
              <label htmlFor="rep-date" className="block text-[11px] font-semibold text-slate-600 mb-1">
                Tanggal Penetapan Laporan
              </label>
              <input
                id="rep-date"
                type="date"
                value={reportDate}
                onChange={(e) => setReportDate(e.target.value)}
                className="w-full px-3 py-1.5 text-xs font-mono bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:bg-white focus:border-[#0F5C4D]"
              />
            </div>
          </div>

          {/* Collapsible Official Signatory Form */}
          {showSignatoryEditor && (
            <div className="pt-4 mt-2 border-t border-slate-200 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-3">
                <p className="text-xs font-bold text-slate-800">
                  Identitas Dokumen & Pejabat Mengetahui (Kiri)
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-[11px] text-slate-600 mb-1">Nomor Laporan / Arsip</label>
                    <input
                      type="text"
                      value={signatory.reportNumber}
                      onChange={(e) => onUpdateSignatory({ reportNumber: e.target.value })}
                      className="w-full px-3 py-1.5 text-xs font-mono border border-slate-300 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-slate-600 mb-1">Kota Penetapan</label>
                    <input
                      type="text"
                      value={signatory.city}
                      onChange={(e) => onUpdateSignatory({ city: e.target.value })}
                      className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-[11px] text-slate-600 mb-1">Jabatan Pejabat Mengetahui</label>
                    <input
                      type="text"
                      value={signatory.headTitle}
                      onChange={(e) => onUpdateSignatory({ headTitle: e.target.value })}
                      className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-slate-600 mb-1">Nama Pejabat</label>
                    <input
                      type="text"
                      value={signatory.headName}
                      onChange={(e) => onUpdateSignatory({ headName: e.target.value })}
                      className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-slate-600 mb-1">Pangkat / Golongan</label>
                    <input
                      type="text"
                      value={signatory.headRank}
                      onChange={(e) => onUpdateSignatory({ headRank: e.target.value })}
                      className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-[11px] text-slate-600 mb-1">NIP Pejabat Mengetahui</label>
                    <input
                      type="text"
                      value={signatory.headNip}
                      onChange={(e) => onUpdateSignatory({ headNip: e.target.value })}
                      className="w-full px-3 py-1.5 text-xs font-mono border border-slate-300 rounded-lg"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <p className="text-xs font-bold text-slate-800">
                  Pustakawan / Pengelola Perpustakaan (Kanan)
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div className="sm:col-span-2">
                    <label className="block text-[11px] text-slate-600 mb-1">Jabatan Fungsional / Pengelola</label>
                    <input
                      type="text"
                      value={signatory.librarianTitle}
                      onChange={(e) => onUpdateSignatory({ librarianTitle: e.target.value })}
                      className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-slate-600 mb-1">Nama Pustakawan / Pengelola</label>
                    <input
                      type="text"
                      value={signatory.librarianName}
                      onChange={(e) => onUpdateSignatory({ librarianName: e.target.value })}
                      className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-slate-600 mb-1">Pangkat / Golongan</label>
                    <input
                      type="text"
                      value={signatory.librarianRank}
                      onChange={(e) => onUpdateSignatory({ librarianRank: e.target.value })}
                      className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-[11px] text-slate-600 mb-1">NIP Pustakawan</label>
                    <input
                      type="text"
                      value={signatory.librarianNip}
                      onChange={(e) => onUpdateSignatory({ librarianNip: e.target.value })}
                      className="w-full px-3 py-1.5 text-xs font-mono border border-slate-300 rounded-lg"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-[11px] text-slate-600 mb-1">Alamat Kop Surat Instansi</label>
                    <input
                      type="text"
                      value={signatory.agencyAddress}
                      onChange={(e) => onUpdateSignatory({ agencyAddress: e.target.value })}
                      className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Printable Official Government Document Sheet */}
      <article className="print-only-container official-document bg-white border border-slate-300 rounded-xl shadow-xs p-6 sm:p-10 lg:p-12 max-w-[960px] mx-auto text-black">
        {/* KOP SURAT PEMERINTAH KOTA BATU */}
        <header className="flex items-center gap-5 pb-3.5 border-b-[3px] border-double border-black">
          <SafeImage
            src={LIBRARY_ASSETS.emblem}
            alt="Lambang Pojok Baca Widya Pustaka BKPSDM Kota Batu"
            className="w-20 h-20 object-contain shrink-0"
          />
          <div className="flex-1 text-center pr-4">
            <p className="text-[13px] sm:text-[15px] font-bold tracking-wider uppercase leading-tight">
              {signatory.agencyHeaderLine1}
            </p>
            <p className="text-[14px] sm:text-[16px] font-bold uppercase leading-snug mt-0.5">
              {signatory.agencyHeaderLine2}
            </p>
            <p className="text-[12px] font-bold tracking-wide mt-0.5">
              UNIT LAYANAN POJOK BACA WIDYA PUSTAKA
            </p>
            <p className="text-[11px] text-slate-800 mt-1 leading-tight">
              {signatory.agencyAddress}
            </p>
            <p className="text-[10px] text-slate-700 leading-tight mt-0.5">
              {signatory.agencyContact}
            </p>
          </div>
        </header>

        {/* Document Heading */}
        <div className="text-center mt-6 mb-6">
          <h2 className="text-[14px] sm:text-[15px] font-bold uppercase underline tracking-wide">
            {documentTitle}
          </h2>
          <p className="text-[12px] mt-1">
            Nomor: <span className="font-mono">{signatory.reportNumber}</span>
          </p>
          {reportType !== 'inventaris' ? (
            <p className="text-[12px] mt-0.5">
              Periode: {formatTanggalLengkap(startDate)} s.d. {formatTanggalLengkap(endDate)}
              {unitFilter !== 'semua' ? ` · Unit Kerja: ${unitFilter}` : ' · Seluruh Unit Kerja BKPSDM Kota Batu'}
            </p>
          ) : (
            <p className="text-[12px] mt-0.5">
              Posisi Inventaris Per Tanggal: {formatTanggalLengkap(reportDate)}
            </p>
          )}
        </div>

        {/* REPORT TYPE 1: REKAPITULASI SIRKULASI */}
        {reportType === 'sirkulasi' && (
          <div className="space-y-5">
            <div className="grid grid-cols-2 sm:grid-cols-4 border border-black text-[11px]">
              <div className="p-2.5 border-b sm:border-b-0 border-r border-black">
                <p className="text-slate-700">Total Peminjaman</p>
                <p className="text-[14px] font-bold tabular-nums mt-0.5">
                  {recapSummary.totalTx} Transaksi
                </p>
              </div>
              <div className="p-2.5 border-b sm:border-b-0 sm:border-r border-black">
                <p className="text-slate-700">Sudah Dikembalikan</p>
                <p className="text-[14px] font-bold tabular-nums mt-0.5">
                  {recapSummary.returnedCount} ({recapSummary.onTimeRate}% Tepat Waktu)
                </p>
              </div>
              <div className="p-2.5 border-r border-black">
                <p className="text-slate-700">Sedang Dipinjam</p>
                <p className="text-[14px] font-bold tabular-nums mt-0.5">
                  {recapSummary.activeCount} Eks ({recapSummary.activeOverdue} Lewat Batas)
                </p>
              </div>
              <div className="p-2.5">
                <p className="text-slate-700">Pemustaka Terlayani</p>
                <p className="text-[14px] font-bold tabular-nums mt-0.5">
                  {recapSummary.uniqueBorrowers} Pegawai ASN
                </p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full border-collapse border border-black text-[11px]">
                <thead>
                  <tr className="bg-slate-100">
                    <th className="border border-black py-2 px-2 text-center w-8">No</th>
                    <th className="border border-black py-2 px-2 text-left whitespace-nowrap">No. Bukti</th>
                    <th className="border border-black py-2 px-2 text-left">Peminjam / NIP / Bidang</th>
                    <th className="border border-black py-2 px-2 text-left">Judul Buku & DDC</th>
                    <th className="border border-black py-2 px-2 text-center whitespace-nowrap">Tgl Pinjam</th>
                    <th className="border border-black py-2 px-2 text-center whitespace-nowrap">Tgl Kembali</th>
                    <th className="border border-black py-2 px-2 text-left whitespace-nowrap">Status & Ket.</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredLoans.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="border border-black py-6 px-4 text-center italic">
                        Tidak terdapat catatan transaksi peminjaman pada rentang filter yang dipilih.
                      </td>
                    </tr>
                  ) : (
                    filteredLoans.map((loan, index) => {
                      const overdue = getLoanOverdueDays(loan);
                      return (
                        <tr key={loan.id}>
                          <td className="border border-black py-1.5 px-2 text-center tabular-nums align-top">
                            {index + 1}
                          </td>
                          <td className="border border-black py-1.5 px-2 font-mono text-[10px] whitespace-nowrap align-top">
                            {loan.receiptNumber}
                          </td>
                          <td className="border border-black py-1.5 px-2 align-top">
                            <p className="font-bold leading-snug">{loan.borrowerName}</p>
                            <p className="font-mono text-[10px]">NIP. {loan.borrowerNip}</p>
                            <p className="text-[10px] text-slate-800">{getShortUnitKerja(loan.unitKerja)}</p>
                          </td>
                          <td className="border border-black py-1.5 px-2 align-top">
                            <p className="leading-snug">{loan.bookTitleSnapshot}</p>
                            <p className="font-mono text-[10px] text-slate-700 mt-0.5">
                              DDC: {loan.bookCallNumberSnapshot}
                            </p>
                          </td>
                          <td className="border border-black py-1.5 px-2 text-center whitespace-nowrap tabular-nums align-top">
                            {formatTanggalSingkat(loan.loanDate)}
                            <div className="text-[9px] text-slate-700">
                              Bts: {formatTanggalSingkat(loan.dueDate)}
                            </div>
                          </td>
                          <td className="border border-black py-1.5 px-2 text-center whitespace-nowrap tabular-nums align-top">
                            {loan.returnDate ? formatTanggalSingkat(loan.returnDate) : '—'}
                          </td>
                          <td className="border border-black py-1.5 px-2 align-top text-[10px]">
                            <p className="font-bold">{loan.status}</p>
                            <p>
                              {loan.status === 'Dikembalikan'
                                ? overdue > 0
                                  ? `Terlambat ${overdue} hr`
                                  : 'Tepat Waktu'
                                : overdue > 0
                                  ? `Lewat ${overdue} hr`
                                  : 'Berjalan'}
                            </p>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* REPORT TYPE 2: INVENTARIS KOLEKSI */}
        {reportType === 'inventaris' && (
          <div className="space-y-5">
            <div className="grid grid-cols-3 border border-black text-[11px]">
              <div className="p-2.5 border-r border-black">
                <p className="text-slate-700">Jumlah Judul Terdaftar</p>
                <p className="text-[14px] font-bold tabular-nums mt-0.5">
                  {recapSummary.totalTitles} Judul
                </p>
              </div>
              <div className="p-2.5 border-r border-black">
                <p className="text-slate-700">Total Eksemplar Koleksi</p>
                <p className="text-[14px] font-bold tabular-nums mt-0.5">
                  {recapSummary.totalCopies} Eksemplar
                </p>
              </div>
              <div className="p-2.5">
                <p className="text-slate-700">Kondisi Baik</p>
                <p className="text-[14px] font-bold tabular-nums mt-0.5">
                  {recapSummary.goodConditionCopies} Eksemplar
                </p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full border-collapse border border-black text-[11px]">
                <thead>
                  <tr className="bg-slate-100">
                    <th className="border border-black py-2 px-2 text-center w-8">No</th>
                    <th className="border border-black py-2 px-2 text-left whitespace-nowrap">No. Induk & DDC</th>
                    <th className="border border-black py-2 px-2 text-left">Judul Buku / Pengarang / Penerbit</th>
                    <th className="border border-black py-2 px-2 text-left">Subjek & Rak</th>
                    <th className="border border-black py-2 px-2 text-center whitespace-nowrap">Jml Eks</th>
                    <th className="border border-black py-2 px-2 text-center whitespace-nowrap">Tersedia</th>
                    <th className="border border-black py-2 px-2 text-left whitespace-nowrap">Kondisi</th>
                  </tr>
                </thead>
                <tbody>
                  {books.map((book, idx) => (
                    <tr key={book.id}>
                      <td className="border border-black py-1.5 px-2 text-center tabular-nums align-top">
                        {idx + 1}
                      </td>
                      <td className="border border-black py-1.5 px-2 font-mono text-[10px] whitespace-nowrap align-top">
                        <div>{book.inventoryCode}</div>
                        <div className="text-slate-700">{book.callNumber}</div>
                      </td>
                      <td className="border border-black py-1.5 px-2 align-top">
                        <p className="font-bold leading-snug">{book.title}</p>
                        <p className="text-[10px] text-slate-800">
                          {book.author} · {book.publisher} ({book.year})
                        </p>
                      </td>
                      <td className="border border-black py-1.5 px-2 align-top text-[10px]">
                        <p>{book.category}</p>
                        <p className="text-slate-700">{book.shelfLocation}</p>
                      </td>
                      <td className="border border-black py-1.5 px-2 text-center font-mono tabular-nums align-top">
                        {book.totalCopies}
                      </td>
                      <td className="border border-black py-1.5 px-2 text-center font-mono tabular-nums align-top">
                        {getAvailableCopies(book.id)}
                      </td>
                      <td className="border border-black py-1.5 px-2 align-top text-[10px]">
                        {book.condition}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* REPORT TYPE 3: BUKTI DUKUNG KINERJA SKP / DUPAK / SAKIP */}
        {reportType === 'kinerja_skp' && (
          <div className="space-y-5 text-[12px]">
            <p className="leading-relaxed text-justify">
              Berdasarkan pencatatan layanan sirkulasi dan pengelolaan koleksi pada sistem digital <strong>Pojok Baca Widya Pustaka BKPSDM Kota Batu</strong> selama periode{' '}
              <strong>{formatTanggalLengkap(startDate)}</strong> sampai dengan{' '}
              <strong>{formatTanggalLengkap(endDate)}</strong>, disampaikan rekapitulasi capaian kinerja layanan perpustakaan SKPD sebagai bukti dukung administrasi arsip, Sasaran Kinerja Pegawai (SKP), Daftar Usul Penetapan Angka Kredit (DUPAK) Jabatan Fungsional Pustakawan, serta pelaporan SAKIP sebagai berikut:
            </p>

            {/* A. Ringkasan Indikator Kinerja */}
            <div>
              <h3 className="font-bold mb-2">A. Ringkasan Indikator Layanan Perpustakaan</h3>
              <table className="w-full border-collapse border border-black text-[11px]">
                <thead>
                  <tr className="bg-slate-100">
                    <th className="border border-black py-1.5 px-2 text-center w-8">No</th>
                    <th className="border border-black py-1.5 px-3 text-left">Indikator Kinerja Layanan</th>
                    <th className="border border-black py-1.5 px-3 text-right">Capaian</th>
                    <th className="border border-black py-1.5 px-3 text-left">Satuan / Keterangan</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="border border-black py-1.5 px-2 text-center">1</td>
                    <td className="border border-black py-1.5 px-3">Ketersediaan Koleksi Bahan Pustaka Terinventarisasi</td>
                    <td className="border border-black py-1.5 px-3 text-right font-mono font-bold tabular-nums">
                      {recapSummary.totalTitles} / {recapSummary.totalCopies}
                    </td>
                    <td className="border border-black py-1.5 px-3">Judul / Eksemplar</td>
                  </tr>
                  <tr>
                    <td className="border border-black py-1.5 px-2 text-center">2</td>
                    <td className="border border-black py-1.5 px-3">Total Layanan Sirkulasi Peminjaman Buku</td>
                    <td className="border border-black py-1.5 px-3 text-right font-mono font-bold tabular-nums">
                      {recapSummary.totalTx}
                    </td>
                    <td className="border border-black py-1.5 px-3">Transaksi Peminjaman</td>
                  </tr>
                  <tr>
                    <td className="border border-black py-1.5 px-2 text-center">3</td>
                    <td className="border border-black py-1.5 px-3">Jumlah Pemustaka ASN yang Terlayani</td>
                    <td className="border border-black py-1.5 px-3 text-right font-mono font-bold tabular-nums">
                      {recapSummary.uniqueBorrowers}
                    </td>
                    <td className="border border-black py-1.5 px-3">Pegawai Unik</td>
                  </tr>
                  <tr>
                    <td className="border border-black py-1.5 px-2 text-center">4</td>
                    <td className="border border-black py-1.5 px-3">Penyelesaian Pengembalian & Tingkat Kepatuhan Waktu</td>
                    <td className="border border-black py-1.5 px-3 text-right font-mono font-bold tabular-nums">
                      {recapSummary.returnedCount} ({recapSummary.onTimeRate}%)
                    </td>
                    <td className="border border-black py-1.5 px-3">
                      {recapSummary.onTimeReturned} tepat waktu, {recapSummary.lateReturned} terlambat
                    </td>
                  </tr>
                  <tr>
                    <td className="border border-black py-1.5 px-2 text-center">5</td>
                    <td className="border border-black py-1.5 px-3">Peminjaman Masih Berjalan (Aktif)</td>
                    <td className="border border-black py-1.5 px-3 text-right font-mono font-bold tabular-nums">
                      {recapSummary.activeCount}
                    </td>
                    <td className="border border-black py-1.5 px-3">
                      {recapSummary.activeOverdue} melewati jatuh tempo
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* B. Rekapitulasi Partisipasi per Unit Kerja */}
            <div>
              <h3 className="font-bold mb-2">B. Rekapitulasi Sirkulasi per Unit Kerja / Bidang</h3>
              <table className="w-full border-collapse border border-black text-[11px]">
                <thead>
                  <tr className="bg-slate-100">
                    <th className="border border-black py-1.5 px-2 text-center w-8">No</th>
                    <th className="border border-black py-1.5 px-3 text-left">Unit Kerja / Bidang BKPSDM Kota Batu</th>
                    <th className="border border-black py-1.5 px-2 text-right">Pemustaka</th>
                    <th className="border border-black py-1.5 px-2 text-right">Total Pinjam</th>
                    <th className="border border-black py-1.5 px-2 text-right">Kembali</th>
                    <th className="border border-black py-1.5 px-2 text-right">Aktif</th>
                  </tr>
                </thead>
                <tbody>
                  {recapSummary.byUnit.map((row, idx) => (
                    <tr key={row.unit}>
                      <td className="border border-black py-1.5 px-2 text-center tabular-nums">{idx + 1}</td>
                      <td className="border border-black py-1.5 px-3">{row.unit}</td>
                      <td className="border border-black py-1.5 px-2 text-right font-mono tabular-nums">{row.borrowers}</td>
                      <td className="border border-black py-1.5 px-2 text-right font-mono font-bold tabular-nums">{row.total}</td>
                      <td className="border border-black py-1.5 px-2 text-right font-mono tabular-nums">{row.returned}</td>
                      <td className="border border-black py-1.5 px-2 text-right font-mono tabular-nums">{row.active}</td>
                    </tr>
                  ))}
                  <tr className="bg-slate-50 font-bold">
                    <td colSpan={2} className="border border-black py-1.5 px-3 text-right">
                      Jumlah Keseluruhan
                    </td>
                    <td className="border border-black py-1.5 px-2 text-right font-mono tabular-nums">
                      {recapSummary.uniqueBorrowers}
                    </td>
                    <td className="border border-black py-1.5 px-2 text-right font-mono tabular-nums">
                      {recapSummary.totalTx}
                    </td>
                    <td className="border border-black py-1.5 px-2 text-right font-mono tabular-nums">
                      {recapSummary.returnedCount}
                    </td>
                    <td className="border border-black py-1.5 px-2 text-right font-mono tabular-nums">
                      {recapSummary.activeCount}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* C. Sebaran Subjek Koleksi */}
            <div>
              <h3 className="font-bold mb-2">C. Distribusi Koleksi dan Keterbacaan per Subjek</h3>
              <table className="w-full border-collapse border border-black text-[11px]">
                <thead>
                  <tr className="bg-slate-100">
                    <th className="border border-black py-1.5 px-2 text-center w-8">No</th>
                    <th className="border border-black py-1.5 px-3 text-left">Kategori Subjek Koleksi</th>
                    <th className="border border-black py-1.5 px-2 text-right">Judul</th>
                    <th className="border border-black py-1.5 px-2 text-right">Eksemplar</th>
                    <th className="border border-black py-1.5 px-2 text-right">Frekuensi Pinjam</th>
                  </tr>
                </thead>
                <tbody>
                  {recapSummary.byCategory.map((row, idx) => (
                    <tr key={row.category}>
                      <td className="border border-black py-1.5 px-2 text-center tabular-nums">{idx + 1}</td>
                      <td className="border border-black py-1.5 px-3">{row.category}</td>
                      <td className="border border-black py-1.5 px-2 text-right font-mono tabular-nums">{row.titles}</td>
                      <td className="border border-black py-1.5 px-2 text-right font-mono tabular-nums">{row.copies}</td>
                      <td className="border border-black py-1.5 px-2 text-right font-mono font-bold tabular-nums">{row.loans}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Closing Statement */}
        <p className="mt-6 text-[11.5px] leading-relaxed text-justify">
          Demikian laporan rekapitulasi ini dibuat dengan sebenar-benarnya berdasarkan data operasional Pojok Baca Widya Pustaka BKPSDM Kota Batu untuk dipergunakan sebagaimana mestinya sebagai bukti dukung arsip dan penilaian kinerja.
        </p>

        {/* Official Dual Signature Block */}
        <div className="signature-block grid grid-cols-2 gap-10 mt-10 text-[12px] text-center">
          <div>
            <p className="invisible">Spacer</p>
            <p>Mengetahui,</p>
            <p className="font-semibold">{signatory.headTitle}</p>
            <div className="h-20" />
            <p className="font-bold underline">{signatory.headName}</p>
            <p className="text-[11px]">{signatory.headRank}</p>
            <p className="font-mono text-[11px]">NIP. {signatory.headNip}</p>
          </div>

          <div>
            <p>
              {signatory.city}, {formatTanggalLengkap(reportDate)}
            </p>
            <p>Dibuat oleh,</p>
            <p className="font-semibold">{signatory.librarianTitle}</p>
            <div className="h-20" />
            <p className="font-bold underline">{signatory.librarianName}</p>
            <p className="text-[11px]">{signatory.librarianRank}</p>
            <p className="font-mono text-[11px]">NIP. {signatory.librarianNip}</p>
          </div>
        </div>
      </article>
    </div>
  );
}

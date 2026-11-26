import { useMemo, useState } from 'react';
import {
  CalendarPlus,
  CheckCircle2,
  Download,
  Printer,
  Search,
  Trash2,
} from 'lucide-react';
import { LoanTransaction, UnitKerja } from '../types/library';
import { UNIT_KERJA_LIST } from '../data/seedData';
import {
  downloadTextFile,
  escapeCsvCell,
  formatTanggalSingkat,
  getLoanOverdueDays,
  getShortUnitKerja,
  getTodayIso,
  isLoanActiveOverdue,
} from '../utils/format';

type StatusFilter = 'semua' | 'dipinjam' | 'terlambat' | 'dikembalikan';

interface CirculationViewProps {
  loans: LoanTransaction[];
  onOpenNewLoan: () => void;
  onSelectReturn: (loan: LoanTransaction) => void;
  onExtendLoan: (loanId: string) => void;
  onViewReceipt: (loan: LoanTransaction) => void;
  onRequestDeleteLoan: (loan: LoanTransaction) => void;
}

export function CirculationView({
  loans,
  onOpenNewLoan,
  onSelectReturn,
  onExtendLoan,
  onViewReceipt,
  onRequestDeleteLoan,
}: CirculationViewProps) {
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('semua');
  const [unitFilter, setUnitFilter] = useState<'semua' | UnitKerja>('semua');
  const [searchQuery, setSearchQuery] = useState('');

  const counts = useMemo(() => {
    let dipinjam = 0;
    let terlambat = 0;
    let dikembalikan = 0;
    for (const loan of loans) {
      if (loan.status === 'Dipinjam') {
        dipinjam += 1;
        if (isLoanActiveOverdue(loan)) terlambat += 1;
      } else {
        dikembalikan += 1;
      }
    }
    return { semua: loans.length, dipinjam, terlambat, dikembalikan };
  }, [loans]);

  const filteredLoans = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return loans
      .filter((loan) => {
        if (statusFilter === 'dipinjam' && loan.status !== 'Dipinjam') return false;
        if (statusFilter === 'terlambat' && !isLoanActiveOverdue(loan)) return false;
        if (statusFilter === 'dikembalikan' && loan.status !== 'Dikembalikan') return false;
        if (unitFilter !== 'semua' && loan.unitKerja !== unitFilter) return false;
        if (q) {
          const hay = [
            loan.receiptNumber,
            loan.borrowerName,
            loan.borrowerNip,
            loan.bookTitleSnapshot,
            loan.bookCallNumberSnapshot,
            loan.unitKerja,
          ]
            .join(' ')
            .toLowerCase();
          if (!hay.includes(q)) return false;
        }
        return true;
      })
      .sort((a, b) => {
        if (a.status !== b.status) return a.status === 'Dipinjam' ? -1 : 1;
        return b.loanDate.localeCompare(a.loanDate);
      });
  }, [loans, statusFilter, unitFilter, searchQuery]);

  const handleExportCsv = () => {
    const headers = [
      'No. Bukti',
      'Nama Peminjam',
      'NIP',
      'Unit Kerja',
      'No. Telepon',
      'Kode DDC',
      'Judul Buku',
      'Tanggal Pinjam',
      'Batas Kembali',
      'Tanggal Kembali',
      'Status',
      'Keterlambatan (Hari)',
      'Kondisi Pinjam',
      'Kondisi Kembali',
      'Catatan',
    ];

    const rows = filteredLoans.map((l) => [
      l.receiptNumber,
      l.borrowerName,
      `'${l.borrowerNip}`,
      l.unitKerja,
      l.phone,
      l.bookCallNumberSnapshot,
      l.bookTitleSnapshot,
      l.loanDate,
      l.dueDate,
      l.returnDate ?? '',
      l.status,
      getLoanOverdueDays(l),
      l.conditionOut,
      l.conditionIn ?? '',
      [l.notes, l.returnNotes].filter(Boolean).join(' | '),
    ]);

    const csv =
      '\uFEFF' +
      [headers, ...rows]
        .map((row) => row.map(escapeCsvCell).join(','))
        .join('\n');

    downloadTextFile(
      `sirkulasi-widya-pustaka-${getTodayIso()}.csv`,
      csv,
      'text/csv;charset=utf-8'
    );
  };

  return (
    <div className="space-y-5">
      {/* Header Row */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-slate-900 tracking-tight">
            Sirkulasi Peminjaman & Pengembalian
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Kelola transaksi peminjaman aktif, perpanjangan masa pinjam, pengembalian, serta cetak tanda bukti layanan.
          </p>
        </div>

        <button
          type="button"
          onClick={handleExportCsv}
          className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Unduh CSV ({filteredLoans.length})</span>
        </button>
      </div>

      {/* Filter & Search Toolbar */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-3.5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          {/* Interactive Segmented Filter Tabs */}
          <div className="inline-flex flex-wrap items-center gap-1 p-1 bg-slate-100 rounded-lg self-start">
            {(
              [
                { id: 'semua', label: 'Semua', count: counts.semua },
                { id: 'dipinjam', label: 'Sedang Dipinjam', count: counts.dipinjam },
                { id: 'terlambat', label: 'Terlambat', count: counts.terlambat },
                { id: 'dikembalikan', label: 'Sudah Kembali', count: counts.dikembalikan },
              ] as const
            ).map((tab) => {
              const active = statusFilter === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setStatusFilter(tab.id)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap cursor-pointer ${
                    active
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {tab.label}{' '}
                  <span className="ml-1 font-mono text-[11px] text-slate-500 tabular-nums">
                    {tab.count}
                  </span>
                </button>
              );
            })}
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 flex-1 lg:max-w-xl justify-end">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari peminjam, NIP, judul buku, atau no. bukti..."
                className="w-full pl-9 pr-3.5 py-2 text-sm bg-slate-50 border border-slate-300 rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-none focus:bg-white focus:ring-2 focus:ring-[#0F5C4D]/25 focus:border-[#0F5C4D]"
              />
            </div>

            <select
              aria-label="Filter Unit Kerja"
              value={unitFilter}
              onChange={(e) => setUnitFilter(e.target.value as 'semua' | UnitKerja)}
              className="px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-lg text-slate-700 focus:outline-none focus:bg-white focus:ring-2 focus:ring-[#0F5C4D]/25 focus:border-[#0F5C4D]"
            >
              <option value="semua">Semua Unit Kerja</option>
              {UNIT_KERJA_LIST.map((unit) => (
                <option key={unit} value={unit}>
                  {getShortUnitKerja(unit)}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Circulation Table */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        {filteredLoans.length === 0 ? (
          <div className="px-6 py-14 text-center">
            <p className="text-sm font-medium text-slate-700">
              Tidak ditemukan data sirkulasi yang sesuai filter.
            </p>
            <p className="text-xs text-slate-500 mt-1">
              Ubah kata kunci pencarian, pilih kategori status lain, atau catat peminjaman buku baru.
            </p>
            <div className="mt-4 flex items-center justify-center gap-2.5">
              {(searchQuery || statusFilter !== 'semua' || unitFilter !== 'semua') && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery('');
                    setStatusFilter('semua');
                    setUnitFilter('semua');
                  }}
                  className="px-3.5 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-lg transition-colors"
                >
                  Atur Ulang Filter
                </button>
              )}
              <button
                type="button"
                onClick={onOpenNewLoan}
                className="px-4 py-2 text-xs font-medium text-white bg-[#0F5C4D] hover:bg-[#0B463B] rounded-lg transition-colors"
              >
                Catat Peminjaman Baru
              </button>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/75 text-xs font-semibold text-slate-600">
                  <th className="py-3 px-4 whitespace-nowrap">No. Bukti</th>
                  <th className="py-3 px-4">Peminjam & Bidang</th>
                  <th className="py-3 px-4">Koleksi Buku</th>
                  <th className="py-3 px-4 whitespace-nowrap">Tanggal Sirkulasi</th>
                  <th className="py-3 px-4 whitespace-nowrap">Status</th>
                  <th className="py-3 px-4 text-right whitespace-nowrap">Tindakan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 text-sm">
                {filteredLoans.map((loan) => {
                  const overdueDays = getLoanOverdueDays(loan);
                  const activeOverdue = isLoanActiveOverdue(loan);
                  return (
                    <tr
                      key={loan.id}
                      className="hover:bg-slate-50/80 transition-colors"
                    >
                      <td className="py-3.5 px-4 align-top whitespace-nowrap">
                        <span className="font-mono text-xs font-semibold text-slate-800 tabular-nums">
                          {loan.receiptNumber}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 align-top min-w-[190px]">
                        <p className="font-medium text-slate-900 leading-snug">
                          {loan.borrowerName}
                        </p>
                        <p className="text-xs font-mono text-slate-500 mt-0.5 tabular-nums">
                          {loan.borrowerNip}
                        </p>
                        <p className="text-xs text-slate-500 mt-0.5">
                          {getShortUnitKerja(loan.unitKerja)}
                        </p>
                      </td>

                      <td className="py-3.5 px-4 align-top min-w-[230px] max-w-[300px]">
                        <p className="text-slate-900 font-medium leading-snug line-clamp-2">
                          {loan.bookTitleSnapshot}
                        </p>
                        <p className="text-xs text-slate-500 mt-0.5">
                          <span className="font-mono">{loan.bookCallNumberSnapshot}</span> ·{' '}
                          {loan.bookCategorySnapshot}
                        </p>
                      </td>

                      <td className="py-3.5 px-4 align-top whitespace-nowrap text-xs tabular-nums">
                        <p className="text-slate-700">
                          Pinjam:{' '}
                          <span className="font-mono font-medium">
                            {formatTanggalSingkat(loan.loanDate)}
                          </span>
                        </p>
                        <p className="text-slate-500 mt-0.5">
                          Batas:{' '}
                          <span className="font-mono">
                            {formatTanggalSingkat(loan.dueDate)}
                          </span>
                          {loan.extendedCount > 0 && (
                            <span className="text-slate-400"> (+{loan.extendedCount}×)</span>
                          )}
                        </p>
                        {loan.returnDate && (
                          <p className="text-emerald-700 mt-0.5">
                            Kembali:{' '}
                            <span className="font-mono font-medium">
                              {formatTanggalSingkat(loan.returnDate)}
                            </span>
                          </p>
                        )}
                      </td>

                      <td className="py-3.5 px-4 align-top whitespace-nowrap text-xs">
                        {loan.status === 'Dikembalikan' ? (
                          <div>
                            <p className="font-semibold text-emerald-700">
                              Sudah Kembali
                            </p>
                            <p className="text-slate-500 mt-0.5 tabular-nums">
                              {overdueDays > 0
                                ? `Terlambat ${overdueDays} hr`
                                : 'Tepat waktu'}
                              {loan.conditionIn ? ` · ${loan.conditionIn}` : ''}
                            </p>
                          </div>
                        ) : activeOverdue ? (
                          <div>
                            <p className="font-semibold text-red-700 tabular-nums">
                              Terlambat {overdueDays} Hari
                            </p>
                            <p className="text-slate-500 mt-0.5">
                              Belum dikembalikan
                            </p>
                          </div>
                        ) : (
                          <div>
                            <p className="font-semibold text-amber-700">
                              Sedang Dipinjam
                            </p>
                            <p className="text-slate-500 mt-0.5">
                              Dalam masa pinjam
                            </p>
                          </div>
                        )}
                      </td>

                      <td className="py-3.5 px-4 align-top text-right whitespace-nowrap">
                        <div className="inline-flex items-center justify-end gap-1.5">
                          {loan.status === 'Dipinjam' && (
                            <>
                              <button
                                type="button"
                                onClick={() => onSelectReturn(loan)}
                                title="Proses Pengembalian Buku"
                                className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-[#0F5C4D] bg-white border border-[#0F5C4D]/35 hover:bg-[#0F5C4D] hover:text-white rounded-md transition-colors cursor-pointer"
                              >
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                <span>Kembalikan</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => onExtendLoan(loan.id)}
                                title="Perpanjang batas kembali +7 hari"
                                className="p-1.5 text-slate-500 hover:text-[#0F5C4D] hover:bg-slate-100 rounded-md transition-colors cursor-pointer"
                              >
                                <CalendarPlus className="w-4 h-4" />
                              </button>
                            </>
                          )}
                          <button
                            type="button"
                            onClick={() => onViewReceipt(loan)}
                            title="Cetak Bukti Layanan"
                            className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-md transition-colors cursor-pointer"
                          >
                            <Printer className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => onRequestDeleteLoan(loan)}
                            title="Hapus Riwayat Transaksi"
                            className="p-1.5 text-slate-400 hover:text-red-700 hover:bg-red-50 rounded-md transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

import { useMemo } from 'react';
import {
  ArrowRight,
  CheckCircle2,
  Clock,
  FileText,
  Plus,
} from 'lucide-react';
import { ActiveTab, BookItem, LoanTransaction } from '../types/library';
import { LIBRARY_ASSETS } from '../data/seedData';
import {
  formatTanggalSingkat,
  getLoanOverdueDays,
  getShortUnitKerja,
  isLoanActiveOverdue,
} from '../utils/format';
import { SafeImage } from '../components/SafeImage';

interface OverviewViewProps {
  books: BookItem[];
  loans: LoanTransaction[];
  getAvailableCopies: (bookId: string) => number;
  onNavigate: (tab: ActiveTab) => void;
  onOpenNewLoan: (bookId?: string) => void;
  onSelectReturn: (loan: LoanTransaction) => void;
}

export function OverviewView({
  books,
  loans,
  getAvailableCopies,
  onNavigate,
  onOpenNewLoan,
  onSelectReturn,
}: OverviewViewProps) {
  const stats = useMemo(() => {
    const totalTitles = books.length;
    const totalCopies = books.reduce((sum, b) => sum + b.totalCopies, 0);
    const activeLoans = loans.filter((l) => l.status === 'Dipinjam');
    const overdueLoans = activeLoans.filter((l) => isLoanActiveOverdue(l));
    const returnedLoans = loans.filter((l) => l.status === 'Dikembalikan');
    const returnedOnTime = returnedLoans.filter((l) => getLoanOverdueDays(l) === 0).length;
    const onTimeRate =
      returnedLoans.length > 0
        ? Math.round((returnedOnTime / returnedLoans.length) * 100)
        : 100;

    return {
      totalTitles,
      totalCopies,
      activeLoansCount: activeLoans.length,
      overdueCount: overdueLoans.length,
      totalLoansCount: loans.length,
      returnedCount: returnedLoans.length,
      onTimeRate,
      activeLoansSorted: [...activeLoans].sort((a, b) =>
        a.dueDate.localeCompare(b.dueDate)
      ),
    };
  }, [books, loans]);

  const popularBooks = useMemo(() => {
    const freq: Record<string, number> = {};
    for (const loan of loans) {
      freq[loan.bookId] = (freq[loan.bookId] ?? 0) + 1;
    }
    return [...books]
      .sort((a, b) => (freq[b.id] ?? 0) - (freq[a.id] ?? 0))
      .slice(0, 5)
      .map((book) => ({
        book,
        loanCount: freq[book.id] ?? 0,
        available: getAvailableCopies(book.id),
      }));
  }, [books, loans, getAvailableCopies]);

  return (
    <div className="space-y-6">
      {/* Editorial Hero Banner — Single Focal Anchor */}
      <section className="relative overflow-hidden rounded-xl border border-slate-200 bg-slate-900 min-h-[220px] sm:min-h-[250px] flex items-end">
        <SafeImage
          src={LIBRARY_ASSETS.heroBanner}
          alt="Ruang Pojok Baca Widya Pustaka BKPSDM Kota Batu"
          className="absolute inset-0 w-full h-full object-cover object-center"
        />
        <div
          className="absolute inset-0 bg-gradient-to-r from-slate-950/90 via-slate-950/70 to-slate-950/25"
          aria-hidden="true"
        />
        <div className="relative z-10 w-full p-6 sm:p-8 flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6">
          <div className="max-w-2xl">
            <p className="text-xs font-medium text-emerald-200 tracking-wide">
              BKPSDM Kota Batu · Balai Kota Among Tani
            </p>
            <h1 className="mt-2 font-display text-2xl sm:text-3xl font-bold text-white tracking-tight [text-wrap:balance]">
              Pojok Baca Widya Pustaka
            </h1>
            <p className="mt-2 text-sm text-slate-200 leading-relaxed max-w-xl">
              Sistem layanan sirkulasi buku digital, katalog koleksi referensi kepegawaian, dan penyusunan bukti dukung kinerja perpustakaan SKPD untuk arsip SKP, DUPAK, dan SAKIP.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <button
              type="button"
              onClick={() => onNavigate('laporan')}
              className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-slate-900 bg-white hover:bg-slate-100 rounded-lg transition-colors whitespace-nowrap cursor-pointer"
            >
              <FileText className="w-4 h-4 text-[#0F5C4D]" />
              <span>Cetak Bukti Dukung</span>
            </button>
          </div>
        </div>
      </section>

      {/* 4-Column Flat KPI Strip */}
      <section aria-label="Ringkasan Data Perpustakaan">
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 bg-white border border-slate-200 rounded-xl divide-y sm:divide-y-0 sm:divide-x divide-slate-200 overflow-hidden">
          <div className="p-5">
            <p className="text-xs font-medium text-slate-500">Koleksi Terdaftar</p>
            <p className="mt-2 font-display text-2xl font-bold text-slate-900 tabular-nums">
              {stats.totalTitles} <span className="text-sm font-normal text-slate-500">judul</span>
            </p>
            <p className="mt-1 text-xs text-slate-500 tabular-nums">
              Total {stats.totalCopies} eksemplar fisik
            </p>
          </div>

          <div className="p-5">
            <p className="text-xs font-medium text-slate-500">Sedang Dipinjam</p>
            <p className="mt-2 font-display text-2xl font-bold text-slate-900 tabular-nums">
              {stats.activeLoansCount}{' '}
              <span className="text-sm font-normal text-slate-500">eksemplar</span>
            </p>
            <p className="mt-1 text-xs text-slate-500 tabular-nums">
              {stats.totalCopies - stats.activeLoansCount} eksemplar tersedia di rak
            </p>
          </div>

          <div className="p-5">
            <p className="text-xs font-medium text-slate-500">Total Sirkulasi Tercatat</p>
            <p className="mt-2 font-display text-2xl font-bold text-slate-900 tabular-nums">
              {stats.totalLoansCount}{' '}
              <span className="text-sm font-normal text-slate-500">transaksi</span>
            </p>
            <p className="mt-1 text-xs text-slate-500 tabular-nums">
              {stats.returnedCount} selesai · {stats.onTimeRate}% tepat waktu
            </p>
          </div>

          <div className="p-5">
            <p className="text-xs font-medium text-slate-500">Perlu Tindak Lanjut</p>
            <p
              className={`mt-2 font-display text-2xl font-bold tabular-nums ${
                stats.overdueCount > 0 ? 'text-red-700' : 'text-emerald-700'
              }`}
            >
              {stats.overdueCount}{' '}
              <span className="text-sm font-normal text-slate-500">terlambat</span>
            </p>
            <p className="mt-1 text-xs text-slate-500">
              {stats.overdueCount > 0
                ? 'Melewati batas tanggal pengembalian'
                : 'Seluruh pinjaman dalam masa tenggang'}
            </p>
          </div>
        </div>
      </section>

      {/* Main Operational Split: Active Loans + Popular Books */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
        {/* Left 8 Cols: Pinjaman Aktif */}
        <section className="xl:col-span-8 bg-white border border-slate-200 rounded-xl overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between gap-4">
            <div>
              <h2 className="font-display text-base font-bold text-slate-900">
                Peminjaman Aktif & Jatuh Tempo
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Daftar buku yang sedang beredar di lingkungan unit kerja BKPSDM Kota Batu
              </p>
            </div>
            <button
              type="button"
              onClick={() => onNavigate('sirkulasi')}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#0F5C4D] hover:text-[#0B463B] whitespace-nowrap shrink-0 cursor-pointer"
            >
              <span>Lihat Semua</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {stats.activeLoansSorted.length === 0 ? (
            <div className="px-6 py-12 text-center">
              <p className="text-sm font-medium text-slate-700">
                Tidak ada peminjaman yang sedang berlangsung.
              </p>
              <p className="text-xs text-slate-500 mt-1">
                Seluruh koleksi saat ini berada di rak Pojok Baca Widya Pustaka.
              </p>
              <button
                type="button"
                onClick={() => onOpenNewLoan()}
                className="mt-4 inline-flex items-center gap-2 px-4 py-2 text-xs font-medium text-white bg-[#0F5C4D] hover:bg-[#0B463B] rounded-lg transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Catat Peminjaman Pertama</span>
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50/70 text-xs font-semibold text-slate-600">
                    <th className="py-3 px-5">Peminjam & Unit Kerja</th>
                    <th className="py-3 px-4">Judul Buku</th>
                    <th className="py-3 px-4 whitespace-nowrap">Batas Kembali</th>
                    <th className="py-3 px-5 text-right whitespace-nowrap">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 text-sm">
                  {stats.activeLoansSorted.slice(0, 6).map((loan) => {
                    const overdueDays = getLoanOverdueDays(loan);
                    return (
                      <tr
                        key={loan.id}
                        className="hover:bg-slate-50/80 transition-colors"
                      >
                        <td className="py-3.5 px-5 align-top">
                          <p className="font-medium text-slate-900 leading-snug">
                            {loan.borrowerName}
                          </p>
                          <p className="text-xs text-slate-500 mt-0.5">
                            {getShortUnitKerja(loan.unitKerja)} ·{' '}
                            <span className="font-mono">{loan.receiptNumber}</span>
                          </p>
                        </td>
                        <td className="py-3.5 px-4 align-top max-w-[260px]">
                          <p className="text-slate-800 leading-snug line-clamp-2">
                            {loan.bookTitleSnapshot}
                          </p>
                          <p className="text-xs font-mono text-slate-500 mt-0.5">
                            {loan.bookCallNumberSnapshot}
                          </p>
                        </td>
                        <td className="py-3.5 px-4 align-top whitespace-nowrap">
                          <p className="font-mono text-xs font-medium text-slate-800 tabular-nums">
                            {formatTanggalSingkat(loan.dueDate)}
                          </p>
                          <p
                            className={`mt-0.5 inline-flex items-center gap-1 text-xs font-medium tabular-nums ${
                              overdueDays > 0 ? 'text-red-700' : 'text-amber-700'
                            }`}
                          >
                            <Clock className="w-3 h-3 shrink-0" />
                            <span>
                              {overdueDays > 0
                                ? `Terlambat ${overdueDays} hr`
                                : 'Sedang dipinjam'}
                            </span>
                          </p>
                        </td>
                        <td className="py-3.5 px-5 align-top text-right whitespace-nowrap">
                          <button
                            type="button"
                            onClick={() => onSelectReturn(loan)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-[#0F5C4D] bg-white border border-[#0F5C4D]/35 hover:bg-[#0F5C4D] hover:text-white rounded-md transition-colors cursor-pointer"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Kembalikan</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* Right 4 Cols: Koleksi Sering Dimanfaatkan */}
        <section className="xl:col-span-4 bg-white border border-slate-200 rounded-xl overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between gap-3">
            <div>
              <h2 className="font-display text-base font-bold text-slate-900">
                Referensi Paling Diminati
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Berdasarkan frekuensi sirkulasi tercatat
              </p>
            </div>
            <button
              type="button"
              onClick={() => onNavigate('katalog')}
              className="text-xs font-semibold text-[#0F5C4D] hover:text-[#0B463B] whitespace-nowrap cursor-pointer"
            >
              Katalog
            </button>
          </div>

          <div className="divide-y divide-slate-200">
            {popularBooks.map(({ book, loanCount, available }, index) => (
              <div
                key={book.id}
                className="px-5 py-3.5 flex items-start justify-between gap-3 hover:bg-slate-50/70 transition-colors"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2 text-xs text-slate-500">
                    <span className="font-mono font-semibold text-slate-400 tabular-nums">
                      0{index + 1}.
                    </span>
                    <span className="truncate">{book.category}</span>
                    <span aria-hidden="true">·</span>
                    <span className="font-mono tabular-nums whitespace-nowrap">
                      {loanCount}× pinjam
                    </span>
                  </div>
                  <p className="mt-1 text-sm font-medium text-slate-900 leading-snug line-clamp-2">
                    {book.title}
                  </p>
                  <p className="mt-1 text-xs text-slate-500 tabular-nums">
                    {book.shelfLocation} ·{' '}
                    <span className={available > 0 ? 'text-emerald-700 font-medium' : 'text-red-700 font-medium'}>
                      {available > 0 ? `Tersedia ${available}/${book.totalCopies} eks` : 'Dipinjam habis'}
                    </span>
                  </p>
                </div>

                {available > 0 && (
                  <button
                    type="button"
                    onClick={() => onOpenNewLoan(book.id)}
                    className="shrink-0 px-2.5 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-[#0F5C4D] hover:text-white rounded-md transition-colors whitespace-nowrap cursor-pointer"
                  >
                    Pinjam
                  </button>
                )}
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}

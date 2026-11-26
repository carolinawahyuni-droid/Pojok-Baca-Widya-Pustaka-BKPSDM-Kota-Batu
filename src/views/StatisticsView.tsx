import { useMemo, useState } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { BookItem, LoanTransaction } from '../types/library';
import { BOOK_CATEGORIES, UNIT_KERJA_LIST } from '../data/seedData';
import {
  getLoanDurationDays,
  getLoanOverdueDays,
  getMonthLabel,
  getShortUnitKerja,
} from '../utils/format';

interface StatisticsViewProps {
  books: BookItem[];
  loans: LoanTransaction[];
}

export function StatisticsView({ books, loans }: StatisticsViewProps) {
  const availableYears = useMemo(() => {
    const years = new Set<string>();
    for (const loan of loans) {
      if (loan.loanDate.length >= 4) {
        years.add(loan.loanDate.slice(0, 4));
      }
    }
    return Array.from(years).sort((a, b) => b.localeCompare(a));
  }, [loans]);

  const [selectedYear, setSelectedYear] = useState<string>('semua');

  const scopedLoans = useMemo(() => {
    if (selectedYear === 'semua') return loans;
    return loans.filter((l) => l.loanDate.startsWith(selectedYear));
  }, [loans, selectedYear]);

  const metrics = useMemo(() => {
    const totalLoans = scopedLoans.length;
    const returned = scopedLoans.filter((l) => l.status === 'Dikembalikan');
    const onTimeReturned = returned.filter((l) => getLoanOverdueDays(l) === 0).length;
    const onTimePercent =
      returned.length > 0 ? Math.round((onTimeReturned / returned.length) * 100) : 100;

    const uniqueBooksBorrowed = new Set(scopedLoans.map((l) => l.bookId)).size;
    const utilizationPercent =
      books.length > 0 ? Math.round((uniqueBooksBorrowed / books.length) * 100) : 0;

    const avgDuration =
      returned.length > 0
        ? (
            returned.reduce((sum, l) => sum + getLoanDurationDays(l), 0) /
            returned.length
          ).toFixed(1)
        : '0.0';

    const uniqueBorrowers = new Set(
      scopedLoans.map((l) => l.borrowerNip.trim() || l.borrowerName.trim())
    ).size;

    return {
      totalLoans,
      returnedCount: returned.length,
      onTimePercent,
      utilizationPercent,
      uniqueBooksBorrowed,
      avgDuration,
      uniqueBorrowers,
    };
  }, [scopedLoans, books]);

  const monthlySeries = useMemo(() => {
    const map = new Map<string, { monthKey: string; label: string; pinjam: number; kembali: number }>();

    for (const loan of scopedLoans) {
      const mPinjam = loan.loanDate.slice(0, 7);
      if (!map.has(mPinjam)) {
        map.set(mPinjam, {
          monthKey: mPinjam,
          label: getMonthLabel(mPinjam),
          pinjam: 0,
          kembali: 0,
        });
      }
      map.get(mPinjam)!.pinjam += 1;

      if (loan.returnDate) {
        const mKembali = loan.returnDate.slice(0, 7);
        if (!map.has(mKembali)) {
          map.set(mKembali, {
            monthKey: mKembali,
            label: getMonthLabel(mKembali),
            pinjam: 0,
            kembali: 0,
          });
        }
        map.get(mKembali)!.kembali += 1;
      }
    }

    return Array.from(map.values()).sort((a, b) => a.monthKey.localeCompare(b.monthKey));
  }, [scopedLoans]);

  const unitDistribution = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const unit of UNIT_KERJA_LIST) {
      counts[unit] = 0;
    }
    for (const loan of scopedLoans) {
      counts[loan.unitKerja] = (counts[loan.unitKerja] ?? 0) + 1;
    }
    return UNIT_KERJA_LIST.map((unit) => ({
      unit: getShortUnitKerja(unit),
      fullUnit: unit,
      transaksi: counts[unit] ?? 0,
    })).sort((a, b) => b.transaksi - a.transaksi);
  }, [scopedLoans]);

  const categoryBreakdown = useMemo(() => {
    return BOOK_CATEGORIES.map((category) => {
      const titles = books.filter((b) => b.category === category).length;
      const copies = books
        .filter((b) => b.category === category)
        .reduce((s, b) => s + b.totalCopies, 0);
      const loansCount = scopedLoans.filter(
        (l) => l.bookCategorySnapshot === category
      ).length;
      return {
        category,
        titles,
        copies,
        loansCount,
      };
    }).sort((a, b) => b.loansCount - a.loansCount || b.copies - a.copies);
  }, [books, scopedLoans]);

  const topBorrowers = useMemo(() => {
    const map = new Map<
      string,
      { name: string; nip: string; unit: string; total: number; onTime: number; returned: number }
    >();
    for (const loan of scopedLoans) {
      const key = loan.borrowerNip || loan.borrowerName;
      if (!map.has(key)) {
        map.set(key, {
          name: loan.borrowerName,
          nip: loan.borrowerNip,
          unit: getShortUnitKerja(loan.unitKerja),
          total: 0,
          onTime: 0,
          returned: 0,
        });
      }
      const entry = map.get(key)!;
      entry.total += 1;
      if (loan.status === 'Dikembalikan') {
        entry.returned += 1;
        if (getLoanOverdueDays(loan) === 0) entry.onTime += 1;
      }
    }
    return Array.from(map.values())
      .sort((a, b) => b.total - a.total)
      .slice(0, 6);
  }, [scopedLoans]);

  const topBooks = useMemo(() => {
    const map = new Map<string, { title: string; callNumber: string; category: string; count: number }>();
    for (const loan of scopedLoans) {
      const key = loan.bookId;
      if (!map.has(key)) {
        map.set(key, {
          title: loan.bookTitleSnapshot,
          callNumber: loan.bookCallNumberSnapshot,
          category: loan.bookCategorySnapshot,
          count: 0,
        });
      }
      map.get(key)!.count += 1;
    }
    return Array.from(map.values())
      .sort((a, b) => b.count - a.count)
      .slice(0, 6);
  }, [scopedLoans]);

  return (
    <div className="space-y-6">
      {/* Header & Year Filter */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-slate-900 tracking-tight">
            Statistik Layanan & Sirkulasi
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Analisis pemanfaatan koleksi, partisipasi unit kerja, dan ketepatan waktu pengembalian Pojok Baca Widya Pustaka.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <label htmlFor="stats-year-select" className="text-xs font-medium text-slate-600 whitespace-nowrap">
            Periode Tahun:
          </label>
          <select
            id="stats-year-select"
            value={selectedYear}
            onChange={(e) => setSelectedYear(e.target.value)}
            className="px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#0F5C4D]/25 focus:border-[#0F5C4D]"
          >
            <option value="semua">Semua Tahun</option>
            {availableYears.map((yr) => (
              <option key={yr} value={yr}>
                Tahun {yr}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* 4-Column Flat Analytical KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 bg-white border border-slate-200 rounded-xl divide-y sm:divide-y-0 sm:divide-x divide-slate-200 overflow-hidden">
        <div className="p-5">
          <p className="text-xs font-medium text-slate-500">Volume Peminjaman</p>
          <p className="mt-2 font-display text-2xl font-bold text-slate-900 tabular-nums">
            {metrics.totalLoans} <span className="text-sm font-normal text-slate-500">transaksi</span>
          </p>
          <p className="mt-1 text-xs text-slate-500 tabular-nums">
            Melayani {metrics.uniqueBorrowers} pegawai ASN aktif
          </p>
        </div>

        <div className="p-5">
          <p className="text-xs font-medium text-slate-500">Ketepatan Pengembalian</p>
          <p className="mt-2 font-display text-2xl font-bold text-emerald-700 tabular-nums">
            {metrics.onTimePercent}%
          </p>
          <p className="mt-1 text-xs text-slate-500 tabular-nums">
            Dari {metrics.returnedCount} buku yang telah dikembalikan
          </p>
        </div>

        <div className="p-5">
          <p className="text-xs font-medium text-slate-500">Rasio Pemanfaatan Koleksi</p>
          <p className="mt-2 font-display text-2xl font-bold text-slate-900 tabular-nums">
            {metrics.utilizationPercent}%
          </p>
          <p className="mt-1 text-xs text-slate-500 tabular-nums">
            {metrics.uniqueBooksBorrowed} dari {books.length} judul telah dipinjam
          </p>
        </div>

        <div className="p-5">
          <p className="text-xs font-medium text-slate-500">Rata-rata Lama Pinjam</p>
          <p className="mt-2 font-display text-2xl font-bold text-slate-900 tabular-nums">
            {metrics.avgDuration} <span className="text-sm font-normal text-slate-500">hari</span>
          </p>
          <p className="mt-1 text-xs text-slate-500">
            Standar masa pinjam reguler 7 hari
          </p>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Monthly Circulation Trend */}
        <section className="lg:col-span-7 bg-white border border-slate-200 rounded-xl p-5">
          <div className="mb-4">
            <h2 className="font-display text-base font-bold text-slate-900">
              Tren Sirkulasi Bulanan
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Perbandingan jumlah buku dipinjam dan dikembalikan per bulan
            </p>
          </div>
          {monthlySeries.length === 0 ? (
            <div className="h-[260px] flex items-center justify-center text-sm text-slate-500">
              Belum ada data sirkulasi pada periode yang dipilih.
            </div>
          ) : (
            <div className="h-[260px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlySeries} margin={{ top: 8, right: 12, left: -18, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" vertical={false} />
                  <XAxis
                    dataKey="label"
                    tick={{ fontSize: 12, fill: '#475569' }}
                    axisLine={{ stroke: '#CBD5E1' }}
                    tickLine={false}
                  />
                  <YAxis
                    allowDecimals={false}
                    tick={{ fontSize: 12, fill: '#475569' }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#FFFFFF',
                      borderColor: '#E2E8F0',
                      borderRadius: '8px',
                      fontSize: '12px',
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '8px' }} />
                  <Bar
                    dataKey="pinjam"
                    name="Peminjaman"
                    fill="#0F5C4D"
                    radius={[4, 4, 0, 0]}
                    maxBarSize={34}
                  />
                  <Bar
                    dataKey="kembali"
                    name="Pengembalian"
                    fill="#94A3B8"
                    radius={[4, 4, 0, 0]}
                    maxBarSize={34}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </section>

        {/* Unit Kerja Participation */}
        <section className="lg:col-span-5 bg-white border border-slate-200 rounded-xl p-5">
          <div className="mb-4">
            <h2 className="font-display text-base font-bold text-slate-900">
              Sirkulasi per Unit Kerja
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Distribusi frekuensi peminjaman antar bidang di BKPSDM Kota Batu
            </p>
          </div>
          <div className="h-[260px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={unitDistribution}
                layout="vertical"
                margin={{ top: 4, right: 16, left: 10, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" horizontal={false} />
                <XAxis
                  type="number"
                  allowDecimals={false}
                  tick={{ fontSize: 11, fill: '#475569' }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  type="category"
                  dataKey="unit"
                  width={126}
                  tick={{ fontSize: 11, fill: '#334155' }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  formatter={(value) => [`${value} transaksi`, 'Jumlah']}
                  contentStyle={{
                    backgroundColor: '#FFFFFF',
                    borderColor: '#E2E8F0',
                    borderRadius: '8px',
                    fontSize: '12px',
                  }}
                />
                <Bar dataKey="transaksi" radius={[0, 4, 4, 0]} maxBarSize={22}>
                  {unitDistribution.map((_, index) => (
                    <Cell
                      key={`unit-bar-${index}`}
                      fill={index === 0 ? '#0F5C4D' : index === 1 ? '#2A7B6A' : '#64748B'}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>
      </div>

      {/* Category Utilization Matrix */}
      <section className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-200">
          <h2 className="font-display text-base font-bold text-slate-900">
            Komposisi Koleksi & Sirkulasi Berdasarkan Subjek
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Pemetaan ketersediaan judul dan eksemplar terhadap tingkat keterbacaan tiap kategori
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/75 text-xs font-semibold text-slate-600">
                <th className="py-3 px-5">Kategori Subjek</th>
                <th className="py-3 px-4 text-right">Judul</th>
                <th className="py-3 px-4 text-right">Eksemplar</th>
                <th className="py-3 px-4 text-right">Total Pinjam</th>
                <th className="py-3 px-5 w-48">Proporsi Sirkulasi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 text-sm">
              {categoryBreakdown.map((row) => {
                const share =
                  metrics.totalLoans > 0
                    ? Math.round((row.loansCount / metrics.totalLoans) * 100)
                    : 0;
                return (
                  <tr key={row.category} className="hover:bg-slate-50/70">
                    <td className="py-3 px-5 font-medium text-slate-800">{row.category}</td>
                    <td className="py-3 px-4 text-right font-mono text-xs text-slate-700 tabular-nums">
                      {row.titles}
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-xs text-slate-700 tabular-nums">
                      {row.copies}
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-xs font-semibold text-slate-900 tabular-nums">
                      {row.loansCount}
                    </td>
                    <td className="py-3 px-5">
                      <div className="flex items-center gap-3">
                        <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-[#0F5C4D] rounded-full"
                            style={{ width: `${share}%` }}
                          />
                        </div>
                        <span className="font-mono text-xs text-slate-600 w-9 text-right tabular-nums">
                          {share}%
                        </span>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      {/* Ranked Leaderboards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <section className="bg-white border border-slate-200 rounded-xl overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-200">
            <h2 className="font-display text-base font-bold text-slate-900">
              Koleksi Paling Sering Dipinjam
            </h2>
          </div>
          {topBooks.length === 0 ? (
            <p className="p-6 text-sm text-slate-500 text-center">Belum ada transaksi tercatat.</p>
          ) : (
            <div className="divide-y divide-slate-200">
              {topBooks.map((item, idx) => (
                <div key={item.title} className="px-5 py-3.5 flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <p className="text-xs text-slate-500">
                      <span className="font-mono font-semibold text-slate-400">0{idx + 1}.</span>{' '}
                      <span className="font-mono">{item.callNumber}</span> · {item.category}
                    </p>
                    <p className="mt-0.5 text-sm font-medium text-slate-900 line-clamp-2">
                      {item.title}
                    </p>
                  </div>
                  <span className="font-mono text-xs font-semibold text-[#0F5C4D] whitespace-nowrap tabular-nums pt-1">
                    {item.count}× pinjam
                  </span>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="bg-white border border-slate-200 rounded-xl overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-200">
            <h2 className="font-display text-base font-bold text-slate-900">
              Pemustaka ASN Paling Aktif
            </h2>
          </div>
          {topBorrowers.length === 0 ? (
            <p className="p-6 text-sm text-slate-500 text-center">Belum ada pemustaka tercatat.</p>
          ) : (
            <div className="divide-y divide-slate-200">
              {topBorrowers.map((person, idx) => (
                <div key={person.nip || person.name} className="px-5 py-3.5 flex items-center justify-between gap-4">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-slate-900 truncate">
                      <span className="font-mono text-xs text-slate-400 mr-2">0{idx + 1}.</span>
                      {person.name}
                    </p>
                    <p className="text-xs text-slate-500 mt-0.5 truncate">
                      {person.unit} · <span className="font-mono">{person.nip}</span>
                    </p>
                  </div>
                  <div className="text-right shrink-0 tabular-nums">
                    <p className="font-mono text-xs font-semibold text-slate-900">
                      {person.total} transaksi
                    </p>
                    <p className="text-[11px] text-slate-500">
                      {person.returned > 0
                        ? `${person.onTime}/${person.returned} tepat waktu`
                        : 'Sedang meminjam'}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

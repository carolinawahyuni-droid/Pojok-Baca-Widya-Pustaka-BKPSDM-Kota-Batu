import { useMemo, useState } from 'react';
import {
  BookPlus,
  Pencil,
  Search,
  Trash2,
} from 'lucide-react';
import { BookCategory, BookItem } from '../types/library';
import { BOOK_CATEGORIES, LIBRARY_ASSETS } from '../data/seedData';
import { SafeImage } from '../components/SafeImage';

type AvailabilityFilter = 'semua' | 'tersedia' | 'dipinjam_habis';

interface CatalogViewProps {
  books: BookItem[];
  getAvailableCopies: (bookId: string) => number;
  onAddBook: () => void;
  onEditBook: (book: BookItem) => void;
  onRequestDeleteBook: (book: BookItem) => void;
  onBorrowBook: (bookId: string) => void;
}

export function CatalogView({
  books,
  getAvailableCopies,
  onAddBook,
  onEditBook,
  onRequestDeleteBook,
  onBorrowBook,
}: CatalogViewProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<'semua' | BookCategory>('semua');
  const [availabilityFilter, setAvailabilityFilter] = useState<AvailabilityFilter>('semua');

  const summary = useMemo(() => {
    let totalCopies = 0;
    let availableCopies = 0;
    for (const book of books) {
      totalCopies += book.totalCopies;
      availableCopies += getAvailableCopies(book.id);
    }
    return { totalTitles: books.length, totalCopies, availableCopies };
  }, [books, getAvailableCopies]);

  const filteredBooks = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return books.filter((book) => {
      const available = getAvailableCopies(book.id);
      if (categoryFilter !== 'semua' && book.category !== categoryFilter) return false;
      if (availabilityFilter === 'tersedia' && available <= 0) return false;
      if (availabilityFilter === 'dipinjam_habis' && available > 0) return false;
      if (q) {
        const hay = [
          book.title,
          book.author,
          book.publisher,
          book.callNumber,
          book.inventoryCode,
          book.isbn,
          book.shelfLocation,
          book.category,
        ]
          .join(' ')
          .toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [books, searchQuery, categoryFilter, availabilityFilter, getAvailableCopies]);

  return (
    <div className="space-y-5">
      {/* Catalog Editorial Header Strip */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden grid grid-cols-1 lg:grid-cols-12 items-stretch">
        <div className="lg:col-span-8 p-6 flex flex-col justify-between gap-4">
          <div>
            <h1 className="font-display text-2xl font-bold text-slate-900 tracking-tight">
              Katalog Koleksi Bahan Pustaka
            </h1>
            <p className="text-sm text-slate-500 mt-1 max-w-2xl leading-relaxed">
              Basis data terstruktur koleksi buku referensi manajemen ASN, regulasi pemerintahan daerah, pengembangan kompetensi, serta literasi umum Pojok Baca Widya Pustaka.
            </p>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-4 pt-2 border-t border-slate-100">
            <div className="flex flex-wrap items-center gap-x-5 gap-y-1 text-xs text-slate-600 tabular-nums">
              <span>
                <strong className="font-mono text-slate-900">{summary.totalTitles}</strong> Judul
              </span>
              <span aria-hidden="true" className="text-slate-300">·</span>
              <span>
                <strong className="font-mono text-slate-900">{summary.totalCopies}</strong> Eksemplar Total
              </span>
              <span aria-hidden="true" className="text-slate-300">·</span>
              <span>
                <strong className="font-mono text-emerald-700">{summary.availableCopies}</strong> Tersedia di Rak
              </span>
            </div>

            <button
              type="button"
              onClick={onAddBook}
              className="inline-flex items-center gap-2 px-4 py-2 text-xs font-medium text-white bg-[#0F5C4D] hover:bg-[#0B463B] rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              <BookPlus className="w-4 h-4" />
              <span>Tambah Koleksi</span>
            </button>
          </div>
        </div>
        <div className="hidden lg:block lg:col-span-4 relative min-h-[168px]">
          <SafeImage
            src={LIBRARY_ASSETS.catalogCover}
            alt="Tumpukan buku referensi kepegawaian di meja Pojok Baca"
            className="w-full h-full object-cover"
          />
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        <div className="inline-flex items-center gap-1 p-1 bg-slate-100 rounded-lg self-start">
          {(
            [
              { id: 'semua', label: 'Semua' },
              { id: 'tersedia', label: 'Tersedia' },
              { id: 'dipinjam_habis', label: 'Dipinjam Habis' },
            ] as const
          ).map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setAvailabilityFilter(item.id)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap cursor-pointer ${
                availabilityFilter === item.id
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 flex-1 lg:max-w-xl justify-end">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari judul, pengarang, kode DDC, ISBN, atau rak..."
              className="w-full pl-9 pr-3.5 py-2 text-sm bg-slate-50 border border-slate-300 rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-none focus:bg-white focus:ring-2 focus:ring-[#0F5C4D]/25 focus:border-[#0F5C4D]"
            />
          </div>

          <select
            aria-label="Filter Kategori Subjek"
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value as 'semua' | BookCategory)}
            className="px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-lg text-slate-700 focus:outline-none focus:bg-white focus:ring-2 focus:ring-[#0F5C4D]/25 focus:border-[#0F5C4D]"
          >
            <option value="semua">Semua Subjek</option>
            {BOOK_CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Catalog Data Table */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        {filteredBooks.length === 0 ? (
          <div className="px-6 py-14 text-center">
            <p className="text-sm font-medium text-slate-700">
              Tidak ada koleksi buku yang cocok dengan pencarian Anda.
            </p>
            <p className="text-xs text-slate-500 mt-1">
              Sesuaikan filter subjek atau tambahkan bahan pustaka baru ke dalam katalog.
            </p>
            <div className="mt-4 flex items-center justify-center gap-2.5">
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setCategoryFilter('semua');
                  setAvailabilityFilter('semua');
                }}
                className="px-3.5 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-lg transition-colors"
              >
                Atur Ulang Filter
              </button>
              <button
                type="button"
                onClick={onAddBook}
                className="px-4 py-2 text-xs font-medium text-white bg-[#0F5C4D] hover:bg-[#0B463B] rounded-lg transition-colors"
              >
                Tambah Koleksi
              </button>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/75 text-xs font-semibold text-slate-600">
                  <th className="py-3 px-4 whitespace-nowrap">Kode Panggil & Induk</th>
                  <th className="py-3 px-4">Judul, Pengarang & Penerbit</th>
                  <th className="py-3 px-4 whitespace-nowrap">Subjek & Rak</th>
                  <th className="py-3 px-4 whitespace-nowrap text-right">Ketersediaan</th>
                  <th className="py-3 px-4 text-right whitespace-nowrap">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 text-sm">
                {filteredBooks.map((book) => {
                  const available = getAvailableCopies(book.id);
                  return (
                    <tr key={book.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3.5 px-4 align-top whitespace-nowrap">
                        <p className="font-mono text-xs font-semibold text-slate-900 tabular-nums">
                          {book.callNumber}
                        </p>
                        <p className="font-mono text-[11px] text-slate-500 mt-0.5 tabular-nums">
                          {book.inventoryCode}
                        </p>
                      </td>

                      <td className="py-3.5 px-4 align-top min-w-[260px] max-w-[380px]">
                        <p className="font-medium text-slate-900 leading-snug">
                          {book.title}
                        </p>
                        <p className="text-xs text-slate-500 mt-1">
                          {book.author} · {book.publisher} ({book.year})
                        </p>
                        {book.isbn && book.isbn !== '-' && (
                          <p className="text-[11px] font-mono text-slate-400 mt-0.5">
                            ISBN {book.isbn}
                          </p>
                        )}
                      </td>

                      <td className="py-3.5 px-4 align-top whitespace-nowrap text-xs">
                        <p className="text-slate-800 font-medium">{book.category}</p>
                        <p className="text-slate-500 mt-0.5">
                          {book.shelfLocation} · Kondisi {book.condition}
                        </p>
                      </td>

                      <td className="py-3.5 px-4 align-top text-right whitespace-nowrap tabular-nums">
                        <p
                          className={`font-mono text-xs font-semibold ${
                            available > 0 ? 'text-emerald-700' : 'text-red-700'
                          }`}
                        >
                          {available} / {book.totalCopies} eks
                        </p>
                        <p className="text-[11px] text-slate-500 mt-0.5">
                          {available > 0 ? 'Tersedia' : 'Sedang dipinjam'}
                        </p>
                      </td>

                      <td className="py-3.5 px-4 align-top text-right whitespace-nowrap">
                        <div className="inline-flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            disabled={available <= 0}
                            onClick={() => onBorrowBook(book.id)}
                            className={`px-2.5 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
                              available > 0
                                ? 'text-[#0F5C4D] bg-white border border-[#0F5C4D]/35 hover:bg-[#0F5C4D] hover:text-white cursor-pointer'
                                : 'text-slate-400 bg-slate-100 border border-slate-200 cursor-not-allowed'
                            }`}
                          >
                            Pinjam
                          </button>
                          <button
                            type="button"
                            onClick={() => onEditBook(book)}
                            title="Ubah Data Buku"
                            className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-md transition-colors cursor-pointer"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => onRequestDeleteBook(book)}
                            title="Hapus Koleksi"
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

import { useEffect, useMemo, useState } from 'react';
import { X } from 'lucide-react';
import {
  BookCondition,
  BookItem,
  UnitKerja,
} from '../types/library';
import { BOOK_CONDITIONS, UNIT_KERJA_LIST } from '../data/seedData';
import { addDaysIso, getTodayIso } from '../utils/format';
import { CreateLoanInput } from '../hooks/useLibraryStore';

interface LoanFormModalProps {
  isOpen: boolean;
  books: BookItem[];
  getAvailableCopies: (bookId: string) => number;
  preselectedBookId?: string | null;
  onClose: () => void;
  onSubmit: (input: CreateLoanInput) => { ok: boolean; error?: string };
}

export function LoanFormModal({
  isOpen,
  books,
  getAvailableCopies,
  preselectedBookId,
  onClose,
  onSubmit,
}: LoanFormModalProps) {
  const [bookSearch, setBookSearch] = useState('');
  const [bookId, setBookId] = useState('');
  const [borrowerName, setBorrowerName] = useState('');
  const [borrowerNip, setBorrowerNip] = useState('');
  const [unitKerja, setUnitKerja] = useState<UnitKerja>('Sekretariat');
  const [phone, setPhone] = useState('');
  const [loanDate, setLoanDate] = useState(getTodayIso());
  const [dueDate, setDueDate] = useState(addDaysIso(getTodayIso(), 7));
  const [conditionOut, setConditionOut] = useState<BookCondition>('Baik');
  const [notes, setNotes] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const availableBooks = useMemo(() => {
    const q = bookSearch.trim().toLowerCase();
    return books
      .map((book) => ({
        book,
        available: getAvailableCopies(book.id),
      }))
      .filter(({ book }) => {
        if (!q) return true;
        return (
          book.title.toLowerCase().includes(q) ||
          book.callNumber.toLowerCase().includes(q) ||
          book.author.toLowerCase().includes(q) ||
          book.inventoryCode.toLowerCase().includes(q)
        );
      })
      .sort((a, b) => Number(b.available > 0) - Number(a.available > 0));
  }, [books, bookSearch, getAvailableCopies]);

  useEffect(() => {
    if (!isOpen) return;
    const today = getTodayIso();
    setBookSearch('');
    setBorrowerName('');
    setBorrowerNip('');
    setUnitKerja('Sekretariat');
    setPhone('');
    setLoanDate(today);
    setDueDate(addDaysIso(today, 7));
    setConditionOut('Baik');
    setNotes('');
    setErrorMsg(null);

    if (preselectedBookId && getAvailableCopies(preselectedBookId) > 0) {
      setBookId(preselectedBookId);
    } else {
      const firstAvail = books.find((b) => getAvailableCopies(b.id) > 0);
      setBookId(firstAvail?.id ?? '');
    }
  }, [isOpen, preselectedBookId, books, getAvailableCopies]);

  if (!isOpen) return null;

  const selectedBook = books.find((b) => b.id === bookId);
  const selectedAvailable = bookId ? getAvailableCopies(bookId) : 0;

  const applyDurationPreset = (days: number) => {
    if (!loanDate) return;
    setDueDate(addDaysIso(loanDate, days));
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!bookId) {
      setErrorMsg('Pilih buku yang akan dipinjam terlebih dahulu.');
      return;
    }
    if (!borrowerName.trim()) {
      setErrorMsg('Nama lengkap peminjam wajib diisi.');
      return;
    }
    if (!borrowerNip.trim()) {
      setErrorMsg('NIP atau nomor identitas pegawai wajib diisi.');
      return;
    }
    if (dueDate < loanDate) {
      setErrorMsg('Tanggal jatuh tempo tidak boleh lebih awal dari tanggal pinjam.');
      return;
    }

    const res = onSubmit({
      bookId,
      borrowerName,
      borrowerNip,
      unitKerja,
      phone,
      loanDate,
      dueDate,
      conditionOut,
      notes,
    });

    if (!res.ok) {
      setErrorMsg(res.error ?? 'Gagal mencatat peminjaman.');
      return;
    }
    onClose();
  };

  return (
    <div
      className="no-print fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/45 backdrop-blur-[1px]"
      role="dialog"
      aria-modal="true"
      aria-labelledby="loan-modal-title"
    >
      <div className="w-full max-w-2xl max-h-[92vh] flex flex-col bg-white border border-slate-200 rounded-xl shadow-xl overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
          <div>
            <h2
              id="loan-modal-title"
              className="font-display text-lg font-bold text-slate-900"
            >
              Formulir Peminjaman Buku
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Pencatatan sirkulasi digital Pojok Baca Widya Pustaka — BKPSDM Kota Batu
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup formulir peminjaman"
            className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleFormSubmit} className="overflow-y-auto px-6 py-5 space-y-5">
          {errorMsg && (
            <div className="px-4 py-3 text-sm text-red-800 bg-red-50 border border-red-200 rounded-lg">
              {errorMsg}
            </div>
          )}

          {/* Section 1: Book Selection */}
          <div className="space-y-3">
            <div className="flex items-center justify-between gap-2">
              <label
                htmlFor="loan-book-select"
                className="block text-sm font-semibold text-slate-800"
              >
                Koleksi Buku yang Dipinjam
              </label>
              {selectedBook && (
                <span className="text-xs text-slate-500 font-mono tabular-nums">
                  Tersedia {selectedAvailable} dari {selectedBook.totalCopies} eks · {selectedBook.shelfLocation}
                </span>
              )}
            </div>

            <input
              type="text"
              value={bookSearch}
              onChange={(e) => setBookSearch(e.target.value)}
              placeholder="Cari judul buku, kode panggil DDC, atau pengarang..."
              className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-300 rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0F5C4D]/25 focus:border-[#0F5C4D]"
            />

            <select
              id="loan-book-select"
              value={bookId}
              onChange={(e) => setBookId(e.target.value)}
              required
              className="w-full px-3.5 py-2.5 text-sm bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0F5C4D]/25 focus:border-[#0F5C4D]"
            >
              <option value="">-- Pilih koleksi buku --</option>
              {availableBooks.map(({ book, available }) => (
                <option key={book.id} value={book.id} disabled={available <= 0}>
                  [{book.callNumber}] {book.title} — ({available > 0 ? `Tersedia ${available} eks` : 'Sedang dipinjam habis'})
                </option>
              ))}
            </select>
          </div>

          <hr className="border-slate-200" />

          {/* Section 2: Borrower Identity */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="borrower-name"
                className="block text-xs font-semibold text-slate-700 mb-1.5"
              >
                Nama Lengkap Peminjam (ASN / Pegawai)
              </label>
              <input
                id="borrower-name"
                type="text"
                required
                value={borrowerName}
                onChange={(e) => setBorrowerName(e.target.value)}
                placeholder="Contoh: Budi Santoso, S.AP."
                className="w-full px-3.5 py-2 text-sm bg-white border border-slate-300 rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0F5C4D]/25 focus:border-[#0F5C4D]"
              />
            </div>

            <div>
              <label
                htmlFor="borrower-nip"
                className="block text-xs font-semibold text-slate-700 mb-1.5"
              >
                NIP / Nomor Identitas Pegawai
              </label>
              <input
                id="borrower-nip"
                type="text"
                required
                value={borrowerNip}
                onChange={(e) => setBorrowerNip(e.target.value)}
                placeholder="Contoh: 19900412 201503 1 004"
                className="w-full px-3.5 py-2 text-sm font-mono bg-white border border-slate-300 rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0F5C4D]/25 focus:border-[#0F5C4D]"
              />
            </div>

            <div className="sm:col-span-2">
              <label
                htmlFor="borrower-unit"
                className="block text-xs font-semibold text-slate-700 mb-1.5"
              >
                Unit Kerja / Bidang (BKPSDM Kota Batu)
              </label>
              <select
                id="borrower-unit"
                value={unitKerja}
                onChange={(e) => setUnitKerja(e.target.value as UnitKerja)}
                className="w-full px-3.5 py-2 text-sm bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0F5C4D]/25 focus:border-[#0F5C4D]"
              >
                {UNIT_KERJA_LIST.map((u) => (
                  <option key={u} value={u}>
                    {u}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label
                htmlFor="borrower-phone"
                className="block text-xs font-semibold text-slate-700 mb-1.5"
              >
                Nomor Telepon / WhatsApp
              </label>
              <input
                id="borrower-phone"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="Contoh: 0812-3456-7890"
                className="w-full px-3.5 py-2 text-sm font-mono bg-white border border-slate-300 rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0F5C4D]/25 focus:border-[#0F5C4D]"
              />
            </div>

            <div>
              <label
                htmlFor="condition-out"
                className="block text-xs font-semibold text-slate-700 mb-1.5"
              >
                Kondisi Buku Saat Dipinjam
              </label>
              <select
                id="condition-out"
                value={conditionOut}
                onChange={(e) => setConditionOut(e.target.value as BookCondition)}
                className="w-full px-3.5 py-2 text-sm bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0F5C4D]/25 focus:border-[#0F5C4D]"
              >
                {BOOK_CONDITIONS.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <hr className="border-slate-200" />

          {/* Section 3: Dates & Notes */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="loan-date"
                className="block text-xs font-semibold text-slate-700 mb-1.5"
              >
                Tanggal Peminjaman
              </label>
              <input
                id="loan-date"
                type="date"
                required
                value={loanDate}
                onChange={(e) => {
                  const next = e.target.value;
                  setLoanDate(next);
                  if (next) setDueDate(addDaysIso(next, 7));
                }}
                className="w-full px-3.5 py-2 text-sm font-mono bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0F5C4D]/25 focus:border-[#0F5C4D]"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label
                  htmlFor="due-date"
                  className="block text-xs font-semibold text-slate-700"
                >
                  Batas Pengembalian
                </label>
                <div className="flex items-center gap-1.5 text-[11px]">
                  <button
                    type="button"
                    onClick={() => applyDurationPreset(7)}
                    className="text-[#0F5C4D] hover:underline font-medium"
                  >
                    +7 hari
                  </button>
                  <span className="text-slate-300" aria-hidden="true">·</span>
                  <button
                    type="button"
                    onClick={() => applyDurationPreset(14)}
                    className="text-[#0F5C4D] hover:underline font-medium"
                  >
                    +14 hari
                  </button>
                </div>
              </div>
              <input
                id="due-date"
                type="date"
                required
                value={dueDate}
                min={loanDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full px-3.5 py-2 text-sm font-mono bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0F5C4D]/25 focus:border-[#0F5C4D]"
              />
            </div>

            <div className="sm:col-span-2">
              <label
                htmlFor="loan-notes"
                className="block text-xs font-semibold text-slate-700 mb-1.5"
              >
                Keperluan / Catatan Tambahan (Opsional)
              </label>
              <textarea
                id="loan-notes"
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Contoh: Referensi penyusunan dokumen evaluasi kinerja atau bahan kajian regulasi."
                className="w-full px-3.5 py-2 text-sm bg-white border border-slate-300 rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0F5C4D]/25 focus:border-[#0F5C4D]"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-lg transition-colors whitespace-nowrap"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-sm font-medium text-white bg-[#0F5C4D] hover:bg-[#0B463B] rounded-lg transition-colors whitespace-nowrap cursor-pointer"
            >
              Simpan Peminjaman
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

import { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { BookCategory, BookCondition, BookItem } from '../types/library';
import { BOOK_CATEGORIES, BOOK_CONDITIONS } from '../data/seedData';

interface BookFormModalProps {
  isOpen: boolean;
  editingBook: BookItem | null;
  activeBorrowedCount?: number;
  onClose: () => void;
  onSave: (data: Omit<BookItem, 'id' | 'addedDate'>, editingId?: string) => void;
}

export function BookFormModal({
  isOpen,
  editingBook,
  activeBorrowedCount = 0,
  onClose,
  onSave,
}: BookFormModalProps) {
  const [inventoryCode, setInventoryCode] = useState('');
  const [callNumber, setCallNumber] = useState('');
  const [title, setTitle] = useState('');
  const [author, setAuthor] = useState('');
  const [publisher, setPublisher] = useState('');
  const [year, setYear] = useState(String(new Date().getFullYear()));
  const [isbn, setIsbn] = useState('');
  const [category, setCategory] = useState<BookCategory>('Kepegawaian & ASN');
  const [shelfLocation, setShelfLocation] = useState('Rak A-1');
  const [totalCopies, setTotalCopies] = useState('1');
  const [condition, setCondition] = useState<BookCondition>('Baik');
  const [notes, setNotes] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    setErrorMsg(null);
    if (editingBook) {
      setInventoryCode(editingBook.inventoryCode);
      setCallNumber(editingBook.callNumber);
      setTitle(editingBook.title);
      setAuthor(editingBook.author);
      setPublisher(editingBook.publisher);
      setYear(String(editingBook.year));
      setIsbn(editingBook.isbn);
      setCategory(editingBook.category);
      setShelfLocation(editingBook.shelfLocation);
      setTotalCopies(String(editingBook.totalCopies));
      setCondition(editingBook.condition);
      setNotes(editingBook.notes ?? '');
    } else {
      const yr = new Date().getFullYear();
      setInventoryCode(`WP/${yr}/${String(Math.floor(Math.random() * 900) + 100)}`);
      setCallNumber('');
      setTitle('');
      setAuthor('');
      setPublisher('');
      setYear(String(yr));
      setIsbn('');
      setCategory('Kepegawaian & ASN');
      setShelfLocation('Rak A-1');
      setTotalCopies('2');
      setCondition('Baik');
      setNotes('');
    }
  }, [isOpen, editingBook]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    const parsedYear = parseInt(year, 10);
    const parsedCopies = parseInt(totalCopies, 10);

    if (!title.trim() || !author.trim() || !callNumber.trim()) {
      setErrorMsg('Judul buku, pengarang, dan nomor panggil DDC wajib diisi.');
      return;
    }
    if (isNaN(parsedCopies) || parsedCopies < Math.max(1, activeBorrowedCount)) {
      setErrorMsg(
        activeBorrowedCount > 0
          ? `Jumlah eksemplar tidak boleh kurang dari yang sedang dipinjam (${activeBorrowedCount} eks).`
          : 'Jumlah eksemplar minimal 1.'
      );
      return;
    }

    onSave(
      {
        inventoryCode: inventoryCode.trim() || `WP/${new Date().getFullYear()}/000`,
        callNumber: callNumber.trim(),
        title: title.trim(),
        author: author.trim(),
        publisher: publisher.trim() || '-',
        year: isNaN(parsedYear) ? new Date().getFullYear() : parsedYear,
        isbn: isbn.trim() || '-',
        category,
        shelfLocation: shelfLocation.trim() || 'Rak A-1',
        totalCopies: parsedCopies,
        condition,
        notes: notes.trim() || undefined,
      },
      editingBook?.id
    );
    onClose();
  };

  return (
    <div
      className="no-print fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/45 backdrop-blur-[1px]"
      role="dialog"
      aria-modal="true"
      aria-labelledby="book-modal-title"
    >
      <div className="w-full max-w-2xl max-h-[92vh] flex flex-col bg-white border border-slate-200 rounded-xl shadow-xl overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
          <div>
            <h2
              id="book-modal-title"
              className="font-display text-lg font-bold text-slate-900"
            >
              {editingBook ? 'Ubah Data Koleksi Buku' : 'Tambah Koleksi Buku Baru'}
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Inventarisasi bahan pustaka Pojok Baca Widya Pustaka
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup formulir koleksi"
            className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="overflow-y-auto px-6 py-5 space-y-4">
          {errorMsg && (
            <div className="px-4 py-3 text-sm text-red-800 bg-red-50 border border-red-200 rounded-lg">
              {errorMsg}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="book-inv" className="block text-xs font-semibold text-slate-700 mb-1.5">
                Nomor Induk Inventaris
              </label>
              <input
                id="book-inv"
                type="text"
                required
                value={inventoryCode}
                onChange={(e) => setInventoryCode(e.target.value)}
                placeholder="WP/2026/015"
                className="w-full px-3.5 py-2 text-sm font-mono bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0F5C4D]/25 focus:border-[#0F5C4D]"
              />
            </div>

            <div>
              <label htmlFor="book-ddc" className="block text-xs font-semibold text-slate-700 mb-1.5">
                Nomor Panggil / Klasifikasi DDC
              </label>
              <input
                id="book-ddc"
                type="text"
                required
                value={callNumber}
                onChange={(e) => setCallNumber(e.target.value)}
                placeholder="Contoh: 352.6 PRI m"
                className="w-full px-3.5 py-2 text-sm font-mono bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0F5C4D]/25 focus:border-[#0F5C4D]"
              />
            </div>

            <div className="sm:col-span-2">
              <label htmlFor="book-title" className="block text-xs font-semibold text-slate-700 mb-1.5">
                Judul Lengkap Buku / Bahan Pustaka
              </label>
              <input
                id="book-title"
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Masukkan judul lengkap buku..."
                className="w-full px-3.5 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0F5C4D]/25 focus:border-[#0F5C4D]"
              />
            </div>

            <div>
              <label htmlFor="book-author" className="block text-xs font-semibold text-slate-700 mb-1.5">
                Pengarang / Penyusun
              </label>
              <input
                id="book-author"
                type="text"
                required
                value={author}
                onChange={(e) => setAuthor(e.target.value)}
                placeholder="Nama pengarang atau instansi"
                className="w-full px-3.5 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0F5C4D]/25 focus:border-[#0F5C4D]"
              />
            </div>

            <div>
              <label htmlFor="book-publisher" className="block text-xs font-semibold text-slate-700 mb-1.5">
                Penerbit
              </label>
              <input
                id="book-publisher"
                type="text"
                value={publisher}
                onChange={(e) => setPublisher(e.target.value)}
                placeholder="Contoh: LAN RI / Sinar Grafika"
                className="w-full px-3.5 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0F5C4D]/25 focus:border-[#0F5C4D]"
              />
            </div>

            <div>
              <label htmlFor="book-year" className="block text-xs font-semibold text-slate-700 mb-1.5">
                Tahun Terbit
              </label>
              <input
                id="book-year"
                type="number"
                min={1950}
                max={2035}
                value={year}
                onChange={(e) => setYear(e.target.value)}
                className="w-full px-3.5 py-2 text-sm font-mono bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0F5C4D]/25 focus:border-[#0F5C4D]"
              />
            </div>

            <div>
              <label htmlFor="book-isbn" className="block text-xs font-semibold text-slate-700 mb-1.5">
                ISBN / ISSN
              </label>
              <input
                id="book-isbn"
                type="text"
                value={isbn}
                onChange={(e) => setIsbn(e.target.value)}
                placeholder="978-623-..."
                className="w-full px-3.5 py-2 text-sm font-mono bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0F5C4D]/25 focus:border-[#0F5C4D]"
              />
            </div>

            <div>
              <label htmlFor="book-category" className="block text-xs font-semibold text-slate-700 mb-1.5">
                Kategori Subjek
              </label>
              <select
                id="book-category"
                value={category}
                onChange={(e) => setCategory(e.target.value as BookCategory)}
                className="w-full px-3.5 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0F5C4D]/25 focus:border-[#0F5C4D]"
              >
                {BOOK_CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="book-shelf" className="block text-xs font-semibold text-slate-700 mb-1.5">
                Lokasi Rak
              </label>
              <input
                id="book-shelf"
                type="text"
                value={shelfLocation}
                onChange={(e) => setShelfLocation(e.target.value)}
                placeholder="Rak A-1"
                className="w-full px-3.5 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0F5C4D]/25 focus:border-[#0F5C4D]"
              />
            </div>

            <div>
              <label htmlFor="book-copies" className="block text-xs font-semibold text-slate-700 mb-1.5">
                Jumlah Eksemplar
              </label>
              <input
                id="book-copies"
                type="number"
                min={Math.max(1, activeBorrowedCount)}
                max={999}
                required
                value={totalCopies}
                onChange={(e) => setTotalCopies(e.target.value)}
                className="w-full px-3.5 py-2 text-sm font-mono bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0F5C4D]/25 focus:border-[#0F5C4D]"
              />
              {activeBorrowedCount > 0 && (
                <p className="mt-1 text-[11px] text-slate-500">
                  Minimal {activeBorrowedCount} eksemplar karena sedang dipinjam.
                </p>
              )}
            </div>

            <div>
              <label htmlFor="book-condition" className="block text-xs font-semibold text-slate-700 mb-1.5">
                Kondisi Koleksi
              </label>
              <select
                id="book-condition"
                value={condition}
                onChange={(e) => setCondition(e.target.value as BookCondition)}
                className="w-full px-3.5 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0F5C4D]/25 focus:border-[#0F5C4D]"
              >
                {BOOK_CONDITIONS.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            <div className="sm:col-span-2">
              <label htmlFor="book-notes" className="block text-xs font-semibold text-slate-700 mb-1.5">
                Keterangan / Anotasi Singkat (Opsional)
              </label>
              <textarea
                id="book-notes"
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Catatan singkat isi buku atau sumber pengadaan (APBD / Hibah)."
                className="w-full px-3.5 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0F5C4D]/25 focus:border-[#0F5C4D]"
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
              {editingBook ? 'Simpan Perubahan' : 'Tambahkan Koleksi'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

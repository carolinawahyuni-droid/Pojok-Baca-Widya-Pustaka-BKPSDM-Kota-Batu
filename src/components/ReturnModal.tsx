import { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { BookCondition, LoanTransaction } from '../types/library';
import { BOOK_CONDITIONS } from '../data/seedData';
import {
  diffDays,
  formatTanggalLengkap,
  getTodayIso,
} from '../utils/format';
import { ReturnLoanInput } from '../hooks/useLibraryStore';

interface ReturnModalProps {
  loan: LoanTransaction | null;
  onClose: () => void;
  onSubmit: (input: ReturnLoanInput) => void;
}

export function ReturnModal({ loan, onClose, onSubmit }: ReturnModalProps) {
  const [returnDate, setReturnDate] = useState(getTodayIso());
  const [conditionIn, setConditionIn] = useState<BookCondition>('Baik');
  const [returnNotes, setReturnNotes] = useState('');

  useEffect(() => {
    if (!loan) return;
    setReturnDate(getTodayIso());
    setConditionIn(loan.conditionOut || 'Baik');
    setReturnNotes('');
  }, [loan]);

  if (!loan) return null;

  const overdueDays = Math.max(0, diffDays(loan.dueDate, returnDate));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      loanId: loan.id,
      returnDate,
      conditionIn,
      returnNotes,
    });
    onClose();
  };

  return (
    <div
      className="no-print fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/45 backdrop-blur-[1px]"
      role="dialog"
      aria-modal="true"
      aria-labelledby="return-modal-title"
    >
      <div className="w-full max-w-lg bg-white border border-slate-200 rounded-xl shadow-xl overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
          <div>
            <h2
              id="return-modal-title"
              className="font-display text-lg font-bold text-slate-900"
            >
              Konfirmasi Pengembalian Buku
            </h2>
            <p className="text-xs font-mono text-slate-500 mt-0.5">
              Nomor Bukti: {loan.receiptNumber}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup dialog pengembalian"
            className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg space-y-1.5">
            <p className="text-sm font-semibold text-slate-900 leading-snug">
              {loan.bookTitleSnapshot}
            </p>
            <p className="text-xs text-slate-600">
              Peminjam: <span className="font-medium text-slate-900">{loan.borrowerName}</span> · {loan.unitKerja}
            </p>
            <p className="text-xs text-slate-500 font-mono tabular-nums">
              Pinjam: {formatTanggalLengkap(loan.loanDate)} · Batas Kembali: {formatTanggalLengkap(loan.dueDate)}
            </p>
          </div>

          {overdueDays > 0 && (
            <div className="px-4 py-2.5 text-xs font-medium text-red-800 bg-red-50 border border-red-200 rounded-lg tabular-nums">
              Terdeteksi keterlambatan pengembalian selama {overdueDays} hari dari batas waktu yang ditentukan.
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="return-date"
                className="block text-xs font-semibold text-slate-700 mb-1.5"
              >
                Tanggal Pengembalian
              </label>
              <input
                id="return-date"
                type="date"
                required
                min={loan.loanDate}
                value={returnDate}
                onChange={(e) => setReturnDate(e.target.value)}
                className="w-full px-3.5 py-2 text-sm font-mono bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0F5C4D]/25 focus:border-[#0F5C4D]"
              />
            </div>

            <div>
              <label
                htmlFor="condition-in"
                className="block text-xs font-semibold text-slate-700 mb-1.5"
              >
                Kondisi Fisik Saat Kembali
              </label>
              <select
                id="condition-in"
                value={conditionIn}
                onChange={(e) => setConditionIn(e.target.value as BookCondition)}
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

          <div>
            <label
              htmlFor="return-notes"
              className="block text-xs font-semibold text-slate-700 mb-1.5"
            >
              Catatan Pengembalian (Opsional)
            </label>
            <textarea
              id="return-notes"
              rows={2}
              value={returnNotes}
              onChange={(e) => setReturnNotes(e.target.value)}
              placeholder="Contoh: Dikembalikan lengkap tanpa kerusakan."
              className="w-full px-3.5 py-2 text-sm bg-white border border-slate-300 rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0F5C4D]/25 focus:border-[#0F5C4D]"
            />
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
              Tandai Dikembalikan
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

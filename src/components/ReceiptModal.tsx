import { Printer, X } from 'lucide-react';
import { LoanTransaction, SignatoryConfig } from '../types/library';
import { LIBRARY_ASSETS } from '../data/seedData';
import { formatTanggalLengkap, getLoanOverdueDays } from '../utils/format';
import { SafeImage } from './SafeImage';

interface ReceiptModalProps {
  loan: LoanTransaction | null;
  signatory: SignatoryConfig;
  onClose: () => void;
}

export function ReceiptModal({ loan, signatory, onClose }: ReceiptModalProps) {
  if (!loan) return null;

  const overdueDays = getLoanOverdueDays(loan);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-[1px] print:static print:p-0 print:bg-white"
      role="dialog"
      aria-modal="true"
      aria-labelledby="receipt-modal-title"
    >
      <div className="w-full max-w-2xl max-h-[92vh] flex flex-col bg-white border border-slate-200 rounded-xl shadow-xl overflow-hidden print:max-h-none print:border-none print:shadow-none print:rounded-none">
        <div className="no-print flex items-center justify-between px-6 py-4 border-b border-slate-200">
          <div>
            <h2 id="receipt-modal-title" className="font-display text-base font-bold text-slate-900">
              Bukti Layanan Sirkulasi Perpustakaan
            </h2>
            <p className="text-xs font-mono text-slate-500 mt-0.5">
              {loan.receiptNumber}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => window.print()}
              className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-medium text-white bg-[#0F5C4D] hover:bg-[#0B463B] rounded-lg transition-colors whitespace-nowrap cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Cetak Bukti</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              aria-label="Tutup bukti peminjaman"
              className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="overflow-y-auto p-6 sm:p-8 print-only-container official-document text-black">
          {/* Formal Letterhead */}
          <div className="flex items-center gap-4 pb-3 border-b-[3px] border-double border-slate-900">
            <SafeImage
              src={LIBRARY_ASSETS.emblem}
              alt="Lambang Pojok Baca Widya Pustaka"
              className="w-16 h-16 object-contain shrink-0"
            />
            <div className="flex-1 text-center">
              <p className="text-xs font-bold tracking-wider uppercase leading-tight">
                {signatory.agencyHeaderLine1}
              </p>
              <p className="text-sm font-bold uppercase leading-snug">
                {signatory.agencyHeaderLine2}
              </p>
              <p className="text-[11px] font-semibold mt-0.5">
                POJOK BACA WIDYA PUSTAKA
              </p>
              <p className="text-[10px] text-slate-700 mt-0.5">
                {signatory.agencyAddress}
              </p>
            </div>
          </div>

          <div className="text-center mt-5 mb-5">
            <h3 className="text-sm font-bold uppercase underline tracking-wide">
              Tanda Bukti {loan.status === 'Dikembalikan' ? 'Pengembalian' : 'Peminjaman'} Buku Perpustakaan
            </h3>
            <p className="text-xs mt-1">
              Nomor Transaksi: <span className="font-mono font-semibold">{loan.receiptNumber}</span>
            </p>
          </div>

          <table className="w-full text-xs border-collapse mb-5">
            <tbody>
              <tr className="border-b border-slate-300">
                <td className="py-2 pr-4 font-semibold w-44">Nama Peminjam</td>
                <td className="py-2">: {loan.borrowerName}</td>
              </tr>
              <tr className="border-b border-slate-300">
                <td className="py-2 pr-4 font-semibold">NIP / ID Pegawai</td>
                <td className="py-2 font-mono">: {loan.borrowerNip}</td>
              </tr>
              <tr className="border-b border-slate-300">
                <td className="py-2 pr-4 font-semibold">Unit Kerja / Bidang</td>
                <td className="py-2">: {loan.unitKerja}</td>
              </tr>
              <tr className="border-b border-slate-300">
                <td className="py-2 pr-4 font-semibold">Judul Koleksi Buku</td>
                <td className="py-2 font-semibold">: {loan.bookTitleSnapshot}</td>
              </tr>
              <tr className="border-b border-slate-300">
                <td className="py-2 pr-4 font-semibold">Nomor Panggil (DDC)</td>
                <td className="py-2 font-mono">: {loan.bookCallNumberSnapshot}</td>
              </tr>
              <tr className="border-b border-slate-300">
                <td className="py-2 pr-4 font-semibold">Tanggal Pinjam</td>
                <td className="py-2">: {formatTanggalLengkap(loan.loanDate)}</td>
              </tr>
              <tr className="border-b border-slate-300">
                <td className="py-2 pr-4 font-semibold">Batas Pengembalian</td>
                <td className="py-2">: {formatTanggalLengkap(loan.dueDate)}</td>
              </tr>
              <tr className="border-b border-slate-300">
                <td className="py-2 pr-4 font-semibold">Status & Tanggal Kembali</td>
                <td className="py-2">
                  : {loan.status === 'Dikembalikan'
                    ? `Sudah Dikembalikan pada ${formatTanggalLengkap(loan.returnDate)}${overdueDays > 0 ? ` (Terlambat ${overdueDays} hari)` : ' (Tepat Waktu)'}`
                    : `Sedang Dipinjam${overdueDays > 0 ? ` (Melewati batas ${overdueDays} hari)` : ''}`}
                </td>
              </tr>
              <tr className="border-b border-slate-300">
                <td className="py-2 pr-4 font-semibold">Kondisi Fisik Buku</td>
                <td className="py-2">
                  : Saat Pinjam ({loan.conditionOut})
                  {loan.conditionIn ? ` · Saat Kembali (${loan.conditionIn})` : ''}
                </td>
              </tr>
              {(loan.notes || loan.returnNotes) && (
                <tr className="border-b border-slate-300">
                  <td className="py-2 pr-4 font-semibold">Catatan</td>
                  <td className="py-2">
                    : {[loan.notes, loan.returnNotes].filter(Boolean).join(' — ')}
                  </td>
                </tr>
              )}
            </tbody>
          </table>

          <p className="text-[11px] leading-relaxed text-slate-700 mb-6">
            Bukti layanan ini diterbitkan secara elektronik oleh sistem Pojok Baca Widya Pustaka BKPSDM Kota Batu sebagai dokumen arsip peminjaman dan pengembalian bahan pustaka.
          </p>

          <div className="signature-block grid grid-cols-2 gap-8 text-xs text-center mt-8">
            <div>
              <p className="mb-14">Peminjam,</p>
              <p className="font-bold underline">{loan.borrowerName}</p>
              <p className="font-mono text-[11px] mt-0.5">NIP. {loan.borrowerNip}</p>
            </div>
            <div>
              <p>{signatory.city}, {formatTanggalLengkap(loan.returnDate ?? loan.loanDate)}</p>
              <p className="mb-12">{signatory.librarianTitle},</p>
              <p className="font-bold underline">{signatory.librarianName}</p>
              <p className="font-mono text-[11px] mt-0.5">NIP. {signatory.librarianNip}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

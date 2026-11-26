import { useEffect, useMemo, useState } from 'react';
import { CheckCircle2, AlertCircle, X } from 'lucide-react';
import { ActiveTab, BookItem, LoanTransaction } from './types/library';
import { useLibraryStore } from './hooks/useLibraryStore';
import { isLoanActiveOverdue } from './utils/format';
import { Sidebar } from './components/Sidebar';
import { TopBar } from './components/TopBar';
import { LoanFormModal } from './components/LoanFormModal';
import { ReturnModal } from './components/ReturnModal';
import { BookFormModal } from './components/BookFormModal';
import { ReceiptModal } from './components/ReceiptModal';
import { ConfirmDialog } from './components/ConfirmDialog';
import { OverviewView } from './views/OverviewView';
import { CirculationView } from './views/CirculationView';
import { CatalogView } from './views/CatalogView';
import { StatisticsView } from './views/StatisticsView';
import { ReportView } from './views/ReportView';

interface ToastState {
  id: number;
  type: 'success' | 'error';
  message: string;
}

export default function App() {
  const {
    books,
    loans,
    signatory,
    activeLoanCountByBook,
    getAvailableCopies,
    addBook,
    updateBook,
    deleteBook,
    createLoan,
    returnLoan,
    extendLoan,
    deleteLoan,
    updateSignatory,
    exportBackupJson,
    importBackupJson,
    resetToSeedData,
  } = useLibraryStore();

  const [activeTab, setActiveTab] = useState<ActiveTab>('beranda');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Modal states
  const [loanModalOpen, setLoanModalOpen] = useState(false);
  const [preselectedBookId, setPreselectedBookId] = useState<string | null>(null);
  const [returningLoan, setReturningLoan] = useState<LoanTransaction | null>(null);
  const [receiptLoan, setReceiptLoan] = useState<LoanTransaction | null>(null);
  const [bookModalOpen, setBookModalOpen] = useState(false);
  const [editingBook, setEditingBook] = useState<BookItem | null>(null);

  // Confirm Dialog states
  const [confirmAction, setConfirmAction] = useState<{
    title: string;
    message: string;
    confirmLabel: string;
    destructive?: boolean;
    onConfirm: () => void;
  } | null>(null);

  // Transient feedback toast
  const [toast, setToast] = useState<ToastState | null>(null);

  const showToast = (type: 'success' | 'error', message: string) => {
    setToast({ id: Date.now(), type, message });
  };

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(null), 4200);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const activeLoanCount = useMemo(
    () => loans.filter((l) => l.status === 'Dipinjam').length,
    [loans]
  );

  const overdueCount = useMemo(
    () => loans.filter((l) => isLoanActiveOverdue(l)).length,
    [loans]
  );

  const handleOpenNewLoan = (bookId?: string) => {
    setPreselectedBookId(bookId ?? null);
    setLoanModalOpen(true);
  };

  const handleCreateLoan = (input: Parameters<typeof createLoan>[0]) => {
    const res = createLoan(input);
    if (res.ok && res.loan) {
      showToast(
        'success',
        `Peminjaman ${res.loan.receiptNumber} atas nama ${res.loan.borrowerName} berhasil dicatat.`
      );
    }
    return res;
  };

  const handleReturnLoan = (input: Parameters<typeof returnLoan>[0]) => {
    returnLoan(input);
    showToast('success', 'Pengembalian buku telah dicatat dan stok katalog diperbarui.');
  };

  const handleExtendLoan = (loanId: string) => {
    extendLoan(loanId, 7);
    showToast('success', 'Batas waktu pengembalian diperpanjang 7 hari.');
  };

  const handleSaveBook = (
    data: Omit<BookItem, 'id' | 'addedDate'>,
    editingId?: string
  ) => {
    if (editingId) {
      updateBook(editingId, data);
      showToast('success', `Data koleksi "${data.title}" berhasil diperbarui.`);
    } else {
      addBook(data);
      showToast('success', `Koleksi baru "${data.title}" berhasil ditambahkan ke katalog.`);
    }
  };

  const handleRequestDeleteBook = (book: BookItem) => {
    setConfirmAction({
      title: 'Hapus Koleksi Buku',
      message: `Hapus "${book.title}" (${book.inventoryCode}) dari katalog? Riwayat sirkulasi yang sudah tercatat tetap tersimpan untuk keperluan arsip.`,
      confirmLabel: 'Hapus Koleksi',
      destructive: true,
      onConfirm: () => {
        const res = deleteBook(book.id);
        setConfirmAction(null);
        if (res.ok) {
          showToast('success', 'Koleksi buku dihapus dari katalog.');
        } else {
          showToast('error', res.error ?? 'Gagal menghapus koleksi.');
        }
      },
    });
  };

  const handleRequestDeleteLoan = (loan: LoanTransaction) => {
    setConfirmAction({
      title: 'Hapus Riwayat Transaksi',
      message: `Hapus catatan transaksi ${loan.receiptNumber} atas nama ${loan.borrowerName}? Tindakan ini tidak dapat dibatalkan.`,
      confirmLabel: 'Hapus Transaksi',
      destructive: true,
      onConfirm: () => {
        deleteLoan(loan.id);
        setConfirmAction(null);
        showToast('success', `Transaksi ${loan.receiptNumber} telah dihapus.`);
      },
    });
  };

  const handleExportBackup = () => {
    exportBackupJson();
    showToast('success', 'Berkas cadangan data JSON berhasil diunduh.');
  };

  const handleImportBackup = (jsonText: string) => {
    const res = importBackupJson(jsonText);
    if (res.ok && res.counts) {
      showToast(
        'success',
        `Data berhasil dipulihkan (${res.counts.books} buku dan ${res.counts.loans} transaksi).`
      );
    } else {
      showToast('error', res.error ?? 'Gagal memulihkan cadangan JSON.');
    }
  };

  const handleRequestReset = () => {
    setConfirmAction({
      title: 'Muat Ulang Data Contoh',
      message:
        'Seluruh data katalog, sirkulasi, dan pengaturan penandatangan di penyimpanan lokal browser akan dikembalikan ke data awal contoh Pojok Baca Widya Pustaka. Lanjutkan?',
      confirmLabel: 'Muat Ulang Data',
      destructive: true,
      onConfirm: () => {
        resetToSeedData();
        setConfirmAction(null);
        showToast('success', 'Data awal contoh Pojok Baca Widya Pustaka berhasil dimuat ulang.');
      },
    });
  };

  return (
    <div className="min-h-screen flex bg-[#F8FAFC] text-slate-900">
      <Sidebar
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        activeLoanCount={activeLoanCount}
        overdueCount={overdueCount}
        isOpenMobile={mobileMenuOpen}
        onCloseMobile={() => setMobileMenuOpen(false)}
        onExportBackup={handleExportBackup}
        onImportBackup={handleImportBackup}
        onRequestReset={handleRequestReset}
      />

      <div className="flex-1 min-w-0 flex flex-col">
        <TopBar
          activeTab={activeTab}
          onOpenMobileMenu={() => setMobileMenuOpen(true)}
          onOpenNewLoan={() => handleOpenNewLoan()}
        />

        <main
          className={`flex-1 w-full max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-6 ${
            receiptLoan ? 'print:hidden' : 'print:p-0 print:max-w-none'
          }`}
        >
          {activeTab === 'beranda' && (
            <OverviewView
              books={books}
              loans={loans}
              getAvailableCopies={getAvailableCopies}
              onNavigate={setActiveTab}
              onOpenNewLoan={handleOpenNewLoan}
              onSelectReturn={setReturningLoan}
            />
          )}

          {activeTab === 'sirkulasi' && (
            <CirculationView
              loans={loans}
              onOpenNewLoan={() => handleOpenNewLoan()}
              onSelectReturn={setReturningLoan}
              onExtendLoan={handleExtendLoan}
              onViewReceipt={setReceiptLoan}
              onRequestDeleteLoan={handleRequestDeleteLoan}
            />
          )}

          {activeTab === 'katalog' && (
            <CatalogView
              books={books}
              getAvailableCopies={getAvailableCopies}
              onAddBook={() => {
                setEditingBook(null);
                setBookModalOpen(true);
              }}
              onEditBook={(book) => {
                setEditingBook(book);
                setBookModalOpen(true);
              }}
              onRequestDeleteBook={handleRequestDeleteBook}
              onBorrowBook={(bookId) => handleOpenNewLoan(bookId)}
            />
          )}

          {activeTab === 'statistik' && (
            <StatisticsView books={books} loans={loans} />
          )}

          {activeTab === 'laporan' && (
            <ReportView
              books={books}
              loans={loans}
              signatory={signatory}
              getAvailableCopies={getAvailableCopies}
              onUpdateSignatory={updateSignatory}
            />
          )}
        </main>
      </div>

      {/* Modals */}
      <LoanFormModal
        isOpen={loanModalOpen}
        books={books}
        getAvailableCopies={getAvailableCopies}
        preselectedBookId={preselectedBookId}
        onClose={() => setLoanModalOpen(false)}
        onSubmit={handleCreateLoan}
      />

      <ReturnModal
        loan={returningLoan}
        onClose={() => setReturningLoan(null)}
        onSubmit={handleReturnLoan}
      />

      <BookFormModal
        isOpen={bookModalOpen}
        editingBook={editingBook}
        activeBorrowedCount={
          editingBook ? activeLoanCountByBook[editingBook.id] ?? 0 : 0
        }
        onClose={() => setBookModalOpen(false)}
        onSave={handleSaveBook}
      />

      <ReceiptModal
        loan={receiptLoan}
        signatory={signatory}
        onClose={() => setReceiptLoan(null)}
      />

      <ConfirmDialog
        isOpen={Boolean(confirmAction)}
        title={confirmAction?.title ?? ''}
        message={confirmAction?.message ?? ''}
        confirmLabel={confirmAction?.confirmLabel ?? 'Konfirmasi'}
        destructive={confirmAction?.destructive}
        onConfirm={() => confirmAction?.onConfirm()}
        onCancel={() => setConfirmAction(null)}
      />

      {/* Toast Notification */}
      {toast && (
        <div
          role="status"
          aria-live="polite"
          className="no-print fixed bottom-5 right-5 z-50 max-w-md flex items-start gap-3 px-4 py-3 bg-slate-900 text-white text-sm rounded-xl shadow-lg border border-slate-700"
        >
          {toast.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
          ) : (
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
          )}
          <p className="leading-snug flex-1">{toast.message}</p>
          <button
            type="button"
            onClick={() => setToast(null)}
            aria-label="Tutup notifikasi"
            className="text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
}

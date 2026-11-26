export type BookCategory =
  | 'Kepegawaian & ASN'
  | 'Hukum & Regulasi'
  | 'Manajemen & Kepemimpinan'
  | 'Pengembangan Kompetensi'
  | 'Teknologi & SPBE'
  | 'Pemerintahan & Daerah'
  | 'Literasi & Umum';

export type BookCondition = 'Baik' | 'Rusak Ringan' | 'Perlu Perbaikan';

export type UnitKerja =
  | 'Sekretariat'
  | 'Bidang Pengadaan, Pemberhentian & Informasi Kepegawaian'
  | 'Bidang Mutasi & Promosi'
  | 'Bidang Pengembangan Kompetensi & Kinerja Aparatur'
  | 'Bidang Pembinaan & Kesejahteraan Aparatur'
  | 'Kelompok Jabatan Fungsional';

export type LoanStatus = 'Dipinjam' | 'Dikembalikan';

export type ActiveTab =
  | 'beranda'
  | 'sirkulasi'
  | 'katalog'
  | 'statistik'
  | 'laporan';

export type ReportType =
  | 'sirkulasi'
  | 'inventaris'
  | 'kinerja_skp';

export interface BookItem {
  id: string;
  inventoryCode: string;
  callNumber: string;
  title: string;
  author: string;
  publisher: string;
  year: number;
  isbn: string;
  category: BookCategory;
  shelfLocation: string;
  totalCopies: number;
  condition: BookCondition;
  addedDate: string; // YYYY-MM-DD
  notes?: string;
}

export interface LoanTransaction {
  id: string;
  receiptNumber: string;
  bookId: string;
  bookTitleSnapshot: string;
  bookCallNumberSnapshot: string;
  bookCategorySnapshot: BookCategory;
  borrowerName: string;
  borrowerNip: string;
  unitKerja: UnitKerja;
  phone: string;
  loanDate: string; // YYYY-MM-DD
  dueDate: string; // YYYY-MM-DD
  returnDate: string | null; // YYYY-MM-DD
  status: LoanStatus;
  conditionOut: BookCondition;
  conditionIn: BookCondition | null;
  extendedCount: number;
  notes?: string;
  returnNotes?: string;
}

export interface SignatoryConfig {
  reportNumber: string;
  city: string;
  agencyHeaderLine1: string;
  agencyHeaderLine2: string;
  agencyAddress: string;
  agencyContact: string;
  headTitle: string;
  headName: string;
  headRank: string;
  headNip: string;
  librarianTitle: string;
  librarianName: string;
  librarianRank: string;
  librarianNip: string;
}

export interface LibraryBackupPayload {
  version: number;
  exportedAt: string;
  source: string;
  books: BookItem[];
  loans: LoanTransaction[];
  signatory: SignatoryConfig;
}

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  BookCondition,
  BookItem,
  LibraryBackupPayload,
  LoanTransaction,
  SignatoryConfig,
  UnitKerja,
} from '../types/library';
import {
  createSeedBooks,
  createSeedLoans,
  DEFAULT_SIGNATORY,
} from '../data/seedData';
import {
  addDaysIso,
  downloadTextFile,
  generateNextReceiptNumber,
  getTodayIso,
} from '../utils/format';

const STORAGE_KEYS = {
  books: 'widya_pustaka_bkpsdm_books_v1',
  loans: 'widya_pustaka_bkpsdm_loans_v1',
  signatory: 'widya_pustaka_bkpsdm_signatory_v1',
} as const;

function readStorage<T>(key: string, fallback: () => T): T {
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return fallback();
    const parsed = JSON.parse(raw) as T;
    return parsed ?? fallback();
  } catch {
    return fallback();
  }
}

export interface CreateLoanInput {
  bookId: string;
  borrowerName: string;
  borrowerNip: string;
  unitKerja: UnitKerja;
  phone: string;
  loanDate: string;
  dueDate: string;
  conditionOut: BookCondition;
  notes?: string;
}

export interface ReturnLoanInput {
  loanId: string;
  returnDate: string;
  conditionIn: BookCondition;
  returnNotes?: string;
}

export function useLibraryStore() {
  const [books, setBooks] = useState<BookItem[]>(() =>
    readStorage(STORAGE_KEYS.books, createSeedBooks)
  );
  const [loans, setLoans] = useState<LoanTransaction[]>(() =>
    readStorage(STORAGE_KEYS.loans, createSeedLoans)
  );
  const [signatory, setSignatory] = useState<SignatoryConfig>(() =>
    readStorage(STORAGE_KEYS.signatory, () => DEFAULT_SIGNATORY)
  );

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEYS.books, JSON.stringify(books));
    } catch {
      // Ignore quota errors gracefully
    }
  }, [books]);

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEYS.loans, JSON.stringify(loans));
    } catch {
      // Ignore quota errors gracefully
    }
  }, [loans]);

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEYS.signatory, JSON.stringify(signatory));
    } catch {
      // Ignore quota errors gracefully
    }
  }, [signatory]);

  const activeLoanCountByBook = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const loan of loans) {
      if (loan.status === 'Dipinjam') {
        counts[loan.bookId] = (counts[loan.bookId] ?? 0) + 1;
      }
    }
    return counts;
  }, [loans]);

  const getAvailableCopies = useCallback(
    (bookId: string): number => {
      const book = books.find((b) => b.id === bookId);
      if (!book) return 0;
      const borrowed = activeLoanCountByBook[bookId] ?? 0;
      return Math.max(0, book.totalCopies - borrowed);
    },
    [books, activeLoanCountByBook]
  );

  const addBook = useCallback((bookData: Omit<BookItem, 'id' | 'addedDate'>) => {
    const newBook: BookItem = {
      ...bookData,
      id: `bk-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      addedDate: getTodayIso(),
    };
    setBooks((prev) => [newBook, ...prev]);
    return newBook;
  }, []);

  const updateBook = useCallback((id: string, updates: Partial<Omit<BookItem, 'id'>>) => {
    setBooks((prev) =>
      prev.map((book) => (book.id === id ? { ...book, ...updates } : book))
    );
  }, []);

  const deleteBook = useCallback(
    (id: string): { ok: boolean; error?: string } => {
      const activeCount = activeLoanCountByBook[id] ?? 0;
      if (activeCount > 0) {
        return {
          ok: false,
          error: `Koleksi ini masih memiliki ${activeCount} eksemplar yang sedang dipinjam. Selesaikan pengembalian terlebih dahulu.`,
        };
      }
      setBooks((prev) => prev.filter((b) => b.id !== id));
      return { ok: true };
    },
    [activeLoanCountByBook]
  );

  const createLoan = useCallback(
    (input: CreateLoanInput): { ok: boolean; loan?: LoanTransaction; error?: string } => {
      const book = books.find((b) => b.id === input.bookId);
      if (!book) {
        return { ok: false, error: 'Buku tidak ditemukan dalam katalog.' };
      }
      const available = getAvailableCopies(book.id);
      if (available <= 0) {
        return {
          ok: false,
          error: 'Seluruh eksemplar buku ini sedang dipinjam.',
        };
      }

      const newLoan: LoanTransaction = {
        id: `ln-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        receiptNumber: generateNextReceiptNumber(loans),
        bookId: book.id,
        bookTitleSnapshot: book.title,
        bookCallNumberSnapshot: book.callNumber,
        bookCategorySnapshot: book.category,
        borrowerName: input.borrowerName.trim(),
        borrowerNip: input.borrowerNip.trim(),
        unitKerja: input.unitKerja,
        phone: input.phone.trim(),
        loanDate: input.loanDate,
        dueDate: input.dueDate,
        returnDate: null,
        status: 'Dipinjam',
        conditionOut: input.conditionOut,
        conditionIn: null,
        extendedCount: 0,
        notes: input.notes?.trim() || undefined,
      };

      setLoans((prev) => [newLoan, ...prev]);
      return { ok: true, loan: newLoan };
    },
    [books, loans, getAvailableCopies]
  );

  const returnLoan = useCallback((input: ReturnLoanInput) => {
    setLoans((prev) =>
      prev.map((loan) =>
        loan.id === input.loanId
          ? {
              ...loan,
              status: 'Dikembalikan',
              returnDate: input.returnDate,
              conditionIn: input.conditionIn,
              returnNotes: input.returnNotes?.trim() || undefined,
            }
          : loan
      )
    );
  }, []);

  const extendLoan = useCallback((loanId: string, extraDays = 7) => {
    setLoans((prev) =>
      prev.map((loan) =>
        loan.id === loanId && loan.status === 'Dipinjam'
          ? {
              ...loan,
              dueDate: addDaysIso(loan.dueDate, extraDays),
              extendedCount: loan.extendedCount + 1,
            }
          : loan
      )
    );
  }, []);

  const deleteLoan = useCallback((loanId: string) => {
    setLoans((prev) => prev.filter((l) => l.id !== loanId));
  }, []);

  const updateSignatory = useCallback((updates: Partial<SignatoryConfig>) => {
    setSignatory((prev) => ({ ...prev, ...updates }));
  }, []);

  const exportBackupJson = useCallback(() => {
    const payload: LibraryBackupPayload = {
      version: 1,
      exportedAt: new Date().toISOString(),
      source: 'Pojok Baca Widya Pustaka — BKPSDM Kota Batu',
      books,
      loans,
      signatory,
    };
    const stamp = getTodayIso();
    downloadTextFile(
      `backup-widya-pustaka-bkpsdm-batu-${stamp}.json`,
      JSON.stringify(payload, null, 2),
      'application/json;charset=utf-8'
    );
  }, [books, loans, signatory]);

  const importBackupJson = useCallback(
    (jsonText: string): { ok: boolean; error?: string; counts?: { books: number; loans: number } } => {
      try {
        const parsed = JSON.parse(jsonText) as Partial<LibraryBackupPayload>;
        if (!Array.isArray(parsed.books) || !Array.isArray(parsed.loans)) {
          return {
            ok: false,
            error: 'Format berkas cadangan tidak valid. Pastikan memilih berkas JSON hasil ekspor Widya Pustaka.',
          };
        }
        setBooks(parsed.books);
        setLoans(parsed.loans);
        if (parsed.signatory) {
          setSignatory({ ...DEFAULT_SIGNATORY, ...parsed.signatory });
        }
        return {
          ok: true,
          counts: { books: parsed.books.length, loans: parsed.loans.length },
        };
      } catch {
        return {
          ok: false,
          error: 'Gagal membaca berkas JSON. Periksa kembali keutuhan file.',
        };
      }
    },
    []
  );

  const resetToSeedData = useCallback(() => {
    setBooks(createSeedBooks());
    setLoans(createSeedLoans());
    setSignatory(DEFAULT_SIGNATORY);
  }, []);

  return {
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
  };
}

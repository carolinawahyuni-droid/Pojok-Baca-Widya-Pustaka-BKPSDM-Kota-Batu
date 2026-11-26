import { LoanTransaction } from '../types/library';

const BULAN_ID = [
  'Januari',
  'Februari',
  'Maret',
  'April',
  'Mei',
  'Juni',
  'Juli',
  'Agustus',
  'September',
  'Oktober',
  'November',
  'Desember',
];

const BULAN_SINGKAT_ID = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'Mei',
  'Jun',
  'Jul',
  'Agu',
  'Sep',
  'Okt',
  'Nov',
  'Des',
];

export function getTodayIso(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function addDaysIso(isoDate: string, days: number): string {
  const [y, m, d] = isoDate.split('-').map(Number);
  const date = new Date(y, (m || 1) - 1, d || 1);
  date.setDate(date.getDate() + days);
  const ny = date.getFullYear();
  const nm = String(date.getMonth() + 1).padStart(2, '0');
  const nd = String(date.getDate()).padStart(2, '0');
  return `${ny}-${nm}-${nd}`;
}

export function formatTanggalLengkap(isoDate: string | null | undefined): string {
  if (!isoDate) return '—';
  const parts = isoDate.split('-').map(Number);
  if (parts.length !== 3 || parts.some(isNaN)) return isoDate;
  const [y, m, d] = parts;
  const monthName = BULAN_ID[m - 1] ?? '';
  return `${d} ${monthName} ${y}`;
}

export function formatTanggalSingkat(isoDate: string | null | undefined): string {
  if (!isoDate) return '—';
  const parts = isoDate.split('-').map(Number);
  if (parts.length !== 3 || parts.some(isNaN)) return isoDate;
  const [y, m, d] = parts;
  const monthName = BULAN_SINGKAT_ID[m - 1] ?? '';
  return `${String(d).padStart(2, '0')} ${monthName} ${y}`;
}

export function diffDays(fromIso: string, toIso: string): number {
  const [y1, m1, d1] = fromIso.split('-').map(Number);
  const [y2, m2, d2] = toIso.split('-').map(Number);
  const dt1 = new Date(y1, (m1 || 1) - 1, d1 || 1).getTime();
  const dt2 = new Date(y2, (m2 || 1) - 1, d2 || 1).getTime();
  return Math.round((dt2 - dt1) / (1000 * 60 * 60 * 24));
}

export function getLoanOverdueDays(loan: LoanTransaction, referenceDateIso?: string): number {
  const compareIso =
    loan.status === 'Dikembalikan' && loan.returnDate
      ? loan.returnDate
      : referenceDateIso ?? getTodayIso();
  const overdue = diffDays(loan.dueDate, compareIso);
  return overdue > 0 ? overdue : 0;
}

export function isLoanActiveOverdue(loan: LoanTransaction): boolean {
  if (loan.status !== 'Dipinjam') return false;
  return getLoanOverdueDays(loan) > 0;
}

export function getLoanDurationDays(loan: LoanTransaction): number {
  const endDate = loan.returnDate ?? getTodayIso();
  const diff = diffDays(loan.loanDate, endDate);
  return diff >= 0 ? diff : 0;
}

export function getMonthLabel(yearMonth: string): string {
  const [y, m] = yearMonth.split('-').map(Number);
  if (!y || !m) return yearMonth;
  return `${BULAN_SINGKAT_ID[m - 1]} ${String(y).slice(2)}`;
}

export function getShortUnitKerja(unit: string): string {
  switch (unit) {
    case 'Bidang Pengadaan, Pemberhentian & Informasi Kepegawaian':
      return 'Bidang PPIK';
    case 'Bidang Pengembangan Kompetensi & Kinerja Aparatur':
      return 'Bidang PKKA';
    case 'Bidang Pembinaan & Kesejahteraan Aparatur':
      return 'Bidang PKA';
    case 'Bidang Mutasi & Promosi':
      return 'Bidang Mutasi & Promosi';
    case 'Kelompok Jabatan Fungsional':
      return 'Jabatan Fungsional';
    default:
      return unit;
  }
}

export function generateNextReceiptNumber(existingLoans: LoanTransaction[]): string {
  const year = new Date().getFullYear();
  const prefix = `WP-${year}-`;
  let maxSeq = 0;
  for (const loan of existingLoans) {
    if (loan.receiptNumber.startsWith(prefix)) {
      const seqStr = loan.receiptNumber.slice(prefix.length);
      const seq = parseInt(seqStr, 10);
      if (!isNaN(seq) && seq > maxSeq) {
        maxSeq = seq;
      }
    }
  }
  return `${prefix}${String(maxSeq + 1).padStart(3, '0')}`;
}

export function escapeCsvCell(value: string | number | null | undefined): string {
  const str = String(value ?? '');
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export function downloadTextFile(filename: string, content: string, mimeType: string): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

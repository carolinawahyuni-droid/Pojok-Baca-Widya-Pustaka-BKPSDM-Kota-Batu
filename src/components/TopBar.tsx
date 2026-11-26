import { Menu, Plus } from 'lucide-react';
import { ActiveTab } from '../types/library';

interface TopBarProps {
  activeTab: ActiveTab;
  onOpenMobileMenu: () => void;
  onOpenNewLoan: () => void;
}

const TAB_BREADCRUMB: Record<ActiveTab, string> = {
  beranda: 'Beranda',
  sirkulasi: 'Sirkulasi Peminjaman & Pengembalian',
  katalog: 'Katalog Koleksi Buku',
  statistik: 'Statistik Sirkulasi',
  laporan: 'Cetak Laporan & Bukti Dukung',
};

export function TopBar({
  activeTab,
  onOpenMobileMenu,
  onOpenNewLoan,
}: TopBarProps) {
  return (
    <header className="no-print sticky top-0 z-30 bg-white/95 backdrop-blur-sm border-b border-slate-200 px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
      <div className="flex items-center gap-3 min-w-0">
        <button
          type="button"
          onClick={onOpenMobileMenu}
          aria-label="Buka menu navigasi"
          className="lg:hidden p-2 -ml-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
        >
          <Menu className="w-5 h-5" />
        </button>

        <nav
          aria-label="Breadcrumb"
          className="flex items-center gap-2 text-sm min-w-0"
        >
          <span className="text-slate-400 hidden sm:inline whitespace-nowrap shrink-0">
            Widya Pustaka
          </span>
          <span className="text-slate-300 hidden sm:inline" aria-hidden="true">
            /
          </span>
          <span className="font-display font-semibold text-slate-900 truncate">
            {TAB_BREADCRUMB[activeTab]}
          </span>
        </nav>
      </div>

      <div className="flex items-center shrink-0">
        <button
          type="button"
          onClick={onOpenNewLoan}
          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-[#0F5C4D] hover:bg-[#0B463B] rounded-lg transition-colors whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0F5C4D] cursor-pointer"
        >
          <Plus className="w-4 h-4 shrink-0" />
          <span>Catat Peminjaman</span>
        </button>
      </div>
    </header>
  );
}

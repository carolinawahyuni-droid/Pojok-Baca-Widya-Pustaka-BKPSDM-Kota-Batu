import { useRef } from 'react';
import {
  ArrowLeftRight,
  BarChart3,
  BookMarked,
  Download,
  FileSpreadsheet,
  LayoutDashboard,
  RotateCcw,
  Upload,
  X,
} from 'lucide-react';
import { ActiveTab } from '../types/library';
import { LIBRARY_ASSETS } from '../data/seedData';
import { SafeImage } from './SafeImage';

interface SidebarProps {
  activeTab: ActiveTab;
  onSelectTab: (tab: ActiveTab) => void;
  activeLoanCount: number;
  overdueCount: number;
  isOpenMobile: boolean;
  onCloseMobile: () => void;
  onExportBackup: () => void;
  onImportBackup: (fileText: string) => void;
  onRequestReset: () => void;
}

const NAV_ITEMS: { id: ActiveTab; label: string; icon: typeof LayoutDashboard }[] = [
  { id: 'beranda', label: 'Beranda', icon: LayoutDashboard },
  { id: 'sirkulasi', label: 'Sirkulasi Buku', icon: ArrowLeftRight },
  { id: 'katalog', label: 'Katalog Koleksi', icon: BookMarked },
  { id: 'statistik', label: 'Statistik', icon: BarChart3 },
  { id: 'laporan', label: 'Cetak Laporan', icon: FileSpreadsheet },
];

export function Sidebar({
  activeTab,
  onSelectTab,
  activeLoanCount,
  overdueCount,
  isOpenMobile,
  onCloseMobile,
  onExportBackup,
  onImportBackup,
  onRequestReset,
}: SidebarProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        onImportBackup(reader.result);
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const sidebarContent = (
    <div className="flex h-full flex-col bg-white border-r border-slate-200">
      {/* Institutional Brand Lockup */}
      <div className="flex items-center justify-between px-5 py-5 border-b border-slate-200">
        <button
          type="button"
          onClick={() => {
            onSelectTab('beranda');
            onCloseMobile();
          }}
          className="flex items-center gap-3 text-left focus-visible:outline-2 focus-visible:outline-[#0F5C4D] rounded-lg"
        >
          <SafeImage
            src={LIBRARY_ASSETS.emblem}
            alt="Lambang Pojok Baca Widya Pustaka"
            className="w-10 h-10 rounded-lg object-cover shrink-0 border border-slate-200"
          />
          <div className="min-w-0">
            <p className="font-display text-[15px] font-bold tracking-tight text-slate-900 leading-tight truncate">
              Widya Pustaka
            </p>
            <p className="text-xs text-slate-500 mt-0.5 truncate">
              BKPSDM Kota Batu
            </p>
          </div>
        </button>

        <button
          type="button"
          onClick={onCloseMobile}
          aria-label="Tutup menu navigasi"
          className="lg:hidden p-2 text-slate-500 hover:text-slate-900 rounded-md hover:bg-slate-100 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto" aria-label="Menu Utama">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => {
                onSelectTab(item.id);
                onCloseMobile();
              }}
              className={`w-full flex items-center justify-between gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium transition-colors whitespace-nowrap focus-visible:outline-2 focus-visible:outline-[#0F5C4D] ${
                isActive
                  ? 'bg-[#0F5C4D] text-white'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <span className="flex items-center gap-3 truncate">
                <Icon className={`w-[18px] h-[18px] shrink-0 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                <span className="truncate">{item.label}</span>
              </span>
              {item.id === 'sirkulasi' && activeLoanCount > 0 && (
                <span
                  className={`font-mono text-xs tabular-nums ${
                    isActive
                      ? 'text-white/90'
                      : overdueCount > 0
                        ? 'text-red-700 font-semibold'
                        : 'text-slate-500'
                  }`}
                >
                  {activeLoanCount}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Local Storage Data Management Utilities */}
      <div className="px-4 py-4 border-t border-slate-200 bg-slate-50/70">
        <p className="text-xs font-medium text-slate-500 mb-2.5 px-1">
          Arsip Penyimpanan Lokal
        </p>
        <div className="space-y-1">
          <button
            type="button"
            onClick={onExportBackup}
            className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-md text-xs font-medium text-slate-700 hover:bg-slate-200/60 hover:text-slate-900 transition-colors whitespace-nowrap"
          >
            <Download className="w-3.5 h-3.5 text-slate-500 shrink-0" />
            <span>Cadangkan Data (JSON)</span>
          </button>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-md text-xs font-medium text-slate-700 hover:bg-slate-200/60 hover:text-slate-900 transition-colors whitespace-nowrap"
          >
            <Upload className="w-3.5 h-3.5 text-slate-500 shrink-0" />
            <span>Pulihkan Data (JSON)</span>
          </button>
          <button
            type="button"
            onClick={onRequestReset}
            className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-md text-xs font-medium text-slate-500 hover:bg-slate-200/60 hover:text-slate-800 transition-colors whitespace-nowrap"
          >
            <RotateCcw className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span>Muat Ulang Data Contoh</span>
          </button>
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept="application/json,.json"
          onChange={handleFileChange}
          className="hidden"
          aria-hidden="true"
        />
        <p className="mt-3 px-1 text-[11px] leading-relaxed text-slate-400">
          Pojok Baca Widya Pustaka · Balai Kota Among Tani, Kota Batu
        </p>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Fixed Sidebar */}
      <aside className="no-print hidden lg:block w-[260px] shrink-0 h-screen sticky top-0">
        {sidebarContent}
      </aside>

      {/* Mobile Drawer */}
      {isOpenMobile && (
        <div className="no-print fixed inset-0 z-50 lg:hidden flex">
          <div
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-[1px]"
            onClick={onCloseMobile}
            aria-hidden="true"
          />
          <div className="relative w-[272px] max-w-[85vw] h-full z-10 shadow-xl">
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
}

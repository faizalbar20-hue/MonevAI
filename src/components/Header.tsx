import { Calendar, CheckCircle2, RefreshCw, ServerCrash, Sparkles, Wifi, WifiOff } from 'lucide-react';
import { ConnectionHealth } from '../types/monev';
import { formatIndonesianDate } from '../utils/monevLogic';

interface HeaderProps {
  todayIso: string;
  health: ConnectionHealth;
  checkingHealth: boolean;
  onRefreshHealth: () => void;
}

export function Header({
  todayIso,
  health,
  checkingHealth,
  onRefreshHealth,
}: HeaderProps) {
  const formattedToday = formatIndonesianDate(todayIso, true);

  return (
    <header className="flex flex-col gap-4 border-b border-slate-200/80 px-5 py-4 sm:px-7 sm:py-5 md:flex-row md:items-center md:justify-between">
      {/* Zone 1: Brand mark & App Title */}
      <div className="flex items-center gap-3.5 min-w-0">
        <div
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#0F2147] to-[#2563EB] text-white shadow-sm shadow-blue-900/20"
          aria-hidden="true"
        >
          <Sparkles className="h-5 w-5" />
        </div>
        <div className="min-w-0">
          <h1 className="font-display text-xl font-bold tracking-tight text-[#0F2147] whitespace-nowrap">
            Auto Monev
          </h1>
          <p className="text-xs text-slate-500 truncate">
            Otomatisasi Laporan Absensi Harian
          </p>
        </div>
      </div>

      {/* Zone 2 & 3: Tanggal Hari Ini & Indikator Status Koneksi */}
      <div className="flex flex-wrap items-center gap-3 sm:gap-4">
        <div
          className="flex items-center gap-2 rounded-xl border border-slate-200/80 bg-white/80 px-3.5 py-2 text-sm text-[#0F2147]"
          aria-label={`Tanggal hari ini: ${formattedToday}`}
        >
          <Calendar className="h-4 w-4 text-blue-600 shrink-0" aria-hidden="true" />
          <span className="font-medium tabular-nums whitespace-nowrap">
            {formattedToday}
          </span>
        </div>

        <div className="flex items-center gap-2 rounded-xl border border-slate-200/80 bg-white/80 px-3.5 py-2">
          {health.serverOnline ? (
            <Wifi className="h-4 w-4 text-emerald-600 shrink-0" aria-hidden="true" />
          ) : (
            <WifiOff className="h-4 w-4 text-rose-600 shrink-0" aria-hidden="true" />
          )}
          <div className="flex items-center gap-2 text-xs font-medium">
            <span className={health.serverOnline ? 'text-emerald-700' : 'text-rose-700'}>
              {health.serverOnline ? 'Terhubung' : 'Koneksi Terputus'}
            </span>
            <span className="text-slate-300" aria-hidden="true">
              ·
            </span>
            <span
              className={`inline-flex items-center gap-1 ${
                health.aiReady ? 'text-[#0F2147]' : 'text-amber-700'
              }`}
              title={health.message}
            >
              {health.aiReady ? (
                <>
                  <CheckCircle2 className="h-3.5 w-3.5 text-blue-600" aria-hidden="true" />
                  <span>AI Siap</span>
                </>
              ) : (
                <>
                  <ServerCrash className="h-3.5 w-3.5 text-amber-600" aria-hidden="true" />
                  <span>AI Belum Aktif</span>
                </>
              )}
            </span>
          </div>
          <button
            type="button"
            onClick={onRefreshHealth}
            disabled={checkingHealth}
            aria-label="Periksa ulang status koneksi"
            className="ml-1 rounded-lg p-1 text-slate-400 transition-colors hover:bg-slate-100 hover:text-[#0F2147] focus-visible:outline-2 focus-visible:outline-blue-600 disabled:opacity-50"
          >
            <RefreshCw
              className={`h-3.5 w-3.5 ${checkingHealth ? 'animate-spin text-blue-600' : ''}`}
              aria-hidden="true"
            />
          </button>
        </div>
      </div>
    </header>
  );
}

import {
  AlertCircle,
  CheckCircle2,
  ChevronDown,
  Clock,
  FileText,
  LayoutGrid,
  List,
} from 'lucide-react';
import { MonevReport, ReportStatus } from '../types/monev';
import {
  INDONESIAN_MONTHS,
  formatShortIndonesianDate,
} from '../utils/monevLogic';

interface ReportHistoryProps {
  reports: MonevReport[];
  selectedMonth: string;
  selectedYear: string;
  selectedStatus: ReportStatus | 'all';
  availableYears: string[];
  viewMode: 'grid' | 'list';
  onMonthChange: (month: string) => void;
  onYearChange: (year: string) => void;
  onStatusChange: (status: ReportStatus | 'all') => void;
  onViewModeChange: (mode: 'grid' | 'list') => void;
  onResetFilters: () => void;
  onOpenReport: (report: MonevReport) => void;
}

function getStatusVisual(status: ReportStatus) {
  switch (status) {
    case 'Berhasil Dikirim':
      return {
        badge: 'border-emerald-200/80 bg-emerald-50 text-emerald-700',
        iconBg: 'bg-emerald-50 text-emerald-600',
        icon: CheckCircle2,
      };
    case 'Gagal Dikirim':
      return {
        badge: 'border-rose-200/80 bg-rose-50 text-rose-700',
        iconBg: 'bg-rose-50 text-rose-600',
        icon: AlertCircle,
      };
    case 'Menunggu Review':
      return {
        badge: 'border-blue-200/80 bg-blue-50 text-blue-700',
        iconBg: 'bg-blue-50 text-blue-600',
        icon: Clock,
      };
    case 'Draft':
    default:
      return {
        badge: 'border-slate-200 bg-slate-100 text-slate-700',
        iconBg: 'bg-slate-100 text-slate-600',
        icon: FileText,
      };
  }
}

export function ReportHistory({
  reports,
  selectedMonth,
  selectedYear,
  selectedStatus,
  availableYears,
  viewMode,
  onMonthChange,
  onYearChange,
  onStatusChange,
  onViewModeChange,
  onResetFilters,
  onOpenReport,
}: ReportHistoryProps) {
  return (
    <section aria-labelledby="heading-riwayat-absensi" className="mt-7">
      {/* Toolbar matching the reference layout: filters on left, view toggle on right */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h2
            id="heading-riwayat-absensi"
            className="font-display text-lg font-bold text-[#0F2147]"
          >
            Riwayat Absensi
          </h2>
          <p className="text-sm text-slate-500">
            Menampilkan <span className="font-semibold text-[#0F2147] tabular-nums">{reports.length}</span> laporan tersimpan
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Filter Bulan */}
          <div className="relative">
            <label htmlFor="filter-bulan" className="sr-only">
              Filter Bulan
            </label>
            <select
              id="filter-bulan"
              value={selectedMonth}
              onChange={(e) => onMonthChange(e.target.value)}
              className="appearance-none rounded-xl border border-slate-200/90 bg-white/95 py-2 pl-3.5 pr-9 text-xs sm:text-sm font-medium text-[#0F2147] shadow-xs transition-colors hover:border-blue-300 focus:border-blue-500 focus:outline-none focus:ring-3 focus:ring-blue-500/15"
            >
              <option value="all">Bulan: Semua</option>
              {INDONESIAN_MONTHS.map((name, index) => (
                <option key={name} value={String(index + 1)}>
                  Bulan: {name}
                </option>
              ))}
            </select>
            <ChevronDown
              className="pointer-events-none absolute right-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
              aria-hidden="true"
            />
          </div>

          {/* Filter Tahun */}
          <div className="relative">
            <label htmlFor="filter-tahun" className="sr-only">
              Filter Tahun
            </label>
            <select
              id="filter-tahun"
              value={selectedYear}
              onChange={(e) => onYearChange(e.target.value)}
              className="appearance-none rounded-xl border border-slate-200/90 bg-white/95 py-2 pl-3.5 pr-9 text-xs sm:text-sm font-medium text-[#0F2147] shadow-xs transition-colors hover:border-blue-300 focus:border-blue-500 focus:outline-none focus:ring-3 focus:ring-blue-500/15 tabular-nums"
            >
              <option value="all">Tahun: Semua</option>
              {availableYears.map((year) => (
                <option key={year} value={year}>
                  Tahun: {year}
                </option>
              ))}
            </select>
            <ChevronDown
              className="pointer-events-none absolute right-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
              aria-hidden="true"
            />
          </div>

          {/* Filter Status */}
          <div className="relative">
            <label htmlFor="filter-status" className="sr-only">
              Filter Status
            </label>
            <select
              id="filter-status"
              value={selectedStatus}
              onChange={(e) => onStatusChange(e.target.value as ReportStatus | 'all')}
              className="appearance-none rounded-xl border border-slate-200/90 bg-white/95 py-2 pl-3.5 pr-9 text-xs sm:text-sm font-medium text-[#0F2147] shadow-xs transition-colors hover:border-blue-300 focus:border-blue-500 focus:outline-none focus:ring-3 focus:ring-blue-500/15"
            >
              <option value="all">Status: Semua</option>
              <option value="Draft">Draft</option>
              <option value="Menunggu Review">Menunggu Review</option>
              <option value="Berhasil Dikirim">Berhasil Dikirim</option>
              <option value="Gagal Dikirim">Gagal Dikirim</option>
            </select>
            <ChevronDown
              className="pointer-events-none absolute right-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
              aria-hidden="true"
            />
          </div>

          {/* Grid / List View Switcher matching reference */}
          <div
            className="inline-flex items-center rounded-xl border border-slate-200/90 bg-white/95 p-1"
            role="group"
            aria-label="Tampilan riwayat"
          >
            <button
              type="button"
              onClick={() => onViewModeChange('grid')}
              aria-label="Tampilan kartu"
              aria-pressed={viewMode === 'grid'}
              className={`rounded-lg p-1.5 transition-colors ${
                viewMode === 'grid'
                  ? 'bg-[#0F2147] text-white'
                  : 'text-slate-500 hover:text-[#0F2147]'
              }`}
            >
              <LayoutGrid className="h-4 w-4" aria-hidden="true" />
            </button>
            <button
              type="button"
              onClick={() => onViewModeChange('list')}
              aria-label="Tampilan daftar"
              aria-pressed={viewMode === 'list'}
              className={`rounded-lg p-1.5 transition-colors ${
                viewMode === 'list'
                  ? 'bg-[#0F2147] text-white'
                  : 'text-slate-500 hover:text-[#0F2147]'
              }`}
            >
              <List className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>
        </div>
      </div>

      {/* Empty State */}
      {reports.length === 0 ? (
        <div className="glass-card mt-5 rounded-2xl border border-slate-200/80 px-6 py-12 text-center">
          <p className="font-display text-base font-semibold text-[#0F2147]">
            Tidak ada laporan untuk periode ini
          </p>
          <p className="mt-1 text-sm text-slate-500">
            Ubah filter bulan, tahun, atau status untuk melihat riwayat laporan absensi lainnya.
          </p>
          <button
            type="button"
            onClick={onResetFilters}
            className="mt-4 inline-flex items-center rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-[#0F2147] transition-colors hover:border-blue-300 hover:bg-blue-50"
          >
            Reset Filter
          </button>
        </div>
      ) : viewMode === 'grid' ? (
        /* 3-Column Card Grid matching Reference Image */
        <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {reports.map((report) => {
            const visual = getStatusVisual(report.status);
            const StatusIcon = visual.icon;
            const titleText =
              report.activities[0] || 'Laporan Absensi Harian Monev';

            return (
              <article
                key={report.id}
                className="glass-card flex flex-col justify-between rounded-2xl border border-slate-200/80 p-5"
              >
                <div>
                  {/* Card Top: Icon mark + Status */}
                  <div className="flex items-start justify-between gap-3">
                    <div
                      className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${visual.iconBg}`}
                      aria-hidden="true"
                    >
                      <StatusIcon className="h-5 w-5" />
                    </div>

                    <span
                      className={`inline-flex items-center rounded-lg border px-2.5 py-1 text-xs font-semibold whitespace-nowrap ${visual.badge}`}
                    >
                      {report.status}
                    </span>
                  </div>

                  {/* Card Title & Preview */}
                  <h3 className="mt-3.5 font-display text-base font-bold leading-snug text-[#0F2147] line-clamp-1">
                    {titleText}
                  </h3>
                  <p className="mt-1.5 text-xs leading-relaxed text-slate-500 line-clamp-2">
                    {report.sections.deskripsiKegiatan}
                  </p>

                  {/* 3-Column Metadata Structure (matching Tasks | Budget | Due on from reference) */}
                  <div className="mt-4 grid grid-cols-3 gap-2 border-t border-slate-100 pt-3.5 text-xs">
                    <div>
                      <p className="text-slate-400">Tanggal</p>
                      <p className="mt-0.5 font-semibold text-[#0F2147] tabular-nums">
                        {formatShortIndonesianDate(report.reportDate)}
                      </p>
                    </div>
                    <div>
                      <p className="text-slate-400">Kegiatan</p>
                      <p className="mt-0.5 font-semibold text-[#0F2147] tabular-nums">
                        {report.activities.length} item
                      </p>
                    </div>
                    <div>
                      <p className="text-slate-400">Tinjauan</p>
                      <p className="mt-0.5 font-semibold text-[#0F2147]">
                        {report.userApproved ? 'Disetujui' : 'Belum'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Open Detail Action */}
                <div className="mt-4 pt-1">
                  <button
                    type="button"
                    onClick={() => onOpenReport(report)}
                    aria-label={`Buka detail laporan tanggal ${formatShortIndonesianDate(report.reportDate)}`}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50/70 px-3.5 py-2 text-xs font-semibold text-[#0F2147] transition-colors hover:border-blue-300 hover:bg-blue-50/70 focus-visible:outline-2 focus-visible:outline-blue-600"
                  >
                    Buka Detail Laporan
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      ) : (
        /* Clean Compact List View */
        <div className="glass-card mt-5 overflow-hidden rounded-2xl border border-slate-200/80">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200/80 bg-slate-50/80 text-xs font-semibold text-slate-500">
                  <th className="px-4 py-3">Tanggal</th>
                  <th className="px-4 py-3">Ringkasan Kegiatan</th>
                  <th className="px-4 py-3 text-right">Item</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {reports.map((report) => {
                  const visual = getStatusVisual(report.status);
                  return (
                    <tr
                      key={report.id}
                      className="transition-colors hover:bg-blue-50/35"
                    >
                      <td className="px-4 py-3 font-medium text-[#0F2147] tabular-nums whitespace-nowrap">
                        {formatShortIndonesianDate(report.reportDate)}
                      </td>
                      <td className="px-4 py-3 text-slate-600 max-w-md truncate">
                        {report.sections.deskripsiKegiatan}
                      </td>
                      <td className="px-4 py-3 text-right font-medium text-[#0F2147] tabular-nums">
                        {report.activities.length}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center rounded-lg border px-2.5 py-0.5 text-xs font-semibold ${visual.badge}`}
                        >
                          {report.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => onOpenReport(report)}
                          className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-[#0F2147] transition-colors hover:border-blue-300 hover:bg-blue-50"
                        >
                          Buka Detail
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </section>
  );
}

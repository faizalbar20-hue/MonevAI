import { useEffect } from 'react';
import {
  AlertCircle,
  Calendar,
  CheckCircle2,
  Clock,
  FileEdit,
  FileText,
  X,
} from 'lucide-react';
import { MonevReport } from '../types/monev';
import { formatIndonesianDate } from '../utils/monevLogic';

interface ReportDetailModalProps {
  report: MonevReport | null;
  onClose: () => void;
  onLoadIntoEditor: (report: MonevReport) => void;
}

export function ReportDetailModal({
  report,
  onClose,
  onLoadIntoEditor,
}: ReportDetailModalProps) {
  useEffect(() => {
    if (!report) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [report, onClose]);

  if (!report) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#0F2147]/35 p-4 backdrop-blur-xs"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-report-title"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl shadow-blue-950/20"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-start justify-between gap-4 border-b border-slate-100 pb-4">
          <div>
            <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
              <span className="inline-flex items-center gap-1.5 font-medium text-[#0F2147]">
                <Calendar className="h-3.5 w-3.5 text-blue-600" aria-hidden="true" />
                {formatIndonesianDate(report.reportDate, true)}
              </span>
              <span aria-hidden="true">·</span>
              <span className="font-semibold text-blue-700">{report.status}</span>
            </div>
            <h3
              id="modal-report-title"
              className="mt-1.5 font-display text-lg font-bold text-[#0F2147]"
            >
              Detail Laporan Absensi Monev
            </h3>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup detail laporan"
            className="rounded-xl p-2 text-slate-400 transition-colors hover:bg-slate-100 hover:text-[#0F2147] focus-visible:outline-2 focus-visible:outline-blue-600"
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>

        {/* Server Status / Confirmation Note */}
        {report.serverNote && (
          <div
            className={`mt-4 flex items-start gap-2.5 rounded-xl border px-3.5 py-2.5 text-xs font-medium ${
              report.status === 'Berhasil Dikirim'
                ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
                : report.status === 'Gagal Dikirim'
                  ? 'border-rose-200 bg-rose-50 text-rose-800'
                  : 'border-blue-200 bg-blue-50 text-blue-800'
            }`}
          >
            {report.status === 'Berhasil Dikirim' ? (
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
            ) : report.status === 'Gagal Dikirim' ? (
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
            ) : (
              <Clock className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
            )}
            <span>{report.serverNote}</span>
          </div>
        )}

        {/* Activities List */}
        <div className="mt-5">
          <h4 className="text-xs font-semibold text-slate-500">
            Kegiatan yang Dilakukan ({report.activities.length})
          </h4>
          <ul className="mt-2 space-y-1.5">
            {report.activities.map((act, index) => (
              <li
                key={`${report.id}-act-${index}`}
                className="flex items-start gap-2 rounded-xl border border-slate-100 bg-slate-50/70 px-3 py-2 text-sm text-[#0F2147]"
              >
                <FileText className="mt-0.5 h-4 w-4 shrink-0 text-blue-600" aria-hidden="true" />
                <span>{act}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Report Sections */}
        <div className="mt-5 space-y-4">
          <div>
            <h4 className="text-xs font-semibold text-slate-500">
              1. Deskripsi Kegiatan
            </h4>
            <p className="mt-1 rounded-xl border border-slate-100 bg-white p-3.5 text-sm leading-relaxed text-[#0F2147]">
              {report.sections.deskripsiKegiatan}
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <h4 className="text-xs font-semibold text-slate-500">
                2. Pembelajaran yang Didapat
              </h4>
              <p className="mt-1 rounded-xl border border-slate-100 bg-white p-3.5 text-sm leading-relaxed text-[#0F2147]">
                {report.sections.pembelajaran}
              </p>
            </div>
            <div>
              <h4 className="text-xs font-semibold text-slate-500">
                3. Kendala yang Dialami
              </h4>
              <p className="mt-1 rounded-xl border border-slate-100 bg-white p-3.5 text-sm leading-relaxed text-[#0F2147]">
                {report.sections.kendala}
              </p>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="mt-6 flex flex-wrap items-center justify-end gap-2.5 border-t border-slate-100 pt-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs sm:text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50"
          >
            Tutup
          </button>

          {report.status !== 'Berhasil Dikirim' && (
            <button
              type="button"
              onClick={() => onLoadIntoEditor(report)}
              className="inline-flex items-center gap-1.5 rounded-xl bg-[#0F2147] px-4 py-2 text-xs sm:text-sm font-semibold text-white transition-colors hover:bg-[#1A356B]"
            >
              <FileEdit className="h-4 w-4" aria-hidden="true" />
              <span>Muat ke Editor untuk Tinjau</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

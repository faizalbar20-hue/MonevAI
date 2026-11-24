import {
  AlertCircle,
  CheckCircle2,
  Clock,
  FileCheck2,
  Loader2,
  RefreshCw,
  Save,
  Send,
} from 'lucide-react';
import { GeneratedReportSections, ReportStatus } from '../types/monev';
import { formatShortIndonesianDate } from '../utils/monevLogic';

interface ReportEditorProps {
  reportDate: string;
  sections: GeneratedReportSections;
  status: ReportStatus;
  userApproved: boolean;
  isGenerating: boolean;
  isSubmitting: boolean;
  feedback: { type: 'success' | 'error' | 'info'; message: string } | null;
  onChangeSection: (field: keyof GeneratedReportSections, value: string) => void;
  onToggleApproval: (approved: boolean) => void;
  onRegenerate: () => void;
  onSaveDraft: () => void;
  onConfirmSubmit: () => void;
}

function getStatusBadgeStyle(status: ReportStatus): {
  textClass: string;
  bgClass: string;
  icon: typeof CheckCircle2;
} {
  switch (status) {
    case 'Berhasil Dikirim':
      return {
        textClass: 'text-emerald-700',
        bgClass: 'bg-emerald-50 border-emerald-200/80',
        icon: CheckCircle2,
      };
    case 'Gagal Dikirim':
      return {
        textClass: 'text-rose-700',
        bgClass: 'bg-rose-50 border-rose-200/80',
        icon: AlertCircle,
      };
    case 'Menunggu Review':
      return {
        textClass: 'text-blue-700',
        bgClass: 'bg-blue-50 border-blue-200/80',
        icon: Clock,
      };
    case 'Draft':
    default:
      return {
        textClass: 'text-slate-700',
        bgClass: 'bg-slate-100 border-slate-200/80',
        icon: FileCheck2,
      };
  }
}

export function ReportEditor({
  reportDate,
  sections,
  status,
  userApproved,
  isGenerating,
  isSubmitting,
  feedback,
  onChangeSection,
  onToggleApproval,
  onRegenerate,
  onSaveDraft,
  onConfirmSubmit,
}: ReportEditorProps) {
  const statusMeta = getStatusBadgeStyle(status);
  const StatusIcon = statusMeta.icon;

  return (
    <section
      aria-labelledby="heading-report-editor"
      className="glass-card flex flex-col justify-between rounded-2xl border border-slate-200/80 p-5 sm:p-6"
    >
      <div>
        {/* Card Header */}
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2
              id="heading-report-editor"
              className="font-display text-lg font-bold text-[#0F2147]"
            >
              Hasil Laporan AI &amp; Review
            </h2>
            <p className="mt-0.5 text-sm text-slate-500">
              Tinjau dan sunting langsung tiga bagian laporan untuk tanggal{' '}
              <span className="font-medium text-[#0F2147] tabular-nums">
                {formatShortIndonesianDate(reportDate)}
              </span>
              .
            </p>
          </div>

          <div
            className={`inline-flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-semibold ${statusMeta.bgClass} ${statusMeta.textClass}`}
          >
            <StatusIcon className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
            <span>{status}</span>
          </div>
        </div>

        {/* Processing / Feedback Banner */}
        {isGenerating ? (
          <div
            role="status"
            aria-live="polite"
            className="mt-4 flex items-center gap-2.5 rounded-xl border border-blue-200 bg-blue-50 px-3.5 py-3 text-xs font-medium text-blue-900"
          >
            <Loader2 className="h-4 w-4 shrink-0 animate-spin text-blue-600" aria-hidden="true" />
            <p className="leading-relaxed">
              Sedang memproses aktivitas terpilih dan menyusun laporan dengan OpenAI AI...
            </p>
          </div>
        ) : (
          feedback && (
            <div
              role={feedback.type === 'error' ? 'alert' : 'status'}
              className={`mt-4 flex items-start gap-2.5 rounded-xl border px-3.5 py-3 text-xs font-medium ${
                feedback.type === 'error'
                  ? 'border-rose-200 bg-rose-50 text-rose-800'
                  : feedback.type === 'success'
                    ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
                    : 'border-blue-200 bg-blue-50 text-blue-900'
              }`}
            >
              {feedback.type === 'error' ? (
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-rose-600" aria-hidden="true" />
              ) : (
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-blue-600" aria-hidden="true" />
              )}
              <p className="leading-relaxed">{feedback.message}</p>
            </div>
          )
        )}

        {/* Three Editable Report Sections */}
        <div className="mt-5 space-y-4">
          <div>
            <div className="mb-1.5 flex items-center justify-between gap-2">
              <label
                htmlFor="field-deskripsi"
                className="text-sm font-semibold text-[#0F2147]"
              >
                1. Deskripsi Kegiatan
              </label>
              <span className="text-xs text-slate-400 tabular-nums whitespace-nowrap shrink-0">
                {sections.deskripsiKegiatan.length} karakter
              </span>
            </div>
            <textarea
              id="field-deskripsi"
              rows={4}
              value={sections.deskripsiKegiatan}
              onChange={(e) => onChangeSection('deskripsiKegiatan', e.target.value)}
              disabled={isGenerating}
              placeholder="Hasil ringkasan kegiatan harian akan muncul di sini setelah klik Generate Laporan, atau dapat ditulis langsung..."
              className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm leading-relaxed text-[#0F2147] placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-3 focus:ring-blue-500/15 disabled:bg-slate-50"
            />
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <div className="mb-1.5 flex items-center justify-between gap-2">
                <label
                  htmlFor="field-pembelajaran"
                  className="text-sm font-semibold text-[#0F2147]"
                >
                  2. Pembelajaran yang Didapat
                </label>
                <span className="text-xs text-slate-400 tabular-nums whitespace-nowrap shrink-0">
                  {sections.pembelajaran.length} karakter
                </span>
              </div>
              <textarea
                id="field-pembelajaran"
                rows={5}
                value={sections.pembelajaran}
                onChange={(e) => onChangeSection('pembelajaran', e.target.value)}
                disabled={isGenerating}
                placeholder="Wawasan atau evaluasi proses yang dipelajari dari kegiatan hari ini..."
                className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm leading-relaxed text-[#0F2147] placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-3 focus:ring-blue-500/15 disabled:bg-slate-50"
              />
            </div>

            <div>
              <div className="mb-1.5 flex items-center justify-between gap-2">
                <label
                  htmlFor="field-kendala"
                  className="text-sm font-semibold text-[#0F2147]"
                >
                  3. Kendala yang Dialami
                </label>
                <span className="text-xs text-slate-400 tabular-nums whitespace-nowrap shrink-0">
                  {sections.kendala.length} karakter
                </span>
              </div>
              <textarea
                id="field-kendala"
                rows={5}
                value={sections.kendala}
                onChange={(e) => onChangeSection('kendala', e.target.value)}
                disabled={isGenerating}
                placeholder="Kendala relevan yang ditemui selama menjalankan kegiatan..."
                className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm leading-relaxed text-[#0F2147] placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-3 focus:ring-blue-500/15 disabled:bg-slate-50"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Review & Approval Controls */}
      <div className="mt-5 border-t border-slate-100 pt-4 space-y-4">
        <div className="rounded-xl border border-blue-200/70 bg-blue-50/50 px-3.5 py-3">
          <label
            htmlFor="approval-checkbox"
            className="flex cursor-pointer items-start gap-3 text-xs sm:text-sm text-[#0F2147]"
          >
            <input
              id="approval-checkbox"
              type="checkbox"
              checked={userApproved}
              onChange={(e) => onToggleApproval(e.target.checked)}
              className="mt-0.5 h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-600"
            />
            <span className="leading-snug">
              Saya telah meninjau seluruh isi laporan (deskripsi, pembelajaran, dan kendala) dan menyetujui pengiriman laporan ke sistem Monev.
            </span>
          </label>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2.5">
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              onClick={onRegenerate}
              disabled={isGenerating || isSubmitting}
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs sm:text-sm font-semibold text-[#0F2147] transition-colors hover:border-blue-300 hover:bg-blue-50/60 focus-visible:outline-2 focus-visible:outline-blue-600 disabled:opacity-50 whitespace-nowrap"
            >
              <RefreshCw
                className={`h-4 w-4 text-blue-600 ${isGenerating ? 'animate-spin' : ''}`}
                aria-hidden="true"
              />
              <span>Generate Ulang</span>
            </button>

            <button
              type="button"
              onClick={onSaveDraft}
              disabled={isGenerating || isSubmitting}
              className="inline-flex items-center gap-1.5 rounded-xl border border-blue-200 bg-blue-50/80 px-4 py-2.5 text-xs sm:text-sm font-semibold text-[#0F2147] transition-colors hover:bg-blue-100 focus-visible:outline-2 focus-visible:outline-blue-600 disabled:opacity-50 whitespace-nowrap"
            >
              <Save className="h-4 w-4 text-blue-700" aria-hidden="true" />
              <span>Simpan Draft</span>
            </button>
          </div>

          <button
            type="button"
            onClick={onConfirmSubmit}
            disabled={isGenerating || isSubmitting}
            className="inline-flex items-center gap-2 rounded-xl bg-[#0F2147] px-5 py-2.5 text-xs sm:text-sm font-semibold text-white shadow-sm shadow-blue-950/15 transition-colors hover:bg-[#1A356B] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 disabled:cursor-not-allowed disabled:opacity-50 whitespace-nowrap"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                <span>Mengirim ke Server...</span>
              </>
            ) : (
              <>
                <Send className="h-4 w-4" aria-hidden="true" />
                <span>Konfirmasi dan Kirim</span>
              </>
            )}
          </button>
        </div>
      </div>
    </section>
  );
}

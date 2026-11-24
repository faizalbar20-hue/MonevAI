import { useState, FormEvent } from 'react';
import {
  Check,
  Loader2,
  Plus,
  RefreshCw,
  Sparkles,
  Trash2,
} from 'lucide-react';
import { ActivityItem } from '../types/monev';
import { formatShortIndonesianDate } from '../utils/monevLogic';

interface ActivityAssistantProps {
  activities: ActivityItem[];
  onToggleActivity: (id: string) => void;
  onAddActivity: (label: string) => void;
  onDeleteActivity: (id: string) => void;
  onRefreshRecommendations: () => void;
  onGenerateReport: () => void;
  isRecommending: boolean;
  isGenerating: boolean;
  validationError: string | null;
}

export function ActivityAssistant({
  activities,
  onToggleActivity,
  onAddActivity,
  onDeleteActivity,
  onRefreshRecommendations,
  onGenerateReport,
  isRecommending,
  isGenerating,
  validationError,
}: ActivityAssistantProps) {
  const [manualInput, setManualInput] = useState('');
  const [inputError, setInputError] = useState<string | null>(null);

  const selectedCount = activities.filter((a) => a.selected).length;

  const handleSubmitManual = (e: FormEvent) => {
    e.preventDefault();
    const trimmed = manualInput.trim();
    if (!trimmed) {
      setInputError('Tuliskan deskripsi kegiatan terlebih dahulu.');
      return;
    }
    if (trimmed.length < 4) {
      setInputError('Deskripsi kegiatan minimal 4 karakter.');
      return;
    }
    setInputError(null);
    onAddActivity(trimmed);
    setManualInput('');
  };

  return (
    <section
      aria-labelledby="heading-ai-assistant"
      className="glass-card flex flex-col justify-between rounded-2xl border border-slate-200/80 p-5 sm:p-6"
    >
      <div>
        {/* Section Header */}
        <div>
          <div className="flex items-center justify-between gap-2">
            <h2
              id="heading-ai-assistant"
              className="font-display text-lg font-bold text-[#0F2147]"
            >
              AI Assistant Kegiatan
            </h2>

            <button
              type="button"
              onClick={onRefreshRecommendations}
              disabled={isRecommending || isGenerating}
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-[#0F2147] transition-colors hover:border-blue-300 hover:bg-blue-50/60 focus-visible:outline-2 focus-visible:outline-blue-600 disabled:opacity-50 whitespace-nowrap shrink-0"
            >
              <RefreshCw
                className={`h-3.5 w-3.5 text-blue-600 ${isRecommending ? 'animate-spin' : ''}`}
                aria-hidden="true"
              />
              <span>{isRecommending ? 'Memuat...' : 'Rekomendasi AI'}</span>
            </button>
          </div>
          <p className="mt-1 text-sm text-slate-500">
            Pilih atau tambahkan kegiatan yang benar-benar dikerjakan hari ini.
          </p>
        </div>

        {/* Manual Input Form */}
        <form onSubmit={handleSubmitManual} className="mt-4">
          <label
            htmlFor="manual-activity-input"
            className="block text-xs font-medium text-slate-600 mb-1.5"
          >
            Tambah kegiatan manual
          </label>
          <div className="flex gap-2">
            <input
              id="manual-activity-input"
              type="text"
              value={manualInput}
              onChange={(e) => {
                setManualInput(e.target.value);
                if (inputError) setInputError(null);
              }}
              placeholder="Contoh: Finalisasi dokumen evaluasi triwulan IV"
              className="min-w-0 flex-1 rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-[#0F2147] placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-3 focus:ring-blue-500/15"
            />
            <button
              type="submit"
              className="inline-flex items-center gap-1.5 rounded-xl bg-[#0F2147] px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#1A356B] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 whitespace-nowrap shrink-0"
            >
              <Plus className="h-4 w-4" aria-hidden="true" />
              <span>Tambah</span>
            </button>
          </div>
          {inputError && (
            <p className="mt-1.5 text-xs font-medium text-rose-600" role="alert">
              {inputError}
            </p>
          )}
        </form>

        {/* Activity List */}
        <div className="mt-5">
          <div className="mb-2.5 flex items-center justify-between text-xs text-slate-500">
            <span className="font-medium text-[#0F2147]">
              Daftar Kegiatan ({activities.length})
            </span>
            <span className="tabular-nums font-semibold text-blue-700">
              {selectedCount} dipilih untuk laporan
            </span>
          </div>

          {activities.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50/70 px-4 py-8 text-center">
              <p className="text-sm font-medium text-slate-600">
                Belum ada daftar kegiatan.
              </p>
              <p className="mt-1 text-xs text-slate-500">
                Tambahkan kegiatan secara manual di atas atau muat rekomendasi AI dari riwayat.
              </p>
            </div>
          ) : (
            <ul
              className="space-y-2.5 max-h-[340px] overflow-y-auto pr-1"
              aria-label="Daftar kegiatan harian"
            >
              {activities.map((item) => {
                const checkboxId = `activity-check-${item.id}`;
                return (
                  <li
                    key={item.id}
                    className={`group flex items-start justify-between gap-3 rounded-xl border px-3.5 py-3 transition-colors ${
                      item.selected
                        ? 'border-blue-300/90 bg-blue-50/55'
                        : 'border-slate-200/80 bg-white hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-start gap-3 min-w-0 flex-1">
                      <div className="pt-0.5">
                        <input
                          id={checkboxId}
                          type="checkbox"
                          checked={item.selected}
                          onChange={() => onToggleActivity(item.id)}
                          className="sr-only"
                        />
                        <label
                          htmlFor={checkboxId}
                          aria-label={`Pilih kegiatan: ${item.label}`}
                          className={`flex h-5 w-5 cursor-pointer items-center justify-center rounded-md border transition-colors ${
                            item.selected
                              ? 'border-blue-600 bg-blue-600 text-white'
                              : 'border-slate-300 bg-white text-transparent hover:border-blue-400'
                          }`}
                        >
                          <Check className="h-3.5 w-3.5 stroke-[2.75]" aria-hidden="true" />
                        </label>
                      </div>

                      <label
                        htmlFor={checkboxId}
                        className="min-w-0 flex-1 cursor-pointer"
                      >
                        <p
                          className={`text-sm leading-snug ${
                            item.selected
                              ? 'font-medium text-[#0F2147]'
                              : 'text-slate-700'
                          }`}
                        >
                          {item.label}
                        </p>
                        <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-slate-500">
                          <span
                            className={
                              item.source === 'manual'
                                ? 'font-medium text-slate-600'
                                : 'font-medium text-blue-700'
                            }
                          >
                            {item.source === 'manual'
                              ? 'Input Manual'
                              : 'Rekomendasi AI'}
                          </span>
                          <span className="text-slate-300" aria-hidden="true">
                            ·
                          </span>
                          <span>{item.category}</span>
                          {item.lastUsedDate && (
                            <span className="tabular-nums text-slate-400">
                              ({formatShortIndonesianDate(item.lastUsedDate)})
                            </span>
                          )}
                        </div>
                      </label>
                    </div>

                    <button
                      type="button"
                      onClick={() => onDeleteActivity(item.id)}
                      aria-label={`Hapus kegiatan: ${item.label}`}
                      className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-rose-50 hover:text-rose-600 focus-visible:outline-2 focus-visible:outline-rose-600 shrink-0"
                    >
                      <Trash2 className="h-4 w-4" aria-hidden="true" />
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>

      {/* Validation & Primary Generate CTA */}
      <div className="mt-5 border-t border-slate-100 pt-4">
        {validationError && (
          <p
            className="mb-3 rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-2.5 text-xs font-medium text-rose-700"
            role="alert"
          >
            {validationError}
          </p>
        )}

        <button
          type="button"
          onClick={onGenerateReport}
          disabled={isGenerating}
          className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#0F2147] to-[#2563EB] px-5 py-3 text-sm font-semibold text-white shadow-md shadow-blue-700/15 transition-all hover:brightness-110 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isGenerating ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
              <span>Menyusun Laporan dengan AI...</span>
            </>
          ) : (
            <>
              <Sparkles className="h-4 w-4" aria-hidden="true" />
              <span>Generate Laporan</span>
            </>
          )}
        </button>
      </div>
    </section>
  );
}

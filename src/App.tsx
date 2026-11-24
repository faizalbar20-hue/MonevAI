import { useCallback, useEffect, useMemo, useState } from 'react';
import { Header } from './components/Header';
import { ActivityAssistant } from './components/ActivityAssistant';
import { ReportEditor } from './components/ReportEditor';
import { ReportHistory } from './components/ReportHistory';
import { ReportDetailModal } from './components/ReportDetailModal';
import {
  ActivityItem,
  ConnectionHealth,
  GeneratedReportSections,
  MonevReport,
  ReportStatus,
} from './types/monev';
import {
  canSubmitReport,
  deriveRecommendedActivities,
  filterReports,
  getAvailableYears,
  getTodayIsoDate,
  inferActivityCategory,
  validateActivitiesSelection,
} from './utils/monevLogic';
import { reportRepository } from './services/reportRepository';
import {
  fetchConnectionHealth,
  requestGenerateReport,
  requestRecommendActivities,
  submitReportToMonevServer,
} from './services/apiClient';

const EMPTY_SECTIONS: GeneratedReportSections = {
  deskripsiKegiatan: '',
  pembelajaran: '',
  kendala: '',
};

export default function App() {
  const todayIso = useMemo(() => getTodayIsoDate(), []);
  const currentYear = useMemo(() => todayIso.slice(0, 4), [todayIso]);

  const [reports, setReports] = useState<MonevReport[]>(() =>
    reportRepository.getAll()
  );
  const [activities, setActivities] = useState<ActivityItem[]>(() =>
    deriveRecommendedActivities(reportRepository.getAll(), 6)
  );

  // Active report workspace state
  const [activeReportId, setActiveReportId] = useState<string>(
    () => `rep-${todayIso}-${Math.random().toString(36).slice(2, 6)}`
  );
  const [activeDate, setActiveDate] = useState<string>(todayIso);
  const [sections, setSections] = useState<GeneratedReportSections>(EMPTY_SECTIONS);
  const [reportStatus, setReportStatus] = useState<ReportStatus>('Draft');
  const [userApproved, setUserApproved] = useState<boolean>(false);

  // Async & feedback states
  const [health, setHealth] = useState<ConnectionHealth>({
    serverOnline: true,
    aiReady: false,
    monevPortalConfigured: false,
    checkedAt: '',
    message: 'Memeriksa koneksi server...',
  });
  const [checkingHealth, setCheckingHealth] = useState<boolean>(false);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [isRecommending, setIsRecommending] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [activityValidationError, setActivityValidationError] = useState<
    string | null
  >(null);
  const [editorFeedback, setEditorFeedback] = useState<{
    type: 'success' | 'error' | 'info';
    message: string;
  } | null>(null);

  // History filter & detail modal states
  const [selectedMonth, setSelectedMonth] = useState<string>('all');
  const [selectedYear, setSelectedYear] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<ReportStatus | 'all'>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [inspectedReport, setInspectedReport] = useState<MonevReport | null>(null);

  const checkHealth = useCallback(async () => {
    setCheckingHealth(true);
    const result = await fetchConnectionHealth();
    setHealth(result);
    setCheckingHealth(false);
  }, []);

  useEffect(() => {
    void checkHealth();
  }, [checkHealth]);

  const availableYears = useMemo(
    () => getAvailableYears(reports, currentYear),
    [reports, currentYear]
  );

  const filteredReports = useMemo(
    () =>
      filterReports(reports, {
        month: selectedMonth,
        year: selectedYear,
        status: selectedStatus,
      }),
    [reports, selectedMonth, selectedYear, selectedStatus]
  );

  const handleToggleActivity = (id: string) => {
    setActivityValidationError(null);
    setActivities((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, selected: !item.selected } : item
      )
    );
  };

  const handleAddActivity = (label: string) => {
    setActivityValidationError(null);
    const newItem: ActivityItem = {
      id: `manual-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      label,
      category: inferActivityCategory(label),
      source: 'manual',
      selected: true,
    };
    setActivities((prev) => [newItem, ...prev]);
  };

  const handleDeleteActivity = (id: string) => {
    setActivities((prev) => prev.filter((item) => item.id !== id));
  };

  const handleRefreshRecommendations = async () => {
    setIsRecommending(true);
    setActivityValidationError(null);
    try {
      const existingLabels = activities.map((a) => a.label);
      const recs = await requestRecommendActivities({
        previousReports: reports,
        existingLabels,
      });

      const existingLower = new Set(existingLabels.map((l) => l.trim().toLowerCase()));
      const newItems: ActivityItem[] = recs
        .filter((r) => r.label.trim() && !existingLower.has(r.label.trim().toLowerCase()))
        .map((r, idx) => ({
          id: `ai-${Date.now()}-${idx}`,
          label: r.label.trim(),
          category: r.category || inferActivityCategory(r.label),
          source: 'ai',
          selected: false,
        }));

      if (newItems.length > 0) {
        setActivities((prev) => [...prev, ...newItems]);
        setEditorFeedback({
          type: 'info',
          message: `${newItems.length} rekomendasi kegiatan baru ditambahkan dari AI berdasarkan riwayat pekerjaan.`,
        });
      } else {
        setEditorFeedback({
          type: 'info',
          message: 'Tidak ada rekomendasi baru yang berbeda dari daftar saat ini.',
        });
      }
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : 'Tidak dapat memuat rekomendasi AI.';
      setActivityValidationError(message);
    } finally {
      setIsRecommending(false);
    }
  };

  const runGenerateReport = async (isRegenerate: boolean) => {
    const validation = validateActivitiesSelection(activities);
    if (!validation.valid) {
      setActivityValidationError(validation.error || 'Pilih minimal satu kegiatan.');
      return;
    }

    setActivityValidationError(null);
    setEditorFeedback(null);
    setIsGenerating(true);

    try {
      const generated = await requestGenerateReport({
        reportDate: activeDate,
        selectedActivities: validation.selected.map((a) => a.label),
        previousReports: reports.filter((r) => r.id !== activeReportId),
        previousDraft: isRegenerate ? sections : undefined,
        isRegenerate,
      });

      setSections(generated);
      setReportStatus('Menunggu Review');
      setUserApproved(false);
      setEditorFeedback({
        type: 'success',
        message: isRegenerate
          ? 'Berhasil menghasilkan laporan ulang dengan variasi kalimat baru. Silakan tinjau sebelum mengirim.'
          : 'Berhasil menghasilkan laporan. Anda dapat mengedit ketiga bagian laporan sebelum menyetujui pengiriman.',
      });
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : 'Terjadi kesalahan saat menghubungi layanan AI.';
      setEditorFeedback({
        type: 'error',
        message: `Gagal menghasilkan laporan: ${message}`,
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleChangeSection = (
    field: keyof GeneratedReportSections,
    value: string
  ) => {
    setSections((prev) => ({ ...prev, [field]: value }));
    if (reportStatus === 'Berhasil Dikirim' || reportStatus === 'Gagal Dikirim') {
      setReportStatus('Menunggu Review');
    }
    if (userApproved) {
      setUserApproved(false);
    }
  };

  const persistReport = (
    targetStatus: ReportStatus,
    approved: boolean,
    serverNote?: string,
    submittedAt?: string
  ): MonevReport => {
    const selectedLabels = activities
      .filter((a) => a.selected)
      .map((a) => a.label);
    const nowIso = new Date().toISOString();
    const existing = reports.find((r) => r.id === activeReportId);

    const report: MonevReport = {
      id: activeReportId,
      reportDate: activeDate,
      activities:
        selectedLabels.length > 0
          ? selectedLabels
          : existing?.activities ?? ['Kegiatan harian Monev'],
      sections: {
        deskripsiKegiatan: sections.deskripsiKegiatan.trim(),
        pembelajaran: sections.pembelajaran.trim(),
        kendala: sections.kendala.trim(),
      },
      status: targetStatus,
      userApproved: approved,
      serverNote,
      createdAt: existing?.createdAt ?? nowIso,
      updatedAt: nowIso,
      submittedAt,
    };

    const nextReports = reportRepository.upsert(report);
    setReports(nextReports);
    setReportStatus(targetStatus);
    return report;
  };

  const handleSaveDraft = () => {
    if (
      !sections.deskripsiKegiatan.trim() &&
      !sections.pembelajaran.trim() &&
      !sections.kendala.trim()
    ) {
      setEditorFeedback({
        type: 'error',
        message:
          'Isi minimal salah satu bagian laporan atau klik Generate Laporan sebelum menyimpan draft.',
      });
      return;
    }

    persistReport('Draft', false, 'Disimpan sebagai draft lokal oleh pengguna.');
    setUserApproved(false);
    setEditorFeedback({
      type: 'success',
      message: 'Laporan berhasil disimpan sebagai Draft di Riwayat Absensi.',
    });
  };

  const handleConfirmSubmit = async () => {
    const submitCheck = canSubmitReport(sections, userApproved);
    if (!submitCheck.valid) {
      setEditorFeedback({
        type: 'error',
        message: submitCheck.error || 'Laporan belum siap dikirim.',
      });
      return;
    }

    setIsSubmitting(true);
    setEditorFeedback(null);

    const selectedLabels = activities
      .filter((a) => a.selected)
      .map((a) => a.label);

    const response = await submitReportToMonevServer({
      reportId: activeReportId,
      reportDate: activeDate,
      activities: selectedLabels,
      sections,
      userApproved,
    });

    persistReport(
      response.status,
      true,
      response.message,
      response.submittedAt
    );

    setEditorFeedback({
      type: response.ok ? 'success' : 'error',
      message: response.message,
    });
    setIsSubmitting(false);
  };

  const handleLoadIntoEditor = (report: MonevReport) => {
    setActiveReportId(report.id);
    setActiveDate(report.reportDate);
    setSections({ ...report.sections });
    setReportStatus(report.status === 'Gagal Dikirim' ? 'Menunggu Review' : report.status);
    setUserApproved(false);

    // Ensure report's activities are reflected and selected in the checklist
    setActivities((prev) => {
      const map = new Map<string, ActivityItem>();
      for (const item of prev) {
        map.set(item.label.trim().toLowerCase(), { ...item, selected: false });
      }
      for (const label of report.activities) {
        const key = label.trim().toLowerCase();
        const existing = map.get(key);
        if (existing) {
          map.set(key, { ...existing, selected: true });
        } else {
          map.set(key, {
            id: `loaded-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
            label,
            category: inferActivityCategory(label),
            source: 'history',
            selected: true,
            lastUsedDate: report.reportDate,
          });
        }
      }
      return Array.from(map.values());
    });

    setInspectedReport(null);
    setEditorFeedback({
      type: 'info',
      message: `Laporan tanggal ${report.reportDate} dimuat ke editor untuk ditinjau.`,
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleResetFilters = () => {
    setSelectedMonth('all');
    setSelectedYear('all');
    setSelectedStatus('all');
  };

  return (
    <div className="atmospheric-canvas relative min-h-screen overflow-x-hidden px-3 py-4 sm:px-6 sm:py-8 lg:px-10">
      {/* Subtle decorative ambient blobs behind frosted frame matching reference */}
      <div
        aria-hidden="true"
        className="pointer-events-none fixed left-1/2 top-4 -z-0 h-56 w-[min(680px,85vw)] -translate-x-1/2 rounded-full bg-blue-500/20 blur-3xl"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none fixed -left-16 top-16 -z-0 h-64 w-64 rounded-full bg-sky-300/35 blur-2xl"
      />

      {/* Main Frosted Glass Application Shell */}
      <div className="glass-shell relative z-10 mx-auto max-w-[1280px] rounded-[28px] border border-white/80">
        <Header
          todayIso={todayIso}
          health={health}
          checkingHealth={checkingHealth}
          onRefreshHealth={checkHealth}
        />

        <main className="px-5 py-6 sm:px-7 sm:py-7">
          {/* Primary Workspace: AI Assistant + AI Report & Review */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 items-stretch">
            <div className="lg:col-span-5 flex flex-col">
              <div className="flex-1 flex flex-col [&>section]:flex-1">
                <ActivityAssistant
                  activities={activities}
                  onToggleActivity={handleToggleActivity}
                  onAddActivity={handleAddActivity}
                  onDeleteActivity={handleDeleteActivity}
                  onRefreshRecommendations={handleRefreshRecommendations}
                  onGenerateReport={() => void runGenerateReport(false)}
                  isRecommending={isRecommending}
                  isGenerating={isGenerating}
                  validationError={activityValidationError}
                />
              </div>
            </div>

            <div className="lg:col-span-7 flex flex-col">
              <div className="flex-1 flex flex-col [&>section]:flex-1">
                <ReportEditor
                  reportDate={activeDate}
                  sections={sections}
                  status={reportStatus}
                  userApproved={userApproved}
                  isGenerating={isGenerating}
                  isSubmitting={isSubmitting}
                  feedback={editorFeedback}
                  onChangeSection={handleChangeSection}
                  onToggleApproval={setUserApproved}
                  onRegenerate={() => void runGenerateReport(true)}
                  onSaveDraft={handleSaveDraft}
                  onConfirmSubmit={() => void handleConfirmSubmit()}
                />
              </div>
            </div>
          </div>

          {/* Attendance History Section */}
          <ReportHistory
            reports={filteredReports}
            selectedMonth={selectedMonth}
            selectedYear={selectedYear}
            selectedStatus={selectedStatus}
            availableYears={availableYears}
            viewMode={viewMode}
            onMonthChange={setSelectedMonth}
            onYearChange={setSelectedYear}
            onStatusChange={setSelectedStatus}
            onViewModeChange={setViewMode}
            onResetFilters={handleResetFilters}
            onOpenReport={setInspectedReport}
          />
        </main>
      </div>

      {/* Report Detail Modal */}
      <ReportDetailModal
        report={inspectedReport}
        onClose={() => setInspectedReport(null)}
        onLoadIntoEditor={handleLoadIntoEditor}
      />
    </div>
  );
}

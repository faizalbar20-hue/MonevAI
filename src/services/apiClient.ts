import {
  ConnectionHealth,
  GeneratedReportSections,
  MonevReport,
} from '../types/monev';

export async function fetchConnectionHealth(): Promise<ConnectionHealth> {
  try {
    const res = await fetch('/api/health', { cache: 'no-store' });
    if (!res.ok) {
      return {
        serverOnline: false,
        aiReady: false,
        monevPortalConfigured: false,
        checkedAt: new Date().toISOString(),
        message: `Server merespons status ${res.status}`,
      };
    }
    return (await res.json()) as ConnectionHealth;
  } catch {
    return {
      serverOnline: false,
      aiReady: false,
      monevPortalConfigured: false,
      checkedAt: new Date().toISOString(),
      message: 'Tidak dapat menjangkau server aplikasi.',
    };
  }
}

export async function requestGenerateReport(payload: {
  reportDate: string;
  selectedActivities: string[];
  previousReports: MonevReport[];
  previousDraft?: GeneratedReportSections;
  isRegenerate?: boolean;
}): Promise<GeneratedReportSections> {
  const res = await fetch('/api/generate-report', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  const data = (await res.json().catch(() => ({}))) as {
    sections?: GeneratedReportSections;
    error?: string;
  };

  if (!res.ok || !data.sections) {
    throw new Error(
      data.error || 'Gagal menghasilkan laporan dari layanan OpenAI AI.'
    );
  }

  return data.sections;
}

export async function requestRecommendActivities(payload: {
  previousReports: MonevReport[];
  existingLabels: string[];
}): Promise<Array<{ label: string; category: string }>> {
  const res = await fetch('/api/recommend-activities', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  const data = (await res.json().catch(() => ({}))) as {
    recommendations?: Array<{ label: string; category: string }>;
    error?: string;
  };

  if (!res.ok || !data.recommendations) {
    throw new Error(
      data.error || 'Gagal mengambil rekomendasi aktivitas dari OpenAI AI.'
    );
  }

  return data.recommendations;
}

export async function submitReportToMonevServer(payload: {
  reportId: string;
  reportDate: string;
  activities: string[];
  sections: GeneratedReportSections;
  userApproved: boolean;
}): Promise<{
  ok: boolean;
  status: 'Berhasil Dikirim' | 'Gagal Dikirim';
  message: string;
  submittedAt?: string;
}> {
  const res = await fetch('/api/monev/submit', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  const data = (await res.json().catch(() => ({}))) as {
    ok?: boolean;
    status?: 'Berhasil Dikirim' | 'Gagal Dikirim';
    message?: string;
    submittedAt?: string;
  };

  return {
    ok: Boolean(res.ok && data.ok),
    status: data.status === 'Berhasil Dikirim' ? 'Berhasil Dikirim' : 'Gagal Dikirim',
    message:
      data.message ||
      'Tidak ada konfirmasi penerimaan dari server Monev tujuan.',
    submittedAt: data.submittedAt,
  };
}

import { ActivityItem, GeneratedReportSections, MonevReport, ReportStatus } from '../types/monev';

export const INDONESIAN_MONTHS = [
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
] as const;

export function getTodayIsoDate(now: Date = new Date()): string {
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function formatIndonesianDate(isoDate: string, includeWeekday = false): string {
  const parts = isoDate.split('-').map(Number);
  if (parts.length !== 3 || parts.some((n) => Number.isNaN(n))) {
    return isoDate;
  }
  const [year, month, day] = parts;
  const date = new Date(year, month - 1, day);
  return new Intl.DateTimeFormat('id-ID', {
    weekday: includeWeekday ? 'long' : undefined,
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(date);
}

export function formatShortIndonesianDate(isoDate: string): string {
  const parts = isoDate.split('-').map(Number);
  if (parts.length !== 3 || parts.some((n) => Number.isNaN(n))) {
    return isoDate;
  }
  const [year, month, day] = parts;
  const date = new Date(year, month - 1, day);
  return new Intl.DateTimeFormat('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(date);
}

export function deriveRecommendedActivities(
  history: MonevReport[],
  limit = 6
): ActivityItem[] {
  const sorted = [...history].sort((a, b) =>
    b.reportDate.localeCompare(a.reportDate)
  );
  const seen = new Set<string>();
  const recommendations: ActivityItem[] = [];

  for (const report of sorted) {
    for (const rawLabel of report.activities) {
      const clean = rawLabel.trim();
      const key = clean.toLowerCase();
      if (!clean || seen.has(key)) continue;
      seen.add(key);

      recommendations.push({
        id: `rec-${recommendations.length + 1}-${key.slice(0, 16).replace(/[^a-z0-9]/g, '')}`,
        label: clean,
        category: inferActivityCategory(clean),
        source: 'ai',
        selected: recommendations.length < 2,
        lastUsedDate: report.reportDate,
      });

      if (recommendations.length >= limit) {
        return recommendations;
      }
    }
  }

  return recommendations;
}

export function inferActivityCategory(label: string): string {
  const lower = label.toLowerCase();
  if (
    lower.includes('rapat') ||
    lower.includes('koordinasi') ||
    lower.includes('diskusi') ||
    lower.includes('sinkronisasi')
  ) {
    return 'Koordinasi';
  }
  if (
    lower.includes('evaluasi') ||
    lower.includes('monitoring') ||
    lower.includes('monev') ||
    lower.includes('rekap') ||
    lower.includes('laporan')
  ) {
    return 'Monev';
  }
  if (
    lower.includes('pengembangan') ||
    lower.includes('sistem') ||
    lower.includes('integrasi') ||
    lower.includes('uji') ||
    lower.includes('perbaikan')
  ) {
    return 'Teknis';
  }
  return 'Operasional';
}

export function buildGeminiReportPrompt(params: {
  reportDate: string;
  selectedActivities: string[];
  previousReports: MonevReport[];
  previousDraft?: GeneratedReportSections;
  isRegenerate?: boolean;
}): string {
  const {
    reportDate,
    selectedActivities,
    previousReports,
    previousDraft,
    isRegenerate = false,
  } = params;

  const recentSamples = [...previousReports]
    .sort((a, b) => b.reportDate.localeCompare(a.reportDate))
    .slice(0, 4)
    .map(
      (r) =>
        `- Tanggal ${r.reportDate}: Deskripsi="${r.sections.deskripsiKegiatan}" | Pembelajaran="${r.sections.pembelajaran}" | Kendala="${r.sections.kendala}"`
    )
    .join('\n');

  const activityLines = selectedActivities
    .map((act, idx) => `${idx + 1}. ${act}`)
    .join('\n');

  const regenerateBlock =
    isRegenerate && previousDraft
      ? `\nCatatan Generate Ulang:\nBuat variasi penyusunan kalimat yang baru dan segar dibanding draf sebelumnya berikut, tanpa mengubah fakta kegiatan:\n- Draf Deskripsi sebelumnya: "${previousDraft.deskripsiKegiatan}"\n- Draf Pembelajaran sebelumnya: "${previousDraft.pembelajaran}"\n- Draf Kendala sebelumnya: "${previousDraft.kendala}"\n`
      : '';

  return `Tanggal Laporan: ${formatIndonesianDate(reportDate, true)} (${reportDate})

Daftar kegiatan yang BENAR-BENAR dilakukan pengguna hari ini:
${activityLines}

Riwayat kalimat laporan sebelumnya (WAJIB dihindari pengulangan frasa/kalimat yang sama):
${recentSamples || '- Belum ada riwayat laporan sebelumnya.'}
${regenerateBlock}
Tugas Anda:
Susun laporan absensi harian Monev dalam bahasa Indonesia yang natural, lugas, dan profesional dalam 3 bagian JSON:
1. deskripsiKegiatan: Rangkuman jelas dan terstruktur hanya berdasarkan daftar kegiatan di atas. DILARANG keras menambahkan, mengarang, atau mengasumsikan aktivitas lain di luar daftar.
2. pembelajaran: Wawasan atau hal teknis/non-teknis yang dipelajari secara realistis dari pelaksanaan kegiatan di atas.
3. kendala: Hambatan atau tantangan yang relevan langsung dengan kegiatan di atas (jika kegiatan berjalan lancar tanpa hambatan spesifik dalam input, tulis kendala operasional ringan yang relevan dengan konteks kegiatan tersebut tanpa mengarang insiden besar).

Aturan ketat:
- Jangan gunakan gaya bahasa kaku atau berulang dari riwayat laporan sebelumnya.
- Jangan mengarang angka, nama pihak eksternal, atau peristiwa yang tidak disebutkan pengguna.`;
}

export function filterReports(
  reports: MonevReport[],
  filters: {
    month: string; // 'all' | '1'..'12'
    year: string; // 'all' | '2026'
    status?: ReportStatus | 'all';
  }
): MonevReport[] {
  return [...reports]
    .filter((report) => {
      const [y, m] = report.reportDate.split('-');
      if (filters.year !== 'all' && y !== filters.year) {
        return false;
      }
      if (filters.month !== 'all') {
        const targetMonth = String(Number(filters.month)).padStart(2, '0');
        if (m !== targetMonth) {
          return false;
        }
      }
      if (filters.status && filters.status !== 'all' && report.status !== filters.status) {
        return false;
      }
      return true;
    })
    .sort((a, b) => b.reportDate.localeCompare(a.reportDate) || b.updatedAt.localeCompare(a.updatedAt));
}

export function getAvailableYears(reports: MonevReport[], currentYear: string): string[] {
  const years = new Set<string>([currentYear]);
  for (const r of reports) {
    const y = r.reportDate.split('-')[0];
    if (y && /^\d{4}$/.test(y)) {
      years.add(y);
    }
  }
  return Array.from(years).sort((a, b) => b.localeCompare(a));
}

export function validateActivitiesSelection(activities: ActivityItem[]): {
  valid: boolean;
  selected: ActivityItem[];
  error?: string;
} {
  const selected = activities.filter((item) => item.selected && item.label.trim().length > 0);
  if (selected.length === 0) {
    return {
      valid: false,
      selected: [],
      error: 'Pilih minimal satu kegiatan yang dilakukan hari ini sebelum membuat laporan.',
    };
  }
  return { valid: true, selected };
}

export function canSubmitReport(
  sections: GeneratedReportSections,
  userApproved: boolean
): { valid: boolean; error?: string } {
  if (
    !sections.deskripsiKegiatan.trim() ||
    !sections.pembelajaran.trim() ||
    !sections.kendala.trim()
  ) {
    return {
      valid: false,
      error: 'Lengkapi seluruh bagian laporan (Deskripsi, Pembelajaran, dan Kendala) sebelum mengirim.',
    };
  }
  if (!userApproved) {
    return {
      valid: false,
      error: 'Centang persetujuan peninjauan laporan terlebih dahulu sebelum konfirmasi pengiriman.',
    };
  }
  return { valid: true };
}

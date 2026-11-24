import { MonevReport } from '../types/monev';
import { MonevReportRow } from '../db/schema';

const STORAGE_KEY = 'auto_monev_reports_v1';

export const SEED_REPORTS: MonevReport[] = [
  {
    id: 'rep-2026-11-22',
    reportDate: '2026-11-22',
    activities: [
      'Rekapitulasi capaian indikator kinerja program bulanan',
      'Verifikasi bukti dukung realisasi anggaran triwulan IV',
      'Koordinasi tindak lanjut temuan monitoring unit kerja',
    ],
    sections: {
      deskripsiKegiatan:
        'Menyelesaikan rekapitulasi capaian indikator kinerja bulanan dari seluruh divisi, memverifikasi kelengkapan bukti dukung realisasi anggaran triwulan IV, serta melakukan koordinasi tindak lanjut atas catatan monitoring bersama perwakilan unit kerja.',
      pembelajaran:
        'Penerapan daftar periksa verifikasi di awal proses membantu mengidentifikasi dokumen yang belum lengkap lebih cepat sebelum rapat evaluasi dimulai.',
      kendala:
        'Dua unit kerja masih perlu melakukan penyesuaian format lampiran realisasi anggaran agar sesuai dengan standar pelaporan terbaru.',
    },
    status: 'Berhasil Dikirim',
    userApproved: true,
    serverNote: 'Terkonfirmasi diterima oleh server Monev.',
    createdAt: '2026-11-22T16:15:00.000Z',
    updatedAt: '2026-11-22T16:40:00.000Z',
    submittedAt: '2026-11-22T16:40:00.000Z',
  },
  {
    id: 'rep-2026-11-20',
    reportDate: '2026-11-20',
    activities: [
      'Rapat sinkronisasi jadwal evaluasi semester II bersama tim inti',
      'Pembaruan matriks risiko dan rencana mitigasi proyek',
    ],
    sections: {
      deskripsiKegiatan:
        'Mengikuti rapat sinkronisasi jadwal evaluasi semester II bersama tim inti dan memperbarui matriks risiko beserta rencana mitigasi operasional untuk periode berjalan.',
      pembelajaran:
        'Pemetaan ketergantungan antar-unit pada matriks risiko memperjelas penanggung jawab pada setiap tahapan tindak lanjut.',
      kendala:
        'Penjadwalan ulang sesi tinjauan lintas divisi memerlukan penyesuaian tenggat pengumpulan bahan paparan.',
    },
    status: 'Menunggu Review',
    userApproved: false,
    createdAt: '2026-11-20T15:20:00.000Z',
    updatedAt: '2026-11-20T16:05:00.000Z',
  },
  {
    id: 'rep-2026-11-18',
    reportDate: '2026-11-18',
    activities: [
      'Review rancangan instrumen survei kepuasan layanan internal',
      'Pengolahan data umpan balik pengguna periode Oktober',
    ],
    sections: {
      deskripsiKegiatan:
        'Meninjau butir pertanyaan instrumen survei kepuasan layanan internal serta mengolah hasil umpan balik pengguna dari periode Oktober menjadi ringkasan temuan.',
      pembelajaran:
        'Pengelompokan masukan responden berdasarkan kategori layanan mempermudah penentuan prioritas perbaikan.',
      kendala:
        'Terdapat beberapa entri tanggapan ganda pada data mentah sehingga memerlukan pembersihan manual terlebih dahulu.',
    },
    status: 'Berhasil Dikirim',
    userApproved: true,
    serverNote: 'Terkonfirmasi diterima oleh server Monev.',
    createdAt: '2026-11-18T16:00:00.000Z',
    updatedAt: '2026-11-18T16:25:00.000Z',
    submittedAt: '2026-11-18T16:25:00.000Z',
  },
  {
    id: 'rep-2026-10-29',
    reportDate: '2026-10-29',
    activities: [
      'Penyusunan ringkasan eksekutif capaian target Oktober',
      'Evaluasi progres otomasi pelaporan absensi harian',
    ],
    sections: {
      deskripsiKegiatan:
        'Menyusun ringkasan eksekutif pencapaian target bulan Oktober dan mengevaluasi kesiapan alur kerja otomasi pelaporan absensi harian.',
      pembelajaran:
        'Penyajian tren capaian dalam poin ringkas meningkatkan keterbacaan laporan saat sesi tinjauan manajemen.',
      kendala:
        'Keterlambatan konfirmasi data dari salah satu pos pemantauan lapangan menunda finalisasi angka persentase.',
    },
    status: 'Draft',
    userApproved: false,
    createdAt: '2026-10-29T14:50:00.000Z',
    updatedAt: '2026-10-29T15:10:00.000Z',
  },
  {
    id: 'rep-2026-10-14',
    reportDate: '2026-10-14',
    activities: [
      'Pendampingan pengisian log aktivitas harian unit operasional',
      'Validasi konsistensi data absensi dan output kegiatan',
    ],
    sections: {
      deskripsiKegiatan:
        'Memberikan pendampingan teknis pengisian log aktivitas harian kepada staf unit operasional serta melakukan validasi kesesuaian antara catatan absensi dan bukti output.',
      pembelajaran:
        'Contoh pengisian yang terstruktur membantu anggota tim menuliskan capaian harian dengan lebih spesifik dan terukur.',
      kendala:
        'Gangguan koneksi sementara pada portal pelaporan menyebabkan pengiriman data perlu diulang.',
    },
    status: 'Gagal Dikirim',
    userApproved: true,
    serverNote: 'Server tujuan tidak merespons dalam batas waktu pengiriman (HTTP 503).',
    createdAt: '2026-10-14T16:40:00.000Z',
    updatedAt: '2026-10-14T16:48:00.000Z',
  },
  {
    id: 'rep-2025-12-19',
    reportDate: '2025-12-19',
    activities: [
      'Audit kelengkapan arsip laporan Monev tahunan',
      'Penyusunan rekomendasi perbaikan SOP pelaporan tahun berikutnya',
    ],
    sections: {
      deskripsiKegiatan:
        'Melakukan audit kelengkapan arsip laporan Monev sepanjang tahun berjalan dan merumuskan rekomendasi penyempurnaan prosedur operasional standar untuk tahun berikutnya.',
      pembelajaran:
        'Standarisasi penamaan arsip per bulan dan tahun sangat memangkas waktu penelusuran dokumen audit.',
      kendala:
        'Beberapa lampiran pendukung dari awal tahun masih tersimpan dalam format dokumen yang berbeda-beda.',
    },
    status: 'Berhasil Dikirim',
    userApproved: true,
    serverNote: 'Terkonfirmasi diterima oleh server Monev.',
    createdAt: '2025-12-19T16:10:00.000Z',
    updatedAt: '2025-12-19T16:30:00.000Z',
    submittedAt: '2025-12-19T16:30:00.000Z',
  },
];

export interface ReportRepository {
  getAll(): MonevReport[];
  upsert(report: MonevReport): MonevReport[];
  remove(id: string): MonevReport[];
}

export function mapRowToReport(row: MonevReportRow): MonevReport {
  return {
    id: row.id,
    reportDate: row.report_date,
    activities: JSON.parse(row.activities_json) as string[],
    sections: {
      deskripsiKegiatan: row.deskripsi_kegiatan,
      pembelajaran: row.pembelajaran,
      kendala: row.kendala,
    },
    status: row.status,
    userApproved: row.user_approved === 1,
    serverNote: row.server_note ?? undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    submittedAt: row.submitted_at ?? undefined,
  };
}

export function mapReportToRow(report: MonevReport): MonevReportRow {
  return {
    id: report.id,
    report_date: report.reportDate,
    activities_json: JSON.stringify(report.activities),
    deskripsi_kegiatan: report.sections.deskripsiKegiatan,
    pembelajaran: report.sections.pembelajaran,
    kendala: report.sections.kendala,
    status: report.status,
    user_approved: report.userApproved ? 1 : 0,
    server_note: report.serverNote ?? null,
    created_at: report.createdAt,
    updated_at: report.updatedAt,
    submitted_at: report.submittedAt ?? null,
  };
}

class LocalStorageReportRepository implements ReportRepository {
  getAll(): MonevReport[] {
    if (typeof window === 'undefined') return SEED_REPORTS;
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (!raw) {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(SEED_REPORTS));
        return SEED_REPORTS;
      }
      const parsed = JSON.parse(raw) as MonevReport[];
      if (!Array.isArray(parsed) || parsed.length === 0) {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(SEED_REPORTS));
        return SEED_REPORTS;
      }
      return parsed;
    } catch {
      return SEED_REPORTS;
    }
  }

  upsert(report: MonevReport): MonevReport[] {
    const current = this.getAll();
    const index = current.findIndex((item) => item.id === report.id);
    const updated =
      index >= 0
        ? current.map((item) => (item.id === report.id ? report : item))
        : [report, ...current];
    if (typeof window !== 'undefined') {
      try {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      } catch {
        // Ignore storage quota errors
      }
    }
    return updated;
  }

  remove(id: string): MonevReport[] {
    const updated = this.getAll().filter((item) => item.id !== id);
    if (typeof window !== 'undefined') {
      try {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      } catch {
        // Ignore storage quota errors
      }
    }
    return updated;
  }
}

export const reportRepository: ReportRepository = new LocalStorageReportRepository();

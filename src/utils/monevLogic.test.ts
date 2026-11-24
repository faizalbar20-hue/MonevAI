import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildGeminiReportPrompt,
  canSubmitReport,
  deriveRecommendedActivities,
  filterReports,
  formatIndonesianDate,
  getAvailableYears,
  validateActivitiesSelection,
} from './monevLogic';
import type { ActivityItem, MonevReport } from '../types/monev';

const sampleReports: MonevReport[] = [
  {
    id: 'rep-1',
    reportDate: '2026-11-22',
    activities: [
      'Rekapitulasi capaian indikator kinerja program bulanan',
      'Koordinasi tindak lanjut temuan monitoring unit kerja',
    ],
    sections: {
      deskripsiKegiatan: 'Melakukan rekapitulasi indikator kinerja dan koordinasi tindak lanjut.',
      pembelajaran: 'Validasi silang format laporan mempercepat konsolidasi data.',
      kendala: 'Beberapa unit kerja masih mengirimkan pembaruan data di akhir hari.',
    },
    status: 'Berhasil Dikirim',
    userApproved: true,
    createdAt: '2026-11-22T16:30:00.000Z',
    updatedAt: '2026-11-22T16:35:00.000Z',
    submittedAt: '2026-11-22T16:35:00.000Z',
  },
  {
    id: 'rep-2',
    reportDate: '2026-10-15',
    activities: [
      'Penyusunan matriks evaluasi triwulanan',
      'Rekapitulasi capaian indikator kinerja program bulanan',
    ],
    sections: {
      deskripsiKegiatan: 'Menyusun matriks evaluasi triwulanan untuk keperluan tinjauan pimpinan.',
      pembelajaran: 'Struktur indikator terstandar memudahkan perbandingan antarperiode.',
      kendala: 'Sinkronisasi definisi operasional antar bidang membutuhkan klarifikasi tambahan.',
    },
    status: 'Draft',
    userApproved: false,
    createdAt: '2026-10-15T15:00:00.000Z',
    updatedAt: '2026-10-15T15:10:00.000Z',
  },
  {
    id: 'rep-3',
    reportDate: '2025-12-08',
    activities: ['Audit kelengkapan dokumen pendukung Monev tahunan'],
    sections: {
      deskripsiKegiatan: 'Memeriksa kelengkapan berkas pendukung evaluasi akhir tahun.',
      pembelajaran: 'Penamaan berkas yang konsisten mempersingkat proses penelusuran arsip.',
      kendala: 'Sebagian lampiran masih tersimpan di beberapa folder terpisah.',
    },
    status: 'Gagal Dikirim',
    userApproved: true,
    createdAt: '2025-12-08T17:00:00.000Z',
    updatedAt: '2025-12-08T17:02:00.000Z',
  },
];

test('deriveRecommendedActivities extracts unique activities ordered by newest history', () => {
  const recs = deriveRecommendedActivities(sampleReports, 5);
  assert.equal(recs.length, 4);
  assert.equal(recs[0].label, 'Rekapitulasi capaian indikator kinerja program bulanan');
  assert.equal(recs[0].selected, true);
  assert.equal(recs[2].selected, false);
  const labels = recs.map((r) => r.label.toLowerCase());
  assert.equal(new Set(labels).size, labels.length);
});

test('filterReports filters accurately by month, year, and status', () => {
  const nov2026 = filterReports(sampleReports, { month: '11', year: '2026', status: 'all' });
  assert.equal(nov2026.length, 1);
  assert.equal(nov2026[0].id, 'rep-1');

  const all2026 = filterReports(sampleReports, { month: 'all', year: '2026', status: 'all' });
  assert.equal(all2026.length, 2);

  const failedOnly = filterReports(sampleReports, { month: 'all', year: 'all', status: 'Gagal Dikirim' });
  assert.equal(failedOnly.length, 1);
  assert.equal(failedOnly[0].id, 'rep-3');
});

test('getAvailableYears includes current year and sorts descending', () => {
  const years = getAvailableYears(sampleReports, '2026');
  assert.deepEqual(years, ['2026', '2025']);
});

test('validateActivitiesSelection enforces at least one selected activity', () => {
  const noneSelected: ActivityItem[] = [
    { id: '1', label: 'Rapat koordinasi', category: 'Koordinasi', source: 'manual', selected: false },
  ];
  assert.equal(validateActivitiesSelection(noneSelected).valid, false);

  const oneSelected: ActivityItem[] = [
    { id: '1', label: 'Rapat koordinasi', category: 'Koordinasi', source: 'manual', selected: true },
  ];
  const res = validateActivitiesSelection(oneSelected);
  assert.equal(res.valid, true);
  assert.equal(res.selected.length, 1);
});

test('canSubmitReport blocks submission without complete sections or user approval', () => {
  const fullSections = {
    deskripsiKegiatan: 'Menyelesaikan rekap data.',
    pembelajaran: 'Validasi awal mengurangi revisi.',
    kendala: 'Keterlambatan input dari satu unit.',
  };
  assert.equal(canSubmitReport(fullSections, false).valid, false);
  assert.equal(canSubmitReport({ ...fullSections, kendala: '  ' }, true).valid, false);
  assert.equal(canSubmitReport(fullSections, true).valid, true);
});

test('buildGeminiReportPrompt embeds selected activities and anti-repetition history', () => {
  const prompt = buildGeminiReportPrompt({
    reportDate: '2026-11-23',
    selectedActivities: ['Finalisasi dokumen evaluasi triwulan IV'],
    previousReports: sampleReports,
    isRegenerate: true,
    previousDraft: sampleReports[0].sections,
  });
  assert.match(prompt, /Finalisasi dokumen evaluasi triwulan IV/);
  assert.match(prompt, /DILARANG keras menambahkan, mengarang/);
  assert.match(prompt, /Catatan Generate Ulang/);
});

test('formatIndonesianDate formats ISO date into Indonesian locale string', () => {
  const formatted = formatIndonesianDate('2026-11-23', false);
  assert.match(formatted, /23/);
  assert.match(formatted, /November/);
  assert.match(formatted, /2026/);
});

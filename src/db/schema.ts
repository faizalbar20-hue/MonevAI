/**
 * Struktur skema database siap pakai untuk penyimpanan riwayat laporan Monev.
 * Dapat langsung dihubungkan dengan PostgreSQL / SQLite (Drizzle / Prisma / pg).
 */

export const MONEV_DB_SCHEMA_SQL = `
CREATE TABLE IF NOT EXISTS monev_reports (
  id TEXT PRIMARY KEY,
  report_date DATE NOT NULL,
  activities_json TEXT NOT NULL,
  deskripsi_kegiatan TEXT NOT NULL,
  pembelajaran TEXT NOT NULL,
  kendala TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('Draft', 'Menunggu Review', 'Berhasil Dikirim', 'Gagal Dikirim')),
  user_approved INTEGER NOT NULL DEFAULT 0,
  server_note TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  submitted_at TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_monev_reports_date ON monev_reports(report_date DESC);
CREATE INDEX IF NOT EXISTS idx_monev_reports_status ON monev_reports(status);
`;

export interface MonevReportRow {
  id: string;
  report_date: string;
  activities_json: string;
  deskripsi_kegiatan: string;
  pembelajaran: string;
  kendala: string;
  status: 'Draft' | 'Menunggu Review' | 'Berhasil Dikirim' | 'Gagal Dikirim';
  user_approved: number;
  server_note: string | null;
  created_at: string;
  updated_at: string;
  submitted_at: string | null;
}

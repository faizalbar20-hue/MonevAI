export type ReportStatus =
  | 'Draft'
  | 'Menunggu Review'
  | 'Berhasil Dikirim'
  | 'Gagal Dikirim';

export type ActivitySource = 'ai' | 'manual' | 'history';

export interface ActivityItem {
  id: string;
  label: string;
  category: string;
  source: ActivitySource;
  selected: boolean;
  lastUsedDate?: string;
}

export interface GeneratedReportSections {
  deskripsiKegiatan: string;
  pembelajaran: string;
  kendala: string;
}

export interface MonevReport {
  id: string;
  reportDate: string; // YYYY-MM-DD
  activities: string[];
  sections: GeneratedReportSections;
  status: ReportStatus;
  userApproved: boolean;
  serverNote?: string;
  createdAt: string;
  updatedAt: string;
  submittedAt?: string;
}

export interface ConnectionHealth {
  serverOnline: boolean;
  aiReady: boolean;
  monevPortalConfigured: boolean;
  checkedAt: string;
  message: string;
}

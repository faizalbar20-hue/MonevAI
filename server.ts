import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { GoogleGenAI, Type } from '@google/genai';
import { buildGeminiReportPrompt } from './src/utils/monevLogic';
import type { GeneratedReportSections, MonevReport } from './src/types/monev';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = Number(process.env.PORT || 3000);

function getGeminiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY?.trim();
  if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
    return null;
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

function isTransientGeminiError(err: unknown): boolean {
  const msg = err instanceof Error ? err.message : String(err);
  return (
    msg.includes('503') ||
    msg.includes('UNAVAILABLE') ||
    msg.includes('429') ||
    msg.includes('RESOURCE_EXHAUSTED') ||
    msg.includes('high demand')
  );
}

async function callWithRetry<T>(fn: () => Promise<T>, maxAttempts = 3): Promise<T> {
  let lastError: unknown;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastError = err;
      if (!isTransientGeminiError(err) || attempt === maxAttempts) {
        throw err;
      }
      const delayMs = 700 * Math.pow(2, attempt - 1);
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }
  throw lastError;
}

function formatGeminiError(err: unknown): { status: number; message: string } {
  const raw = err instanceof Error ? err.message : String(err);
  if (raw.includes('503') || raw.includes('UNAVAILABLE') || raw.includes('high demand')) {
    return {
      status: 503,
      message:
        'Layanan Gemini AI sedang mengalami lonjakan permintaan sementara. Silakan klik Generate Laporan kembali dalam beberapa detik, atau sunting isi laporan secara manual.',
    };
  }
  if (raw.includes('429') || raw.includes('RESOURCE_EXHAUSTED')) {
    return {
      status: 429,
      message:
        'Batas kuota permintaan Gemini AI tercapai sementara. Silakan tunggu sejenak sebelum mencoba lagi.',
    };
  }
  if (raw.includes('API_KEY_INVALID') || raw.includes('403') || raw.includes('PERMISSION_DENIED')) {
    return {
      status: 403,
      message:
        'Kunci API Gemini tidak valid atau tidak memiliki izin. Periksa pengaturan di panel Secrets.',
    };
  }
  return {
    status: 500,
    message: 'Terjadi kendala saat menghubungi layanan Gemini AI. Silakan coba lagi.',
  };
}

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '1mb' }));

  app.get('/api/health', (_req, res) => {
    const apiKey = process.env.GEMINI_API_KEY?.trim();
    const aiReady = Boolean(apiKey && apiKey !== 'MY_GEMINI_API_KEY');
    const monevPortalConfigured = Boolean(process.env.MONEV_API_URL?.trim());

    res.json({
      serverOnline: true,
      aiReady,
      monevPortalConfigured,
      checkedAt: new Date().toISOString(),
      message: aiReady
        ? 'Terhubung ke server & Gemini AI siap digunakan.'
        : 'Server aktif, namun kunci Gemini AI belum dikonfigurasi.',
    });
  });

  app.post('/api/generate-report', async (req, res) => {
    const ai = getGeminiClient();
    if (!ai) {
      return res.status(503).json({
        error:
          'GEMINI_API_KEY belum tersedia di server. Silakan atur pada panel Secrets agar Gemini AI dapat menghasilkan laporan.',
      });
    }

    const body = req.body as {
      reportDate?: string;
      selectedActivities?: string[];
      previousReports?: MonevReport[];
      previousDraft?: GeneratedReportSections;
      isRegenerate?: boolean;
    };

    const selectedActivities = Array.isArray(body.selectedActivities)
      ? body.selectedActivities.map((a) => String(a).trim()).filter(Boolean)
      : [];

    if (selectedActivities.length === 0) {
      return res.status(400).json({
        error: 'Minimal satu kegiatan harus dipilih sebelum membuat laporan.',
      });
    }

    const reportDate = body.reportDate || new Date().toISOString().slice(0, 10);
    const previousReports = Array.isArray(body.previousReports) ? body.previousReports : [];

    const prompt = buildGeminiReportPrompt({
      reportDate,
      selectedActivities,
      previousReports,
      previousDraft: body.previousDraft,
      isRegenerate: Boolean(body.isRegenerate),
    });

    try {
      const response = await callWithRetry(() =>
        ai.models.generateContent({
          model: 'gemini-4-hydrogen',
          contents: prompt,
          config: {
            systemInstruction:
              'Anda adalah asisten penyusun laporan absensi harian Monitoring & Evaluasi (Monev) berbahasa Indonesia yang profesional, jujur, ringkas, dan faktual. Jangan pernah mengarang kegiatan yang tidak diberikan pengguna, dan hindari pengulangan kalimat dari riwayat sebelumnya.',
            responseMimeType: 'application/json',
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                deskripsiKegiatan: {
                  type: Type.STRING,
                  description:
                    'Deskripsi kegiatan harian dalam bahasa Indonesia yang natural dan profesional, hanya memuat aktivitas yang diberikan pengguna (2-4 kalimat).',
                },
                pembelajaran: {
                  type: Type.STRING,
                  description:
                    'Pembelajaran atau insight yang didapat dari kegiatan yang dilakukan (1-3 kalimat).',
                },
                kendala: {
                  type: Type.STRING,
                  description:
                    'Kendala atau tantangan yang relevan langsung dengan aktivitas yang dilakukan (1-2 kalimat).',
                },
              },
              required: ['deskripsiKegiatan', 'pembelajaran', 'kendala'],
            },
          },
        })
      );

      const rawText = (response.text ?? '').trim();
      if (!rawText) {
        return res.status(502).json({
          error: 'Gemini AI mengembalikan respons kosong. Silakan coba kembali.',
        });
      }

      const parsed = JSON.parse(rawText) as GeneratedReportSections;
      if (
        !parsed.deskripsiKegiatan?.trim() ||
        !parsed.pembelajaran?.trim() ||
        !parsed.kendala?.trim()
      ) {
        return res.status(502).json({
          error: 'Format hasil laporan AI tidak lengkap. Silakan coba generate ulang.',
        });
      }

      return res.json({ sections: parsed });
    } catch (error) {
      const formatted = formatGeminiError(error);
      return res.status(formatted.status).json({
        error: formatted.message,
      });
    }
  });

  app.post('/api/recommend-activities', async (req, res) => {
    const ai = getGeminiClient();
    if (!ai) {
      return res.status(503).json({
        error:
          'GEMINI_API_KEY belum tersedia di server. Gunakan daftar rekomendasi dari riwayat atau tambahkan kegiatan manual.',
      });
    }

    const body = req.body as {
      previousReports?: MonevReport[];
      existingLabels?: string[];
    };

    const previousReports = Array.isArray(body.previousReports) ? body.previousReports : [];
    const existingLabels = Array.isArray(body.existingLabels) ? body.existingLabels : [];

    const historyText = previousReports
      .slice(0, 6)
      .map((r) => `- (${r.reportDate}): ${r.activities.join('; ')}`)
      .join('\n');

    try {
      const response = await callWithRetry(() =>
        ai.models.generateContent({
          model: 'gemini-4-hydrogen',
          contents: `Berdasarkan riwayat pekerjaan sebelumnya berikut:\n${historyText || '- Pelaporan evaluasi harian'}\n\nDan daftar kegiatan yang sudah tampil saat ini (hindari duplikasi persis):\n${existingLabels.join('; ') || '-'}\n\nBerikan 3 rekomendasi kegiatan harian Monev yang realistis dan relevan untuk dilanjutkan hari ini dalam Bahasa Indonesia.`,
          config: {
            systemInstruction:
              'Berikan rekomendasi kegiatan kerja harian Monev yang ringkas, realistis, dan profesional dalam bahasa Indonesia.',
            responseMimeType: 'application/json',
            responseSchema: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  label: {
                    type: Type.STRING,
                    description: 'Nama kegiatan singkat dan jelas (maksimal 12 kata).',
                  },
                  category: {
                    type: Type.STRING,
                    description: 'Kategori singkat: Monev, Koordinasi, Teknis, atau Operasional.',
                  },
                },
                required: ['label', 'category'],
              },
            },
          },
        })
      );

      const rawText = (response.text ?? '[]').trim();
      const recommendations = JSON.parse(rawText) as Array<{
        label: string;
        category: string;
      }>;

      return res.json({ recommendations: recommendations.slice(0, 4) });
    } catch (error) {
      const formatted = formatGeminiError(error);
      return res.status(formatted.status).json({ error: formatted.message });
    }
  });

  app.post('/api/monev/submit', async (req, res) => {
    const body = req.body as {
      reportId?: string;
      reportDate?: string;
      activities?: string[];
      sections?: GeneratedReportSections;
      userApproved?: boolean;
    };

    if (!body.userApproved) {
      return res.status(400).json({
        ok: false,
        status: 'Gagal Dikirim',
        message: 'Persetujuan pengguna wajib diberikan sebelum laporan dikirim ke server Monev.',
      });
    }

    if (
      !body.sections?.deskripsiKegiatan?.trim() ||
      !body.sections?.pembelajaran?.trim() ||
      !body.sections?.kendala?.trim()
    ) {
      return res.status(400).json({
        ok: false,
        status: 'Gagal Dikirim',
        message: 'Isi laporan belum lengkap.',
      });
    }

    const monevEndpoint = process.env.MONEV_API_URL?.trim();
    if (!monevEndpoint) {
      return res.status(503).json({
        ok: false,
        status: 'Gagal Dikirim',
        message:
          'Endpoint server Monev tujuan (MONEV_API_URL) belum terhubung. Pengiriman tidak dapat dikonfirmasi sebagai berhasil; laporan disimpan dengan status Gagal Dikirim untuk dikirim ulang nanti.',
      });
    }

    try {
      const upstreamRes = await fetch(monevEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(process.env.MONEV_API_TOKEN
            ? { Authorization: `Bearer ${process.env.MONEV_API_TOKEN}` }
            : {}),
        },
        body: JSON.stringify({
          reportId: body.reportId,
          reportDate: body.reportDate,
          activities: body.activities,
          sections: body.sections,
        }),
      });

      if (!upstreamRes.ok) {
        return res.status(502).json({
          ok: false,
          status: 'Gagal Dikirim',
          message: `Server Monev tujuan menolak pengiriman (HTTP ${upstreamRes.status}).`,
        });
      }

      return res.json({
        ok: true,
        status: 'Berhasil Dikirim',
        message: 'Laporan telah diterima dan dikonfirmasi oleh server Monev.',
        submittedAt: new Date().toISOString(),
      });
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Koneksi gagal';
      return res.status(502).json({
        ok: false,
        status: 'Gagal Dikirim',
        message: `Gagal menghubungi server Monev: ${msg}`,
      });
    }
  });

  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Auto Monev server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();

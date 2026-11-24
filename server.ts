import express, { type Request, type Response, type NextFunction } from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import OpenAI from 'openai';
import {
  buildOpenAIRecommendPrompt,
  buildOpenAIReportPrompt,
  parseOpenAIReportOutput,
} from './src/utils/monevLogic';
import type { GeneratedReportSections, MonevReport } from './src/types/monev';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = Number(process.env.PORT || 3000);
const DEFAULT_OPENAI_MODEL = 'gpt-6-luna';

function getOpenAIModel(): string {
  return process.env.OPENAI_MODEL?.trim() || DEFAULT_OPENAI_MODEL;
}

function getOpenAIClient(): OpenAI | null {
  const apiKey = process.env.OPENAI_API_KEY?.trim();
  if (!apiKey || apiKey === 'MY_OPENAI_API_KEY') {
    return null;
  }
  return new OpenAI({
    apiKey,
    timeout: 30_000,
    maxRetries: 1,
  });
}

function createAiRateLimiter(options: { maxRequests: number; windowMs: number }) {
  const buckets = new Map<string, { count: number; resetAt: number }>();

  return (req: Request, res: Response, next: NextFunction) => {
    const forwarded = req.headers['x-forwarded-for'];
    const rawIp = Array.isArray(forwarded)
      ? forwarded[0]
      : typeof forwarded === 'string'
        ? forwarded.split(',')[0]
        : req.ip;
    const clientKey = (rawIp || 'local').trim();
    const now = Date.now();

    const existing = buckets.get(clientKey);
    if (!existing || now > existing.resetAt) {
      buckets.set(clientKey, { count: 1, resetAt: now + options.windowMs });
      return next();
    }

    if (existing.count >= options.maxRequests) {
      const retrySeconds = Math.max(1, Math.ceil((existing.resetAt - now) / 1000));
      return res.status(429).json({
        error: `Batas penggunaan AI tercapai. Silakan coba lagi dalam ${retrySeconds} detik.`,
      });
    }

    existing.count += 1;
    return next();
  };
}

function isTransientOpenAIError(err: unknown): boolean {
  if (err instanceof OpenAI.APIConnectionError || err instanceof OpenAI.APIConnectionTimeoutError) {
    return true;
  }
  if (err instanceof OpenAI.APIError) {
    return err.status === 429 || err.status === 500 || err.status === 502 || err.status === 503;
  }
  return false;
}

async function callWithRetry<T>(fn: () => Promise<T>, maxAttempts = 2): Promise<T> {
  let lastError: unknown;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastError = err;
      if (!isTransientOpenAIError(err) || attempt === maxAttempts) {
        throw err;
      }
      const delayMs = 650 * attempt;
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }
  throw lastError;
}

function formatOpenAIError(err: unknown): { status: number; message: string } {
  if (err instanceof OpenAI.AuthenticationError) {
    return {
      status: 401,
      message:
        'Autentikasi OpenAI API gagal. Periksa kembali konfigurasi OPENAI_API_KEY di server.',
    };
  }
  if (err instanceof OpenAI.PermissionDeniedError) {
    return {
      status: 403,
      message:
        'Akses ke model OpenAI ditolak oleh server API. Periksa izin proyek atau kunci API di server.',
    };
  }
  if (err instanceof OpenAI.RateLimitError) {
    return {
      status: 429,
      message:
        'Batas permintaan atau kuota OpenAI API tercapai sementara. Silakan tunggu sejenak sebelum mencoba lagi.',
    };
  }
  if (err instanceof OpenAI.NotFoundError) {
    return {
      status: 502,
      message:
        'Model OpenAI yang dikonfigurasi tidak ditemukan. Periksa variabel OPENAI_MODEL di server.',
    };
  }
  if (err instanceof OpenAI.APIConnectionTimeoutError || err instanceof OpenAI.APIConnectionError) {
    return {
      status: 503,
      message:
        'Tidak dapat terhubung ke layanan OpenAI API. Periksa koneksi jaringan server dan coba lagi.',
    };
  }
  if (err instanceof OpenAI.APIError) {
    const status = err.status && err.status >= 400 ? err.status : 502;
    return {
      status,
      message:
        status >= 500
          ? 'Layanan OpenAI API sedang mengalami gangguan sementara. Silakan coba lagi beberapa saat lagi.'
          : 'Permintaan ke OpenAI API tidak dapat diproses. Silakan periksa input dan coba kembali.',
    };
  }
  return {
    status: 500,
    message: 'Terjadi kendala internal saat memproses laporan dengan OpenAI API.',
  };
}

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '1mb' }));

  const aiRateLimiter = createAiRateLimiter({
    maxRequests: 20,
    windowMs: 60_000,
  });

  app.get('/api/health', (_req, res) => {
    const aiReady = Boolean(getOpenAIClient());
    const aiModel = getOpenAIModel();
    const monevPortalConfigured = Boolean(process.env.MONEV_API_URL?.trim());

    res.json({
      serverOnline: true,
      aiReady,
      aiProvider: 'OpenAI',
      aiModel,
      monevPortalConfigured,
      checkedAt: new Date().toISOString(),
      message: aiReady
        ? `Terhubung ke server & OpenAI (${aiModel}) siap digunakan.`
        : 'Server aktif, namun OPENAI_API_KEY belum dikonfigurasi.',
    });
  });

  app.post('/api/generate-report', aiRateLimiter, async (req, res) => {
    const client = getOpenAIClient();
    if (!client) {
      return res.status(503).json({
        error:
          'OPENAI_API_KEY belum tersedia di server. Silakan atur pada environment variable server agar OpenAI AI Assistant dapat menghasilkan laporan.',
      });
    }

    const body = (req.body ?? {}) as {
      reportDate?: unknown;
      selectedActivities?: unknown;
      previousReports?: unknown;
      previousDraft?: GeneratedReportSections;
      isRegenerate?: unknown;
    };

    const selectedActivities = Array.isArray(body.selectedActivities)
      ? body.selectedActivities
          .map((a) => String(a).trim().slice(0, 300))
          .filter(Boolean)
          .slice(0, 25)
      : [];

    if (selectedActivities.length === 0) {
      return res.status(400).json({
        error: 'Minimal satu kegiatan harus dipilih sebelum membuat laporan.',
      });
    }

    const reportDate =
      typeof body.reportDate === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(body.reportDate)
        ? body.reportDate
        : new Date().toISOString().slice(0, 10);
    const previousReports = Array.isArray(body.previousReports)
      ? (body.previousReports as MonevReport[]).slice(0, 10)
      : [];

    const model = getOpenAIModel();
    const prompt = buildOpenAIReportPrompt({
      reportDate,
      selectedActivities,
      previousReports,
      previousDraft: body.previousDraft,
      isRegenerate: Boolean(body.isRegenerate),
    });

    try {
      const response = await callWithRetry(() =>
        client.responses.create({
          model,
          instructions:
            'Anda adalah asisten penyusun laporan absensi harian Monitoring & Evaluasi (Monev) untuk Staff PPIC berbahasa Indonesia yang profesional, natural, variatif, dan faktual. Jangan mengarang aktivitas atau kendala yang tidak diberikan pengguna. Jika informasi kendala belum tersedia, minta konfirmasi pengguna pada bagian kendala tanpa mengasumsikan hambatan.',
          input: prompt,
          text: {
            format: {
              type: 'json_schema',
              name: 'auto_monev_daily_report',
              strict: true,
              schema: {
                type: 'object',
                properties: {
                  deskripsi_kegiatan: {
                    type: 'string',
                    description:
                      'Deskripsi kegiatan harian Staff PPIC dalam bahasa Indonesia yang natural dan profesional, hanya berdasarkan aktivitas yang dipilih pengguna.',
                  },
                  pembelajaran: {
                    type: 'string',
                    description:
                      'Pembelajaran yang didapat dari pelaksanaan aktivitas PPIC hari ini.',
                  },
                  kendala: {
                    type: 'string',
                    description:
                      'Kendala yang dialami jika tercantum pada input pengguna; jika belum tersedia, tulis pesan konfirmasi agar pengguna meninjau atau melengkapi kendala secara manual.',
                  },
                },
                required: ['deskripsi_kegiatan', 'pembelajaran', 'kendala'],
                additionalProperties: false,
              },
            },
          },
        })
      );

      const rawText = (response.output_text ?? '').trim();
      const sections = parseOpenAIReportOutput(rawText);

      return res.json({
        sections,
        output: {
          deskripsi_kegiatan: sections.deskripsiKegiatan,
          pembelajaran: sections.pembelajaran,
          kendala: sections.kendala,
        },
        model,
      });
    } catch (error) {
      const formatted = formatOpenAIError(error);
      console.error(`[OpenAI /api/generate-report] Error status=${formatted.status}`);
      return res.status(formatted.status).json({
        error: formatted.message,
      });
    }
  });

  app.post('/api/recommend-activities', aiRateLimiter, async (req, res) => {
    const client = getOpenAIClient();
    if (!client) {
      return res.status(503).json({
        error:
          'OPENAI_API_KEY belum tersedia di server. Gunakan daftar rekomendasi dari riwayat atau tambahkan aktivitas manual.',
      });
    }

    const body = (req.body ?? {}) as {
      previousReports?: unknown;
      existingLabels?: unknown;
    };

    const previousReports = Array.isArray(body.previousReports)
      ? (body.previousReports as MonevReport[]).slice(0, 10)
      : [];
    const existingLabels = Array.isArray(body.existingLabels)
      ? body.existingLabels.map((l) => String(l).trim().slice(0, 200)).filter(Boolean).slice(0, 30)
      : [];

    const model = getOpenAIModel();
    const prompt = buildOpenAIRecommendPrompt({
      previousReports,
      existingLabels,
    });

    try {
      const response = await callWithRetry(() =>
        client.responses.create({
          model,
          instructions:
            'Berikan 3 rekomendasi aktivitas harian yang relevan untuk Staff PPIC dalam bahasa Indonesia yang ringkas, realistis, dan profesional.',
          input: prompt,
          text: {
            format: {
              type: 'json_schema',
              name: 'ppic_activity_recommendations',
              strict: true,
              schema: {
                type: 'object',
                properties: {
                  recommendations: {
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: {
                        label: {
                          type: 'string',
                          description: 'Nama aktivitas Staff PPIC singkat dan jelas.',
                        },
                        category: {
                          type: 'string',
                          description: 'Kategori singkat: PPIC, Monev, Koordinasi, Teknis, atau Operasional.',
                        },
                      },
                      required: ['label', 'category'],
                      additionalProperties: false,
                    },
                  },
                },
                required: ['recommendations'],
                additionalProperties: false,
              },
            },
          },
        })
      );

      const rawText = (response.output_text ?? '{}').trim();
      const parsed = JSON.parse(rawText) as {
        recommendations?: Array<{ label: string; category: string }>;
      };
      const recommendations = Array.isArray(parsed.recommendations)
        ? parsed.recommendations
            .filter((item) => item?.label?.trim())
            .slice(0, 4)
        : [];

      return res.json({ recommendations, model });
    } catch (error) {
      const formatted = formatOpenAIError(error);
      console.error(`[OpenAI /api/recommend-activities] Error status=${formatted.status}`);
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

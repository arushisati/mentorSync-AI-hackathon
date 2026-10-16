import express, { Request, Response } from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

app.use(express.json({ limit: '10mb' }));

// Data persistence directory and file
const DATA_DIR = path.resolve(__dirname, 'data');
const DB_FILE = path.resolve(DATA_DIR, 'mentorsync_db.json');

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Initialize Gemini client if API key is present
const apiKey = process.env.GEMINI_API_KEY;
let aiClient: GoogleGenAI | null = null;
if (apiKey && apiKey !== 'MY_GEMINI_API_KEY') {
  try {
    aiClient = new GoogleGenAI({ apiKey });
  } catch (err) {
    console.warn('Failed to initialize GoogleGenAI client:', err);
  }
}

// API: Dynamic Translation via Gemini 3.8 Flash
app.post('/api/translate', async (req: Request, res: Response) => {
  const { text, sourceLang, targetLang } = req.body;

  if (!text || !text.trim()) {
    return res.json({ translatedText: '', source: 'empty' });
  }

  if (sourceLang === targetLang) {
    return res.json({ translatedText: text, source: 'identical' });
  }

  // If Gemini client is active, perform high-fidelity translation
  if (aiClient) {
    try {
      const prompt = `You are the core multilingual translation engine for MentorSync AI, an academic mentoring platform in an Indian university context.
Translate the following student/faculty communication accurately from ${sourceLang} to ${targetLang}.

Rules:
1. Preserve official IDs (e.g. STU-2024-001, 24CSE01), course codes (e.g. CS401), fee amounts (e.g. Rs. 35,000), and specific dates exactly as they are.
2. Maintain natural academic tone and polite honorifics (e.g., "Respected Mentor", "Dear Student").
3. Output ONLY the raw translated text. Do not add quotes, markdown formatting, or explanations.

Text to translate:
"${text}"`;

      const response = await aiClient.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: prompt,
      });

      const translatedText = response.text ? response.text.trim() : text;
      return res.json({ translatedText, source: 'gemini' });
    } catch (err: any) {
      console.warn('Gemini translation error, falling back:', err?.message || err);
    }
  }

  // Fallback heuristic response
  return res.json({
    translatedText: text,
    source: 'raw_fallback',
    note: 'GEMINI_API_KEY not configured or call failed',
  });
});

// API: State Persistence (GET and POST)
app.get('/api/state', (req: Request, res: Response) => {
  try {
    if (fs.existsSync(DB_FILE)) {
      const data = fs.readFileSync(DB_FILE, 'utf-8');
      return res.json({ success: true, data: JSON.parse(data) });
    }
    return res.json({ success: false, data: null, message: 'No stored state found' });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err?.message });
  }
});

app.post('/api/state', (req: Request, res: Response) => {
  try {
    const payload = req.body;
    fs.writeFileSync(DB_FILE, JSON.stringify(payload, null, 2), 'utf-8');
    return res.json({ success: true, timestamp: new Date().toISOString() });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err?.message });
  }
});

// API: Simulated Reminders Delivery Log
app.post('/api/reminders/send', (req: Request, res: Response) => {
  const { studentName, studentRollNo, channel, requirementType, customMessage } = req.body;
  const timestamp = new Date().toISOString();

  const logEntry = {
    id: `REM-${Date.now()}`,
    studentName,
    studentRollNo,
    channel,
    requirementType,
    messageContent: customMessage,
    sentAt: timestamp,
    status: 'delivered',
    simulatedDelivery: true,
  };

  return res.json({
    success: true,
    log: logEntry,
    message: `Simulated ${channel.toUpperCase()} successfully dispatched to ${studentName}.`,
  });
});

// Setup Vite middleware in dev or static files in production
async function startServer() {
  const isProd = process.env.NODE_ENV === 'production';

  if (!isProd) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`MentorSync AI server active on http://localhost:${PORT}`);
  });
}

startServer().catch(err => {
  console.error('Failed to start server:', err);
  process.exit(1);
});

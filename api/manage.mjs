// RISE.HUB cloud content manager — Vercel serverless function.
// Edits data/news.json + data/events.json and uploads images by committing
// directly to GitHub. The GitHub token + admin password live in Vercel
// environment variables (Settings → Environment Variables), never in code:
//   GITHUB_TOKEN   — fine-grained PAT with Contents read/write on the repo
//   ADMIN_PASSWORD — the password editors type into the manage page
import crypto from 'node:crypto';

const REPO = 'risehubsderot-cloud/Rise-Hub';
const BRANCH = 'main';
const ALLOWED_FILES = { news: 'data/news.json', events: 'data/events.json' };

function authed(req) {
  const given = String(req.headers['x-admin-key'] || '');
  const expected = String(process.env.ADMIN_PASSWORD || '');
  if (!expected || !given) return false;
  const a = crypto.createHash('sha256').update(given).digest();
  const b = crypto.createHash('sha256').update(expected).digest();
  return crypto.timingSafeEqual(a, b);
}

async function gh(path, init = {}) {
  const r = await fetch(`https://api.github.com${path}`, {
    ...init,
    headers: {
      'Authorization': `Bearer ${process.env.GITHUB_TOKEN}`,
      'Accept': 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
      ...(init.headers || {}),
    },
  });
  const body = await r.json().catch(() => ({}));
  return { ok: r.ok, status: r.status, body };
}

export default async function handler(req, res) {
  if (!process.env.GITHUB_TOKEN || !process.env.ADMIN_PASSWORD) {
    return res.status(500).json({ error: 'השרת לא מוגדר — חסרים GITHUB_TOKEN / ADMIN_PASSWORD בהגדרות Vercel' });
  }
  if (!authed(req)) {
    await new Promise(r => setTimeout(r, 700)); // slow brute-force attempts
    return res.status(401).json({ error: 'סיסמה שגויה' });
  }

  try {
    // ---- read a data file ----
    if (req.method === 'GET') {
      const key = String(req.query.file || '');
      const path = ALLOWED_FILES[key];
      if (!path) return res.status(400).json({ error: 'unknown file' });
      const r = await gh(`/repos/${REPO}/contents/${path}?ref=${BRANCH}`);
      if (!r.ok) return res.status(502).json({ error: 'קריאה מ-GitHub נכשלה', detail: r.body.message });
      const data = JSON.parse(Buffer.from(r.body.content, 'base64').toString('utf-8'));
      return res.status(200).json({ data, sha: r.body.sha });
    }

    if (req.method === 'POST') {
      const { action } = req.body || {};

      // ---- save a data file (direct commit → Vercel redeploys) ----
      if (action === 'save') {
        const path = ALLOWED_FILES[String(req.body.file || '')];
        if (!path) return res.status(400).json({ error: 'unknown file' });
        if (typeof req.body.data !== 'object' || req.body.data === null) {
          return res.status(400).json({ error: 'bad data' });
        }
        const content = Buffer.from(JSON.stringify(req.body.data, null, 2) + '\n', 'utf-8').toString('base64');
        const r = await gh(`/repos/${REPO}/contents/${path}`, {
          method: 'PUT',
          body: JSON.stringify({
            message: req.body.message || 'עדכון תוכן מממשק הניהול',
            content, sha: req.body.sha || undefined, branch: BRANCH,
          }),
        });
        if (r.status === 409 || r.status === 422) {
          return res.status(409).json({ error: 'הקובץ השתנה בינתיים — רעננו את הדף ונסו שוב' });
        }
        if (!r.ok) return res.status(502).json({ error: 'השמירה ל-GitHub נכשלה', detail: r.body.message });
        return res.status(200).json({ ok: true, sha: r.body.content && r.body.content.sha });
      }

      // ---- upload an image ----
      if (action === 'upload') {
        const name = String(req.body.name || 'image').replace(/[^\w.\-]+/g, '-');
        if (!/\.(jpe?g|png|webp|avif|gif)$/i.test(name)) {
          return res.status(400).json({ error: 'סוג קובץ לא נתמך — רק תמונות' });
        }
        const b64 = String(req.body.base64 || '');
        if (b64.length > 6_000_000) return res.status(400).json({ error: 'התמונה גדולה מדי (עד ~4MB)' });
        const stamp = new Date().toISOString().slice(0, 19).replace(/[T:]/g, '-');
        const path = `assets/uploads/${stamp}-${name}`;
        const r = await gh(`/repos/${REPO}/contents/${path}`, {
          method: 'PUT',
          body: JSON.stringify({ message: `העלאת תמונה: ${name}`, content: b64, branch: BRANCH }),
        });
        if (!r.ok) return res.status(502).json({ error: 'העלאת התמונה נכשלה', detail: r.body.message });
        return res.status(200).json({ ok: true, path });
      }

      return res.status(400).json({ error: 'unknown action' });
    }

    return res.status(405).json({ error: 'method not allowed' });
  } catch (e) {
    return res.status(500).json({ error: String(e.message || e) });
  }
}

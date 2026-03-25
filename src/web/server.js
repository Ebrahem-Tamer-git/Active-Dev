// © 2026 Ebrahem
import express from 'express';
import bodyParser from 'body-parser';
import path from 'path';
import { fileURLToPath } from 'url';
import { sectorsCache } from '../utils/autoSync.js';
import { saveLink, deleteLink, getAllLinks } from '../utils/database.js';
import { config } from '../config.js';

const { json } = bodyParser;
const app = express();
app.use(json());

const __dirname = path.dirname(fileURLToPath(import.meta.url));
app.use(express.static(path.join(__dirname, 'public')));

// كاش الأكواد المؤقتة: mtaUsername => code
export const codesStore = {};

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function getLinkedPlayersView() {
  return getAllLinks().map(player => {
    const cached = sectorsCache.get(player.discord_id);
    return {
      discordId: player.discord_id,
      mtaUsername: player.mta_username,
      sector: cached?.sector ?? player.sector ?? 'Pending',
      isLeader: cached?.isLeader ?? Boolean(player.is_leader),
      linkedAt: player.linked_at,
    };
  });
}

app.get('/', (req, res) => {
  const linkedPlayers = getLinkedPlayersView().sort((a, b) => b.linkedAt - a.linkedAt);
  const totalLinked = linkedPlayers.length;
  const activeSectorSync = linkedPlayers.filter(player => player.sector !== 'Pending').length;
  const leaders = linkedPlayers.filter(player => player.isLeader).length;

  const rows = linkedPlayers.length
    ? linkedPlayers.map(player => `
        <tr>
          <td>${escapeHtml(player.mtaUsername)}</td>
          <td>${escapeHtml(player.discordId)}</td>
          <td>${escapeHtml(player.sector)}</td>
          <td>${player.isLeader ? 'Leader' : 'Member'}</td>
          <td>${new Date(player.linkedAt).toLocaleString('en-US')}</td>
        </tr>
      `).join('')
    : `
        <tr>
          <td colspan="5" class="empty">No linked accounts yet.</td>
        </tr>
      `;

  res.type('html').send(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Falcons RP Control Panel</title>
  <style>
    :root {
      --bg-1: #031120;
      --bg-2: #06284a;
      --panel: rgba(7, 24, 44, 0.88);
      --panel-border: rgba(110, 194, 255, 0.28);
      --text: #eaf6ff;
      --muted: #92b7d6;
      --success: #5af0c2;
      --shadow: 0 24px 60px rgba(0, 0, 0, 0.35);
    }

    * { box-sizing: border-box; }

    body {
      margin: 0;
      min-height: 100vh;
      font-family: "Segoe UI", Tahoma, sans-serif;
      color: var(--text);
      background:
        radial-gradient(circle at top left, rgba(61, 185, 255, 0.24), transparent 30%),
        radial-gradient(circle at top right, rgba(0, 119, 255, 0.25), transparent 24%),
        linear-gradient(135deg, var(--bg-1), var(--bg-2));
    }

    .shell {
      width: min(1180px, calc(100% - 32px));
      margin: 32px auto;
    }

    .hero {
      display: grid;
      grid-template-columns: 120px 1fr;
      gap: 20px;
      align-items: center;
      padding: 28px;
      border: 1px solid var(--panel-border);
      border-radius: 28px;
      background: linear-gradient(160deg, rgba(8, 31, 57, 0.95), rgba(5, 19, 37, 0.92));
      box-shadow: var(--shadow);
      backdrop-filter: blur(16px);
    }

    .logo-box {
      width: 120px;
      height: 120px;
      border-radius: 28px;
      display: grid;
      place-items: center;
      background: rgba(8, 24, 41, 0.9);
      border: 1px solid rgba(110, 194, 255, 0.18);
      box-shadow: inset 0 1px 0 rgba(255,255,255,0.08);
      overflow: hidden;
    }

    .logo-image {
      width: 100%;
      height: 100%;
      object-fit: contain;
      display: block;
    }

    .hero h1 {
      margin: 0 0 8px;
      font-size: clamp(30px, 4vw, 52px);
      letter-spacing: 0.04em;
    }

    .hero p {
      margin: 0;
      color: var(--muted);
      font-size: 16px;
      line-height: 1.7;
    }

    .stats {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
      gap: 16px;
      margin-top: 20px;
    }

    .card {
      padding: 20px;
      border-radius: 22px;
      border: 1px solid var(--panel-border);
      background: var(--panel);
      box-shadow: var(--shadow);
      backdrop-filter: blur(12px);
    }

    .card span {
      display: block;
      color: var(--muted);
      font-size: 13px;
      text-transform: uppercase;
      letter-spacing: 0.08em;
    }

    .card strong {
      display: block;
      margin-top: 12px;
      font-size: 38px;
      line-height: 1;
    }

    .table-wrap {
      margin-top: 20px;
      padding: 20px;
      border-radius: 26px;
      border: 1px solid var(--panel-border);
      background: var(--panel);
      box-shadow: var(--shadow);
      overflow: hidden;
    }

    .table-head {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 12px;
      margin-bottom: 16px;
    }

    .table-head h2 {
      margin: 0;
      font-size: 22px;
    }

    .badge {
      padding: 8px 12px;
      border-radius: 999px;
      color: var(--success);
      background: rgba(90, 240, 194, 0.12);
      border: 1px solid rgba(90, 240, 194, 0.22);
      font-size: 13px;
    }

    table {
      width: 100%;
      border-collapse: collapse;
    }

    th, td {
      text-align: left;
      padding: 14px 12px;
      border-bottom: 1px solid rgba(146, 183, 214, 0.14);
      font-size: 14px;
    }

    th {
      color: #bfe0ff;
      font-size: 12px;
      letter-spacing: 0.08em;
      text-transform: uppercase;
    }

    tr:hover td {
      background: rgba(61, 185, 255, 0.04);
    }

    .empty {
      text-align: center;
      color: var(--muted);
      padding: 24px 12px;
    }

    @media (max-width: 700px) {
      .hero {
        grid-template-columns: 1fr;
        text-align: center;
      }

      .logo-box {
        margin: 0 auto;
      }

      .table-wrap {
        overflow-x: auto;
      }
    }
  </style>
</head>
<body>
  <main class="shell">
    <section class="hero">
      <div class="logo-box">
        <img src="/logo.png" alt="Falcons RP Logo" class="logo-image" />
      </div>
      <div>
        <h1>Falcons RP</h1>
        <p>Discord and MTA control panel for linked accounts, faction sync tracking, and server-side bridge monitoring.</p>
      </div>
    </section>

    <section class="stats">
      <article class="card">
        <span>Linked Accounts</span>
        <strong>${totalLinked}</strong>
      </article>
      <article class="card">
        <span>Sector Synced</span>
        <strong>${activeSectorSync}</strong>
      </article>
      <article class="card">
        <span>Leaders</span>
        <strong>${leaders}</strong>
      </article>
    </section>

    <section class="table-wrap">
      <div class="table-head">
        <h2>Linked Players</h2>
        <div class="badge">Bridge Online</div>
      </div>

      <table>
        <thead>
          <tr>
            <th>MTA Username</th>
            <th>Discord ID</th>
            <th>Sector</th>
            <th>Rank Type</th>
            <th>Linked At</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
    </section>
  </main>
</body>
</html>`);
});

// ===================================================
// MTA بيبعت القطاع بتاع اللاعب
// ===================================================
app.post('/mta/sector', (req, res) => {
  const { discordId, sector, isLeader } = req.body;
  if (!discordId || !sector) return res.status(400).json({ success: false });
  sectorsCache.set(discordId, { sector, isLeader: !!isLeader });
  res.json({ success: true });
});

// ===================================================
// MTA بيبعت إن اللاعب كتب /linkcheck وكود صح
// ===================================================
app.post('/mta/verified', (req, res) => {
  const { mtaUsername, code } = req.body;
  if (!mtaUsername || !code) return res.status(400).json({ success: false });
  codesStore[mtaUsername] = code;
  console.log(`[MTA] ✅ تحقق اللاعب ${mtaUsername} بكود ${code}`);
  res.json({ success: true });
});

app.get('/api/get-code/:username', (req, res) => {
  const code = codesStore[req.params.username];
  if (code) {
    res.json({ success: true, code });
  } else {
    res.json({ success: false });
  }
});

app.get('/api/pending-codes', (req, res) => {
  const snapshot = { ...codesStore };
  for (const key of Object.keys(snapshot)) {
    if (!snapshot[key]._sent) {
      snapshot[key] = codesStore[key];
    }
  }
  res.json(snapshot);
});

app.post('/api/verify', (req, res) => {
  const { mtaUsername, code } = req.body;
  if (!mtaUsername || !code) return res.status(400).json({ success: false });
  codesStore[mtaUsername] = code;
  console.log(`[BOT] 📨 كود للاعب ${mtaUsername}: ${code}`);
  res.json({ success: true });
});

app.post('/api/bind', (req, res) => {
  const { mtaUsername, discordId } = req.body;
  if (mtaUsername && discordId) saveLink(discordId, mtaUsername);
  res.json({ success: true });
});

app.post('/api/unbind', (req, res) => {
  const { discordId } = req.body;
  if (discordId) deleteLink(discordId);
  res.json({ success: true });
});

app.get('/api/sector/:discordId', (req, res) => {
  const cached = sectorsCache.get(req.params.discordId);
  if (cached) {
    res.json({ success: true, sector: cached.sector, isLeader: cached.isLeader });
  } else {
    res.json({ success: false, message: 'مش أونلاين أو مش مرتبط' });
  }
});

app.get('/api/linked', (req, res) => {
  res.json(getLinkedPlayersView());
});

const PORT = config.port;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ Bridge API شغال على بورت ${PORT}`);
});

export default app;

// © 2026 Ebrahem
import express from 'express';
import bodyParser from 'body-parser';
import path from 'path';
import { fileURLToPath } from 'url';
import { sectorsCache } from '../utils/autoSync.js';
import { saveLink, deleteLink, getAllLinks, getLinkByUsername, updateSector } from '../utils/database.js';
import { config } from '../config.js';

const app = express();
const __dirname = path.dirname(fileURLToPath(import.meta.url));

app.use(bodyParser.json({ limit: '1mb' }));
app.use(bodyParser.text({ type: '*/*', limit: '1mb' }));
app.use(express.static(path.join(__dirname, 'public')));

export const codesStore = {};

function normalizePayload(body) {
  let payload = body;
  if (!payload) return {};

  if (typeof payload === 'string') {
    try {
      payload = JSON.parse(payload);
    } catch {
      return {};
    }
  }

  if (Array.isArray(payload) && payload.length > 0) {
    payload = payload[0];
  }

  return payload && typeof payload === 'object' ? payload : {};
}

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

async function getLinkedPlayersView() {
  const players = await getAllLinks();
  return players.map((player) => {
    const cached = sectorsCache.get(player.discord_id);
    return {
      discordId: player.discord_id,
      mtaUsername: player.mta_username,
      sector: cached?.sector ?? player.sector ?? 'Pending',
      isLeader: cached?.isLeader ?? Boolean(player.is_leader),
      linkedAt: Number(player.linked_at),
    };
  });
}

app.get('/', async (req, res) => {
  const linkedPlayers = (await getLinkedPlayersView()).sort((a, b) => b.linkedAt - a.linkedAt);
  const totalLinked = linkedPlayers.length;
  const activeSectorSync = linkedPlayers.filter((player) => player.sector !== 'Pending').length;
  const leaders = linkedPlayers.filter((player) => player.isLeader).length;

  const rows = linkedPlayers.length
    ? linkedPlayers.map((player) => `
        <tr>
          <td>${escapeHtml(player.mtaUsername)}</td>
          <td>${escapeHtml(player.discordId)}</td>
          <td>${escapeHtml(player.sector)}</td>
          <td>${player.isLeader ? 'Leader' : 'Member'}</td>
          <td>${new Date(player.linkedAt).toLocaleString('en-US')}</td>
        </tr>
      `).join('')
    : `<tr><td colspan="5" class="empty">No linked accounts yet.</td></tr>`;

  res.type('html').send(`<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8" /><meta name="viewport" content="width=device-width, initial-scale=1.0" /><title>Falcons RP Control Panel</title><style>:root{--bg-1:#031120;--bg-2:#06284a;--panel:rgba(7,24,44,.88);--panel-border:rgba(110,194,255,.28);--text:#eaf6ff;--muted:#92b7d6;--success:#5af0c2;--shadow:0 24px 60px rgba(0,0,0,.35)}*{box-sizing:border-box}body{margin:0;min-height:100vh;font-family:"Segoe UI",Tahoma,sans-serif;color:var(--text);background:radial-gradient(circle at top left,rgba(61,185,255,.24),transparent 30%),radial-gradient(circle at top right,rgba(0,119,255,.25),transparent 24%),linear-gradient(135deg,var(--bg-1),var(--bg-2))}.shell{width:min(1180px,calc(100% - 32px));margin:32px auto}.hero{display:grid;grid-template-columns:120px 1fr;gap:20px;align-items:center;padding:28px;border:1px solid var(--panel-border);border-radius:28px;background:linear-gradient(160deg,rgba(8,31,57,.95),rgba(5,19,37,.92));box-shadow:var(--shadow)}.logo-box{width:120px;height:120px;border-radius:28px;display:grid;place-items:center;background:rgba(8,24,41,.9);border:1px solid rgba(110,194,255,.18);overflow:hidden}.logo-image{width:100%;height:100%;object-fit:contain;display:block}.hero h1{margin:0 0 8px;font-size:clamp(30px,4vw,52px)}.hero p{margin:0;color:var(--muted);font-size:16px;line-height:1.7}.stats{display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:16px;margin-top:20px}.card{padding:20px;border-radius:22px;border:1px solid var(--panel-border);background:var(--panel);box-shadow:var(--shadow)}.card span{display:block;color:var(--muted);font-size:13px;text-transform:uppercase;letter-spacing:.08em}.card strong{display:block;margin-top:12px;font-size:38px;line-height:1}.table-wrap{margin-top:20px;padding:20px;border-radius:26px;border:1px solid var(--panel-border);background:var(--panel);box-shadow:var(--shadow);overflow:hidden}.table-head{display:flex;justify-content:space-between;align-items:center;gap:12px;margin-bottom:16px}.table-head h2{margin:0;font-size:22px}.badge{padding:8px 12px;border-radius:999px;color:var(--success);background:rgba(90,240,194,.12);border:1px solid rgba(90,240,194,.22);font-size:13px}table{width:100%;border-collapse:collapse}th,td{text-align:left;padding:14px 12px;border-bottom:1px solid rgba(146,183,214,.14);font-size:14px}th{color:#bfe0ff;font-size:12px;letter-spacing:.08em;text-transform:uppercase}.empty{text-align:center;color:var(--muted);padding:24px 12px}</style></head><body><main class="shell"><section class="hero"><div class="logo-box"><img src="/logo.png" alt="Falcons RP Logo" class="logo-image" /></div><div><h1>Falcons RP</h1><p>Discord and MTA control panel for linked accounts, faction sync tracking, and server-side bridge monitoring.</p></div></section><section class="stats"><article class="card"><span>Linked Accounts</span><strong>${totalLinked}</strong></article><article class="card"><span>Sector Synced</span><strong>${activeSectorSync}</strong></article><article class="card"><span>Leaders</span><strong>${leaders}</strong></article></section><section class="table-wrap"><div class="table-head"><h2>Linked Players</h2><div class="badge">Bridge Online</div></div><table><thead><tr><th>MTA Username</th><th>Discord ID</th><th>Sector</th><th>Rank Type</th><th>Linked At</th></tr></thead><tbody>${rows}</tbody></table></section></main></body></html>`);
});

app.post('/mta/sector', async (req, res) => {
  const payload = normalizePayload(req.body);
  let { discordId, mtaUsername, sector, isLeader } = payload;

  if (!discordId && mtaUsername) {
    const link = await getLinkByUsername(String(mtaUsername));
    if (link) discordId = link.discord_id;
  }

  if (!discordId || !sector) {
    return res.status(400).json({ success: false });
  }

  sectorsCache.set(String(discordId), {
    sector: String(sector),
    isLeader: !!isLeader,
  });

  await updateSector(String(discordId), String(sector), !!isLeader);

  return res.json({ success: true });
});

app.post('/mta/verified', (req, res) => {
  const { mtaUsername, code } = normalizePayload(req.body);
  if (!mtaUsername || !code) return res.status(400).json({ success: false });
  codesStore[mtaUsername] = code;
  return res.json({ success: true });
});

app.get('/api/get-code/:username', (req, res) => {
  const code = codesStore[req.params.username];
  return code ? res.json({ success: true, code }) : res.json({ success: false });
});

app.get('/api/pending-codes', (req, res) => res.json({ ...codesStore }));

app.post('/api/verify', (req, res) => {
  const { mtaUsername, code } = normalizePayload(req.body);
  if (!mtaUsername || !code) return res.status(400).json({ success: false });
  codesStore[mtaUsername] = code;
  return res.json({ success: true });
});

app.post('/api/bind', async (req, res) => {
  const { mtaUsername, discordId } = normalizePayload(req.body);
  if (mtaUsername && discordId) await saveLink(discordId, mtaUsername);
  return res.json({ success: true });
});

app.post('/api/unbind', async (req, res) => {
  const { discordId } = normalizePayload(req.body);
  if (discordId) await deleteLink(discordId);
  return res.json({ success: true });
});

app.get('/api/sector/:discordId', (req, res) => {
  const cached = sectorsCache.get(req.params.discordId);
  if (cached) return res.json({ success: true, sector: cached.sector, isLeader: cached.isLeader });
  return res.json({ success: false, message: 'مش أونلاين أو مش مرتبط' });
});

app.get('/api/linked', async (req, res) => {
  return res.json(await getLinkedPlayersView());
});

const PORT = config.port;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Bridge API listening on ${PORT}`);
});

export default app;

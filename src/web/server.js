// © 2026 Ebrahem
import express from 'express';
import bodyParser from 'body-parser';
import { sectorsCache } from '../utils/autoSync.js';
import { saveLink, deleteLink, getAllLinks } from '../utils/database.js';
import { config } from '../config.js';

const { json } = bodyParser;
const app = express();
app.use(json());

// كاش الأكواد المؤقتة: mtaUsername => code
export const codesStore = {};

// ===================================================
// MTA بيبعت القطاع بتاع اللاعب (كل 30 ثانية)
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

// ===================================================
// البوت بيجيب الكود بعد ما اللاعب يكتب /link
// ===================================================
app.get('/api/get-code/:username', (req, res) => {
  const code = codesStore[req.params.username];
  if (code) {
    res.json({ success: true, code });
  } else {
    res.json({ success: false });
  }
});

// ===================================================
// البوت بيبعت الكود لـ MTA عشان يظهره للاعب
// (MTA بيسحبه من هنا كل 5 ثواني)
// ===================================================
app.get('/api/pending-codes', (req, res) => {
  const snapshot = { ...codesStore };
  // امسح الأكواد بعد ما MTA ياخدها
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

// bind
app.post('/api/bind', (req, res) => {
  const { mtaUsername, discordId } = req.body;
  if (mtaUsername && discordId) saveLink(discordId, mtaUsername);
  res.json({ success: true });
});

// unbind
app.post('/api/unbind', (req, res) => {
  const { discordId } = req.body;
  if (discordId) deleteLink(discordId);
  res.json({ success: true });
});

// sector
app.get('/api/sector/:discordId', (req, res) => {
  const cached = sectorsCache.get(req.params.discordId);
  if (cached) {
    res.json({ success: true, sector: cached.sector, isLeader: cached.isLeader });
  } else {
    res.json({ success: false, message: 'مش أونلاين أو مش مرتبط' });
  }
});

// linked
app.get('/api/linked', (req, res) => {
  res.json(getAllLinks().map(p => ({ discordId: p.discord_id })));
});

const PORT = config.port;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ Bridge API شغال على بورت ${PORT}`);
});

export default app;

// loqmanas dev
import express from 'express';
import bodyParser from 'body-parser';
const { json } = bodyParser;

const app = express();
app.use(json());

// المخزن
let codesStore = {};
let sectorsStore = {};

// ===================================================
// Routes اللي البوت بيستقبلها من MTA
// ===================================================

// MTA بيبعت إن اللاعب اتحقق
app.post('/mta/verified', (req, res) => {
    const { username, code } = req.body;
    if (username && code) {
        codesStore[username] = code;
        console.log(`[MTA] تم التحقق للاعب ${username} بكود ${code}`);
        res.json({ success: true });
    } else {
        res.status(400).json({ success: false });
    }
});

// MTA بيبعت القطاع بتاع اللاعب
app.post('/mta/sector', (req, res) => {
    const { discordId, sector, rank, type } = req.body;
    if (discordId) {
        sectorsStore[discordId] = { sector, rank, type };
        res.json({ success: true });
    } else {
        res.status(400).json({ success: false });
    }
});

// ===================================================
// Routes اللي البوت بيستخدمها داخلياً
// ===================================================

// البوت بيبعت الكود للاعب عن طريق MTA
app.post('/api/verify', (req, res) => {
    const { mtaUsername, code } = req.body;
    if (mtaUsername && code) {
        codesStore[mtaUsername] = code;
        console.log(`[BOT] كود للاعب ${mtaUsername}: ${code}`);
        res.json({ success: true });
    } else {
        res.status(400).json({ success: false });
    }
});

// البوت بيجيب الكود للتحقق
app.get('/api/get-code/:username', (req, res) => {
    const user = req.params.username;
    if (codesStore[user]) {
        res.json({ success: true, code: codesStore[user] });
    } else {
        res.json({ success: false, message: "لا يوجد كود" });
    }
});

// البوت بيجيب القطاع
app.get('/api/sector/:discordId', (req, res) => {
    const { discordId } = req.params;
    const data = sectorsStore[discordId];
    if (data) {
        res.json({ success: true, ...data });
    } else {
        res.json({ success: false, message: "مش مرتبط أو مش أونلاين" });
    }
});
app.get('/api/pending-codes', (req, res) => {
    res.json(codesStore);
    codesStore = {}; // امسح بعد ما MTA ياخدهم
});

// bind
app.post('/api/bind', (req, res) => {
    res.json({ success: true });
});

// unbind
app.post('/api/unbind', (req, res) => {
    const { discordId } = req.body;
    if (discordId) delete sectorsStore[discordId];
    res.json({ success: true });
});

// linked
app.get('/api/linked', (req, res) => {
    res.json([]);
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`✅ Bridge API is ready on port ${PORT}`));

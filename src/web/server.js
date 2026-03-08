import express from 'express';
import { json } from 'body-parser';

const app = express();
app.use(json());

// المخزن اللي هيشيل الأكواد
let codesStore = {}; 

// البوابة اللي البوت بيبعت لها الكود (لما تكتب /verify)
app.post('/api/verify', (req, res) => {
    const { mtaUsername, code } = req.body;
    codesStore[mtaUsername] = code; 
    console.log(`[!] تم استلام كود للاعب ${mtaUsername}: ${code}`);
    res.json({ success: true });
});

// البوابة اللي اللعبة (MTA) بتسحب منها الكود عشان تظهره في F1
app.get('/api/get-code/:username', (req, res) => {
    const user = req.params.username;
    if (codesStore[user]) {
        res.json({ success: true, code: codesStore[user] });
    } else {
        res.json({ success: false, message: "لا يوجد كود" });
    }
});

app.listen(5000, () => console.log('✅ Bridge API is ready on port 5000'));
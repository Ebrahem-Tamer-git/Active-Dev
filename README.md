<!-- loqmanas dev -->

# MTA‑Discord‑RP‑Connector

بوت ديسكورد متكامل يربط خادم RP على **MTA:SA** مع خادم ديسكورد. يتيح ربط حسابات اللاعبين داخل اللعبة بحساباتهم على ديسكورد ويوزع رولات تلقائيًا بحسب الفصيل (القطاع) داخل اللعبة.

## المميزات الأساسية
- ربط حساب MTA بحساب Discord عبر رمز تحقق مؤقت (`/verify` → `/link`).
- إلغاء الربط (`/unlink`).
- إعطاء رولات تلقائيًا بناءً على القطاع (`/assignrole`).
- مزامنة رولات جميع اللاعبين المرتبطين (`/syncroles`).
- عرض معلومات القطاع للعضو (`/sectorinfo`).
- واجهة ويب إدارية بسيطة للتكوين والـ logs.

## المتطلبات
- Node.js >= 18
- حساب بوت Discord مع صلاحيات `applications.commands`, `manage_roles`, `read_message_history`.
- خادم MTA مع API HTTP يطلّب النقاط التالية:
  - `POST /bind` – ربط حساب.
  - `POST /unbind` – إلغاء الربط.
  - `POST /verify` – إرسال رمز تحقق إلى اللعبة.
  - `GET /sector/:discordId` – إرجاع القطاع الحالي للعضو.
  - `GET /linked` – إرجاع جميع الحسابات المرتبطة.

## الإعداد
1. **إنشاء ملف `.env`** وملء القيم:
   dotenv
   DISCORD_TOKEN=YOUR_TOKEN
   CLIENT_ID=YOUR_CLIENT_ID
   GUILD_ID=YOUR_GUILD_ID
   MTA_API_URL=http://YOUR_MTA_SERVER:PORT/api
   VERIFY_CODE_TTL=300   # عمر رمز التحقق بالثواني
   
2. تثبيت الاعتمادات:
   bash
   npm install
   
3. تشغيل البوت:
   bash
   npm run start
   
4. (اختياري) تشغيل لوحة الإدارة:
   bash
   node src/web/server.js
   

## هيكل المجلدات

MTA-Discord-RP-Connector/
├─ src/
│  ├─ index.js               # نقطة دخول البوت
│  ├─ config.js              # إعدادات البيئة
│  ├─ commands/              # جميع أوامر slash
│  │   ├─ link.js
│  │   ├─ unlink.js
│  │   ├─ verify.js
│  │   ├─ assignrole.js
│  │   ├─ syncroles.js
│  │   └─ sectorinfo.js
│  ├─ utils/                 # وظائف مساعدة
│  │   ├─ verification.js
│  │   ├─ mtaAPI.js
│  │   └─ sectorRoles.js
│  └─ web/
│      └─ server.js          # لوحة الإدارة البسيطة
├─ package.json
├─ .env
└─ README.md


## ملاحظات هامة
- **التحقق من الصلاحيات:** يجب أن يكون للبوت صلاحية `Manage Roles` لتعديل الرولات.
- **إدارة الأخطاء:** جميع الأوامر تتضمن تعاملًا شاملاً مع الأخطاء وتُعيد رسائل واضحة للمستخدم.
- **التوسعة:** يمكنك إضافة مزيد من القطاعات أو رولات مخصصة عن طريق تعديل `sectorRoles.js`.

---
© 2026 Loqmanas – ThailandCodes™
import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const db = new Database(path.join(__dirname, '../../data/linked_players.db'));

// إنشاء الجدول إذا لم يكن موجوداً
db.exec(`
  CREATE TABLE IF NOT EXISTS linked_players (
    discord_id   TEXT PRIMARY KEY,
    mta_username TEXT NOT NULL,
    sector       TEXT DEFAULT NULL,
    linked_at    INTEGER NOT NULL
  )
`);

/** حفظ ربط جديد */
export function saveLink(discordId, mtaUsername) {
  const stmt = db.prepare(`
    INSERT INTO linked_players (discord_id, mta_username, linked_at)
    VALUES (@discordId, @mtaUsername, @linkedAt)
    ON CONFLICT(discord_id) DO UPDATE SET mta_username = @mtaUsername, linked_at = @linkedAt
  `);
  stmt.run({ discordId, mtaUsername, linkedAt: Date.now() });
}

/** حذف ربط */
export function deleteLink(discordId) {
  db.prepare('DELETE FROM linked_players WHERE discord_id = ?').run(discordId);
}

/** جلب ربط واحد */
export function getLink(discordId) {
  return db.prepare('SELECT * FROM linked_players WHERE discord_id = ?').get(discordId);
}

/** جلب كل المرتبطين */
export function getAllLinks() {
  return db.prepare('SELECT * FROM linked_players').all();
}

/** تحديث القطاع */
export function updateSector(discordId, sector) {
  db.prepare('UPDATE linked_players SET sector = ? WHERE discord_id = ?').run(sector, discordId);
}

export default db;

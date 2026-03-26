// © 2026 Ebrahem
import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const db = new Database(path.join(__dirname, '../../data/players.db'));

db.exec(`
  CREATE TABLE IF NOT EXISTS linked_players (
    discord_id   TEXT PRIMARY KEY,
    mta_username TEXT NOT NULL UNIQUE,
    sector       TEXT DEFAULT NULL,
    is_leader    INTEGER DEFAULT 0,
    linked_at    INTEGER NOT NULL
  )
`);

export function saveLink(discordId, mtaUsername) {
  db.prepare(`
    INSERT INTO linked_players (discord_id, mta_username, linked_at)
    VALUES (?, ?, ?)
    ON CONFLICT(discord_id) DO UPDATE SET mta_username = excluded.mta_username, linked_at = excluded.linked_at
  `).run(discordId, mtaUsername, Date.now());
}

export function deleteLink(discordId) {
  db.prepare('DELETE FROM linked_players WHERE discord_id = ?').run(discordId);
}

export function getLink(discordId) {
  return db.prepare('SELECT * FROM linked_players WHERE discord_id = ?').get(discordId);
}

export function getLinkByUsername(mtaUsername) {
  return db.prepare('SELECT * FROM linked_players WHERE mta_username = ?').get(mtaUsername);
}

export function getAllLinks() {
  return db.prepare('SELECT * FROM linked_players').all();
}

export function updateSector(discordId, sector, isLeader = 0) {
  db.prepare('UPDATE linked_players SET sector = ?, is_leader = ? WHERE discord_id = ?')
    .run(sector, isLeader ? 1 : 0, discordId);
}

export default db;

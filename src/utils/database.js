// © 2026 Ebrahem
import pg from 'pg';
import * as dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;

const ssl =
  process.env.DATABASE_SSL === 'true' || process.env.RAILWAY_ENVIRONMENT
    ? { rejectUnauthorized: false }
    : false;

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl,
});

export async function initDb() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS linked_players (
      discord_id   TEXT PRIMARY KEY,
      mta_username TEXT NOT NULL UNIQUE,
      sector       TEXT DEFAULT NULL,
      is_leader    INTEGER DEFAULT 0,
      linked_at    BIGINT NOT NULL
    )
  `);
}

export async function saveLink(discordId, mtaUsername) {
  await pool.query(
    `
      INSERT INTO linked_players (discord_id, mta_username, linked_at)
      VALUES ($1, $2, $3)
      ON CONFLICT (discord_id)
      DO UPDATE SET
        mta_username = EXCLUDED.mta_username,
        linked_at = EXCLUDED.linked_at
    `,
    [String(discordId), String(mtaUsername), Date.now()]
  );
}

export async function deleteLink(discordId) {
  await pool.query('DELETE FROM linked_players WHERE discord_id = $1', [String(discordId)]);
}

export async function getLink(discordId) {
  const result = await pool.query(
    'SELECT * FROM linked_players WHERE discord_id = $1 LIMIT 1',
    [String(discordId)]
  );
  return result.rows[0] ?? null;
}

export async function getLinkByUsername(mtaUsername) {
  const result = await pool.query(
    'SELECT * FROM linked_players WHERE mta_username = $1 LIMIT 1',
    [String(mtaUsername)]
  );
  return result.rows[0] ?? null;
}

export async function getAllLinks() {
  const result = await pool.query('SELECT * FROM linked_players ORDER BY linked_at DESC');
  return result.rows;
}

export async function updateSector(discordId, sector, isLeader = 0) {
  await pool.query(
    'UPDATE linked_players SET sector = $1, is_leader = $2 WHERE discord_id = $3',
    [sector, isLeader ? 1 : 0, String(discordId)]
  );
}

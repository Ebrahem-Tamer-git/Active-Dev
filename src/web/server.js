// © 2026 Ebrahem
import express from 'express';
import bodyParser from 'body-parser';
import path from 'path';
import { fileURLToPath } from 'url';
import { sectorsCache } from '../utils/autoSync.js';
import { saveLink, deleteLink, getAllLinks } from '../utils/database.js';
import { config } from '../config.js';

const app = express();
const __dirname = path.dirname(fileURLToPath(import.meta.url));

app.use(bodyParser.json());
app.use(bodyParser.text({ type: '*/*' }));
app.use(express.static(path.join(__dirname, 'public')));

export const codesStore = {};

function parsePayload(body) {
  if (!body) return {};
  if (typeof body === 'object') return body;

  try {
    return JSON.parse(body);
  } catch {
    return {};
  }
}

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
        linear-gradient(135deg, var(--bg-1), var(--bg-

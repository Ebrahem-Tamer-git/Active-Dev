// © 2026 Ebrahem
import { getAllLinks, updateSector } from './database.js';
import { getRoleId, sectorRoleMap } from './sectorRoles.js';

const SYNC_INTERVAL_MS = 10_000;

// sectorsCache: بيتملى من MTA عن طريق /mta/sector
export const sectorsCache = new Map(); // discordId => { sector, isLeader }

export function startAutoSync(client) {
  console.log('🔄 Auto-sync started (every 10s)');

  setInterval(async () => {
    const guild = client.guilds.cache.first();
    if (!guild) return;

    const players = getAllLinks();
    if (players.length === 0) return;

    let success = 0, failed = 0;

    for (const { discord_id } of players) {
      try {
        const cached = sectorsCache.get(discord_id);
        if (!cached) { failed++; continue; }

        const member = await guild.members.fetch(discord_id).catch(() => null);
        if (!member) { failed++; continue; }

        const roleId = getRoleId(cached.sector, cached.isLeader);
        if (!roleId) { failed++; continue; }

        // إزالة كل رولات القطاعات القديمة
        const allRoleIds = Object.values(sectorRoleMap)
          .flatMap(r => [r.member, r.leader])
          .filter(Boolean);
        await member.roles.remove(allRoleIds).catch(() => null);

        // إضافة الرول الجديد
        await member.roles.add(roleId);
        updateSector(discord_id, cached.sector, cached.isLeader);
        success++;
      } catch (e) {
        console.error(`[AutoSync] خطأ مع ${discord_id}:`, e.message);
        failed++;
      }
    }

    if (success > 0 || failed > 0) {
      console.log(`[AutoSync] ✅ نجح: ${success} | ❌ فشل: ${failed}`);
    }
  }, SYNC_INTERVAL_MS);
}

// © 2026 Ebrahem
import { getAllLinks, updateSector } from './database.js';
import { getRoleId, sectorRoleMap } from './sectorRoles.js';

const SYNC_INTERVAL_MS = 10_000;

// discordId => { sector, isLeader }
export const sectorsCache = new Map();

function getAllFactionRoleIds() {
  return Object.values(sectorRoleMap)
    .flatMap((roles) => [roles.member, roles.leader])
    .filter(Boolean);
}

export async function syncMemberRoles(guild, discordId) {
  const cached = sectorsCache.get(discordId);
  if (!cached) {
    return { ok: false, reason: 'missing_sector' };
  }

  const member = await guild.members.fetch(discordId).catch(() => null);
  if (!member) {
    return { ok: false, reason: 'member_not_found' };
  }

  const allRoleIds = getAllFactionRoleIds();

  // Remove old faction roles first, always.
  if (allRoleIds.length > 0) {
    await member.roles.remove(allRoleIds).catch(() => null);
  }

  const roleId = getRoleId(cached.sector, cached.isLeader);

  updateSector(discordId, cached.sector, cached.isLeader);

  // If no role is mapped for this sector (like Civilians), that's still a successful sync:
  // old faction roles were removed and there is no new role to add.
  if (!roleId) {
    return {
      ok: true,
      removedOnly: true,
      sector: cached.sector,
      isLeader: cached.isLeader,
    };
  }

  await member.roles.add(roleId);

  return {
    ok: true,
    removedOnly: false,
    sector: cached.sector,
    isLeader: cached.isLeader,
  };
}

export function startAutoSync(client) {
  console.log('Auto-sync started (every 10s)');

  setInterval(async () => {
    const guild = client.guilds.cache.first();
    if (!guild) return;

    const players = getAllLinks();
    if (players.length === 0) return;

    let success = 0;
    let failed = 0;

    for (const { discord_id } of players) {
      try {
        const result = await syncMemberRoles(guild, discord_id);
        if (result.ok) {
          success++;
        } else {
          failed++;
        }
      } catch (e) {
        console.error(`[AutoSync] Error with ${discord_id}:`, e.message);
        failed++;
      }
    }

    if (success > 0 || failed > 0) {
      console.log(`[AutoSync] success: ${success} | failed: ${failed}`);
    }
  }, SYNC_INTERVAL_MS);
}

// © 2026 Ebrahem
import { getAllLinks, updateSector } from './database.js';
import { getRoleId, sectorRoleMap } from './sectorRoles.js';
import { config } from '../config.js';

const SYNC_INTERVAL_MS = 10_000;

// discordId => { sector, isLeader }
export const sectorsCache = new Map();

function getConfiguredFactionRoleIds() {
  return Object.values(sectorRoleMap)
    .flatMap((roles) => [roles.member, roles.leader])
    .filter(Boolean)
    .map(String);
}

function getExistingFactionRoleIds(guild) {
  const configured = getConfiguredFactionRoleIds();
  return configured.filter((roleId) => guild.roles.cache.has(roleId));
}

export async function syncMemberRoles(guild, discordId) {
  const cached = sectorsCache.get(String(discordId));
  if (!cached) {
    return { ok: false, reason: 'missing_sector' };
  }

  const member = await guild.members.fetch(String(discordId)).catch(() => null);
  if (!member) {
    return { ok: false, reason: 'member_not_found' };
  }

  const existingRoleIds = getExistingFactionRoleIds(guild);

  if (existingRoleIds.length > 0) {
    await member.roles.remove(existingRoleIds).catch(() => null);
  }

  const roleId = getRoleId(cached.sector, cached.isLeader);
  updateSector(String(discordId), cached.sector, cached.isLeader);

  if (!roleId) {
    return {
      ok: true,
      removedOnly: true,
      sector: cached.sector,
      isLeader: cached.isLeader,
    };
  }

  if (!guild.roles.cache.has(String(roleId))) {
    return {
      ok: false,
      reason: `unknown_role:${roleId}`,
      sector: cached.sector,
      guildId: guild.id,
    };
  }

  await member.roles.add(String(roleId));

  return {
    ok: true,
    removedOnly: false,
    sector: cached.sector,
    isLeader: cached.isLeader,
  };
}

export function startAutoSync(client) {
  console.log(`Auto-sync started (every ${SYNC_INTERVAL_MS / 1000}s)`);

  setInterval(async () => {
    try {
      const guild = client.guilds.cache.get(config.guildId);
      if (!guild) {
        console.log(`[AutoSync] skipped: guild ${config.guildId} not found`);
        return;
      }

      const players = getAllLinks();
      if (players.length === 0) {
        return;
      }

      let success = 0;
      let failed = 0;

      for (const { discord_id, mta_username } of players) {
        try {
          const result = await syncMemberRoles(guild, discord_id);

          if (result.ok) {
            success++;
            console.log(
              `[AutoSync] synced ${mta_username} -> ${result.sector} (${result.removedOnly ? 'removed old roles only' : 'role updated'})`
            );
          } else {
            failed++;
            console.log(`[AutoSync] skipped ${mta_username}: ${result.reason}`);
          }
        } catch (error) {
          failed++;
          console.error(`[AutoSync] error with ${mta_username} (${discord_id}):`, error.message);
        }
      }

      if (success > 0 || failed > 0) {
        console.log(`[AutoSync] success: ${success} | failed: ${failed}`);
      }
    } catch (error) {
      console.error('[AutoSync] fatal loop error:', error.message);
    }
  }, SYNC_INTERVAL_MS);
}

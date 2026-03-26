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

  const targetRoleId = getRoleId(cached.sector, cached.isLeader);
  const factionRoleIds = getExistingFactionRoleIds(guild);
  const memberFactionRoles = factionRoleIds.filter((roleId) => member.roles.cache.has(roleId));
  const hasTargetRole = targetRoleId ? member.roles.cache.has(String(targetRoleId)) : false;

  updateSector(String(discordId), cached.sector, cached.isLeader);

  // No role mapped for this faction: remove old faction roles only if any exist.
  if (!targetRoleId) {
    if (memberFactionRoles.length > 0) {
      await member.roles.remove(memberFactionRoles).catch(() => null);
      return {
        ok: true,
        removedOnly: true,
        changed: true,
        sector: cached.sector,
        isLeader: cached.isLeader,
      };
    }

    return {
      ok: true,
      removedOnly: true,
      changed: false,
      sector: cached.sector,
      isLeader: cached.isLeader,
    };
  }

  if (!guild.roles.cache.has(String(targetRoleId))) {
    return {
      ok: false,
      reason: `unknown_role:${targetRoleId}`,
      sector: cached.sector,
    };
  }

  const rolesToRemove = memberFactionRoles.filter((roleId) => roleId !== String(targetRoleId));

  // If the member already has only the correct role, don't touch anything.
  if (rolesToRemove.length === 0 && hasTargetRole) {
    return {
      ok: true,
      removedOnly: false,
      changed: false,
      sector: cached.sector,
      isLeader: cached.isLeader,
    };
  }

  if (rolesToRemove.length > 0) {
    await member.roles.remove(rolesToRemove).catch(() => null);
  }

  if (!hasTargetRole) {
    await member.roles.add(String(targetRoleId));
  }

  return {
    ok: true,
    removedOnly: false,
    changed: true,
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
      let changed = 0;

      for (const { discord_id, mta_username } of players) {
        try {
          const result = await syncMemberRoles(guild, discord_id);

          if (result.ok) {
            success++;
            if (result.changed) {
              changed++;
              console.log(
                `[AutoSync] updated ${mta_username} -> ${result.sector} (${result.removedOnly ? 'removed old roles only' : 'role synced'})`
              );
            }
          } else {
            failed++;
            console.log(`[AutoSync] skipped ${mta_username}: ${result.reason}`);
          }
        } catch (error) {
          failed++;
          console.error(`[AutoSync] error with ${mta_username} (${discord_id}):`, error.message);
        }
      }

      if (changed > 0 || failed > 0) {
        console.log(`[AutoSync] success: ${success} | changed: ${changed} | failed: ${failed}`);
      }
    } catch (error) {
      console.error('[AutoSync] fatal loop error:', error.message);
    }
  }, SYNC_INTERVAL_MS);
}

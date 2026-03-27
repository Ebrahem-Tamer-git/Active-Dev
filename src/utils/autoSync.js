// © 2026 Ebrahem
import { getAllLinks, updateSector } from './database.js';
import { getRoleId, sectorRoleMap } from './sectorRoles.js';
import { config } from '../config.js';

const SYNC_INTERVAL_MS = 10_000;

export const sectorsCache = new Map();

function getConfiguredFactionRoleIds() {
  return Object.values(sectorRoleMap)
    .flatMap(roles => [roles.member, roles.leader])
    .filter(Boolean)
    .map(String);
}

function getExistingFactionRoleIds(guild) {
  const configured = getConfiguredFactionRoleIds();
  return configured.filter(roleId => guild.roles.cache.has(roleId));
}

export async function syncMemberRoles(guild, discordId) {
  const cached = sectorsCache.get(String(discordId));
  if (!cached) return { ok: false, reason: 'missing_sector' };

  const member = await guild.members.fetch(String(discordId)).catch(() => null);
  if (!member) return { ok: false, reason: 'member_not_found' };

  const targetRoleId = getRoleId(cached.sector, cached.isLeader);
  const factionRoleIds = getExistingFactionRoleIds(guild);
  const memberFactionRoles = factionRoleIds.filter(roleId => member.roles.cache.has(roleId));
  const hasTargetRole = targetRoleId ? member.roles.cache.has(String(targetRoleId)) : false;

  await updateSector(String(discordId), cached.sector, cached.isLeader);

  if (!targetRoleId) {
    if (memberFactionRoles.length > 0) {
      await member.roles.remove(memberFactionRoles).catch(() => null);
      return { ok: true, changed: true, removedOnly: true, sector: cached.sector };
    }
    return { ok: true, changed: false, removedOnly: true, sector: cached.sector };
  }

  if (!guild.roles.cache.has(String(targetRoleId))) {
    return { ok: false, reason: `unknown_role:${targetRoleId}` };
  }

  const rolesToRemove = memberFactionRoles.filter(roleId => roleId !== String(targetRoleId));

  if (rolesToRemove.length === 0 && hasTargetRole) {
    return { ok: true, changed: false, removedOnly: false, sector: cached.sector };
  }

  if (rolesToRemove.length > 0) {
    await member.roles.remove(rolesToRemove).catch(() => null);
  }

  if (!hasTargetRole) {
    await member.roles.add(String(targetRoleId));
  }

  return { ok: true, changed: true, removedOnly: false, sector: cached.sector };
}

export function startAutoSync(client) {
  console.log(`Auto-sync started (every ${SYNC_INTERVAL_MS / 1000}s)`);

  setInterval(async () => {
    try {
      const guild = client.guilds.cache.get(config.guildId);
      if (!guild) return;

      const players = await getAllLinks();
      if (players.length === 0) return;

      for (const { discord_id } of players) {
        await syncMemberRoles(guild, discord_id).catch(() => null);
      }
    } catch (error) {
      console.error('[AutoSync] fatal loop error:', error.message);
    }
  }, SYNC_INTERVAL_MS);
}

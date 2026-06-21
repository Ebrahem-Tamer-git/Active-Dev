// © 2026 Ebrahem
import { getAllLinks, updateSector } from './database.js';
import { getRoleId, sectorRoleMap } from './sectorRoles.js';
import { config } from '../config.js';

const SYNC_INTERVAL_MS = 10_000;
const DEFAULT_SECTOR = 'Civilians';

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

export async function syncMemberRoles(guild, discordId, fallback = null) {
  const cached = sectorsCache.get(String(discordId));
  const fallbackSector = fallback?.sector;
  const fallbackLeader = fallback?.isLeader;

  const sector = cached?.sector ?? fallbackSector ?? DEFAULT_SECTOR;
  const isLeader = cached?.isLeader ?? fallbackLeader ?? false;

  console.log('[RoleSync] start', {
    discordId: String(discordId),
    sector,
    isLeader,
    guildId: guild?.id
  });

  const member = await guild.members.fetch(String(discordId)).catch((error) => {
    console.error('[RoleSync] member fetch failed:', error.message);
    return null;
  });

  if (!member) {
    return { ok: false, reason: 'member_not_found' };
  }

  const targetRoleId = getRoleId(sector, isLeader);
  console.log('[RoleSync] target role:', targetRoleId);

  const factionRoleIds = getExistingFactionRoleIds(guild);
  const memberFactionRoles = factionRoleIds.filter((roleId) => member.roles.cache.has(roleId));
  const hasTargetRole = targetRoleId ? member.roles.cache.has(String(targetRoleId)) : false;

  await updateSector(String(discordId), sector, isLeader);

  if (!targetRoleId) {
    console.error('[RoleSync] no target role mapped for sector:', sector);
    return { ok: false, reason: `no_role_mapped:${sector}` };
  }

  const targetRole = guild.roles.cache.get(String(targetRoleId));
  if (!targetRole) {
    console.error('[RoleSync] target role not found in guild:', targetRoleId);
    return { ok: false, reason: `unknown_role:${targetRoleId}` };
  }

  const botMember = guild.members.me ?? await guild.members.fetchMe().catch((error) => {
    console.error('[RoleSync] bot member fetch failed:', error.message);
    return null;
  });

  if (!botMember) {
    return { ok: false, reason: 'bot_member_not_found' };
  }

  console.log('[RoleSync] role info', {
    roleName: targetRole.name,
    roleId: targetRole.id,
    botHighestRole: botMember.roles.highest.name,
    botHighestPosition: botMember.roles.highest.position,
    targetPosition: targetRole.position
  });

  if (botMember.roles.highest.position <= targetRole.position) {
    console.error('[RoleSync] bot role is below target role');
    return { ok: false, reason: 'bot_role_too_low' };
  }

  const rolesToRemove = memberFactionRoles.filter((roleId) => roleId !== String(targetRoleId));

  if (rolesToRemove.length === 0 && hasTargetRole) {
    console.log('[RoleSync] member already has target role');
    return { ok: true, changed: false, removedOnly: false, sector };
  }

  if (rolesToRemove.length > 0) {
    console.log('[RoleSync] removing old faction roles:', rolesToRemove);
    await member.roles.remove(rolesToRemove);
  }

  if (!hasTargetRole) {
    console.log('[RoleSync] adding role:', targetRole.name, targetRole.id);
    await member.roles.add(String(targetRoleId));
  }

  const updatedMember = await guild.members.fetch(String(discordId));
  const nowHasRole = updatedMember.roles.cache.has(String(targetRoleId));

  console.log('[RoleSync] finished', {
    discordId: String(discordId),
    targetRoleId: String(targetRoleId),
    nowHasRole
  });

  if (!nowHasRole) {
    return { ok: false, reason: 'role_not_applied_after_add' };
  }

  return {
    ok: true,
    changed: !hasTargetRole || rolesToRemove.length > 0,
    removedOnly: false,
    sector
  };
}

export function startAutoSync(client) {
  console.log(`Auto-sync started (every ${SYNC_INTERVAL_MS / 1000}s)`);

  setInterval(async () => {
    try {
      const guild = client.guilds.cache.get(config.guildId);
      if (!guild) return;

      const players = await getAllLinks();
      if (players.length === 0) return;

      for (const player of players) {
        const fallback = {
          sector: player.sector ?? null,
          isLeader: Boolean(player.is_leader),
        };

        const result = await syncMemberRoles(guild, player.discord_id, fallback).catch((error) => {
          console.error('[AutoSync] member sync error:', player.discord_id, error.message);
          return null;
        });

        if (!result?.ok) {
          console.warn('[AutoSync] member sync failed:', {
            discordId: player.discord_id,
            sector: fallback.sector,
            reason: result?.reason || 'unknown'
          });
        }
      }
    } catch (error) {
      console.error('[AutoSync] fatal loop error:', error.message);
    }
  }, SYNC_INTERVAL_MS);
}

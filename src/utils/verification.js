// © 2026 Ebrahem
import { v4 as uuidv4 } from 'uuid';
import { config } from '../config.js';

const pendingVerifications = new Map();

function removeExpiredEntry(discordId) {
  const data = pendingVerifications.get(discordId);
  if (!data) return;

  if (Date.now() > data.expiresAt) {
    pendingVerifications.delete(discordId);
  }
}

export function generateVerifyCode(discordId, mtaUsername) {
  for (const [key, value] of pendingVerifications.entries()) {
    if (value.mtaUsername === mtaUsername && key !== discordId) {
      removeExpiredEntry(key);
    }
  }

  for (const [key, value] of pendingVerifications.entries()) {
    if (value.mtaUsername === mtaUsername && key !== discordId) {
      return { error: 'username_pending_elsewhere' };
    }
  }

  const code = uuidv4().split('-')[0].toUpperCase();
  const expiresAt = Date.now() + config.verifyCodeTTL * 1000;

  pendingVerifications.set(discordId, { code, mtaUsername, expiresAt });

  setTimeout(() => {
    const current = pendingVerifications.get(discordId);
    if (current && current.code === code) {
      pendingVerifications.delete(discordId);
    }
  }, config.verifyCodeTTL * 1000);

  return { code, expiresAt };
}

export function getPendingVerification(discordId) {
  const data = pendingVerifications.get(discordId);
  if (!data) return null;

  if (Date.now() > data.expiresAt) {
    pendingVerifications.delete(discordId);
    return null;
  }

  return data;
}

export function getPendingVerificationByUsername(mtaUsername) {
  for (const [discordId, data] of pendingVerifications.entries()) {
    if (Date.now() > data.expiresAt) {
      pendingVerifications.delete(discordId);
      continue;
    }

    if (data.mtaUsername === mtaUsername) {
      return { discordId, ...data };
    }
  }

  return null;
}

export function deletePendingVerification(discordId) {
  pendingVerifications.delete(discordId);
}

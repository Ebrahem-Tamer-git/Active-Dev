// © 2026 Ebrahem
import { v4 as uuidv4 } from 'uuid';
import { config } from '../config.js';

const pendingVerifications = new Map();

export function generateVerifyCode(discordId, mtaUsername) {
  const code = uuidv4().split('-')[0].toUpperCase();
  const expiresAt = Date.now() + config.verifyCodeTTL * 1000;
  pendingVerifications.set(discordId, { code, mtaUsername, expiresAt });
  setTimeout(() => pendingVerifications.delete(discordId), config.verifyCodeTTL * 1000);
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

export function deletePendingVerification(discordId) {
  pendingVerifications.delete(discordId);
}

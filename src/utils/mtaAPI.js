//loqmanas dev
import fetch from 'node-fetch';
import { config } from '../config.js';

function getHeaders(extra = {}) {
  return {
    'Content-Type': 'application/json',
    ...extra
  };
}

export async function bindMtaAccount(mtaUsername, discordId) {
  try {
    const res = await fetch(`${config.mtaApiUrl}/api/bind`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ mtaUsername, discordId })
    });
    return await res.json();
  } catch (e) {
    console.error(e);
    return { success: false, message: 'خطأ في الاتصال بخادم MTA.' };
  }
}

export async function unbindMtaAccount(discordId) {
  try {
    const res = await fetch(`${config.mtaApiUrl}/api/unbind`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ discordId })
    });
    return await res.json();
  } catch (e) {
    console.error(e);
    return { success: false, message: 'خطأ في الاتصال بخادم MTA.' };
  }
}

export async function sendVerificationCodeToMta(mtaUsername, code) {
  try {
    const res = await fetch(`${config.mtaApiUrl}/api/verify`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ mtaUsername, code })
    });
    const data = await res.json();
    console.log(`[mtaAPI] /api/verify response:`, data);
    return data.success;
  } catch (e) {
    console.error('[mtaAPI] Error:', e.message);
    return false;
  }
}

export async function getMtaSector(discordId) {
  try {
    const res = await fetch(`${config.mtaApiUrl}/api/sector/${discordId}`, {
      headers: getHeaders()
    });
    return await res.json();
  } catch (e) {
    console.error(e);
    return { success: false, message: 'فشل جلب البيانات من MTA.' };
  }
}

export async function getAllLinkedPlayers() {
  try {
    const res = await fetch(`${config.mtaApiUrl}/api/linked`, {
      headers: getHeaders()
    });
    return await res.json();
  } catch (e) {
    console.error(e);
    return [];
  }
}

//loqmanas dev
import fetch from 'node-fetch';
import { config } from '../config.js';

// Authorization header مشترك
function getHeaders(extra = {}) {
  const credentials = Buffer.from(`${config.mtaUser}:${config.mtaPass}`).toString('base64');
  return {
    'Content-Type': 'application/json',
    'Authorization': `Basic ${credentials}`,
    ...extra
  };
}

export async function bindMtaAccount(mtaUsername, discordId) {
  try {
    const res = await fetch(`${config.mtaApiUrl}/bind`, {
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
    const res = await fetch(`${config.mtaApiUrl}/unbind`, {
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
    const res = await fetch(`${config.mtaApiUrl}/verify`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ mtaUsername, code })
    });
    const data = await res.json();
    return data.success;
  } catch (e) {
    console.error(e);
    return false;
  }
}

export async function getMtaSector(discordId) {
  try {
    const res = await fetch(`${config.mtaApiUrl}/sector/${discordId}`, {
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
    const res = await fetch(`${config.mtaApiUrl}/linked`, {
      headers: getHeaders()
    });
    return await res.json();
  } catch (e) {
    console.error(e);
    return [];
  }
}

/**
 * Tidies up a phone number a parent typed, for the WhatsApp support group.
 * South African numbers may be typed the local way (082 123 4567); they are
 * stored in the international form (+27821234567) that WhatsApp uses.
 * Returns "" for an empty field and null for something that isn't a number.
 */
export function normalizePhone(input: string): string | null {
  const raw = input.trim();
  if (!raw) return "";
  if (!/^[+0-9 ()\-.]+$/.test(raw)) return null;
  let digits = raw.replace(/[^0-9+]/g, "");
  if (digits.indexOf("+") > 0 || (digits.match(/\+/g) ?? []).length > 1) return null;
  if (digits.startsWith("00")) digits = "+" + digits.slice(2);
  else if (/^0[0-9]{9}$/.test(digits)) digits = "+27" + digits.slice(1);
  else if (/^27[0-9]{9}$/.test(digits)) digits = "+" + digits;
  if (!/^\+[0-9]{9,15}$/.test(digits)) return null;
  if (digits.startsWith("+270")) return null;
  return digits;
}

/** True for a WhatsApp group invite link (https://chat.whatsapp.com/…). */
export function isInviteLink(link: string): boolean {
  return /^https:\/\/chat\.whatsapp\.com\/[A-Za-z0-9]{10,40}$/.test(link);
}

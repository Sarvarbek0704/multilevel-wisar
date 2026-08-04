/**
 * Normalize a user-typed phone number to E.164.
 * Uzbek numbers may be entered as 901234567, 998901234567, +998 90 123 45 67.
 */
export function normalizePhone(raw: string): string | null {
  const trimmed = String(raw ?? '').trim();
  if (!trimmed) return null;

  const hadPlus = trimmed.startsWith('+');
  const digits = trimmed.replace(/\D/g, '');
  if (!digits) return null;

  // Local Uzbek forms
  if (!hadPlus) {
    if (digits.length === 9) return `+998${digits}`;
    if (digits.length === 12 && digits.startsWith('998')) return `+${digits}`;
    if (digits.length === 13 && digits.startsWith('0998')) return `+${digits.slice(1)}`;
  }

  // Anything else must already look like an international number
  if (digits.length < 8 || digits.length > 15) return null;
  return `+${digits}`;
}

/** 90 123 45 67 → +998 90 *** ** 67 (safe to show in responses/UI) */
export function maskPhone(phone: string): string {
  if (phone.length < 6) return '***';
  return `${phone.slice(0, phone.length - 6)}***${phone.slice(-2)}`;
}

/** a***z@gmail.com */
export function maskEmail(email: string): string {
  const [name, domain] = email.split('@');
  if (!domain) return '***';
  const visible = name.length <= 2 ? name.slice(0, 1) : `${name[0]}***${name[name.length - 1]}`;
  return `${visible}@${domain}`;
}

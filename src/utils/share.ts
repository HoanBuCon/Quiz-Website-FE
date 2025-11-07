// Share utilities: generate short, memorable codes from IDs and validate codes

// Simple djb2 hash to a positive 32-bit integer
function djb2(str: string): number {
  let hash = 5381 >>> 0;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) + hash + str.charCodeAt(i)) >>> 0; // hash * 33 + c
  }
  return hash >>> 0;
}

// Map hash to 3 uppercase letters A-Z
function lettersFromHash(h: number): string {
  const a = String.fromCharCode(65 + (h % 26));
  const b = String.fromCharCode(65 + ((h >>> 5) % 26));
  const c = String.fromCharCode(65 + ((h >>> 10) % 26));
  return `${a}${b}${c}`;
}

// Build a short code like ABC123456789 from an ID (deterministic, based only on id)
export function buildShortId(id: string): string {
  const h = djb2(id);
  const letters = lettersFromHash(h);
  // derive 9 digits from hash and embedded numeric from id if available
  const digitsInId = (id.match(/\d+/g) || []).join("");
  let numeric = (Math.abs(h).toString() + digitsInId)
    .padEnd(9, "0")
    .slice(0, 9);
  return `${letters}${numeric}`;
}

// Detect if a string looks like our short code (3 letters + 9 digits)
export function isShortIdCode(val: string): boolean {
  return /^[A-Z]{3}\d{9}$/.test(val.trim());
}

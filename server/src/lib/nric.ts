import { createHash } from "node:crypto";

const NRIC_RE = /^[STFGM]\d{7}[A-Z]$/i;

/** Singapore NRIC/FIN: S/T/F/G/M + 7 digits + check letter (mod 11). */
export function validateNricChecksum(nric: string): boolean {
  const s = nric.toUpperCase().trim();
  if (!NRIC_RE.test(s)) return false;
  const weights = [2, 7, 6, 5, 4, 3, 2];
  let sum = 0;
  for (let i = 0; i < 7; i++) {
    sum += Number(s[i + 1]) * weights[i]!;
  }
  const prefix = s[0]!;
  if (prefix === "T" || prefix === "G") sum += 4;
  if (prefix === "M") sum += 3;
  const mod = sum % 11;
  const st = "JZIHGFEDCBA";
  const fg = "XWUTRQPNMLK";
  const table = prefix === "S" || prefix === "T" ? st : fg;
  return s[8] === table[mod];
}

export function hashNric(nric: string): string {
  return createHash("sha256").update(nric.toUpperCase().trim()).digest("hex");
}

export function maskNricFromStoredHash(_hash: string): string {
  return "S*******A";
}

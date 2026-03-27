import crypto from "crypto";

export function hashPassword(password: string): string {
  return crypto.createHash("sha256").update(password + "viralstore_salt").digest("hex");
}

export function verifyPassword(password: string, hash: string): boolean {
  return hashPassword(password) === hash;
}

export function generateToken(userId: number): string {
  return crypto.createHash("sha256").update(`${userId}_${Date.now()}_viralstore`).digest("hex");
}

const tokenStore = new Map<string, number>();

export function storeToken(token: string, userId: number): void {
  tokenStore.set(token, userId);
}

export function getUserIdFromToken(token: string): number | null {
  return tokenStore.get(token) ?? null;
}

export function removeToken(token: string): void {
  tokenStore.delete(token);
}

export function generateReferralCode(username: string): string {
  return `${username.toUpperCase()}_${crypto.randomBytes(4).toString("hex").toUpperCase()}`;
}

import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { createHash, randomUUID } from "node:crypto";
import { eq } from "drizzle-orm";
import { getDb } from "../db/index.js";
import { refreshTokens, users } from "../db/schema.js";
import { getJwtSecrets } from "../lib/env.js";
import type { UserRole } from "@orthocare/shared";

const ACCESS_TTL_SEC = 15 * 60;
const REFRESH_TTL_SEC = 7 * 24 * 60 * 60;

export type AccessPayload = {
  sub: string;
  role: UserRole;
  clinicId: string | null;
};

export function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, 12);
}

export function verifyPassword(plain: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}

export function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export function signAccessToken(payload: AccessPayload): string {
  const { accessSecret } = getJwtSecrets();
  return jwt.sign(
    { sub: payload.sub, role: payload.role, clinicId: payload.clinicId },
    accessSecret,
    { expiresIn: ACCESS_TTL_SEC, algorithm: "HS256" },
  );
}

export function verifyAccessToken(token: string): AccessPayload {
  const { accessSecret } = getJwtSecrets();
  const decoded = jwt.verify(token, accessSecret, {
    algorithms: ["HS256"],
  }) as jwt.JwtPayload & {
    sub: string;
    role: UserRole;
    clinicId: string | null;
  };
  return {
    sub: decoded.sub,
    role: decoded.role,
    clinicId: decoded.clinicId ?? null,
  };
}

export async function issueRefreshToken(userId: string): Promise<string> {
  const { refreshSecret } = getJwtSecrets();
  const jti = randomUUID();
  const token = jwt.sign({ sub: userId, jti }, refreshSecret, {
    expiresIn: REFRESH_TTL_SEC,
    algorithm: "HS256",
  });
  const tokenHash = hashToken(token);
  const expiresAt = new Date(Date.now() + REFRESH_TTL_SEC * 1000);
  const db = getDb();
  await db.insert(refreshTokens).values({
    id: randomUUID(),
    userId,
    tokenHash,
    expiresAt,
  });
  return token;
}

export async function revokeRefreshTokenByRaw(token: string): Promise<void> {
  const db = getDb();
  const tokenHash = hashToken(token);
  await db
    .update(refreshTokens)
    .set({ revokedAt: new Date() })
    .where(eq(refreshTokens.tokenHash, tokenHash));
}

export async function rotateRefreshToken(
  oldToken: string,
): Promise<{ accessToken: string; refreshToken: string } | null> {
  const { refreshSecret } = getJwtSecrets();
  let decoded: jwt.JwtPayload;
  try {
    decoded = jwt.verify(oldToken, refreshSecret, {
      algorithms: ["HS256"],
    }) as jwt.JwtPayload;
  } catch {
    return null;
  }
  const userId = decoded.sub as string;
  const oldHash = hashToken(oldToken);
  const db = getDb();
  const [row] = await db
    .select()
    .from(refreshTokens)
    .where(eq(refreshTokens.tokenHash, oldHash))
    .limit(1);
  if (!row || row.revokedAt || row.expiresAt < new Date()) {
    return null;
  }
  await db
    .update(refreshTokens)
    .set({ revokedAt: new Date() })
    .where(eq(refreshTokens.id, row.id));

  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);
  if (!user || !user.isActive) {
    return null;
  }
  const accessPayload: AccessPayload = {
    sub: user.id,
    role: user.role as UserRole,
    clinicId: user.clinicId,
  };
  const accessToken = signAccessToken(accessPayload);
  const refreshToken = await issueRefreshToken(user.id);
  return { accessToken, refreshToken };
}

export async function loadUserForAccess(userId: string) {
  const db = getDb();
  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);
  return user ?? null;
}

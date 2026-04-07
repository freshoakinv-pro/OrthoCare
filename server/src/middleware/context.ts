import type { IncomingHttpHeaders } from "node:http";
import type { Response } from "express";
import { verifyAccessToken, loadUserForAccess, type AccessPayload } from "../services/auth.js";
import { ACCESS_TOKEN_COOKIE, REFRESH_TOKEN_COOKIE } from "../lib/env.js";
import type { UserRole } from "@orthocare/shared";

export type AuthContext = {
  userId: string;
  role: UserRole;
  clinicId: string | null;
};

export type AuthUser = AuthContext & {
  email: string;
  fullName: string;
};

export type OrthoRequest = {
  headers: IncomingHttpHeaders;
};

export type RequestContext = {
  req: OrthoRequest;
  res: Response;
  user: AuthUser | null;
  accessPayload: AccessPayload | null;
};

function readCookie(req: OrthoRequest, name: string): string | undefined {
  const raw = req.headers.cookie;
  if (!raw) return undefined;
  for (const p of raw.split(";").map((x) => x.trim())) {
    const i = p.indexOf("=");
    if (i === -1) continue;
    if (p.slice(0, i) === name) {
      return decodeURIComponent(p.slice(i + 1));
    }
  }
  return undefined;
}

export async function createContext(opts: {
  req: OrthoRequest;
  res: Response;
}): Promise<RequestContext> {
  const { req, res } = opts;
  const token =
    readCookie(req, ACCESS_TOKEN_COOKIE) ??
    (typeof req.headers.authorization === "string" &&
    req.headers.authorization.startsWith("Bearer ")
      ? req.headers.authorization.slice(7)
      : undefined);

  if (!token) {
    return { req, res, user: null, accessPayload: null };
  }

  try {
    const accessPayload = verifyAccessToken(token);
    const row = await loadUserForAccess(accessPayload.sub);
    if (!row || !row.isActive) {
      return { req, res, user: null, accessPayload: null };
    }
    if (row.role !== accessPayload.role || row.clinicId !== accessPayload.clinicId) {
      return { req, res, user: null, accessPayload: null };
    }
    const user: AuthUser = {
      userId: row.id,
      role: row.role as UserRole,
      clinicId: row.clinicId,
      email: row.email,
      fullName: row.fullName,
    };
    return { req, res, user, accessPayload };
  } catch {
    return { req, res, user: null, accessPayload: null };
  }
}

export function getRefreshTokenFromRequest(req: OrthoRequest): string | undefined {
  return readCookie(req, REFRESH_TOKEN_COOKIE);
}

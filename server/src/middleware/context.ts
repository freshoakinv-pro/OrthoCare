import type { IncomingHttpHeaders } from "node:http";
import { verifyAccessToken, loadUserForAccess, type AccessPayload } from "../services/auth.js";
import {
  ACCESS_TOKEN_COOKIE,
  REFRESH_TOKEN_COOKIE,
} from "../lib/env.js";
import type { UserRole } from "@orthocare/shared";

export type AuthUser = {
  id: string;
  role: UserRole;
  clinicId: string | null;
  email: string;
  fullName: string;
};

/** Narrow request shape for tRPC context (avoids Express types in declaration emit). */
export type OrthoRequest = {
  headers: IncomingHttpHeaders;
};

export type RequestContext = {
  req: OrthoRequest;
  user: AuthUser | null;
  accessPayload: AccessPayload | null;
};

function readCookie(req: OrthoRequest, name: string): string | undefined {
  const raw = req.headers.cookie;
  if (!raw) return undefined;
  const parts = raw.split(";").map((p) => p.trim());
  for (const p of parts) {
    const eq = p.indexOf("=");
    if (eq === -1) continue;
    const k = p.slice(0, eq);
    if (k === name) {
      return decodeURIComponent(p.slice(eq + 1));
    }
  }
  return undefined;
}

export async function createContext(opts: {
  req: OrthoRequest;
}): Promise<RequestContext> {
  const { req } = opts;
  const token =
    readCookie(req, ACCESS_TOKEN_COOKIE) ??
    (req.headers.authorization?.startsWith("Bearer ")
      ? req.headers.authorization.slice(7)
      : undefined);

  if (!token) {
    return { req, user: null, accessPayload: null };
  }

  try {
    const accessPayload = verifyAccessToken(token);
    const row = await loadUserForAccess(accessPayload.sub);
    if (!row || !row.isActive) {
      return { req, user: null, accessPayload: null };
    }
    if (row.role !== accessPayload.role || row.clinicId !== accessPayload.clinicId) {
      return { req, user: null, accessPayload: null };
    }
    const user: AuthUser = {
      id: row.id,
      role: row.role as UserRole,
      clinicId: row.clinicId,
      email: row.email,
      fullName: row.fullName,
    };
    return { req, user, accessPayload };
  } catch {
    return { req, user: null, accessPayload: null };
  }
}

export function getRefreshTokenFromRequest(req: OrthoRequest): string | undefined {
  return readCookie(req, REFRESH_TOKEN_COOKIE);
}

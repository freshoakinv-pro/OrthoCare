import { TRPCError } from "@trpc/server";
import type { RequestContext, AuthUser } from "./context.js";

/** Verify authenticated user; 401 if missing/expired token context. */
export function requireAuthUser(ctx: RequestContext): AuthUser {
  if (!ctx.user) {
    throw new TRPCError({ code: "UNAUTHORIZED", message: "Not authenticated" });
  }
  return ctx.user;
}

/**
 * Enforce clinic isolation: for non-MSO users, payload clinic must match session.
 * Call after loading a resource's clinicId from DB — pass resourceClinicId.
 */
export function assertClinicAccess(
  ctx: RequestContext,
  resourceClinicId: string,
): void {
  const user = requireAuthUser(ctx);
  if (user.role === "MSO_ADMIN") return;
  if (!user.clinicId || user.clinicId !== resourceClinicId) {
    throw new TRPCError({ code: "FORBIDDEN", message: "Clinic access denied" });
  }
}

/** Resolved clinic id for DB queries — never from unchecked client input alone. */
export function clinicIdForScopedQuery(ctx: RequestContext): string | null {
  const user = requireAuthUser(ctx);
  if (user.role === "MSO_ADMIN") return null;
  if (!user.clinicId) {
    throw new TRPCError({ code: "FORBIDDEN", message: "Clinic context required" });
  }
  return user.clinicId;
}

export function requireClinicId(ctx: RequestContext): string {
  const id = clinicIdForScopedQuery(ctx);
  if (!id) {
    throw new TRPCError({ code: "BAD_REQUEST", message: "Clinic scope required" });
  }
  return id;
}

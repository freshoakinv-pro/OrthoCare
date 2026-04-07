import { TRPCError } from "@trpc/server";
import type { RequestContext } from "./context.js";
import { requireAuthUser } from "./auth.js";
import type { UserRole } from "@orthocare/shared";

export function requireRole(ctx: RequestContext, ...roles: UserRole[]) {
  const user = requireAuthUser(ctx);
  if (!roles.includes(user.role)) {
    throw new TRPCError({ code: "FORBIDDEN", message: "Insufficient permissions" });
  }
  return user;
}

/** Factory for tRPC: requireRole(["CLINIC_ADMIN", "MSO_ADMIN"]) */
export function requireRoles(...roles: UserRole[]) {
  return (ctx: RequestContext) => requireRole(ctx, ...roles);
}

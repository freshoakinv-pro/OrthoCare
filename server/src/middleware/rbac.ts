import { TRPCError } from "@trpc/server";
import type { RequestContext } from "./context.js";
import type { UserRole } from "@orthocare/shared";

export function requireUser(ctx: RequestContext) {
  if (!ctx.user) {
    throw new TRPCError({ code: "UNAUTHORIZED", message: "Not authenticated" });
  }
  return ctx.user;
}

export function requireRoles(ctx: RequestContext, roles: UserRole[]) {
  const user = requireUser(ctx);
  if (!roles.includes(user.role)) {
    throw new TRPCError({ code: "FORBIDDEN", message: "Insufficient permissions" });
  }
  return user;
}

/** Clinic-scoped roles must have clinicId; MSO_ADMIN must not use clinic-bound queries without explicit clinic selection. */
export function requireClinicContext(ctx: RequestContext): string {
  const user = requireUser(ctx);
  if (user.role === "MSO_ADMIN") {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Use MSO-scoped procedures for cross-clinic operations",
    });
  }
  if (!user.clinicId) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "Clinic context required",
    });
  }
  return user.clinicId;
}

export function clinicIdForQuery(ctx: RequestContext, explicitClinicId?: string): string {
  const user = requireUser(ctx);
  if (user.role === "MSO_ADMIN") {
    if (!explicitClinicId) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "clinicId is required for this operation",
      });
    }
    return explicitClinicId;
  }
  if (!user.clinicId) {
    throw new TRPCError({ code: "FORBIDDEN", message: "Clinic context required" });
  }
  if (explicitClinicId && explicitClinicId !== user.clinicId) {
    throw new TRPCError({ code: "FORBIDDEN", message: "Clinic mismatch" });
  }
  return user.clinicId;
}

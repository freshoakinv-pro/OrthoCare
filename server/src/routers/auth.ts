import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { eq, count } from "drizzle-orm";
import { randomUUID } from "node:crypto";
import { router, publicProcedure, protectedProcedure } from "../trpc.js";
import { getDb } from "../db/index.js";
import { users } from "../db/schema.js";
import { hashPassword } from "../services/auth.js";
import { USER_ROLES, type UserRole } from "@orthocare/shared";

const roleSchema = z.enum(USER_ROLES);

export const authRouter = router({
  me: protectedProcedure.query(({ ctx }) => {
    const { id, email, fullName, role, clinicId } = ctx.user;
    return { id, email, fullName, role, clinicId };
  }),

  register: publicProcedure
    .input(
      z.object({
        email: z.string().email(),
        password: z.string().min(10),
        fullName: z.string().min(1).max(255),
        role: roleSchema,
        clinicId: z.string().uuid().optional().nullable(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const db = getDb();
      const [{ value: userCount }] = await db
        .select({ value: count() })
        .from(users);

      const bootstrap = userCount === 0;

      if (bootstrap) {
        if (input.role !== "MSO_ADMIN") {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "First user must be MSO_ADMIN",
          });
        }
        if (input.clinicId) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "MSO_ADMIN must not have clinic_id on bootstrap",
          });
        }
      } else {
        if (!ctx.user || ctx.user.role !== "MSO_ADMIN") {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "Only MSO_ADMIN can create users after bootstrap",
          });
        }
        if (input.role !== "MSO_ADMIN" && !input.clinicId) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "clinicId is required for this role",
          });
        }
        if (input.role === "MSO_ADMIN" && input.clinicId) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "MSO_ADMIN cannot be assigned to a clinic",
          });
        }
      }

      const [existing] = await db
        .select({ id: users.id })
        .from(users)
        .where(eq(users.email, input.email))
        .limit(1);
      if (existing) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "Email already registered",
        });
      }

      const passwordHash = await hashPassword(input.password);
      const id = randomUUID();
      await db.insert(users).values({
        id,
        email: input.email,
        passwordHash,
        fullName: input.fullName,
        role: input.role as UserRole,
        clinicId:
          input.role === "MSO_ADMIN"
            ? null
            : (input.clinicId as string),
      });

      return { id, email: input.email, role: input.role };
    }),
});

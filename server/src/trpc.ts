import { initTRPC, TRPCError } from "@trpc/server";
import superjson from "superjson";
import type { RequestContext } from "./middleware/context.js";
import { isProd } from "./lib/env.js";
import { ZodError } from "zod";

const t = initTRPC.context<RequestContext>().create({
  transformer: superjson,
  errorFormatter({ shape, error }) {
    return {
      ...shape,
      message:
        error.cause instanceof ZodError
          ? "Validation error"
          : shape.message,
      data: {
        ...shape.data,
        zodError:
          !isProd && error.cause instanceof ZodError
            ? error.cause.flatten()
            : undefined,
        stack: isProd ? undefined : shape.data.stack,
      },
    };
  },
});

export const router = t.router;
export const publicProcedure = t.procedure.use(async ({ ctx, next }) => {
  try {
    return await next({ ctx });
  } catch (err) {
    if (err instanceof TRPCError) throw err;
    console.error("[tRPC]", err);
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: isProd ? "Request failed" : String(err),
    });
  }
});

export const protectedProcedure = publicProcedure.use(async ({ ctx, next }) => {
  if (!ctx.user) {
    throw new TRPCError({ code: "UNAUTHORIZED", message: "Not authenticated" });
  }
  return next({
    ctx: { ...ctx, user: ctx.user },
  });
});

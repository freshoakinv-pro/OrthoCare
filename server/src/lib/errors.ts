import { TRPCError } from "@trpc/server";
import { isProd } from "./env.js";

export function toTrpcError(
  err: unknown,
  fallbackCode: TRPCError["code"] = "INTERNAL_SERVER_ERROR",
) {
  if (err instanceof TRPCError) {
    return err;
  }
  const message =
    err instanceof Error ? err.message : "An unexpected error occurred";
  return new TRPCError({
    code: fallbackCode,
    message: isProd ? "Request failed" : message,
    cause: err,
  });
}

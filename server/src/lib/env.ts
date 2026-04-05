export const isProd = process.env.NODE_ENV === "production";

export const ACCESS_TOKEN_COOKIE = "oc_access";
export const REFRESH_TOKEN_COOKIE = "oc_refresh";

function required(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`Missing required environment variable: ${name}`);
  return v;
}

export function getJwtSecrets() {
  if (!isProd) {
    return {
      accessSecret:
        process.env.JWT_ACCESS_SECRET ?? "dev-only-jwt-access-secret-min-32-chars!!",
      refreshSecret:
        process.env.JWT_REFRESH_SECRET ?? "dev-only-jwt-refresh-secret-min-32-chars!",
    };
  }
  return {
    accessSecret: required("JWT_ACCESS_SECRET"),
    refreshSecret: required("JWT_REFRESH_SECRET"),
  };
}

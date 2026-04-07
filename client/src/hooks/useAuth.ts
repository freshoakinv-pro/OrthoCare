import { useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { trpc } from "@/lib/trpc";
import { dashboardPathForRole } from "@/lib/dashboardPath";
import type { UserRole } from "@orthocare/shared";

/** Non-secret hint: session uses httpOnly cookies; this only tracks “we logged in this browser”. */
const LS_KEY = "orthocare_authenticated";

export function readAuthHintFromStorage(): boolean {
  if (typeof window === "undefined") return false;
  return window.localStorage.getItem(LS_KEY) === "1";
}

export function setAuthHintInStorage(active: boolean) {
  if (typeof window === "undefined") return;
  if (active) window.localStorage.setItem(LS_KEY, "1");
  else window.localStorage.removeItem(LS_KEY);
}

export type AuthUser = {
  userId: string;
  role: UserRole;
  clinicId: string | null;
  email: string;
  fullName: string;
};

export function useAuth() {
  const navigate = useNavigate();
  const utils = trpc.useUtils();

  const me = trpc.auth.me.useQuery(undefined, {
    retry: false,
    staleTime: 60_000,
  });

  const loginMut = trpc.auth.login.useMutation();

  const logoutMut = trpc.auth.logout.useMutation({
    onSuccess: () => {
      setAuthHintInStorage(false);
      utils.auth.me.setData(undefined, undefined);
      navigate("/login", { replace: true });
    },
  });

  const user: AuthUser | null = useMemo(() => {
    if (!me.data) return null;
    return {
      userId: me.data.userId,
      role: me.data.role as UserRole,
      clinicId: me.data.clinicId,
      email: me.data.email,
      fullName: me.data.fullName,
    };
  }, [me.data]);

  const login = useCallback(
    async (email: string, password: string) => {
      await loginMut.mutateAsync({ email, password });
      setAuthHintInStorage(true);
      await utils.auth.me.invalidate();
      const u = await utils.auth.me.fetch();
      navigate(dashboardPathForRole(u.role as UserRole), { replace: true });
    },
    [loginMut, navigate, utils.auth.me],
  );

  const logout = useCallback(async () => {
    await logoutMut.mutateAsync();
  }, [logoutMut]);

  return {
    user,
    role: user?.role ?? null,
    clinicId: user?.clinicId ?? null,
    isAuthenticating: loginMut.isPending,
    isAuthenticated: !!user,
    login,
    logout,
    loginError: loginMut.error,
    refetch: me.refetch,
  };
}

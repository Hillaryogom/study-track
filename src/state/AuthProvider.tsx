import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { authService as defaultAuthService } from "../services/serviceFactory";
import type { AuthService, AuthUser } from "../services/auth/AuthService";

interface AuthContextValue {
  user: AuthUser | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  register: (displayName: string, email: string, password: string) => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

interface AuthProviderProps {
  children: ReactNode;
  /** Injected in tests; production always uses the configured adapter. */
  service?: AuthService;
}

export function AuthProvider({ children, service = defaultAuthService }: AuthProviderProps) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Routes must not render until the restored session is known, otherwise a
    // refresh would briefly bounce a signed-in student back to the login page.
    const unsubscribe = service.subscribe((nextUser) => {
      setUser(nextUser);
      setLoading(false);
    });
    return unsubscribe;
  }, [service]);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      loading,
      signIn: (email, password) => service.signIn(email, password),
      register: (displayName, email, password) => service.register(displayName, email, password),
      resetPassword: (email) => service.resetPassword(email),
      signOut: () => service.signOut(),
    }),
    [user, loading, service],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used inside AuthProvider");
  return context;
}

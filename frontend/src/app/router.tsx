import { useEffect, useMemo, type AnchorHTMLAttributes } from "react";
import { Link as RouterLink, Navigate, useLocation as useRouterLocation, useNavigate, type NavigateFunction } from "react-router-dom";

export const APP_BASE = "/app";

export function appPath(to: string): string {
  if (to === APP_BASE || to.startsWith(`${APP_BASE}/`) || to.startsWith(`${APP_BASE}?`)) return to;
  if (to === "/" || to.startsWith("/?") || to.startsWith("/#")) return APP_BASE + to.slice(1);
  return APP_BASE + to;
}

let routerNavigate: NavigateFunction | null = null;

export function NavigationBridge() {
  const navigateFn = useNavigate();
  const { pathname } = useRouterLocation();
  useEffect(() => {
    routerNavigate = navigateFn;
  }, [navigateFn]);
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}

export function navigate(to: string, { replace = false } = {}) {
  routerNavigate?.(appPath(to), { replace });
}

export interface Location {
  path: string;
  query: URLSearchParams;
}

export function useLocation(): Location {
  const { pathname, search } = useRouterLocation();
  return useMemo(() => {
    const inside = pathname === APP_BASE ? "/" : pathname.startsWith(`${APP_BASE}/`) ? pathname.slice(APP_BASE.length) : pathname;
    return { path: inside.replace(/\/+$/, "") || "/", query: new URLSearchParams(search) };
  }, [pathname, search]);
}

export function match(pattern: string, path: string): Record<string, string> | null {
  const patternParts = pattern.split("/").filter(Boolean);
  const pathParts = path.split("/").filter(Boolean);
  if (patternParts.length !== pathParts.length) return null;
  const params: Record<string, string> = {};
  for (let index = 0; index < patternParts.length; index++) {
    const part = patternParts[index];
    if (part.startsWith(":")) params[part.slice(1)] = decodeURIComponent(pathParts[index]);
    else if (part !== pathParts[index]) return null;
  }
  return params;
}

type LinkProps = AnchorHTMLAttributes<HTMLAnchorElement> & { to: string };

export function Link({ to, ...props }: LinkProps) {
  return <RouterLink to={appPath(to)} {...props} />;
}

export function Redirect({ to }: { to: string }) {
  return <Navigate to={appPath(to)} replace />;
}

export function useTitle(title: string) {
  useEffect(() => {
    document.title = title ? `${title} · Dayla` : "Dayla";
  }, [title]);
}

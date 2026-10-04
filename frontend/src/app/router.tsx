import { useEffect, useSyncExternalStore, type AnchorHTMLAttributes, type MouseEvent } from "react";

// A tiny history-API router: the app has a handful of pages, so a dependency isn't worth it.
// nginx (try_files ... /index.html) and Vite serve index.html for every path.

const listeners = new Set<() => void>();
const notify = () => listeners.forEach((listener) => listener());
window.addEventListener("popstate", notify);

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

const snapshot = () => window.location.pathname + window.location.search;

export function navigate(to: string, { replace = false } = {}) {
  if (to === snapshot()) return;
  window.history[replace ? "replaceState" : "pushState"](null, "", to);
  window.scrollTo(0, 0);
  notify();
}

export interface Location {
  path: string;
  query: URLSearchParams;
}

export function useLocation(): Location {
  const current = useSyncExternalStore(subscribe, snapshot);
  const url = new URL(current, window.location.origin);
  return { path: url.pathname, query: url.searchParams };
}

/** Match "/events/:id" against a path; returns the params or null. */
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

export function Link({ to, onClick, ...props }: LinkProps) {
  const handleClick = (event: MouseEvent<HTMLAnchorElement>) => {
    onClick?.(event);
    // Let the browser handle new-tab clicks and modified clicks.
    if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    navigate(to);
  };
  return <a href={to} onClick={handleClick} {...props} />;
}

export function Redirect({ to }: { to: string }) {
  useEffect(() => {
    navigate(to, { replace: true });
  }, [to]);
  return null;
}

export function useTitle(title: string) {
  useEffect(() => {
    document.title = title ? `${title} · Focus Day` : "Focus Day";
  }, [title]);
}

import { Link } from "@tanstack/react-router";

export function SiteNav() {
  return (
    <header className="sticky top-4 z-50 mx-auto mt-4 max-w-6xl px-4">
      <div className="glass glass-border flex items-center justify-between rounded-full px-6 py-3">
      <Link to="/" className="font-display text-2xl tracking-tight">
        CalmScroll<span className="text-accent">.</span>
      </Link>
      <Link
        to="/download"
        className="rounded-full bg-primary px-5 py-2 text-sm text-primary-foreground transition hover:opacity-90"
      >
        Download
      </Link>
      </div>
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="mx-auto max-w-6xl border-t px-6 py-10 text-sm text-muted-foreground">
      © {new Date().getFullYear()} CalmScroll — scroll less, live more.
    </footer>
  );
}

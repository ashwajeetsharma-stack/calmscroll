import { Link } from "@tanstack/react-router";

export function SiteNav() {
  return (
    <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-6">
      <Link to="/" className="font-display text-2xl tracking-tight">
        Stillwave<span className="text-accent">.</span>
      </Link>
      <Link
        to="/download"
        className="rounded-full bg-primary px-5 py-2 text-sm text-primary-foreground transition hover:opacity-90"
      >
        Download
      </Link>
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="mx-auto max-w-6xl border-t px-6 py-10 text-sm text-muted-foreground">
      © {new Date().getFullYear()} Stillwave — scroll less, live more.
    </footer>
  );
}

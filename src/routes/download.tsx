import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { SiteNav, SiteFooter } from "@/components/SiteNav";
import { ChromeIcon, BraveIcon } from "@/components/BrowserIcons";
import { ArrowDownToLine, Check, Copy, ExternalLink, HelpCircle, ShieldCheck, Sparkles, Terminal } from "lucide-react";

export const Route = createFileRoute("/download")({
  head: () => ({
    meta: [
      { title: "Download CalmScroll for Chrome & Brave" },
      { name: "description", content: "Download and install CalmScroll for Google Chrome or Brave Browser." },
      { property: "og:title", content: "Download CalmScroll" },
      { property: "og:description", content: "Direct extension downloads for Chrome and Brave." },
    ],
  }),
  component: Download,
});

interface BrowserOption {
  id: "chrome" | "brave";
  name: "Google Chrome" | "Brave Browser";
  shortName: "Chrome" | "Brave";
  icon: typeof ChromeIcon;
  downloadUrl: string;
  fileName: string;
  version: string;
  size: string;
  extensionsUrl: string;
  description: string;
  badge: string;
}

const browserList: BrowserOption[] = [
  {
    id: "chrome",
    name: "Google Chrome",
    shortName: "Chrome",
    icon: ChromeIcon,
    downloadUrl: "/downloads/calmscroll-chrome.zip",
    fileName: "calmscroll-chrome.zip",
    version: "v0.2.0 (Manifest V3)",
    size: "97 KB",
    extensionsUrl: "chrome://extensions",
    description: "Designed for Chrome 120+. Shields your feed from ragebait and guards focus sessions.",
    badge: "Official Chromium Build",
  },
  {
    id: "brave",
    name: "Brave Browser",
    shortName: "Brave",
    icon: BraveIcon,
    downloadUrl: "/downloads/calmscroll-brave.zip",
    fileName: "calmscroll-brave.zip",
    version: "v0.2.0 (Manifest V3)",
    size: "97 KB",
    extensionsUrl: "brave://extensions",
    description: "100% compatible with Brave Shields and private browsing. Zero tracking, zero telemetry.",
    badge: "Shield Compatible",
  },
];

function Download() {
  const [downloadedBrowser, setDownloadedBrowser] = useState<string | null>(null);
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null);

  const handleDownload = (b: BrowserOption) => {
    setDownloadedBrowser(b.id);
  };

  const handleCopyUrl = (url: string) => {
    navigator.clipboard.writeText(url);
    setCopiedUrl(url);
    setTimeout(() => setCopiedUrl(null), 2000);
  };

  return (
    <div className="min-h-screen">
      <SiteNav />
      <main className="relative mx-auto max-w-5xl px-6 py-16 text-center">
        <div className="orb pointer-events-none absolute left-1/2 top-0 -z-10 h-96 w-96 -translate-x-1/2 rounded-full opacity-60" />

        <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-4 py-1.5 text-xs font-medium text-primary">
          <Sparkles className="h-3.5 w-3.5" />
          <span>CalmScroll v0.2.0 Extension</span>
        </div>

        <h1 className="font-display mt-6 text-5xl md:text-7xl">Get CalmScroll</h1>
        <p className="mx-auto mt-4 max-w-xl text-lg text-muted-foreground">
          Choose your browser below for direct package downloads and quick 30-second setup.
        </p>

        {/* Browser Cards */}
        <div className="mt-12 grid gap-8 md:grid-cols-2 text-left">
          {browserList.map((b) => {
            const Icon = b.icon;
            const isDownloaded = downloadedBrowser === b.id;

            return (
              <div
                key={b.id}
                className="glass glass-border relative flex flex-col justify-between rounded-3xl p-8 transition hover:border-primary/50 hover:shadow-xl"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-background/80 shadow-sm border border-border/50">
                        <Icon className="h-7 w-7" />
                      </div>
                      <div>
                        <h2 className="font-display text-2xl">{b.name}</h2>
                        <span className="text-xs text-muted-foreground">{b.version}</span>
                      </div>
                    </div>
                    <span className="rounded-full bg-secondary/80 px-3 py-1 text-[11px] font-medium text-secondary-foreground border border-border/40">
                      {b.badge}
                    </span>
                  </div>

                  <p className="mt-5 text-sm leading-relaxed text-muted-foreground">
                    {b.description}
                  </p>

                  <div className="mt-6 flex items-center gap-4 text-xs text-muted-foreground">
                    <div className="flex items-center gap-1.5">
                      <ShieldCheck className="h-4 w-4 text-primary" />
                      <span>100% Offline & Private</span>
                    </div>
                    <span>•</span>
                    <div>{b.size} archive</div>
                  </div>
                </div>

                <div className="mt-8 border-t border-border/40 pt-6">
                  <a
                    href={b.downloadUrl}
                    download={b.fileName}
                    onClick={() => handleDownload(b)}
                    className="flex w-full items-center justify-center gap-2.5 rounded-full bg-primary px-6 py-3.5 text-sm font-semibold text-primary-foreground shadow-sm transition hover:opacity-95 hover:shadow"
                  >
                    <ArrowDownToLine className="h-4 w-4" />
                    Download for {b.shortName}
                  </a>

                  {isDownloaded && (
                    <div className="mt-3 flex items-center justify-center gap-1.5 text-xs text-primary font-medium">
                      <Check className="h-3.5 w-3.5" />
                      <span>Download started! Follow the 3 steps below to load.</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Installation Instructions */}
        <section className="mt-16 text-left">
          <div className="glass glass-border rounded-3xl p-8 md:p-10">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <Terminal className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-display text-2xl">Quick 3-Step Installation</h3>
                <p className="text-sm text-muted-foreground">Works identically on both Google Chrome and Brave</p>
              </div>
            </div>

            <div className="mt-8 grid gap-6 md:grid-cols-3">
              <div className="rounded-2xl border border-border/50 bg-background/40 p-5">
                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                  1
                </div>
                <h4 className="mt-3 font-semibold">Unzip the Download</h4>
                <p className="mt-1.5 text-xs text-muted-foreground leading-relaxed">
                  Extract the downloaded <code className="rounded bg-muted px-1 py-0.5 text-foreground">calmscroll-*.zip</code> file to a folder on your computer.
                </p>
              </div>

              <div className="rounded-2xl border border-border/50 bg-background/40 p-5">
                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                  2
                </div>
                <h4 className="mt-3 font-semibold">Open Extensions Page</h4>
                <p className="mt-1.5 text-xs text-muted-foreground leading-relaxed">
                  Navigate to <code className="rounded bg-muted px-1 py-0.5 text-foreground">chrome://extensions</code> or <code className="rounded bg-muted px-1 py-0.5 text-foreground">brave://extensions</code> and toggle on <strong>Developer mode</strong> (top-right).
                </p>
                <button
                  type="button"
                  onClick={() => handleCopyUrl("chrome://extensions")}
                  className="mt-3 inline-flex items-center gap-1.5 text-[11px] font-medium text-primary hover:underline"
                >
                  <Copy className="h-3 w-3" />
                  <span>{copiedUrl === "chrome://extensions" ? "Copied!" : "Copy extensions URL"}</span>
                </button>
              </div>

              <div className="rounded-2xl border border-border/50 bg-background/40 p-5">
                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                  3
                </div>
                <h4 className="mt-3 font-semibold">Click "Load Unpacked"</h4>
                <p className="mt-1.5 text-xs text-muted-foreground leading-relaxed">
                  Click the <strong>Load unpacked</strong> button in the top left and select your unzipped CalmScroll folder. Pin it to your toolbar!
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Privacy Note & GitHub Link */}
        <section className="mt-10 flex flex-col sm:flex-row items-center justify-between gap-4 rounded-2xl border border-border/40 bg-card/40 px-6 py-4 text-left text-xs text-muted-foreground">
          <div className="flex items-center gap-2.5">
            <ShieldCheck className="h-5 w-5 text-primary shrink-0" />
            <span>Open-source and privacy-preserving. No user accounts, tracking pixels, or remote analytics.</span>
          </div>
          <a
            href="https://github.com/ashwajeetsharma-stack/calmscroll"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 font-medium text-foreground hover:text-primary transition shrink-0"
          >
            <span>GitHub Repository</span>
            <ExternalLink className="h-3.5 w-3.5" />
          </a>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}

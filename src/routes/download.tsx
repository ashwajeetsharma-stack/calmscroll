import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { SiteNav, SiteFooter } from "@/components/SiteNav";

export const Route = createFileRoute("/download")({
  head: () => ({
    meta: [
      { title: "Download CalmScroll for Chrome or Brave" },
      { name: "description", content: "Choose your browser and install CalmScroll, the AI extension for calmer browsing." },
      { property: "og:title", content: "Download CalmScroll" },
      { property: "og:description", content: "Install CalmScroll on Chrome or Brave." },
    ],
  }),
  component: Download,
});

// TODO: replace each url with the real store listing when the extension is published.
const browsers = [
  { id: "chrome", name: "Chrome", store: "Chrome Web Store", url: "#" },
  { id: "brave", name: "Brave", store: "Chrome Web Store (works on Brave)", url: "#" },
];

function Download() {
  const [selected, setSelected] = useState("chrome");
  const [clicked, setClicked] = useState(false);
  const b = browsers.find((x) => x.id === selected)!;

  return (
    <div className="min-h-screen">
      <SiteNav />
      <main className="relative mx-auto max-w-3xl px-6 py-20 text-center">
        <div className="orb pointer-events-none absolute left-1/2 top-0 -z-10 h-80 w-80 -translate-x-1/2 rounded-full" />
        <h1 className="font-display text-6xl md:text-7xl">Get CalmScroll</h1>
        <p className="mt-4 text-muted-foreground">Choose your browser.</p>

        <div className="mt-12 grid grid-cols-2 gap-4">
          {browsers.map((x) => (
            <button
              key={x.id}
              onClick={() => { setSelected(x.id); setClicked(false); }}
              className={`rounded-2xl border p-6 transition ${
                selected === x.id ? "border-primary bg-card shadow-lg" : "hover:bg-muted"
              }`}
            >
              <div className="font-display text-3xl">{x.name}</div>
            </button>
          ))}
        </div>

        <a
          href={b.url}
          onClick={(e) => { if (b.url === "#") { e.preventDefault(); setClicked(true); } }}
          className="mt-10 inline-block rounded-full bg-primary px-10 py-4 text-primary-foreground transition hover:opacity-90"
        >
          Download for {b.name}
        </a>
        <p className="mt-4 text-sm text-muted-foreground">
          {clicked ? "Coming soon — the extension isn’t published yet." : `via ${b.store}`}
        </p>
      </main>
      <SiteFooter />
    </div>
  );
}

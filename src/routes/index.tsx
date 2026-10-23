import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteNav, SiteFooter } from "@/components/SiteNav";
import { LiveSimulator } from "@/components/LiveSimulator";
import { TwoModes } from "@/components/TwoModes";
import { ChromeIcon, BraveIcon } from "@/components/BrowserIcons";
import { ArrowDownToLine } from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "CalmScroll — The AI extension that ends doomscrolling" },
      { name: "description", content: "Gentle screen-time reminders and AI that filters ragebait, so your browsing is calmer and more intentional." },
      { property: "og:title", content: "CalmScroll — Browse with intention" },
      { property: "og:description", content: "An AI browser extension that fights doomscrolling and neutralizes ragebait." },
    ],
  }),
  component: Index,
});


const steps = [
  ["01", "Notice", "CalmScroll tracks time on feeds and sends soft, timely nudges before minutes turn into hours."],
  ["02", "Filter", "On-device AI reads the page and quietly blurs ragebait, inflammatory and insensitive content."],
  ["03", "Focus", "A calmer layout hides infinite feeds and distractions, so you see what you came for."],
];

const reviews = [
  ["“It’s like someone dimmed the noise of the internet.”", "Priya S.", "Designer"],
  ["“The reminders are kind, not naggy. I actually listen to them.”", "Marcus L.", "Student"],
  ["“My Twitter feed went from angry to almost pleasant.”", "Elena R.", "Journalist"],
];

const stories = [
  ["Aarav got 11 hours back a week", "A software engineer who used to lose evenings to short videos. With focus mode on, he finished a side project he’d shelved for two years."],
  ["Sofia stopped doom-reading the news", "Ragebait filtering let her stay informed without the anxiety spiral. She now reads headlines in five calm minutes each morning."],
];

const press = [
  ["“One of the most thoughtful wellbeing tools this year.”", "Product Weekly"],
  ["“A quiet revolt against the attention economy.”", "The Digital Review"],
  ["“Finally, an extension that respects your mind.”", "Mindful Tech"],
];

function Index() {
  return (
    <div className="min-h-screen overflow-hidden">
      <SiteNav />

      <section className="relative mx-auto max-w-6xl px-6 pb-28 pt-20 text-center">
        <div className="liquid pointer-events-none absolute -left-10 top-0 -z-10 h-80 w-80" /><div className="liquid pointer-events-none absolute -right-10 bottom-0 -z-10 h-72 w-72" style={{ animationDelay: "-6s" }} /><div className="orb pointer-events-none absolute left-1/2 top-10 -z-10 h-96 w-96 -translate-x-1/2 rounded-full" /><div className="orb float pointer-events-none absolute right-0 top-40 -z-10 h-48 w-48 rounded-full" /><div className="orb float pointer-events-none absolute left-0 bottom-10 -z-10 h-40 w-40 rounded-full" />
        <p className="fade-up text-sm uppercase tracking-[0.3em] text-muted-foreground">AI browser extension</p>
        <h1 className="fade-up mx-auto mt-6 max-w-4xl font-display text-6xl leading-[1.02] md:text-8xl">
          Scroll less. <em className="shimmer-text pr-2">Feel</em> more.
        </h1>
        <p className="fade-up mx-auto mt-8 max-w-xl text-lg font-light text-muted-foreground">
          CalmScroll fights doomscrolling with gentle reminders and AI that neutralizes ragebait — so the internet feels calm again.
        </p>
        <div className="fade-up mt-10 flex flex-wrap items-center justify-center gap-3">
          <a
            href="/downloads/calmscroll-chrome.zip"
            download="calmscroll-chrome.zip"
            className="inline-flex items-center gap-2.5 rounded-full bg-primary px-6 py-3.5 text-sm font-semibold text-primary-foreground shadow-sm transition hover:opacity-90"
          >
            <ChromeIcon className="h-4 w-4" />
            <span>Download for Chrome</span>
          </a>
          <a
            href="/downloads/calmscroll-brave.zip"
            download="calmscroll-brave.zip"
            className="inline-flex items-center gap-2.5 rounded-full bg-card border border-border/80 px-6 py-3.5 text-sm font-semibold text-foreground shadow-sm transition hover:bg-muted"
          >
            <BraveIcon className="h-4 w-4" />
            <span>Download for Brave</span>
          </a>
          <Link
            to="/download"
            className="glass glass-border inline-flex items-center gap-2 rounded-full px-6 py-3.5 text-sm font-medium transition hover:scale-105"
          >
            <span>Install Guide</span>
          </Link>
          <a href="#how" className="text-sm text-muted-foreground hover:text-foreground transition px-3 py-2">
            How it works ↓
          </a>
        </div>
      </section>

      <TwoModes />

      <section id="how" className="mx-auto max-w-6xl px-6 py-20">
        <h2 className="reveal font-display text-4xl md:text-5xl">How it works</h2>
        <div className="mt-12 grid gap-10 md:grid-cols-3">
          {steps.map(([n, t, d]) => (
            <div key={n} className="reveal lift glass glass-border rounded-2xl p-6">
              <span className="text-sm text-accent">{n}</span>
              <h3 className="mt-2 font-display text-3xl">{t}</h3>
              <p className="mt-3 text-muted-foreground">{d}</p>
            </div>
          ))}
        </div>
      </section>

      <LiveSimulator />

      <section className="relative overflow-hidden bg-primary py-24 text-primary-foreground">
        <div className="liquid pointer-events-none absolute left-1/3 top-10 h-96 w-96 opacity-60" />
        <div className="relative mx-auto max-w-6xl px-6">
          <h2 className="reveal font-display text-4xl md:text-5xl">Loved by calmer people</h2>
          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {reviews.map(([q, n, r]) => (
              <figure key={n} className="reveal lift glass glass-dark glass-border rounded-2xl p-8">
                <div className="text-accent">★★★★★</div>
                <blockquote className="mt-4 font-display text-2xl leading-snug">{q}</blockquote>
                <figcaption className="mt-6 text-sm opacity-75">{n} · {r}</figcaption>
              </figure>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-24">
        <h2 className="reveal font-display text-4xl md:text-5xl">Success stories</h2>
        <div className="mt-12 grid gap-6 md:grid-cols-2">
          {stories.map(([t, d]) => (
            <article key={t} className="reveal lift glass deco-frame rounded-2xl p-10">
              <h3 className="font-display text-3xl">{t}</h3>
              <p className="mt-4 text-muted-foreground">{d}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-16">
        <p className="text-center text-sm uppercase tracking-[0.3em] text-muted-foreground">In the press</p>
        <div className="mt-10 grid gap-10 text-center md:grid-cols-3">
          {press.map(([q, s]) => (
            <div key={s} className="glass deco-frame rounded-2xl p-6">
              <p className="font-display text-2xl italic">{q}</p>
              <p className="mt-3 text-sm font-medium">{s}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-24">
        <div className="glass-border relative overflow-hidden rounded-3xl bg-primary px-8 py-20 text-center text-primary-foreground">
          <div className="orb absolute -right-20 -top-20 h-72 w-72 rounded-full" />
          <h2 className="relative font-display text-5xl md:text-6xl">Take back your attention.</h2>
          <p className="relative mx-auto mt-4 max-w-lg text-primary-foreground/80">
            Download the extension for Chrome or Brave and regain focus today.
          </p>
          <div className="relative mt-8 flex flex-wrap items-center justify-center gap-4">
            <a
              href="/downloads/calmscroll-chrome.zip"
              download="calmscroll-chrome.zip"
              className="inline-flex items-center gap-2.5 rounded-full bg-background px-7 py-3.5 text-sm font-semibold text-foreground shadow-sm transition hover:opacity-95 hover:scale-105"
            >
              <ChromeIcon className="h-4 w-4" />
              <span>Download for Chrome</span>
            </a>
            <a
              href="/downloads/calmscroll-brave.zip"
              download="calmscroll-brave.zip"
              className="inline-flex items-center gap-2.5 rounded-full bg-background/90 px-7 py-3.5 text-sm font-semibold text-foreground shadow-sm transition hover:opacity-95 hover:scale-105"
            >
              <BraveIcon className="h-4 w-4" />
              <span>Download for Brave</span>
            </a>
            <Link
              to="/download"
              className="inline-flex items-center gap-2 rounded-full border border-primary-foreground/30 px-6 py-3.5 text-sm font-medium text-primary-foreground transition hover:bg-primary-foreground/10"
            >
              <span>Setup Guide</span>
            </Link>
          </div>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}

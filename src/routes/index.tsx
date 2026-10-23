import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteNav, SiteFooter } from "@/components/SiteNav";
import { LiveSimulator } from "@/components/LiveSimulator";
import { TwoModes } from "@/components/TwoModes";

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
        <div className="orb pointer-events-none absolute left-1/2 top-10 -z-10 h-96 w-96 -translate-x-1/2 rounded-full" /><div className="orb float pointer-events-none absolute right-0 top-40 -z-10 h-48 w-48 rounded-full" /><div className="orb float pointer-events-none absolute left-0 bottom-10 -z-10 h-40 w-40 rounded-full" />
        <p className="fade-up text-sm uppercase tracking-[0.3em] text-muted-foreground">AI browser extension</p>
        <h1 className="fade-up mx-auto mt-6 max-w-4xl font-display text-6xl leading-[1.02] md:text-8xl">
          Scroll less. <em className="shimmer-text pr-2">Feel</em> more.
        </h1>
        <p className="fade-up mx-auto mt-8 max-w-xl text-lg font-light text-muted-foreground">
          CalmScroll fights doomscrolling with gentle reminders and AI that neutralizes ragebait — so the internet feels calm again.
        </p>
        <div className="fade-up mt-10 flex justify-center gap-3">
          <Link to="/download" className="rounded-full bg-primary px-7 py-3 text-primary-foreground transition hover:opacity-90">
            Get CalmScroll — free
          </Link>
          <a href="#how" className="rounded-full border px-7 py-3 transition hover:bg-muted">How it works</a>
        </div>
      </section>

      <TwoModes />

      <section id="how" className="mx-auto max-w-6xl px-6 py-20">
        <h2 className="reveal font-display text-4xl md:text-5xl">How it works</h2>
        <div className="mt-12 grid gap-10 md:grid-cols-3">
          {steps.map(([n, t, d]) => (
            <div key={n} className="reveal lift rounded-2xl border-t-4 border-accent bg-card p-6">
              <span className="text-sm text-accent">{n}</span>
              <h3 className="mt-2 font-display text-3xl">{t}</h3>
              <p className="mt-3 text-muted-foreground">{d}</p>
            </div>
          ))}
        </div>
      </section>

      <LiveSimulator />

      <section className="bg-primary py-24 text-primary-foreground">
        <div className="mx-auto max-w-6xl px-6">
          <h2 className="reveal font-display text-4xl md:text-5xl">Loved by calmer people</h2>
          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {reviews.map(([q, n, r]) => (
              <figure key={n} className="reveal lift rounded-2xl bg-card p-8 text-card-foreground">
                <div className="text-accent">★★★★★</div>
                <blockquote className="mt-4 font-display text-2xl leading-snug">{q}</blockquote>
                <figcaption className="mt-6 text-sm text-muted-foreground">{n} · {r}</figcaption>
              </figure>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-24">
        <h2 className="reveal font-display text-4xl md:text-5xl">Success stories</h2>
        <div className="mt-12 grid gap-6 md:grid-cols-2">
          {stories.map(([t, d]) => (
            <article key={t} className="reveal lift rounded-2xl border bg-gradient-to-br from-card to-secondary p-10">
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
            <div key={s}>
              <p className="font-display text-2xl italic">{q}</p>
              <p className="mt-3 text-sm font-medium">{s}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-24">
        <div className="relative overflow-hidden rounded-3xl bg-primary px-8 py-20 text-center text-primary-foreground">
          <div className="orb absolute -right-20 -top-20 h-72 w-72 rounded-full" />
          <h2 className="relative font-display text-5xl md:text-6xl">Take back your attention.</h2>
          <Link to="/download" className="relative mt-8 inline-block rounded-full bg-background px-8 py-3 text-foreground transition hover:opacity-90">
            Download CalmScroll
          </Link>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}

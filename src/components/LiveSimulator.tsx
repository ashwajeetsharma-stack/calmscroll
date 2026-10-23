import { useState } from "react";

const posts = [
  {
    user: "@TruthBlast247",
    panic: "🚨 THEY'RE HIDING THIS FROM YOU — Your city's water is POISONED and nobody cares!!",
    stats: "48.2K 🔥 · 12.9K 💬 · 31K 🔁",
    calm: "Routine water testing found slightly elevated chlorine levels in one district. Officials say it's within safe limits; results are public on the city site.",
  },
  {
    user: "@OutrageDaily",
    panic: "Gen Z is DESTROYING the economy and here's PROOF 😡😡",
    stats: "22.7K 🔥 · 8.4K 💬 · 15K 🔁",
    calm: "A new survey shows younger adults spend more on experiences than goods. Economists describe it as a shift in habits, not economic harm.",
  },
];

export function LiveSimulator() {
  const [on, setOn] = useState(false);

  return (
    <section id="simulator" className="mx-auto max-w-6xl px-6 py-24">
      <p className="text-sm uppercase tracking-[0.3em] text-accent">Live simulator</p>
      <h2 className="reveal mt-2 font-display text-4xl md:text-5xl">See the difference</h2>
      <p className="mt-4 max-w-2xl text-muted-foreground">Flip the switch to see what your feed looks like with CalmScroll turned on.</p>

      <div className="mt-10 inline-flex rounded-full border bg-card p-1" role="tablist">
        {[
          [false, "Without extension"],
          [true, "With CalmScroll"],
        ].map(([v, label]) => (
          <button
            key={String(v)}
            role="tab"
            aria-selected={on === v}
            onClick={() => setOn(v as boolean)}
            className={`rounded-full px-5 py-2 text-sm transition-all duration-500 ${
              on === v ? (v ? "bg-primary text-primary-foreground" : "bg-destructive text-destructive-foreground") : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {label as string}
          </button>
        ))}
      </div>

      <div
        className={`mt-8 overflow-hidden rounded-3xl border-2 transition-colors duration-700 ${
          on ? "border-primary bg-card" : "border-destructive bg-destructive/5"
        }`}
      >
        <div className={`flex items-center gap-2 border-b px-5 py-3 text-xs ${on ? "text-primary" : "text-destructive"}`}>
          <span className="h-2 w-2 animate-pulse rounded-full bg-current" />
          {on ? "Mindful Shield active · 2 ragebait posts defused" : "Unfiltered feed · cortisol triggers detected"}
        </div>

        <div className="relative h-[480px] overflow-y-auto p-5">
          <div className="space-y-4">
            {on && (
              <div key="remind" className="fade-up rounded-2xl bg-primary p-5 text-primary-foreground">
                <p className="font-display text-2xl">Hey, you've been scrolling for 25 minutes 🌿</p>
                <p className="mt-1 text-sm opacity-80">That's okay. Maybe take a breath, stretch, or grab some water? Your feed will still be here.</p>
                <div className="mt-3 flex gap-2 text-sm">
                  <span className="rounded-full bg-primary-foreground px-4 py-1 text-primary">Take a break</span>
                  <span className="rounded-full border border-primary-foreground/40 px-4 py-1">5 more minutes</span>
                </div>
              </div>
            )}

            {(on ? posts : [...posts, ...posts, ...posts]).map((p, i) => (
              <article key={`${on}-${i}`} className={`fade-up rounded-2xl border bg-card p-5 ${!on && "animate-pulse [animation-duration:3s]"}`}>
                <p className="text-sm font-medium">{p.user}</p>
                <p className={`mt-2 text-lg font-semibold transition-all ${on ? "text-muted-foreground line-through decoration-destructive decoration-2" : "text-destructive"}`}>
                  {p.panic}
                </p>
                {on ? (
                  <div className="mt-4 rounded-xl border-l-4 border-accent bg-secondary p-4">
                    <p className="text-xs uppercase tracking-widest text-accent">Calm summary</p>
                    <p className="mt-1 text-sm text-secondary-foreground">{p.calm}</p>
                  </div>
                ) : (
                  <p className="mt-3 text-sm text-muted-foreground">{p.stats}</p>
                )}
              </article>
            ))}

            {!on && (
              <p className="animate-bounce text-center text-sm text-destructive">↓ Keep scrolling… 237 new posts ↓</p>
            )}
            {on && <p className="text-center text-sm text-muted-foreground">You're all caught up. ✨</p>}
          </div>
        </div>
      </div>
    </section>
  );
}

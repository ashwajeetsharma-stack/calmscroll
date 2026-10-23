import { useEffect, useState } from "react";

const wardenWarnings = [
  "Nice try. The clock is still running. 🌊",
  "That's the old habit talking. You set this timer for a reason.",
  "You're one scroll spiral from your goal. Hold the line. 🔒",
  "Warden doesn't negotiate. Take a breath, then get back to it.",
];

function Countdown() {
  const [secs, setSecs] = useState(42 * 60 + 17);
  useEffect(() => {
    const id = setInterval(() => setSecs((s) => (s > 0 ? s - 1 : 0)), 1000);
    return () => clearInterval(id);
  }, []);
  const m = String(Math.floor(secs / 60)).padStart(2, "0");
  const s = String(secs % 60).padStart(2, "0");
  return (
    <span className="font-display text-6xl tabular-nums tracking-wide">
      {m}:{s}
    </span>
  );
}

function NormalModeCard() {
  return (
    <article className="reveal lift glass glass-border rounded-3xl p-8">
      <div className="orb pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full" />
      <div className="relative">
        <div className="flex items-center gap-3">
          <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-secondary text-2xl">🌿</span>
          <div>
            <h3 className="font-display text-3xl">Normal Mode</h3>
            <p className="text-xs uppercase tracking-[0.25em] text-accent">Your everyday companion</p>
          </div>
        </div>
        <p className="mt-5 text-muted-foreground">
          CalmScroll rides along as you browse, gently steering you back to what you came for. Timely reminders break
          the scroll before minutes turn into hours, and on-device AI quietly defuses ragebait and insensitive content.
        </p>
        <ul className="mt-6 space-y-3 text-sm">
          {[
            "Soft, timely screen-time reminders before you spiral",
            "A focus-driven environment that hides infinite feeds",
            "Ragebait and insensitive posts detected & neutralized",
            "A calmer, healthier, more intentional feed",
          ].map((f) => (
            <li key={f} className="flex items-start gap-2">
              <span className="mt-0.5 text-accent">✔</span>
              <span className="text-muted-foreground">{f}</span>
            </li>
          ))}
        </ul>
        <div className="mt-6 rounded-xl border-l-4 border-accent bg-secondary p-4 text-sm text-secondary-foreground">
          Always on, never in the way. You stay in control — CalmScroll just keeps you honest with yourself.
        </div>
      </div>
    </article>
  );
}

function WardenModeCard() {
  const [attempts, setAttempts] = useState(0);
  const [shake, setShake] = useState(0);

  const tryToQuit = () => {
    setAttempts((a) => a + 1);
    setShake((s) => s + 1);
  };

  return (
    <article className="reveal lift glass-border relative overflow-hidden rounded-3xl bg-primary p-8 text-primary-foreground">
      <div className="orb pointer-events-none absolute -left-16 -bottom-16 h-48 w-48 rounded-full" />
      <div className="relative">
        <div className="flex items-center gap-3">
          <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary-foreground/10 text-2xl">🔒</span>
          <div>
            <h3 className="font-display text-3xl">Warden Mode</h3>
            <p className="text-xs uppercase tracking-[0.25em] text-accent">Hard commitment, zero escape hatches</p>
          </div>
        </div>
        <p className="mt-5 text-sm font-light opacity-80">
          Same calm guardianship — but with teeth. You choose how long, lock it in, and CalmScroll won't let you off the
          ride early.
        </p>

        <div className="mt-6 glass rounded-2xl p-6 text-center">
          <p className="text-xs uppercase tracking-[0.3em] opacity-70">Focus session ends in</p>
          <div className="mt-2">
            <Countdown />
          </div>
          <div className="mx-auto mt-4 h-1.5 w-full max-w-xs overflow-hidden rounded-full bg-primary-foreground/15">
            <div className="h-full w-2/3 rounded-full bg-accent" />
          </div>
        </div>

        <div className="mt-6 flex flex-wrap items-center gap-3">
          <button
            onClick={tryToQuit}
            className="rounded-full bg-background px-5 py-2.5 text-sm text-foreground transition hover:opacity-90"
          >
            Try to quit early
          </button>
          {attempts > 0 && (
            <span key={shake} className="shake-once rounded-full border border-accent px-4 py-2 text-sm text-accent">
              Attempt #{attempts} blocked
            </span>
          )}
        </div>
        {attempts > 0 && (
          <div
            key={`msg-${attempts}`}
            className="shake-once fade-up mt-4 rounded-xl border-l-4 border-accent bg-primary-foreground/10 p-4 text-sm"
          >
            {wardenWarnings[(attempts - 1) % wardenWarnings.length]}
          </div>
        )}
        <p className="mt-4 text-xs opacity-60">(This is a demo — the real Warden is even more stubborn.)</p>
      </div>
    </article>
  );
}

export function TwoModes() {
  return (
    <section id="modes" className="mx-auto max-w-6xl px-6 py-20">
      <p className="reveal text-sm uppercase tracking-[0.3em] text-accent">Two modes</p>
      <h2 className="reveal mt-2 font-display text-4xl md:text-5xl">One mode for every day. One for the hard days.</h2>
      <p className="reveal mt-4 max-w-2xl text-muted-foreground">
        Pick how strict you need CalmScroll to be. Switch anytime — Warden just needs the timer to run out first.
      </p>
      <div className="mt-12 grid gap-6 md:grid-cols-2">
        <NormalModeCard />
        <WardenModeCard />
      </div>
    </section>
  );
}

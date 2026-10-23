import { useEffect, useRef, useState } from "react";

const MAGNET_SELECTOR =
  'a, button, [role="button"], input, textarea, select, [data-magnetic]';

/**
 * Pointer navigation: a glowing dot rides exactly under the pointer, a soft
 * ring trails behind it, a large ambient light follows slowly, and magnetic
 * elements lean toward the pointer. Desktop fine-pointer devices only.
 */
export function PointerCursor() {
  const [enabled, setEnabled] = useState(false);
  const dotRef = useRef<HTMLDivElement | null>(null);
  const ringRef = useRef<HTMLDivElement | null>(null);
  const glowRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const fine = window.matchMedia("(pointer: fine)").matches;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (fine && !reduced) setEnabled(true);
  }, []);

  useEffect(() => {
    if (!enabled) return;
    const dot = dotRef.current;
    const ring = ringRef.current;
    const glow = glowRef.current;
    if (!dot || !ring || !glow) return;

    document.documentElement.classList.add("cursor-custom");

    let x = -100;
    let y = -100;
    let ringX = -100;
    let ringY = -100;
    let glowX = -100;
    let glowY = -100;
    let shown = false;
    let magnet: Element | null = null;
    let raf = 0;

    const setMagnet = (next: Element | null, mx: number, my: number) => {
      if (magnet && magnet !== next) magnet.style.transform = "";
      magnet = next;
      if (magnet) {
        const rect = magnet.getBoundingClientRect();
        const dx = mx - (rect.left + rect.width / 2);
        const dy = my - (rect.top + rect.height / 2);
        const pull = Math.min(Math.max(Math.hypot(dx, dy) * 0.12, 0), 9);
        const len = Math.hypot(dx, dy) || 1;
        magnet.style.transform = `translate(${(dx / len) * pull}px, ${(dy / len) * pull}px)`;
      }
    };

    const onMove = (e: MouseEvent) => {
      x = e.clientX;
      y = e.clientY;
      if (!shown) {
        shown = true;
        ringX = x;
        ringY = y;
        glowX = x;
        glowY = y;
        dot.style.opacity = "1";
        ring.style.opacity = "1";
        glow.style.opacity = "1";
      }
      const target = e.target as Element | null;
      const interactive = target?.closest?.(MAGNET_SELECTOR) ?? null;
      const hot = !!interactive;
      dot.classList.toggle("cursor-hot", hot);
      ring.classList.toggle("cursor-hot", hot);
      setMagnet(interactive, x, y);
    };

    const onLeave = () => {
      dot.style.opacity = "0";
      ring.style.opacity = "0";
      glow.style.opacity = "0";
      setMagnet(null, x, y);
      shown = false;
    };

    const loop = () => {
      ringX += (x - ringX) * 0.16;
      ringY += (y - ringY) * 0.16;
      glowX += (x - glowX) * 0.07;
      glowY += (y - glowY) * 0.07;
      dot.style.transform = `translate3d(${x}px, ${y}px, 0) translate(-50%, -50%)`;
      ring.style.transform = `translate3d(${ringX}px, ${ringY}px, 0) translate(-50%, -50%)`;
      glow.style.transform = `translate3d(${glowX}px, ${glowY}px, 0) translate(-50%, -50%)`;
      raf = requestAnimationFrame(loop);
    };

    window.addEventListener("mousemove", onMove, { passive: true });
    document.documentElement.addEventListener("mouseleave", onLeave);
    raf = requestAnimationFrame(loop);

    return () => {
      window.removeEventListener("mousemove", onMove);
      document.documentElement.removeEventListener("mouseleave", onLeave);
      cancelAnimationFrame(raf);
      document.documentElement.classList.remove("cursor-custom");
      if (magnet) magnet.style.transform = "";
    };
  }, [enabled]);

  if (!enabled) return null;

  return (
    <>
      <div ref={glowRef} className="cursor-glow" aria-hidden />
      <div ref={ringRef} className="cursor-ring" aria-hidden />
      <div ref={dotRef} className="cursor-dot" aria-hidden />
    </>
  );
}

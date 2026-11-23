'use client';
import { useEffect } from 'react';

/** Scroll reveal, count-up numbers and animated donuts for the public home page. Respects reduced motion. */
export function HomeMotion() {
  useEffect(() => {
    const root = document.documentElement;
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    root.classList.add('hp-js');

    const countUp = (el: HTMLElement) => {
      const raw = el.dataset.count ?? '';
      const m = raw.match(/^(\D*)([\d,]+)(.*)$/);
      if (!m || reduce) return;
      const [, prefix, digits, suffix] = m;
      const target = Number(digits.replace(/,/g, ''));
      if (!target) return;
      const start = performance.now();
      const dur = 1400;
      const tick = (t: number) => {
        const p = Math.min(1, (t - start) / dur);
        const v = Math.round(target * (1 - Math.pow(1 - p, 3)));
        el.textContent = `${prefix}${v.toLocaleString('en-US')}${suffix}`;
        if (p < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    };

    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (!e.isIntersecting) continue;
          const el = e.target as HTMLElement;
          el.classList.add('in');
          el.querySelectorAll<HTMLElement>('[data-count]').forEach(countUp);
          if (el.dataset.count) countUp(el);
          io.unobserve(el);
        }
      },
      { threshold: 0.15, rootMargin: '0px 0px -40px 0px' },
    );
    document.querySelectorAll('[data-reveal]').forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);
  return null;
}

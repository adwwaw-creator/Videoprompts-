import React, { useEffect, useRef } from "react";

interface StarParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  baseAlpha: number;
  twinkleSpeed: number;
  twinklePhase: number;
  rgb: string;
  hasHalo: boolean;
}

interface SpaceStarfieldBackgroundProps {
  className?: string;
}

const STAR_PALETTE = [
  "235, 196, 118", // Champagne gold
  "248, 232, 192", // Warm starlight
  "72, 209, 235",  // Cosmic cyan
  "212, 163, 75",  // Deep amber
] as const;

export const SpaceStarfieldBackground: React.FC<SpaceStarfieldBackgroundProps> = ({
  className = "",
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const parent = canvas.parentElement;
    if (!parent) return;

    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) return;

    const motionQuery =
      typeof window !== "undefined"
        ? window.matchMedia("(prefers-reduced-motion: reduce)")
        : null;

    let width = parent.clientWidth || window.innerWidth;
    let height = parent.clientHeight || window.innerHeight;
    let dpr = Math.min(window.devicePixelRatio || 1, 2);

    const createStar = (w: number, h: number): StarParticle => {
      const depth = 0.35 + Math.random() * 0.85;
      const angle = Math.random() * Math.PI * 2;
      // Slow cosmic drift
      const speed = (0.05 + Math.random() * 0.14) * depth;
      const radius = (0.65 + Math.random() * 1.45) * depth;

      return {
        x: Math.random() * w,
        y: Math.random() * h,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 0.03 * depth,
        radius,
        baseAlpha: 0.25 + Math.random() * 0.65,
        twinkleSpeed: 0.005 + Math.random() * 0.012,
        twinklePhase: Math.random() * Math.PI * 2,
        rgb: STAR_PALETTE[Math.floor(Math.random() * STAR_PALETTE.length)],
        hasHalo: radius > 1.35,
      };
    };

    const computeCount = (w: number, h: number) =>
      Math.max(40, Math.min(90, Math.round((w * h) / 14500)));

    let stars: StarParticle[] = Array.from(
      { length: computeCount(width, height) },
      () => createStar(width, height)
    );

    const syncSize = () => {
      width = parent.clientWidth || window.innerWidth;
      height = parent.clientHeight || window.innerHeight;
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      const targetCount = computeCount(width, height);
      if (stars.length !== targetCount) {
        stars = Array.from({ length: targetCount }, () =>
          createStar(width, height)
        );
      }
    };

    syncSize();

    const resizeObserver =
      typeof ResizeObserver !== "undefined" ? new ResizeObserver(syncSize) : null;
    resizeObserver?.observe(parent);

    let rafId = 0;

    const drawFrame = (stepMotion: boolean) => {
      ctx.clearRect(0, 0, width, height);

      for (let i = 0; i < stars.length; i++) {
        const star = stars[i];
        if (stepMotion) {
          star.x += star.vx;
          star.y += star.vy;
          star.twinklePhase += star.twinkleSpeed;

          if (star.x < -6) star.x = width + 6;
          else if (star.x > width + 6) star.x = -6;
          if (star.y < -6) star.y = height + 6;
          else if (star.y > height + 6) star.y = -6;
        }

        const twinkle = 0.65 + 0.35 * Math.sin(star.twinklePhase);
        const alpha = Math.max(0.12, Math.min(0.95, star.baseAlpha * twinkle));

        if (star.hasHalo) {
          ctx.beginPath();
          ctx.arc(star.x, star.y, star.radius * 2.6, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(${star.rgb}, ${(alpha * 0.16).toFixed(3)})`;
          ctx.fill();
        }

        ctx.beginPath();
        ctx.arc(star.x, star.y, star.radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${star.rgb}, ${alpha.toFixed(3)})`;
        ctx.fill();
      }
    };

    const tick = () => {
      if (document.hidden || motionQuery?.matches) {
        rafId = 0;
        return;
      }
      drawFrame(true);
      rafId = window.requestAnimationFrame(tick);
    };

    const startOrPause = () => {
      if (motionQuery?.matches) {
        if (rafId) {
          window.cancelAnimationFrame(rafId);
          rafId = 0;
        }
        drawFrame(false);
        return;
      }
      if (!document.hidden && !rafId) {
        rafId = window.requestAnimationFrame(tick);
      } else if (document.hidden && rafId) {
        window.cancelAnimationFrame(rafId);
        rafId = 0;
      }
    };

    startOrPause();

    document.addEventListener("visibilitychange", startOrPause);
    motionQuery?.addEventListener("change", startOrPause);

    return () => {
      if (rafId) window.cancelAnimationFrame(rafId);
      resizeObserver?.disconnect();
      document.removeEventListener("visibilitychange", startOrPause);
      motionQuery?.removeEventListener("change", startOrPause);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className={`pointer-events-none absolute inset-0 h-full w-full ${className}`}
    />
  );
};

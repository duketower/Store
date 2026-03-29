"use client";

import React, { useEffect, useRef } from "react";

function createVisualRng(seed: number) {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let value = state;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
}

export default function MinimalHero() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const setSize = () => {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    };
    setSize();

    type Particle = {
      x: number; y: number; speed: number;
      opacity: number; fadeDelay: number;
      fadeStart: number; fadingOut: boolean;
    };

    let particles: Particle[] = [];
    let raf = 0;
    const seed = (Date.now() ^ (canvas.width << 8) ^ canvas.height) >>> 0;
    const random = createVisualRng(seed || 1);

    const count = () => Math.floor((canvas.width * canvas.height) / 7000);

    const make = (): Particle => {
      const fadeDelay = random() * 600 + 100;
      return {
        x: random() * canvas.width,
        y: random() * canvas.height,
        speed: random() / 5 + 0.1,
        opacity: 0.7,
        fadeDelay,
        fadeStart: Date.now() + fadeDelay,
        fadingOut: false,
      };
    };

    const reset = (p: Particle) => {
      p.x = random() * canvas.width;
      p.y = random() * canvas.height;
      p.speed = random() / 5 + 0.1;
      p.opacity = 0.7;
      p.fadeDelay = random() * 600 + 100;
      p.fadeStart = Date.now() + p.fadeDelay;
      p.fadingOut = false;
    };

    const init = () => {
      particles = [];
      for (let i = 0; i < count(); i++) particles.push(make());
    };

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particles.forEach((p) => {
        p.y -= p.speed;
        if (p.y < 0) reset(p);
        if (!p.fadingOut && Date.now() > p.fadeStart) p.fadingOut = true;
        if (p.fadingOut) {
          p.opacity -= 0.008;
          if (p.opacity <= 0) reset(p);
        }
        ctx.fillStyle = `rgba(250, 250, 250, ${p.opacity})`;
        ctx.fillRect(p.x, p.y, 0.6, random() * 2 + 1);
      });
      raf = requestAnimationFrame(draw);
    };

    const onResize = () => { setSize(); init(); };
    window.addEventListener("resize", onResize);
    init();
    raf = requestAnimationFrame(draw);

    return () => {
      window.removeEventListener("resize", onResize);
      cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <section className="mh-root" id="hero">
      <style>{`
        @import url('https://fonts.cdnfonts.com/css/hubot-sans');

        .mh-root {
          position: relative;
          width: 100%;
          height: 100vh;
          overflow: hidden;
          background: #0a0a0a;
          color: #fafafa;
          font-family: 'Hubot Sans', ui-sans-serif, system-ui, -apple-system, Inter, sans-serif;
          -webkit-font-smoothing: antialiased;
        }

        /* Grid accent lines */
        .mh-lines {
          position: absolute;
          inset: 0;
          pointer-events: none;
        }
        .mh-hline, .mh-vline {
          position: absolute;
          background: #27272a;
          opacity: .75;
        }
        .mh-hline {
          height: 1px; left: 0; right: 0;
          transform: scaleX(0);
          transform-origin: 50% 50%;
          animation: mhDrawX 800ms cubic-bezier(.22,.61,.36,1) forwards;
        }
        .mh-hline:nth-child(1) { top: 20%; animation-delay: 150ms; }
        .mh-hline:nth-child(2) { top: 50%; animation-delay: 280ms; }
        .mh-hline:nth-child(3) { top: 80%; animation-delay: 410ms; }
        .mh-vline {
          width: 1px; top: 0; bottom: 0;
          transform: scaleY(0);
          transform-origin: 50% 0%;
          animation: mhDrawY 900ms cubic-bezier(.22,.61,.36,1) forwards;
        }
        .mh-vline:nth-child(4) { left: 20%; animation-delay: 520ms; }
        .mh-vline:nth-child(5) { left: 50%; animation-delay: 640ms; }
        .mh-vline:nth-child(6) { left: 80%; animation-delay: 760ms; }

        @keyframes mhDrawX {
          0%   { transform: scaleX(0); opacity: 0; }
          60%  { opacity: .9; }
          100% { transform: scaleX(1); opacity: .75; }
        }
        @keyframes mhDrawY {
          0%   { transform: scaleY(0); opacity: 0; }
          60%  { opacity: .9; }
          100% { transform: scaleY(1); opacity: .75; }
        }

        /* Particle canvas */
        .mh-canvas {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          pointer-events: none;
          mix-blend-mode: screen;
          opacity: .6;
        }

        /* Hero center */
        .mh-hero {
          position: absolute;
          inset: 0;
          display: grid;
          place-items: center;
          text-align: center;
          pointer-events: none;
        }
        .mh-hero > div { pointer-events: all; }

        .mh-kicker {
          font-size: 12px;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          color: #a1a1aa;
          margin-bottom: 20px;
        }
        .mh-title {
          font-weight: 700;
          font-size: clamp(48px, 10vw, 120px);
          line-height: 0.92;
          margin: 0;
          color: #fafafa;
          letter-spacing: -0.02em;
        }
        .mh-title .mh-accent {
          color: #E5097F;
        }
        .mh-subtitle {
          margin-top: 24px;
          font-size: clamp(14px, 2vw, 18px);
          color: #a1a1aa;
          max-width: 500px;
          margin-left: auto;
          margin-right: auto;
          line-height: 1.6;
        }
        .mh-cta {
          display: inline-block;
          margin-top: 36px;
          height: 44px;
          padding: 0 28px;
          border-radius: 6px;
          background: #fafafa;
          color: #0a0a0a;
          border: none;
          font-size: 14px;
          font-weight: 600;
          letter-spacing: 0.04em;
          cursor: pointer;
          text-decoration: none;
          line-height: 44px;
          transition: background 0.2s ease, transform 0.2s ease;
        }
        .mh-cta:hover {
          background: #e5e7eb;
          transform: translateY(-2px);
        }

        /* Bottom bar */
        .mh-bottom {
          position: absolute;
          left: 0; right: 0; bottom: 0;
          padding: 18px 32px;
          border-top: 1px solid #27272a;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }
        .mh-bottom-left {
          font-size: 12px;
          color: #52525b;
          letter-spacing: 0.08em;
          text-transform: uppercase;
        }
        .mh-bottom-right {
          font-size: 12px;
          color: #52525b;
          letter-spacing: 0.06em;
        }
        .mh-scroll-hint {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 12px;
          color: #52525b;
          letter-spacing: 0.08em;
          text-transform: uppercase;
        }
        .mh-scroll-line {
          width: 24px;
          height: 1px;
          background: #52525b;
          display: inline-block;
        }
      `}</style>

      {/* Particles */}
      <canvas ref={canvasRef} className="mh-canvas" />

      {/* Grid lines */}
      <div className="mh-lines">
        <div className="mh-hline" />
        <div className="mh-hline" />
        <div className="mh-hline" />
        <div className="mh-vline" />
        <div className="mh-vline" />
        <div className="mh-vline" />
      </div>

      {/* Hero content */}
      <main className="mh-hero">
        <div>
          <div className="mh-kicker">Binary Ventures · binaryventures.in</div>
          <h1 className="mh-title">
            We Ship<span className="mh-accent">.</span><br />
            You Grow<span className="mh-accent">.</span>
          </h1>
          <p className="mh-subtitle">
            Websites, automation &amp; AI — built for real business.
          </p>
          <a href="#contact" className="mh-cta">Let&apos;s Talk</a>
        </div>
      </main>

      {/* Bottom bar */}
      <div className="mh-bottom">
        <span className="mh-bottom-left">Binary Ventures Pvt Ltd</span>
        <span className="mh-scroll-hint">
          <span className="mh-scroll-line" /> Scroll
        </span>
        <span className="mh-bottom-right">binaryventures.in</span>
      </div>
    </section>
  );
}

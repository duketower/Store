"use client";

import { useEffect, useRef } from "react";
import { gsap } from "gsap";

const WORDS = ["We Ship.", "You Grow."];

export default function Hero() {
  const headingRef = useRef<HTMLHeadingElement>(null);
  const subRef = useRef<HTMLParagraphElement>(null);
  const bodyRef = useRef<HTMLParagraphElement>(null);
  const ctaRef = useRef<HTMLAnchorElement>(null);
  const blobRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ delay: 1.2 }); // after preloader

      // Heading words
      const spans = headingRef.current?.querySelectorAll("span");
      if (spans) {
        tl.fromTo(
          spans,
          { opacity: 0, y: 60, filter: "blur(8px)" },
          { opacity: 1, y: 0, filter: "blur(0px)", duration: 0.9, stagger: 0.12, ease: "power3.out" }
        );
      }

      tl.fromTo(subRef.current, { opacity: 0, y: 30 }, { opacity: 1, y: 0, duration: 0.7, ease: "power2.out" }, "-=0.4");
      tl.fromTo(bodyRef.current, { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.6, ease: "power2.out" }, "-=0.4");
      tl.fromTo(ctaRef.current, { opacity: 0, y: 16 }, { opacity: 1, y: 0, duration: 0.5, ease: "power2.out" }, "-=0.3");

      // Blob parallax on mousemove
      const onMouseMove = (e: MouseEvent) => {
        const xPct = (e.clientX / window.innerWidth - 0.5) * 30;
        const yPct = (e.clientY / window.innerHeight - 0.5) * 30;
        gsap.to(blobRef.current, { x: xPct, y: yPct, duration: 1.2, ease: "power2.out" });
      };
      window.addEventListener("mousemove", onMouseMove);
      return () => window.removeEventListener("mousemove", onMouseMove);
    });

    return () => ctx.revert();
  }, []);

  return (
    <section
      id="hero"
      style={{
        position: "relative",
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        padding: "0 6vw",
        overflow: "hidden",
        background: "radial-gradient(ellipse at 60% 40%, #1A1030 0%, #050509 50%, #020107 100%)",
      }}
    >
      {/* Blob */}
      <div
        ref={blobRef}
        className="blob"
        style={{
          width: "55vw",
          height: "55vw",
          maxWidth: 700,
          maxHeight: 700,
          background: "radial-gradient(circle, rgba(229,9,127,0.35) 0%, rgba(48,158,255,0.12) 50%, transparent 70%)",
          top: "50%",
          right: "-10vw",
          transform: "translateY(-50%)",
        }}
      />

      {/* Content */}
      <div style={{ maxWidth: "52%", position: "relative", zIndex: 1 }}>
        <span className="section-label">Binary Ventures · binaryventures.in</span>

        <h1
          ref={headingRef}
          className="glow-underline"
          style={{ marginBottom: "1.5rem", lineHeight: 1.2 }}
        >
          {WORDS.map((word, i) => (
            <span
              key={i}
              style={{
                display: "inline-block",
                marginRight: "0.3em",
                opacity: 0,
              }}
            >
              {i === 0 ? (
                <>
                  We Ship<span style={{ color: "var(--color-accent)" }}>.</span>
                </>
              ) : (
                <>
                  You Grow<span style={{ color: "var(--color-accent)" }}>.</span>
                </>
              )}
            </span>
          ))}
        </h1>

        <h3
          ref={subRef}
          style={{
            fontFamily: "var(--font-body)",
            fontWeight: 400,
            letterSpacing: "0.02em",
            color: "var(--color-text-secondary)",
            marginBottom: "1.2rem",
            opacity: 0,
          }}
        >
          Websites, automation & AI — built for real business.
        </h3>

        <p ref={bodyRef} style={{ marginBottom: "2.5rem", maxWidth: 460, opacity: 0 }}>
          Binary Ventures turns ideas into production-ready software. We build the tools, systems, and websites that let your business run faster — then get out of your way.
        </p>

        <a
          ref={ctaRef}
          href="#contact"
          className="btn btn-accent"
          data-cursor
          style={{ opacity: 0 }}
        >
          Let&apos;s Talk
        </a>
      </div>

      {/* Mobile: full-width blob below text */}
      <style>{`
        @media (max-width: 768px) {
          #hero { flex-direction: column; align-items: flex-start; padding-top: 120px; padding-bottom: 80px; }
          #hero > div:first-of-type { max-width: 100%; }
        }
      `}</style>
    </section>
  );
}

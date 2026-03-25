"use client";

import { useRef, useEffect, useState } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { services } from "@/data/services";

gsap.registerPlugin(ScrollTrigger);

export default function ServicesSlider() {
  const trackRef = useRef<HTMLDivElement>(null);
  const sectionRef = useRef<HTMLElement>(null);
  const [focused, setFocused] = useState(0);

  // Horizontal scroll driven by vertical scroll (desktop)
  useEffect(() => {
    const track = trackRef.current;
    const section = sectionRef.current;
    if (!track || !section) return;

    const mm = gsap.matchMedia();

    mm.add("(min-width: 1025px)", () => {
      const totalWidth = track.scrollWidth - window.innerWidth;
      const tween = gsap.to(track, {
        x: -totalWidth,
        ease: "none",
        scrollTrigger: {
          trigger: section,
          start: "top top",
          end: () => `+=${totalWidth}`,
          scrub: 1,
          pin: true,
          anticipatePin: 1,
          onUpdate: (self) => {
            const idx = Math.round(self.progress * (services.length - 1));
            setFocused(idx);
          },
        },
      });
      return () => tween.kill();
    });

    return () => mm.revert();
  }, []);

  return (
    <section
      ref={sectionRef}
      id="services"
      style={{ overflow: "hidden", background: "var(--color-bg)" }}
    >
      {/* Section heading */}
      <div
        style={{
          padding: "80px 6vw 40px",
          position: "relative",
          zIndex: 2,
        }}
        className="services-heading"
      >
        <span className="section-label">What We Do</span>
        <h2 style={{ maxWidth: 500 }}>
          Four ways we help businesses{" "}
          <span style={{ color: "var(--color-accent)" }}>grow.</span>
        </h2>
      </div>

      {/* Horizontal slider track */}
      <div
        ref={trackRef}
        style={{
          display: "flex",
          gap: 40,
          padding: "20px 6vw 80px",
          willChange: "transform",
        }}
        className="services-track"
      >
        {services.map((service, i) => (
          <div
            key={service.id}
            className={`glass services-card${focused === i ? " focused" : ""}`}
            style={{
              flexShrink: 0,
              width: 450,
              minHeight: 320,
              borderRadius: "var(--radius-card)",
              padding: "28px 24px",
              cursor: "default",
              transition:
                "transform var(--transition-card), box-shadow var(--transition-card), background var(--transition-card)",
              transform: focused === i ? "scale(1.05)" : "scale(1)",
              boxShadow:
                focused === i
                  ? "0 0 45px rgba(229,9,127,0.35), 0 0 10px rgba(229,9,127,0.2)"
                  : "none",
              background:
                focused === i
                  ? "rgba(25,25,25,0.6)"
                  : "rgba(15,15,15,0.35)",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
            }}
          >
            {/* Icon letter */}
            <div
              style={{
                width: 48,
                height: 48,
                borderRadius: 12,
                background: "rgba(229,9,127,0.1)",
                border: "1px solid rgba(229,9,127,0.25)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontFamily: "var(--font-heading)",
                fontSize: "1.4rem",
                fontWeight: 700,
                color: "var(--color-accent)",
                marginBottom: 20,
              }}
            >
              {service.icon}
            </div>

            <div>
              <p
                style={{
                  fontSize: "0.75rem",
                  letterSpacing: "0.1em",
                  textTransform: "uppercase",
                  color: "var(--color-accent)",
                  marginBottom: 8,
                  fontFamily: "var(--font-body)",
                }}
              >
                {service.tagline}
              </p>
              <h3
                style={{
                  fontFamily: "var(--font-heading)",
                  fontWeight: 600,
                  marginBottom: 14,
                  fontSize: "clamp(1.1rem, 2vw, 1.4rem)",
                  letterSpacing: "0.03em",
                }}
              >
                {service.title}
              </h3>
              <p style={{ fontSize: "0.95rem", lineHeight: 1.65 }}>
                {service.description}
              </p>
            </div>

            <a
              href="#contact"
              className="btn btn-outline"
              data-cursor
              style={{
                marginTop: 28,
                fontSize: "0.8rem",
                padding: "10px 24px",
                alignSelf: "flex-start",
              }}
            >
              Get in Touch
            </a>
          </div>
        ))}
      </div>

      {/* Mobile: vertical stack */}
      <style>{`
        @media (max-width: 1024px) {
          .services-track {
            flex-direction: column !important;
            align-items: stretch !important;
            padding: 0 5vw 60px !important;
          }
          .services-card {
            width: auto !important;
            min-width: 0 !important;
          }
          .services-heading { padding-bottom: 20px !important; }
        }
        @media (max-width: 600px) {
          .services-card { padding: 22px 18px !important; }
        }
      `}</style>
    </section>
  );
}

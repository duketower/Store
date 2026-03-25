"use client";

import { useRef, useEffect } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { about } from "@/data/about";

gsap.registerPlugin(ScrollTrigger);

export default function About() {
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      const targets = sectionRef.current?.querySelectorAll(".about-animate");
      if (!targets?.length) return;
      gsap.fromTo(
        targets,
        { opacity: 0, y: 40 },
        {
          opacity: 1,
          y: 0,
          duration: 0.8,
          stagger: 0.15,
          ease: "power2.out",
          scrollTrigger: {
            trigger: sectionRef.current,
            start: "top 75%",
            once: true,
          },
        }
      );
    });
    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={sectionRef}
      id="about"
      style={{
        padding: "18vh 6vw",
        background: "var(--color-bg)",
        borderBottom: "1px solid var(--color-border)",
      }}
    >
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "6vw",
          alignItems: "start",
        }}
        className="about-grid"
      >
        {/* Left */}
        <div>
          <span className="section-label about-animate">About</span>
          <h2 className="about-animate" style={{ fontWeight: 100, marginBottom: "1.5rem" }}>
            {about.tagline}
          </h2>
          {about.story.map((para, i) => (
            <p key={i} className="about-animate" style={{ marginBottom: "1rem" }}>
              {para}
            </p>
          ))}
        </div>

        {/* Right — capabilities */}
        <div>
          <span className="section-label about-animate">What We Do</span>
          <div
            className="about-animate"
            style={{ display: "flex", flexWrap: "wrap", gap: 12, marginTop: 8 }}
          >
            {about.capabilities.map((cap) => (
              <span
                key={cap}
                className="glass"
                style={{
                  padding: "10px 20px",
                  borderRadius: "var(--radius-pill)",
                  fontSize: "0.85rem",
                  fontFamily: "var(--font-body)",
                  color: "var(--color-text)",
                  letterSpacing: "0.04em",
                  transition: "border-color var(--transition-fast), color var(--transition-fast)",
                  cursor: "default",
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLElement).style.borderColor = "var(--color-accent)";
                  (e.currentTarget as HTMLElement).style.color = "var(--color-accent)";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.borderColor = "var(--color-border)";
                  (e.currentTarget as HTMLElement).style.color = "var(--color-text)";
                }}
              >
                {cap}
              </span>
            ))}
          </div>
        </div>
      </div>

      <style>{`
        @media (max-width: 768px) {
          .about-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </section>
  );
}

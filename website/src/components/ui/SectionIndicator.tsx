"use client";

import { useEffect, useState } from "react";

const SECTIONS = [
  { id: "hero",     label: "HOME" },
  { id: "services", label: "SERVICES" },
  { id: "work",     label: "WORK" },
  { id: "about",    label: "ABOUT" },
  { id: "contact",  label: "CONTACT" },
];

export default function SectionIndicator() {
  const [active, setActive] = useState("HOME");

  useEffect(() => {
    const observers: IntersectionObserver[] = [];

    SECTIONS.forEach(({ id, label }) => {
      const el = document.getElementById(id);
      if (!el) return;

      const obs = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) setActive(label);
        },
        { threshold: 0.4 }
      );

      obs.observe(el);
      observers.push(obs);
    });

    return () => observers.forEach((o) => o.disconnect());
  }, []);

  return (
    <div
      style={{
        position: "fixed",
        right: "1.5rem",
        top: "50%",
        transform: "translateY(-50%)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: "0.5rem",
        zIndex: 50,
        pointerEvents: "none",
      }}
    >
      {/* Active section name — rotated */}
      <span
        style={{
          fontFamily: "var(--font-heading)",
          fontSize: "0.6rem",
          fontWeight: 700,
          letterSpacing: "0.18em",
          color: "var(--color-text-secondary)",
          writingMode: "vertical-rl",
          textOrientation: "mixed",
          transform: "rotate(180deg)",
          transition: "color 0.3s ease",
        }}
      >
        {active}
      </span>

      {/* Dots */}
      <div style={{ display: "flex", flexDirection: "column", gap: "6px", margin: "8px 0" }}>
        {SECTIONS.map(({ label }) => (
          <span
            key={label}
            style={{
              width: 4,
              height: label === active ? 20 : 4,
              borderRadius: 2,
              background: label === active ? "var(--color-accent)" : "rgba(255,255,255,0.25)",
              display: "block",
              transition: "height 0.3s ease, background 0.3s ease",
            }}
          />
        ))}
      </div>
    </div>
  );
}

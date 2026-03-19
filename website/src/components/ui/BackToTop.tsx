"use client";

import { useEffect, useState } from "react";

export default function BackToTop() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 400);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const scrollTop = () => window.scrollTo({ top: 0, behavior: "smooth" });

  return (
    <button
      onClick={scrollTop}
      aria-label="Back to top"
      data-cursor
      style={{
        position: "fixed",
        bottom: "2.5rem",
        right: "2.5rem",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: "0.35rem",
        background: "none",
        border: "none",
        cursor: "none",
        zIndex: 200,
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(20px)",
        transition: "opacity 0.3s ease, transform 0.3s ease",
        pointerEvents: visible ? "auto" : "none",
      }}
    >
      {/* Pink arrow circle */}
      <span
        style={{
          width: 52,
          height: 52,
          borderRadius: "50%",
          background: "var(--color-accent)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: "1.4rem",
          color: "#fff",
          lineHeight: 1,
        }}
      >
        ↑
      </span>
      {/* "Top" label */}
      <span
        style={{
          fontFamily: "var(--font-heading)",
          fontSize: "0.6rem",
          fontWeight: 700,
          letterSpacing: "0.15em",
          color: "var(--color-text-secondary)",
        }}
      >
        TOP
      </span>
    </button>
  );
}

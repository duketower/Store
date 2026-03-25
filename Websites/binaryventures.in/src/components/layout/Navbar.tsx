"use client";

import { useState, useEffect } from "react";
import OffcanvasMenu from "./OffcanvasMenu";

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 60);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Prevent body scroll when menu open
  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [menuOpen]);

  return (
    <>
      {/* Logo — top left, fixed */}
      <a
        href="#"
        style={{
          position: "fixed",
          top: 32,
          left: 40,
          zIndex: 6,
          fontFamily: "var(--font-heading)",
          fontWeight: 700,
          fontSize: "1.1rem",
          letterSpacing: "0.08em",
          color: "var(--color-text)",
          opacity: scrolled ? 0.8 : 1,
          transition: "opacity var(--transition-fast)",
        }}
      >
        Binary<span style={{ color: "var(--color-accent)" }}>.</span>
      </a>

      {/* Hamburger — top right desktop / bottom left mobile */}
      <button
        onClick={() => setMenuOpen(true)}
        aria-label="Open menu"
        style={{
          position: "fixed",
          zIndex: 1200,
          display: "flex",
          flexDirection: "column",
          gap: 5,
          alignItems: "center",
          justifyContent: "center",
          width: 56,
          height: 56,
          borderRadius: "var(--radius-pill)",
          background: "rgba(15,15,15,0.6)",
          backdropFilter: "blur(12px)",
          border: "1px solid var(--color-border)",
          cursor: "pointer",
          // Desktop: top-right. Mobile override via CSS
          top: 24,
          right: 32,
        }}
        className="menu-btn"
      >
        <span style={{ width: 22, height: 1.5, background: "var(--color-text)", display: "block", transition: "var(--transition-fast)" }} />
        <span style={{ width: 16, height: 1.5, background: "var(--color-accent)", display: "block", marginLeft: -6, transition: "var(--transition-fast)" }} />
        <span style={{ width: 22, height: 1.5, background: "var(--color-text)", display: "block", transition: "var(--transition-fast)" }} />
      </button>

      <style>{`
        @media (max-width: 600px) {
          .menu-btn {
            top: auto !important;
            bottom: 24px !important;
            right: auto !important;
            left: 24px !important;
            width: 64px !important;
            height: 64px !important;
          }
        }
      `}</style>

      <OffcanvasMenu open={menuOpen} onClose={() => setMenuOpen(false)} />
    </>
  );
}

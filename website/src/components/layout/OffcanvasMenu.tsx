"use client";

import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { navItems } from "@/data/navigation";

interface Props {
  open: boolean;
  onClose: () => void;
}

export default function OffcanvasMenu({ open, onClose }: Props) {
  const overlayRef = useRef<HTMLDivElement>(null);
  const itemsRef = useRef<HTMLLIElement[]>([]);

  useEffect(() => {
    const overlay = overlayRef.current;
    if (!overlay) return;

    if (open) {
      gsap.set(overlay, { display: "flex" });
      gsap.to(overlay, { opacity: 1, duration: 0.3, ease: "power2.out" });
      gsap.fromTo(
        itemsRef.current,
        { opacity: 0, y: 24 },
        { opacity: 1, y: 0, duration: 0.4, stagger: 0.07, ease: "power2.out", delay: 0.15 }
      );
    } else {
      gsap.to(overlay, {
        opacity: 0,
        duration: 0.25,
        ease: "power1.in",
        onComplete: () => { gsap.set(overlay, { display: "none" }); },
      });
    }
  }, [open]);

  return (
    <div
      ref={overlayRef}
      onClick={onClose}
      style={{
        display: "none",
        opacity: 0,
        position: "fixed",
        inset: 0,
        zIndex: 1150,
        background: "rgba(10,10,10,0.3)",
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
        alignItems: "center",
        justifyContent: "center",
        flexDirection: "column",
      }}
    >
      {/* Close button */}
      <button
        onClick={onClose}
        aria-label="Close menu"
        style={{
          position: "absolute",
          top: 32,
          right: 36,
          background: "transparent",
          border: "none",
          color: "var(--color-text-secondary)",
          fontSize: "2rem",
          cursor: "pointer",
          lineHeight: 1,
          transition: "color var(--transition-fast)",
        }}
        onMouseEnter={(e) => (e.currentTarget.style.color = "var(--color-accent)")}
        onMouseLeave={(e) => (e.currentTarget.style.color = "var(--color-text-secondary)")}
      >
        ×
      </button>

      <nav onClick={(e) => e.stopPropagation()}>
        <ul style={{ listStyle: "none", textAlign: "center" }}>
          {navItems.map((item, i) => (
            <li
              key={item.href + item.label}
              ref={(el) => { if (el) itemsRef.current[i] = el; }}
              style={{ margin: "0.6rem 0" }}
            >
              <a
                href={item.href}
                onClick={onClose}
                style={{
                  fontFamily: "var(--font-heading)",
                  fontSize: "clamp(1.6rem, 4vw, 2.8rem)",
                  fontWeight: 100,
                  letterSpacing: "0.06em",
                  color: "var(--color-text)",
                  display: "inline-block",
                  transition: "color var(--transition-fast), text-shadow var(--transition-fast)",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = "var(--color-accent)";
                  e.currentTarget.style.textShadow = "0 0 30px rgba(229,9,127,0.5)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = "var(--color-text)";
                  e.currentTarget.style.textShadow = "none";
                }}
              >
                {item.label}
              </a>
            </li>
          ))}
        </ul>
      </nav>

      <p style={{
        position: "absolute",
        bottom: 40,
        color: "var(--color-text-secondary)",
        fontSize: "0.8rem",
        letterSpacing: "0.1em",
        fontFamily: "var(--font-body)",
      }}>
        binaryventures.in
      </p>
    </div>
  );
}

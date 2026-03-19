"use client";

import { useEffect, useRef } from "react";
import { gsap } from "gsap";

interface MarqueeProps {
  text?: string;
  speed?: number; // pixels per second
  accent?: boolean;
}

export default function Marquee({
  text = "BINARY VENTURES · WE BUILD YOUR VISION · binaryventures.in · WEBSITES · AUTOMATION · AI TOOLS · LEAD GEN ·",
  speed = 80,
  accent = false,
}: MarqueeProps) {
  const trackRef = useRef<HTMLDivElement>(null);
  const tweenRef = useRef<gsap.core.Tween | null>(null);

  useEffect(() => {
    const track = trackRef.current!;
    const itemWidth = track.scrollWidth / 2; // two copies

    tweenRef.current = gsap.fromTo(
      track,
      { x: 0 },
      {
        x: -itemWidth,
        duration: itemWidth / speed,
        ease: "none",
        repeat: -1,
      }
    );

    return () => { tweenRef.current?.kill(); };
  }, [speed]);

  const repeat = [text, text]; // two copies for seamless loop

  return (
    <div
      style={{
        overflow: "hidden",
        whiteSpace: "nowrap",
        padding: "28px 0",
        borderTop: "1px solid var(--color-border)",
        borderBottom: "1px solid var(--color-border)",
        background: accent ? "var(--color-accent)" : "transparent",
        cursor: "default",
      }}
    >
      <div ref={trackRef} style={{ display: "inline-flex" }}>
        {repeat.map((t, i) => (
          <span
            key={i}
            style={{
              fontFamily: "var(--font-heading)",
              fontWeight: 700,
              fontSize: "clamp(1.6rem, 3.5vw, 3rem)",
              letterSpacing: "0.04em",
              color: accent ? "#fff" : "var(--color-text)",
              paddingRight: "4vw",
              userSelect: "none",
            }}
          >
            {t}
          </span>
        ))}
      </div>
    </div>
  );
}

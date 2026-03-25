"use client";

import { useEffect, useRef } from "react";
import { gsap } from "gsap";

export default function CustomCursor() {
  const ballRef = useRef<HTMLDivElement>(null);
  const dotRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (window.matchMedia("(pointer: coarse)").matches) return;

    const ball = ballRef.current!;
    const dot = dotRef.current!;

    // Start hidden
    gsap.set([ball, dot], { opacity: 0 });

    const onMove = (e: MouseEvent) => {
      gsap.set(dot, { x: e.clientX, y: e.clientY });
      gsap.to(ball, { x: e.clientX, y: e.clientY, duration: 0.45, ease: "power3.out" });
      gsap.set([ball, dot], { opacity: 1 });
    };

    const onEnter = () => {
      gsap.to(ball, { scale: 2.5, duration: 0.3, ease: "power2.out" });
    };

    const onLeave = () => {
      gsap.to(ball, { scale: 1, duration: 0.3, ease: "power2.out" });
    };

    window.addEventListener("mousemove", onMove);

    const refresh = () => {
      document.querySelectorAll("a, button, [data-cursor]").forEach((el) => {
        el.addEventListener("mouseenter", onEnter);
        el.addEventListener("mouseleave", onLeave);
      });
    };

    refresh();

    // Re-attach after dynamic renders
    const observer = new MutationObserver(refresh);
    observer.observe(document.body, { childList: true, subtree: true });

    return () => {
      window.removeEventListener("mousemove", onMove);
      observer.disconnect();
    };
  }, []);

  return (
    <>
      {/* Large filled ball — lags, inverts page colours */}
      <div
        ref={ballRef}
        style={{
          position: "fixed",
          top: -20,
          left: -20,
          width: 40,
          height: 40,
          borderRadius: "50%",
          background: "#fff",
          pointerEvents: "none",
          zIndex: 9999,
          mixBlendMode: "difference",
          willChange: "transform",
        }}
      />
      {/* Tiny precise dot — instant */}
      <div
        ref={dotRef}
        style={{
          position: "fixed",
          top: -3,
          left: -3,
          width: 6,
          height: 6,
          borderRadius: "50%",
          background: "#fff",
          pointerEvents: "none",
          zIndex: 10000,
          mixBlendMode: "difference",
          willChange: "transform",
        }}
      />
    </>
  );
}

"use client";

import { useEffect, useRef, useState } from "react";
import { gsap } from "gsap";

export default function Preloader() {
  const overlayRef = useRef<HTMLDivElement>(null);
  const barRef = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const tl = gsap.timeline({
      onComplete: () => setVisible(false),
    });

    // Bar animates from 0 to 100% width
    tl.to(barRef.current, {
      scaleX: 1,
      duration: 0.9,
      ease: "power2.inOut",
    });

    // Overlay fades out
    tl.to(overlayRef.current, {
      opacity: 0,
      duration: 0.4,
      ease: "power1.out",
    });
  }, []);

  if (!visible) return null;

  return (
    <div
      ref={overlayRef}
      style={{
        position: "fixed",
        inset: 0,
        backgroundColor: "var(--color-bg)",
        zIndex: 999999,
        display: "flex",
        alignItems: "flex-end",
        paddingBottom: "20vh",
        justifyContent: "center",
      }}
    >
      <div
        style={{
          width: "60vw",
          maxWidth: 400,
          height: 2,
          background: "rgba(255,255,255,0.1)",
          borderRadius: 2,
          overflow: "hidden",
        }}
      >
        <div
          ref={barRef}
          style={{
            width: "100%",
            height: "100%",
            background:
              "linear-gradient(90deg, #ff00c8 0%, #ff3eff 40%, #ff7bff 70%, #ff00c8 100%)",
            transformOrigin: "left center",
            transform: "scaleX(0)",
          }}
        />
      </div>
    </div>
  );
}

"use client";

import { useRef, useEffect } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { ProjectShowcase } from "@/components/ui/project-showcase";

gsap.registerPlugin(ScrollTrigger);

export default function WorkShowcase() {
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo(
        sectionRef.current,
        { opacity: 0, y: 40 },
        {
          opacity: 1,
          y: 0,
          duration: 0.8,
          ease: "power2.out",
          scrollTrigger: {
            trigger: sectionRef.current,
            start: "top 80%",
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
      id="work"
      style={{
        padding: "10vh 0",
        background: "var(--color-bg)",
        borderBottom: "1px solid var(--color-border)",
        display: "flex",
        justifyContent: "center",
      }}
    >
      <ProjectShowcase />
    </section>
  );
}

"use client";

import { useRef, useEffect } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { workItems } from "@/data/work";
import type { WorkItem } from "@/types";

gsap.registerPlugin(ScrollTrigger);

function WorkCard({ item }: { item: WorkItem }) {
  const cardRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      // Entrance animation
      gsap.fromTo(
        cardRef.current,
        { opacity: 0, y: 60 },
        {
          opacity: 1,
          y: 0,
          duration: 0.9,
          ease: "power2.out",
          scrollTrigger: {
            trigger: cardRef.current,
            start: "top 80%",
            once: true,
          },
        }
      );

      // Parallax on image
      gsap.to(imgRef.current, {
        yPercent: -15,
        ease: "none",
        scrollTrigger: {
          trigger: cardRef.current,
          start: "top bottom",
          end: "bottom top",
          scrub: true,
        },
      });
    });

    return () => ctx.revert();
  }, []);

  const flip = item.flip;

  return (
    <div
      ref={cardRef}
      style={{
        display: "flex",
        flexDirection: flip ? "row-reverse" : "row",
        alignItems: "center",
        gap: "6vw",
        padding: "18vh 6vw",
        opacity: 0,
        borderBottom: "1px solid var(--color-border)",
      }}
      className="work-card"
    >
      {/* Text side */}
      <div style={{ flex: 1, maxWidth: 520 }}>
        <span className="section-label">{item.context}</span>

        <h2
          style={{
            marginBottom: "1.2rem",
            fontWeight: 100,
          }}
        >
          {item.outcome}
        </h2>

        <p style={{ marginBottom: "1.5rem" }}>{item.description}</p>

        {/* Tags */}
        <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginBottom: "2rem" }}>
          {item.tags.map((tag) => (
            <span
              key={tag}
              style={{
                padding: "5px 14px",
                borderRadius: "var(--radius-pill)",
                border: "1px solid var(--color-border)",
                fontSize: "0.78rem",
                color: "var(--color-text-secondary)",
                fontFamily: "var(--font-body)",
                letterSpacing: "0.06em",
              }}
            >
              {tag}
            </span>
          ))}
        </div>

        {item.liveUrl && (
          <a
            href={item.liveUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-accent"
            data-cursor
          >
            View Live ↗
          </a>
        )}
      </div>

      {/* Image side */}
      <div
        style={{
          flex: 1,
          borderRadius: "var(--radius-card)",
          overflow: "hidden",
          background: "rgba(229,9,127,0.06)",
          border: "1px solid var(--color-border)",
          minHeight: 280,
          position: "relative",
        }}
      >
        <div
          ref={imgRef}
          style={{
            width: "100%",
            paddingTop: "62%",
            background: `rgba(229,9,127,0.08)`,
            position: "relative",
          }}
        >
          {item.imageDesktop ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={item.imageDesktop}
              alt={item.outcome}
              style={{
                position: "absolute",
                inset: 0,
                width: "100%",
                height: "100%",
                objectFit: "cover",
              }}
              className="img-desktop"
            />
          ) : (
            /* Placeholder when no image yet */
            <div
              style={{
                position: "absolute",
                inset: 0,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexDirection: "column",
                gap: 8,
              }}
            >
              <span style={{ fontSize: "2.5rem" }}>🖥</span>
              <span style={{ color: "var(--color-text-secondary)", fontSize: "0.85rem" }}>
                Screenshot coming soon
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function WorkShowcase() {
  return (
    <section id="work" style={{ background: "var(--color-bg)" }}>
      <div style={{ padding: "80px 6vw 0" }}>
        <span className="section-label">Results Delivered</span>
        <h2>
          Work that{" "}
          <span style={{ color: "var(--color-accent)" }}>speaks for itself.</span>
        </h2>
      </div>

      {workItems.map((item) => (
        <WorkCard key={item.id} item={item} />
      ))}

      <style>{`
        @media (max-width: 768px) {
          .work-card {
            flex-direction: column !important;
            padding: 14vh 5vw !important;
            gap: 40px !important;
          }
          .img-desktop { display: block !important; }
        }
      `}</style>
    </section>
  );
}

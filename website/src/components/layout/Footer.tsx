"use client";

import { navItems } from "@/data/navigation";

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer
      style={{
        padding: "100px 6vw 60px",
        background: "var(--color-bg)",
        borderTop: "1px solid var(--color-border)",
      }}
    >
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr 1fr",
          gap: "4vw",
          marginBottom: 80,
        }}
        className="footer-grid"
      >
        {/* Col 1 — Brand */}
        <div>
          <div
            style={{
              fontFamily: "var(--font-heading)",
              fontWeight: 700,
              fontSize: "1.4rem",
              letterSpacing: "0.06em",
              marginBottom: 16,
            }}
          >
            Binary<span style={{ color: "var(--color-accent)" }}>.</span>
          </div>
          <p style={{ maxWidth: 240 }}>
            Websites, automations, AI tools — built for businesses that want to move fast.
          </p>
        </div>

        {/* Col 2 — Links */}
        <div>
          <h4
            style={{
              fontFamily: "var(--font-body)",
              fontWeight: 600,
              fontSize: "0.8rem",
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              color: "var(--color-accent)",
              marginBottom: 20,
            }}
          >
            Navigation
          </h4>
          <ul style={{ listStyle: "none", display: "flex", flexDirection: "column", gap: 12 }}>
            {navItems.map((item) => (
              <li key={item.href + item.label}>
                <a
                  href={item.href}
                  style={{
                    fontFamily: "var(--font-body)",
                    fontSize: "0.9rem",
                    color: "var(--color-text-secondary)",
                    transition: "color var(--transition-fast)",
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = "var(--color-text)")}
                  onMouseLeave={(e) => (e.currentTarget.style.color = "var(--color-text-secondary)")}
                >
                  {item.label}
                </a>
              </li>
            ))}
          </ul>
        </div>

        {/* Col 3 — Legal */}
        <div>
          <h4
            style={{
              fontFamily: "var(--font-body)",
              fontWeight: 600,
              fontSize: "0.8rem",
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              color: "var(--color-accent)",
              marginBottom: 20,
            }}
          >
            Legal
          </h4>
          <ul style={{ listStyle: "none", display: "flex", flexDirection: "column", gap: 12 }}>
            {["Privacy Policy", "Terms of Service"].map((label) => (
              <li key={label}>
                <a
                  href="#"
                  style={{
                    fontFamily: "var(--font-body)",
                    fontSize: "0.9rem",
                    color: "var(--color-text-secondary)",
                    transition: "color var(--transition-fast)",
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = "var(--color-text)")}
                  onMouseLeave={(e) => (e.currentTarget.style.color = "var(--color-text-secondary)")}
                >
                  {label}
                </a>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div
        style={{
          borderTop: "1px solid var(--color-border)",
          paddingTop: 28,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: 12,
        }}
      >
        <span style={{ color: "var(--color-text-secondary)", fontSize: "0.82rem", fontFamily: "var(--font-body)" }}>
          © {year} Binary Ventures Pvt Ltd. All rights reserved.
        </span>
        <span style={{ color: "var(--color-text-secondary)", fontSize: "0.82rem", fontFamily: "var(--font-body)" }}>
          binaryventures.in
        </span>
      </div>

      <style>{`
        @media (max-width: 768px) {
          .footer-grid { grid-template-columns: 1fr !important; gap: 40px !important; }
        }
      `}</style>
    </footer>
  );
}

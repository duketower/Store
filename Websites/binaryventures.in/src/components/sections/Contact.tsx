"use client";

import { useRef, useState } from "react";
import { contactInfo, contactMeta } from "@/data/contact";

export default function Contact() {
  const formRef = useRef<HTMLFormElement>(null);
  const [sent, setSent] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Wire to your backend / Formspree / Resend later
    setSent(true);
    formRef.current?.reset();
    setTimeout(() => setSent(false), 5000);
  };

  const inputStyle: React.CSSProperties = {
    width: "100%",
    padding: "14px 18px",
    background: "rgba(255,255,255,0.04)",
    border: "1px solid var(--color-border)",
    borderRadius: 10,
    color: "var(--color-text)",
    fontFamily: "var(--font-body)",
    fontSize: "0.95rem",
    outline: "none",
    transition: "border-color var(--transition-fast)",
    marginBottom: 16,
  };

  return (
    <section
      id="contact"
      style={{
        padding: "18vh 6vw",
        background: "var(--color-bg)",
      }}
    >
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "6vw",
          alignItems: "start",
        }}
        className="contact-grid"
      >
        {/* Left — form */}
        <div>
          <span className="section-label">Contact</span>
          <h2 style={{ fontWeight: 100, marginBottom: "0.6rem" }}>{contactMeta.heading}</h2>
          <p style={{ marginBottom: "2.5rem" }}>{contactMeta.subheading}</p>

          <form ref={formRef} onSubmit={handleSubmit}>
            <div
              style={{
                background: "rgba(255,255,255,0.03)",
                border: "1px solid var(--color-border)",
                borderRadius: 14,
                padding: 28,
              }}
            >
              <input
                type="text"
                placeholder="Your name"
                required
                style={inputStyle}
                onFocus={(e) => (e.currentTarget.style.borderColor = "var(--color-accent)")}
                onBlur={(e) => (e.currentTarget.style.borderColor = "var(--color-border)")}
              />
              <input
                type="email"
                placeholder="Your email"
                required
                style={inputStyle}
                onFocus={(e) => (e.currentTarget.style.borderColor = "var(--color-accent)")}
                onBlur={(e) => (e.currentTarget.style.borderColor = "var(--color-border)")}
              />
              <textarea
                placeholder="Tell us what you need..."
                required
                rows={5}
                style={{ ...inputStyle, resize: "vertical" }}
                onFocus={(e) => (e.currentTarget.style.borderColor = "var(--color-accent)")}
                onBlur={(e) => (e.currentTarget.style.borderColor = "var(--color-border)")}
              />

              <button
                type="submit"
                className="btn btn-accent"
                data-cursor
                style={{ width: "100%", marginTop: 8 }}
              >
                {sent ? "Message Sent ✓" : contactMeta.ctaLabel}
              </button>
            </div>
          </form>
        </div>

        {/* Right — info cards */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <span className="section-label" style={{ opacity: 0 }}>.</span>
          <h3 style={{ marginBottom: 8, fontWeight: 400, color: "var(--color-text-secondary)" }}>
            Or reach out directly
          </h3>
          {contactInfo.map((info) => (
            <div
              key={info.label}
              className="glass"
              style={{
                borderRadius: 12,
                padding: "18px 22px",
                display: "flex",
                flexDirection: "column",
                gap: 4,
              }}
            >
              <span
                style={{
                  fontSize: "0.72rem",
                  letterSpacing: "0.12em",
                  textTransform: "uppercase",
                  color: "var(--color-accent)",
                  fontFamily: "var(--font-body)",
                }}
              >
                {info.label}
              </span>
              {info.href ? (
                <a
                  href={info.href}
                  style={{
                    color: "var(--color-text)",
                    fontFamily: "var(--font-body)",
                    fontSize: "1rem",
                    transition: "color var(--transition-fast)",
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = "var(--color-accent)")}
                  onMouseLeave={(e) => (e.currentTarget.style.color = "var(--color-text)")}
                >
                  {info.value}
                </a>
              ) : (
                <span style={{ color: "var(--color-text)", fontFamily: "var(--font-body)", fontSize: "1rem" }}>
                  {info.value}
                </span>
              )}
            </div>
          ))}
        </div>
      </div>

      <style>{`
        @media (max-width: 768px) {
          .contact-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </section>
  );
}

"use client"

import type React from "react"
import { useState, useRef, useEffect } from "react"
import { ArrowUpRight } from "lucide-react"

interface Project {
  title: string
  description: string
  year: string
  link?: string
  image: string
}

const projects: Project[] = [
  {
    title: "Zero One POS",
    description: "A retail store fully managed by software — billing, inventory, and shift reports, all offline.",
    year: "2025",
    link: "https://store-pos-44750.web.app",
    image: "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=600&auto=format&fit=crop",
  },
  {
    title: "The Digital Experts",
    description: "A professional web presence for a marketing agency — live and driving client enquiries.",
    year: "2024",
    link: "https://the-digital-experts-in.netlify.app",
    image: "https://images.unsplash.com/photo-1467232004584-a241de8bcf5d?w=600&auto=format&fit=crop",
  },
  {
    title: "B2B Lead Generation System",
    description: "Thousands of qualified business contacts sourced automatically from Google Maps and LinkedIn.",
    year: "2024",
    image: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=600&auto=format&fit=crop",
  },
  {
    title: "Business Process Automation",
    description: "Hours of manual daily work eliminated — a multi-step workflow running entirely on its own.",
    year: "2024",
    image: "https://images.unsplash.com/photo-1518186285589-2f7649de83e0?w=600&auto=format&fit=crop",
  },
]

export function ProjectShowcase() {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null)
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })
  const [smoothPosition, setSmoothPosition] = useState({ x: 0, y: 0 })
  const [isVisible, setIsVisible] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const animationRef = useRef<number | null>(null)

  useEffect(() => {
    const lerp = (start: number, end: number, factor: number) =>
      start + (end - start) * factor

    const animate = () => {
      setSmoothPosition((prev) => ({
        x: lerp(prev.x, mousePosition.x, 0.15),
        y: lerp(prev.y, mousePosition.y, 0.15),
      }))
      animationRef.current = requestAnimationFrame(animate)
    }

    animationRef.current = requestAnimationFrame(animate)
    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current)
    }
  }, [mousePosition])

  const handleMouseMove = (e: React.MouseEvent) => {
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect()
      setMousePosition({ x: e.clientX - rect.left, y: e.clientY - rect.top })
    }
  }

  const handleMouseEnter = (index: number) => {
    setHoveredIndex(index)
    setIsVisible(true)
  }

  const handleMouseLeave = () => {
    setHoveredIndex(null)
    setIsVisible(false)
  }

  return (
    <section
      ref={containerRef}
      onMouseMove={handleMouseMove}
      className="relative w-full max-w-2xl mx-auto px-6 py-16"
    >
      <h2 className="text-sm font-medium tracking-widest uppercase mb-8"
        style={{ color: "var(--color-accent)", fontFamily: "var(--font-body)" }}>
        Work Delivered
      </h2>

      {/* Floating image tooltip */}
      <div
        className="pointer-events-none fixed z-50 overflow-hidden rounded-xl shadow-2xl"
        style={{
          left: containerRef.current?.getBoundingClientRect().left ?? 0,
          top: containerRef.current?.getBoundingClientRect().top ?? 0,
          transform: `translate3d(${smoothPosition.x + 24}px, ${smoothPosition.y - 110}px, 0)`,
          opacity: isVisible ? 1 : 0,
          scale: isVisible ? "1" : "0.85",
          transition: "opacity 0.3s cubic-bezier(0.4,0,0.2,1), scale 0.3s cubic-bezier(0.4,0,0.2,1)",
        }}
      >
        <div className="relative w-[280px] h-[180px] rounded-xl overflow-hidden"
          style={{ background: "var(--color-card)" }}>
          {projects.map((project, index) => (
            <img
              key={project.title}
              src={project.image}
              alt={project.title}
              className="absolute inset-0 w-full h-full object-cover transition-all duration-500 ease-out"
              style={{
                opacity: hoveredIndex === index ? 1 : 0,
                scale: hoveredIndex === index ? "1" : "1.08",
                filter: hoveredIndex === index ? "none" : "blur(8px)",
              }}
            />
          ))}
          <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
        </div>
      </div>

      {/* Project list */}
      <div className="space-y-0">
        {projects.map((project, index) => (
          <a
            key={project.title}
            href={project.link ?? "#"}
            target={project.link ? "_blank" : undefined}
            rel="noopener noreferrer"
            className="group block"
            onMouseEnter={() => handleMouseEnter(index)}
            onMouseLeave={handleMouseLeave}
          >
            <div
              className="relative py-6 transition-all duration-300 ease-out"
              style={{ borderTop: "1px solid var(--color-border)" }}
            >
              {/* Hover background */}
              <div
                className="absolute inset-0 -mx-4 px-4 rounded-lg transition-all duration-300 ease-out"
                style={{
                  background: "rgba(229,9,127,0.04)",
                  opacity: hoveredIndex === index ? 1 : 0,
                  transform: hoveredIndex === index ? "scale(1)" : "scale(0.97)",
                }}
              />

              <div className="relative flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  {/* Title */}
                  <div className="inline-flex items-center gap-2">
                    <h3
                      className="font-medium text-lg tracking-tight"
                      style={{ fontFamily: "var(--font-heading)", color: "var(--color-text)" }}
                    >
                      <span className="relative">
                        {project.title}
                        <span
                          className="absolute left-0 -bottom-0.5 h-px transition-all duration-300 ease-out"
                          style={{
                            width: hoveredIndex === index ? "100%" : "0%",
                            background: "var(--color-accent)",
                          }}
                        />
                      </span>
                    </h3>
                    <ArrowUpRight
                      className="w-4 h-4 transition-all duration-300 ease-out"
                      style={{
                        color: "var(--color-accent)",
                        opacity: hoveredIndex === index ? 1 : 0,
                        transform: hoveredIndex === index
                          ? "translate(0,0)"
                          : "translate(-6px, 6px)",
                      }}
                    />
                  </div>

                  {/* Description */}
                  <p
                    className="text-sm mt-1 leading-relaxed transition-colors duration-300"
                    style={{
                      color: hoveredIndex === index
                        ? "rgba(255,255,255,0.7)"
                        : "var(--color-text-secondary)",
                    }}
                  >
                    {project.description}
                  </p>
                </div>

                {/* Year */}
                <span
                  className="text-xs font-mono tabular-nums transition-colors duration-300"
                  style={{
                    color: hoveredIndex === index
                      ? "var(--color-accent)"
                      : "var(--color-text-secondary)",
                  }}
                >
                  {project.year}
                </span>
              </div>
            </div>
          </a>
        ))}

        {/* Bottom border */}
        <div style={{ borderTop: "1px solid var(--color-border)" }} />
      </div>
    </section>
  )
}

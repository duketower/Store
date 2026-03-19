import Hero from "@/components/sections/Hero";
import ServicesSlider from "@/components/sections/ServicesSlider";
import WorkShowcase from "@/components/sections/WorkShowcase";
import About from "@/components/sections/About";
import Contact from "@/components/sections/Contact";
import Marquee from "@/components/ui/Marquee";

export default function Home() {
  return (
    <>
      <Hero />
      <Marquee />
      <ServicesSlider />
      <Marquee text="WEBSITES · AUTOMATION · AI TOOLS · LEAD GENERATION · WE BUILD YOUR VISION · BINARY VENTURES ·" accent />
      <WorkShowcase />
      <Marquee text="LET'S BUILD SOMETHING GREAT · FAST · SCALABLE · PRODUCTION-READY · BINARY VENTURES · binaryventures.in ·" />
      <About />
      <Contact />
    </>
  );
}

import { useEffect, useState } from "react";
import Nav from "./landing/Nav";
import Hero from "./landing/Hero";
import HowItWorks from "./landing/HowItWorks";
import Features from "./landing/Features";
import Showcase from "./landing/Showcase";
import Waitlist from "./landing/Waitlist";
import FAQ from "./landing/FAQ";
import Footer from "./landing/Footer";

export default function Landing() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "var(--bg-canvas)",
        color: "var(--text)",
        position: "relative",
        overflowX: "hidden",
      }}
    >
      <div style={{ position: "relative", zIndex: 1 }}>
        <Nav scrolled={scrolled} />
        <Hero />
        <HowItWorks />
        <Features />
        <Showcase />
        <Waitlist />
        <FAQ />
        <Footer />
      </div>
    </div>
  );
}

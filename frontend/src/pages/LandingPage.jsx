import { useState, useEffect } from "react";
import ParticleBackground from "./element/ParticleBackground";
import Hero from "./Landing/Hero";
import { Header, Footer, DeveloperResources, About } from "./Landing/NavBar";
import FeaturesSection from "./Landing/FeaturesSection";
import PreviewSection from "./Landing/PreviewPopup";
import ReviewsSection from "./Landing/ReviewsSection";
import FloatingReviewsButton from "./Landing/FloatingReviewsButton";
import PWASection from "./Landing/PWASection";
import HelpSection from "./Landing/HelpSection";

const CforgeLanding = () => {
  const [scrollPosition, setScrollPosition] = useState(0);

  useEffect(() => {
    // Reset scroll position when component mounts (page loads/refreshes)
    window.scrollTo(0, 0);

    // Optimized scroll handler with throttling
    let ticking = false;
    const handleScroll = () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          setScrollPosition(window.scrollY);
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    document.body.style.backgroundColor = "#0A0F23";

    // Add event listener for external links
    const handleExternalLinks = (e) => {
      const link = e.target.closest("a");
      if (link && link.href && link.target === "_blank") {
        // For external links, ensure they open properly
        // The scroll reset will be handled by the destination page
      }
    };

    document.addEventListener("click", handleExternalLinks);

    return () => {
      window.removeEventListener("scroll", handleScroll);
      document.removeEventListener("click", handleExternalLinks);
    };
  }, []);

  // Force scroll to top when component unmounts (navigation)
  useEffect(() => {
    return () => {
      // This runs when component unmounts
      window.scrollTo(0, 0);
    };
  }, []);

  return (
    <div className="relative min-h-screen bg-[#0A0F23] text-white overflow-hidden font-sans">
      <ParticleBackground />
      <div className="relative z-10">
        <Header isScrolled={scrollPosition > 100} />
        <Hero />

        <section
          id="features"
          className="py-10 px-6 bg-[#0A0F23] relative z-10"
        >
          <FeaturesSection />
        </section>

        {/* Preview Section */}
        <section id="preview" className="bg-[#0A0F23] relative overflow-hidden">
          <PreviewSection />
        </section>

        {/* PWA Section - New */}
        <section id="pwa" className="bg-[#0A0F23] relative overflow-hidden">
          <PWASection />
        </section>

        {/* Reviews Section */}
        <ReviewsSection />

        {/* Help & FAQ Section - New */}
        <section id="help" className="bg-[#0A0F23] relative overflow-hidden">
          <HelpSection />
        </section>

        <DeveloperResources />
        <About />
        <Footer />
      </div>
      <FloatingReviewsButton />
    </div>
  );
};

export default CforgeLanding;

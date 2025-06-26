import { useState } from "react";
import { Code, BadgeInfo, X, Menu } from "lucide-react";
import WideMenuIcon from "../../components/ui/WideMenuIcon";

// Reusable Components
const Header = ({ isScrolled }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const navItems = [
    { href: "#features", label: "Features", type: "anchor" },
    { href: "#preview", label: "Preview", type: "anchor" },
    { href: "#reviews", label: "Reviews", type: "anchor" },
    { href: "#docs", label: "Documentation", type: "anchor" },
    { href: "#about", label: "About", type: "anchor" },
  ];

  return (
    <>
      <header
        className={`fixed top-0 w-full z-50 transition-all duration-500 ${
          isScrolled
            ? "bg-[#0A0F23]/95 backdrop-blur-xl shadow-2xl shadow-purple-900/20 border-b border-purple-900/20"
            : "bg-transparent"
        }`}
      >
        <div className="container mx-auto px-4 sm:px-6 py-3 sm:py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="relative h-6 w-6 sm:h-8 sm:w-8">
                <img
                  src="/cforge.png"
                  alt="CForge Icon"
                  className="h-6 w-6 sm:h-8 sm:w-8 rounded-full"
                />
                <div className="absolute inset-0 bg-purple-400/20 rounded-full blur-xl animate-pulse" />
              </div>
              <a
                href="/"
                className="text-xl sm:text-2xl font-extrabold tracking-tight bg-gradient-to-r from-purple-400 via-blue-400 to-cyan-400 bg-clip-text text-transparent"
              >
                CForge
              </a>
            </div>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-6 lg:gap-8">
              {navItems.map((item, index) => (
                <div key={item.href}>
                  <a
                    href={item.href}
                    className="text-base lg:text-lg font-medium text-gray-300 hover:text-purple-400 transition-colors duration-300 relative group"
                  >
                    {item.label}
                  </a>
                </div>
              ))}
            </nav>

            {/* Desktop CTA Buttons */}
            <div className="hidden md:flex items-center gap-3 lg:gap-4">
              <button
                className="px-4 lg:px-6 py-2 text-sm lg:text-base text-purple-400 border border-purple-400/50 rounded-full hover:bg-purple-400/10 transition-all duration-300 hover:scale-105 active:scale-95"
                onClick={() => (window.location.href = "/login")}
              >
                Sign In
              </button>
              <button
                className="px-4 lg:px-6 py-2 text-sm lg:text-base bg-gradient-to-r from-purple-600 to-blue-600 rounded-full text-white font-medium shadow-lg shadow-purple-500/25 hover:shadow-purple-500/40 transition-all duration-300 hover:scale-105 active:scale-95"
                onClick={() => (window.location.href = "/signup")}
              >
                Get Started
              </button>
            </div>

            {/* Mobile Menu Button */}
            <button
              className="md:hidden text-white p-2 hover:bg-purple-500/20 rounded-lg transition-colors duration-200"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              <WideMenuIcon isOpen={isMenuOpen} className="text-white" />
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Slide Menu Overlay */}
      <div
        className={`fixed inset-0 bg-black/50 backdrop-blur-sm z-40 transition-opacity duration-300 md:hidden ${
          isMenuOpen
            ? "opacity-100 pointer-events-auto"
            : "opacity-0 pointer-events-none"
        }`}
        onClick={() => setIsMenuOpen(false)}
      />

      {/* Mobile Slide Menu */}
      <div
        className={`fixed top-0 right-0 h-full w-80 max-w-[85vw] bg-[#0A0F23]/20 backdrop-blur-xl border-l border-purple-900/30 z-50 transform transition-transform duration-300 ease-in-out md:hidden ${
          isMenuOpen ? "translate-x-0" : "translate-x-full"
        } rounded-tl-2xl rounded-bl-2xl`}
      >
        <div className="p-0 h-full flex flex-col">
          {/* Top: Logo and Close Button */}
          <div className="flex items-center justify-between px-6 py-5 border-b border-purple-900/20">
            <div className="flex items-center gap-2">
              <img
                src="/cforge.png"
                alt="CForge Icon"
                className="h-6 w-6 rounded-full"
              />
              <span className="text-xl font-extrabold tracking-tight bg-gradient-to-r from-purple-400 via-blue-400 to-cyan-400 bg-clip-text text-transparent">
                CForge
              </span>
            </div>
            <button
              onClick={() => setIsMenuOpen(false)}
              className="text-gray-300 hover:text-white p-2 hover:bg-purple-500/20 rounded-lg transition-colors duration-200"
            >
              <X size={20} />
            </button>
          </div>

          {/* Navigation Items */}
          <nav className="flex-1 overflow-y-auto px-6 py-6 space-y-2">
            {navItems.map((item, index) => (
              <div
                key={item.href}
                className={`transform transition-all duration-300 delay-${
                  index * 50
                }`}
                style={{
                  transform: isMenuOpen ? "translateX(0)" : "translateX(100px)",
                  opacity: isMenuOpen ? 1 : 0,
                }}
              >
                <a
                  href={item.href}
                  className="block py-3 px-4 text-lg text-gray-300 hover:text-purple-400 hover:bg-purple-500/10 rounded-lg transition-all duration-200"
                  onClick={() => setIsMenuOpen(false)}
                >
                  {item.label}
                </a>
              </div>
            ))}
          </nav>

          {/* Mobile CTA Buttons */}
          <div className="px-6 pb-6 space-y-4">
            <button
              className="w-full py-3 px-4 text-purple-400 border border-purple-400/50 rounded-full hover:bg-purple-400/10 transition-all duration-300 hover:scale-105 active:scale-95"
              onClick={() => {
                window.location.href = "/login";
                setIsMenuOpen(false);
              }}
            >
              Sign In
            </button>
            <button
              className="w-full py-3 px-4 bg-gradient-to-r from-purple-600 to-blue-600 rounded-full text-white font-medium shadow-lg shadow-purple-500/25 hover:shadow-purple-500/40 transition-all duration-300 hover:scale-105 active:scale-95"
              onClick={() => {
                window.location.href = "/signup";
                setIsMenuOpen(false);
              }}
            >
              Get Started
            </button>
          </div>

          {/* Footer */}
          <div className="px-6 pb-4 pt-2">
            <div className="h-px bg-gradient-to-r from-transparent via-purple-500/50 to-transparent mb-4"></div>
            <p className="text-center text-xs text-gray-500">© 2024 CForge</p>
          </div>
        </div>
      </div>
    </>
  );
};

const PreviewCard = ({ item, onHover, onLeave }) => (
  <div
    className="rounded-lg overflow-hidden shadow-lg border border-purple-900/30 bg-[#141B3F]/80 p-4 text-center hover:border-purple-500/50 transition-all duration-300 cursor-pointer shadow-lg shadow-purple-900/20 hover:scale-105"
    onMouseEnter={() => onHover(item)}
    onMouseLeave={onLeave}
  >
    <img
      src={`/preview/${item.src}`}
      alt={item.title}
      className="w-full h-auto rounded-lg object-cover"
    />
    <h3 className="text-lg font-bold mt-4 text-purple-300">{item.title}</h3>
    <p className="text-gray-400 text-sm">{item.desc}</p>
  </div>
);

const DeveloperResources = () => (
  <section
    id="docs"
    className="py-16 sm:py-24 px-4 sm:px-6 bg-gradient-to-b from-[#141B3F] to-[#0A0F23]"
  >
    <div className="container mx-auto text-center">
      <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold mb-8 sm:mb-12 tracking-tight bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
        Developer Resources
      </h2>
      <p className="text-lg sm:text-xl text-gray-300 mb-8 sm:mb-12 max-w-2xl mx-auto font-light tracking-wide">
        Explore our documentation.
      </p>
      <div className="flex justify-center gap-6">
        <button
          className="px-6 sm:px-8 py-3 text-base sm:text-lg font-medium rounded-full bg-transparent border-2 border-purple-500 text-purple-400 hover:bg-purple-500/20 transition-all duration-300 hover:scale-105 active:scale-95"
          onClick={() =>
            window.open(
              "https://github.com/4xush/CForge/blob/master/README.md",
              "_blank"
            )
          }
        >
          Read Developer Docs
        </button>
      </div>
    </div>
  </section>
);

const About = () => (
  <section
    id="about"
    className="py-16 sm:py-24 px-4 sm:px-6 bg-gradient-to-b from-[#121831] to-[#141B3F]"
  >
    <div className="container mx-auto">
      <div className="text-center mb-12 sm:mb-16">
        <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold mb-4 sm:mb-6 tracking-tight bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
          About CForge
        </h2>
        <p className="text-base sm:text-lg text-gray-300 max-w-3xl mx-auto font-light tracking-wide">
          Bringing visibility to your coding journey and fostering
          community-driven growth
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-8 sm:gap-12 items-center max-w-6xl mx-auto">
        <div className="space-y-6">
          <div className="space-y-4 text-gray-300 text-base sm:text-lg leading-relaxed">
            <p>
              <span className="text-purple-400 font-semibold">CForge</span> is a
              coding community platform with progress analytics, designed to
              bridge the gap between individual efforts on platforms like
              LeetCode, GitHub, and Codeforces and peer visibility—unlocking new
              opportunities for motivation, collaboration, and mentorship.
            </p>
            <p>
              We created a collaborative space where developers can come
              together, create rooms, track their progress, and stay aware of
              each other's journeys — no matter where they are in their coding
              path.
            </p>
            <p>
              At the heart of CForge lies the belief that visibility and
              community are key drivers of growth. When you see your peers
              striving, building, and overcoming challenges, it sparks a sense
              of healthy competition and shared ambition.
            </p>
          </div>

          <div className="pt-4">
            <a
              href="/about"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 sm:px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 rounded-full text-white font-medium shadow-lg shadow-purple-500/25 hover:shadow-purple-500/40 transition-all duration-300 hover:scale-105 active:scale-95 text-sm sm:text-base"
            >
              <BadgeInfo className="h-4 w-4" />
              Learn More About CForge
            </a>
          </div>
        </div>

        <div className="relative">
          <div className="bg-gradient-to-br from-purple-900/20 to-blue-900/20 backdrop-blur-sm rounded-2xl p-6 sm:p-8 border border-purple-500/20">
            <div className="space-y-6">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full flex items-center justify-center">
                  <Code className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                </div>
                <div>
                  <h3 className="text-lg sm:text-xl font-bold text-purple-300">
                    Unified Progress Tracking
                  </h3>
                  <p className="text-gray-400 text-sm sm:text-base">
                    Monitor growth across all platforms
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full flex items-center justify-center">
                  <BadgeInfo className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                </div>
                <div>
                  <h3 className="text-lg sm:text-xl font-bold text-blue-300">
                    Community Collaboration
                  </h3>
                  <p className="text-gray-400 text-sm sm:text-base">
                    Connect with like-minded developers
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-r from-cyan-500 to-purple-500 rounded-full flex items-center justify-center">
                  <Menu className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                </div>
                <div>
                  <h3 className="text-lg sm:text-xl font-bold text-cyan-300">
                    Current Standings
                  </h3>
                  <p className="text-gray-400 text-sm sm:text-base">
                    Leaderboards and statistics
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
);

const Footer = () => (
  <footer className="bg-[#0A0F23]/90 backdrop-blur-md py-8 sm:py-10 px-4 sm:px-6 border-t border-purple-900/20">
    <div className="container mx-auto">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-2">
          <img
            src="/cforge.png"
            alt="CForge Icon"
            className="h-6 w-6 rounded-full"
          />
          <span className="text-lg font-bold bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
            CForge
          </span>
        </div>
        <div className="flex items-center gap-6 text-sm">
          <a
            href="#reviews"
            className="text-gray-400 hover:text-purple-400 transition-colors duration-200"
            onClick={(e) => {
              e.preventDefault();
              document
                .getElementById("reviews")
                .scrollIntoView({ behavior: "smooth" });
            }}
          >
            Reviews
          </a>
          <a
            href="/about"
            className="text-gray-400 hover:text-purple-400 transition-colors duration-200"
          >
            About
          </a>
          <a
            href="https://github.com/4xush/CForge"
            target="_blank"
            rel="noopener noreferrer"
            className="text-gray-400 hover:text-purple-400 transition-colors duration-200"
          >
            GitHub
          </a>
        </div>
      </div>
      <div className="text-center text-gray-400 text-sm">
        <p>© 2024 CForge. All rights reserved.</p>
      </div>
    </div>
  </footer>
);

export { Header, PreviewCard, DeveloperResources, About, Footer };

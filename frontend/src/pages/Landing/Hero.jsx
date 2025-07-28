import { useState, useRef } from "react";
import { ArrowRight, ChevronDown } from "lucide-react";

const Hero = () => {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [isHovering, setIsHovering] = useState(false);
  const textRef = useRef(null);

  const handleMouseMove = (e) => {
    if (textRef.current) {
      const rect = textRef.current.getBoundingClientRect();
      setMousePosition({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      });
    }
  };

  return (
    <section className="min-h-[98vh] flex items-center justify-center relative overflow-hidden pt-20 px-4">
      <div className="absolute inset-0 bg-black opacity-60"></div>
      <div
        className="relative z-10 text-center"
        ref={textRef}
        onMouseMove={handleMouseMove}
        onMouseEnter={() => setIsHovering(true)}
        onMouseLeave={() => setIsHovering(false)}
      >
        <div className="relative inline-block">
          <h1
            className="text-[80px] sm:text-[120px] md:text-[160px] lg:text-[200px] font-extrabold tracking-tight select-none cursor-pointer leading-none"
            style={{
              WebkitTextFillColor: "transparent",
              WebkitTextStrokeWidth: "1px",
              WebkitTextStrokeColor: "rgba(190, 190, 190, 0.69)",
              position: "relative",
              zIndex: 2,
            }}
          >
            CFORGE
          </h1>
          <h1
            className="text-[80px] sm:text-[120px] md:text-[160px] lg:text-[200px] font-extrabold tracking-tight absolute top-0 left-0 w-full text-center pointer-events-none select-none leading-none"
            style={{
              WebkitTextFillColor: "transparent",
              WebkitTextStrokeWidth: "1.5px",
              WebkitTextStrokeColor: isHovering
                ? "rgb(146, 51, 234)"
                : "transparent",
              filter: "blur(2px) brightness(2.5)",
              opacity: isHovering ? 1 : 0,
              maskImage: `radial-gradient(circle 80px at ${mousePosition.x}px ${mousePosition.y}px, black 0%, transparent 70%)`,
              WebkitMaskImage: `radial-gradient(circle 80px at ${mousePosition.x}px ${mousePosition.y}px, black 0%, transparent 70%)`,
              transition: "opacity 0.7s ease",
              zIndex: 1,
            }}
          >
            CFORGE
          </h1>
          <h1
            className="text-[80px] sm:text-[120px] md:text-[160px] lg:text-[200px] font-extrabold tracking-tight absolute top-0 left-0 w-full text-center pointer-events-none select-none leading-none"
            style={{
              WebkitTextFillColor: "transparent",
              WebkitTextStrokeWidth: "1.5px",
              WebkitTextStrokeColor: isHovering
                ? "rgb(243, 0, 162)"
                : "transparent",
              filter: "blur(4px) brightness(1.5)",
              opacity: isHovering ? 0.7 : 0,
              maskImage: `radial-gradient(circle 180px at ${mousePosition.x}px ${mousePosition.y}px, black 0%, transparent 80%)`,
              WebkitMaskImage: `radial-gradient(circle 100px at ${mousePosition.x}px ${mousePosition.y}px, black 0%, transparent 80%)`,
              transition: "opacity 0.4s ease",
              zIndex: 0,
            }}
          >
            CFORGE
          </h1>
        </div>
        <p className="text-base sm:text-lg md:text-xl lg:text-2xl text-gray-300 mb-2 max-w-3xl mx-auto font-light tracking-wide mt-4 sm:mt-6 px-4">
          LeetCode Tracker & Competitive Programming Leaderboard.
        </p>
        <p className="text-sm sm:text-base md:text-lg text-gray-400 mb-6 max-w-2xl mx-auto font-light px-4">
          Track solved problems, create room-based communities, and enhance your
          skills with peer competition.
        </p>
        {/* CTA Buttons */}
        <div className="flex justify-center gap-4 sm:gap-6">
          <div className="flex flex-col sm:flex-row justify-center gap-4 sm:gap-6 mb-16 sm:mb-24">
            <button
              className="px-6 sm:px-8 py-3 text-base sm:text-lg font-medium rounded-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 transition-all duration-300 shadow-lg shadow-purple-500/20 hover:scale-105 active:scale-95"
              onClick={() => window.open("/signup", "_blank")}
            >
              <span className="relative z-10 flex items-center gap-2 justify-center">
                Track LeetCode & Join Rooms
                <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 group-hover:translate-x-1 transition-transform" />
              </span>
            </button>
            <button
              className="px-6 sm:px-8 py-3 text-base sm:text-lg font-medium rounded-full bg-transparent border-2 border-purple-500 text-purple-400 hover:bg-purple-500/20 transition-all duration-300 hover:scale-105 active:scale-95"
              onClick={() =>
                window.open("/login", "_blank", "noopener,noreferrer")
              }
            >
              Sign In
            </button>
            <button
              className="px-6 sm:px-8 py-3 text-base sm:text-lg font-medium rounded-full bg-transparent border-2 border-gray-500 text-gray-300 hover:bg-gray-500/20 transition-all duration-300 hover:scale-105 active:scale-95"
              onClick={() =>
                document
                  .getElementById("reviews")
                  .scrollIntoView({ behavior: "smooth" })
              }
            >
              See Reviews
            </button>
          </div>
        </div>
      </div>
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(circle, rgba(147, 51, 234, 0.1) 0%, rgba(0, 0, 0, 0.9) 100%)",
          animation: "backgroundShift 10s infinite linear",
        }}
      />
      <style
        dangerouslySetInnerHTML={{
          __html: `
                    @keyframes backgroundShift {
                        0% { background: radial-gradient(circle, rgba(147, 51, 234, 0.1) 0%, rgba(0, 0, 0, 0.9) 100%); }
                        50% { background: radial-gradient(circle, rgba(0, 112, 243, 0.1) 0%, rgba(0, 0, 0, 0.9) 100%); }
                        100% { background: radial-gradient(circle, rgba(147, 51, 234, 0.1) 0%, rgba(0, 0, 0, 0.9) 100%); }
                    }
                `,
        }}
      />
      {/* Scroll Indicator */}
      <div className="absolute bottom-6 sm:bottom-8 left-1/2 transform -translate-x-1/2 opacity-100">
        <div className="flex flex-col items-center text-gray-400 animate-bounce">
          <span className="text-xs sm:text-sm mt-2">Scroll to explore</span>
          <ChevronDown className="w-5 h-5 sm:w-6 sm:h-6" />
        </div>
      </div>
    </section>
  );
};

export default Hero;

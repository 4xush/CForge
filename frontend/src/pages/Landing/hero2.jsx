import { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import { ChevronDown } from 'lucide-react';

const Hero = () => {
    const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
    const [isHovering, setIsHovering] = useState(false);
    const textRef = useRef(null);

    const handleMouseMove = (e) => {
        if (textRef.current) {
            const rect = textRef.current.getBoundingClientRect();
            setMousePosition({
                x: e.clientX - rect.left,
                y: e.clientY - rect.top
            });
        }
    };

    const stats = [
        { number: "10K+", label: "Active Users" },
        { number: "500+", label: "Coding Rooms" },
        { number: "1M+", label: "Problems Solved" },
        { number: "99.9%", label: "Uptime" }
    ];

    return (
        <section className="min-h-screen flex items-center justify-center relative overflow-hidden pt-20">
            <div className="absolute inset-0 bg-gradient-to-br from-[#0A0F23] via-[#141B3F] to-[#0A0F23]" />

            <motion.div
                initial={{ opacity: 0, y: 50 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 1 }}
                className="relative z-10 text-center max-w-6xl mx-auto px-6"
            >
                {/* Main Title with Interactive Effect */}
                <div
                    ref={textRef}
                    onMouseMove={handleMouseMove}
                    onMouseEnter={() => setIsHovering(true)}
                    onMouseLeave={() => setIsHovering(false)}
                    className="relative mb-8"
                >
                    <h1 className="text-6xl md:text-8xl lg:text-9xl font-extrabold tracking-tight select-none cursor-pointer relative z-20"
                        style={{
                            WebkitTextFillColor: 'transparent',
                            WebkitTextStrokeWidth: '2px',
                            WebkitTextStrokeColor: 'rgba(190, 190, 190, 0.3)',
                        }}
                    >
                        CFORGE
                    </h1>

                    {/* Glow Effect Layers */}
                    {[
                        { color: 'rgb(147, 51, 234)', blur: '2px', opacity: isHovering ? 0.8 : 0, radius: 120 },
                        { color: 'rgb(59, 130, 246)', blur: '4px', opacity: isHovering ? 0.6 : 0, radius: 180 },
                        { color: 'rgb(236, 72, 153)', blur: '8px', opacity: isHovering ? 0.4 : 0, radius: 240 }
                    ].map((layer, index) => (
                        <h1
                            key={index}
                            className="text-6xl md:text-8xl lg:text-9xl font-extrabold tracking-tight absolute top-0 left-0 pointer-events-none select-none"
                            style={{
                                WebkitTextFillColor: 'transparent',
                                WebkitTextStrokeWidth: '2px',
                                WebkitTextStrokeColor: layer.color,
                                filter: `blur(${layer.blur}) brightness(2)`,
                                opacity: layer.opacity,
                                maskImage: `radial-gradient(circle ${layer.radius}px at ${mousePosition.x}px ${mousePosition.y}px, black 0%, transparent 70%)`,
                                WebkitMaskImage: `radial-gradient(circle ${layer.radius}px at ${mousePosition.x}px ${mousePosition.y}px, black 0%, transparent 70%)`,
                                transition: 'opacity 0.3s ease',
                                zIndex: 19 - index
                            }}
                        >
                            CFORGE
                        </h1>
                    ))}
                </div>

                {/* Subtitle */}
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5, duration: 0.8 }}
                    className="mb-12"
                >
                    <h2 className="text-2xl md:text-4xl lg:text-5xl font-bold text-white mb-6">
                        The Future of
                        <span className="bg-gradient-to-r from-purple-400 via-blue-400 to-cyan-400 bg-clip-text text-transparent">
                            {" "}Competitive Coding
                        </span>
                    </h2>
                    <p className="text-xl md:text-2xl text-gray-300 max-w-3xl mx-auto font-light leading-relaxed">
                        Track your progress, compete with friends, and elevate your coding journey with real-time analytics and collaborative rooms.
                    </p>
                </motion.div>

                {/* CTA Buttons */}
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.8, duration: 0.8 }}
                    className="flex flex-col sm:flex-row justify-center gap-6 mb-16"
                >
                    <motion.button
                        whileHover={{ scale: 1.05, boxShadow: "0 20px 40px rgba(147, 51, 234, 0.4)" }}
                        whileTap={{ scale: 0.95 }}
                        className="px-8 py-4 text-lg font-semibold rounded-full bg-gradient-to-r from-purple-600 via-blue-600 to-cyan-600 text-white shadow-2xl shadow-purple-500/30 hover:shadow-purple-500/50 transition-all duration-300 relative overflow-hidden group"
                    >
                        <span className="relative z-10 flex items-center gap-2">
                            Start Your Journey
                            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                        </span>
                        <div className="absolute inset-0 bg-gradient-to-r from-purple-700 via-blue-700 to-cyan-700 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    </motion.button>

                    <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className="px-8 py-4 text-lg font-semibold rounded-full bg-transparent border-2 border-purple-400/50 text-purple-400 hover:bg-purple-400/10 hover:border-purple-400 transition-all duration-300 backdrop-blur-sm"
                    >
                        Watch Demo
                    </motion.button>
                </motion.div>

                {/* Stats Section */}
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 1.2, duration: 0.8 }}
                    className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-4xl mx-auto"
                >
                    {stats.map((stat, index) => (
                        <motion.div
                            key={index}
                            whileHover={{ scale: 1.05 }}
                            className="text-center p-6 rounded-xl bg-white/5 backdrop-blur-sm border border-white/10 hover:border-purple-400/50 transition-all duration-300"
                        >
                            <div className="text-3xl md:text-4xl font-bold text-white mb-2">{stat.number}</div>
                            <div className="text-gray-400 text-sm md:text-base">{stat.label}</div>
                        </motion.div>
                    ))}
                </motion.div>
            </motion.div>

            {/* Animated Background Gradient */}
            <motion.div
                className="absolute inset-0 opacity-30"
                animate={{
                    background: [
                        'radial-gradient(circle at 20% 50%, rgba(147, 51, 234, 0.3) 0%, transparent 50%)',
                        'radial-gradient(circle at 80% 20%, rgba(59, 130, 246, 0.3) 0%, transparent 50%)',
                        'radial-gradient(circle at 40% 80%, rgba(236, 72, 153, 0.3) 0%, transparent 50%)',
                        'radial-gradient(circle at 20% 50%, rgba(147, 51, 234, 0.3) 0%, transparent 50%)',
                    ],
                }}
                transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
            />

            {/* Scroll Indicator */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 2 }}
                className="absolute bottom-8 left-1/2 transform -translate-x-1/2"
            >
                <motion.div
                    animate={{ y: [0, 10, 0] }}
                    transition={{ duration: 2, repeat: Infinity }}
                    className="flex flex-col items-center text-gray-400"
                >
                    <span className="text-sm mb-2">Scroll to explore</span>
                    <ChevronDown className="w-6 h-6" />
                </motion.div>
            </motion.div>
        </section>
    );
};
export default Hero;
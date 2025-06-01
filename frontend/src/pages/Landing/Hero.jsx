import { useState, useRef } from 'react';
import { ArrowRight, ChevronDown } from 'lucide-react';
import { motion } from 'framer-motion';

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

    return (
        <section className="min-h-[98vh] flex items-center justify-center relative overflow-hidden pt-20">
            <div className="absolute inset-0 bg-black opacity-60"></div>
            <motion.div
                initial={{ opacity: 0, y: 50 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 1 }}
                className="relative z-10 text-center"
                ref={textRef}
                onMouseMove={handleMouseMove}
                onMouseEnter={() => setIsHovering(true)}
                onMouseLeave={() => setIsHovering(false)}
            >
                <h1 className="text-[200px] font-extrabold tracking-tight select-none cursor-pointer"
                    style={{
                        WebkitTextFillColor: 'transparent',
                        WebkitTextStrokeWidth: '1px',
                        WebkitTextStrokeColor: 'rgba(190, 190, 190, 0.69)',
                        position: 'relative',
                        zIndex: 2
                    }}
                >
                    CFORGE
                </h1>
                <h1 className="text-[200px] font-extrabold tracking-tight absolute top-0 left-0 pointer-events-none select-none"
                    style={{
                        WebkitTextFillColor: 'transparent',
                        WebkitTextStrokeWidth: '1.5px',
                        WebkitTextStrokeColor: isHovering ? 'rgb(146, 51, 234)' : 'transparent',
                        filter: 'blur(2px) brightness(2.5)',
                        opacity: isHovering ? 1 : 0,
                        maskImage: `radial-gradient(circle 80px at ${mousePosition.x}px ${mousePosition.y}px, black 0%, transparent 70%)`,
                        WebkitMaskImage: `radial-gradient(circle 80px at ${mousePosition.x}px ${mousePosition.y}px, black 0%, transparent 70%)`,
                        transition: 'opacity 0.7s ease',
                        zIndex: 1
                    }}
                >
                    CFORGE
                </h1>
                <h1 className="text-[200px] font-extrabold tracking-tight absolute top-0 left-0 pointer-events-none select-none"
                    style={{
                        WebkitTextFillColor: 'transparent',
                        WebkitTextStrokeWidth: '1.5px',
                        WebkitTextStrokeColor: isHovering ? 'rgb(243, 0, 162)' : 'transparent',
                        filter: 'blur(4px) brightness(1.5)',
                        opacity: isHovering ? 0.7 : 0,
                        maskImage: `radial-gradient(circle 180px at ${mousePosition.x}px ${mousePosition.y}px, black 0%, transparent 80%)`,
                        WebkitMaskImage: `radial-gradient(circle 100px at ${mousePosition.x}px ${mousePosition.y}px, black 0%, transparent 80%)`,
                        transition: 'opacity 0.4s ease',
                        zIndex: 0
                    }}
                >
                    CFORGE
                </h1>
                <p className="text-2xl md:text-3xl text-gray-300 mb-6 max-w-3xl mx-auto font-light tracking-wide">
                    Track your coding progress and grow with your peers.
                </p>
                {/* CTA Buttons */}
                <div className="flex justify-center gap-6">
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.8, duration: 0.8 }}
                        className="flex flex-col sm:flex-row justify-center gap-6 mb-24"
                    >
                        <motion.button
                            whileHover={{ scale: 1.05, boxShadow: "0 20px 40px rgba(147, 51, 234, 0.4)" }}
                            whileTap={{ scale: 0.95 }}
                            className="px-8 py-3 text-lg font-medium rounded-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 transition-all duration-300 shadow-lg shadow-purple-500/20"
                            onClick={() => window.open('/signup', '_blank')}
                        >
                            <span className="relative z-10 flex items-center gap-2">
                                Start Your Journey
                                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                            </span>
                        </motion.button>
                        <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.95 }}
                            className="px-8 py-3 text-lg font-medium rounded-full bg-transparent border-2 border-purple-500 text-purple-400 hover:bg-purple-500/20 transition-all duration-300"
                            onClick={() => window.open('/login', '_blank', 'noopener,noreferrer')}
                        >
                            Sign In
                        </motion.button>
                    </motion.div>
                </div>
            </motion.div>
            <motion.div
                className="absolute inset-0"
                animate={{
                    background: [
                        'radial-gradient(circle, rgba(147, 51, 234, 0.1) 0%, rgba(0, 0, 0, 0.9) 100%)',
                        'radial-gradient(circle, rgba(0, 112, 243, 0.1) 0%, rgba(0, 0, 0, 0.9) 100%)',
                    ],
                }}
                transition={{ duration: 10, repeat: Infinity, ease: 'linear' }}
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
                    <span className="text-sm mt-2">Scroll to explore</span>
                    <ChevronDown className="w-6 h-6" />
                </motion.div>
            </motion.div>
        </section>
    );
}
export default Hero;
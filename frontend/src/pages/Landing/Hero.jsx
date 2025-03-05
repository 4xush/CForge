import React, { useState, useEffect, useRef } from 'react';
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
                <p className="text-2xl md:text-3xl text-gray-300 mt-6 mb-12 max-w-3xl mx-auto font-light tracking-wide">
                    Improve coding skills and track progress with your peers.
                </p>
                <div className="flex justify-center gap-6">
                    <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.95 }}
                        className="px-8 py-3 text-lg font-medium rounded-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 transition-all duration-300 shadow-lg shadow-purple-500/20"
                        onClick={() => window.open('https://github.com/4xush/CForge', '_blank')}
                    >
                        Learn More
                    </motion.button>
                    <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.95 }}
                        className="px-8 py-3 text-lg font-medium rounded-full bg-transparent border-2 border-purple-500 text-purple-400 hover:bg-purple-500/20 transition-all duration-300"
                        onClick={() => window.open('/dashboard', '_blank', 'noopener,noreferrer')}
                    >
                        Try Now
                    </motion.button>
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
        </section>
    );
}
export default Hero;
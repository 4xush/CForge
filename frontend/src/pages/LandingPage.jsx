import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import ParticleBackground from './element/ParticleBackground';
import Hero from './Landing/Hero';
import { Header, FeatureSection, Footer, DeveloperResources } from './Landing/NavBar';

const CforgeLanding = () => {

    const [selectedPreview, setSelectedPreview] = useState(null); // State to track the selected preview item

    useEffect(() => {
        const handleScroll = () => setScrollPosition(window.scrollY);
        window.addEventListener('scroll', handleScroll);
        document.body.style.backgroundColor = '#0A0F23';
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    // Handle closing the popup
    const closePopup = () => {
        setSelectedPreview(null);
    };

    return (
        <div className="relative min-h-screen bg-[#0A0F23] text-white overflow-hidden font-sans">
            <ParticleBackground />
            <div className="relative z-10">
                <Header />
                <Hero />
                <FeatureSection />
                {/* 4. Preview Section */}
                <section id="preview" className="py-24 px-6 bg-[#0A0F23] relative overflow-hidden">
                    <motion.div
                        initial={{ opacity: 0, y: 50 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 1 }}
                        className="container mx-auto text-center relative z-10"
                    >
                        <h2 className="text-4xl md:text-5xl font-extrabold mb-8 tracking-tight bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
                            CForge Web App Preview
                        </h2>
                        <p className="text-gray-300 text-lg mb-12">
                            Take a closer look at the key features of CForge through these screenshots.
                        </p>

                        {/* Grid for Images with Descriptions */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                            {[
                                { src: "user detailed dashboard.png", title: "User Dashboard", desc: "A personalized dashboard displaying all user stats." },
                                { src: "room leaderboard.png", title: "Room Leaderboard", desc: "Compare performance within a specific room." },
                                { src: "leaderboard user profile.png", title: "Room Leaderboard details", desc: "Track your ranking against other users." },
                                { src: "room chat.png", title: "Room Chat", desc: "Engage in discussions with other room members." },
                                { src: "room.png", title: "Room Management", desc: "Create and manage rooms efficiently." },
                                { src: "detailed analysis.png", title: "Detailed Analysis", desc: "Get in-depth performance analytics." },
                                { src: "setting.png", title: "Settings", desc: "Customize preferences and platforms." },
                                { src: "help and faq.png", title: "Help & FAQ", desc: "Find answers to common questions." }
                            ].map((item, index) => (
                                <motion.div
                                    key={index}
                                    whileHover={{ scale: 1.05 }}
                                    className="rounded-lg overflow-hidden shadow-lg border border-purple-900/30 bg-[#141B3F]/80 p-4 text-center hover:border-purple-500/50 transition-all duration-300 cursor-pointer shadow-lg shadow-purple-900/20"
                                    onClick={() => setSelectedPreview(item)} // Open popup on click/hover
                                >
                                    <img
                                        src={`/preview/${item.src}`}
                                        alt={item.title}
                                        className="w-full h-auto rounded-lg object-cover"
                                    />
                                    <h3 className="text-lg font-bold mt-4 text-purple-300">{item.title}</h3>
                                    <p className="text-gray-400 text-sm">{item.desc}</p>
                                </motion.div>
                            ))}
                        </div>
                    </motion.div>

                    {/* Popup for Enlarged Preview */}
                    {selectedPreview && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0 }}
                            className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50"
                            onClick={closePopup} // Close on background click
                        >
                            <motion.div
                                initial={{ scale: 0.8 }}
                                animate={{ scale: 1 }}
                                exit={{ scale: 0.8 }}
                                className="bg-[#141B3F]/80 p-8 rounded-xl border border-purple-500/50 shadow-2xl shadow-purple-900/20 max-w-4xl w-full mx-4 relative"
                                onClick={(e) => e.stopPropagation()} // Prevent closing when clicking inside
                            >
                                <button
                                    onClick={closePopup}
                                    className="absolute top-4 right-4 text-gray-400 hover:text-purple-400 transition-colors p-2 rounded-full"
                                >
                                    ✕
                                </button>
                                <img
                                    src={`/preview/${selectedPreview.src}`}
                                    alt={selectedPreview.title}
                                    className="w-full h-auto rounded-lg object-contain max-h-[80vh]"
                                />
                                <h3 className="text-2xl font-bold mt-4 text-purple-300">{selectedPreview.title}</h3>
                                <p className="text-gray-400 text-base mt-2">{selectedPreview.desc}</p>
                            </motion.div>
                        </motion.div>
                    )}
                </section>
                <DeveloperResources />
                <Footer />
            </div>
        </div>
    );
};
export default CforgeLanding;
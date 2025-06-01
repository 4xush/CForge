import { useState, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const PreviewPopup = ({ selectedPreview, onClose }) => (
    <AnimatePresence>
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/90 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={onClose}
        >
            <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                transition={{ duration: 0.2, ease: "easeOut" }}
                className="bg-gradient-to-br from-[#1a1f3a] to-[#0f1427] p-6 md:p-8 rounded-2xl border border-purple-500/30 shadow-2xl max-w-5xl w-full relative"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Close button */}
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 z-10 w-10 h-10 rounded-full bg-gray-800/80 hover:bg-purple-600/20 flex items-center justify-center text-gray-400 hover:text-white transition-colors duration-200"
                >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>

                {/* Image container */}
                <div className="relative overflow-hidden rounded-xl mb-6">
                    <img
                        src={`/preview/${selectedPreview.src}`}
                        alt={selectedPreview.title}
                        className="w-full h-auto rounded-xl object-contain max-h-[70vh]"
                        loading="lazy"
                    />
                </div>

                {/* Content */}
                <div className="relative z-10">
                    <h3 className="text-2xl md:text-3xl font-bold mb-3 bg-gradient-to-r from-purple-400 via-blue-400 to-purple-400 bg-clip-text text-transparent">
                        {selectedPreview.title}
                    </h3>
                    <p className="text-gray-300 text-base md:text-lg leading-relaxed">
                        {selectedPreview.desc}
                    </p>
                </div>
            </motion.div>
        </motion.div>
    </AnimatePresence>
);

const PreviewSection = () => {
    const [selectedPreview, setSelectedPreview] = useState(null);

    const previewItems = useMemo(() => [
        { src: "user detailed dashboard.png", title: "User Dashboard", desc: "A personalized dashboard displaying all user stats with real-time analytics and performance insights.", category: "Dashboard" },
        { src: "verify-platform-usernames-modal.png", title: "Verify Platform Usernames", desc: "Ensure your coding platform usernames are up-to-date for accurate stats and seamless integration.", category: "Authentication" },
        { src: "room-leaderboard-leetcode.png", title: "Room Leaderboard - Leetcode", desc: "View Leetcode stats and rankings within your room with detailed performance metrics.", category: "Leaderboard" },
        { src: "room-leaderboard-codeforces.png", title: "Room Leaderboard - Codeforces", desc: "View Codeforces stats and rankings within your room with comprehensive analysis.", category: "Leaderboard" },
        { src: "detailed analysis.png", title: "Detailed Analysis", desc: "Get in-depth performance analytics with advanced visualization and trend analysis.", category: "Analytics" },
        { src: "active-heatmap.png", title: "Active Heatmap", desc: "Visualize your coding activity across platforms with an interactive and intuitive heatmap.", category: "Analytics" },
        { src: "room.png", title: "Room Management", desc: "Create and manage coding rooms efficiently with advanced collaboration tools.", category: "Management" },
        { src: "room chat.png", title: "Real-Time Chat", desc: "Instantly communicate with room members through live chat messaging with emoji support.", category: "Communication" },
        { src: "room-settings.png", title: "Room Settings", desc: "Manage room details, members, and permissions with granular control options.", category: "Management" },
        { src: "room-management-modal.png", title: "Room Create and Join", desc: "Easily create or join rooms with a simple and intuitive modal interface.", category: "Management" },
        { src: "room-invite-link-modal.png", title: "Room Invite Link", desc: "Invite friends to your room with secure, shareable invite links and access controls.", category: "Communication" },
        { src: "setting.png", title: "Settings", desc: "Customize preferences, platforms, and notifications to match your coding workflow.", category: "Configuration" },
        { src: "help and faq.png", title: "Help & FAQ", desc: "Find answers to common questions with our comprehensive help center and documentation.", category: "Support" }
    ], []);

    const categories = useMemo(() => [...new Set(previewItems.map(item => item.category))], [previewItems]);

    const handlePreviewClick = useCallback((item) => {
        setSelectedPreview(item);
    }, []);

    const handleClosePreview = useCallback(() => {
        setSelectedPreview(null);
    }, []);

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.05,
                delayChildren: 0.1
            }
        }
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 20 },
        visible: {
            opacity: 1,
            y: 0,
            transition: {
                duration: 0.4,
                ease: "easeOut"
            }
        }
    };

    return (
        <section className="py-24 px-6 bg-gradient-to-b from-[#141B3F] to-[#0A0F23] relative">
            {/* Simplified background effects */}
            <div className="absolute inset-0 overflow-hidden">
                <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-600/8 rounded-full blur-3xl" />
                <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-600/8 rounded-full blur-3xl" />
            </div>

            <motion.div
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, margin: "-50px" }}
                variants={containerVariants}
                className="container mx-auto text-center relative z-10"
            >
                {/* Header */}
                <motion.div variants={itemVariants}>
                    <h2 className="text-4xl md:text-6xl font-bold mb-6 tracking-tight">
                        <span className="bg-gradient-to-r from-purple-400 via-blue-400 to-purple-400 bg-clip-text text-transparent">
                            Product
                        </span>{" "}
                        <span className="text-white">Showcase</span>
                    </h2>
                    <p className="text-center text-gray-400 mb-8 max-w-2xl mx-auto">
                        Explore how CForge helps you track coding progress, compete with peers, and grow together — all from a powerful, intuitive leaderboard.
                    </p>

                    <div className="w-24 h-1 bg-gradient-to-r from-purple-500 to-blue-500 mx-auto mb-8 rounded-full" />
                </motion.div>

                {/* Category pills */}
                <motion.div variants={itemVariants} className="flex flex-wrap justify-center gap-3 mb-12">
                    {categories.map((category) => (
                        <div
                            key={category}
                            className="px-4 py-2 bg-gradient-to-r from-purple-600/20 to-blue-600/20 rounded-full text-sm font-medium text-purple-300 border border-purple-500/30"
                        >
                            {category}
                        </div>
                    ))}
                </motion.div>

                {/* Grid */}
                <motion.div
                    variants={containerVariants}
                    className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8"
                >
                    {previewItems.map((item, index) => (
                        <motion.div
                            key={index}
                            variants={itemVariants}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            className="group relative bg-gradient-to-br from-[#1a1f3a]/80 to-[#0f1427]/80 rounded-2xl border border-purple-500/20 hover:border-purple-400/40 overflow-hidden cursor-pointer transition-all duration-200 shadow-lg hover:shadow-xl will-change-transform"
                            onClick={() => handlePreviewClick(item)}
                        >
                            {/* Category badge */}
                            <div className="absolute top-3 right-3 z-10 px-2 py-1 bg-purple-600/80 rounded-full text-xs font-medium text-white">
                                {item.category}
                            </div>

                            {/* Image container */}
                            <div className="relative overflow-hidden rounded-t-2xl">
                                <img
                                    src={`/preview/${item.src}`}
                                    alt={item.title}
                                    className="w-full h-48 object-cover transition-transform duration-300 group-hover:scale-105"
                                    loading="lazy"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                            </div>

                            {/* Content */}
                            <div className="p-6 relative z-10">
                                <h3 className="text-lg font-bold mb-2 text-white group-hover:text-purple-300 transition-colors duration-200">
                                    {item.title}
                                </h3>
                                <p className="text-gray-400 text-sm leading-relaxed line-clamp-3">
                                    {item.desc}
                                </p>
                            </div>
                        </motion.div>
                    ))}
                </motion.div>
            </motion.div>

            {/* Popup */}
            {selectedPreview && (
                <PreviewPopup
                    selectedPreview={selectedPreview}
                    onClose={handleClosePreview}
                />
            )}
        </section>
    );
};

export default PreviewSection;
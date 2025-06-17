import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Code, BadgeInfo, X, Menu } from 'lucide-react';
import { Link } from 'react-router-dom';

// Reusable Components
const Header = ({ isScrolled }) => {
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    const navItems = [
        { href: "#features", label: "Features", type: "anchor" },
        { href: "#preview", label: "Preview", type: "anchor" },
        { href: "#docs", label: "Documentation", type: "anchor" },
        { href: "#about", label: "About", type: "anchor" }
    ];

    return (
        <motion.header
            initial={{ y: -100 }}
            animate={{ y: 0 }}
            className={`fixed top-0 w-full z-50 transition-all duration-500 ${isScrolled
                ? 'bg-[#0A0F23]/95 backdrop-blur-xl shadow-2xl shadow-purple-900/20 border-b border-purple-900/20'
                : 'bg-transparent'
                }`}
        >
            <div className="container mx-auto px-6 py-4">
                <div className="flex items-center justify-between">
                    <motion.div
                        className="flex items-center gap-3"
                        whileHover={{ scale: 1.05 }}
                    >
                        <div className="relative h-8 w-8">
                            <img
                                src="/logo.png"
                                alt="CForge Icon"
                                className="h-8 w-8 rounded-full"
                            />
                            <motion.div
                                className="absolute inset-0 bg-purple-400/20 rounded-full blur-xl"
                                animate={{ scale: [1, 1.2, 1] }}
                                transition={{ duration: 2, repeat: Infinity }}
                            />
                        </div>
                        <Link
                            to="/"
                            className="text-2xl font-extrabold tracking-tight bg-gradient-to-r from-purple-400 via-blue-400 to-cyan-400 bg-clip-text text-transparent"
                        >
                            CForge
                        </Link>
                    </motion.div>
                    {/* Desktop Navigation */}
                    <nav className="hidden md:flex items-center gap-8">
                        {navItems.map((item, index) => (
                            <motion.div
                                key={item.href}
                                initial={{ opacity: 0, y: -20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.1 }}
                            >
                                {item.type === "route" ? (
                                    <Link
                                        to={item.href}
                                        className="text-lg font-medium text-gray-300 hover:text-purple-400 transition-colors duration-300 relative group"
                                    >
                                        {item.label}
                                    </Link>
                                ) : (
                                    <a
                                        href={item.href}
                                        className="text-lg font-medium text-gray-300 hover:text-purple-400 transition-colors duration-300 relative group"
                                    >
                                        {item.label}
                                    </a>
                                )}
                            </motion.div>
                        ))}
                    </nav>

                    {/* CTA Buttons */}
                    <div className="hidden md:flex items-center gap-4">
                        <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            className="px-6 py-2 text-purple-400 border border-purple-400/50 rounded-full hover:bg-purple-400/10 transition-all duration-300"
                            onClick={() => window.location.href = '/login'}
                        >
                            Sign In
                        </motion.button>
                        <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            className="px-6 py-2 bg-gradient-to-r from-purple-600 to-blue-600 rounded-full text-white font-medium shadow-lg shadow-purple-500/25 hover:shadow-purple-500/40 transition-all duration-300"
                            onClick={() => window.location.href = '/signup'}
                        >
                            Get Started
                        </motion.button>
                    </div>

                    {/* Mobile Menu Button */}
                    <button
                        className="md:hidden text-white"
                        onClick={() => setIsMenuOpen(!isMenuOpen)}
                    >
                        {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
                    </button>
                </div>

                {/* Mobile Menu */}
                <AnimatePresence>
                    {isMenuOpen && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            exit={{ opacity: 0, height: 0 }}
                            className="md:hidden mt-4 pb-4 border-t border-purple-900/20"
                        >
                            {navItems.map((item, index) => (
                                <motion.div
                                    key={item.href}
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: index * 0.1 }}
                                >
                                    {item.type === "route" ? (
                                        <Link
                                            to={item.href}
                                            className="block py-3 text-lg text-gray-300 hover:text-purple-400 transition-colors"
                                            onClick={() => setIsMenuOpen(false)}
                                        >
                                            {item.label}
                                        </Link>
                                    ) : (
                                        <a
                                            href={item.href}
                                            className="block py-3 text-lg text-gray-300 hover:text-purple-400 transition-colors"
                                            onClick={() => setIsMenuOpen(false)}
                                        >
                                            {item.label}
                                        </a>
                                    )}
                                </motion.div>
                            ))}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </motion.header>
    );
};

const PreviewCard = ({ item, onHover, onLeave }) => (
    <motion.div
        whileHover={{ scale: 1.05 }}
        className="rounded-lg overflow-hidden shadow-lg border border-purple-900/30 bg-[#141B3F]/80 p-4 text-center hover:border-purple-500/50 transition-all duration-300 cursor-pointer shadow-lg shadow-purple-900/20"
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
    </motion.div>
);

const DeveloperResources = () => (
    <section id="docs" className="py-24 px-6 bg-gradient-to-b from-[#141B3F] to-[#0A0F23]">
        <div className="container mx-auto text-center">
            <h2 className="text-4xl md:text-5xl font-extrabold mb-12 tracking-tight bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
                Developer Resources
            </h2>
            <p className="text-xl text-gray-300 mb-12 max-w-2xl mx-auto font-light tracking-wide">
                Explore our documentation.
            </p>
            <div className="flex justify-center gap-6">
                <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                    className="px-8 py-3 text-lg font-medium rounded-full bg-transparent border-2 border-purple-500 text-purple-400 hover:bg-purple-500/20 transition-all duration-300"
                    onClick={() => window.open('https://github.com/4xush/CForge/blob/master/README.md', '_blank')}
                >
                    Read Developer Docs
                </motion.button>
            </div>
        </div>
    </section>
);

const About = () => (
    <section id="about" className="py-24 px-6 bg-gradient-to-b from-[#121831] to-[#141B3F]">
        <div className="container mx-auto">
            <motion.div
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8 }}
                viewport={{ once: true }}
                className="text-center mb-16"
            >
                <h2 className="text-4xl md:text-5xl font-extrabold mb-6 tracking-tight bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
                    About CForge
                </h2>
                <p className="text-lg text-gray-300 max-w-3xl mx-auto font-light tracking-wide">
                    Bringing visibility to your coding journey and fostering community-driven growth
                </p>
            </motion.div>

            <div className="grid md:grid-cols-2 gap-12 items-center max-w-6xl mx-auto">
                <motion.div
                    initial={{ opacity: 0, x: -50 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.8, delay: 0.2 }}
                    viewport={{ once: true }}
                    className="space-y-6"
                >
                    <div className="space-y-4 text-gray-300 text-lg leading-relaxed">
                        <p>
                            <span className="text-purple-400 font-semibold">CForge</span> was born out of a simple observation — many students are actively building projects, solving problems on platforms like LeetCode, GitHub, or Codeforces, yet their efforts often go unnoticed by peers.
                        </p>
                        <p>
                            We created a collaborative space where developers can come together, create rooms, track their progress, and stay aware of each other's journeys — no matter where they are in their coding path.
                        </p>
                        <p>
                            Whether you're preparing for interviews, grinding contests, or just starting out, CForge helps bring visibility to your efforts and transforms scattered progress into shared momentum.
                        </p>
                    </div>

                    <motion.div
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className="pt-4"
                    >
                        <Link
                            to="/about"
                            className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 rounded-full text-white font-medium shadow-lg shadow-purple-500/25 hover:shadow-purple-500/40 transition-all duration-300"
                        >
                            <BadgeInfo className="h-4 w-4" />
                            Learn More About CForge
                        </Link>
                    </motion.div>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, x: 50 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.8, delay: 0.4 }}
                    viewport={{ once: true }}
                    className="relative"
                >
                    <div className="bg-gradient-to-br from-purple-900/20 to-blue-900/20 backdrop-blur-sm rounded-2xl p-8 border border-purple-500/20">
                        <div className="space-y-6">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full flex items-center justify-center">
                                    <Code className="h-6 w-6 text-white" />
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold text-purple-300">Unified Progress Tracking</h3>
                                    <p className="text-gray-400">Monitor growth across all platforms</p>
                                </div>
                            </div>

                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full flex items-center justify-center">
                                    <BadgeInfo className="h-6 w-6 text-white" />
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold text-blue-300">Community Collaboration</h3>
                                    <p className="text-gray-400">Connect with like-minded developers</p>
                                </div>
                            </div>

                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-gradient-to-r from-cyan-500 to-purple-500 rounded-full flex items-center justify-center">
                                    <Menu className="h-6 w-6 text-white" />
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold text-cyan-300">Current Standings</h3>
                                    <p className="text-gray-400">Leaderboards and statistics</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </motion.div>
            </div>
        </div>
    </section>
);

const Footer = () => (
    <footer className="bg-[#0A0F23]/90 backdrop-blur-md py-10 px-6 border-t border-purple-900/20">
        <div className="container mx-auto text-center text-gray-400 text-md">
            <p className="mt-4 text-sm">© 2024 CForge. All rights reserved.</p>
        </div>
    </footer>
);

export {
    Header,
    PreviewCard,
    DeveloperResources,
    About,
    Footer
}
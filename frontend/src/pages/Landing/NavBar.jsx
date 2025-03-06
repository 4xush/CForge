import React from 'react';
import { motion } from 'framer-motion';
import { Code, Github, Twitter } from 'lucide-react';

// Reusable Components
const Header = () => (
    <header className={`fixed top-0 w-full z-50 transition-all duration-500 bg-[#0A0F23]/90 backdrop-blur-md shadow-2xl shadow-purple-900/20 px-6 py-4`}>
        <div className="container mx-auto flex items-center justify-between">
            <div className="flex items-center gap-3">
                <Code className="h-10 w-10 text-purple-400 animate-pulse" />
                <span className="text-2xl font-extrabold tracking-tight bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
                    CForge
                </span>
            </div>
            <nav className="hidden md:flex items-center gap-8">
                <a href="#feature" className="text-lg font-medium hover:text-purple-400 transition-colors duration-300">Feature</a>
                <a href="#preview" className="text-lg font-medium hover:text-purple-400 transition-colors duration-300">Preview</a>
                <a href="#api" className="text-lg font-medium hover:text-purple-400 transition-colors duration-300">API</a>
            </nav>
        </div>
    </header>
);

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
    <section id="api" className="py-24 px-6 bg-gradient-to-b from-[#141B3F] to-[#0A0F23]">
        <div className="container mx-auto text-center">
            <h2 className="text-4xl md:text-5xl font-extrabold mb-12 tracking-tight bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
                Developer Resources
            </h2>
            <p className="text-xl text-gray-300 mb-12 max-w-2xl mx-auto font-light tracking-wide">
                Explore our API and documentation to build with CForge.
            </p>
            <div className="flex justify-center gap-6">
                <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                    className="px-8 py-3 text-lg font-medium rounded-full bg-transparent border-2 border-purple-500 text-purple-400 hover:bg-purple-500/20 transition-all duration-300"
                    onClick={() => window.open('https://github.com/4xush/CForge', '_blank')}
                >
                    Read Developer Docs
                </motion.button>
            </div>
        </div>
    </section>
);

const Footer = () => (
    <footer className="bg-[#0A0F23]/90 backdrop-blur-md py-10 px-6 border-t border-purple-900/20">
        <div className="container mx-auto text-center text-gray-400 text-lg">
            <div className="flex justify-center gap-6">
                <a href="https://github.com/cforge" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-purple-400 hover:scale-125 transition-all duration-300">
                    <Github className="h-6 w-6" />
                </a>
                <a href="https://twitter.com/cforgeai" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-purple-400 hover:scale-125 transition-all duration-300">
                    <Twitter className="h-6 w-6" />
                </a>
            </div>
            <p className="mt-4">© 2024 CForge. All rights reserved.</p>
        </div>
    </footer>
);

export {
    Header,
    PreviewCard,
    DeveloperResources,
    Footer
}
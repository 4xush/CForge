import React from 'react';
import { motion } from 'framer-motion';

const BrandingSection = () => {
    const codeSnippet = [
        { id: 1, text: 'function solve() {' },
        { id: 2, text: '  let solution = [];' },
        { id: 3, text: '  // Your code here' },
        { id: 4, text: '  return solution;' },
        { id: 5, text: '}' },
    ];

    return (
        <div className="w-full md:w-1/2 flex flex-col justify-center items-center p-8 bg-gray-900">
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-4 text-center" style={{ fontFamily: "'Press Start 2P', cursive" }}>
                Cforge
            </h1>
            <p className="text-xl md:text-2xl font-bold text-center text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-600 mb-8">
                Connect. Code. Excel.
            </p>
            <div className="w-48 bg-gray-800 p-4 rounded-lg shadow-lg overflow-hidden">
                {codeSnippet.map((line, index) => (
                    <motion.div
                        key={line.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.5, delay: index * 0.1 }}
                        className="font-mono text-sm text-green-400"
                    >
                        {line.text}
                    </motion.div>
                ))}
            </div>
        </div>
    );
};

export default BrandingSection;
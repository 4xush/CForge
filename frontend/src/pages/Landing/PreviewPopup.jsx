import React from 'react';
import { motion } from 'framer-motion';

const PreviewPopup = ({ selectedPreview, onClose }) => (
    <motion.div
        initial={{ opacity: 0, scale: 0 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0 }}
        transition={{ duration: 0.5, ease: "easeInOut" }} // Slow, smooth transition
        className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50"
    >
        <motion.div
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0.8 }}
            transition={{ duration: 0.5, ease: "easeInOut" }} // Slow, smooth transition
            className="bg-[#141B3F]/80 p-8 rounded-xl border border-purple-500/50 shadow-2xl shadow-purple-900/20 max-w-4xl w-full mx-4 relative"
        >
            <button
                onClick={onClose}
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
);
export default PreviewPopup;
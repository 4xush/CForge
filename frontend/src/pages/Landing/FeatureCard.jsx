import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
const FeatureCard = ({ title, date, description, icon: Icon }) => (
    <motion.div
        whileHover={{ scale: 1.05, y: -5 }}
        className="bg-[#141B3F]/80 p-6 rounded-xl border border-purple-900/30 hover:border-purple-500/50 transition-all duration-300 shadow-lg shadow-purple-900/20"
    >
        {Icon && <Icon className="text-purple-400 h-10 w-10 mb-4" />}
        <h3 className="text-xl font-bold mb-2 text-purple-300">{title}</h3>
        <p className="text-sm text-gray-400 mb-2">{date}</p>
        <p className="text-gray-300 mb-4">{description}</p>
        <motion.button
            whileHover={{ scale: 1.1 }}
            className="text-purple-400 hover:text-purple-500 transition-colors duration-300"
        >
            Read More <ArrowRight className="inline h-4 w-4" />
        </motion.button>
    </motion.div>
);
export default FeatureCard;
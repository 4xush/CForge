// src/components/AuthLayout.jsx

import { motion } from 'framer-motion';
import PropTypes from 'prop-types';
import { useEffect, useState, useRef } from 'react'; // Added useRef
import './AuthLayout.css'; // Import the CSS file

// ModernParticleBackground (as provided in the prompt)
const ModernParticleBackground = () => {
    return (
        <div className="absolute inset-0 overflow-hidden">
            {/* Animated gradient background */}
            <div className="absolute inset-0 bg-gradient-to-br from-[#0A0F23] via-[#1a1f3a] to-[#0f1427]" />

            {/* Floating orbs */}
            <div className="absolute top-20 left-20 w-72 h-72 bg-purple-500/10 rounded-full blur-3xl animate-pulse" />
            <div className="absolute bottom-20 right-20 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-pulse delay-1000" />
            <div className="absolute top-1/2 left-1/2 w-64 h-64 bg-pink-500/5 rounded-full blur-3xl animate-pulse delay-500" />

            {/* Grid pattern overlay for the entire page background */}
            <div className="absolute inset-0 opacity-[0.02]">
                <svg width="100%" height="100%">
                    <defs>
                        <pattern id="pageGrid" width="40" height="40" patternUnits="userSpaceOnUse">
                            <path d="M 40 0 L 0 0 0 40" fill="none" stroke="white" strokeWidth="1" />
                        </pattern>
                    </defs>
                    <rect width="100%" height="100%" fill="url(#pageGrid)" />
                </svg>
            </div>

            {/* Animated dots for the entire page background */}
            <div className="absolute inset-0">
                {[...Array(50)].map((_, i) => (
                    <motion.div
                        key={i}
                        className="absolute w-1 h-1 bg-purple-400/20 rounded-full"
                        style={{
                            left: `${Math.random() * 100}%`,
                            top: `${Math.random() * 100}%`,
                        }}
                        animate={{
                            opacity: [0, 1, 0],
                            scale: [0, 1, 0],
                        }}
                        transition={{
                            duration: 3 + Math.random() * 2,
                            repeat: Infinity,
                            delay: Math.random() * 2,
                        }}
                    />
                ))}
            </div>
        </div>
    );
};


// Blinking cursor component for the terminal
const BlinkingCursor = () => (
    <motion.span
        animate={{ opacity: [0, 1, 0] }}
        transition={{ duration: 0.6, repeat: Infinity, ease: "linear" }}
        className="inline-block w-[0.5em] h-[1.1em] bg-green-400/90 ml-[2px] -mb-[0.15em] align-middle"
    />
);

const TerminalBrandingPanel = () => {
    const terminalBodyRef = useRef(null); // Ref for the terminal body

    const initialLines = [
        "> CFORGE TERMINAL v1.0.2",
        "> INITIALIZING BOOT SEQUENCE...",
        "[SYS] Loading core modules... [DONE]",
        "[NET] Attempting connection to CForge Network @ 10.0.1.5...",
        "[OK] Network connection established. Latency: 12ms.",
        "[AUTH] Authenticating system modules (checksum: a1b2c3d4)...",
        "[OK] All system modules authenticated successfully.",
        "> Welcome to CForge Cloud Development Environment!",
        "> ",
        "> Executing startup script: /opt/cforge/initialize_features.sh",
        "[INFO] Feature Module: An all-in-one Analytical Dashboard Loaded  [LOADED]",
        "[INFO] Feature Module: Cross-Platform Progress Synchronization [LOADED]",
        "[INFO] Feature Module: Websocket-Powered Real-Time Chat Engine[LOADED]",
        "[INFO] Feature Module: Community Challenge & Leaderboard Hub [LOADED]",
        "[OK] All features initialized. Services are now online.",
        "> SYSTEM READY. AWAITING INPUT...",
    ];

    const [typedLines, setTypedLines] = useState([]);
    const [currentLineIndex, setCurrentLineIndex] = useState(0);
    const [currentTypedChars, setCurrentTypedChars] = useState('');
    const [isInitialTypingComplete, setIsInitialTypingComplete] = useState(false);

    const TYPING_SPEED = 15;
    const SHORT_LINE_DELAY = 50;
    const LONG_LINE_DELAY = 150;

    const scrollToBottom = () => {
        if (terminalBodyRef.current) {
            requestAnimationFrame(() => {
                terminalBodyRef.current.scrollTop = terminalBodyRef.current.scrollHeight;
            });
        }
    };

    // Effect for typing initial boot sequence
    useEffect(() => {
        if (currentLineIndex >= initialLines.length) {
            setIsInitialTypingComplete(true);
            scrollToBottom();
            return;
        }

        const lineToType = initialLines[currentLineIndex];
        let charIndex = 0;
        setCurrentTypedChars('');

        const intervalId = setInterval(() => {
            if (charIndex < lineToType.length) {
                setCurrentTypedChars(prev => prev + lineToType.charAt(charIndex));
                charIndex++;
            } else {
                clearInterval(intervalId);
                setTypedLines(prev => [...prev, lineToType]);
                scrollToBottom();

                const delay = lineToType.length < 30 ? SHORT_LINE_DELAY : LONG_LINE_DELAY;
                setTimeout(() => {
                    setCurrentLineIndex(prev => prev + 1);
                }, delay);
            }
        }, TYPING_SPEED);

        return () => clearInterval(intervalId);
    }, [currentLineIndex]); // Removed initialLines, TYPING_SPEED, etc. as they don't change


    // Random coding animation lines
    const [codeAnimationLines, setCodeAnimationLines] = useState([]);
    const codeSnippets = [
        "compiling: /src/modules/collaboration_engine.ts...",
        "running_tests: data_pipeline_integrity_suite --verbose",
        "deploying_update: user_activity_logger/prod-us-west-2 (version 3.1.4)",
        "db_query: 'SELECT user_id, last_activity FROM user_sessions WHERE active=true'",
        "git commit -am 'Refactor: Optimized real-time synchronization logic'",
        "docker build -f Dockerfile.prod -t cforge/app-server:latest .",
        "webpack --mode production --config webpack.config.prod.js",
        "// TODO: Implement OAuth2 token refresh mechanism before v1.1 release",
        "bash /scripts/system_health_check.sh --full",
        "tail -n 50 -f /var/log/cforge_application.log",
        "Processing batch job: image_recognition_task_#892371...",
        "Updating CDN cache for static assets...",
    ];

    // Effect for random coding animation after initial sequence
    useEffect(() => {
        if (!isInitialTypingComplete) return;

        const codeAnimationInterval = setInterval(() => {
            const randomSnippet = codeSnippets[Math.floor(Math.random() * codeSnippets.length)];
            const prefixOptions = ["[LOG]", "kernel:", "debug:", "proc:", "event:"];
            const prefix = `${prefixOptions[Math.floor(Math.random() * prefixOptions.length)]} `;

            setCodeAnimationLines(prev => {
                const newLine = `${prefix}${randomSnippet}`;
                const nextLines = [...prev, newLine].slice(-6); // Keep last 6 lines
                scrollToBottom();
                return nextLines;
            });
        }, 2000);

        return () => clearInterval(codeAnimationInterval);
    }, [isInitialTypingComplete]); // Removed codeSnippets as it doesn't change

    return (
        <div className="w-full max-w-lg h-[clamp(500px,85vh,700px)] bg-[#0D1117] rounded-md shadow-xl flex flex-col overflow-hidden border border-gray-700/60 font-mono text-[12px] text-green-400/90">
            {/* Terminal Header */}
            <div className="bg-gray-800/70 p-[5px] px-2.5 flex items-center border-b border-gray-700/60 select-none">
                <div className="flex space-x-[6px] mr-2.5">
                    <span className="w-[10px] h-[10px] bg-red-500 rounded-full cursor-pointer hover:bg-red-400 transition-colors duration-150"></span>
                    <span className="w-[10px] h-[10px] bg-yellow-500 rounded-full cursor-pointer hover:bg-yellow-400 transition-colors duration-150"></span>
                    <span className="w-[10px] h-[10px] bg-green-500 rounded-full cursor-pointer hover:bg-green-400 transition-colors duration-150"></span>
                </div>
                <div className="flex-grow text-center text-[10px] text-gray-400/80 truncate">
                    CForge Secure Terminal -- user@cforge-dev -- /bin/zsh
                </div>
                <div className="w-12"></div> {/* Spacer for balance */}
            </div>

            {/* Terminal Body */}
            <div
                ref={terminalBodyRef}
                className="flex-grow p-2.5 pt-2 overflow-y-auto terminal-bg-texture scrollbar-thin"
            >
                {typedLines.map((line, index) => (
                    <div key={`typed-${index}`} className="whitespace-pre-wrap break-words leading-tight">{line}</div>
                ))}

                {!isInitialTypingComplete && currentLineIndex < initialLines.length && (
                    <div className="whitespace-pre-wrap break-words leading-tight">
                        {currentTypedChars}
                        <BlinkingCursor />
                    </div>
                )}

                {isInitialTypingComplete && (
                    <div className="mt-1">
                        {codeAnimationLines.map((line, index) => (
                            <div key={`anim-${index}`} className="whitespace-pre-wrap break-words leading-tight text-green-400/70">{line}</div>
                        ))}
                        <div className="whitespace-pre-wrap break-words leading-tight">
                            <span className="text-blue-400/80">user@cforge-dev</span>
                            <span className="text-gray-500/80">:</span>
                            <span className="text-purple-400/80">~</span>
                            <span className="text-gray-500/80">$</span>
                            <BlinkingCursor />
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};


const AuthLayout = ({ children }) => {
    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                duration: 0.6,
                staggerChildren: 0.1
            }
        }
    };

    const leftPanelVariants = {
        hidden: { opacity: 0, x: -60, scale: 0.95 },
        visible: {
            opacity: 1,
            x: 0,
            scale: 1,
            transition: { duration: 0.7, ease: [0.16, 1, 0.3, 1] }
        }
    };

    const rightPanelVariants = {
        hidden: { opacity: 0, x: 60, scale: 0.95 },
        visible: {
            opacity: 1,
            x: 0,
            scale: 1,
            transition: { duration: 0.7, ease: [0.16, 1, 0.3, 1], delay: 0.1 }
        }
    };

    return (
        <motion.div
            initial="hidden"
            animate="visible"
            variants={containerVariants}
            className="min-h-screen flex items-stretch bg-[#0A0F23] relative overflow-hidden"
        >
            <ModernParticleBackground />

            {/* Left Panel - Terminal Branding */}
            <motion.div
                variants={leftPanelVariants}
                className="hidden lg:flex w-1/2 relative z-10 flex-col justify-center items-center p-4 md:p-6"
            >
                <TerminalBrandingPanel />
            </motion.div>

            {/* Right Panel - Form */}
            <motion.div
                variants={rightPanelVariants}
                className="w-full lg:w-1/2 flex items-center justify-center p-3 sm:p-6 md:p-8 relative z-10"
            >
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.3, ease: "easeOut" }}
                    className="max-w-md w-full space-y-6 relative"
                >
                    <div className="bg-white/5 backdrop-blur-lg border border-white/10 p-6 md:p-7 rounded-2xl shadow-2xl relative overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 via-transparent to-blue-500/5 pointer-events-none" />
                        <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-purple-500/80 to-blue-500/80 pointer-events-none" />
                        <div className="relative z-10">
                            {children}
                        </div>
                    </div>
                </motion.div>
            </motion.div>
        </motion.div>
    );
};

AuthLayout.propTypes = {
    children: PropTypes.node.isRequired
};

export default AuthLayout;
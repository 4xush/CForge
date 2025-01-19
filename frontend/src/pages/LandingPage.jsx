import React, { useState, useEffect } from 'react';
import { Code, Trophy, BookOpen, Target, ArrowDown, Github, Twitter } from 'lucide-react';
import ParticleBackground from './element/ParticleBackground';

const CforgeLanding = () => {
    const [scrollPosition, setScrollPosition] = useState(0);

    useEffect(() => {
        const handleScroll = () => {
            setScrollPosition(window.scrollY);
        };
        window.addEventListener('scroll', handleScroll);

        document.body.style.backgroundColor = 'rgb(17, 24, 39)';
        return () => {
            window.removeEventListener('scroll', handleScroll);
        };
    }, []);

    const scrollToFeatures = () => {
        const featuresSection = document.getElementById('features');
        featuresSection?.scrollIntoView({ behavior: 'smooth' });
    };

    return (
        <div className="relative min-h-screen bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900 text-white overflow-hidden">
            <ParticleBackground />
            <div className="relative z-10">
                <header className={`fixed top-0 w-full z-50 transition-all duration-300 ${scrollPosition > 50 ? 'bg-gray-900/95 backdrop-blur-sm shadow-lg' : ''
                    }`}>
                    <div className="container mx-auto px-6 py-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                                <Code className="h-8 w-8 text-purple-500" />
                                <span className="text-2xl font-bold">CForge</span>
                            </div>
                            <nav className="hidden md:flex items-center space-x-8">
                                <a href="#features" className="hover:text-purple-400 transition-colors">Features</a>
                                <a href="#community" className="hover:text-purple-400 transition-colors">Community</a>
                                <button
                                    onClick={() => window.location.replace('/signup')}
                                    className="bg-purple-600 hover:bg-purple-700 px-4 py-2 rounded-lg transition-colors"
                                >
                                    Get Started
                                </button>
                            </nav>
                        </div>
                    </div>
                </header>

                <section className="pt-32 pb-20 px-6">
                    <div className="container mx-auto text-center">
                        <h1 className="text-5xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-purple-400 to-pink-500 text-transparent bg-clip-text">
                            Level Up Your Coding Game
                        </h1>
                        <p className="text-xl md:text-2xl text-gray-300 mb-12 max-w-2xl mx-auto">
                            Join the ultimate competitive programming platform where LeetCode rankings meet real-time challenges.
                        </p>
                        <button
                            onClick={scrollToFeatures}
                            className="animate-bounce bg-transparent p-2 rounded-full"
                        >
                            <ArrowDown className="h-8 w-8 text-gray-400" />
                        </button>
                    </div>
                </section>

                <section id="features" className="py-20 px-6 bg-gray-800/30 backdrop-blur-sm">
                    <div className="container mx-auto">
                        <h2 className="text-4xl font-bold text-center mb-16">Why Choose CForge?</h2>
                        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                            <FeatureCard
                                icon={<Trophy className="h-8 w-8 text-yellow-500" />}
                                title="LeetCode Integration"
                                description="Compete with real-time LeetCode rankings and track your progress against peers."
                            />
                            <FeatureCard
                                icon={<Target className="h-8 w-8 text-green-500" />}
                                title="Focused Learning"
                                description="Challenge yourself with topic-specific competitions to improve targeted skills."
                            />
                            <FeatureCard
                                icon={<BookOpen className="h-8 w-8 text-purple-500" />}
                                title="Comprehensive Platform"
                                description="Access challenges from multiple platforms including Codeforces integration."
                            />
                        </div>
                    </div>
                </section>

                <section id="community" className="py-20 px-6">
                    <div className="container mx-auto text-center">
                        <h2 className="text-4xl font-bold mb-8">Join Our Community</h2>
                        <p className="text-xl text-gray-300 mb-12 max-w-2xl mx-auto">
                            Connect with fellow coders, share your achievements, and stay updated on the latest challenges.
                        </p>
                        <div className="flex justify-center space-x-6">
                            <a href="https://github.com/4xush" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-white transition-colors">
                                <Github className="h-8 w-8" />
                            </a>
                            <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-white transition-colors">
                                <Twitter className="h-8 w-8" />
                            </a>
                        </div>
                    </div>
                </section>

                <footer className="bg-gray-900/80 backdrop-blur-sm py-8 px-6">
                    <div className="container mx-auto text-center text-gray-400">
                        <p>&copy; 2024 CForge. All rights reserved.</p>
                    </div>
                </footer>
            </div>
        </div>
    );
};

const FeatureCard = ({ icon, title, description }) => (
    <div className="bg-gray-800/50 backdrop-blur-sm p-6 rounded-lg transform transition-all hover:scale-105 hover:shadow-xl border border-gray-700">
        <div className="mb-4">{icon}</div>
        <h3 className="text-xl font-bold mb-2">{title}</h3>CForge
        <p className="text-gray-400">{description}</p>
    </div>
);

export default CforgeLanding;


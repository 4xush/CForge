import React, { useState } from "react";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Users, BarChart, ShieldCheck, MessageCircle, Code, Globe } from "lucide-react";
const features = [
    {
        title: "Room-Based Leaderboards",
        description: "Create or join rooms to compete with friends based on LeetCode, Codeforces, and GitHub stats.",
        details: "Rooms allow users to form coding groups and compete in a structured way. Each room has its own leaderboard, where members are ranked based on coding activity, contests, and problem-solving performance.",
        icon: Users,
    },
    {
        title: "Advanced Sorting & Filtering",
        description: "Sort leaderboards by total problems solved, contest rating, difficulty-wise stats, and more.",
        details: "Leaderboards can be filtered based on total problems solved, difficulty level (easy, medium, hard), and contest ratings, making it easier to analyze performance trends.",
        icon: BarChart,
    },
    {
        title: "Admin Controls & Access Management",
        description: "Admins can approve join requests, promote members to admins, and manage rooms.",
        details: "Room creators have full control over managing members. Admins can accept or reject join requests, promote other users to admin, and remove inactive members.",
        icon: ShieldCheck,
    },
    {
        title: "Room Chat",
        description: "Each room has a public chat for discussions, strategy sharing, and problem-solving.",
        details: "Users can engage in coding discussions, share problem-solving strategies, and collaborate with fellow room members through the built-in chat feature.",
        icon: MessageCircle,
    },
    {
        title: "Multi-Platform Profile Integration",
        description: "Track and showcase stats from LeetCode, Codeforces, and GitHub with updates.",
        details: "Users can link their LeetCode, Codeforces, and GitHub profiles to get real-time updates on their contest ratings, solved problems, and repository contributions.",
        icon: Globe,
    },
    {
        title: "Google Authentication & Profile Customization",
        description: "Quick sign-up with Google, customizable profile picture, and social links.",
        details: "Users can easily sign up using Google authentication and personalize their profiles with profile pictures, LinkedIn, and Twitter links.",
        icon: Code,
    },
];

const FeatureCard = ({ title, description, icon: Icon, onReadMore }) => (
    <motion.div
        whileHover={{ scale: 1.05, y: -5 }}
        className="bg-[#141B3F]/80 p-6 rounded-xl border border-purple-900/30 hover:border-purple-500/50 transition-all duration-300 shadow-lg shadow-purple-900/20"
    >
        {Icon && <Icon className="text-purple-400 h-10 w-10 mb-4" />}
        <h3 className="text-xl font-bold mb-2 text-purple-300">{title}</h3>
        <p className="text-gray-300 mb-4">{description}</p>
        <motion.button
            whileHover={{ scale: 1.1 }}
            className="text-purple-400 hover:text-purple-500 transition-colors duration-300"
            onClick={onReadMore}
        >
            Read More <ArrowRight className="inline h-4 w-4" />
        </motion.button>
    </motion.div>
);

const FeaturesSection = () => {
    const [selectedFeature, setSelectedFeature] = useState(null);

    return (
        <div id="feature" className="container mx-auto py-16 px-4">
            <h2 className="text-4xl md:text-5xl font-extrabold text-center mb-16 tracking-tight bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
                Why Choose CForge?
            </h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                {features.map((feature, index) => (
                    <FeatureCard
                        key={index}
                        title={feature.title}
                        description={feature.description}
                        icon={feature.icon}
                        onReadMore={() => setSelectedFeature(feature)}
                    />
                ))}
            </div>

            {/* Modal for Feature Details */}
            {selectedFeature && (
                <Dialog open={selectedFeature !== null} onOpenChange={() => setSelectedFeature(null)}>
                    <DialogContent className="bg-[#1A1F42] border border-purple-900/40 shadow-xl rounded-lg">
                        <DialogHeader>
                            <DialogTitle className="text-purple-300 text-2xl flex items-center gap-2">
                                {selectedFeature.icon && <selectedFeature.icon className="h-6 w-6 text-purple-400" />}
                                {selectedFeature.title}
                            </DialogTitle>
                            <DialogDescription className="text-gray-300 mt-4">
                                {selectedFeature.details}
                            </DialogDescription>
                        </DialogHeader>
                    </DialogContent>
                </Dialog>
            )}
        </div>
    );
};

export default FeaturesSection;

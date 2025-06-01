import { useState } from "react";
import { motion } from "framer-motion";
import { ArrowRight, ExternalLink } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Users, BarChart, ShieldCheck, MessageCircle, Code, Globe } from "lucide-react";

const features = [
    {
        title: "Room-Based Leaderboards",
        description: "Create or join rooms to compete with friends based on LeetCode, Codeforces, and GitHub stats.",
        details: "Rooms allow users to form coding groups and compete in a structured way. Each room has its own leaderboard, where members are ranked based on coding activity, contests, and problem-solving performance. Track progress over time and see how you stack up against your peers.",
        icon: Users,
        benefits: ["Custom room creation", "Invite-only or public rooms", "Historical performance tracking"]
    },
    {
        title: "Advanced Sorting & Filtering",
        description: "Sort leaderboards by total problems solved, contest rating, difficulty-wise stats, and more.",
        details: "Leaderboards can be filtered based on total problems solved, difficulty level (easy, medium, hard), and contest ratings, making it easier to analyze performance trends. Get insights into your coding journey with detailed analytics and progress visualization.",
        icon: BarChart,
        benefits: ["Multi-criteria sorting", "Difficulty-based filtering", "Performance analytics", "Progress visualization"]
    },
    {
        title: "Admin Controls & Access Management",
        description: "Admins can approve join requests, promote members to admins, and manage rooms.",
        details: "Room creators have full control over managing members. Admins can accept or reject join requests, promote other users to admin, and remove inactive members. Maintain a healthy competitive environment with comprehensive moderation tools.",
        icon: ShieldCheck,
        benefits: ["Member approval system", "Role-based permissions", "Activity monitoring", "Flexible room settings"]
    },
    {
        title: "Real-Time Chat",
        description: "Instant messaging system for live discussions, strategy sharing, and real-time collaboration.",
        details: "Experience seamless real-time communication with room members. Share code snippets, discuss problem-solving strategies, and get instant responses through our live chat feature powered by WebSocket technology. Build connections while you code.",
        icon: MessageCircle,
        benefits: ["Instant messaging", "Code snippet sharing", "Strategy discussions", "WebSocket powered"]
    },
    {
        title: "Multi-Platform Profile Integration",
        description: "Track and showcase stats from LeetCode, Codeforces, and GitHub with updates.",
        details: "Users can link their LeetCode, Codeforces, and GitHub profiles to get updates on their contest ratings, solved problems, and repository contributions. One unified dashboard for all your coding achievements.",
        icon: Globe,
        benefits: ["LeetCode integration", "Codeforces sync", "GitHub stats", "Unified dashboard"]
    },
    {
        title: "Google Authentication & Profile Customization",
        description: "Quick sign-up with Google, customizable profile picture, and social links.",
        details: "Users can easily sign up using Google authentication and personalize their profiles with profile pictures, LinkedIn, and Twitter links. Express your coding personality and connect with the community.",
        icon: Code,
        benefits: ["One-click Google sign-in", "Profile customization", "Social media links", "Professional networking"]
    },
];

const FeatureCard = ({ title, description, icon: Icon, onReadMore }) => (
    <motion.div
        whileHover={{ scale: 1.02, y: -3 }}
        whileTap={{ scale: 0.98 }}
        className="bg-gradient-to-br from-[#141B3F]/90 to-[#1A1F42]/90 p-6 rounded-xl border border-purple-900/30 hover:border-purple-500/60 transition-all duration-300 shadow-lg shadow-purple-900/20 backdrop-blur-sm"
    >
        {Icon && (
            <div className="mb-4 p-3 bg-purple-500/10 rounded-lg w-fit">
                <Icon className="text-purple-400 h-8 w-8" />
            </div>
        )}
        <h3 className="text-xl font-bold mb-3 text-purple-300">{title}</h3>
        <p className="text-gray-300 mb-4 leading-relaxed">{description}</p>
        <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="inline-flex items-center gap-2 text-purple-400 hover:text-purple-300 transition-colors duration-300 font-medium"
            onClick={onReadMore}
        >
            Read More
            <ArrowRight className="h-4 w-4" />
        </motion.button>
    </motion.div>
);

const FeaturesSection = () => {
    const [selectedFeature, setSelectedFeature] = useState(null);

    return (
        <div id="feature" className="container mx-auto py-16 px-4">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
            >
                <h2 className="text-4xl md:text-5xl font-extrabold text-center mb-4 tracking-tight bg-gradient-to-r from-purple-400 via-blue-400 to-cyan-400 bg-clip-text text-transparent">
                    Why Choose CForge?
                </h2>
                <p className="text-center text-gray-400 mb-16 max-w-2xl mx-auto">
                    Discover the features of CForge that make competitions more engaging and effective
                </p>
            </motion.div>

            <motion.div
                className="grid md:grid-cols-2 lg:grid-cols-3 gap-8"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.8, delay: 0.2 }}
            >
                {features.map((feature, index) => (
                    <motion.div
                        key={index}
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: index * 0.1 }}
                    >
                        <FeatureCard
                            title={feature.title}
                            description={feature.description}
                            icon={feature.icon}
                            onReadMore={() => setSelectedFeature(feature)}
                        />
                    </motion.div>
                ))}
            </motion.div>

            {/* Enhanced Modal for Feature Details */}
            {selectedFeature && (
                <Dialog open={selectedFeature !== null} onOpenChange={() => setSelectedFeature(null)}>
                    <DialogContent className="max-w-2xl bg-gradient-to-br from-[#1A1F42] to-[#141B3F] border border-purple-500/30 shadow-2xl">
                        <DialogHeader>
                            <DialogTitle className="text-purple-300 text-2xl flex items-center gap-3">
                                {selectedFeature.icon && (
                                    <div>
                                        <div className="p-2 inline-block bg-purple-500/20 rounded-lg">
                                            <selectedFeature.icon className="h-6 w-6 text-purple-400" />
                                        </div>
                                    </div>
                                )}
                                {selectedFeature.title}
                            </DialogTitle>
                            <DialogDescription className="text-gray-300 mt-4 leading-relaxed text-base">
                                {selectedFeature.details}
                            </DialogDescription>
                        </DialogHeader>

                        {/* Feature Benefits */}
                        {selectedFeature.benefits && (
                            <div className="mt-6">
                                <h4 className="text-lg font-semibold text-purple-300 mb-3">Key Benefits:</h4>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                    {selectedFeature.benefits.map((benefit, index) => (
                                        <div key={index} className="flex items-center gap-2 text-gray-300">
                                            <div className="w-1.5 h-1.5 bg-purple-400 rounded-full flex-shrink-0"></div>
                                            <span className="text-sm">{benefit}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        <DialogFooter className="gap-3">
                            <motion.button
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                className="px-4 py-2 text-gray-400 hover:text-gray-300 transition-colors"
                                onClick={() => setSelectedFeature(null)}
                            >
                                Close
                            </motion.button>
                            <motion.button
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                className="px-6 py-2 bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white rounded-lg font-medium inline-flex items-center gap-2 transition-all duration-300"
                                onClick={() => window.open('/login', '_blank', 'noopener,noreferrer')}
                            >
                                Try Now
                                <ExternalLink className="h-4 w-4" />
                            </motion.button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            )}
        </div>
    );
};

export default FeaturesSection;
import { useState } from 'react';
import { ChevronDownIcon, MailIcon } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const HelpFAQ = () => {
    const [openQuestions, setOpenQuestions] = useState([]);

    const toggleQuestion = (index) => {
        setOpenQuestions(prev =>
            prev.includes(index)
                ? prev.filter(i => i !== index)
                : [...prev, index]
        );
    };

    const handleReportError = () => {
        const subject = encodeURIComponent('Error Report - CForge');
        const body = encodeURIComponent('Please describe the error you encountered:\n\n');
        window.location.href = `mailto:cforge.service@gmail.com?subject=${subject}&body=${body}`;
    };

    const faqData = [
        {
            question: 'How do I set up my coding platforms?',
            answer: `To set up your coding platforms:
            1. Go to Settings > Platforms
            2. Add your usernames for LeetCode, Codeforces, and GitHub
            3. Click "Update" for each platform to verify your username
            4. Your stats will be automatically fetched and updated
            5. You can refresh your stats anytime using the "Refresh Data" button on your dashboard`
        },
        {
            question: 'How do I create a room?',
            answer: `To create a room:
            1. Go to the dashboard and click on the "Rooms" button in the left sidebar
            2. Click on the "Create Room" button
            3. Enter a room name and description
            4. Choose room type (Public or Private)
            5. Set platform preferences (LeetCode, Codeforces, or both) (upcoming feature)
            6. As the room creator, you will automatically become the admin of the room
            7. You can customize room settings and invite members after creation`
        },
        {
            question: 'How do I join a room?',
            answer: `To join a room:
            1. For public rooms: (upcoming feature)
               - Go to the "Rooms" section
               - Browse available public rooms
               - Click "Join Room" on your preferred room
            2. For private rooms:
               - You need an invite link from the admin
               - Click the invite link to send a join request
               - Wait for admin approval
            3. After joining, you can access the room's leaderboard and chat features`
        },
        {
            question: 'How does the leaderboard work?',
            answer: `The leaderboard system:
            1. Platform Integration:
               - Supports both LeetCode and Codeforces
               - Each platform has its own leaderboard
               - Stats are updated every 2 days
            2. Ranking Criteria:
               - Total problems solved
               - Contest participation
               - Problem difficulty distribution
               - Rating (for Codeforces)
            3. Features:
               - Sort by different metrics
               - Filter by platform
               - View detailed stats for each member
               - Track progress over time`
        },
        {
            question: 'What are the room settings and permissions?',
            answer: `Room settings and permissions:
            1. Admin Privileges:
               - Manage room details (name, description)
               - Control room privacy settings
               - Handle join requests
               - Promote/demote members
               - Remove members
               - Configure platform preferences (upcoming feature)
            2. Member Features:
               - View leaderboard
               - Participate in chat
               - Update their own stats
               - Leave the room
            3. Room Types:
               - Public: Anyone can join
               - Private: Requires invite or approval`
        },
        {
            question: 'How do I manage my profile and platform stats?',
            answer: `Profile and stats management:
            1. Profile Settings:
               - Update personal information
               - Add social network links
               - Change profile picture
               - Manage platform usernames
            2. Stats Management:
               - Manual refresh option
               - View detailed activity heatmaps
               - Track progress across platforms
            3. Platform Integration:
               - Link multiple coding platforms
               - View consolidated stats
               - Compare performance across platforms`
        },
        {
            question: 'What are the chat features in rooms?',
            answer: `Room chat features:
            1. Real-time Communication: (work on progress)
               - Instant messaging
               - Message history
            2. Features:
               - Send and receive messages
               - Edit messages
            3. Usage:
               - Access via room's chat tab
               - Available to all room members
               - Persistent chat history`
        },
        {
            question: 'How do I handle room invites and notifications?',
            answer: `Room invites and notifications:
            1. Invite System:
               - Generate invite links (24-hour validity)
               - Share via email or direct link
            2. Notifications: (upcoming feature)
               - Join request alerts
               - New member notifications
               - Leaderboard updates
               - Chat messages
            3. Invite Management:
               - Accept/decline join requests
               - View pending invites
               - Resend expired invites`
        },
        {
            question: 'What are the platform-specific features?',
            answer: `Platform-specific features:
            1. LeetCode Integration:
               - Problem-solving stats
               - Contest participation
               - Difficulty distribution
            2. Codeforces Integration:
               - Contest performance
               - Contribution tracking
               - Problem-solving stats
            3. GitHub Integration:
               - Repository activity
               - Contribution tracking
               - Project collaboration via contacting room members`
        },
        {
            question: 'How do I troubleshoot common issues?',
            answer: `Common issues and solutions:
            1. Platform Stats:
               - If stats aren't updating, try manual refresh
               - Verify platform usernames are correct
               - Check if platform is accessible
            2. Room Access:
               - Ensure you're logged in
               - Check room privacy settings
               - Verify invite link validity
            3. General Issues:
               - Clear browser cache
               - Check internet connection
               - Contact support if persistent`
        }
    ];

    return (
        <div className="bg-gradient-to-br from-gray-900 to-gray-800 text-white px-4 py-4 rounded-xl shadow-2xl w-full h-full overflow-hidden flex flex-col">
            <h1 className="text-3xl font-bold mb-8 text-center bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-500">Help & FAQs</h1>
            <div className="space-y-4 overflow-y-auto p-3 flex-grow custom-scrollbar">
                {faqData.map((faq, index) => (
                    <div key={index} className="border-b border-gray-700 pb-4">
                        <motion.div
                            className="flex justify-between items-center cursor-pointer py-4"
                            onClick={() => toggleQuestion(index)}
                            whileHover={{ scale: 1.02 }}
                            transition={{ type: "spring", stiffness: 400, damping: 10 }}
                        >
                            <h2 className="text-xl font-semibold">{faq.question}</h2>
                            <motion.div
                                animate={{ rotate: openQuestions.includes(index) ? 180 : 0 }}
                                transition={{ duration: 0.3 }}
                            >
                                <ChevronDownIcon size={24} className="text-blue-400" />
                            </motion.div>
                        </motion.div>
                        <AnimatePresence>
                            {openQuestions.includes(index) && (
                                <motion.div
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: "auto" }}
                                    exit={{ opacity: 0, height: 0 }}
                                    transition={{ duration: 0.3 }}
                                >
                                    <p className="mt-2 text-gray-300 leading-relaxed whitespace-pre-line">
                                        {faq.answer}
                                    </p>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                ))}
            </div>
            <div className="border-t border-gray-700 pt-2 text-center">
                <p className="text-gray-400 mb-4">Still having issues? Report them directly to our support team</p>
                <button
                    onClick={handleReportError}
                    className="flex items-center justify-center gap-2 mx-auto px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
                >
                    <MailIcon size={20} />
                    <span>Report an Error</span>
                </button>
            </div>
            {/* Custom scrollbar styles */}
            <style jsx global>{`
            .custom-scrollbar::-webkit-scrollbar {
              width: 10px;
              background: transparent;
            }
            .custom-scrollbar::-webkit-scrollbar-thumb {
              background: linear-gradient(135deg, #a78bfa 0%, #6366f1 100%);
              border-radius: 8px;
              min-height: 40px;
            }
            .custom-scrollbar::-webkit-scrollbar-thumb:hover {
              background: linear-gradient(135deg, #7c3aed 0%, #6366f1 100%);
            }
            .custom-scrollbar::-webkit-scrollbar-track {
              background: transparent;
            }
            
            /* For Firefox */
            .custom-scrollbar {
              scrollbar-width: thin;
              scrollbar-color: #a78bfa #18181b;
            }
            `}</style>
        </div>
    );
};

export default HelpFAQ;
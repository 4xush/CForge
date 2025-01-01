import React, { useState } from 'react';
import { ChevronDownIcon, ChevronUpIcon } from 'lucide-react';
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

    const faqData = [
        {
            question: 'How do I create a room?',
            answer: `To create a room:
            1. Go to the dashboard and click on the "Rooms" button in the left sidebar.
            2. Click on the "Create Room" button.
            3. Enter a room name, description, and set privacy preferences (Public or Private).
            4. As the room creator, you will automatically become the admin of the room.`
        },
        {
            question: 'How do I join a room?',
            answer: `To join a room:
            1. If the room is public, click on "Join Room" from the available list of rooms.
            2. For private rooms, you will need an invite link from the admin. 
            3. Click the invite link to send a join request, and the admin will accept or decline the request.`
        },
        {
            question: 'How do I add members to my room?',
            answer: `To add members to a room:
            1. Only room admins can invite members.
            2. Share the room’s invite link (valid for 24 hours) with others, or accept join requests.
            3. Once the user accepts the invite, they will become a room member.`
        },
        {
            question: 'How do I view the leaderboard?',
            answer: `To view the leaderboard:
            1. Go to the "Rooms" section and select the room you want to view.
            2. Once inside the room, click on the "Leaderboard" tab in the main content area.
            3. The leaderboard shows rankings based on the number of LeetCode problems solved, contests given, and difficulty.`
        },
        {
            question: 'What are the different types of rooms?',
            answer: `There are two types of rooms:
            1. Public Rooms: Anyone can join without admin approval.
            2. Private Rooms: Users need an invite link or admin approval to join.`
        },
        {
            question: 'How do I manage room settings?',
            answer: `As an admin, you can:
            1. Go to the "Rooms" section and select the room you want to manage.
            2. Use the "Settings" option in the room to update room details like name, description, or privacy settings.
            3. Promote other members to admins, or remove members if needed.`
        },
        {
            question: 'How does the leaderboard work?',
            answer: `The leaderboard ranks users based on:
            1. Total number of LeetCode problems solved.
            2. Number of contests given.
            3. Problem difficulty (easy, medium, hard). 
            The default sorting is by total problems solved, but you can filter by other criteria.`
        },
        {
            question: 'What is the difference between admin and member roles?',
            answer: `Admins have additional privileges like:
            1. Creating rooms.
            2. Managing room settings.
            3. Accepting/declining join requests.
            4. Promoting members to admins or removing them.`
        }
    ];

    return (
        <div className="bg-gradient-to-br from-gray-900 to-gray-800 text-white px-2 py-8 rounded-xl shadow-2xl w-full h-full overflow-hidden flex flex-col">
            <h1 className="text-3xl font-bold mb-8 text-center bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-500">Help & FAQs</h1>
            <div className="space-y-4 overflow-y-auto p-3 flex-grow">
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
                                    <p className="mt-2 text-gray-300 leading-relaxed">
                                        {faq.answer}
                                    </p>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default HelpFAQ;
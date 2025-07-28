import { useState, useEffect, useMemo } from "react";
import { ChevronDownIcon, MailIcon, Search, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const HelpFAQ = () => {
  const [openQuestions, setOpenQuestions] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");

  const toggleQuestion = (index) => {
    setOpenQuestions((prev) =>
      prev.includes(index) ? prev.filter((i) => i !== index) : [...prev, index]
    );
  };

  useEffect(() => {
    // Auto-open first FAQ on initial load if none are open
    if (openQuestions.length === 0) {
      setOpenQuestions([0]);
    }
  }, [openQuestions.length]);

  const clearSearch = () => {
    setSearchTerm("");
  };

  const handleReportError = () => {
    const subject = encodeURIComponent("Error Report - CForge");
    const body = encodeURIComponent(
      "Please describe the error you encountered:\n\n"
    );
    window.location.href = `mailto:cforge.service@gmail.com?subject=${subject}&body=${body}`;
  };

  // Use useMemo to prevent faqData from being recreated on every render
  const faqData = useMemo(
    () => [
      {
        question: "How do I use the LeetCode Problem Tracker?",
        answer: `The LeetCode Problem Tracker helps you manage problems you've solved and set review reminders:
            1. Accessing the Tracker:
               - Navigate to the LeetCode Problem Tracker from the dashboard
               - View your solved problems automatically synced from LeetCode
               - See statistics of your problem-solving activities
            
            2. Key Features:
               - Sync recent problems from your LeetCode account with one click
               - Mark important problems for focused review later
               - Set review reminders to revisit problems at specific intervals
               - Track your progress with stats cards (total solved, by difficulty, etc.)
               - Enable notifications to get reminded when it's time to review
            
            3. Working with Problems:
               - Filter and sort problems by various criteria
               - Mark problems as important for prioritized review
               - Add review notes to problems for future reference
               - Set up recurring reminders for spaced repetition practice
               
            4. Reminders System:
               - Schedule reminders at optimal intervals for better retention
               - Complete reminders to mark review sessions as done
               - Snooze reminders if you need to postpone a review
               - Receive browser notifications (when enabled) for due reviews
               
            5. Notification Settings:
               - Click the notification bell icon to manage settings
               - Enable browser notifications for timely reminders
               - Configure notification preferences for different reminder types
               - Works across devices with supported browsers`,
      },
      {
        question: "How do I set up my coding platforms?",
        answer: `To set up your coding platforms:
            1. Go to Settings > Platforms
            2. Add your usernames for LeetCode, Codeforces, and GitHub
            3. Click "Update" for each platform to verify your username
            4. Your stats will be automatically fetched and updated
            5. You can refresh your stats anytime using the "Update Stats" button on your dashboard or in room leaderboards
            6. Note: Stats updates are limited to once every two days to respect platform rate limits`,
      },
      {
        question: "How do I create a room?",
        answer: `To create a room:
            1. Go to the dashboard and click on the "Rooms" button in the left sidebar
            2. Click on the "Create Room" button
            3. Enter a room name and description
            4. Choose room type (Public or Private)
            5. Set platform preferences (LeetCode, Codeforces, or both) 
            6. As the room creator, you will automatically become the admin of the room
            7. You can customize room settings and invite members after creation through the TopBar menu
            8. Use the "Generate Invite Link" option in Room Details to invite new members`,
      },
      {
        question: "How do I join a room?",
        answer: `To join a room:
            1. For private rooms:
               - You need an invite link from a room admin
               - Click the invite link to open the join request page
               - Submit your join request
               - Wait for admin approval (you'll be automatically added once approved)
            2. After joining, you can access:
               - Room leaderboard: Compare your progress with other members
               - Room chat: Communicate with other members
               - Room details: View room information and members list
            3. You can leave a room anytime through the TopBar menu by clicking "Leave Room"`,
      },
      {
        question: "How does the leaderboard work?",
        answer: `The leaderboard system:
            1. Platform Integration:
               - Toggle between LeetCode and Codeforces using the platform tabs
               - Each platform displays relevant metrics for that platform
               - Stats are updated every 2 days (restriction shown in the TopBar)
            
            2. Ranking Criteria:
               - LeetCode: Total problems solved, difficulty distribution, contest rating
               - Codeforces: Current rating, max rating, contribution
            
            3. Features:
               - Sort by different metrics using the dropdown menu
               - Filter and search for specific users
               - View detailed stats for each member by clicking on their profile
               - See your own position with "Show My Place" button
               - Adjust entries per page (10, 20, 50, 100)
               
            4. Mobile Experience:
               - Fully responsive design works on all devices
               - Optimized card and table views for smaller screens`,
      },
      {
        question: "What are the room settings and permissions?",
        answer: `Room settings and permissions:
            1. Admin Privileges:
               - Access room settings through the TopBar menu
               - Manage room details (name, description)
               - Control room privacy settings
               - Generate invite links with 24-hour validity
               - Handle join requests
               - Promote/demote members
               - Remove members
               - Configure platform preferences
               - Monitor platform stats update status in TopBar
            
            2. Member Features:
               - View leaderboard with sorting and filtering options
               - Participate in chat
               - View room details
               - Update their own stats (subject to 2-day restriction)
               - Leave the room through TopBar menu
               - Track platform update status in TopBar
               
            3. Room Navigation:
               - Use the tabs in the room header to switch between Leaderboard and Chat
               - Access room options through the three-dot menu in TopBar
               - View last update time for each platform in the TopBar`,
      },
      {
        question: "How do I manage my profile and platform stats?",
        answer: `Profile and stats management:
            1. Profile Settings:
               - Update personal information
               - Add social network links
               - Change profile picture
               - Manage platform usernames
            
            2. Stats Management:
               - Manual refresh option (subject to 2-day restriction)
               - Track last update time in room TopBar
               - Monitor update status (idle, updating, failed)
               - View detailed activity heatmaps on your profile
               - See LeetCode level progression based on problems solved
            
            3. LeetCode Dashboard:
               - View problem distribution by difficulty (easy, medium, hard)
               - See contest participation metrics
               - Track progress with level cards showing your current level
               - Compare stats with other users in room leaderboards
               - Responsive design allows viewing on any device`,
      },
      {
        question: "What are the chat features in rooms?",
        answer: `Room chat features:
            1. Accessing the Chat:
               - Click on the "Chat" tab in room navigation
               - The chat tab is always accessible from the room header
               - Works on both desktop and mobile devices
            
            2. Features:
               - Send and receive messages in real-time
               - Message history is preserved when you return to the room
               - Chat interface is responsive for all screen sizes
               - TopBar stays fixed while scrolling through chat history
            
            3. Navigation:
               - Easily switch between Leaderboard and Chat using the tabs
               - Access room settings and details from any view through the TopBar
               - Return to rooms list by navigating to Dashboard > Rooms`,
      },
      {
        question: "How do I handle room invites and notifications?",
        answer: `Room invites and notifications:
            1. Invite System:
               - Admins can generate invite links from Room Details
               - Links are valid for 24 hours
               - Copy link directly or share via email
               - Track pending join requests in Room Settings
            
            2. Join Request Process:
               - Users click invite link to open join request page
               - They submit request with a message (optional)
               - Admins approve or reject from Room Settings
               - Approved users are automatically added to the room
            
            3. Mobile Experience:
               - Generate and share invites from mobile devices
               - Responsive design ensures proper functioning on all screens
               - Access invite options through the room TopBar menu`,
      },
      {
        question: "What are the platform-specific features?",
        answer: `Platform-specific features:
            1. LeetCode Integration:
               - Problem-solving stats with breakdown by difficulty
               - Contest participation and rating
               - Level progression based on weighted problem count
               - Custom level cards showing your current status
               - Responsive dashboard optimized for all devices
            
            2. Codeforces Integration:
               - Current and maximum rating tracking
               - Rank information with visual indicators
               - Contribution metrics
               - Contest history
               - Performance comparison with other members
            
            3. Cross-Platform Benefits:
               - Compare progress across multiple platforms in one place
               - Track improvement over time
               - See how you rank against room members on different platforms
               - Motivate each other through friendly competition`,
      },
      {
        question: "How do I use CForge on mobile devices?",
        answer: `Mobile experience on CForge:
            1. Responsive Design:
               - All features are fully accessible on mobile devices
               - UI automatically adapts to your screen size
               - Fixed headers ensure easy navigation while scrolling
               - Optimized tables and cards for smaller screens
            
            2. Room Features on Mobile:
               - TopBar remains fixed for easy access to room options
               - Leaderboard data is presented in a mobile-friendly format
               - Chat interface adapts to smaller screens
               - All admin controls are accessible through the mobile menu
            
            3. Navigation Tips:
               - Use the fixed tabs to switch between Leaderboard and Chat
               - Access room options through the three-dot menu in TopBar
               - All modals and panels are optimized for touch interaction
               - Pull to refresh works on most data displays`,
      },
      {
        question: "How do I install CForge as an app on my mobile device?",
        answer: `CForge is a Progressive Web App (PWA) that can be installed on your device for a native app-like experience:
            1. Installing on Android:
               - Open CForge in Chrome or any supported browser
               - You'll see a "Add to Home Screen" banner or prompt
               - Alternatively, tap the menu (three dots) in your browser
               - Select "Install App" or "Add to Home Screen"
               - The app will be added to your home screen for easy access
            
            2. Installing on iOS (iPhone/iPad):
               - Open CForge in Safari
               - Tap the share icon (square with arrow) at the bottom
               - Scroll down and tap "Add to Home Screen"
               - Tap "Add" in the upper right corner
               - The app icon will appear on your home screen
               
            3. Benefits of Installing as PWA:
               - Offline access to previously loaded content
               - Faster loading times after initial setup
               - App-like experience with full-screen mode (no browser UI)
               - Push notifications (when enabled)
               - Automatic updates whenever you connect to the internet
               
            4. After Installation:
               - Launch CForge directly from your home screen icon
               - All your login information will be saved
               - The app works even with limited or no internet connection
               - Updates are applied automatically in the background`,
      },
      {
        question:
          "How do browser notifications work with the LeetCode Tracker?",
        answer: `Browser notifications help you stay on top of your problem review schedule:
            1. Setting Up Notifications:
               - Click the bell icon in the LeetCode Problem Tracker
               - Allow notifications when your browser prompts you
               - Configure your notification preferences in the settings panel
               - Choose which types of reminders you want to be notified about
            
            2. How Notifications Work:
               - Receive alerts when problem reviews are due
               - Notifications appear even when CForge isn't open in your browser
               - Click on a notification to go directly to the pending reminder
               - Notifications are scheduled based on your reminder settings
               
            3. PWA Notification Support:
               - For the best experience, install CForge as a PWA (from browser menu)
               - PWA installations handle notifications more reliably
               - Notifications work differently when using the PWA version
               - The app can send notifications even when closed
            
            4. Managing Notification Settings:
               - Toggle notifications on/off using the bell icon
               - Access detailed settings through the notification preferences panel
               - You can enable notifications on multiple devices
               - Browser permissions can be managed in your browser settings
               
            5. Troubleshooting Notifications:
               - If notifications don't appear, check browser permissions
               - Ensure notifications are enabled in both CForge and your browser
               - Some browsers restrict notifications for inactive sites
               - If using as PWA, notifications use a different system than regular browser tabs
               - Try reinstalling the PWA if notifications aren't working properly
               
            6. Privacy and Control:
               - All notifications are generated locally in your browser
               - You can disable notifications at any time
               - No notification data is stored on our servers
               - Notification settings are saved to your account preferences`,
      },
      {
        question: "How do I troubleshoot common issues?",
        answer: `Common issues and solutions:
            1. Platform Stats Issues:
               - If stats aren't updating, check the last update time in TopBar
               - Remember there's a 2-day restriction between updates
               - Verify platform update status indicators in TopBar (idle, updating, failed)
               - Ensure your platform usernames are correct in Settings
               - If status shows "Failed", try updating again later
            
            2. Room Access Issues:
               - If you can't access a room, ensure you're logged in
               - Check if your join request was approved by an admin
               - Verify invite link validity (links expire after 24 hours)
               - Contact a room admin if your access was revoked
               
            3. Display/UI Issues:
               - If TopBar disappears while scrolling, try refreshing the page
               - For layout problems on mobile, try rotating your device
               - If content doesn't fit properly, adjust zoom level in browser
               - Clear browser cache if persistent UI issues occur
               
            4. Problem Tracker Issues:
               - If LeetCode sync fails, verify your username is correct
               - For reminder notification issues, check browser permissions
               - Wait for cooldown period to expire before re-syncing
               - Make sure you're logged into LeetCode when syncing
               
            5. Performance Tips:
               - Avoid refreshing stats too frequently (respects 2-day limit)
               - Close unused tabs to improve performance
               - For slower connections, reduce entries per page in leaderboards`,
      },
    ],
    []
  );

  // Calculate filtered FAQs based on search term
  const filteredFAQs = useMemo(() => {
    if (!searchTerm.trim()) {
      return faqData.map((_, idx) => idx);
    }

    const searchTermLower = searchTerm.toLowerCase();
    return faqData.reduce((acc, faq, index) => {
      const questionMatch = faq.question
        .toLowerCase()
        .includes(searchTermLower);
      const answerMatch = faq.answer.toLowerCase().includes(searchTermLower);

      if (questionMatch || answerMatch) {
        acc.push(index);
      }
      return acc;
    }, []);
  }, [searchTerm, faqData]);

  // Auto-open matching questions when search results change
  useEffect(() => {
    // If we have search results that aren't open yet, open the first one
    if (
      filteredFAQs.length > 0 &&
      searchTerm &&
      !filteredFAQs.some((idx) => openQuestions.includes(idx))
    ) {
      setOpenQuestions((prev) => [...prev, filteredFAQs[0]]);
    }
  }, [filteredFAQs, openQuestions, searchTerm]);

  return (
    <div className="bg-gradient-to-br from-gray-900 to-gray-800 text-white px-4 py-4 rounded-xl shadow-2xl w-full h-full overflow-hidden flex flex-col">
      <div className="flex flex-col items-center mb-2">
        <h1 className="text-2xl md:text-3xl font-bold mb-2 text-center bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-500">
          Help & FAQs
        </h1>
        <p className="text-gray-300 text-sm md:text-base text-center max-w-2xl">
          Find answers to common questions about CForge features and
          functionality
        </p>
      </div>

      {/* Search input */}
      <div className="flex mx-auto w-full max-w-lg mb-4 px-2">
        <div className="relative w-full">
          <div className="absolute inset-y-0 start-0 flex items-center ps-3 pointer-events-none">
            <Search className="w-4 h-4 text-gray-400" />
          </div>
          <input
            type="search"
            className="block w-full p-2 ps-10 text-sm bg-gray-800 border border-gray-700 rounded-lg focus:ring-blue-500 focus:border-blue-500 text-white placeholder-gray-400"
            placeholder="Search in FAQs..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          {searchTerm && (
            <button
              type="button"
              className="absolute inset-y-0 end-0 flex items-center pe-3"
              onClick={clearSearch}
            >
              <X className="w-4 h-4 text-gray-400 hover:text-white" />
            </button>
          )}
        </div>
      </div>

      {/* Categories Bar - for quick navigation on larger screens */}
      <div className="hidden md:flex flex-wrap justify-center gap-2 mb-2">
        {[
          "Getting Started",
          "LeetCode Tracker",
          "Rooms",
          "Leaderboard",
          "Profile",
          "Mobile",
        ].map((category, i) => (
          <button
            key={i}
            onClick={() => {
              // Simple category-based navigation
              // Maps categories to FAQ indices
              const categoryMap = {
                "Getting Started": 1,
                "LeetCode Tracker": 0,
                Rooms: 2,
                Leaderboard: 4,
                Profile: 6,
                Mobile: 10,
              };
              const indexToOpen = categoryMap[category];
              if (indexToOpen !== undefined) {
                // Auto-scroll to that question
                document
                  .getElementById(`faq-${indexToOpen}`)
                  ?.scrollIntoView({ behavior: "smooth" });
                if (!openQuestions.includes(indexToOpen)) {
                  toggleQuestion(indexToOpen);
                }
              }
            }}
            className="px-3 py-1.5 text-sm bg-gray-800 hover:bg-gray-700 rounded-full text-blue-300 border border-gray-700 transition-colors"
          >
            {category}
          </button>
        ))}
      </div>

      {/* Search results count */}
      {searchTerm && (
        <div className="text-sm text-gray-300 mb-3 px-3">
          {filteredFAQs.length === 0 ? (
            <p>No results found for &quot;{searchTerm}&quot;</p>
          ) : (
            <p>
              Found {filteredFAQs.length} result
              {filteredFAQs.length !== 1 ? "s" : ""} for &quot;{searchTerm}
              &quot;
            </p>
          )}
        </div>
      )}

      {/* FAQ items */}
      <div className="space-y-4 overflow-y-auto p-3 flex-grow custom-scrollbar">
        {faqData.map((faq, index) => {
          // Only show FAQs that match the search or all if no search
          if (searchTerm && !filteredFAQs.includes(index)) return null;

          return (
            <div
              id={`faq-${index}`}
              key={index}
              className={`border border-gray-700 rounded-lg mb-4 overflow-hidden ${
                searchTerm && filteredFAQs.includes(index)
                  ? "ring-2 ring-blue-500/30"
                  : ""
              }`}
            >
              <motion.div
                className={`flex justify-between items-center cursor-pointer py-3 px-4 md:py-4 ${
                  openQuestions.includes(index)
                    ? "bg-gray-800/80"
                    : "hover:bg-gray-800/30"
                }`}
                onClick={() => toggleQuestion(index)}
                whileHover={{ scale: 1.01 }}
                transition={{ type: "spring", stiffness: 400, damping: 10 }}
              >
                <h2 className="text-base md:text-lg font-semibold pr-4">
                  {faq.question}
                </h2>
                <motion.div
                  animate={{ rotate: openQuestions.includes(index) ? 180 : 0 }}
                  transition={{ duration: 0.3 }}
                  className="bg-gray-700 rounded-full p-1 flex-shrink-0"
                >
                  <ChevronDownIcon
                    size={18}
                    className="text-blue-300 md:w-5 md:h-5 w-4 h-4"
                  />
                </motion.div>
              </motion.div>
              <AnimatePresence>
                {openQuestions.includes(index) && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.3 }}
                    className="border-t border-gray-700 bg-gray-800/20"
                  >
                    <div className="px-4 py-3 md:px-6 md:py-4">
                      <p className="text-sm md:text-base text-gray-300 leading-relaxed whitespace-pre-line">
                        {faq.answer}
                      </p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}

        {/* Show message when no results */}
        {searchTerm && filteredFAQs.length === 0 && (
          <div className="bg-gray-800/30 rounded-lg p-8 text-center">
            <p className="text-lg text-gray-400 mb-2">No matching FAQs found</p>
            <p className="text-sm text-gray-500">
              Try using different search terms or browse by category
            </p>
          </div>
        )}
      </div>

      <div className="border-t border-gray-700 pt-3 mt-2">
        <div className="flex flex-col items-center">
          <p className="text-gray-400 mb-2 text-center text-xs md:text-sm">
            Still having issues? Contact our support team:
          </p>
          <button
            onClick={handleReportError}
            className="flex items-center justify-center gap-1.5 mx-auto px-4 py-2 text-sm bg-gradient-to-r from-blue-600/90 to-purple-600/90 hover:from-blue-700 hover:to-purple-700 rounded-md transition-all"
          >
            <MailIcon size={16} />
            <span>Report an Error</span>
          </button>
        </div>
      </div>
      {/* Custom scrollbar styles */}
      <style>{`
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

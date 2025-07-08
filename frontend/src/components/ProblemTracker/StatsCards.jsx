import { BookOpen, Target, Star, Clock, TrendingUp } from "lucide-react";
import { useEffect, useState } from "react";

const StatsCards = ({ stats }) => {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 640);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const cards = [
    {
      title: "Total Problems",
      value: stats.totalProblems || 0,
      icon: BookOpen,
      color: "bg-blue-500",
      description: "Problems tracked",
    },
    {
      title: "Easy",
      value: stats.easyCount || 0,
      icon: Target,
      color: "bg-green-500",
      description: "Easy problems",
    },
    {
      title: "Medium",
      value: stats.mediumCount || 0,
      icon: TrendingUp,
      color: "bg-yellow-500",
      description: "Medium problems",
    },
    {
      title: "Hard",
      value: stats.hardCount || 0,
      icon: Star,
      color: "bg-red-500",
      description: "Hard problems",
    },
    {
      title: "Important",
      value: stats.importantCount || 0,
      icon: Star,
      color: "bg-yellow-500",
      description: "Marked as important",
    },
    {
      title: "Pending Reminders",
      value: stats.pendingReminders || 0,
      icon: Clock,
      color: "bg-orange-500",
      description: "Due for review",
    },
  ];

  // Only show Total Problems and Important on mobile
  const filteredCards = isMobile
    ? cards.filter((c) => c.title === "Total Problems" || c.title === "Important")
    : cards;

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-1 sm:gap-4 mb-3 sm:mb-6">
      {filteredCards.map((card, index) => (
        <div
          key={index}
          className="bg-gray-800 rounded-md p-1.5 sm:p-4 border border-gray-700 hover:border-gray-600 transition-colors"
        >
          <div className="flex items-center justify-between mb-0.5 sm:mb-2">
            <div className={`p-0.5 sm:p-2 rounded-lg ${card.color}`}>
              <card.icon className="w-2.5 h-2.5 sm:w-4 sm:h-4 text-white" />
            </div>
          </div>
          <div className="text-base sm:text-2xl font-bold text-white mb-0 sm:mb-1">
            {card.value}
          </div>
          <div className="text-xs text-gray-400 font-medium leading-tight">{card.title}</div>
          <div className="text-[9px] sm:text-xs text-gray-500 mt-0 sm:mt-1 leading-tight hidden sm:block">
            {card.description}
          </div>
        </div>
      ))}
    </div>
  );
};

export default StatsCards;

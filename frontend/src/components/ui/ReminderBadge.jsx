import { Bell, Clock } from 'lucide-react';

const ReminderBadge = ({ count, className = "", size = "sm" }) => {
  if (!count || count <= 0) return null;

  const sizeClasses = {
    xs: "text-xs px-1 py-0.5 min-w-[16px] h-4",
    sm: "text-xs px-1.5 py-0.5 min-w-[18px] h-5",
    md: "text-sm px-2 py-1 min-w-[20px] h-6",
    lg: "text-base px-2.5 py-1.5 min-w-[24px] h-7"
  };

  const iconSizes = {
    xs: "w-2 h-2",
    sm: "w-3 h-3",
    md: "w-4 h-4",
    lg: "w-5 h-5"
  };

  return (
    <div className={`inline-flex items-center gap-1 ${className}`}>
      <span 
        className={`
          ${sizeClasses[size]}
          bg-orange-500 text-white rounded-full 
          flex items-center justify-center 
          font-bold transition-all duration-200
          animate-pulse
        `}
      >
        {count > 99 ? '99+' : count}
      </span>
    </div>
  );
};

export default ReminderBadge;
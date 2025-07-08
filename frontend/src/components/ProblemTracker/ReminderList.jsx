import { useState } from 'react';
import { 
  Clock, 
  CheckCircle2, 
  SkipForward, 
  ExternalLink,
  Calendar,
  RefreshCw
} from 'lucide-react';

const ReminderList = ({ 
  reminders, 
  onReminderComplete, 
  onReminderSkip, 
  onRefresh 
}) => {
  const [processingReminder, setProcessingReminder] = useState(null);

  const handleComplete = async (reminderId) => {
    try {
      setProcessingReminder(reminderId);
      await onReminderComplete(reminderId);
    } finally {
      setProcessingReminder(null);
    }
  };

  const handleSkip = async (reminderId, hours = 24) => {
    try {
      setProcessingReminder(reminderId);
      await onReminderSkip(reminderId, hours);
    } finally {
      setProcessingReminder(null);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = date - now;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) {
      return 'Today';
    } else if (diffDays === -1) {
      return 'Yesterday';
    } else if (diffDays < 0) {
      return `${Math.abs(diffDays)} days overdue`;
    } else if (diffDays === 1) {
      return 'Tomorrow';
    } else {
      return `In ${diffDays} days`;
    }
  };

  const getDifficultyColor = (difficulty) => {
    const colors = {
      Easy: 'text-green-400',
      Medium: 'text-yellow-400',
      Hard: 'text-red-400'
    };
    return colors[difficulty] || 'text-gray-400';
  };



  if (reminders.length === 0) {
    return (
      <div className="bg-gray-800 rounded-lg p-8 text-center border border-gray-700">
        <Clock className="w-12 h-12 text-gray-500 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-300 mb-2">
          No pending reminders
        </h3>
        <p className="text-gray-500 mb-4">
          Great job! You're all caught up with your reviews.
        </p>
        <button
          onClick={onRefresh}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors mx-auto"
        >
          <RefreshCw className="w-4 h-4" />
          Refresh
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium text-white">
          Pending Reminders ({reminders.length})
        </h3>
        <button
          onClick={onRefresh}
          className="flex items-center gap-2 px-3 py-1 text-gray-400 hover:text-white transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          Refresh
        </button>
      </div>

      {/* Reminders List */}
      <div className="space-y-3">
        {reminders.map((reminder) => (
          <div
            key={reminder.id}
            className="bg-gray-800 rounded-lg p-4 border border-gray-700 hover:border-gray-600 transition-colors"
          >
            <div className="flex items-start justify-between">
              {/* Problem Info */}
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <h4 className="text-white font-medium truncate">
                    {reminder.problem.title}
                  </h4>
                  <a
                    href={reminder.problem.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-400 hover:text-blue-300 transition-colors"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </a>
                </div>

                <div className="flex items-center gap-4 text-sm mb-3">
                  {/* Difficulty */}
                  {reminder.problem.difficulty && (
                    <span className={`font-medium ${getDifficultyColor(reminder.problem.difficulty)}`}>
                      {reminder.problem.difficulty}
                    </span>
                  )}



                  {/* Reminder Date */}
                  <div className="flex items-center gap-1 text-gray-400">
                    <Calendar className="w-3 h-3" />
                    <span>{formatDate(reminder.reminderDate)}</span>
                  </div>

                  {/* Interval */}
                  <span className="text-gray-500">
                    {reminder.interval} day{reminder.interval !== 1 ? 's' : ''} interval
                  </span>
                </div>

                {/* Originally Solved Date */}
                <div className="text-xs text-gray-500">
                  Originally solved: {new Date(reminder.problem.solvedAt).toLocaleDateString()}
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 ml-4">
                {/* Complete Button */}
                <button
                  onClick={() => handleComplete(reminder.id)}
                  disabled={processingReminder === reminder.id}
                  className="flex items-center gap-2 px-3 py-1 bg-green-600 hover:bg-green-700 disabled:bg-green-800 disabled:cursor-not-allowed text-white rounded transition-colors"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  {processingReminder === reminder.id ? 'Processing...' : 'Complete'}
                </button>

                {/* Skip Options */}
                <div className="relative group">
                  <button
                    className="flex items-center gap-2 px-3 py-1 bg-gray-600 hover:bg-gray-700 text-white rounded transition-colors"
                  >
                    <SkipForward className="w-4 h-4" />
                    Skip
                  </button>

                  {/* Skip Dropdown */}
                  <div className="absolute right-0 top-full mt-1 bg-gray-700 border border-gray-600 rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10 min-w-[120px]">
                    <button
                      onClick={() => handleSkip(reminder.id, 1)}
                      disabled={processingReminder === reminder.id}
                      className="w-full px-3 py-2 text-left text-white hover:bg-gray-600 transition-colors text-sm"
                    >
                      1 hour
                    </button>
                    <button
                      onClick={() => handleSkip(reminder.id, 6)}
                      disabled={processingReminder === reminder.id}
                      className="w-full px-3 py-2 text-left text-white hover:bg-gray-600 transition-colors text-sm"
                    >
                      6 hours
                    </button>
                    <button
                      onClick={() => handleSkip(reminder.id, 24)}
                      disabled={processingReminder === reminder.id}
                      className="w-full px-3 py-2 text-left text-white hover:bg-gray-600 transition-colors text-sm"
                    >
                      1 day
                    </button>
                    <button
                      onClick={() => handleSkip(reminder.id, 72)}
                      disabled={processingReminder === reminder.id}
                      className="w-full px-3 py-2 text-left text-white hover:bg-gray-600 transition-colors text-sm"
                    >
                      3 days
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ReminderList;
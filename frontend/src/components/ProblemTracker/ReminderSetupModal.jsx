import { useState } from 'react';
import { X, Plus, Clock, Calendar } from 'lucide-react';

const REMINDER_PRESETS = [
  { label: "2 Days", value: 2 },
  { label: "1 Week", value: 7 },
  { label: "10 Days", value: 10 },
  { label: "2 Weeks", value: 14 },
  { label: "1 Month", value: 30 }
];

const ReminderSetupModal = ({ problem, onSave, onClose, isOpen }) => {
  const [selectedIntervals, setSelectedIntervals] = useState([]);
  const [customInterval, setCustomInterval] = useState('');
  const [saving, setSaving] = useState(false);

  if (!isOpen) return null;

  const handleIntervalToggle = (interval) => {
    setSelectedIntervals(prev => 
      prev.includes(interval) 
        ? prev.filter(i => i !== interval)
        : [...prev, interval]
    );
  };

  const handleAddCustom = () => {
    const interval = parseInt(customInterval);
    if (interval && interval > 0 && interval <= 365 && !selectedIntervals.includes(interval)) {
      setSelectedIntervals(prev => [...prev, interval]);
      setCustomInterval('');
    }
  };

  const handleSave = async () => {
    if (selectedIntervals.length === 0) return;
    
    setSaving(true);
    try {
      await onSave(selectedIntervals);
      onClose();
    } catch (error) {
      console.error('Error saving reminders:', error);
    } finally {
      setSaving(false);
    }
  };

  const getPreviewDate = (interval) => {
    const date = new Date();
    date.setDate(date.getDate() + interval);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-700">
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-blue-400" />
            <h3 className="text-lg font-bold text-white">Set Review Reminders</h3>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-4">
          {/* Problem Info */}
          <div className="bg-gray-700/50 rounded-lg p-3">
            <h4 className="font-medium text-white mb-1">{problem.problem.title}</h4>
            <div className="flex items-center gap-2 text-sm text-gray-400">
              <span className={`px-2 py-1 rounded text-xs ${
                problem.problem.difficulty === 'Easy' ? 'bg-green-500/20 text-green-400' :
                problem.problem.difficulty === 'Medium' ? 'bg-yellow-500/20 text-yellow-400' :
                'bg-red-500/20 text-red-400'
              }`}>
                {problem.problem.difficulty}
              </span>
              <span>•</span>
              <span>Solved: {new Date(problem.solvedAt).toLocaleDateString()}</span>
            </div>
          </div>

          {/* Description */}
          <p className="text-gray-400 text-sm">
            Choose when you want to be reminded to review this problem. Regular reviews help maintain problem-solving skills.
          </p>

          {/* Preset Intervals */}
          <div>
            <label className="block text-sm font-medium mb-2 text-gray-300">Quick Select:</label>
            <div className="flex flex-wrap gap-2">
              {REMINDER_PRESETS.map(preset => (
                <button
                  key={preset.value}
                  onClick={() => handleIntervalToggle(preset.value)}
                  className={`px-3 py-2 rounded text-sm font-medium transition-colors ${
                    selectedIntervals.includes(preset.value)
                      ? 'bg-blue-600 text-white border border-blue-500'
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600 border border-gray-600'
                  }`}
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </div>

          {/* Custom Interval */}
          <div>
            <label className="block text-sm font-medium mb-2 text-gray-300">Custom Days:</label>
            <div className="flex gap-2">
              <input
                type="number"
                value={customInterval}
                onChange={(e) => setCustomInterval(e.target.value)}
                placeholder="Enter days (1-365)"
                className="flex-1 px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
                min="1"
                max="365"
                onKeyPress={(e) => e.key === 'Enter' && handleAddCustom()}
              />
              <button
                onClick={handleAddCustom}
                disabled={!customInterval || parseInt(customInterval) <= 0}
                className="px-4 py-2 bg-gray-600 hover:bg-gray-500 disabled:bg-gray-800 disabled:cursor-not-allowed rounded transition-colors flex items-center gap-1"
              >
                <Plus className="w-4 h-4" />
                Add
              </button>
            </div>
          </div>

          {/* Selected Intervals Preview */}
          {selectedIntervals.length > 0 && (
            <div>
              <label className="block text-sm font-medium mb-2 text-gray-300">
                Selected Reminders ({selectedIntervals.length}):
              </label>
              <div className="space-y-2">
                {selectedIntervals.sort((a, b) => a - b).map(interval => (
                  <div
                    key={interval}
                    className="flex items-center justify-between bg-green-600/20 border border-green-500/30 rounded p-2"
                  >
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-green-400" />
                      <span className="text-green-400 font-medium">
                        Day {interval}
                      </span>
                      <span className="text-gray-400 text-sm">
                        ({getPreviewDate(interval)})
                      </span>
                    </div>
                    <button
                      onClick={() => handleIntervalToggle(interval)}
                      className="text-green-400 hover:text-red-400 transition-colors"
                      title="Remove reminder"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Info Box */}
          <div className="bg-blue-600/10 border border-blue-500/30 rounded-lg p-3">
            <div className="flex items-start gap-2">
              <Clock className="w-4 h-4 text-blue-400 mt-0.5" />
              <div className="text-sm">
                <p className="text-blue-400 font-medium mb-1">How it works:</p>
                <p className="text-gray-400">
                  You'll receive reminders on the selected days after solving this problem. 
                  Complete them to track your review progress.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-700 flex gap-2">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 bg-gray-600 hover:bg-gray-500 text-white rounded transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={selectedIntervals.length === 0 || saving}
            className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded transition-colors font-medium"
          >
            {saving ? 'Setting Reminders...' : `Set ${selectedIntervals.length} Reminder${selectedIntervals.length !== 1 ? 's' : ''}`}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ReminderSetupModal;
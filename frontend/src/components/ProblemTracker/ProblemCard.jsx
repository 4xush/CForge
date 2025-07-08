import { useState } from 'react';
import { 
  ExternalLink, 
  Clock,
  Edit3,
  Trash2,
  Bell,
  Calendar,
  Save,
  X,
  Star
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { problemTrackerApi } from '../../api/problemTrackerApi';

const ProblemCard = ({ problem, onUpdate, onDelete }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({
    notes: problem.notes || ''
  });

  const [showReminders, setShowReminders] = useState(false);
  const [creatingReminders, setCreatingReminders] = useState(false);

  const difficultyColors = {
    Easy: 'bg-green-500/20 text-green-400 border-green-500/30',
    Medium: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
    Hard: 'bg-red-500/20 text-red-400 border-red-500/30'
  };

  const handleSave = async () => {
    try {
      await onUpdate(problem.id, { notes: editData.notes });
      setIsEditing(false);
    } catch (error) {
      console.error('Error updating problem:', error);
    }
  };

  const handleCancel = () => {
    setEditData({
      notes: problem.notes || ''
    });
    setIsEditing(false);
  };

  const handleToggleImportant = async () => {
    try {
      await onUpdate(problem.id, { isImportant: !problem.isImportant });
    } catch (error) {
      console.error('Error updating importance:', error);
    }
  };

  const handleDelete = async () => {
    if (window.confirm(`Are you sure you want to delete "${problem.problem.title}"?`)) {
      try {
        await onDelete(problem.id);
      } catch (error) {
        console.error('Error deleting problem:', error);
      }
    }
  };

  const handleCreateReminders = async () => {
    try {
      setCreatingReminders(true);
      await problemTrackerApi.createReminders(problem.id);
      toast.success('Reminders created successfully!');
      setShowReminders(false);
    } catch (error) {
      console.error('Error creating reminders:', error);
      toast.error('Failed to create reminders');
    } finally {
      setCreatingReminders(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div className="bg-gray-800 rounded-lg p-2 sm:p-4 border border-gray-700 hover:border-gray-600 transition-colors">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between mb-2 sm:mb-3 gap-1 sm:gap-0">
        <div className="flex-1">
          <div className="flex items-center gap-1 sm:gap-2 mb-1 sm:mb-2">
            <h3 className="text-sm sm:text-lg font-medium text-white truncate">
              {problem.problem.title}
            </h3>
            <a
              href={problem.problem.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-400 hover:text-blue-300 transition-colors"
            >
              <ExternalLink className="w-4 h-4" />
            </a>
          </div>
          
          <div className="flex flex-wrap items-center gap-1 sm:gap-3 text-xs">
            {/* Difficulty */}
            {problem.problem.difficulty && (
              <span className={`px-1 sm:px-2 py-0.5 sm:py-1 rounded-full text-xs font-medium border ${difficultyColors[problem.problem.difficulty]}`}>
                {problem.problem.difficulty}
              </span>
            )}
            
            {/* Solved Date */}
            <span className="text-gray-400 flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              {formatDate(problem.solvedAt)}
            </span>
            
            {/* Review Count */}
            {problem.reviewCount > 0 && (
              <span className="text-gray-400 flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {problem.reviewCount} reviews
              </span>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1 sm:gap-2 ml-0 sm:ml-4 justify-end sm:justify-start">
          {/* Reminder Button */}
          {problem.hasReminders ? (
            <div className="flex items-center" title={`${problem.reminderCount} Reminders Set`}>
              <Bell className="w-4 h-4 sm:w-5 sm:h-5 text-green-400" />
              <span className="text-xs text-green-400 ml-1 hidden sm:inline">{problem.reminderCount}</span>
            </div>
          ) : (
            <button
              onClick={handleCreateReminders}
              disabled={creatingReminders}
              className="p-1 text-gray-400 hover:text-blue-400 transition-colors"
              title="Set Reminders"
            >
              <Bell className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
          )}
          {/* Important Toggle Button */}
          <button
            onClick={handleToggleImportant}
            className={`p-1 transition-colors ${
              problem.isImportant 
                ? 'text-yellow-400 hover:text-yellow-300' 
                : 'text-gray-400 hover:text-yellow-400'
            }`}
            title={problem.isImportant ? 'Remove from Important' : 'Mark as Important'}
          >
            <Star className={`w-5 h-5 sm:w-6 sm:h-6 ${problem.isImportant ? 'fill-yellow-400' : ''}`} />
          </button>
          
          {/* Edit Button */}
          <button
            onClick={() => setIsEditing(!isEditing)}
            className="p-1 text-gray-400 hover:text-white transition-colors"
          >
            <Edit3 className="w-4 h-4" />
          </button>
          
          {/* Delete Button */}
          <button
            onClick={handleDelete}
            className="p-1 text-gray-400 hover:text-red-400 transition-colors"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Notes */}
      {(problem.notes || isEditing) && (
        <div className="sm:mb-2 text-sm">
          {isEditing ? (
            <textarea
              value={editData.notes}
              onChange={(e) => setEditData(prev => ({ ...prev, notes: e.target.value }))}
              placeholder="Add your notes..."
              className="w-full px-3 py-1 bg-gray-700 border border-gray-600 rounded text-white placeholder-gray-400 focus:outline-none focus:border-blue-500 resize-none"
              rows={2}
            />
          ) : (
            problem.notes && (
              <p className="text-gray-300 text-sm bg-gray-700/50 p-2 rounded">
                {problem.notes}
              </p>
            )
          )}
        </div>
      )}
      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 sm:gap-0">
        {isEditing ? (
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handleSave}
              className="flex items-center gap-1 px-2 sm:px-3 py-1 bg-green-600 hover:bg-green-700 text-white rounded transition-colors text-xs sm:text-sm"
            >
              <Save className="w-4 h-4" />
              Save
            </button>
            <button
              onClick={handleCancel}
              className="flex items-center gap-1 px-2 sm:px-3 py-1 bg-gray-600 hover:bg-gray-700 text-white rounded transition-colors text-xs sm:text-sm"
            >
              <X className="w-4 h-4" />
              Cancel
            </button>
          </div>
        ) : (
          <div></div>
        )}
      </div>
    </div>
  );
};

export default ProblemCard;

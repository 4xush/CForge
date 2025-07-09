import { createContext, useContext, useState, useEffect } from 'react';
import { problemTrackerApi } from '../api/problemTrackerApi';

const ReminderContext = createContext();

export const useReminderContext = () => {
  const context = useContext(ReminderContext);
  if (!context) {
    throw new Error('useReminderContext must be used within a ReminderProvider');
  }
  return context;
};

export const ReminderProvider = ({ children }) => {
  const [pendingCount, setPendingCount] = useState(0);
  const [reminders, setReminders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);

  // Fetch pending reminders
  const fetchPendingReminders = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await problemTrackerApi.getPendingReminders({
        limit: 50, // Get more reminders for full context
      });
      
      const remindersList = response.reminders || [];
      setReminders(remindersList);
      setPendingCount(response.pagination?.totalReminders || remindersList.length);
      setLastUpdated(new Date());
    } catch (err) {
      console.error('Error fetching pending reminders:', err);
      
      // Handle authentication errors gracefully
      if (err.status === 401 || err.message?.includes('unauthorized')) {
        console.log('User not authenticated, skipping reminder fetch');
        setPendingCount(0);
        setReminders([]);
        setError(null); // Don't show error for auth issues
      } else {
        setError(err);
        setPendingCount(0);
        setReminders([]);
      }
    } finally {
      setLoading(false);
    }
  };

  // Refresh reminder count only
  const refreshCount = async () => {
    try {
      const response = await problemTrackerApi.getPendingReminders({
        limit: 1, // Just need count
      });
      setPendingCount(response.pagination?.totalReminders || 0);
      setLastUpdated(new Date());
    } catch (err) {
      console.error('Error refreshing reminder count:', err);
      
      // Handle authentication errors gracefully
      if (err.status === 401 || err.message?.includes('unauthorized')) {
        setPendingCount(0);
      }
    }
  };

  // Complete a reminder
  const completeReminder = async (reminderId) => {
    try {
      await problemTrackerApi.completeReminder(reminderId);
      
      // Update local state
      setReminders(prev => prev.filter(r => r.id !== reminderId));
      setPendingCount(prev => Math.max(0, prev - 1));
      
      return true;
    } catch (error) {
      console.error('Error completing reminder:', error);
      throw error;
    }
  };

  // Skip a reminder
  const skipReminder = async (reminderId, snoozeHours = 24) => {
    try {
      await problemTrackerApi.skipReminder(reminderId, snoozeHours);
      
      // Update local state - reminder is still pending but with new date
      const newDate = new Date();
      newDate.setHours(newDate.getHours() + snoozeHours);
      
      setReminders(prev => 
        prev.map(r => 
          r.id === reminderId 
            ? { ...r, reminderDate: newDate.toISOString() }
            : r
        )
      );
      
      return true;
    } catch (error) {
      console.error('Error skipping reminder:', error);
      throw error;
    }
  };

  // Add new reminders (called when user creates reminders)
  const addReminders = (newReminders) => {
    setReminders(prev => [...prev, ...newReminders]);
    setPendingCount(prev => prev + newReminders.length);
  };

  // Delete reminders for a problem
  const deleteReminders = async (problemId) => {
    try {
      await problemTrackerApi.deleteReminders(problemId);
      
      // Update local state
      setReminders(prev => prev.filter(r => r.problem.id !== problemId));
      await refreshCount(); // Refresh count from server
      
      return true;
    } catch (error) {
      console.error('Error deleting reminders:', error);
      throw error;
    }
  };

  // Get reminders due today
  const getTodayReminders = () => {
    const today = new Date();
    today.setHours(23, 59, 59, 999); // End of today
    
    return reminders.filter(reminder => {
      const reminderDate = new Date(reminder.reminderDate);
      return reminderDate <= today;
    });
  };

  // Get overdue reminders
  const getOverdueReminders = () => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    return reminders.filter(reminder => {
      const reminderDate = new Date(reminder.reminderDate);
      return reminderDate < today;
    });
  };

  // Auto-refresh every 5 minutes
  useEffect(() => {
    // Only fetch if we have a token (user is authenticated)
    const token = localStorage.getItem('token');
    if (token) {
      fetchPendingReminders();
      
      const interval = setInterval(refreshCount, 5 * 60 * 1000); // 5 minutes
      
      return () => clearInterval(interval);
    }
  }, []);

  // Listen for page visibility changes to refresh when user returns
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        const token = localStorage.getItem('token');
        if (token) {
          refreshCount();
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, []);

  const value = {
    // State
    pendingCount,
    reminders,
    loading,
    error,
    lastUpdated,
    
    // Actions
    fetchPendingReminders,
    refreshCount,
    completeReminder,
    skipReminder,
    addReminders,
    deleteReminders,
    
    // Computed values
    todayReminders: getTodayReminders(),
    overdueReminders: getOverdueReminders(),
    
    // Utility
    isStale: lastUpdated && (Date.now() - lastUpdated.getTime()) > 10 * 60 * 1000, // 10 minutes
  };

  return (
    <ReminderContext.Provider value={value}>
      {children}
    </ReminderContext.Provider>
  );
};

export default ReminderContext;
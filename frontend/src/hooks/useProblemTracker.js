import { useState } from 'react';
import { problemTrackerApi } from '../api/problemTrackerApi';
import { toast } from 'react-hot-toast';

export const useProblemTracker = () => {
  const [problems, setProblems] = useState([]);
  const [reminders, setReminders] = useState([]);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [pagination, setPagination] = useState({
    current: 1,
    total: 1,
    count: 0,
    totalProblems: 0
  });

  // Load dashboard stats
  const loadStats = async () => {
    try {
      const response = await problemTrackerApi.getDashboardStats();
      setStats(response);
      return response;
    } catch (error) {
      console.error('Error loading stats:', error);
      throw error;
    }
  };

  // Load tracked problems
  const loadProblems = async (filters = {}, page = 1) => {
    try {
      const params = {
        ...filters,
        page,
        limit: 20
      };
      
      const response = await problemTrackerApi.getTrackedProblems(params);
      setProblems(response.problems || []);
      setPagination(response.pagination || {});
      return response;
    } catch (error) {
      console.error('Error loading problems:', error);
      throw error;
    }
  };

  // Load pending reminders
  const loadPendingReminders = async (limit = 10) => {
    try {
      const response = await problemTrackerApi.getPendingReminders({ limit });
      setReminders(response.reminders || []);
      return response;
    } catch (error) {
      console.error('Error loading reminders:', error);
      throw error;
    }
  };

  // Sync recent problems from LeetCode
  const syncRecentProblems = async () => {
    try {
      setSyncing(true);
      const response = await problemTrackerApi.syncRecentProblems();
      
      toast.success(`Synced ${response.synced} problems from LeetCode`);
      
      // Reload data after sync
      await Promise.all([
        loadStats(),
        loadProblems(),
        loadPendingReminders()
      ]);
      
      return response;
    } catch (error) {
      console.error('Error syncing problems:', error);
      
      // Handle rate limiting
      if (error.message?.includes('Please wait') && error.cooldownSeconds) {
        toast.error(`Rate limited: ${error.message}`);
      } else if (error.message?.includes('LeetCode username not configured')) {
        toast.error('Please add your LeetCode username in settings first');
      } else {
        toast.error('Failed to sync problems from LeetCode');
      }
      throw error;
    } finally {
      setSyncing(false);
    }
  };

  // Update a tracked problem
  const updateProblem = async (problemId, updates) => {
    try {
      const response = await problemTrackerApi.updateTrackedProblem(problemId, updates);
      
      // Update local state
      setProblems(prev => prev.map(p => 
        p.id === problemId ? { ...p, ...updates } : p
      ));
      
      toast.success('Problem updated successfully');
      
      // Refresh stats
      await loadStats();
      
      return response;
    } catch (error) {
      console.error('Error updating problem:', error);
      toast.error('Failed to update problem');
      throw error;
    }
  };

  // Delete a tracked problem
  const deleteProblem = async (problemId) => {
    try {
      await problemTrackerApi.deleteTrackedProblem(problemId);
      
      // Update local state
      setProblems(prev => prev.filter(p => p.id !== problemId));
      
      toast.success('Problem deleted successfully');
      
      // Refresh stats
      await loadStats();
    } catch (error) {
      console.error('Error deleting problem:', error);
      toast.error('Failed to delete problem');
      throw error;
    }
  };

  // Create reminders for a problem
  const createReminders = async (problemId, intervals = [1, 3, 7, 14, 30]) => {
    try {
      const response = await problemTrackerApi.createReminders(problemId, intervals);
      toast.success('Reminders created successfully!');
      
      // Refresh reminders and stats
      await Promise.all([
        loadPendingReminders(),
        loadStats()
      ]);
      
      return response;
    } catch (error) {
      console.error('Error creating reminders:', error);
      toast.error('Failed to create reminders');
      throw error;
    }
  };

  // Complete a reminder
  const completeReminder = async (reminderId) => {
    try {
      const response = await problemTrackerApi.completeReminder(reminderId);
      
      // Update local state
      setReminders(prev => prev.filter(r => r.id !== reminderId));
      
      toast.success('Reminder completed!');
      
      // Refresh stats
      await loadStats();
      
      return response;
    } catch (error) {
      console.error('Error completing reminder:', error);
      toast.error('Failed to complete reminder');
      throw error;
    }
  };

  // Skip a reminder
  const skipReminder = async (reminderId, snoozeHours = 24) => {
    try {
      const response = await problemTrackerApi.skipReminder(reminderId, snoozeHours);
      
      // Update local state
      setReminders(prev => prev.filter(r => r.id !== reminderId));
      
      toast.success(`Reminder snoozed for ${snoozeHours} hours`);
      
      return response;
    } catch (error) {
      console.error('Error skipping reminder:', error);
      toast.error('Failed to skip reminder');
      throw error;
    }
  };

  // Load all dashboard data
  const loadDashboardData = async () => {
    try {
      setLoading(true);
      await Promise.all([
        loadStats(),
        loadProblems(),
        loadPendingReminders()
      ]);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  return {
    // State
    problems,
    reminders,
    stats,
    loading,
    syncing,
    pagination,
    
    // Actions
    loadStats,
    loadProblems,
    loadPendingReminders,
    syncRecentProblems,
    updateProblem,
    deleteProblem,
    createReminders,
    completeReminder,
    skipReminder,
    loadDashboardData,
    
    // Setters for external updates
    setProblems,
    setReminders,
    setStats
  };
};
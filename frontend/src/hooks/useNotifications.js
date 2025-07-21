import { useState, useEffect, useCallback } from 'react';
import { useAuthContext } from '../context/AuthContext';
import ApiService from '../services/ApiService';
import toast from 'react-hot-toast';

const useNotifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const { authUser } = useAuthContext();

  // Fetch notifications using ApiService.get (no /api prefix)
  const fetchNotifications = useCallback(async (options = {}) => {
    if (!authUser) return;

    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        limit: options.limit || 50,
        skip: options.skip || 0,
        ...(options.roomId && { roomId: options.roomId }),
        ...(options.unreadOnly && { unreadOnly: 'true' })
      });

      const response = await ApiService.get(`/notifications?${params}`);
      const data = response.data;

      if (options.append) {
        setNotifications(prev => [...prev, ...data.data]);
      } else {
        setNotifications(data.data);
      }
      console.log('Fetched notifications:', data);
      return data;

    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to fetch notifications');
      console.error('Error fetching notifications:', err);
    } finally {
      setLoading(false);
    }
  }, [authUser]);

  // Fetch unread count using ApiService.get (no /api prefix)
  const fetchUnreadCount = useCallback(async (roomId = null) => {
    if (!authUser) return;

    try {
      const params = roomId ? `?roomId=${roomId}` : '';
      const response = await ApiService.get(`/notifications/unread-count${params}`);
      const count = response.data.data.unreadCount;
      setUnreadCount(count);
      return count;

    } catch (err) {
      console.error('Error fetching unread count:', err);
    }
  }, [authUser]);

  // Mark notification as read using ApiService.post (no /api prefix)
  const markAsRead = useCallback(async (notificationId) => {
    if (!authUser) return;

    try {
      await ApiService.post(`/notifications/${notificationId}/read`);

      // Update local state
      setNotifications(prev =>
        prev.map(notif =>
          notif._id === notificationId
            ? { ...notif, isRead: true }
            : notif
        )
      );

      // Update unread count
      setUnreadCount(prev => Math.max(0, prev - 1));
      
      // Trigger notification update event
      window.dispatchEvent(new Event("notification_update"));

      return true;

    } catch (err) {
      console.error('Error marking notification as read:', err);
      toast.error('Failed to mark notification as read');
      return false;
    }
  }, [authUser]);

  // Mark all notifications as read using ApiService.post (no /api prefix)
  const markAllAsRead = useCallback(async (roomId = null) => {
    if (!authUser) return;

    try {
      await ApiService.post('/notifications/mark-all-read', { roomId });

      // Update local state
      setNotifications(prev =>
        prev.map(notif => ({ ...notif, isRead: true }))
      );

      setUnreadCount(0);
      
      // Trigger notification update event
      window.dispatchEvent(new Event("notification_update"));
      return true;

    } catch (err) {
      console.error('Error marking all notifications as read:', err);
      toast.error('Failed to mark all notifications as read');
      return false;
    }
  }, [authUser]);

  // Initial data fetch
  useEffect(() => {
    if (authUser) {
      fetchNotifications();
      fetchUnreadCount();
    }
  }, [authUser, fetchNotifications, fetchUnreadCount]);

  return {
    notifications,
    unreadCount,
    loading,
    error,
    fetchNotifications,
    fetchUnreadCount,
    markAsRead,
    markAllAsRead,
    refetch: fetchNotifications
  };
};

export default useNotifications;

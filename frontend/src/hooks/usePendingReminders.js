import { useReminderContext } from '../context/ReminderContext';

const usePendingReminders = () => {
  const {
    pendingCount,
    loading,
    error,
    refreshCount,
    reminders,
    todayReminders,
    overdueReminders,
    isStale
  } = useReminderContext();

  return {
    pendingCount,
    loading,
    error,
    refreshCount,
    reminders,
    todayReminders,
    overdueReminders,
    isStale
  };
};

export default usePendingReminders;
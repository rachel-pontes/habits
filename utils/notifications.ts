import * as Notifications from 'expo-notifications';
import * as Permissions from 'expo-permissions';

// Ask for permissions and return whether granted
export async function requestNotificationPermission() {
  const { status } = await Notifications.requestPermissionsAsync();
  return status === 'granted';
}

// Schedule a daily notification at given hour and minute
export async function scheduleDailyReminder(hour: number, minute: number) {
  // Cancel any existing notifications with the same identifier
  await Notifications.cancelAllScheduledNotificationsAsync();

  const trigger = new Date();
  trigger.setHours(hour);
  trigger.setMinutes(minute);
  trigger.setSeconds(0);

  // If time already passed today, schedule for tomorrow
  if (trigger <= new Date()) {
    trigger.setDate(trigger.getDate() + 1);
  }

  await Notifications.scheduleNotificationAsync({
    content: {
      title: 'Habit Reminder',
      body: "Don't forget to input your habits for today! 🚀",
      sound: true,
      priority: Notifications.AndroidNotificationPriority.HIGH,
    },
    trigger: {
      hour,
      minute,
      repeats: true,
    },
  });
}

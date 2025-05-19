// app/_layout.tsx
import React, { useEffect } from 'react';
import { Stack } from 'expo-router';
import { requestNotificationPermission, scheduleDailyReminder } from '../utils/notifications';


export default function Layout() {
  useEffect(() => {
    async function setupNotifications() {
      const hasPermission = await requestNotificationPermission();
      if (hasPermission) {
        // Schedule the reminder for 9 PM (21:00)
        await scheduleDailyReminder(14, 48);
      }
    }
    setupNotifications();
  }, []);

  return (
      <Stack />
  );
}



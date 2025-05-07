// screens/RestoreArchivedScreen.tsx
import React, { useEffect, useState } from 'react';
import { useRouter, useLocalSearchParams } from 'expo-router';
import {
  View,
  Text,
  Switch,
  ActivityIndicator,
  Alert,
  Button
} from 'react-native';
import { toggleArchiveHabit } from '../services/editHabit';
import { getArchivedHabits } from '../services/habits';
import { startOfWeek } from 'date-fns';

const RestoreArchivedScreen: React.FC = () => {
  const router = useRouter();
  const { weekStart } = useLocalSearchParams();
  const userId = 'wLOSk2y7kPMpQxVWCbZ2';
  const viewWeekStart = new Date(weekStart as string);
  const [habits, setHabits] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadArchived = async () => {
      const archived = await getArchivedHabits(userId);
      setHabits(archived);
      setLoading(false);
    };

    loadArchived();
  }, []);

  const handleToggle = async (habit: any) => {
    try {
      const newRanges = await toggleArchiveHabit(
        userId,
        habit.id,
        true,
        habit.archiveRanges,
        viewWeekStart
      );

      const updatedHabits = habits.map(h =>
        h.id === habit.id ? { ...h, archiveRanges: newRanges } : h
      );

      setHabits(updatedHabits.filter(h => (h.archiveRanges || []).some((r: any) => !r.end)));
    } catch (err) {
      Alert.alert('Error', 'Failed to unarchive habit');
    }
  };

  if (loading) {
    return <ActivityIndicator style={{ marginTop: 50 }} />;
  }

  return (
    <View style={{ padding: 20 }}>
      <Text style={{ fontWeight: 'bold', marginBottom: 10 }}>Archived Habits</Text>
      {habits.length === 0 ? (
        <Text>No archived habits</Text>
      ) : (
        habits.map(habit => (
          <View
            key={habit.id}
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginVertical: 8
            }}
          >
            <Text>{habit.habitName}</Text>
            <Switch
              value={false}
              onValueChange={() => handleToggle(habit)}
            />
          </View>
        ))
      )}
      <Button title="Done" onPress={() => router.back()} />
    </View>
  );
};

export default RestoreArchivedScreen;

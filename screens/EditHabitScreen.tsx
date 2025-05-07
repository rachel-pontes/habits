// screens/EditHabitScreen.tsx
import React, { useEffect, useState } from 'react';
import { View, TextInput, Button, Alert, Switch, Text } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { getHabit, saveHabit, deleteHabit, toggleArchiveHabit } from '../services/editHabit';
import { startOfWeek } from 'date-fns';

const EditHabitScreen: React.FC = () => {
  const router = useRouter();
  const { habitId, weekStart } = useLocalSearchParams();
  const userId = 'wLOSk2y7kPMpQxVWCbZ2';

  const [name, setName] = useState('');
  const [frequency, setFrequency] = useState('');
  const [isArchived, setIsArchived] = useState(false);
  const [archiveRanges, setArchiveRanges] = useState<any[]>([]);
  const viewWeekStart = new Date(weekStart as string);

  useEffect(() => {
    const loadHabit = async () => {
      const habit = await getHabit(userId, habitId as string);
      if (habit) {
        setName(habit.habitName || '');
        setFrequency((habit.frequency || '').toString());
        const ranges = habit.archiveRanges || [];
        setArchiveRanges(ranges);
        setIsArchived(ranges.some((r: any) => !r.end));
      }
    };
    loadHabit();
  }, [habitId]);

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert('Validation Error', 'Habit name cannot be empty.');
      return;
    }
  
    const freqNum = parseInt(frequency);
    if (!frequency || isNaN(freqNum) || freqNum <= 0) {
      Alert.alert('Validation Error', 'Frequency must be a number greater than 0.');
      return;
    }
    await saveHabit(userId, habitId as string, {
      habitName: name,
      frequency: frequency
    });
    Alert.alert('Updated!');
    router.back();
  };

  const handleDelete = async () => {
    await deleteHabit(userId, habitId as string);
    Alert.alert('Deleted!');
    router.replace('/');
  };

  const handleToggleArchive = async () => {
    const newRanges = await toggleArchiveHabit(
      userId,
      habitId as string,
      isArchived,
      archiveRanges,
      viewWeekStart
    );
    setArchiveRanges(newRanges);
    setIsArchived(!isArchived);
  };

  return (
    <View style={{ padding: 20 }}>
      <TextInput
        placeholder="Habit name"
        value={name}
        onChangeText={setName}
        style={{ borderBottomWidth: 1, marginBottom: 10 }}
      />
      <TextInput
        placeholder="Frequency"
        value={frequency}
        keyboardType="numeric"
        onChangeText={setFrequency}
        style={{ borderBottomWidth: 1, marginBottom: 10 }}
      />
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10 }}>
        <Switch value={isArchived} onValueChange={handleToggleArchive} />
        <Text style={{ marginLeft: 10 }}>{isArchived ? 'Unarchive' : 'Archive'} Habit</Text>
      </View>
      <Button title="Save Changes" onPress={handleSave} />
      <View style={{ marginTop: 10 }}>
        <Button title="Delete Habit" color="red" onPress={handleDelete} />
      </View>
    </View>
  );
};

export default EditHabitScreen;
